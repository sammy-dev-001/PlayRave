import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const QuestionScreen = ({ route, navigation }) => {
    const { room, question, questionIndex, hostParticipates, isHost } = route.params;
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Check if current user should be able to answer
    const canAnswer = !isHost || hostParticipates;

    useEffect(() => {
        // Timer countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasSubmitted && canAnswer) {
                        // Auto-submit selected answer (or null if nothing selected)
                        handleSubmitAnswer(selectedAnswer);
                    }

                    // Auto-show results after 2 seconds when timer runs out
                    setTimeout(() => {
                        console.log('Timer ended, auto-showing results');
                        SocketService.emit('show-results', { roomId: room.id });
                    }, 2000);

                    return 0;
                }
                // Play tick sound in last 3 seconds
                if (prev <= 4 && prev > 1) {
                    SoundService.playTick();
                }
                return prev - 1;
            });
        }, 1000);

        // Listen for results
        const onQuestionResults = (results) => {
            console.log('Question results received:', results);
            navigation.navigate('Results', { room, results, hostParticipates, isHost });
        };

        const onNextQuestionReady = ({ question: nextQuestion }) => {
            console.log('Next question ready:', nextQuestion);
            navigation.replace('Question', {
                room,
                question: nextQuestion,
                questionIndex: nextQuestion.questionIndex,
                hostParticipates,
                isHost
            });
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('question-results', onQuestionResults);
        SocketService.on('next-question-ready', onNextQuestionReady);
        SocketService.on('game-finished', onGameFinished);

        return () => {
            clearInterval(timer);
            SocketService.off('question-results', onQuestionResults);
            SocketService.off('next-question-ready', onNextQuestionReady);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [navigation, room, hasSubmitted, canAnswer]);

    const handleSelectAnswer = (answerIndex) => {
        if (hasSubmitted || !canAnswer) return;
        setSelectedAnswer(answerIndex);
    };

    const handleSubmitAnswer = (answerIndex) => {
        if (hasSubmitted || !canAnswer) return;

        const finalAnswer = answerIndex !== undefined ? answerIndex : selectedAnswer;
        setSelectedAnswer(finalAnswer);
        setHasSubmitted(true);

        console.log('Submitting answer:', finalAnswer);
        SocketService.emit('submit-answer', { roomId: room.id, answerIndex: finalAnswer });
    };

    return (
        <NeonContainer showMuteButton showBackButton>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    QUESTION {questionIndex + 1} / {question.totalQuestions}
                </NeonText>
                <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                    {timeLeft}s
                </NeonText>
            </View>

            <View style={styles.questionContainer}>
                <NeonText size={24} weight="bold" style={styles.question}>
                    {question.question}
                </NeonText>
                {question.category && (
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.category}>
                        {question.category}
                    </NeonText>
                )}
            </View>

            <View style={styles.optionsContainer}>
                {question.options.map((option, index) => (
                    <NeonButton
                        key={index}
                        title={option}
                        variant={selectedAnswer === index ? 'primary' : 'secondary'}
                        onPress={() => handleSelectAnswer(index)}
                        style={styles.optionButton}
                        disabled={hasSubmitted}
                    />
                ))}
            </View>

            {selectedAnswer !== null && !hasSubmitted && canAnswer && (
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

            {!canAnswer && !hasSubmitted && (
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
    questionContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    question: {
        textAlign: 'center',
        marginBottom: 10,
    },
    category: {
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionsContainer: {
        gap: 15,
    },
    optionButton: {
        width: '100%',
    },
    submitButton: {
        marginTop: 20,
    },
    submittedText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: COLORS.limeGlow,
    },
    spectatorText: {
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
        color: '#888',
        fontSize: 14,
    }
});

export default QuestionScreen;
