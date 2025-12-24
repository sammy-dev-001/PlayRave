import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

// Animation presets with durations
export const AnimationConfig = {
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
        verySlow: 800,
    },
    easing: {
        smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
        bounce: Easing.bounce,
        elastic: Easing.elastic(1),
        spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    }
};

// Fade In animation hook
export const useFadeIn = (delay = 0, duration = AnimationConfig.duration.normal) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
            easing: AnimationConfig.easing.smooth,
        }).start();
    }, []);

    return { opacity };
};

// Slide In animation hook
export const useSlideIn = (
    direction = 'up',
    delay = 0,
    duration = AnimationConfig.duration.normal
) => {
    const translateY = useRef(new Animated.Value(direction === 'up' ? 50 : -50)).current;
    const translateX = useRef(new Animated.Value(direction === 'left' ? 50 : direction === 'right' ? -50 : 0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(direction === 'left' || direction === 'right' ? translateX : translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
                easing: AnimationConfig.easing.spring,
            }),
        ]).start();
    }, []);

    return {
        opacity,
        transform: [
            { translateY: direction === 'up' || direction === 'down' ? translateY : 0 },
            { translateX: direction === 'left' || direction === 'right' ? translateX : 0 },
        ],
    };
};

// Scale animation hook (for buttons, cards)
export const useScaleAnimation = () => {
    const scale = useRef(new Animated.Value(1)).current;

    const animatePress = () => {
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return { scale, animatePress };
};

// Pulse animation hook (for attention)
export const usePulse = (active = true) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!active) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [active]);

    return { transform: [{ scale }] };
};

// Shake animation (for errors)
export const useShake = () => {
    const translateX = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    return { translateX, shake };
};

// Glow animation (for neon effects)
export const useGlow = () => {
    const glowOpacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        glow.start();

        return () => glow.stop();
    }, []);

    return { glowOpacity };
};

// Stagger animation for lists
export const useStaggeredAnimation = (itemCount, staggerDelay = 50) => {
    const animations = useRef(
        Array.from({ length: itemCount }, () => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
        }))
    ).current;

    useEffect(() => {
        const staggeredAnimations = animations.map((anim, index) =>
            Animated.parallel([
                Animated.timing(anim.opacity, {
                    toValue: 1,
                    duration: 300,
                    delay: index * staggerDelay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim.translateY, {
                    toValue: 0,
                    duration: 300,
                    delay: index * staggerDelay,
                    useNativeDriver: true,
                    easing: AnimationConfig.easing.spring,
                }),
            ])
        );

        Animated.parallel(staggeredAnimations).start();
    }, [itemCount]);

    return animations;
};

// Countdown animation
export const useCountdown = (from, to = 0, duration = 1000) => {
    const value = useRef(new Animated.Value(from)).current;
    const scale = useRef(new Animated.Value(1)).current;

    const startCountdown = () => {
        const steps = from - to;
        const stepDuration = duration;

        const animations = [];
        for (let i = from; i >= to; i--) {
            animations.push(
                Animated.parallel([
                    Animated.timing(value, {
                        toValue: i,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(scale, {
                            toValue: 1.2,
                            duration: stepDuration * 0.3,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: 1,
                            duration: stepDuration * 0.7,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );
            if (i > to) {
                animations.push(Animated.delay(stepDuration));
            }
        }

        Animated.sequence(animations).start();
    };

    return { value, scale, startCountdown };
};

// Progress bar animation
export const useProgress = (targetValue, duration = 500) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: targetValue,
            duration,
            useNativeDriver: false, // Width animation needs false
            easing: AnimationConfig.easing.smooth,
        }).start();
    }, [targetValue]);

    return progress;
};

// Floating animation (for avatars, emojis)
export const useFloat = () => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -10,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );
        float.start();

        return () => float.stop();
    }, []);

    return { transform: [{ translateY }] };
};

// Rotate animation (for spinners, loading)
export const useRotate = (duration = 1000) => {
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const rotate = Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        );
        rotate.start();

        return () => rotate.stop();
    }, []);

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return { transform: [{ rotate }] };
};

export default {
    AnimationConfig,
    useFadeIn,
    useSlideIn,
    useScaleAnimation,
    usePulse,
    useShake,
    useGlow,
    useStaggeredAnimation,
    useCountdown,
    useProgress,
    useFloat,
    useRotate,
};
