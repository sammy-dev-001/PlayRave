import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import NeonText from './NeonText';

const NeonButton = ({ title, onPress, variant = 'primary', style, disabled = false }) => {
    const isPrimary = variant === 'primary';
    const borderColor = isPrimary ? COLORS.neonCyan : COLORS.hotPink;
    const glowStyle = isPrimary ? SHADOWS.neonGlow : SHADOWS.purpleGlow;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.container, style]}
            disabled={disabled}
        >
            <View style={[
                styles.button,
                { borderColor },
                glowStyle,
                disabled && styles.disabled
            ]}>
                <NeonText weight="bold" size={18} color={borderColor} glow>
                    {title.toUpperCase()}
                </NeonText>
            </View>
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
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.neonGlow, // Default glow
    },
    disabled: {
        opacity: 0.3,
    }
});

export default NeonButton;
