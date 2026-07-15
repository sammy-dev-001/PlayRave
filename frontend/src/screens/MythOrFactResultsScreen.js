import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import ConfirmModal from '../components/ConfirmModal';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const MythOrFactResultsScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, results, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(5);
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Check if current player got it right for rave lights
    // results.playerResults use userId as playerId (set by the engine)
    const currentPlayerId = SocketService.getUserId?.() || SocketService.userId || SocketService.socket?.id;
    const currentPlayerResult = results.playerResults.find(r => r.playerId === currentPlayerId);
    const showRaveLights = currentPlayerResult?.isCorrect || false;

    useEffect(() => {
        const onNextStatementReady = (data) => {
            console.log('Next statement ready in results:', data);
            // Engine broadcasts getGameState() — a flat object with statement as a string
            const src = data.gameState || data;
            if (src?.statement) {
                navigation.replace('MythOrFactQuestion', {
                    room,
                    // Pass nothing — QuestionScreen will call get-state on mount and normalise
                    hostParticipates,
                    isHost,
                    playerName: route.params?.playerName
                });
            }
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, isHost: false, fromGame: true });
        };

        SocketService.on('myth-or-fact-next-statement', onNextStatementReady);
        SocketService.on('game-finished', onGameFinished);
        SocketService.on('game-ended', onGameEnded);

        if (hostParticipates) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (isHost) {
                            handleNext();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(timer);
                SocketService.off('myth-or-fact-next-statement', onNextStatementReady);
                SocketService.off('game-finished', onGameFinished);
                SocketService.off('game-ended', onGameEnded);
            };
        }

        return () => {
            SocketService.off('myth-or-fact-next-statement', onNextStatementReady);
            SocketService.off('game-finished', onGameFinished);
            SocketService.off('game-ended', onGameEnded);
        };
    }, [hostParticipates, isHost, navigation, room]);

    const handleBackPress = () => {
        if (isHost) {
            setShowEndGameModal(true);
        } else {
            navigation.navigate('Lobby', { room, isHost, fromGame: true });
        }
    };

    const confirmEndGame = () => {
        setShowEndGameModal(false);
        SocketService.emit('myth-or-fact-end-game', { roomId: room.id });
    };

    const handleNext = () => {
        console.log('Host requesting next statement');
        SocketService.emit('myth-or-fact-next-statement', { roomId: room.id });
    };

    const renderPlayerResult = ({ item }) => {
        // item.playerId is actually the userId (engine comment: "populated with userId")
        const player = room.players.find(p => p.userId === item.playerId);
        const playerName = player?.name || player?.playerName || 'Unknown';

        return (
            <View style={[styles.playerRow, item.isCorrect && styles.correctRow]}>
                <NeonText size={18}>
                    {item.isCorrect ? '' : '✗'} {playerName}
                </NeonText>
                <NeonText size={18} color={COLORS.limeGlow}>
                    {item.currentScore} pts
                </NeonText>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton scrollable onBackPress={handleBackPress}>
            <RaveLights trigger={showRaveLights} intensity="medium" />
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    RESULTS
                </NeonText>
            </View>

            <View style={styles.answerContainer}>
                <NeonText size={16} color={COLORS.hotPink}>CORRECT ANSWER:</NeonText>
                <NeonText
                    size={32}
                    weight="bold"
                    color={results.correctAnswer ? COLORS.limeGlow : COLORS.hotPink}
                    style={styles.correctAnswer}
                >
                    {results.answerText}
                </NeonText>
            </View>

            <View style={styles.explanationContainer}>
                <NeonText size={14} color="#999">EXPLANATION:</NeonText>
                <NeonText size={16} style={styles.explanation}>
                    {results.explanation}
                </NeonText>
            </View>

            <NeonText size={18} style={styles.sectionTitle}>PLAYER SCORES</NeonText>

            <FlatList
                data={results.playerResults}
                keyExtractor={item => item.playerId}
                renderItem={renderPlayerResult}
                contentContainerStyle={styles.list}
            />

            {isHost && !hostParticipates && (
                <NeonButton
                    title={results.isLastStatement ? "PROCEED TO SCOREBOARD" : "NEXT STATEMENT"}
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            )}

            {isHost && hostParticipates && (
                <NeonText style={styles.autoAdvance}>
                    {results.isLastStatement ? `Proceeding to scoreboard in ${countdown}s...` : `Next statement in ${countdown}s...`}
                </NeonText>
            )}

            {!isHost && (
                <NeonText style={styles.waiting}>
                    {hostParticipates
                        ? (results.isLastStatement ? `Proceeding to scoreboard in ${countdown}s...` : `Next statement in ${countdown}s...`)
                        : 'Waiting for host...'}
                </NeonText>
            )}
            
            <ConfirmModal
                visible={showEndGameModal}
                title="END GAME?"
                message="Are you sure you want to end the game for everyone?"
                confirmText="END GAME"
                cancelText="CANCEL"
                confirmVariant="primary"
                onConfirm={confirmEndGame}
                onCancel={() => setShowEndGameModal(false)}
            />
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        letterSpacing: 2,
    },
    answerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    correctAnswer: {
        marginTop: 10,
        textAlign: 'center',
    },
    explanationContainer: {
        marginBottom: 30,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    explanation: {
        marginTop: 8,
        lineHeight: 22,
        color: '#ddd',
    },
    sectionTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 63, 164, 0.3)',
    },
    correctRow: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    nextButton: {
        marginTop: 20,
    },
    autoAdvance: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.limeGlow,
    },
    waiting: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: COLORS.textMuted,
    }
});

export default MythOrFactResultsScreen;
