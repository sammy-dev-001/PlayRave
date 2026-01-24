import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomTruth, getRandomDare } from '../data/truthOrDarePrompts';
import getGenderSpecificPrompt from '../data/genderSpecificPrompts';
import { COLORS } from '../constants/theme';

const TruthOrDareGameScreen = ({ route, navigation }) => {
    const { players, category = 'normal' } = route.params;
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [gameState, setGameState] = useState('choose'); // choose, showing
    const [currentPrompt, setCurrentPrompt] = useState(null);
    const [promptType, setPromptType] = useState(null);
    const [usedTruths, setUsedTruths] = useState([]);
    const [usedDares, setUsedDares] = useState([]);

    const currentPlayer = players[currentPlayerIndex];

    const getCategoryColor = () => {
        switch (category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    const handleChooseTruth = () => {
        const truth = getRandomTruth(category, usedTruths);
        setUsedTruths([...usedTruths, truth]);
        setCurrentPrompt(truth);
        setPromptType('TRUTH');
        setGameState('showing');
    };

    const handleChooseDare = () => {
        const dare = getRandomDare(category, usedDares);
        const genderSpecificDare = getGenderSpecificPrompt(dare, currentPlayer.gender || 'other');
        setUsedDares([...usedDares, dare]);
        setCurrentPrompt(genderSpecificDare);
        setPromptType('DARE');
        setGameState('showing');
    };

    const handleDone = () => {
        // Move to next player
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextIndex);
        setGameState('choose');
        setCurrentPrompt(null);
        setPromptType(null);
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
                <NeonText size={32} weight="bold" glow>
                    TRUTH OR DARE
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
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
                        <NeonButton
                            title="DONE"
                            onPress={handleDone}
                            style={styles.doneButton}
                        />
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
    },
    categoryBadge: {
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
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
    doneButton: {
        minWidth: 200,
        marginBottom: 15,
    },
    nextPlayer: {
        fontStyle: 'italic',
    },
    endButton: {
        marginTop: 20,
    }
});

export default TruthOrDareGameScreen;
