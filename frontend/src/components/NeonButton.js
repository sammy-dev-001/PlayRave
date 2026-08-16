import React, { useRef, useMemo, memo } from 'react';
import {
    TouchableOpacity, StyleSheet, View, Animated,
    Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../constants/themes';

import NeonText from './NeonText';
import GlassView from './GlassView';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);
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
    sound = true, // New prop to control sound
}) => {
    const { theme, COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const isPrimary = variant === 'primary';
    const isSuccess = variant === 'success';
    const isDanger = variant === 'danger';
    const isGlass = theme?.isGlass;

    // Determine colors and glow based on variant
    let borderColor;
    let glowStyle;
    let glassVariant = 'default';

    if (isGlass) {
        if (isPrimary) {
            borderColor = 'rgba(0,194,255,0.85)';
            glassVariant = 'primary';
        } else if (isSuccess) {
            borderColor = 'rgba(76, 175, 80, 0.85)'; // Green
            glassVariant = 'success';
        } else if (isDanger) {
            borderColor = 'rgba(255, 82, 82, 0.85)'; // Red
            glassVariant = 'danger';
        } else {
            borderColor = 'rgba(255,255,255,0.50)';
        }
    } else {
        if (isPrimary) {
            borderColor = COLORS.neonCyan;
            glowStyle = SHADOWS.neonGlow;
        } else if (isSuccess) {
            borderColor = COLORS.success || '#4CAF50';
            glowStyle = {
                shadowColor: COLORS.success || '#4CAF50',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 5,
            };
        } else if (isDanger) {
            borderColor = COLORS.error || '#FF5252';
            glowStyle = {
                shadowColor: COLORS.error || '#FF5252',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 5,
            };
        } else {
            borderColor = COLORS.hotPink;
            glowStyle = SHADOWS.purpleGlow;
        }
    }

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
                useNativeDriver: false,
                friction: 8,
            }),
            Animated.timing(glowAnim, {
                toValue: 1.5,
                duration: 100,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: false,
                friction: 5,
                tension: 100,
            }),
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePress = () => {
        // Play sound effect
        if (sound && !disabled && !loading) {
            SoundService.playButtonClick();
        }

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
            <AnimatedGlassView
                variant={glassVariant}
                style={[
                styles.button,
                {
                    borderColor,
                    borderRadius: isGlass ? 28 : 12,  // pill shape for liquid glass
                    paddingVertical: currentSize.paddingVertical,
                    paddingHorizontal: currentSize.paddingHorizontal,
                    transform: [{ scale: scaleAnim }],
                    backgroundColor: isGlass ? 'transparent' : COLORS.overlayDark,
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
                        <NeonText
                            weight="bold"
                            variant="arcade"
                            size={currentSize.fontSize}
                            color={isGlass ? '#FFFFFF' : borderColor}
                            glow={!isGlass}
                        >
                            {title.toUpperCase()}
                        </NeonText>
                    </View>
                )}
            </AnimatedGlassView>
        </TouchableOpacity>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    button: {
        backgroundColor: COLORS.overlayDark,
        borderWidth: 2,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
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

export default memo(NeonButton);
