import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Appearance, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_KEY = '@playrave_accessibility';

// Default accessibility settings
const defaultSettings = {
    // Visual
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'

    // Audio
    screenReaderEnabled: false,
    soundEffects: true,
    hapticFeedback: true,

    // Interaction
    extendedTimers: false, // +50% time on timed games
    simplifiedControls: false,
    autoAdvance: true,
};

// Context for accessibility settings
const AccessibilityContext = createContext();

export const useAccessibility = () => useContext(AccessibilityContext);

// Accessibility Provider Component
export const AccessibilityProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

    useEffect(() => {
        loadSettings();
        setupSystemListeners();
    }, []);

    const loadSettings = async () => {
        try {
            const json = await AsyncStorage.getItem(ACCESSIBILITY_KEY);
            if (json) {
                setSettings(prev => ({ ...prev, ...JSON.parse(json) }));
            }
        } catch (error) {
            console.error('Error loading accessibility settings:', error);
        }
    };

    const setupSystemListeners = async () => {
        // Check if screen reader is enabled
        try {
            const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
            setIsScreenReaderEnabled(screenReaderEnabled);

            // Listen for changes
            AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
                setIsScreenReaderEnabled(enabled);
                updateSetting('screenReaderEnabled', enabled);
            });

            // Check for reduced motion preference
            if (Platform.OS !== 'web') {
                const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
                if (reduceMotion) {
                    updateSetting('reducedMotion', true);
                }
            }
        } catch (error) {
            console.log('Accessibility API not available:', error);
        }
    };

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await AsyncStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving accessibility settings:', error);
        }
    };

    const resetSettings = async () => {
        setSettings(defaultSettings);
        try {
            await AsyncStorage.removeItem(ACCESSIBILITY_KEY);
        } catch (error) {
            console.error('Error resetting accessibility settings:', error);
        }
    };

    // Get adjusted time for timed games
    const getAdjustedTime = (baseTime) => {
        if (settings.extendedTimers) {
            return Math.round(baseTime * 1.5); // 50% more time
        }
        return baseTime;
    };

    // Get color based on color blind mode
    const getAccessibleColor = (color) => {
        if (settings.colorBlindMode === 'none') return color;

        // Color blind friendly alternatives
        const colorMappings = {
            protanopia: {
                '#FF3FA4': '#0077B6', // Pink -> Blue
                '#C6FF4A': '#FFD60A', // Green -> Yellow
                '#00F8FF': '#00F8FF', // Cyan stays
            },
            deuteranopia: {
                '#FF3FA4': '#9D4EDD', // Pink -> Purple
                '#C6FF4A': '#FFD60A', // Green -> Yellow
                '#00F8FF': '#00F8FF', // Cyan stays
            },
            tritanopia: {
                '#FF3FA4': '#FF3FA4', // Pink stays
                '#C6FF4A': '#90E0EF', // Green -> Light blue
                '#00F8FF': '#FB5607', // Cyan -> Orange
            }
        };

        const mapping = colorMappings[settings.colorBlindMode];
        return mapping?.[color] || color;
    };

    // Get font size multiplier
    const getFontSizeMultiplier = () => {
        return settings.largeText ? 1.3 : 1;
    };

    // Check if animations should be reduced
    const shouldReduceMotion = () => {
        return settings.reducedMotion;
    };

    // Announce for screen readers
    const announce = (message) => {
        if (isScreenReaderEnabled || settings.screenReaderEnabled) {
            AccessibilityInfo.announceForAccessibility(message);
        }
    };

    const value = {
        settings,
        updateSetting,
        resetSettings,
        isScreenReaderEnabled,
        getAdjustedTime,
        getAccessibleColor,
        getFontSizeMultiplier,
        shouldReduceMotion,
        announce,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
};

// Accessibility Settings UI Component
export const AccessibilitySettings = ({ onClose }) => {
    const {
        settings,
        updateSetting,
        resetSettings,
        isScreenReaderEnabled
    } = useAccessibility();

    const renderToggle = (label, key, description) => (
        <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
                <NeonText size={14}>{label}</NeonText>
                {description && (
                    <NeonText size={10} color="#888">{description}</NeonText>
                )}
            </View>
            <TouchableOpacity
                style={[
                    styles.toggle,
                    settings[key] && styles.toggleActive
                ]}
                onPress={() => updateSetting(key, !settings[key])}
                accessibilityRole="switch"
                accessibilityState={{ checked: settings[key] }}
                accessibilityLabel={label}
            >
                <View style={[
                    styles.toggleThumb,
                    settings[key] && styles.toggleThumbActive
                ]} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText size={20} weight="bold">♿ ACCESSIBILITY</NeonText>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <NeonText size={12} color={COLORS.neonCyan} style={styles.sectionTitle}>
                        VISUAL
                    </NeonText>
                    {renderToggle('High Contrast', 'highContrast', 'Increase color contrast')}
                    {renderToggle('Large Text', 'largeText', 'Increase text size by 30%')}
                    {renderToggle('Reduce Motion', 'reducedMotion', 'Minimize animations')}
                </View>

                <View style={styles.section}>
                    <NeonText size={12} color={COLORS.neonCyan} style={styles.sectionTitle}>
                        AUDIO & HAPTICS
                    </NeonText>
                    {renderToggle('Sound Effects', 'soundEffects')}
                    {renderToggle('Haptic Feedback', 'hapticFeedback', 'Vibration on buttons')}
                </View>

                <View style={styles.section}>
                    <NeonText size={12} color={COLORS.neonCyan} style={styles.sectionTitle}>
                        GAMEPLAY
                    </NeonText>
                    {renderToggle('Extended Timers', 'extendedTimers', '50% extra time on timed games')}
                    {renderToggle('Simplified Controls', 'simplifiedControls', 'Larger touch targets')}
                </View>

                <TouchableOpacity style={styles.resetBtn} onPress={resetSettings}>
                    <NeonText size={12} color={COLORS.hotPink}>
                        Reset to Defaults
                    </NeonText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

// Import necessary components for the settings UI
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        marginBottom: 15,
        letterSpacing: 1,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    settingInfo: {
        flex: 1,
        marginRight: 15,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: COLORS.limeGlow,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        marginLeft: 'auto',
    },
    resetBtn: {
        alignItems: 'center',
        padding: 15,
        marginTop: 10,
    }
});

export default AccessibilityProvider;
