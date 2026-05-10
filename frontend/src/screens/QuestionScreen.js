import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const QuestionScreen = ({ route, navigation }) => {
    const { room, question: initialQuestion, questionIndex: initialQuestionIndex, hostParticipates, isHost, isTournamentMode } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [question, setQuestion] = useState(initialQuestion);
    const [questionIndex, setQuestionIndex] = useState(initialQuestionIndex || 0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const canAnswer = !isHost || hostParticipates;

    useEffect(() => {
        const handleStateUpdate = (state) => {
            console.log('Trivia state update:', state);
            if (!state) return;
            
            // Handle different state shapes (flat or nested)
            const questionData = state.question || state.question_data;
            if (questionData) {
                setQuestion(questionData);
                setQuestionIndex(state.currentQuestionIndex ?? (questionData.questionIndex || 0));
            }
        };

        const onGameStarted = (data) => {
            console.log('Trivia game started event:', data);
            if (data.gameState) handleStateUpdate(data.gameState);
            else if (data.question) handleStateUpdate(data);
        };

        const onQuestionResults = (results) => {
            console.log('Question results received:', results);
            navigation.navigate('Results', { room, results, hostParticipates, isHost });
        };

        const onNextQuestionReady = (data) => {
            console.log('Next question ready:', data);
            const nextQ = data.question || data.gameState?.question;
            if (nextQ) {
                setQuestion(nextQ);
                setQuestionIndex(nextQ.questionIndex || (data.gameState?.currentQuestionIndex || 0));
                setSelectedAnswer(null);
                setHasSubmitted(false);
                setTimeLeft(15);
            }
        };

        const onGameFinished = ({ finalScores }) => {
            if (isTournamentMode) {
                navigation.navigate('TournamentLobby', {
                    room,
                    playerName: route.params.playerName,
                    isHost,
                    tournament: room.tournament
                });
            } else {
                navigation.navigate('Scoreboard', { room, finalScores });
            }
        };

        const onGameStateSync = (data) => {
            console.log('Trivia state sync:', data);
            if (data.gameState) handleStateUpdate(data.gameState);
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('question-results', onQuestionResults);
        SocketService.on('next-question-ready', onNextQuestionReady);
        SocketService.on('game-finished', onGameFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Always request state on mount to handle refreshes or late navigation
        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('question-results', onQuestionResults);
            SocketService.off('next-question-ready', onNextQuestionReady);
            SocketService.off('game-finished', onGameFinished);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id]);

    useEffect(() => {
        if (!question) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasSubmitted && canAnswer) {
                        handleSubmitAnswer(selectedAnswer);
                    }
                    return 0;
                }
                if (prev <= 4) SoundService.playTick();
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [question, hasSubmitted, canAnswer, selectedAnswer]);

    const handleSelectAnswer = (index) => {
        if (hasSubmitted || !canAnswer) return;
        setSelectedAnswer(index);
    };

    const handleSubmitAnswer = (answerIndex) => {
        if (hasSubmitted || !canAnswer) return;
        const finalAnswer = answerIndex !== undefined ? answerIndex : selectedAnswer;
        setSelectedAnswer(finalAnswer);
        setHasSubmitted(true);
        SocketService.emit('submit-answer', { roomId: room.id, answerIndex: finalAnswer });
    };

    if (!question) {
        return (
            <NeonContainer showBackButton onBackPress={() => navigation.navigate('Lobby', { room, isHost })}>
                <View style={styles.loadingContainer}>
                    <NeonText size={20} glow>Syncing question data...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showMuteButton showBackButton onBackPress={() => navigation.navigate('Lobby', { room, isHost })}>
            <GameOverlay roomId={room.id} playerName={route.params.playerName || 'Player'}>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        QUESTION {questionIndex + 1} / {question.totalQuestions || '?'}
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
                    {question.options?.map((option, index) => (
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
            </GameOverlay>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    questionContainer: { marginBottom: 40, alignItems: 'center' },
    question: { textAlign: 'center', marginBottom: 10 },
    category: { textTransform: 'uppercase', letterSpacing: 1 },
    optionsContainer: { gap: 15 },
    optionButton: { width: '100%' },
    submitButton: { marginTop: 20 },
    submittedText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: COLORS.limeGlow },
});

export default QuestionScreen;
