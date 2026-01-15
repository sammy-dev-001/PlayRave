import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
    const { user, isGuest, updateUsername, logout } = useAuth();
    const [tempName, setTempName] = React.useState('');

    const {
        theme,
        currentThemeId,
        setTheme,
        availableThemes,
        gameSettings,
        updateGameSettings,
        COLORS
    } = useTheme();

    const timerOptions = [
        { label: 'Unlimited', value: 0 },
        { label: '30 sec', value: 30 },
        { label: '60 sec', value: 60 },
        { label: '90 sec', value: 90 },
        { label: '2 min', value: 120 },
    ];

    const handleTimerChange = (gameType, value) => {
        updateGameSettings(gameType, { turnTimer: value });
    };

    const renderThemeOption = (themeOption) => {
        const isSelected = currentThemeId === themeOption.id;

        return (
            <TouchableOpacity
                key={themeOption.id}
                style={[
                    styles.themeOption,
                    {
                        borderColor: isSelected ? theme.colors.primary : '#333',
                        backgroundColor: isSelected ? `${theme.colors.primary}20` : 'transparent'
                    }
                ]}
                onPress={() => setTheme(themeOption.id)}
            >
                <View style={[styles.themePreview, { backgroundColor: themeOption.preview }]} />
                <NeonText size={16}>{themeOption.emoji} {themeOption.name}</NeonText>
                {isSelected && (
                    <NeonText size={12} color={theme.colors.primary}>✓</NeonText>
                )}
            </TouchableOpacity>
        );
    };

    const renderTimerSelector = (gameType, label) => {
        const currentValue = gameSettings[gameType]?.turnTimer || 0;

        return (
            <View style={styles.settingSection}>
                <NeonText size={14} color="#888" style={styles.settingLabel}>{label}</NeonText>
                <View style={styles.timerOptions}>
                    {timerOptions.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.timerOption,
                                currentValue === option.value && {
                                    backgroundColor: theme.colors.primary,
                                    borderColor: theme.colors.primary
                                }
                            ]}
                            onPress={() => handleTimerChange(gameType, option.value)}
                        >
                            <NeonText
                                size={12}
                                color={currentValue === option.value ? '#000' : '#fff'}
                            >
                                {option.label}
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.container}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    Settings
                </NeonText>

                {/* Profile Section */}
                <View style={styles.section}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>👤 Profile</NeonText>
                    <View style={styles.settingSection}>
                        <NeonText size={14} color="#888" style={styles.settingLabel}>Username</NeonText>
                        <TextInput
                            style={styles.input}
                            value={tempName || user?.username}
                            onChangeText={setTempName}
                            onEndEditing={() => {
                                if (tempName && tempName.trim() !== user?.username) {
                                    updateUsername(tempName.trim());
                                    setTempName('');
                                }
                            }}
                            placeholder="Enter Name"
                            placeholderTextColor="#555"
                        />
                    </View>
                    {isGuest && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={() => {
                                Alert.alert("Reset Data?", "This will clear all stats and progress.", [
                                    { text: "Cancel" },
                                    {
                                        text: "Reset", style: 'destructive', onPress: async () => {
                                            await logout();
                                            navigation.navigate('Auth');
                                        }
                                    }
                                ]);
                            }}
                        >
                            <NeonText size={14} color={COLORS.hotPink}>⚠️ Reset Data</NeonText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                        🎨 Theme
                    </NeonText>
                    <View style={styles.themeGrid}>
                        {availableThemes.map(renderThemeOption)}
                    </View>
                </View>

                {/* Game Timers Section */}
                <View style={styles.section}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                        ⏱️ Turn Timers
                    </NeonText>

                    {renderTimerSelector('scrabble', 'Scrabble Turn Timer')}
                    {renderTimerSelector('truthOrDare', 'Truth or Dare Timer')}

                    <View style={styles.settingSection}>
                        <NeonText size={14} color="#888" style={styles.settingLabel}>
                            Trivia Question Timer
                        </NeonText>
                        <View style={styles.timerOptions}>
                            {[10, 15, 20, 30].map(seconds => (
                                <TouchableOpacity
                                    key={seconds}
                                    style={[
                                        styles.timerOption,
                                        gameSettings.trivia?.questionTimer === seconds && {
                                            backgroundColor: theme.colors.primary,
                                            borderColor: theme.colors.primary
                                        }
                                    ]}
                                    onPress={() => updateGameSettings('trivia', { questionTimer: seconds })}
                                >
                                    <NeonText
                                        size={12}
                                        color={gameSettings.trivia?.questionTimer === seconds ? '#000' : '#fff'}
                                    >
                                        {seconds}s
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* General Settings */}
                <View style={styles.section}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                        ⚙️ General
                    </NeonText>

                    <View style={styles.toggleRow}>
                        <NeonText size={14}>Sound Effects</NeonText>
                        <Switch
                            value={gameSettings.general?.soundEnabled ?? true}
                            onValueChange={(value) => updateGameSettings('general', { soundEnabled: value })}
                            trackColor={{ false: '#333', true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <NeonText size={14}>Vibration</NeonText>
                        <Switch
                            value={gameSettings.general?.vibrationEnabled ?? true}
                            onValueChange={(value) => updateGameSettings('general', { vibrationEnabled: value })}
                            trackColor={{ false: '#333', true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoSection}>
                    <NeonText size={12} color="#666" style={styles.infoText}>
                        Theme and settings are saved automatically.
                    </NeonText>
                </View>
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 15,
    },
    themeGrid: {
        gap: 10,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        gap: 15,
    },
    themePreview: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    settingSection: {
        marginBottom: 15,
    },
    settingLabel: {
        marginBottom: 10,
    },
    timerOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timerOption: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#444',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    infoSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    infoText: {
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    resetButton: {
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 63, 164, 0.3)',
        borderRadius: 8,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        marginTop: 10,
    },
});

export default SettingsScreen;
