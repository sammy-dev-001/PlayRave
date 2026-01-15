// Theme presets for PlayRave customization
// Each theme defines a complete color palette

export const THEME_PRESETS = {
    neon: {
        id: 'neon',
        name: 'Neon',
        emoji: '🌃',
        colors: {
            primary: '#C6FF4A',        // Lime glow
            secondary: '#00F8FF',       // Neon cyan
            accent: '#FF3FA4',          // Hot pink
            tertiary: '#B14EFF',        // Electric purple
            background: '#0A0A1A',      // Deep night black
            backgroundSecondary: '#12122A',
            surface: 'rgba(255,255,255,0.05)',
            text: '#FFFFFF',
            textSecondary: '#888888',
            success: '#4CAF50',
            error: '#FF5252',
            warning: '#FFC107',
        }
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset',
        emoji: '🌅',
        colors: {
            primary: '#FF6B6B',         // Coral red
            secondary: '#FFE66D',        // Golden yellow
            accent: '#FF8E53',           // Orange
            tertiary: '#FEC89A',         // Peach
            background: '#1A0F1A',       // Dark purple-black
            backgroundSecondary: '#2A1F2A',
            surface: 'rgba(255,235,200,0.08)',
            text: '#FFFFFF',
            textSecondary: '#B8A090',
            success: '#98D8AA',
            error: '#FF6B6B',
            warning: '#FFE66D',
        }
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean',
        emoji: '🌊',
        colors: {
            primary: '#00CED1',          // Dark turquoise
            secondary: '#1E90FF',        // Dodger blue
            accent: '#87CEEB',           // Sky blue
            tertiary: '#48D1CC',         // Medium turquoise
            background: '#0A1520',       // Deep ocean blue
            backgroundSecondary: '#122535',
            surface: 'rgba(135,206,235,0.08)',
            text: '#FFFFFF',
            textSecondary: '#7EC8E3',
            success: '#00CED1',
            error: '#FF6B6B',
            warning: '#FFD700',
        }
    },
    forest: {
        id: 'forest',
        name: 'Forest',
        emoji: '🌲',
        colors: {
            primary: '#32CD32',          // Lime green
            secondary: '#90EE90',        // Light green
            accent: '#228B22',           // Forest green
            tertiary: '#98FB98',         // Pale green
            background: '#0A150A',       // Deep forest black
            backgroundSecondary: '#152015',
            surface: 'rgba(144,238,144,0.08)',
            text: '#FFFFFF',
            textSecondary: '#90B890',
            success: '#32CD32',
            error: '#FF6347',
            warning: '#FFD700',
        }
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight',
        emoji: '🌙',
        colors: {
            primary: '#9370DB',          // Medium purple
            secondary: '#E6E6FA',        // Lavender
            accent: '#DDA0DD',           // Plum
            tertiary: '#BA55D3',         // Medium orchid
            background: '#0F0A1A',       // Deep violet black
            backgroundSecondary: '#1A1525',
            surface: 'rgba(230,230,250,0.06)',
            text: '#FFFFFF',
            textSecondary: '#B8A8C8',
            success: '#9370DB',
            error: '#FF69B4',
            warning: '#DDA0DD',
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

// Convert legacy COLORS to theme-aware format
export const getLegacyColors = (theme) => ({
    electricPurple: theme.colors.tertiary,
    neonCyan: theme.colors.secondary,
    hotPink: theme.colors.accent,
    limeGlow: theme.colors.primary,
    deepNightBlack: theme.colors.background,
    darkOverlay: `${theme.colors.background}CC`,
    white: theme.colors.text,
    offWhite: theme.colors.textSecondary,
});
