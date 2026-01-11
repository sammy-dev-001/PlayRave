import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import NeonText from './NeonText';
import HapticService from '../services/HapticService';
import { responsive, TOUCH_TARGET_SIZE } from '../utils/responsive';

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

    // Responsive size configurations with minimum touch targets
    const sizeConfig = {
        small: {
            paddingVertical: Math.max(responsive(6, 8, 10), (TOUCH_TARGET_SIZE - 14) / 2),
            paddingHorizontal: responsive(12, 16, 20),
            fontSize: responsive(12, 14, 16)
        },
        medium: {
            paddingVertical: Math.max(responsive(10, 12, 14), (TOUCH_TARGET_SIZE - 18) / 2),
            paddingHorizontal: responsive(20, 24, 28),
            fontSize: responsive(16, 18, 20)
        },
        large: {
            paddingVertical: Math.max(responsive(14, 16, 18), (TOUCH_TARGET_SIZE - 20) / 2),
            paddingHorizontal: responsive(28, 32, 40),
            fontSize: responsive(18, 20, 24)
        },
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
        // Trigger haptic feedback
        if (haptic) {
            HapticService.buttonTap();
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
