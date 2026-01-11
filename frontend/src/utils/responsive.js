import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (based on iPhone 11 - common design target)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Device size categories
export const DeviceSize = {
    SMALL: 'small',    // < 375px width (iPhone SE, small Androids)
    MEDIUM: 'medium',  // 375-414px (iPhone 11, most phones)
    LARGE: 'large',    // > 414px (iPhone Plus, tablets)
};

// Get current device size category
export const getDeviceSize = () => {
    if (SCREEN_WIDTH < 375) return DeviceSize.SMALL;
    if (SCREEN_WIDTH <= 414) return DeviceSize.MEDIUM;
    return DeviceSize.LARGE;
};

// Check if device is tablet
export const isTablet = () => {
    const ratio = SCREEN_WIDTH / SCREEN_HEIGHT;
    return Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600 ||
        (ratio > 0.6 && ratio < 1.5);
};

// Scale width relative to base design
export const scaleWidth = (size) => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    return Math.round(size * scale);
};

// Scale height relative to base design
export const scaleHeight = (size) => {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    return Math.round(size * scale);
};

// Scale font size with moderation (doesn't scale as aggressively)
export const scaleFontSize = (size) => {
    const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.3); // Cap at 1.3x
    const scaledSize = size * scale;

    // Use PixelRatio for consistent rendering
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
    }
    return Math.round(scaledSize);
};

// Responsive value based on device size
export const responsive = (small, medium, large) => {
    const deviceSize = getDeviceSize();
    switch (deviceSize) {
        case DeviceSize.SMALL:
            return small;
        case DeviceSize.MEDIUM:
            return medium || small;
        case DeviceSize.LARGE:
            return large || medium || small;
        default:
            return medium || small;
    }
};

// Minimum touch target size (48dp recommended by Material Design)
export const TOUCH_TARGET_SIZE = 48;

// Ensure touch target meets minimum size
export const ensureTouchTarget = (size) => {
    return Math.max(size, TOUCH_TARGET_SIZE);
};

// Get safe padding for notches and home indicators
export const getSafeAreaPadding = () => {
    // Default values - actual implementation would use react-native-safe-area-context
    return {
        top: Platform.OS === 'ios' ? 44 : 24,
        bottom: Platform.OS === 'ios' ? 34 : 0,
        left: 0,
        right: 0,
    };
};

// Common responsive font sizes
export const FontSizes = {
    tiny: responsive(10, 11, 12),
    small: responsive(12, 13, 14),
    medium: responsive(14, 15, 16),
    regular: responsive(16, 17, 18),
    large: responsive(18, 20, 22),
    xlarge: responsive(22, 24, 28),
    xxlarge: responsive(28, 32, 36),
    header: responsive(24, 28, 32),
    title: responsive(32, 36, 40),
};

// Common responsive spacing
export const Spacing = {
    xs: responsive(4, 6, 8),
    sm: responsive(8, 10, 12),
    md: responsive(12, 16, 20),
    lg: responsive(16, 20, 24),
    xl: responsive(24, 28, 32),
    xxl: responsive(32, 40, 48),
};

// Common responsive border radius
export const BorderRadius = {
    sm: responsive(4, 6, 8),
    md: responsive(8, 10, 12),
    lg: responsive(12, 16, 20),
    xl: responsive(16, 20, 24),
    round: responsive(50, 50, 50),
};

// Orientation helpers
export const isPortrait = () => SCREEN_HEIGHT > SCREEN_WIDTH;
export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;

// Re-export dimensions for convenience
export { SCREEN_WIDTH, SCREEN_HEIGHT };

// Create responsive style object
export const createResponsiveStyle = (baseStyle, smallOverrides = {}, largeOverrides = {}) => {
    const deviceSize = getDeviceSize();

    if (deviceSize === DeviceSize.SMALL) {
        return { ...baseStyle, ...smallOverrides };
    }
    if (deviceSize === DeviceSize.LARGE) {
        return { ...baseStyle, ...largeOverrides };
    }
    return baseStyle;
};

export default {
    scaleWidth,
    scaleHeight,
    scaleFontSize,
    responsive,
    getDeviceSize,
    isTablet,
    ensureTouchTarget,
    getSafeAreaPadding,
    FontSizes,
    Spacing,
    BorderRadius,
    isPortrait,
    isLandscape,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    createResponsiveStyle,
};
