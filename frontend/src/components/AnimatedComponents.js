import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { AnimationConfig } from '../utils/AnimationUtils';

// Animated Container - Fades and slides in children
export const AnimatedContainer = ({
    children,
    delay = 0,
    direction = 'up',
    style,
    ...props
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(direction === 'up' ? 30 : -30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                delay,
                useNativeDriver: true,
                easing: AnimationConfig.easing.spring,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[{ opacity, transform: [{ translateY }] }, style]}
            {...props}
        >
            {children}
        </Animated.View>
    );
};

// Animated Card - With press animation
export const AnimatedCard = ({
    children,
    delay = 0,
    onPress,
    style,
    ...props
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                delay,
                useNativeDriver: true,
                friction: 6,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(pressScale, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
        }).start();
        onPress?.();
    };

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    transform: [
                        { scale: Animated.multiply(scale, pressScale) }
                    ]
                },
                style
            ]}
            {...props}
        >
            {React.cloneElement(children, {
                onPressIn: handlePressIn,
                onPressOut: handlePressOut,
            })}
        </Animated.View>
    );
};

// Animated List Item - Staggered entrance
export const AnimatedListItem = ({
    children,
    index = 0,
    staggerDelay = 50,
    style,
    ...props
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                delay: index * staggerDelay,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: 0,
                duration: 300,
                delay: index * staggerDelay,
                useNativeDriver: true,
                easing: AnimationConfig.easing.spring,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[{ opacity, transform: [{ translateX }] }, style]}
            {...props}
        >
            {children}
        </Animated.View>
    );
};

// Pulsing Element - For highlighting
export const PulsingElement = ({ children, active = true, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!active) {
            scale.setValue(1);
            return;
        }

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.08,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [active]);

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Floating Element - Subtle hover effect
export const FloatingElement = ({ children, intensity = 10, style }) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -intensity,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        float.start();

        return () => float.stop();
    }, []);

    return (
        <Animated.View style={[{ transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
};

// Shake Element - For errors/attention
export const ShakeElement = React.forwardRef(({ children, style }, ref) => {
    const translateX = useRef(new Animated.Value(0)).current;

    React.useImperativeHandle(ref, () => ({
        shake: () => {
            Animated.sequence([
                Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }));

    return (
        <Animated.View style={[{ transform: [{ translateX }] }, style]}>
            {children}
        </Animated.View>
    );
});

// Glow Element - Neon glow effect
export const GlowElement = ({ children, color = '#00F8FF', style }) => {
    const glowOpacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.5,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        glow.start();

        return () => glow.stop();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    shadowColor: color,
                    shadowOpacity: glowOpacity,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 0 },
                }
            ]}
        >
            {children}
        </Animated.View>
    );
};

// Progress Bar - Animated fill
export const AnimatedProgressBar = ({
    progress,
    color = '#C6FF4A',
    backgroundColor = 'rgba(255,255,255,0.1)',
    height = 8,
    style
}) => {
    const width = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(width, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
            easing: AnimationConfig.easing.smooth,
        }).start();
    }, [progress]);

    const animatedWidth = width.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.progressContainer, { height, backgroundColor }, style]}>
            <Animated.View
                style={[
                    styles.progressFill,
                    {
                        width: animatedWidth,
                        backgroundColor: color,
                        height
                    }
                ]}
            />
        </View>
    );
};

// Countdown Display - Animated digits
export const AnimatedCountdown = ({
    value,
    size = 48,
    color = '#00F8FF',
    warningThreshold = 5,
    warningColor = '#FF3FA4'
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            prevValue.current = value;

            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [value]);

    const displayColor = value <= warningThreshold ? warningColor : color;

    return (
        <Animated.Text
            style={[
                styles.countdown,
                {
                    fontSize: size,
                    color: displayColor,
                    transform: [{ scale }],
                    textShadowColor: displayColor,
                    textShadowRadius: 10,
                }
            ]}
        >
            {value}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    progressContainer: {
        borderRadius: 100,
        overflow: 'hidden',
    },
    progressFill: {
        borderRadius: 100,
    },
    countdown: {
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default {
    AnimatedContainer,
    AnimatedCard,
    AnimatedListItem,
    PulsingElement,
    FloatingElement,
    ShakeElement,
    GlowElement,
    AnimatedProgressBar,
    AnimatedCountdown,
};
