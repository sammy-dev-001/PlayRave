import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { scaleFontSize } from '../utils/responsive';

const NeonText = ({ children, style, glow = false, color = COLORS.white, size = 16, weight = 'regular' }) => {
    // Apply responsive font scaling
    const scaledSize = scaleFontSize(size);

    // Check if content contains emojis - use platform default font for proper emoji rendering
    const hasEmoji = typeof children === 'string' && /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(children);

    const textStyles = [
        styles.text,
        {
            color: color,
            fontSize: scaledSize,
            fontWeight: weight === 'bold' ? '700' : '400',
            // On Android, use undefined fontFamily for emoji content to ensure proper rendering
            ...(hasEmoji && Platform.OS === 'android' && { fontFamily: undefined })
        },
        glow && styles.glow,
        style,
    ];

    return <Text style={textStyles}>{children}</Text>;
};

const styles = StyleSheet.create({
    text: {
        fontFamily: FONTS.regular,
    },
    glow: {
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
});

export default React.memo(NeonText);
