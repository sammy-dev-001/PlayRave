import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { COLORS } from '../constants/theme';

const HotSeatScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [gameState, setGameState] = useState(initialGameState || null);
    const [questionInput, setQuestionInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const onGameStarted = (data) => {
            console.log('Hot seat game started/restarted:', data);
            if (data.gameState) setGameState(data.gameState);
        };

        const onStateUpdate = (state) => {
            console.log('Hot seat state update:', state);
            setGameState(state);
            setIsSubmitting(false);
        };

        const onAnsweringStarted = () => {
            console.log('All questions submitted, answering phase started');
        };

        const onNewPlayer = (state) => {
            console.log('New hot seat player:', state);
            setGameState(state);
            setQuestionInput('');
            setIsSubmitting(false);
        };

        const onGameStateSync = (data) => {
            if (data && (data.gameType === 'hot-seat' || data.type === 'hot-seat')) {
                setGameState(data.gameState || data);
            }
        };

        const onGameFinished = (data) => {
            console.log('Hot seat game finished/ended, returning to lobby');
            navigation.reset({
                index: 0,
                routes: [{ 
                    name: 'Lobby', 
                    params: { 
                        room: data?.room || room, 
                        playerName,
                        fromGame: true 
                    } 
                }]
            });
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('hot-seat-state-update', onStateUpdate);
        SocketService.on('hot-seat-answering-started', onAnsweringStarted);
        SocketService.on('hot-seat-new-player', onNewPlayer);
        SocketService.on('hot-seat-game-finished', onGameFinished);
        SocketService.on('game-ended', onGameFinished);
        SocketService.on('hot-seat-ended', onGameFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch initial state
        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('hot-seat-state-update', onStateUpdate);
            SocketService.off('hot-seat-answering-started', onAnsweringStarted);
            SocketService.off('hot-seat-new-player', onNewPlayer);
            SocketService.off('hot-seat-game-finished', onGameFinished);
            SocketService.off('game-ended', onGameFinished);
            SocketService.off('hot-seat-ended', onGameFinished);
            SocketService.off('game-state-sync', onGameStateSync);
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
                    <NeonText size={24} glow>LOADING HOT SEAT...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    const { isHotSeat, hotSeatPlayerName, phase, questions, currentQuestionIndex, hasSubmitted, submittedCount, totalExpected, round } = gameState;

    return (
        <NeonContainer>
            <GameOverlay roomId={room.id} playerName={playerName}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <NeonText size={14} color={COLORS.hotPink}>ROUND {round}</NeonText>
                        <View style={styles.titleRow}>
                            <Ionicons name="flame" size={26} color={COLORS.hotPink} />
                            <NeonText size={28} weight="bold" glow>HOT SEAT</NeonText>
                            <Ionicons name="flame" size={26} color={COLORS.hotPink} />
                        </View>
                    </View>

                    <View style={styles.hotSeatPlayerCard}>
                        <NeonText size={14} color="#888">IN THE HOT SEAT:</NeonText>
                        <NeonText size={32} weight="bold" glow color={COLORS.neonCyan}>
                            {hotSeatPlayerName}
                        </NeonText>
                    </View>

                    {phase === 'submitting' ? (
                        isHotSeat ? (
                            <View style={styles.waitingView}>
                                <Ionicons name="person" size={48} color={COLORS.hotPink} />
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
                                        <Ionicons name="checkmark-circle" size={48} color={COLORS.limeGlow} />
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
                        )
                    ) : phase === 'answering' ? (
                        <View style={styles.answeringContainer}>
                            <View style={styles.questionProgress}>
                                <NeonText size={14} color="#888">
                                    Question {currentQuestionIndex + 1} of {questions?.length || 0}
                                </NeonText>
                            </View>

                            {questions && questions[currentQuestionIndex] && (
                                <View style={styles.questionCard}>
                                    <NeonText size={12} color={COLORS.electricPurple} style={{ letterSpacing: 2 }}>
                                        ANONYMOUS QUESTION
                                    </NeonText>
                                    <NeonText size={22} weight="bold" style={styles.questionText}>
                                        "{questions[currentQuestionIndex].question}"
                                    </NeonText>
                                </View>
                            )}

                            {isHotSeat && (
                                <View style={styles.answerPrompt}>
                                    <NeonText size={14} color={COLORS.limeGlow}>Answer this question out loud! <Ionicons name="mic" size={16} color={COLORS.neonCyan} /></NeonText>
                                </View>
                            )}

                            <NeonButton
                                title={currentQuestionIndex >= (questions?.length || 0) - 1 ? "NEXT PLAYER" : "NEXT QUESTION"}
                                onPress={handleNextQuestion}
                                style={styles.nextButton}
                            />
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <NeonText size={20}>Game in progress...</NeonText>
                        </View>
                    )}

                    {isHost && (
                        <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
                            <NeonText size={14} color={COLORS.hotPink}>End Game</NeonText>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </GameOverlay>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 5,
    },
    hotSeatPlayerCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        marginHorizontal: 10,
    },
    waitingView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    questionInputView: {
        flex: 1,
        paddingHorizontal: 15,
    },
    answeringContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    submittedView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    label: {
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        padding: 15,
        fontSize: 16,
        color: COLORS.white,
        minHeight: 120,
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
        backgroundColor: 'rgba(148, 0, 211, 0.1)',
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
        alignItems: 'center',
        marginBottom: 20,
    },
    nextButton: {
        marginTop: 10,
    },
    endButton: {
        alignItems: 'center',
        marginTop: 40,
        padding: 10,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HotSeatScreen;
