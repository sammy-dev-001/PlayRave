import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { scaleFontSize } from '../utils/responsive';

/**
 * NeonText Component
 * @param {string} variant - 'regular' (Outfit), 'display' (Righteous), 'arcade' (Orbitron)
 */
const NeonText = ({ 
    children, 
    style, 
    glow = false, 
    color = COLORS.white, 
    size = 16, 
    weight = 'regular',
    variant = 'regular' // default, display, arcade
}) => {
    // Apply responsive font scaling
    const scaledSize = scaleFontSize(size);

    // Check if content contains emojis
    const hasEmoji = typeof children === 'string' && /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(children);

    // Map variant to actual font family
    let fontFamily = FONTS.regular;
    if (variant === 'display') fontFamily = FONTS.display;
    if (variant === 'arcade') fontFamily = FONTS.arcade;
    if (weight === 'bold' && variant === 'regular') fontFamily = FONTS.bold;

    const textStyles = [
        styles.text,
        {
            color: color,
            fontSize: scaledSize,
            fontFamily: fontFamily,
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
        // Fallback handled in component logic
    },
    glow: {
        textShadowColor: COLORS.neonCyan,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
});

export default React.memo(NeonText);
