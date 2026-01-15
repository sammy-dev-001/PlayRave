import React, { useState, useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

/**
 * TurnTimer - Visual countdown timer for turn-based games
 * 
 * Props:
 * - duration: seconds for the timer (0 = disabled/unlimited)
 * - isActive: whether timer should be counting down
 * - onTimeUp: callback when timer reaches 0
 * - size: 'small' | 'medium' | 'large'
 * - showLabel: show "Time" label
 */
const TurnTimer = memo(({
    duration = 60,
    isActive = true,
    onTimeUp,
    size = 'medium',
    showLabel = true,
    style
}) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef(null);

    // Size configurations
    const sizes = {
        small: { container: 50, text: 14, stroke: 3 },
        medium: { container: 70, text: 20, stroke: 4 },
        large: { container: 100, text: 28, stroke: 5 },
    };
    const sizeConfig = sizes[size] || sizes.medium;

    // Reset timer when duration changes
    useEffect(() => {
        setTimeLeft(duration);
        progressAnim.setValue(1);
    }, [duration]);

    // Countdown logic
    useEffect(() => {
        if (!isActive || duration === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    onTimeUp?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, duration, onTimeUp]);

    // Progress animation
    useEffect(() => {
        if (duration > 0) {
            Animated.timing(progressAnim, {
                toValue: timeLeft / duration,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [timeLeft, duration]);

    // Pulse effect when low time
    useEffect(() => {
        if (timeLeft <= 10 && timeLeft > 0 && isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [timeLeft <= 10, isActive]);

    // If no timer or unlimited, return null or minimal display
    if (duration === 0) {
        return null;
    }

    // Color based on time remaining
    const getColor = () => {
        const percent = timeLeft / duration;
        if (percent <= 0.2) return COLORS.hotPink;
        if (percent <= 0.5) return '#FFA500'; // Orange
        return COLORS.neonCyan;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${secs}`;
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ scale: pulseAnim }] },
            style
        ]}>
            <View style={[
                styles.timerCircle,
                {
                    width: sizeConfig.container,
                    height: sizeConfig.container,
                    borderWidth: sizeConfig.stroke,
                    borderColor: getColor(),
                }
            ]}>
                <NeonText
                    size={sizeConfig.text}
                    weight="bold"
                    color={getColor()}
                >
                    {formatTime(timeLeft)}
                </NeonText>
            </View>
            {showLabel && (
                <NeonText size={10} color="#888" style={styles.label}>
                    {timeLeft <= 10 ? '⚠️' : '⏱️'}
                </NeonText>
            )}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    timerCircle: {
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    label: {
        marginTop: 4,
    },
});

// Reset method for external control
TurnTimer.reset = () => {
    // This is handled by changing the key or duration prop
};

export default TurnTimer;
