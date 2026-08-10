import React, { useMemo, useRef, useEffect } from 'react';
import {
    View, StyleSheet, Animated,
    Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SkeletonLoader = ({ width = '100%', height = 40, borderRadius = 8, style }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.surfaceLight,
    },
});

export default SkeletonLoader;
