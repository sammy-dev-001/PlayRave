import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated, Dimensions,
    Platform, Alert
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';
import { mergeGameState, isDelta } from '../utils/deltaSync';

const { width, height } = Dimensions.get('window');

const NeonTapGameScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, hostParticipates, isHost, playerName } = route.params;

    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [gameState, setGameState] = useState('waiting'); // waiting, countdown, playing, tapped
    const [countdown, setCountdown] = useState(3);
    const [circlePosition, setCirclePosition] = useState(null);
    const [roundStartTime, setRoundStartTime] = useState(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(10);

    // Refs that mirror state — assigned directly in render body (not useEffect)
    // so they are always current by the time any event handler runs.
    // useEffect fires after paint; direct assignment is synchronous.
    const currentRoundRef = useRef(0);
    const totalRoundsRef  = useRef(10);
    const gameStateRef    = useRef('waiting');

    // Synchronous ref-sync — no useEffect needed
    currentRoundRef.current = currentRound;
    totalRoundsRef.current  = totalRounds;
    gameStateRef.current    = gameState;

    const pulseAnim = useRef(new Animated.Value(1)).current;
    // FIX 8: Store the pulse loop ref so we can stop it cleanly
    const pulseLoopRef = useRef(null);
    // FIX 2: Store the countdown interval ref so it can be cleared on unmount
    const countdownRef = useRef(null);

    const canTap = !isHost || hostParticipates;

    // Wrapped in useCallback so they have stable references across renders.
    // This makes them safe to list as deps in useEffect without causing
    // infinite re-runs, and eliminates the fragile pattern where a future
    // state close-over would silently produce stale values.
    const startPulseAnimation = React.useCallback(() => {
        if (pulseLoopRef.current) pulseLoopRef.current.stop();
        pulseAnim.setValue(1);
        pulseLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' })
            ])
        );
        pulseLoopRef.current.start();
    }, []); // Only refs — no state deps

    const stopPulseAnimation = React.useCallback(() => {
        if (pulseLoopRef.current) {
            pulseLoopRef.current.stop();
            pulseLoopRef.current = null;
        }
        pulseAnim.stopAnimation();
    }, []); // Only refs — no state deps

    // Cleanup on unmount — stopPulseAnimation is now stable via useCallback
    // so listing it in deps is safe and correct.
    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            stopPulseAnimation();
        };
    }, [stopPulseAnimation]);

    useEffect(() => {
        const onRoundStarted = ({ circlePosition: pos, roundStartTime: startTime, currentRound: round, totalRounds: total }) => {
            // Clear any previous countdown
            if (countdownRef.current) clearInterval(countdownRef.current);
            stopPulseAnimation();

            setCirclePosition(pos);
            setRoundStartTime(startTime);
            setCurrentRound(round);
            setTotalRounds(total);
            setGameState('countdown');
            setCountdown(3);

            // FIX 2: Store interval in ref so it can be cleaned up
            let count = 3;
            countdownRef.current = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    setGameState('playing');
                    startPulseAnimation();
                }
            }, 1000);
        };

        const onResults = (results) => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            stopPulseAnimation();
            navigation.replace('NeonTapResults', { room, results, hostParticipates, isHost });
        };

        const onReadyForNext = () => {
            setGameState('waiting');
            setCirclePosition(null);
            stopPulseAnimation();
            if (isHost) {
                setTimeout(() => {
                    SocketService.emit('start-neon-tap-round', { roomId: room.id });
                }, 500);
            }
        };

        const onGameFinished = ({ finalScores }) => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            stopPulseAnimation();
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        const onGameStateSync = (data) => {
            // Use refs (not state) as the merge baseline to avoid stale closure bugs.
            // State values captured in a useEffect closure are frozen at mount time;
            // refs always reflect the latest value.
            const liveState = {
                currentRound: currentRoundRef.current,
                totalRounds:  totalRoundsRef.current,
                status:       gameStateRef.current,
            };

            const incoming = isDelta(data)
                ? mergeGameState(liveState, data)
                : (data.gameState || data);

            if (incoming.currentRound !== undefined) setCurrentRound(incoming.currentRound);
            if (incoming.totalRounds  !== undefined) setTotalRounds(incoming.totalRounds);
        };

        SocketService.on('neon-tap-round-started', onRoundStarted);
        SocketService.on('neon-tap-results', onResults);
        SocketService.on('neon-tap-ready-for-next', onReadyForNext);
        SocketService.on('game-finished', onGameFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch state on mount
        SocketService.emit('get-state', { roomId: room.id });

        // Start first round if host — read from refs to avoid stale closure.
        // This effect has deps [navigation, room.id, isHost], so it only re-runs
        // if those change. Without refs, currentRound/gameState would always be
        // their initial values (0 / 'waiting') and re-trigger the start on re-run.
        if (isHost && currentRoundRef.current === 0 && gameStateRef.current === 'waiting') {
            setTimeout(() => {
                SocketService.emit('start-neon-tap-round', { roomId: room.id });
            }, 1000);
        }

        return () => {
            SocketService.off('neon-tap-round-started', onRoundStarted);
            SocketService.off('neon-tap-results', onResults);
            SocketService.off('neon-tap-ready-for-next', onReadyForNext);
            SocketService.off('game-finished', onGameFinished);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id, isHost, startPulseAnimation, stopPulseAnimation]);

    // FIX 3: Host end-game confirmation
    const handleEndGame = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to end the game for everyone?')) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                stopPulseAnimation();
                SocketService.emit('neon-tap-end-game', { roomId: room.id });
                navigation.navigate('Lobby', { room, isHost, playerName });
            }
            return;
        }

        Alert.alert(
            'End Game',
            'Are you sure you want to end the game for everyone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Game',
                    style: 'destructive',
                    onPress: () => {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        stopPulseAnimation();
                        SocketService.emit('neon-tap-end-game', { roomId: room.id });
                        navigation.navigate('Lobby', { room, isHost, playerName });
                    }
                }
            ]
        );
    };

    const handleTap = () => {
        if (gameState !== 'playing' || !canTap) return;
        const tapTime = Date.now();
        const reactionTime = tapTime - roundStartTime;
        setGameState('tapped');
        stopPulseAnimation(); // FIX 8: properly stop via ref
        SocketService.emit('submit-neon-tap', { roomId: room.id, reactionTime });

        if (isHost) {
            setTimeout(() => {
                SocketService.emit('show-neon-tap-results', { roomId: room.id });
            }, 2000);
        }
    };

    const renderCircle = () => {
        if (!circlePosition || gameState !== 'playing') return null;
        const circleSize = 100;
        const left = (width - circleSize) * circlePosition.x;
        const top = (height - circleSize) * circlePosition.y;

        return (
            <Animated.View style={[styles.circle, { left, top, width: circleSize, height: circleSize, transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity style={styles.circleTouchable} onPress={handleTap} activeOpacity={0.8} />
            </Animated.View>
        );
    };

    return (
        <NeonContainer
            showBackButton
            onBackPress={() => {
                // FIX 3: Host must confirm end-game; non-host just leaves
                if (isHost) {
                    handleEndGame();
                } else {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    stopPulseAnimation();
                    navigation.navigate('Lobby', { room, isHost, playerName });
                }
            }}
        >
            {/* FIX 3: Host controls */}
            {isHost && (
                <View style={styles.hostControls}>
                    <NeonButton
                        title="END GAME"
                        onPress={handleEndGame}
                        variant="secondary"
                        size="small"
                        color={COLORS.hotPink}
                    />
                </View>
            )}

            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    ROUND {currentRound + 1} / {totalRounds}
                </NeonText>
            </View>

            <View style={styles.gameArea}>
                {gameState === 'waiting' && <NeonText size={24} weight="bold" style={styles.centerText}>GET READY...</NeonText>}
                {gameState === 'countdown' && <NeonText size={72} weight="bold" color={COLORS.limeGlow} style={styles.centerText}>{countdown}</NeonText>}
                {gameState === 'playing' && renderCircle()}
                {gameState === 'tapped' && <NeonText size={32} weight="bold" color={COLORS.limeGlow} style={styles.centerText}>TAPPED! ⚡</NeonText>}
                {!canTap && gameState === 'playing' && <NeonText style={styles.spectatorText}>(Spectating)</NeonText>}
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    hostControls: {
        position: 'absolute',
        top: 10,
        right: 60,
        zIndex: 100,
    },
    header: { alignItems: 'center', marginBottom: 20 },
    gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerText: { textAlign: 'center' },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: COLORS.limeGlow,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 10
    },
    circleTouchable: { width: '100%', height: '100%', borderRadius: 1000 },
    spectatorText: {
        position: 'absolute',
        bottom: 50,
        textAlign: 'center',
        fontStyle: 'italic',
        color: COLORS.textMuted,
        fontSize: 14
    }
});

export default NeonTapGameScreen;
