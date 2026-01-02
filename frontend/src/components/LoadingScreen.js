import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * A reusable loading screen component with neon-themed animations.
 * Used for lazy-loaded screens and async operations.
 */
const LoadingScreen = ({
    message = 'Loading...',
    showLogo = true,
    size = 'large', // 'small', 'medium', 'large'
    fullScreen = true
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Spin animation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const sizeConfig = {
        small: { container: 40, ring: 30, text: 12 },
        medium: { container: 60, ring: 50, text: 14 },
        large: { container: 80, ring: 70, text: 18 },
    };

    const config = sizeConfig[size] || sizeConfig.large;

    const containerStyle = fullScreen ? styles.fullScreenContainer : styles.inlineContainer;

    return (
        <View style={containerStyle}>
            {showLogo && fullScreen && (
                <Animated.Text
                    style={[
                        styles.logo,
                        { opacity: glowAnim }
                    ]}
                >
                    PLAYRAVE
                </Animated.Text>
            )}

            <View style={[styles.loaderContainer, { width: config.container, height: config.container }]}>
                {/* Outer spinning ring */}
                <Animated.View
                    style={[
                        styles.spinnerRing,
                        {
                            width: config.ring,
                            height: config.ring,
                            transform: [{ rotate: spin }]
                        }
                    ]}
                />

                {/* Inner pulsing dot */}
                <Animated.View
                    style={[
                        styles.pulsingDot,
                        {
                            transform: [{ scale: pulseAnim }],
                            width: config.ring * 0.3,
                            height: config.ring * 0.3,
                        }
                    ]}
                />
            </View>

            {message && (
                <Animated.Text
                    style={[
                        styles.message,
                        { fontSize: config.text, opacity: glowAnim }
                    ]}
                >
                    {message}
                </Animated.Text>
            )}
        </View>
    );
};

/**
 * Inline loading indicator for use within components
 */
export const InlineLoader = ({ size = 'small', color = COLORS.neonCyan }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const sizeMap = { small: 20, medium: 30, large: 40 };
    const loaderSize = sizeMap[size] || sizeMap.small;

    return (
        <Animated.View
            style={[
                styles.inlineSpinner,
                {
                    width: loaderSize,
                    height: loaderSize,
                    borderColor: color,
                    transform: [{ rotate: spin }]
                }
            ]}
        />
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: COLORS.deepNightBlack,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    inlineContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.neonCyan,
        marginBottom: 40,
        letterSpacing: 4,
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerRing: {
        borderRadius: 100,
        borderWidth: 4,
        borderColor: 'transparent',
        borderTopColor: COLORS.neonCyan,
        borderRightColor: COLORS.electricPurple,
        position: 'absolute',
    },
    pulsingDot: {
        backgroundColor: COLORS.limeGlow,
        borderRadius: 100,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    message: {
        color: COLORS.white,
        marginTop: 30,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    inlineSpinner: {
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'transparent',
        borderTopColor: COLORS.neonCyan,
    },
});

export default LoadingScreen;
