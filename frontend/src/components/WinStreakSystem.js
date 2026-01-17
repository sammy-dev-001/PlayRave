import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Win streak badge that shows next to player names
const StreakBadge = ({ streak, size = 'small' }) => {
    if (!streak || streak < 2) return null;

    const fireEmojis = streak >= 10 ? '🔥🔥🔥' : streak >= 5 ? '🔥🔥' : '🔥';
    const isSmall = size === 'small';

    return (
        <View style={[styles.badge, isSmall && styles.smallBadge]}>
            <NeonText size={isSmall ? 10 : 14} color={COLORS.hotPink} glow>
                {fireEmojis} {streak}
            </NeonText>
        </View>
    );
};

// Streak milestone popup animation
const StreakMilestonePopup = ({ streak, playerName, visible, onComplete }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
                    Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                ]),
                Animated.delay(2000),
                Animated.timing(opacityAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start(() => {
                scaleAnim.setValue(0);
                onComplete?.();
            });
        }
    }, [visible]);

    if (!visible) return null;

    const getMessage = () => {
        if (streak >= 10) return '🏆 UNSTOPPABLE! 🏆';
        if (streak >= 5) return '🔥 ON FIRE! 🔥';
        return '✨ WINNING STREAK! ✨';
    };

    return (
        <Animated.View style={[
            styles.milestonePopup,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
        ]}>
            <NeonText size={28} weight="bold" glow color={COLORS.hotPink}>
                {getMessage()}
            </NeonText>
            <NeonText size={20} color="#fff">
                {playerName} has {streak} wins in a row!
            </NeonText>
        </Animated.View>
    );
};

// Streak breaker notification
const StreakBreakerPopup = ({ breakerName, oldStreak, visible, onComplete }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
                Animated.delay(2000),
                Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
            ]).start(() => onComplete?.());
        }
    }, [visible]);

    if (!visible || oldStreak < 3) return null;

    return (
        <Animated.View style={[styles.breakerPopup, { transform: [{ translateY: slideAnim }] }]}>
            <NeonText size={14} color="#fff">
                💥 {breakerName} broke a {oldStreak} win streak!
            </NeonText>
        </Animated.View>
    );
};

// Hook to manage streaks
const useWinStreak = (roomId) => {
    const [streaks, setStreaks] = useState({});
    const [milestonePopup, setMilestonePopup] = useState(null);
    const [breakerPopup, setBreakerPopup] = useState(null);

    useEffect(() => {
        const handleStreakUpdate = ({ winnerId, winnerName, streak, isStreakMilestone }) => {
            setStreaks(prev => ({ ...prev, [winnerId]: streak }));

            if (isStreakMilestone) {
                setMilestonePopup({ streak, playerName: winnerName });
            }
        };

        SocketService.on('streak-updated', handleStreakUpdate);
        return () => SocketService.off('streak-updated', handleStreakUpdate);
    }, []);

    const reportWin = (winnerId, winnerName) => {
        SocketService.emit('report-game-result', { roomId, winnerId, winnerName });
    };

    return {
        streaks,
        reportWin,
        milestonePopup,
        clearMilestone: () => setMilestonePopup(null),
        breakerPopup,
        clearBreaker: () => setBreakerPopup(null),
    };
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: 'rgba(255, 107, 157, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
        marginLeft: 8,
    },
    smallBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    milestonePopup: {
        position: 'absolute',
        top: '30%',
        left: 20,
        right: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.hotPink,
        padding: 25,
        zIndex: 1001,
    },
    breakerPopup: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 107, 157, 0.9)',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        zIndex: 1000,
    },
});

export { StreakBadge, StreakMilestonePopup, StreakBreakerPopup, useWinStreak };
export default StreakBadge;
