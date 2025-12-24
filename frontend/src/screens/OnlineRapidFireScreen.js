import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import ProfileService from '../services/ProfileService';
import { COLORS } from '../constants/theme';

const QUESTION_TIME = 5;

const OnlineRapidFireScreen = ({ route, navigation }) => {
    const { room, isHost, initialGameState, players } = route.params;
    const [gameState, setGameState] = useState(initialGameState || {});
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const currentPlayerId = SocketService.socket?.id;
    const isMyTurn = gameState.currentPlayerId === currentPlayerId;
    const timerRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const onUpdate = ({ newQuestion, currentPlayerId, playerScores, roundNumber }) => {
            setGameState(prev => ({
                ...prev,
                currentQuestion: newQuestion,
                currentPlayerId,
                playerScores,
                roundNumber
            }));
            setTimeLeft(QUESTION_TIME);
            setIsTimerRunning(false);
        };

        const onGameEnded = async ({ playerScores }) => {
            // Record stats before navigating
            try {
                const myScore = playerScores?.[currentPlayerId] || 0;
                const scores = Object.values(playerScores || {});
                const maxScore = Math.max(...scores, 0);
                const isWinner = myScore === maxScore && myScore > 0;
                await ProfileService.recordGame('rapid-fire', isWinner, myScore);
                console.log('Rapid Fire stats recorded:', { won: isWinner, points: myScore });
            } catch (error) {
                console.error('Error recording stats:', error);
            }

            navigation.navigate('Lobby', { room, isHost, playerName: players.find(p => p.id === currentPlayerId)?.name });
        };

        SocketService.on('rapid-fire-update', onUpdate);
        SocketService.on('rapid-fire-ended', onGameEnded);

        return () => {
            SocketService.off('rapid-fire-update', onUpdate);
            SocketService.off('rapid-fire-ended', onGameEnded);
        };
    }, [navigation, room, isHost, currentPlayerId, players]);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isMyTurn) {
            handleAnswer(false);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isTimerRunning, timeLeft, isMyTurn]);

    useEffect(() => {
        if (isTimerRunning) {
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: QUESTION_TIME * 1000,
                useNativeDriver: false
            }).start();
        }
    }, [isTimerRunning]);

    const startTimer = () => {
        setIsTimerRunning(true);
        setTimeLeft(QUESTION_TIME);
    };

    const handleAnswer = (answered) => {
        setIsTimerRunning(false);
        SocketService.emit('rapid-fire-answer', { roomId: room.id, answered });
    };

    const handleEndGame = () => {
        SocketService.emit('end-rapid-fire', { roomId: room.id });
    };

    const getCategoryColor = () => {
        switch (gameState.category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    const getPlayerName = (playerId) => {
        const player = players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={24} weight="bold" glow>
                    ⚡ RAPID FIRE
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {gameState.category?.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color="#888">
                    Round {gameState.roundNumber}
                </NeonText>
            </View>

            {/* Current Player */}
            <View style={[styles.playerContainer, isMyTurn && styles.myTurn]}>
                <NeonText size={14} color={COLORS.neonCyan}>
                    {isMyTurn ? "YOUR TURN!" : "NOW ANSWERING:"}
                </NeonText>
                <NeonText size={28} weight="bold" glow>
                    {getPlayerName(gameState.currentPlayerId)}
                </NeonText>
            </View>

            {/* Timer Bar */}
            {isTimerRunning && (
                <View style={styles.timerContainer}>
                    <View style={styles.timerBar}>
                        <Animated.View
                            style={[
                                styles.timerProgress,
                                {
                                    width: progressWidth,
                                    backgroundColor: timeLeft <= 2 ? COLORS.hotPink : COLORS.limeGlow
                                }
                            ]}
                        />
                    </View>
                    <NeonText size={20} weight="bold" color={timeLeft <= 2 ? COLORS.hotPink : COLORS.white}>
                        {timeLeft}s
                    </NeonText>
                </View>
            )}

            {/* Question */}
            <View style={styles.questionContainer}>
                <NeonText size={26} weight="bold" style={styles.questionText} glow>
                    {gameState.currentQuestion}
                </NeonText>
            </View>

            {/* Actions */}
            {isMyTurn && (
                !isTimerRunning ? (
                    <NeonButton
                        title="START TIMER"
                        onPress={startTimer}
                        style={styles.startBtn}
                    />
                ) : (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.answerBtn, styles.answeredBtn]}
                            onPress={() => handleAnswer(true)}
                        >
                            <NeonText size={32}>✓</NeonText>
                            <NeonText size={14} weight="bold" color={COLORS.limeGlow}>
                                ANSWERED!
                            </NeonText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.answerBtn, styles.skippedBtn]}
                            onPress={() => handleAnswer(false)}
                        >
                            <NeonText size={32}>✗</NeonText>
                            <NeonText size={14} weight="bold" color={COLORS.hotPink}>
                                SKIP
                            </NeonText>
                        </TouchableOpacity>
                    </View>
                )
            )}

            {!isMyTurn && (
                <View style={styles.waitingContainer}>
                    <NeonText size={16} color="#888">
                        Waiting for {getPlayerName(gameState.currentPlayerId)} to answer...
                    </NeonText>
                </View>
            )}

            {/* Scoreboard */}
            <ScrollView style={styles.scoreboardScroll} horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.scoreboard}>
                    {players.map(player => (
                        <View
                            key={player.id}
                            style={[
                                styles.scoreItem,
                                player.id === gameState.currentPlayerId && styles.activeScore
                            ]}
                        >
                            <NeonText size={12} weight="bold">
                                {player.name}
                            </NeonText>
                            <NeonText size={14} color={COLORS.limeGlow}>
                                {gameState.playerScores?.[player.id] || 0}
                            </NeonText>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <NeonButton
                title="END GAME"
                variant="secondary"
                onPress={handleEndGame}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 15,
    },
    categoryBadge: {
        marginTop: 8,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    playerContainer: {
        alignItems: 'center',
        marginBottom: 15,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    myTurn: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    timerBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    timerProgress: {
        height: '100%',
        borderRadius: 4,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 25,
        marginBottom: 15,
    },
    questionText: {
        textAlign: 'center',
    },
    startBtn: {
        marginBottom: 15,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    answerBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    answeredBtn: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderColor: COLORS.limeGlow,
    },
    skippedBtn: {
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderColor: COLORS.hotPink,
    },
    waitingContainer: {
        alignItems: 'center',
        padding: 20,
        marginBottom: 15,
    },
    scoreboardScroll: {
        maxHeight: 60,
        marginBottom: 10,
    },
    scoreboard: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 5,
    },
    scoreItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    activeScore: {
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    }
});

export default OnlineRapidFireScreen;
