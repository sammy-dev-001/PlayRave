import React, { useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomQuestion } from '../data/wouldYouRatherQuestions';
import { COLORS } from '../constants/theme';

const WouldYouRatherScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [currentQuestion, setCurrentQuestion] = useState(getRandomQuestion());
    const [usedQuestions, setUsedQuestions] = useState([currentQuestion.id]);
    const [votes, setVotes] = useState({ A: [], B: [] });
    const [showResults, setShowResults] = useState(false);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

    const currentPlayer = players[currentPlayerIndex];

    const handleVote = (option) => {
        const newVotes = { ...votes };
        newVotes[option].push(currentPlayer.name);
        setVotes(newVotes);

        // Move to next player
        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(currentPlayerIndex + 1);
        } else {
            // All voted, show results
            setShowResults(true);
        }
    };

    const handleNextQuestion = () => {
        const nextQuestion = getRandomQuestion(usedQuestions);
        setCurrentQuestion(nextQuestion);
        setUsedQuestions([...usedQuestions, nextQuestion.id]);
        setVotes({ A: [], B: [] });
        setShowResults(false);
        setCurrentPlayerIndex(0);
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    if (showResults) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.header}>
                    <NeonText size={28} weight="bold" glow>
                        RESULTS
                    </NeonText>
                </View>

                <View style={styles.resultsContainer}>
                    <View style={[styles.optionCard, { borderColor: COLORS.neonCyan }]}>
                        <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                            OPTION A
                        </NeonText>
                        <NeonText size={16} style={styles.optionText}>
                            {currentQuestion.optionA}
                        </NeonText>
                        <NeonText size={24} weight="bold" color={COLORS.limeGlow}>
                            {votes.A.length} votes
                        </NeonText>
                        {votes.A.map((name, i) => (
                            <NeonText key={i} size={14} color="#888">
                                • {name}
                            </NeonText>
                        ))}
                    </View>

                    <NeonText size={32} color={COLORS.white}>VS</NeonText>

                    <View style={[styles.optionCard, { borderColor: COLORS.hotPink }]}>
                        <NeonText size={18} weight="bold" color={COLORS.hotPink}>
                            OPTION B
                        </NeonText>
                        <NeonText size={16} style={styles.optionText}>
                            {currentQuestion.optionB}
                        </NeonText>
                        <NeonText size={24} weight="bold" color={COLORS.limeGlow}>
                            {votes.B.length} votes
                        </NeonText>
                        {votes.B.map((name, i) => (
                            <NeonText key={i} size={14} color="#888">
                                • {name}
                            </NeonText>
                        ))}
                    </View>
                </View>

                <View style={styles.actions}>
                    <NeonButton title="NEXT QUESTION" onPress={handleNextQuestion} />
                    <NeonButton title="END GAME" variant="secondary" onPress={handleEndGame} />
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow>
                    WOULD YOU RATHER
                </NeonText>
            </View>

            <View style={styles.currentPlayerContainer}>
                <NeonText size={16} color={COLORS.neonCyan}>
                    CURRENT PLAYER
                </NeonText>
                <NeonText size={32} weight="bold" color={COLORS.limeGlow} glow>
                    {currentPlayer.name}
                </NeonText>
                <NeonText size={14} color="#888">
                    {currentPlayerIndex + 1} of {players.length}
                </NeonText>
            </View>

            <View style={styles.questionContainer}>
                <NeonText size={20} weight="bold" style={styles.questionTitle}>
                    Would you rather...
                </NeonText>

                <View style={styles.optionsContainer}>
                    <NeonButton
                        title={currentQuestion.optionA}
                        onPress={() => handleVote('A')}
                        style={[styles.optionButton, { borderColor: COLORS.neonCyan }]}
                    />

                    <NeonText size={24} color={COLORS.white} style={styles.orText}>
                        OR
                    </NeonText>

                    <NeonButton
                        title={currentQuestion.optionB}
                        onPress={() => handleVote('B')}
                        variant="secondary"
                        style={[styles.optionButton, { borderColor: COLORS.hotPink }]}
                    />
                </View>
            </View>

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
        marginBottom: 30,
    },
    currentPlayerContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        marginBottom: 30,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    questionTitle: {
        textAlign: 'center',
        marginBottom: 30,
    },
    optionsContainer: {
        gap: 20,
    },
    optionButton: {
        minHeight: 80,
        borderWidth: 2,
    },
    orText: {
        textAlign: 'center',
        marginVertical: 10,
    },
    resultsContainer: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
    },
    optionCard: {
        width: '100%',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        gap: 10,
    },
    optionText: {
        textAlign: 'center',
        marginVertical: 10,
    },
    actions: {
        gap: 10,
        marginTop: 20,
    },
    endButton: {
        marginTop: 20,
    }
});

export default WouldYouRatherScreen;
