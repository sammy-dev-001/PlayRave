import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ReactionOverlay } from './ReactionSystem';
import { StreakBadge, StreakMilestonePopup, useWinStreak } from './WinStreakSystem';
import { Soundboard, SoundNotification, useSoundboard } from './Soundboard';
import { AchievementPopup, useAchievements } from './AchievementSystem';

/**
 * GameOverlay - Unified wrapper component that adds all party features to any game screen
 * 
 * Usage:
 * <GameOverlay roomId={room.id} playerName={playerName} drinkingModeEnabled={false}>
 *   {your game content}
 * </GameOverlay>
 */
const GameOverlay = ({
    children,
    roomId,
    playerName,
    showSoundboard = true,
    showReactions = true,
}) => {
    // Initialize all hooks
    const { streaks, milestonePopup, clearMilestone, reportWin } = useWinStreak(roomId);
    const { notification: soundNotification, clearNotification: clearSound } = useSoundboard();
    const { popup: achievementPopup, clearPopup: clearAchievement, unlockAchievement } = useAchievements(roomId);

    return (
        <View style={styles.container}>
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
    triggerDrink: () => { },
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
    drinkCounterPosition: {
        position: 'absolute',
        top: 60,
        left: 15,
        zIndex: 998,
    },
});

export default GameOverlay;
