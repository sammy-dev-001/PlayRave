// Theme presets for PlayRave customization
// Each theme defines a complete color palette

export const FONTS = {
    // Using Outfit for body, Righteous for all bold headers, Orbitron for arcade feel
    bold: 'Righteous',    // Global header font
    regular: 'Outfit',    // Global body font
    display: 'Righteous', // Retro-futuristic party font
    arcade: 'Orbitron',   // High-tech sci-fi gaming font
};

export const SHADOWS = {
    neonGlow: {
        shadowColor: '#00F8FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    purpleGlow: {
        shadowColor: '#B14EFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
};

export const THEME_PRESETS = {
    neon: {
        id: 'neon',
        name: 'Neon',
        emoji: '🌃',
        backgroundImage: require('../../assets/images/neon_background.png'),
        colors: {
            primary: '#C6FF4A',        // Lime glow
            secondary: '#00F8FF',       // Neon cyan
            accent: '#FF3FA4',          // Hot pink
            tertiary: '#B14EFF',        // Electric purple
            background: '#0A0A1A',      // Deep night black
            backgroundSecondary: '#12122A',
            surface: '#111827',
            surfaceLight: 'rgba(255, 255, 255, 0.1)',
            surfaceDark: 'rgba(0, 0, 0, 0.3)',
            overlayLight: 'rgba(255, 255, 255, 0.1)',
            overlayDark: 'rgba(0, 0, 0, 0.5)',
            overlayDarker: 'rgba(0, 0, 0, 0.7)',
            textPrimary: '#FFFFFF',
            textSecondary: '#F0F0F0',
            textMuted: '#888888',
            textDarkMuted: '#666666',
            borderDefault: 'rgba(255, 255, 255, 0.2)',
            borderLight: 'rgba(255, 255, 255, 0.1)',
            success: '#4CAF50',
            error: '#FF5252',
            warning: '#FFC107',
        }
    },
    cyber: {
        id: 'cyber',
        name: 'Cyber Light',
        emoji: '☀️',
        backgroundImage: null,
        colors: {
            primary: '#0284C7',
            secondary: '#7C3AED',
            accent: '#E11D48',
            tertiary: '#16A34A',
            background: '#F8FAFC',
            backgroundSecondary: '#F1F5F9',
            surface: '#FFFFFF',
            surfaceLight: 'rgba(0, 0, 0, 0.05)',
            surfaceDark: 'rgba(0, 0, 0, 0.1)',
            overlayLight: 'rgba(255, 255, 255, 0.8)',
            overlayDark: 'rgba(0, 0, 0, 0.2)',
            overlayDarker: 'rgba(0, 0, 0, 0.4)',
            textPrimary: '#0F172A',
            textSecondary: '#334155',
            textMuted: '#64748B',
            textDarkMuted: '#94A3B8',
            borderDefault: 'rgba(0, 0, 0, 0.1)',
            borderLight: 'rgba(0, 0, 0, 0.05)',
            success: '#16A34A',
            error: '#DC2626',
            warning: '#D97706',
        }
    },
    synthwave: {
        id: 'synthwave',
        name: 'Synthwave',
        emoji: '📼',
        backgroundImage: null,
        colors: {
            primary: '#FF6B6B',
            secondary: '#4D4DFF',
            accent: '#FFD700',
            tertiary: '#00FA9A',
            background: '#2A0845',
            backgroundSecondary: '#1A0033',
            surface: '#1A0033',
            surfaceLight: 'rgba(255, 107, 107, 0.15)',
            surfaceDark: 'rgba(0, 0, 0, 0.4)',
            overlayLight: 'rgba(255, 107, 107, 0.1)',
            overlayDark: 'rgba(26, 0, 51, 0.6)',
            overlayDarker: 'rgba(26, 0, 51, 0.8)',
            textPrimary: '#FFD700',
            textSecondary: '#FF6B6B',
            textMuted: '#A06CD5',
            textDarkMuted: '#7A4988',
            borderDefault: 'rgba(255, 107, 107, 0.3)',
            borderLight: 'rgba(255, 107, 107, 0.1)',
            success: '#00FA9A',
            error: '#FF0000',
        }
    },
    'liquid-glass': {
        id: 'liquid-glass',
        name: 'Liquid Glass',
        emoji: '🫧',
        backgroundImage: null,
        isGlass: true,              // New flag consumed by GlassView
        glassTint: 'light',         // Tells BlurView to use a bright tint
        blurIntensity: 60,          // Stronger blur for true iOS glass vibe
        colors: {
            primary: '#007AFF',         // iOS Blue
            secondary: '#5856D6',       // iOS Purple
            accent: '#FF2D55',          // iOS Pink
            tertiary: '#34C759',        // iOS Green
            background: '#F2F2F7',      // iOS Light Gray base
            backgroundSecondary: '#E5E5EA',
            surface: 'rgba(255,255,255,0.65)',    // Light frosted glass
            surfaceLight: 'rgba(255,255,255,0.85)',
            surfaceDark: 'rgba(200,200,200,0.5)',
            overlayLight: 'rgba(255,255,255,0.5)',
            overlayDark: 'rgba(0,0,0,0.15)',
            overlayDarker: 'rgba(0,0,0,0.3)',
            textPrimary: '#000000',
            textSecondary: 'rgba(0,0,0,0.6)',
            textMuted: 'rgba(0,0,0,0.4)',
            textDarkMuted: 'rgba(0,0,0,0.3)',
            borderDefault: 'rgba(255,255,255,0.6)',
            borderLight: 'rgba(255,255,255,0.8)',
            success: '#34C759',
            error: '#FF3B30',
            warning: '#FFCC00',
        }
    }
};

// Default theme
export const DEFAULT_THEME = 'neon';

// Get theme by ID
export const getTheme = (themeId) => {
    return THEME_PRESETS[themeId] || THEME_PRESETS[DEFAULT_THEME];
};

// Get all theme IDs
export const getThemeIds = () => Object.keys(THEME_PRESETS);

// Convert legacy COLORS to theme-aware format (now returning all semantic tokens)
export const getLegacyColors = (theme) => ({
    electricPurple: theme.colors.tertiary,
    neonCyan: theme.colors.secondary,
    hotPink: theme.colors.accent,
    limeGlow: theme.colors.primary,
    deepNightBlack: theme.colors.background,
    darkOverlay: `${theme.colors.background}CC`,
    white: theme.colors.textPrimary,
    offWhite: theme.colors.textSecondary,
    cancelRed: theme.colors.error,
    // New Semantic Tokens
    background: theme.colors.background,
    surface: theme.colors.surface,
    surfaceLight: theme.colors.surfaceLight,
    surfaceDark: theme.colors.surfaceDark,
    overlayLight: theme.colors.overlayLight,
    overlayDark: theme.colors.overlayDark,
    overlayDarker: theme.colors.overlayDarker,
    textPrimary: theme.colors.textPrimary,
    textSecondary: theme.colors.textSecondary,
    textMuted: theme.colors.textMuted,
    textDarkMuted: theme.colors.textDarkMuted,
    borderDefault: theme.colors.borderDefault,
    borderLight: theme.colors.borderLight,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    success: theme.colors.success,
    danger: theme.colors.error,
});
