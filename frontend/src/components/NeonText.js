import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { scaleFontSize } from '../utils/responsive';

const NeonText = ({ children, style, glow = false, color = COLORS.white, size = 16, weight = 'regular' }) => {
    // Apply responsive font scaling
    const scaledSize = scaleFontSize(size);

    const textStyles = [
        styles.text,
        { color: color, fontSize: scaledSize, fontWeight: weight === 'bold' ? '700' : '400' },
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
