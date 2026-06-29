import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

/**
 * GlassView — renders a layered liquid-glass panel.
 *
 * Layer stack (bottom → top):
 *   1. BlurView         — the frosted background blur
 *   2. Surface tint     — ultra-thin rgba wash so the glass reads as a shape
 *   3. Inner sheen      — diagonal gradient (top-left bright → bottom-right dim)
 *                         simulating the refraction of thick clear resin
 *   4. Top-edge specular — a thin bright strip at the top border (surface tension line)
 *   5. Content          — children float above the glass, fully sharp
 *   6. Border           — white/translucent stroke that catches the "light"
 */
const GlassView = ({
    style,
    children,
    intensity,
    tint,
    /** 'default' | 'primary' | 'danger' — tints the gel colour */
    variant = 'default',
    ...rest
}) => {
    const { theme } = useTheme();
    const isGlass = theme?.isGlass;
    const blurAmount = intensity ?? theme?.blurIntensity ?? 40;
    const glassTint = tint ?? theme?.glassTint ?? 'dark';

    if (!isGlass) {
        return (
            <View style={style} {...rest}>
                {children}
            </View>
        );
    }

    // Pick a subtle gel tint colour per variant
    const gelColor = {
        default: 'rgba(255,255,255,0.06)',
        primary: 'rgba(0,194,255,0.12)',   // cyan gel for primary buttons
        danger:  'rgba(255,45,85,0.10)',
        success: 'rgba(52,199,89,0.10)',
    }[variant] ?? 'rgba(255,255,255,0.06)';

    // Flatten incoming style so we can extract borderRadius for highlight clips
    const flatStyle = StyleSheet.flatten(style) || {};
    const radius = flatStyle.borderRadius ?? 16;

    return (
        <View style={[styles.wrapper, style]} {...rest}>
            {/* ① Blur base */}
            <BlurView
                intensity={blurAmount}
                tint={glassTint}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
            />

            {/* ② Ultra-thin gel tint */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: gelColor, borderRadius: radius }]} />

            {/* ③ Inner sheen — diagonal light refraction */}
            <LinearGradient
                colors={[
                    'rgba(255,255,255,0.18)',
                    'rgba(255,255,255,0.06)',
                    'rgba(255,255,255,0.00)',
                    'rgba(255,255,255,0.04)',
                ]}
                locations={[0, 0.35, 0.65, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
                pointerEvents="none"
            />

            {/* ④ Top-edge specular highlight — the "surface tension" line */}
            <View
                style={[
                    styles.specularEdge,
                    { borderRadius: radius, borderTopLeftRadius: radius, borderTopRightRadius: radius },
                ]}
                pointerEvents="none"
            />

            {/* ⑤ Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        overflow: 'hidden',
        borderRadius: 16,
        // Soft, diffused shadow for 3-D depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 20,
            },
            android: { elevation: 6 },
            web: {
                boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.65)',
            },
        }),
    },
    specularEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.70)',
        overflow: 'hidden',
    },
    content: {
        // Children sit above all glass layers
        position: 'relative',
    },
});

export default GlassView;
