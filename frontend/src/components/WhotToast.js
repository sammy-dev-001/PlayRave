import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

/**
 * WhotToast — A non-blocking, auto-dismissing notification overlay.
 *
 * Props:
 *   message  (string)  — The text to display
 *   icon     (string)  — Optional emoji prefix (e.g. '⚡', '🃏')
 *   color    (string)  — Neon accent color for the border/text (default: COLORS.neonCyan)
 *   visible  (boolean) — Whether the toast is currently visible
 *   duration (number)  — How long to show before fading out (ms, default 2200)
 *   onDone   (fn)      — Called once the fade-out animation finishes
 */
const WhotToast = ({ message, icon = '', color = COLORS.neonCyan, visible, duration = 2200, onDone }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;
    // Keep the component mounted until the exit animation completes
    const [isRendered, setIsRendered] = useState(visible);
    const animRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
        }

        // Stop any running animation before starting a new one
        if (animRef.current) animRef.current.stop();

        if (!visible) {
            // Fade out immediately when hidden externally
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                setIsRendered(false);
                if (onDone) onDone();
            });
            return;
        }

        // Reset before animating in
        opacity.setValue(0);
        translateY.setValue(-20);

        animRef.current = Animated.sequence([
            // Slide + fade in
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]),
            // Hold
            Animated.delay(duration),
            // Fade out
            Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]);

        animRef.current.start(({ finished }) => {
            if (finished) {
                setIsRendered(false);
                if (onDone) onDone();
            }
        });
    }, [visible, message]);

    if (!isRendered) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    borderColor: color,
                    opacity,
                    transform: [{ translateY }],
                }
            ]}
            pointerEvents="none"
        >
            <View style={[styles.glow, { backgroundColor: color + '22' }]} />
            <NeonText size={17} weight="bold" color={color} style={styles.text}>
                {icon ? `${icon}  ` : ''}{message}
            </NeonText>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        borderWidth: 1.5,
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: 'rgba(10, 10, 26, 0.92)',
        zIndex: 9999,
        // Shadow for premium glow feel
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 20,
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 30,
    },
    text: {
        letterSpacing: 1,
        textAlign: 'center',
    }
});

export default WhotToast;
