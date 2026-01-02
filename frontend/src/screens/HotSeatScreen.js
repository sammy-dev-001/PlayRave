import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const HotSeatScreen = ({ route, navigation }) => {
    const { room, playerName, isHost } = route.params;
    const [gameState, setGameState] = useState(route.params.initialGameState || null);
    const [questionInput, setQuestionInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const onStateUpdate = (state) => {
            console.log('Hot seat state update:', state);
            setGameState(state);
        };

        const onAnsweringStarted = () => {
            console.log('All questions submitted, answering phase started');
        };

        const onNewPlayer = (state) => {
            console.log('New hot seat player:', state);
            setGameState(state);
            setQuestionInput('');
        };

        const onGameFinished = ({ message }) => {
            Alert.alert('🎉 Game Complete!', message, [
                { text: 'Back to Lobby', onPress: () => navigation.navigate('Lobby', { room, playerName }) }
            ]);
        };

        SocketService.on('hot-seat-state-update', onStateUpdate);
        SocketService.on('hot-seat-answering-started', onAnsweringStarted);
        SocketService.on('hot-seat-new-player', onNewPlayer);
        SocketService.on('hot-seat-game-finished', onGameFinished);

        return () => {
            SocketService.off('hot-seat-state-update', onStateUpdate);
            SocketService.off('hot-seat-answering-started', onAnsweringStarted);
            SocketService.off('hot-seat-new-player', onNewPlayer);
            SocketService.off('hot-seat-game-finished', onGameFinished);
        };
    }, [navigation, room, playerName]);

    const handleSubmitQuestion = () => {
        if (!questionInput.trim()) {
            Alert.alert('Empty Question', 'Please enter a question!');
            return;
        }
        setIsSubmitting(true);
        SocketService.emit('hot-seat-submit-question', {
            roomId: room.id,
            question: questionInput.trim()
        });
    };

    const handleNextQuestion = () => {
        SocketService.emit('hot-seat-next-question', { roomId: room.id });
    };

    const handleEndGame = () => {
        Alert.alert('End Game', 'Are you sure you want to end the game?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'End Game', style: 'destructive', onPress: () => {
                    SocketService.emit('hot-seat-end-game', { roomId: room.id });
                }
            }
        ]);
    };

    if (!gameState) {
        return (
            <NeonContainer>
                <View style={styles.center}>
                    <NeonText size={24}>Loading...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    const { isHotSeat, hotSeatPlayerName, phase, questions, currentQuestionIndex, hasSubmitted, submittedCount, totalExpected, round } = gameState;

    // Submitting Phase - Players enter questions
    if (phase === 'submitting') {
        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>ROUND {round}</NeonText>
                    <NeonText size={28} weight="bold" glow>🔥 HOT SEAT 🔥</NeonText>
                </View>

                <View style={styles.hotSeatPlayerCard}>
                    <NeonText size={14} color="#888">IN THE HOT SEAT:</NeonText>
                    <NeonText size={32} weight="bold" glow color={COLORS.neonCyan}>
                        {hotSeatPlayerName}
                    </NeonText>
                </View>

                {isHotSeat ? (
                    <View style={styles.waitingView}>
                        <NeonText size={48}>🪑</NeonText>
                        <NeonText size={20} weight="bold" style={styles.marginTop}>
                            You're in the hot seat!
                        </NeonText>
                        <NeonText size={14} color="#888" style={styles.marginTop}>
                            Waiting for others to submit questions for you...
                        </NeonText>
                        <View style={styles.progressContainer}>
                            <NeonText size={16} color={COLORS.limeGlow}>
                                {submittedCount} / {totalExpected} questions received
                            </NeonText>
                        </View>
                    </View>
                ) : (
                    <View style={styles.questionInputView}>
                        {hasSubmitted ? (
                            <View style={styles.submittedView}>
                                <NeonText size={48}>✅</NeonText>
                                <NeonText size={18} weight="bold" style={styles.marginTop}>
                                    Question Submitted!
                                </NeonText>
                                <NeonText size={14} color="#888" style={styles.marginTop}>
                                    Waiting for others... ({submittedCount}/{totalExpected})
                                </NeonText>
                            </View>
                        ) : (
                            <>
                                <NeonText size={16} style={styles.label}>
                                    Ask {hotSeatPlayerName} a question:
                                </NeonText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your question..."
                                    placeholderTextColor="#666"
                                    value={questionInput}
                                    onChangeText={setQuestionInput}
                                    multiline
                                    maxLength={200}
                                />
                                <NeonButton
                                    title="SUBMIT QUESTION"
                                    onPress={handleSubmitQuestion}
                                    disabled={isSubmitting || !questionInput.trim()}
                                />
                            </>
                        )}
                    </View>
                )}

                {isHost && (
                    <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
                        <NeonText size={14} color={COLORS.hotPink}>End Game</NeonText>
                    </TouchableOpacity>
                )}
            </NeonContainer>
        );
    }

    // Answering Phase - Hot seat player sees and answers questions
    if (phase === 'answering') {
        const currentQuestion = questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex >= questions.length - 1;

        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>ROUND {round}</NeonText>
                    <NeonText size={28} weight="bold" glow>🔥 HOT SEAT 🔥</NeonText>
                </View>

                <View style={styles.hotSeatPlayerCard}>
                    <NeonText size={14} color="#888">ANSWERING:</NeonText>
                    <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                        {hotSeatPlayerName}
                    </NeonText>
                </View>

                <View style={styles.questionProgress}>
                    <NeonText size={14} color="#888">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </NeonText>
                </View>

                {currentQuestion && (
                    <View style={styles.questionCard}>
                        <NeonText size={12} color={COLORS.electricPurple}>
                            FROM: {currentQuestion.fromPlayerName}
                        </NeonText>
                        <NeonText size={22} weight="bold" style={styles.questionText}>
                            "{currentQuestion.question}"
                        </NeonText>
                    </View>
                )}

                {isHotSeat && (
                    <NeonText size={14} color={COLORS.limeGlow} style={styles.answerPrompt}>
                        Answer this question out loud! 🎤
                    </NeonText>
                )}

                <NeonButton
                    title={isLastQuestion ? "NEXT PLAYER" : "NEXT QUESTION"}
                    onPress={handleNextQuestion}
                    style={styles.nextButton}
                />

                {isHost && (
                    <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
                        <NeonText size={14} color={COLORS.hotPink}>End Game</NeonText>
                    </TouchableOpacity>
                )}
            </NeonContainer>
        );
    }

    // Fallback
    return (
        <NeonContainer>
            <View style={styles.center}>
                <NeonText size={24}>Game in progress...</NeonText>
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    hotSeatPlayerCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    waitingView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    questionInputView: {
        flex: 1,
        paddingHorizontal: 10,
    },
    submittedView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        padding: 15,
        fontSize: 16,
        color: COLORS.white,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    marginTop: {
        marginTop: 15,
    },
    progressContainer: {
        marginTop: 30,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    questionCard: {
        backgroundColor: 'rgba(148, 0, 211, 0.15)',
        borderRadius: 16,
        padding: 25,
        marginVertical: 20,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        alignItems: 'center',
    },
    questionText: {
        marginTop: 15,
        textAlign: 'center',
        lineHeight: 30,
    },
    questionProgress: {
        alignItems: 'center',
        marginBottom: 10,
    },
    answerPrompt: {
        textAlign: 'center',
        marginBottom: 20,
    },
    nextButton: {
        marginTop: 10,
    },
    endButton: {
        alignItems: 'center',
        marginTop: 30,
        padding: 10,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HotSeatScreen;
