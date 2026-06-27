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

    // Interpolate positions for the blobs
    const getTransform = (anim, outputX, outputY) => ({
        transform: [
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: outputX }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: outputY }) },
        ]
    });

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base dark background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]} />

            {/* Blob 1: Top Left -> Bottom Right */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim1, [-100, SCREEN_WIDTH / 2], [-100, SCREEN_HEIGHT / 2]),
                { width: SCREEN_WIDTH * 1.5, height: SCREEN_WIDTH * 1.5, opacity: 0.4 }
            ]}>
                <LinearGradient
                    colors={['rgba(168,218,255,0.8)', 'rgba(168,218,255,0)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Blob 2: Bottom Right -> Top Left */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim2, [SCREEN_WIDTH, -SCREEN_WIDTH / 3], [SCREEN_HEIGHT, -SCREEN_HEIGHT / 3]),
                { width: SCREEN_WIDTH * 1.8, height: SCREEN_WIDTH * 1.8, opacity: 0.3 }
            ]}>
                <LinearGradient
                    colors={['rgba(208,191,255,0.7)', 'rgba(208,191,255,0)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 0 }}
                />
            </Animated.View>

            {/* Blob 3: Center -> Center horizontal sweep */}
            <Animated.View style={[
                styles.blob,
                getTransform(anim3, [-SCREEN_WIDTH / 2, SCREEN_WIDTH], [SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2]),
                { width: SCREEN_WIDTH * 1.2, height: SCREEN_WIDTH * 1.2, opacity: 0.3 }
            ]}>
                <LinearGradient
                    colors={['rgba(255,179,198,0.6)', 'rgba(255,179,198,0)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 0 }}
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
        // Since we are applying radial-like gradients using linear gradients
    }
});

export default ThemeBackground;
