import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { ReactionOverlay } from './ReactionSystem';
import { StreakBadge, StreakMilestonePopup, useWinStreak } from './WinStreakSystem';
import { Soundboard, SoundNotification, useSoundboard } from './Soundboard';
import { AchievementPopup, useAchievements } from './AchievementSystem';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Player Left Notification Component
const PlayerLeftNotification = ({ playerName, visible, onComplete }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();

            // Auto-hide after 3 seconds
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
                    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true })
                ]).start(() => onComplete?.());
            }, 3000);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[
            styles.playerLeftBanner,
            { transform: [{ translateY: slideAnim }], opacity: opacityAnim }
        ]}>
            <Text style={styles.playerLeftText}>
                👋 {playerName} left the game
            </Text>
        </Animated.View>
    );
};

/**
 * GameOverlay - Unified wrapper component that adds all party features to any game screen
 */
const GameOverlay = ({
    children,
    roomId,
    playerName,
    navigation,
    showSoundboard = true,
    showReactions = true,
}) => {
    const [playerLeft, setPlayerLeft] = useState(null);
    const [isConnected, setIsConnected] = useState(true);

    // Initialize all hooks
    const { streaks, milestonePopup, clearMilestone, reportWin } = useWinStreak(roomId);
    const { notification: soundNotification, clearNotification: clearSound } = useSoundboard();
    const { popup: achievementPopup, clearPopup: clearAchievement, unlockAchievement } = useAchievements(roomId);

    useEffect(() => {
        // Listen for player-left events
        const handlePlayerLeft = ({ playerName: leftPlayer, remainingPlayers }) => {
            setPlayerLeft(leftPlayer);
        };

        // Listen for game ended due to insufficient players
        const handleGameEnded = ({ message, finalScores }) => {
            console.log('Game ended:', message);
            // Navigate back to lobby or show results
            if (navigation) {
                navigation.navigate('Lobby', {
                    gameEndedMessage: message,
                    finalScores
                });
            }
        };

        // Connection status
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        SocketService.on('player-left', handlePlayerLeft);
        SocketService.on('game-ended-insufficient-players', handleGameEnded);
        SocketService.on('connect', handleConnect);
        SocketService.on('disconnect', handleDisconnect);

        return () => {
            SocketService.off('player-left', handlePlayerLeft);
            SocketService.off('game-ended-insufficient-players', handleGameEnded);
            SocketService.off('connect', handleConnect);
            SocketService.off('disconnect', handleDisconnect);
        };
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Connection status indicator */}
            {!isConnected && (
                <View style={styles.connectionBanner}>
                    <Text style={styles.connectionText}>⚠️ Reconnecting...</Text>
                </View>
            )}

            {/* Player left notification */}
            <PlayerLeftNotification
                playerName={playerLeft}
                visible={!!playerLeft}
                onComplete={() => setPlayerLeft(null)}
            />

            {/* Main game content wrapped with reactions */}
            <ReactionOverlay roomId={roomId} playerName={playerName}>
                <View style={styles.gameContent}>
                    {children}
                </View>
            </ReactionOverlay>

            {/* Soundboard toggle */}
            {showSoundboard && (
                <Soundboard
                    roomId={roomId}
                    playerName={playerName}
                />
            )}

            {/* Sound notification */}
            <SoundNotification
                soundId={soundNotification?.soundId}
                playerName={soundNotification?.playerName}
                visible={!!soundNotification}
                onComplete={clearSound}
            />

            {/* Win streak milestone popup */}
            <StreakMilestonePopup
                streak={milestonePopup?.streak}
                playerName={milestonePopup?.playerName}
                visible={!!milestonePopup}
                onComplete={clearMilestone}
            />

            {/* Achievement popup */}
            <AchievementPopup
                achievement={achievementPopup}
                visible={!!achievementPopup}
                onComplete={clearAchievement}
            />
        </View>
    );
};

// Context to pass overlay functions to children
export const GameOverlayContext = React.createContext({
    reportWin: () => { },
    unlockAchievement: () => { },
    streaks: {},
});

// Higher-order component version
export const withGameOverlay = (WrappedComponent) => {
    return (props) => {
        const { room, playerName } = props.route?.params || {};

        return (
            <GameOverlay
                roomId={room?.id}
                playerName={playerName}
                navigation={props.navigation}
            >
                <WrappedComponent {...props} />
            </GameOverlay>
        );
    };
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gameContent: {
        flex: 1,
    },
    playerLeftBanner: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 87, 170, 0.9)',
        borderRadius: 10,
        padding: 12,
        zIndex: 1000,
        alignItems: 'center',
    },
    playerLeftText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    connectionBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.hotPink,
        padding: 8,
        zIndex: 1001,
        alignItems: 'center',
    },
    connectionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default GameOverlay;

