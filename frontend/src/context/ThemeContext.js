import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_PRESETS, DEFAULT_THEME, getTheme, getLegacyColors } from '../constants/themes';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = '@playrave_theme';
const GAME_SETTINGS_KEY = '@playrave_game_settings';

// Default game settings
const DEFAULT_GAME_SETTINGS = {
    scrabble: {
        turnTimer: 0, // 0 = unlimited, otherwise seconds
        gameLength: 'standard', // 'short' | 'standard' | 'long'
    },
    truthOrDare: {
        turnTimer: 0,
    },
    trivia: {
        questionTimer: 15, // seconds per question
    },
    general: {
        soundEnabled: true,
        vibrationEnabled: true,
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentThemeId, setCurrentThemeId] = useState(DEFAULT_THEME);
    const [isLoading, setIsLoading] = useState(true);
    const [gameSettings, setGameSettings] = useState(DEFAULT_GAME_SETTINGS);

    // Load saved theme on mount
    useEffect(() => {
        loadSavedPreferences();
    }, []);

    const loadSavedPreferences = async () => {
        try {
            const [savedTheme, savedSettings] = await Promise.all([
                AsyncStorage.getItem(THEME_STORAGE_KEY),
                AsyncStorage.getItem(GAME_SETTINGS_KEY)
            ]);

            if (savedTheme && THEME_PRESETS[savedTheme]) {
                setCurrentThemeId(savedTheme);
            }

            if (savedSettings) {
                setGameSettings(prev => ({
                    ...prev,
                    ...JSON.parse(savedSettings)
                }));
            }
        } catch (error) {
            console.error('Failed to load theme preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Change theme
    const setTheme = async (themeId) => {
        if (!THEME_PRESETS[themeId]) {
            console.warn(`Theme "${themeId}" not found`);
            return;
        }

        setCurrentThemeId(themeId);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    // Update game settings
    const updateGameSettings = async (gameType, settings) => {
        const newSettings = {
            ...gameSettings,
            [gameType]: {
                ...gameSettings[gameType],
                ...settings
            }
        };
        setGameSettings(newSettings);

        try {
            await AsyncStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save game settings:', error);
        }
    };

    // Get settings for a specific game
    const getGameSettings = (gameType) => {
        return gameSettings[gameType] || {};
    };

    // Memoized current theme object
    const theme = useMemo(() => getTheme(currentThemeId), [currentThemeId]);

    // Legacy COLORS object for backward compatibility
    const COLORS = useMemo(() => getLegacyColors(theme), [theme]);

    // All available themes for UI
    const availableThemes = useMemo(() =>
        Object.values(THEME_PRESETS).map(t => ({
            id: t.id,
            name: t.name,
            emoji: t.emoji,
            preview: t.colors.primary
        })),
        []);

    const value = {
        // Theme
        theme,
        currentThemeId,
        setTheme,
        availableThemes,
        COLORS,
        isLoading,

        // Game Settings
        gameSettings,
        updateGameSettings,
        getGameSettings,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook for just colors (convenience)
export const useColors = () => {
    const { theme } = useTheme();
    return theme.colors;
};

// Hook for game settings
export const useGameSettings = (gameType) => {
    const { getGameSettings, updateGameSettings } = useTheme();
    return {
        settings: getGameSettings(gameType),
        updateSettings: (newSettings) => updateGameSettings(gameType, newSettings)
    };
};

export default ThemeContext;
