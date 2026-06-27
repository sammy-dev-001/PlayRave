import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

const MythOrFactQuestionScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, statement: initialStatement, statementIndex: initialIndex, hostParticipates, isHost, playerName } = route.params;

    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [statement, setStatement] = useState(initialStatement);
    const [statementIndex, setStatementIndex] = useState(initialIndex || 0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const canAnswer = !isHost || hostParticipates;

    useEffect(() => {
        const handleStateUpdate = (state) => {
            console.log('MythOrFact state update:', state);
            if (!state) return;
            const stmtData = state.statement || state.statement_data;
            if (stmtData) {
                setStatement(stmtData);
                setStatementIndex(state.statementIndex ?? (stmtData.statementIndex || 0));
            }
        };

        const onGameStarted = (data) => {
            console.log('MythOrFact game started:', data);
            if (data.gameState) handleStateUpdate(data.gameState);
            else if (data.statement) handleStateUpdate(data);
        };

        const onResults = (results) => {
            console.log('Myth or Fact results received:', results);
            navigation.replace('MythOrFactResults', { room, results, hostParticipates, isHost });
        };

        const onNextStatement = (data) => {
            console.log('Next statement ready:', data);
            const nextS = data.statement || data.gameState?.statement;
            if (nextS) {
                setStatement(nextS);
                setStatementIndex(nextS.statementIndex || (data.gameState?.statementIndex || 0));
                setSelectedAnswer(null);
                setHasSubmitted(false);
                setTimeLeft(15);
            }
        };

        const onGameFinished = ({ finalScores }) => {
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        const onGameStateSync = (data) => {
            console.log('MythOrFact state sync:', data);
            if (data.gameState) handleStateUpdate(data.gameState);
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('myth-or-fact-results', onResults);
        SocketService.on('next-myth-or-fact-statement-ready', onNextStatement);
        SocketService.on('game-finished', onGameFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch state on mount
        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('myth-or-fact-results', onResults);
            SocketService.off('next-myth-or-fact-statement-ready', onNextStatement);
            SocketService.off('game-finished', onGameFinished);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id]);

    useEffect(() => {
        if (!statement) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasSubmitted && canAnswer) {
                        handleSubmitAnswer(selectedAnswer);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [statement, hasSubmitted, canAnswer, selectedAnswer]);

    const handleSelectAnswer = (answer) => {
        if (hasSubmitted || !canAnswer) return;
        setSelectedAnswer(answer);
    };

    const handleSubmitAnswer = (answer) => {
        if (hasSubmitted || !canAnswer) return;
        const finalAnswer = answer !== undefined ? answer : selectedAnswer;
        setSelectedAnswer(finalAnswer);
        setHasSubmitted(true);
        SocketService.emit('submit-myth-or-fact-answer', { roomId: room.id, answer: finalAnswer });
    };

    if (!statement) {
        return (
            <NeonContainer showBackButton onBackPress={() => navigation.navigate('Lobby', { room, isHost })}>
                <View style={styles.loadingContainer}>
                    <NeonText size={20} glow>Syncing game data...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showBackButton scrollable onBackPress={() => navigation.navigate('Lobby', { room, isHost })}>
            <GameOverlay roomId={room.id} playerName={playerName}>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        STATEMENT {statementIndex + 1} / {statement.totalStatements || '?'}
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
            </GameOverlay>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    statementContainer: { marginBottom: 50, alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.electricPurple },
    statement: { textAlign: 'center', marginBottom: 15, lineHeight: 32 },
    category: { textTransform: 'uppercase', letterSpacing: 1 },
    buttonsContainer: { gap: 20 },
    answerButton: { width: '100%', paddingVertical: 20 },
    mythButton: { borderColor: COLORS.hotPink },
    factButton: { borderColor: COLORS.limeGlow },
    submitButton: { marginTop: 20 },
    submittedText: { textAlign: 'center', marginTop: 30, fontStyle: 'italic', color: COLORS.limeGlow },
    spectatorText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: COLORS.textMuted, fontSize: 14 }
});

export default MythOrFactQuestionScreen;
