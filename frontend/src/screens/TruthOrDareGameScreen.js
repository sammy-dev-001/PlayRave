import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import truthOrDarePrompts, { getRandomTruth, getRandomDare } from '../data/truthOrDarePrompts';
import getGenderSpecificPrompt from '../data/genderSpecificPrompts';
import { COLORS } from '../constants/theme';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';

const TruthOrDareGameScreen = ({ route, navigation }) => {
    const { players, category = 'normal' } = route.params;
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [gameState, setGameState] = useState('choose'); // choose, showing
    const [currentPrompt, setCurrentPrompt] = useState(null);
    const [promptType, setPromptType] = useState(null);
    const [usedDares, setUsedDares] = useState([]);
    const [playerSkips, setPlayerSkips] = useState({});
    const [isMuted, setIsMuted] = useState(SoundService.getMuted());
    const [isHapticsEnabled, setIsHapticsEnabled] = useState(HapticService.isEnabled);
    
    // Pulsating animation state
    const [pulseAnim] = useState(new Animated.Value(1));

    React.useEffect(() => {
        if (gameState === 'choose') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [gameState]);

    const currentCategoryData = truthOrDarePrompts[category] || truthOrDarePrompts.normal;
    const totalTruths = currentCategoryData?.truths?.length || 0;
    const totalDares = currentCategoryData?.dares?.length || 0;

    const currentPlayer = players[currentPlayerIndex];

    const getCategoryColor = () => {
        switch (category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    const handleChooseTruth = () => {
        HapticService.impact('medium');
        SoundService.play('buttonClick');
        const truth = getRandomTruth(category, usedTruths);
        setUsedTruths([...usedTruths, truth]);
        setCurrentPrompt(truth);
        setPromptType('TRUTH');
        setGameState('showing');
    };

    const handleChooseDare = () => {
        HapticService.impact('medium');
        SoundService.play('buttonClick');
        const dare = getRandomDare(category, usedDares);
        const genderSpecificDare = getGenderSpecificPrompt(dare, currentPlayer.gender || 'other');
        setUsedDares([...usedDares, dare]);
        setCurrentPrompt(genderSpecificDare);
        setPromptType('DARE');
        setGameState('showing');
    };

    const handleDone = () => {
        HapticService.selection();
        // Move to next player
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextIndex);
        setGameState('choose');
        setCurrentPrompt(null);
        setPromptType(null);
    };

    const handleSkip = () => {
        HapticService.impact('light');
        const playerKey = currentPlayer.id || currentPlayerIndex;
        const currentSkips = playerSkips[playerKey] || 0;
        
        if (currentSkips >= 2) return;
        
        setPlayerSkips({
            ...playerSkips,
            [playerKey]: currentSkips + 1
        });

        if (promptType === 'TRUTH') {
            const truth = getRandomTruth(category, usedTruths);
            setUsedTruths([...usedTruths, truth]);
            setCurrentPrompt(truth);
        } else {
            const dare = getRandomDare(category, usedDares);
            const genderSpecificDare = getGenderSpecificPrompt(dare, currentPlayer.gender || 'other');
            setUsedDares([...usedDares, dare]);
            setCurrentPrompt(genderSpecificDare);
        }
    };

    const handleEndGame = () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Game',
                    onPress: () => navigation.navigate('LocalGameSelection', { players }),
                    style: 'destructive'
                }
            ]
        );
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <View style={styles.headerControls}>
                    <TouchableOpacity 
                        onPress={() => {
                            const muted = SoundService.toggleMute();
                            setIsMuted(muted);
                            HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isMuted ? "volume-mute" : "volume-high"} 
                            size={18} 
                            color={isMuted ? COLORS.hotPink : COLORS.neonCyan} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            HapticService.setEnabled(!isHapticsEnabled);
                            setIsHapticsEnabled(!isHapticsEnabled);
                            if (!isHapticsEnabled) HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isHapticsEnabled ? "notifications" : "notifications-off"} 
                            size={18} 
                            color={isHapticsEnabled ? COLORS.neonCyan : COLORS.hotPink} 
                        />
                    </TouchableOpacity>
                </View>
                <NeonText size={32} weight="bold" glow>
                    TRUTH OR DARE
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
                </View>
                <View style={styles.counterContainer}>
                    <NeonText size={12} color={COLORS.neonCyan}>Truths: {usedTruths.length}/{totalTruths}</NeonText>
                    <NeonText size={12} color={COLORS.hotPink} style={{ marginLeft: 15 }}>Dares: {usedDares.length}/{totalDares}</NeonText>
                </View>
            </View>

            {gameState === 'choose' && (
                <>
                    <View style={styles.playerContainer}>
                        <NeonText size={18} color={COLORS.neonCyan} style={styles.turnLabel}>
                            CURRENT PLAYER
                        </NeonText>
                        <NeonText size={48} weight="bold" color={COLORS.limeGlow} glow style={styles.playerName}>
                            {currentPlayer.name}
                        </NeonText>
                    </View>

                    <View style={styles.choiceContainer}>
                        <NeonText size={20} style={styles.instruction}>
                            Choose your fate:
                        </NeonText>
                        <View style={styles.buttons}>
                            <NeonButton
                                title="TRUTH"
                                onPress={handleChooseTruth}
                                style={styles.choiceButton}
                            />
                            <NeonButton
                                title="DARE"
                                onPress={handleChooseDare}
                                variant="secondary"
                                style={styles.choiceButton}
                            />
                        </View>
                    </View>
                </>
            )}

            {gameState === 'showing' && (
                <>
                    <View style={styles.promptTypeContainer}>
                        <NeonText
                            size={32}
                            weight="bold"
                            color={promptType === 'TRUTH' ? COLORS.neonCyan : COLORS.hotPink}
                            glow
                        >
                            {promptType}
                        </NeonText>
                    </View>

                    <View style={styles.promptContainer}>
                        <NeonText size={22} weight="bold" style={styles.prompt}>
                            {currentPrompt}
                        </NeonText>
                    </View>

                    <View style={styles.actionContainer}>
                        <View style={styles.actionRow}>
                            <NeonButton
                                title={`SKIP (${2 - (playerSkips[currentPlayer.id || currentPlayerIndex] || 0)})`}
                                variant="secondary"
                                onPress={handleSkip}
                                disabled={(playerSkips[currentPlayer.id || currentPlayerIndex] || 0) >= 2}
                                style={styles.skipButton}
                            />
                            <NeonButton
                                title="DONE"
                                onPress={handleDone}
                                style={styles.doneButton}
                            />
                        </View>
                        <NeonText size={14} color="#888" style={styles.nextPlayer}>
                            Next: {players[(currentPlayerIndex + 1) % players.length].name}
                        </NeonText>
                    </View>
                </>
            )}

            <NeonButton
                title="END GAME"
                variant="secondary"
                onPress={handleEndGame}
                style={styles.endButton}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    headerControls: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        gap: 8,
    },
    controlIcon: {
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryBadge: {
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    counterContainer: {
        flexDirection: 'row',
        marginTop: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
    },
    playerContainer: {
        alignItems: 'center',
        marginBottom: 50,
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
    },
    turnLabel: {
        marginBottom: 15,
        letterSpacing: 2,
    },
    playerName: {
        textAlign: 'center',
    },
    choiceContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instruction: {
        marginBottom: 30,
        textAlign: 'center',
    },
    buttons: {
        width: '100%',
        gap: 15,
    },
    choiceButton: {
        width: '100%',
    },
    promptTypeContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    promptContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    prompt: {
        textAlign: 'center',
        lineHeight: 32,
    },
    actionContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    doneButton: {
        minWidth: 140,
    },
    skipButton: {
        minWidth: 140,
    },
    nextPlayer: {
        fontStyle: 'italic',
    },
    endButton: {
        marginTop: 20,
    }
});

export default TruthOrDareGameScreen;
