import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Responsive helpers
const ResponsiveUtils = {
    // Get current dimensions
    getScreenWidth: () => Dimensions.get('window').width,
    getScreenHeight: () => Dimensions.get('window').height,

    // Scale based on width
    scaleWidth: (size) => {
        const scale = SCREEN_WIDTH / BASE_WIDTH;
        return Math.round(size * scale);
    },

    // Scale based on height
    scaleHeight: (size) => {
        const scale = SCREEN_HEIGHT / BASE_HEIGHT;
        return Math.round(size * scale);
    },

    // Moderate scale (average of width and height scaling)
    moderateScale: (size, factor = 0.5) => {
        const widthScale = SCREEN_WIDTH / BASE_WIDTH;
        return Math.round(size + (size * (widthScale - 1)) * factor);
    },

    // Font scaling with accessibility consideration
    scaleFontSize: (size) => {
        const scale = SCREEN_WIDTH / BASE_WIDTH;
        const newSize = size * scale;

        if (Platform.OS === 'ios') {
            return Math.round(PixelRatio.roundToNearestPixel(newSize));
        }
        return Math.round(newSize);
    },

    // Check if device is small (iPhone SE, older Androids)
    isSmallDevice: () => SCREEN_WIDTH < 375,

    // Check if device is large (tablets, large phones)
    isLargeDevice: () => SCREEN_WIDTH >= 768,

    // Check if device is tablet
    isTablet: () => {
        const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
        return aspectRatio < 1.6 && SCREEN_WIDTH >= 600;
    },

    // Get responsive value based on device size
    responsive: (small, medium, large) => {
        if (SCREEN_WIDTH < 375) return small;
        if (SCREEN_WIDTH >= 768) return large;
        return medium;
    },

    // Get grid columns based on screen width
    getGridColumns: (minItemWidth = 100) => {
        return Math.floor(SCREEN_WIDTH / minItemWidth);
    },

    // Safe area aware dimensions
    getSafeAreaDimensions: (insets = { top: 0, bottom: 0, left: 0, right: 0 }) => {
        return {
            width: SCREEN_WIDTH - insets.left - insets.right,
            height: SCREEN_HEIGHT - insets.top - insets.bottom,
        };
    },

    // Responsive padding
    getPadding: () => {
        if (SCREEN_WIDTH < 375) return 12;
        if (SCREEN_WIDTH >= 768) return 32;
        return 20;
    },

    // Responsive gap/spacing
    getSpacing: (multiplier = 1) => {
        const base = SCREEN_WIDTH < 375 ? 8 : SCREEN_WIDTH >= 768 ? 16 : 12;
        return base * multiplier;
    },

    // Responsive font sizes
    fontSizes: {
        xs: () => ResponsiveUtils.responsive(10, 12, 14),
        sm: () => ResponsiveUtils.responsive(12, 14, 16),
        md: () => ResponsiveUtils.responsive(14, 16, 18),
        lg: () => ResponsiveUtils.responsive(18, 20, 24),
        xl: () => ResponsiveUtils.responsive(24, 28, 32),
        xxl: () => ResponsiveUtils.responsive(32, 36, 48),
    },

    // Responsive border radius
    borderRadius: {
        sm: () => ResponsiveUtils.responsive(4, 6, 8),
        md: () => ResponsiveUtils.responsive(8, 12, 16),
        lg: () => ResponsiveUtils.responsive(12, 16, 24),
        xl: () => ResponsiveUtils.responsive(16, 20, 32),
        full: () => 9999,
    },

    // Button heights
    buttonHeight: () => ResponsiveUtils.responsive(44, 50, 56),

    // Input heights
    inputHeight: () => ResponsiveUtils.responsive(44, 50, 56),

    // Card widths for grids
    getCardWidth: (columns = 2, gap = 10) => {
        const totalGaps = (columns - 1) * gap;
        const padding = ResponsiveUtils.getPadding() * 2;
        return (SCREEN_WIDTH - padding - totalGaps) / columns;
    },

    // Max content width (for tablets/web)
    getMaxContentWidth: () => Math.min(SCREEN_WIDTH, 600),

    // Aspect ratio helpers
    aspectRatio: {
        square: 1,
        portrait: 4 / 3,
        landscape: 16 / 9,
        wide: 21 / 9,
    }
};

// Hook for dimension changes
export const useDimensions = () => {
    const [dimensions, setDimensions] = React.useState({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });

    React.useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions({
                width: window.width,
                height: window.height,
            });
        });

        return () => subscription?.remove();
    }, []);

    return dimensions;
};

import React from 'react';

export default ResponsiveUtils;
