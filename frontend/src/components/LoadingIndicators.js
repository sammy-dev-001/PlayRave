import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

// Spinning loader with neon glow
export const NeonLoader = ({
    size = 60,
    color = COLORS.neonCyan,
    text = 'Loading...',
    showText = true
}) => {
    const rotation = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Rotation animation
        const rotate = Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        rotate.start();

        // Pulse animation
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseScale, {
                    toValue: 1.1,
                    duration: 750,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseScale, {
                    toValue: 1,
                    duration: 750,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => {
            rotate.stop();
            pulse.stop();
        };
    }, []);

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.loaderContainer}>
            <Animated.View
                style={[
                    styles.loaderOuter,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: color,
                        transform: [
                            { rotate: rotateInterpolate },
                            { scale: pulseScale }
                        ],
                        shadowColor: color,
                    },
                ]}
            >
                <View
                    style={[
                        styles.loaderInner,
                        {
                            width: size - 16,
                            height: size - 16,
                            borderRadius: (size - 16) / 2,
                        }
                    ]}
                />
            </Animated.View>
            {showText && (
                <NeonText size={14} color={color} style={styles.loaderText}>
                    {text}
                </NeonText>
            )}
        </View>
    );
};

// Dots loader
export const DotsLoader = ({ size = 10, color = COLORS.neonCyan, count = 3 }) => {
    const animations = useRef(
        Array.from({ length: count }, () => new Animated.Value(0))
    ).current;

    useEffect(() => {
        const animateDots = () => {
            const dotAnimations = animations.map((anim, index) =>
                Animated.sequence([
                    Animated.delay(index * 150),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            );

            Animated.loop(
                Animated.stagger(150, dotAnimations)
            ).start();
        };

        animateDots();
    }, []);

    return (
        <View style={styles.dotsContainer}>
            {animations.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: color,
                            opacity: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.3, 1],
                            }),
                            transform: [
                                {
                                    translateY: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -size],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            ))}
        </View>
    );
};

// Skeleton loader for content
export const SkeletonLoader = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();

        return () => animation.stop();
    }, []);

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                style
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    { transform: [{ translateX }] },
                ]}
            />
        </View>
    );
};

// Full screen loading overlay
export const LoadingOverlay = ({
    visible,
    text = 'Loading...',
    color = COLORS.neonCyan
}) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity }]}>
            <View style={styles.overlayContent}>
                <NeonLoader color={color} text={text} />
            </View>
        </Animated.View>
    );
};

// Success/Error indicator
export const StatusIndicator = ({
    type = 'success', // 'success', 'error', 'warning'
    size = 60,
    animated = true
}) => {
    const scale = useRef(new Animated.Value(animated ? 0 : 1)).current;
    const rotation = useRef(new Animated.Value(animated ? 0 : 1)).current;

    const colors = {
        success: COLORS.limeGlow,
        error: COLORS.hotPink,
        warning: '#FFD700',
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
    };

    useEffect(() => {
        if (animated) {
            Animated.spring(scale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }).start();
        }
    }, []);

    const color = colors[type] || colors.success;
    const icon = icons[type] || icons.success;

    return (
        <Animated.View
            style={[
                styles.statusIndicator,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: color,
                    transform: [{ scale }],
                    shadowColor: color,
                },
            ]}
        >
            <NeonText size={size * 0.5} color={color} weight="bold">
                {icon}
            </NeonText>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderOuter: {
        borderWidth: 3,
        borderTopColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    loaderInner: {
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    loaderText: {
        marginTop: 15,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {},
    skeleton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    overlayContent: {
        padding: 30,
        borderRadius: 20,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    statusIndicator: {
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },
});

export default {
    NeonLoader,
    DotsLoader,
    SkeletonLoader,
    LoadingOverlay,
    StatusIndicator,
};
