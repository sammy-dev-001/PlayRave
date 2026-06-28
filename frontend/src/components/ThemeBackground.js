import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AuroraBackground = ({ theme }) => {
    // 3 animated values for the X/Y positions of the aurora blobs
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (animValue, duration) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: duration,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: Platform.OS !== 'web',
                    })
                ])
            );
        };

        // Slow, gentle breathing animations
        const a1 = createAnimation(anim1, 15000);
        const a2 = createAnimation(anim2, 18000);
        const a3 = createAnimation(anim3, 22000);

        a1.start();
        a2.start();
        a3.start();

        return () => {
            a1.stop();
            a2.stop();
            a3.stop();
        };
    }, []);

    // Interpolate positions for subtle breathing/floating transforms
    const getTransform = (anim, outputX, outputY, scaleRange = [1, 1.1]) => ({
        transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: outputX }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: outputY }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: scaleRange }) },
        ]
    });

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]} />

            {/* Blob 1: Top Right */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim1, [-20, 20], [-20, 20], [1, 1.15]),
                { top: -SCREEN_HEIGHT * 0.2, right: -SCREEN_WIDTH * 0.2, width: SCREEN_WIDTH * 1.5, height: SCREEN_WIDTH * 1.5, opacity: 0.6 }
            ]}>
                <LinearGradient
                    colors={[theme.colors.primary, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                />
            </Animated.View>

            {/* Blob 2: Bottom Left */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim2, [20, -20], [20, -20], [1.1, 1]),
                { bottom: -SCREEN_HEIGHT * 0.2, left: -SCREEN_WIDTH * 0.2, width: SCREEN_WIDTH * 1.8, height: SCREEN_WIDTH * 1.8, opacity: 0.5 }
            ]}>
                <LinearGradient
                    colors={[theme.colors.secondary, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 0 }}
                />
            </Animated.View>

            {/* Blob 3: Center Offset */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim3, [-30, 30], [30, -30], [1, 1.2]),
                { top: SCREEN_HEIGHT * 0.2, left: SCREEN_WIDTH * 0.1, width: SCREEN_WIDTH * 1.2, height: SCREEN_WIDTH * 1.2, opacity: 0.4 }
            ]}>
                <LinearGradient
                    colors={[theme.colors.accent, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 0 }}
                />
            </Animated.View>
        </View>
    );
};

const ThemeBackground = () => {
    const { theme } = useTheme();

    if (theme.isGlass) {
        return <AuroraBackground theme={theme} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {theme.backgroundImage ? (
                <ImageBackground
                    source={theme.backgroundImage}
                    style={styles.image}
                    resizeMode="repeat"
                    imageStyle={{ opacity: 0.3 }}
                />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    blob: {
        position: 'absolute',
        borderRadius: 9999,
    }
});

export default ThemeBackground;
