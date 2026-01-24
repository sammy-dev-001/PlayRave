import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const MythOrFactQuestionScreen = ({ route, navigation }) => {
    const { room, statement, statementIndex, hostParticipates, isHost } = route.params;
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const canAnswer = !isHost || hostParticipates;

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasSubmitted && canAnswer) {
                        // Auto-submit selected answer (or null if nothing selected)
                        handleSubmitAnswer(selectedAnswer);
                    }

                    setTimeout(() => {
                        console.log('Timer ended, auto-showing results');
                        SocketService.emit('show-myth-or-fact-results', { roomId: room.id });
                    }, 2000);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const onResults = (results) => {
            console.log('Myth or Fact results received:', results);
            navigation.navigate('MythOrFactResults', { room, results, hostParticipates, isHost });
        };

        const onNextStatement = ({ statement: nextStatement }) => {
            console.log('Next statement ready:', nextStatement);
            navigation.replace('MythOrFactQuestion', {
                room,
                statement: nextStatement,
                statementIndex: nextStatement.statementIndex,
                hostParticipates,
                isHost
            });
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('myth-or-fact-results', onResults);
        SocketService.on('next-myth-or-fact-statement-ready', onNextStatement);
        SocketService.on('game-finished', onGameFinished);

        return () => {
            clearInterval(timer);
            SocketService.off('myth-or-fact-results', onResults);
            SocketService.off('next-myth-or-fact-statement-ready', onNextStatement);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [navigation, room, hasSubmitted, canAnswer]);

    const handleSelectAnswer = (answer) => {
        if (hasSubmitted || !canAnswer) return;
        setSelectedAnswer(answer);
    };

    const handleSubmitAnswer = (answer) => {
        if (hasSubmitted || !canAnswer) return;

        const finalAnswer = answer !== undefined ? answer : selectedAnswer;
        setSelectedAnswer(finalAnswer);
        setHasSubmitted(true);

        console.log('Submitting myth or fact answer:', finalAnswer);
        SocketService.emit('submit-myth-or-fact-answer', { roomId: room.id, answer: finalAnswer });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    STATEMENT {statementIndex + 1} / {statement.totalStatements}
                </NeonText>
                <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                    {timeLeft}s
                </NeonText>
            </View>

            <View style={styles.statementContainer}>
                <NeonText size={24} weight="bold" style={styles.statement}>
                    {statement.statement}
                </NeonText>
                {statement.category && (
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.category}>
                        {statement.category}
                    </NeonText>
                )}
            </View>

            {canAnswer ? (
                <>
                    <View style={styles.buttonsContainer}>
                        <NeonButton
                            title="MYTH 🚫"
                            variant={selectedAnswer === false ? 'primary' : 'secondary'}
                            onPress={() => handleSelectAnswer(false)}
                            style={[styles.answerButton, styles.mythButton]}
                            disabled={hasSubmitted}
                        />
                        <NeonButton
                            title="FACT ✓"
                            variant={selectedAnswer === true ? 'primary' : 'secondary'}
                            onPress={() => handleSelectAnswer(true)}
                            style={[styles.answerButton, styles.factButton]}
                            disabled={hasSubmitted}
                        />
                    </View>

                    {selectedAnswer !== null && !hasSubmitted && (
                        <NeonButton
                            title="SUBMIT ANSWER"
                            onPress={() => handleSubmitAnswer()}
                            style={styles.submitButton}
                        />
                    )}

                    {hasSubmitted && (
                        <NeonText style={styles.submittedText}>
                            Answer submitted! Waiting for others...
                        </NeonText>
                    )}
                </>
            ) : (
                <NeonText style={styles.spectatorText}>
                    (Spectating - answers disabled)
                </NeonText>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    statementContainer: {
        marginBottom: 50,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    statement: {
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 32,
    },
    category: {
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    buttonsContainer: {
        gap: 20,
    },
    answerButton: {
        width: '100%',
        paddingVertical: 20,
    },
    mythButton: {
        borderColor: COLORS.hotPink,
    },
    factButton: {
        borderColor: COLORS.limeGlow,
    },
    submitButton: {
        marginTop: 20,
    },
    submittedText: {
        textAlign: 'center',
        marginTop: 30,
        fontStyle: 'italic',
        color: COLORS.limeGlow,
    },
    spectatorText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: '#888',
        fontSize: 14,
    }
});

export default MythOrFactQuestionScreen;
