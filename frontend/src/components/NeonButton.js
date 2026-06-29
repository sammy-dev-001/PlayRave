import React, { useRef } from 'react';
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
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const isPrimary = variant === 'primary';
    const isGlass = theme?.isGlass;

    // Glass mode: cyan border for primary, white border for secondary
    // Non-glass: neon glow colours
    const borderColor = isGlass
        ? (isPrimary ? 'rgba(0,194,255,0.85)' : 'rgba(255,255,255,0.50)')
        : (isPrimary ? COLORS.neonCyan : COLORS.hotPink);
    const glowStyle = isGlass ? undefined : (isPrimary ? SHADOWS.neonGlow : SHADOWS.purpleGlow);
    const glassVariant = isGlass ? (isPrimary ? 'primary' : 'default') : undefined;

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
                useNativeDriver: Platform.OS !== 'web',
                friction: 8,
            }),
            Animated.timing(glowAnim, {
                toValue: 1.5,
                duration: 100,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: Platform.OS !== 'web',
                friction: 5,
                tension: 100,
            }),
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: Platform.OS !== 'web',
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

export default React.memo(NeonButton);
