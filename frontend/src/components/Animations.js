import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

// Fade In animation
export const FadeIn = ({ children, delay = 0, duration = 500, style }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Scale In animation
export const ScaleIn = ({ children, delay = 0, duration = 400, style }) => {
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            delay,
            useNativeDriver: true,
            tension: 100,
            friction: 8
        }).start();
    }, []);

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Pulse animation (continuous)
export const Pulse = ({ children, minScale = 0.95, maxScale = 1.05, duration = 1000, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: maxScale, duration: duration / 2, useNativeDriver: true }),
                Animated.timing(scale, { toValue: minScale, duration: duration / 2, useNativeDriver: true })
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Shake animation (for errors/wrong answers)
export const Shake = ({ children, trigger, style }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trigger) {
            Animated.sequence([
                Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true })
            ]).start();
        }
    }, [trigger]);

    return (
        <Animated.View style={[{ transform: [{ translateX }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Bounce In animation
export const BounceIn = ({ children, delay = 0, style }) => {
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 180,
                friction: 12
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Slide In from side
export const SlideIn = ({ children, from = 'left', delay = 0, duration = 400, style }) => {
    const translateX = useRef(new Animated.Value(from === 'left' ? -100 : 100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateX, { toValue: 0, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ transform: [{ translateX }], opacity }, style]}>
            {children}
        </Animated.View>
    );
};

// Glow effect for neon elements
export const GlowPulse = ({ children, color = COLORS.neonCyan, style }) => {
    const opacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <View style={style}>
            <Animated.View style={[styles.glowContainer, { shadowColor: color, shadowOpacity: opacity }]}>
                {children}
            </Animated.View>
        </View>
    );
};

// Staggered list animation
export const staggeredAnimation = (items, delay = 100) => {
    return items.map((_, index) => ({
        delay: index * delay
    }));
};

// Confetti burst (for wins)
export const ConfettiBurst = ({ active, style }) => {
    const particles = useRef([...Array(20)].map(() => ({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1)
    }))).current;

    useEffect(() => {
        if (active) {
            particles.forEach((p, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 100 + Math.random() * 100;

                Animated.parallel([
                    Animated.timing(p.x, { toValue: Math.cos(angle) * distance, duration: 1000, useNativeDriver: true }),
                    Animated.timing(p.y, { toValue: Math.sin(angle) * distance - 50, duration: 1000, useNativeDriver: true }),
                    Animated.timing(p.rotate, { toValue: Math.random() * 360, duration: 1000, useNativeDriver: true }),
                    Animated.timing(p.opacity, { toValue: 0, duration: 1000, delay: 500, useNativeDriver: true })
                ]).start();
            });
        }
    }, [active]);

    if (!active) return null;

    const colors = [COLORS.hotPink, COLORS.neonCyan, COLORS.limeGlow, COLORS.electricPurple, '#FFD700'];

    return (
        <View style={[styles.confettiContainer, style]}>
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.confettiPiece,
                        {
                            backgroundColor: colors[i % colors.length],
                            transform: [
                                { translateX: p.x },
                                { translateY: p.y },
                                { rotate: p.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }
                            ],
                            opacity: p.opacity
                        }
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    glowContainer: {
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 15,
        elevation: 10
    },
    confettiContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
    },
    confettiPiece: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 2
    }
});
