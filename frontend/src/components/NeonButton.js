import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Vibration, Animated } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import NeonText from './NeonText';

const NeonButton = ({
    title,
    onPress,
    variant = 'primary',
    style,
    disabled = false,
    haptic = true,
    size = 'medium', // 'small', 'medium', 'large'
    icon = null,
    loading = false,
}) => {
    const isPrimary = variant === 'primary';
    const borderColor = isPrimary ? COLORS.neonCyan : COLORS.hotPink;
    const glowStyle = isPrimary ? SHADOWS.neonGlow : SHADOWS.purpleGlow;

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(1)).current;

    // Size configurations
    const sizeConfig = {
        small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
        medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 18 },
        large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 20 },
    };
    const currentSize = sizeConfig[size] || sizeConfig.medium;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.96,
                useNativeDriver: true,
                friction: 8,
            }),
            Animated.timing(glowAnim, {
                toValue: 1.5,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
                tension: 100,
            }),
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = () => {
        // Trigger haptic feedback on mobile platforms
        if (haptic && Platform.OS !== 'web') {
            Vibration.vibrate(10); // Short 10ms vibration
        }
        if (onPress && !loading) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={[styles.container, style]}
            disabled={disabled || loading}
        >
            <Animated.View style={[
                styles.button,
                {
                    borderColor,
                    paddingVertical: currentSize.paddingVertical,
                    paddingHorizontal: currentSize.paddingHorizontal,
                    transform: [{ scale: scaleAnim }],
                },
                glowStyle,
                disabled && styles.disabled
            ]}>
                {loading ? (
                    <Animated.View style={[styles.loader, {
                        transform: [{
                            rotate: glowAnim.interpolate({
                                inputRange: [1, 1.5],
                                outputRange: ['0deg', '360deg'],
                            })
                        }]
                    }]}>
                        <NeonText size={currentSize.fontSize} color={borderColor}>⏳</NeonText>
                    </Animated.View>
                ) : (
                    <View style={styles.content}>
                        {icon && <NeonText size={currentSize.fontSize} style={styles.icon}>{icon}</NeonText>}
                        <NeonText weight="bold" size={currentSize.fontSize} color={borderColor} glow>
                            {title.toUpperCase()}
                        </NeonText>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    button: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 2,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.neonGlow, // Default glow
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 8,
    },
    loader: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.3,
    }
});

export default NeonButton;

