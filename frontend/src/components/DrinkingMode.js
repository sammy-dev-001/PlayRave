import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Drink notification popup
const DrinkNotification = ({ visible, playerName, reason, drinks, onComplete }) => {
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();

            // Shake animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
                { iterations: 3 }
            ).start();

            // Auto dismiss
            setTimeout(() => {
                Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true })
                    .start(() => onComplete?.());
            }, 3000);
        }
    }, [visible]);

    if (!visible) return null;

    const drinkEmojis = '🍺'.repeat(Math.min(drinks, 5));

    return (
        <Animated.View style={[
            styles.drinkNotification,
            { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }
        ]}>
            <NeonText size={30}>{drinkEmojis}</NeonText>
            <View style={styles.drinkText}>
                <NeonText size={16} weight="bold" color="#fff">
                    {playerName} - DRINK!
                </NeonText>
                <NeonText size={12} color="#ccc">{reason}</NeonText>
            </View>
        </Animated.View>
    );
};

// Player drink counter
const DrinkCounter = ({ count = 0 }) => {
    return (
        <View style={styles.counter}>
            <NeonText size={20}>🍺</NeonText>
            <NeonText size={14} weight="bold" color={COLORS.hotPink}>{count}</NeonText>
        </View>
    );
};

// Drinking mode toggle in settings
const DrinkingModeToggle = ({ enabled, onToggle, safeMode, onToggleSafe }) => {
    return (
        <View style={styles.toggleContainer}>
            <TouchableOpacity
                style={[styles.toggle, enabled && styles.toggleActive]}
                onPress={onToggle}
            >
                <NeonText size={24}>{enabled ? '🍻' : '🚫'}</NeonText>
                <NeonText size={12} color={enabled ? COLORS.limeGlow : '#888'}>
                    {enabled ? 'Party Mode ON' : 'Party Mode OFF'}
                </NeonText>
            </TouchableOpacity>

            {enabled && (
                <TouchableOpacity
                    style={[styles.safeToggle, safeMode && styles.safeActive]}
                    onPress={onToggleSafe}
                >
                    <NeonText size={10} color={safeMode ? COLORS.neonCyan : '#888'}>
                        {safeMode ? '☕ Safe Mode' : '🍺 Drinks'}
                    </NeonText>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Drink rules engine
const DRINK_RULES = {
    lost_round: { drinks: 1, reason: 'Lost the round' },
    last_place: { drinks: 2, reason: 'Came in last place' },
    streak_broken: { drinks: 1, reason: 'Streak was broken' },
    wrong_answer: { drinks: 1, reason: 'Wrong answer' },
    slow_answer: { drinks: 1, reason: 'Slowest to answer' },
    caught_lying: { drinks: 2, reason: 'Caught lying!' },
    imposter_caught: { drinks: 2, reason: 'Imposter was caught' },
    imposter_won: { drinks: 1, reason: 'Imposter won - everyone drinks!' },
};

// Hook to manage drinking mode
const useDrinkingMode = (roomId, playerName) => {
    const [enabled, setEnabled] = useState(false);
    const [safeMode, setSafeMode] = useState(false);
    const [drinkCount, setDrinkCount] = useState(0);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const handleDrink = ({ playerId, playerName: drinkerName, reason, drinks }) => {
            setNotification({ playerName: drinkerName, reason, drinks });

            // Update count if it's us
            if (playerId === SocketService.socket?.id) {
                setDrinkCount(prev => prev + drinks);
            }
        };

        SocketService.on('drink-triggered', handleDrink);
        return () => SocketService.off('drink-triggered', handleDrink);
    }, []);

    const triggerDrink = (playerId, targetPlayerName, ruleId) => {
        if (!enabled) return;

        const rule = DRINK_RULES[ruleId];
        if (!rule) return;

        SocketService.emit('trigger-drink', {
            roomId,
            playerId,
            playerName: targetPlayerName,
            reason: safeMode ? rule.reason + ' (take a sip of water!)' : rule.reason,
            drinks: rule.drinks
        });
    };

    return {
        enabled,
        setEnabled,
        safeMode,
        setSafeMode,
        drinkCount,
        notification,
        clearNotification: () => setNotification(null),
        triggerDrink,
    };
};

const styles = StyleSheet.create({
    drinkNotification: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 107, 157, 0.95)',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        zIndex: 1001,
        borderWidth: 2,
        borderColor: '#fff',
    },
    drinkText: {
        flex: 1,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    toggleContainer: {
        alignItems: 'center',
        gap: 10,
    },
    toggle: {
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: '#555',
        alignItems: 'center',
    },
    toggleActive: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 107, 157, 0.2)',
    },
    safeToggle: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    safeActive: {
        backgroundColor: 'rgba(0, 240, 255, 0.2)',
    },
});

export { DrinkNotification, DrinkCounter, DrinkingModeToggle, useDrinkingMode, DRINK_RULES };
export default DrinkNotification;
