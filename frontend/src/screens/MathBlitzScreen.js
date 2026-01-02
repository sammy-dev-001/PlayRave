import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Animated,
    Platform,
    Vibration,
    Keyboard
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const MathBlitzScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('waiting'); // waiting, countdown, playing, roundWon, results, finished
    const [countdown, setCountdown] = useState(3);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 10);
    const [problem, setProblem] = useState('');
    const [answer, setAnswer] = useState('');
    const [myScore, setMyScore] = useState(0);
    const [standings, setStandings] = useState([]);
    const [roundWinner, setRoundWinner] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [myResult, setMyResult] = useState(null);
    const [finalResults, setFinalResults] = useState(null);

    const inputRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Socket listeners
    useEffect(() => {
        const onRoundStart = ({ problem: prob, round, totalRounds: total }) => {
            console.log('Round starting:', round);
            setProblem(prob);
            setCurrentRound(round);
            setTotalRounds(total);
            setAnswer('');
            setRoundWinner(null);
            setMyResult(null);
            setCorrectAnswer(null);
            setPhase('countdown');
            setCountdown(3);
        };

        const onAnswerResult = (result) => {
            setMyResult(result);
            if (result.correct) {
                if (Platform.OS !== 'web') Vibration.vibrate(100);
            } else {
                // Wrong - shake
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
                ]).start();
                if (Platform.OS !== 'web') Vibration.vibrate(20);
            }
        };

        const onRoundWon = ({ winnerName, correctAnswer: ans }) => {
            setRoundWinner(winnerName);
            setCorrectAnswer(ans);
            setPhase('roundWon');
            Keyboard.dismiss();
        };

        const onRoundResults = (data) => {
            console.log('Round results:', data);
            setPhase('results');
            setStandings(data.standings);
            // Update my score from standings
            const me = data.standings.find(p => p.id === SocketService.socket?.id);
            if (me) setMyScore(me.score);
        };

        const onNextRoundReady = ({ nextRound }) => {
            setCurrentRound(nextRound);
            setPhase('waiting');
        };

        const onGameFinished = (data) => {
            console.log('Game finished:', data);
            setPhase('finished');
            setFinalResults(data);
        };

        const onGameEnded = ({ room: updatedRoom }) => {
            navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost });
        };

        SocketService.on('math-blitz-round-start', onRoundStart);
        SocketService.on('math-blitz-answer-result', onAnswerResult);
        SocketService.on('math-blitz-round-won', onRoundWon);
        SocketService.on('math-blitz-round-results', onRoundResults);
        SocketService.on('math-blitz-next-round-ready', onNextRoundReady);
        SocketService.on('math-blitz-game-finished', onGameFinished);
        SocketService.on('math-blitz-game-ended', onGameEnded);

        return () => {
            SocketService.off('math-blitz-round-start', onRoundStart);
            SocketService.off('math-blitz-answer-result', onAnswerResult);
            SocketService.off('math-blitz-round-won', onRoundWon);
            SocketService.off('math-blitz-round-results', onRoundResults);
            SocketService.off('math-blitz-next-round-ready', onNextRoundReady);
            SocketService.off('math-blitz-game-finished', onGameFinished);
            SocketService.off('math-blitz-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost]);

    // Countdown timer
    useEffect(() => {
        if (phase !== 'countdown') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('playing');
                    setTimeout(() => inputRef.current?.focus(), 100);

                    // Pulse animation for problem
                    Animated.sequence([
                        Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                        Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
                    ]).start();

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, scaleAnim]);

    const handleSubmit = () => {
        if (!answer.trim() || myResult) return;

        SocketService.emit('math-blitz-answer', {
            roomId: room.id,
            answer: answer.trim()
        });
    };

    const handleStartRound = () => {
        SocketService.emit('math-blitz-start-round', { roomId: room.id });
    };

    const handleNextRound = () => {
        SocketService.emit('math-blitz-next-round', { roomId: room.id });
    };

    const handleBackToLobby = () => {
        SocketService.emit('math-blitz-end-game', { roomId: room.id });
    };

    return (
        <NeonContainer>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.hotPink}>
                        🧮 MATH BLITZ
                    </NeonText>
                    <View style={styles.roundInfo}>
                        <NeonText size={14} color="#888">
                            Round {currentRound}/{totalRounds}
                        </NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                            Score: {myScore}
                        </NeonText>
                    </View>
                </View>

                {/* Waiting Phase */}
                {phase === 'waiting' && (
                    <View style={styles.centerContent}>
                        <NeonText size={32} weight="bold" glow>
                            Round {currentRound}
                        </NeonText>
                        <NeonText size={16} color="#888" style={styles.subtitle}>
                            First to answer correctly wins!
                        </NeonText>
                        {isHost && (
                            <NeonButton
                                title="START ROUND"
                                onPress={handleStartRound}
                                style={styles.startButton}
                            />
                        )}
                        {!isHost && (
                            <NeonText size={14} color="#666" style={styles.subtitle}>
                                Waiting for host...
                            </NeonText>
                        )}
                    </View>
                )}

                {/* Countdown */}
                {phase === 'countdown' && (
                    <View style={styles.centerContent}>
                        <NeonText size={120} weight="bold" glow color={COLORS.limeGlow}>
                            {countdown || 'GO!'}
                        </NeonText>
                    </View>
                )}

                {/* Playing Phase */}
                {phase === 'playing' && (
                    <Animated.View style={[styles.playingContainer, { transform: [{ translateX: shakeAnim }] }]}>
                        {/* Problem Display */}
                        <View style={styles.problemContainer}>
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <NeonText size={56} weight="bold" glow color={COLORS.neonCyan}>
                                    {problem}
                                </NeonText>
                            </Animated.View>
                            <NeonText size={48} weight="bold" color="#444" style={styles.equals}>
                                = ?
                            </NeonText>
                        </View>

                        {/* Answer Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={inputRef}
                                style={[
                                    styles.answerInput,
                                    myResult?.correct === true && styles.correctInput,
                                    myResult?.correct === false && styles.wrongInput
                                ]}
                                value={answer}
                                onChangeText={setAnswer}
                                keyboardType="number-pad"
                                placeholder="?"
                                placeholderTextColor="#444"
                                maxLength={6}
                                editable={!myResult}
                                onSubmitEditing={handleSubmit}
                            />
                            <NeonButton
                                title="SUBMIT"
                                onPress={handleSubmit}
                                disabled={!answer.trim() || !!myResult}
                                style={styles.submitButton}
                            />
                        </View>

                        {myResult && (
                            <NeonText
                                size={20}
                                weight="bold"
                                color={myResult.correct ? COLORS.limeGlow : COLORS.hotPink}
                                style={styles.resultText}
                            >
                                {myResult.correct
                                    ? (myResult.isWinner ? '🎉 YOU WON THIS ROUND!' : '✓ Correct!')
                                    : '✗ Wrong!'}
                            </NeonText>
                        )}
                    </Animated.View>
                )}

                {/* Round Won Phase */}
                {phase === 'roundWon' && (
                    <View style={styles.centerContent}>
                        <NeonText size={24} weight="bold" glow color={COLORS.limeGlow}>
                            🏆 {roundWinner} wins!
                        </NeonText>
                        <NeonText size={32} weight="bold" color={COLORS.neonCyan} style={styles.answerDisplay}>
                            {problem} = {correctAnswer}
                        </NeonText>
                    </View>
                )}

                {/* Round Results */}
                {phase === 'results' && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={22} weight="bold" glow style={styles.resultsTitle}>
                            Standings
                        </NeonText>

                        {standings.map((player, index) => (
                            <View
                                key={player.id}
                                style={[
                                    styles.standingRow,
                                    index === 0 && styles.leaderRow,
                                    player.id === SocketService.socket?.id && styles.myRow
                                ]}
                            >
                                <NeonText size={18} weight="bold" color={index === 0 ? COLORS.limeGlow : '#fff'}>
                                    #{index + 1}
                                </NeonText>
                                <NeonText size={16} style={styles.standingName}>
                                    {player.name}
                                </NeonText>
                                <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                    {player.score}
                                </NeonText>
                            </View>
                        ))}

                        {isHost && (
                            <NeonButton
                                title={currentRound >= totalRounds ? "SHOW FINAL RESULTS" : "NEXT ROUND"}
                                onPress={handleNextRound}
                                style={styles.nextButton}
                            />
                        )}
                    </View>
                )}

                {/* Final Results */}
                {phase === 'finished' && finalResults && (
                    <View style={styles.finalContainer}>
                        <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                            🏆 {finalResults.winner?.name} WINS! 🏆
                        </NeonText>
                        <NeonText size={18} color={COLORS.neonCyan} style={styles.winnerScore}>
                            {finalResults.winner?.score} points
                        </NeonText>

                        <View style={styles.finalRankings}>
                            {finalResults.rankings?.map((player, index) => (
                                <View
                                    key={player.id}
                                    style={[
                                        styles.standingRow,
                                        index === 0 && styles.leaderRow,
                                        player.id === SocketService.socket?.id && styles.myRow
                                    ]}
                                >
                                    <NeonText size={18} weight="bold">
                                        #{index + 1}
                                    </NeonText>
                                    <NeonText size={16} style={styles.standingName}>
                                        {player.name}
                                    </NeonText>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                        {player.score}
                                    </NeonText>
                                </View>
                            ))}
                        </View>

                        <NeonButton
                            title="BACK TO LOBBY"
                            variant="secondary"
                            onPress={handleBackToLobby}
                            style={styles.backButton}
                        />
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    roundInfo: {
        alignItems: 'flex-end',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        marginTop: 10,
    },
    startButton: {
        marginTop: 30,
        minWidth: 200,
    },
    playingContainer: {
        flex: 1,
        paddingTop: 50,
    },
    problemContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    equals: {
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    answerInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 20,
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        fontWeight: 'bold',
    },
    correctInput: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    wrongInput: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
    },
    submitButton: {
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    resultText: {
        textAlign: 'center',
        marginTop: 20,
    },
    answerDisplay: {
        marginTop: 20,
    },
    resultsContainer: {
        flex: 1,
        paddingTop: 20,
    },
    resultsTitle: {
        textAlign: 'center',
        marginBottom: 20,
    },
    standingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    leaderRow: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
    },
    myRow: {
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    standingName: {
        flex: 1,
        marginLeft: 15,
    },
    nextButton: {
        marginTop: 20,
    },
    finalContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 30,
    },
    winnerScore: {
        marginBottom: 30,
    },
    finalRankings: {
        width: '100%',
        marginBottom: 20,
    },
    backButton: {
        marginTop: 20,
        minWidth: 200,
    },
});

export default MathBlitzScreen;
