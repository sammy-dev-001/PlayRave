import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

const RaveLights = ({ trigger, duration = 2000, intensity = 'medium' }) => {
    const flashAnim = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    const intensityConfig = {
        low: { flashes: 3, speed: 300 },
        medium: { flashes: 5, speed: 200 },
        high: { flashes: 8, speed: 150 }
    };

    const config = intensityConfig[intensity] || intensityConfig.medium;

    useEffect(() => {
        if (trigger) {
            // Create flash sequence
            const flashSequence = [];
            for (let i = 0; i < config.flashes; i++) {
                flashSequence.push(
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: config.speed / 2,
                        useNativeDriver: false
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 0,
                        duration: config.speed / 2,
                        useNativeDriver: false
                    })
                );
            }

            // Color rotation animation
            Animated.loop(
                Animated.timing(colorAnim, {
                    toValue: 1,
                    duration: duration / config.flashes,
                    useNativeDriver: false
                })
            ).start();

            // Run flash sequence
            Animated.sequence(flashSequence).start(() => {
                // Reset after animation completes
                flashAnim.setValue(0);
                colorAnim.setValue(0);
            });
        }
    }, [trigger]);

    // Interpolate colors
    const backgroundColor = colorAnim.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [
            COLORS.neonCyan,
            COLORS.hotPink,
            COLORS.limeGlow,
            COLORS.electricPurple,
            COLORS.neonCyan,
            COLORS.hotPink
        ]
    });

    const opacity = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.4]
    });

    if (!trigger) return null;

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    backgroundColor,
                    opacity
                }
            ]}
            pointerEvents="none"
        />
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
    }
});

export default RaveLights;
