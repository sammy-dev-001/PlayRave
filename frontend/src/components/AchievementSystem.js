import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Achievement definitions
const ACHIEVEMENTS = {
    // Game achievements
    first_win: { emoji: '🏆', name: 'First Victory', description: 'Win your first game' },
    streak_3: { emoji: '🔥', name: 'On Fire', description: 'Get a 3 win streak' },
    streak_5: { emoji: '💥', name: 'Unstoppable', description: 'Get a 5 win streak' },
    streak_10: { emoji: '👑', name: 'Streak Master', description: 'Get a 10 win streak' },
    robot_slayer: { emoji: '🤖', name: 'Robot Slayer', description: 'Beat AI 5 times' },
    perfect_round: { emoji: '🎯', name: 'Perfect Round', description: 'Get all answers right' },
    speed_demon: { emoji: '⚡', name: 'Speed Demon', description: 'Answer in under 1 second' },

    // Social achievements
    party_starter: { emoji: '🎊', name: 'Party Starter', description: 'Host 5 games' },
    social_butterfly: { emoji: '🦋', name: 'Social Butterfly', description: 'Play with 20 different people' },
    night_owl: { emoji: '🌙', name: 'Night Owl', description: 'Play after midnight' },
    early_bird: { emoji: '🐦', name: 'Early Bird', description: 'Play before 7am' },

    // Special achievements
    comeback_kid: { emoji: '💪', name: 'Comeback Kid', description: 'Win after being last place' },
    tournament_champ: { emoji: '🏅', name: 'Tournament Champion', description: 'Win a multi-game tournament' },
    variety_master: { emoji: '🎮', name: 'Variety Master', description: 'Play 10 different game types' },
    marathon: { emoji: '🏃', name: 'Marathon', description: 'Play for 2 hours straight' },
};

// Achievement popup component
const AchievementPopup = ({ achievement, visible, onComplete }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && achievement) {
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
                ]),
                Animated.delay(3000),
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
                ]),
            ]).start(() => {
                scaleAnim.setValue(0);
                onComplete?.();
            });
        }
    }, [visible, achievement]);

    if (!visible || !achievement) return null;

    const achievementData = ACHIEVEMENTS[achievement.achievementId];
    if (!achievementData) return null;

    return (
        <Animated.View style={[
            styles.popup,
            {
                transform: [{ scale: scaleAnim }],
                shadowOpacity: glowAnim,
            }
        ]}>
            <View style={styles.popupHeader}>
                <NeonText size={14} color={COLORS.limeGlow}>🎉 ACHIEVEMENT UNLOCKED!</NeonText>
            </View>
            <View style={styles.popupContent}>
                <NeonText size={50}>{achievementData.emoji}</NeonText>
                <NeonText size={22} weight="bold" glow color={COLORS.neonCyan}>
                    {achievementData.name}
                </NeonText>
                <NeonText size={14} color="#888">
                    {achievementData.description}
                </NeonText>
            </View>
        </Animated.View>
    );
};

// Badge display for profile
const AchievementBadge = ({ achievementId, size = 'medium' }) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    const sizes = {
        small: { container: 30, emoji: 16 },
        medium: { container: 45, emoji: 24 },
        large: { container: 60, emoji: 32 },
    };

    const s = sizes[size];

    return (
        <View style={[styles.badge, { width: s.container, height: s.container }]}>
            <NeonText size={s.emoji}>{achievement.emoji}</NeonText>
        </View>
    );
};

// Achievement grid for profile
const AchievementGrid = ({ unlockedAchievements = [] }) => {
    return (
        <View style={styles.grid}>
            <NeonText size={16} weight="bold" style={styles.gridTitle}>
                🏆 Achievements ({unlockedAchievements.length}/{Object.keys(ACHIEVEMENTS).length})
            </NeonText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gridRow}>
                    {Object.entries(ACHIEVEMENTS).map(([id, achievement]) => {
                        const isUnlocked = unlockedAchievements.includes(id);
                        return (
                            <TouchableOpacity
                                key={id}
                                style={[styles.gridItem, !isUnlocked && styles.locked]}
                            >
                                <NeonText size={28}>{isUnlocked ? achievement.emoji : '🔒'}</NeonText>
                                <NeonText size={9} color={isUnlocked ? '#fff' : '#555'} numberOfLines={1}>
                                    {achievement.name}
                                </NeonText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

// Hook to manage achievements
const useAchievements = (roomId) => {
    const [popup, setPopup] = useState(null);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);

    useEffect(() => {
        const handleUnlock = (data) => {
            setPopup(data);
            setUnlockedAchievements(prev =>
                prev.includes(data.achievementId) ? prev : [...prev, data.achievementId]
            );
        };

        SocketService.on('achievement-unlocked', handleUnlock);
        return () => SocketService.off('achievement-unlocked', handleUnlock);
    }, []);

    const unlockAchievement = (achievementId) => {
        if (unlockedAchievements.includes(achievementId)) return;

        SocketService.emit('unlock-achievement', {
            roomId,
            playerId: SocketService.socket?.id,
            achievementId,
            achievementName: ACHIEVEMENTS[achievementId]?.name
        });
    };

    return {
        popup,
        clearPopup: () => setPopup(null),
        unlockedAchievements,
        unlockAchievement,
    };
};

const styles = StyleSheet.create({
    popup: {
        position: 'absolute',
        top: '25%',
        left: 30,
        right: 30,
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.limeGlow,
        overflow: 'hidden',
        zIndex: 1002,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
    },
    popupHeader: {
        backgroundColor: 'rgba(198, 255, 74, 0.2)',
        padding: 10,
        alignItems: 'center',
    },
    popupContent: {
        padding: 25,
        alignItems: 'center',
        gap: 10,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    grid: {
        marginTop: 20,
    },
    gridTitle: {
        marginBottom: 15,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 10,
    },
    gridItem: {
        width: 70,
        height: 70,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    locked: {
        opacity: 0.4,
    },
});

export { AchievementPopup, AchievementBadge, AchievementGrid, useAchievements, ACHIEVEMENTS };
export default AchievementPopup;
