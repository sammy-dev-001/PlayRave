import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const TypeRaceScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('waiting'); // waiting, countdown, typing, results, finished
    const [countdown, setCountdown] = useState(3);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 5);
    const [targetSentence, setTargetSentence] = useState('');
    const [typedText, setTypedText] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [playerProgress, setPlayerProgress] = useState({});
    const [roundResults, setRoundResults] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [myScore, setMyScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const inputRef = useRef(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Socket listeners
    useEffect(() => {
        const onRoundStart = ({ sentence, round, totalRounds: total }) => {
            console.log('Round starting:', round);
            setTargetSentence(sentence);
            setCurrentRound(round);
            setTotalRounds(total);
            setTypedText('');
            setFinished(false);
            setRoundResults(null);
            setPhase('countdown');
            setCountdown(3);
        };

        const onProgressUpdate = ({ playerId, playerName: name, progress }) => {
            setPlayerProgress(prev => ({
                ...prev,
                [playerId]: { name, progress }
            }));
        };

        const onFinishAck = ({ accuracy, timeTaken, points, position }) => {
            setMyScore(prev => prev + points);
            setFinished(true);
        };

        const onRoundResults = (data) => {
            console.log('Round results:', data);
            setPhase('results');
            setRoundResults(data);
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

        SocketService.on('type-race-round-start', onRoundStart);
        SocketService.on('type-race-progress-update', onProgressUpdate);
        SocketService.on('type-race-finish-ack', onFinishAck);
        SocketService.on('type-race-round-results', onRoundResults);
        SocketService.on('type-race-next-round-ready', onNextRoundReady);
        SocketService.on('type-race-game-finished', onGameFinished);
        SocketService.on('type-race-game-ended', onGameEnded);

        return () => {
            SocketService.off('type-race-round-start', onRoundStart);
            SocketService.off('type-race-progress-update', onProgressUpdate);
            SocketService.off('type-race-finish-ack', onFinishAck);
            SocketService.off('type-race-round-results', onRoundResults);
            SocketService.off('type-race-next-round-ready', onNextRoundReady);
            SocketService.off('type-race-game-finished', onGameFinished);
            SocketService.off('type-race-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost]);

    // Countdown timer
    useEffect(() => {
        if (phase !== 'countdown') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('typing');
                    setStartTime(Date.now());
                    // Focus input after a short delay
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    // Handle text change
    const handleTextChange = useCallback((text) => {
        if (phase !== 'typing' || finished) return;

        setTypedText(text);

        // Calculate progress
        const progress = Math.min(text.length / targetSentence.length, 1);

        // Animate progress bar
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false
        }).start();

        // Send progress update (throttled - only every 5 chars)
        if (text.length % 5 === 0 || text.length === targetSentence.length) {
            SocketService.emit('type-race-progress', {
                roomId: room.id,
                progress: Math.round(progress * 100),
                accuracy: calculateAccuracy(text)
            });
        }

        // Check for mistakes - shake on error
        if (text.length > 0 && text[text.length - 1] !== targetSentence[text.length - 1]) {
            // Wrong character!
            if (Platform.OS !== 'web') {
                Vibration.vibrate(20);
            }
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
            ]).start();
        }

        // Check if finished
        if (text === targetSentence) {
            const timeTaken = (Date.now() - startTime) / 1000;
            Keyboard.dismiss();

            SocketService.emit('type-race-finish', {
                roomId: room.id,
                typed: text,
                timeTaken
            });
        }
    }, [phase, finished, targetSentence, startTime, room.id, progressAnim, shakeAnim]);

    const calculateAccuracy = (text) => {
        let correct = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === targetSentence[i]) correct++;
        }
        return Math.round((correct / text.length) * 100) || 100;
    };

    const handleStartRound = () => {
        SocketService.emit('type-race-start-round', { roomId: room.id });
    };

    const handleNextRound = () => {
        SocketService.emit('type-race-next-round', { roomId: room.id });
    };

    const handleBackToLobby = () => {
        SocketService.emit('type-race-end-game', { roomId: room.id });
    };

    // Render sentence with color-coded characters
    const renderSentence = () => {
        return targetSentence.split('').map((char, index) => {
            let color = '#666'; // Not typed yet
            if (index < typedText.length) {
                color = typedText[index] === char ? COLORS.limeGlow : COLORS.hotPink;
            }
            return (
                <NeonText
                    key={index}
                    size={22}
                    color={color}
                    style={styles.sentenceChar}
                >
                    {char}
                </NeonText>
            );
        });
    };

    return (
        <NeonContainer>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                        ⌨️ TYPE RACE
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
                        <NeonText size={24} weight="bold" glow>
                            Round {currentRound}
                        </NeonText>
                        <NeonText size={16} color="#888" style={styles.subtitle}>
                            Type the sentence as fast as you can!
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
                                Waiting for host to start...
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

                {/* Typing Phase */}
                {phase === 'typing' && (
                    <Animated.View
                        style={[styles.typingContainer, { transform: [{ translateX: shakeAnim }] }]}
                    >
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        })
                                    }
                                ]}
                            />
                        </View>

                        {/* Target Sentence */}
                        <View style={styles.sentenceContainer}>
                            <View style={styles.sentenceWrap}>
                                {renderSentence()}
                            </View>
                        </View>

                        {/* Input */}
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            value={typedText}
                            onChangeText={handleTextChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="Start typing..."
                            placeholderTextColor="#444"
                            editable={!finished}
                        />

                        {/* Player Progress */}
                        <View style={styles.playersProgress}>
                            {Object.entries(playerProgress).map(([id, data]) => (
                                <View key={id} style={styles.playerProgressRow}>
                                    <NeonText size={12} color="#888">{data.name}</NeonText>
                                    <View style={styles.miniProgress}>
                                        <View
                                            style={[
                                                styles.miniProgressBar,
                                                { width: `${data.progress}%` }
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                        {finished && (
                            <NeonText size={18} color={COLORS.limeGlow} style={styles.finishedText}>
                                ✓ Finished! Waiting for others...
                            </NeonText>
                        )}
                    </Animated.View>
                )}

                {/* Round Results */}
                {phase === 'results' && roundResults && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={22} weight="bold" glow style={styles.resultsTitle}>
                            Round {roundResults.currentRound} Results
                        </NeonText>

                        {roundResults.roundResults?.map((player, index) => (
                            <View
                                key={player.id}
                                style={[
                                    styles.resultRow,
                                    index === 0 && styles.winnerRow,
                                    player.id === SocketService.socket?.id && styles.myRow
                                ]}
                            >
                                <NeonText size={18} weight="bold" color={index === 0 ? COLORS.limeGlow : '#fff'}>
                                    #{index + 1}
                                </NeonText>
                                <View style={styles.resultInfo}>
                                    <NeonText size={14}>{player.name}</NeonText>
                                    <NeonText size={12} color="#888">
                                        {player.time?.toFixed(2)}s • {player.accuracy}% accuracy
                                    </NeonText>
                                </View>
                                <NeonText size={16} weight="bold" color={COLORS.neonCyan}>
                                    +{player.points}
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
                                        styles.resultRow,
                                        index === 0 && styles.winnerRow,
                                        player.id === SocketService.socket?.id && styles.myRow
                                    ]}
                                >
                                    <NeonText size={18} weight="bold">
                                        #{index + 1}
                                    </NeonText>
                                    <NeonText size={16} style={styles.rankName}>
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
    typingContainer: {
        flex: 1,
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.limeGlow,
        borderRadius: 3,
    },
    sentenceContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        minHeight: 100,
    },
    sentenceWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sentenceChar: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        color: '#fff',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    playersProgress: {
        marginTop: 20,
    },
    playerProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    miniProgress: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginLeft: 10,
        overflow: 'hidden',
    },
    miniProgressBar: {
        height: '100%',
        backgroundColor: COLORS.neonCyan,
    },
    finishedText: {
        textAlign: 'center',
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
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    winnerRow: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
    },
    myRow: {
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    resultInfo: {
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
    rankName: {
        flex: 1,
        marginLeft: 15,
    },
    backButton: {
        marginTop: 20,
        minWidth: 200,
    },
});

export default TypeRaceScreen;
