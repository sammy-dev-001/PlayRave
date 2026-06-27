import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

/**
 * A wrapper component that conditionally renders a blurred frosted glass
 * background if the current theme supports it, or a standard View otherwise.
 */
const GlassView = ({ style, children, intensity, tint = 'dark', ...rest }) => {
    const { theme } = useTheme();
    const isGlass = theme?.isGlass;
    const blurAmount = intensity ?? theme?.blurIntensity ?? 40;

    if (!isGlass) {
        return (
            <View style={style} {...rest}>
                {children}
            </View>
        );
    }

    return (
        <BlurView
            intensity={blurAmount}
            tint={tint}
            experimentalBlurMethod="dimezisBlurView" // Better Android compatibility
            style={style}
            {...rest}
        >
            {children}
        </BlurView>
    );
};

export default GlassView;
