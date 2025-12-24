import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS, SHADOWS } from '../constants/theme';

// Default settings for different game types
const DEFAULT_SETTINGS = {
    trivia: {
        questionCount: 5,
        timePerQuestion: 15,
        difficulty: 'mixed',
    },
    'myth-or-fact': {
        statementCount: 5,
        timePerStatement: 15,
    },
    'neon-tap': {
        roundCount: 10,
        delayBetweenRounds: 2,
    },
    'word-rush': {
        timeLimit: 10,
    },
    'rapid-fire': {
        timePerQuestion: 5,
        roundCount: 10,
    },
    'speed-categories': {
        timeLimit: 10,
        roundCount: 10,
        difficulty: 'all',
    },
    'caption-this': {
        captionTime: 30,
        roundCount: 5,
    }
};

const GameSettingsModal = ({
    visible,
    onClose,
    onSave,
    gameType = 'trivia',
    initialSettings = {}
}) => {
    const defaults = DEFAULT_SETTINGS[gameType] || {};
    const [settings, setSettings] = useState({ ...defaults, ...initialSettings });

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleReset = () => {
        setSettings({ ...defaults });
    };

    // Render a slider-like number picker
    const renderNumberPicker = (label, key, min, max, step = 1, suffix = '') => {
        const value = settings[key] ?? defaults[key] ?? min;

        return (
            <View style={styles.settingRow}>
                <NeonText size={14}>{label}</NeonText>
                <View style={styles.numberPicker}>
                    <TouchableOpacity
                        style={styles.pickerBtn}
                        onPress={() => updateSetting(key, Math.max(min, value - step))}
                    >
                        <NeonText size={20} color={COLORS.hotPink}>-</NeonText>
                    </TouchableOpacity>
                    <View style={styles.pickerValue}>
                        <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                            {value}{suffix}
                        </NeonText>
                    </View>
                    <TouchableOpacity
                        style={styles.pickerBtn}
                        onPress={() => updateSetting(key, Math.min(max, value + step))}
                    >
                        <NeonText size={20} color={COLORS.limeGlow}>+</NeonText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Render difficulty selector
    const renderDifficultyPicker = (key) => {
        const options = ['easy', 'medium', 'hard', 'mixed'];
        const current = settings[key] ?? 'mixed';

        return (
            <View style={styles.settingRow}>
                <NeonText size={14}>Difficulty</NeonText>
                <View style={styles.optionPicker}>
                    {options.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[
                                styles.optionBtn,
                                current === opt && styles.optionBtnActive
                            ]}
                            onPress={() => updateSetting(key, opt)}
                        >
                            <NeonText
                                size={12}
                                color={current === opt ? COLORS.limeGlow : '#888'}
                            >
                                {opt.toUpperCase()}
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // Render settings based on game type
    const renderGameSettings = () => {
        switch (gameType) {
            case 'trivia':
                return (
                    <>
                        {renderNumberPicker('Questions', 'questionCount', 3, 20)}
                        {renderNumberPicker('Time per Question', 'timePerQuestion', 5, 60, 5, 's')}
                        {renderDifficultyPicker('difficulty')}
                    </>
                );

            case 'myth-or-fact':
                return (
                    <>
                        {renderNumberPicker('Statements', 'statementCount', 3, 15)}
                        {renderNumberPicker('Time per Statement', 'timePerStatement', 5, 30, 5, 's')}
                    </>
                );

            case 'neon-tap':
                return (
                    <>
                        {renderNumberPicker('Rounds', 'roundCount', 5, 20)}
                        {renderNumberPicker('Delay Between Rounds', 'delayBetweenRounds', 1, 5, 1, 's')}
                    </>
                );

            case 'word-rush':
                return (
                    <>
                        {renderNumberPicker('Time Limit', 'timeLimit', 5, 20, 5, 's')}
                    </>
                );

            case 'rapid-fire':
                return (
                    <>
                        {renderNumberPicker('Time per Question', 'timePerQuestion', 3, 10, 1, 's')}
                        {renderNumberPicker('Rounds', 'roundCount', 5, 20)}
                    </>
                );

            case 'speed-categories':
                return (
                    <>
                        {renderNumberPicker('Time Limit', 'timeLimit', 5, 15, 5, 's')}
                        {renderNumberPicker('Rounds', 'roundCount', 5, 15)}
                        {renderDifficultyPicker('difficulty')}
                    </>
                );

            case 'caption-this':
                return (
                    <>
                        {renderNumberPicker('Caption Time', 'captionTime', 15, 60, 15, 's')}
                        {renderNumberPicker('Rounds', 'roundCount', 3, 10)}
                    </>
                );

            default:
                return (
                    <NeonText size={14} color="#888" style={styles.noSettings}>
                        No customization options available for this game.
                    </NeonText>
                );
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <NeonText size={22} weight="bold" glow color={COLORS.neonCyan}>
                                    ⚙️ GAME SETTINGS
                                </NeonText>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <NeonText size={24} color={COLORS.hotPink}>✕</NeonText>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.settingsContainer}>
                                {renderGameSettings()}
                            </ScrollView>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={styles.resetBtn}
                                    onPress={handleReset}
                                >
                                    <NeonText size={14} color={COLORS.hotPink}>
                                        RESET TO DEFAULT
                                    </NeonText>
                                </TouchableOpacity>
                            </View>

                            <NeonButton
                                title="SAVE SETTINGS"
                                onPress={handleSave}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        padding: 5,
    },
    settingsContainer: {
        marginBottom: 20,
    },
    settingRow: {
        marginBottom: 20,
    },
    numberPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 5,
    },
    pickerBtn: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
    },
    pickerValue: {
        flex: 1,
        alignItems: 'center',
    },
    optionPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    optionBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#444',
    },
    optionBtnActive: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    noSettings: {
        textAlign: 'center',
        marginVertical: 30,
    },
    buttonRow: {
        alignItems: 'center',
        marginBottom: 15,
    },
    resetBtn: {
        padding: 10,
    }
});

export default GameSettingsModal;
