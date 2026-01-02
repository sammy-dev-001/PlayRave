import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
    Platform
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const GAME_DURATION = 10000; // 10 seconds

const ButtonMashScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    // Game phases: countdown, playing, waiting, results
    const [phase, setPhase] = useState('countdown');
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(10);
    const [tapCount, setTapCount] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [results, setResults] = useState(null);

    // Animations
    const buttonScale = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;

    const gameStartTimeRef = useRef(null);
    const timerRef = useRef(null);

    // Pulse animation for waiting state
    useEffect(() => {
        if (phase === 'countdown') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true
                    })
                ])
            ).start();
        }
    }, [phase]);

    // Socket listeners
    useEffect(() => {
        const onGo = ({ startTime }) => {
            console.log('Button Mash GO!');
            gameStartTimeRef.current = startTime;
            setPhase('playing');
            setTapCount(0);

            // Start countdown timer
            let remaining = 10;
            setTimeLeft(remaining);

            // Animate progress bar
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: GAME_DURATION,
                useNativeDriver: false
            }).start();

            timerRef.current = setInterval(() => {
                remaining -= 1;
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(timerRef.current);
                    handleTimeUp();
                }
            }, 1000);
        };

        const onTapAck = ({ tapCount: count }) => {
            setTapCount(count);
        };

        const onLeaderboard = ({ leaderboard: lb }) => {
            setLeaderboard(lb);
        };

        const onResults = (data) => {
            console.log('Button Mash Results:', data);
            setPhase('results');
            setResults(data);
        };

        const onGameEnded = ({ room: updatedRoom }) => {
            navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost });
        };

        SocketService.on('button-mash-go', onGo);
        SocketService.on('button-mash-tap-ack', onTapAck);
        SocketService.on('button-mash-leaderboard', onLeaderboard);
        SocketService.on('button-mash-results', onResults);
        SocketService.on('button-mash-game-ended', onGameEnded);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            SocketService.off('button-mash-go', onGo);
            SocketService.off('button-mash-tap-ack', onTapAck);
            SocketService.off('button-mash-leaderboard', onLeaderboard);
            SocketService.off('button-mash-results', onResults);
            SocketService.off('button-mash-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost]);

    // Countdown to start
    useEffect(() => {
        if (phase !== 'countdown') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Host starts the game
                    if (isHost) {
                        SocketService.emit('button-mash-start', { roomId: room.id });
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, isHost, room.id]);

    const handleTimeUp = useCallback(() => {
        setPhase('waiting');
        SocketService.emit('button-mash-finish', {
            roomId: room.id,
            finalCount: tapCount
        });
    }, [room.id, tapCount]);

    const handleTap = useCallback(() => {
        if (phase !== 'playing') return;

        // Haptic feedback
        if (Platform.OS !== 'web') {
            Vibration.vibrate(5);
        }

        // Visual feedback - shrink then bounce
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.9,
                duration: 30,
                useNativeDriver: true
            }),
            Animated.spring(buttonScale, {
                toValue: 1,
                friction: 3,
                tension: 200,
                useNativeDriver: true
            })
        ]).start();

        // Update local count immediately for responsiveness
        setTapCount(prev => prev + 1);

        // Send to server
        SocketService.emit('button-mash-tap', { roomId: room.id });
    }, [phase, room.id, buttonScale]);

    const handlePlayAgain = () => {
        setPhase('countdown');
        setCountdown(3);
        setTapCount(0);
        setTimeLeft(10);
        setResults(null);
        progressAnim.setValue(1);
    };

    const handleBackToLobby = () => {
        SocketService.emit('button-mash-end-game', { roomId: room.id });
    };

    // Find current player's rank
    const myRank = results?.rankings?.findIndex(p => p.id === SocketService.socket?.id) + 1;

    return (
        <NeonContainer>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <NeonText size={28} weight="bold" glow color={COLORS.hotPink}>
                        ⚡ BUTTON MASH ⚡
                    </NeonText>
                </View>

                {/* Countdown Phase */}
                {phase === 'countdown' && (
                    <View style={styles.centerContent}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <NeonText size={120} weight="bold" glow color={COLORS.limeGlow}>
                                {countdown || 'GO!'}
                            </NeonText>
                        </Animated.View>
                        <NeonText size={18} color="#888" style={styles.subtitle}>
                            Get ready to tap!
                        </NeonText>
                    </View>
                )}

                {/* Playing Phase */}
                {phase === 'playing' && (
                    <View style={styles.playingContainer}>
                        {/* Timer */}
                        <View style={styles.timerContainer}>
                            <NeonText size={48} weight="bold" glow color={timeLeft <= 3 ? COLORS.hotPink : COLORS.neonCyan}>
                                {timeLeft}
                            </NeonText>
                            <NeonText size={14} color="#888">seconds</NeonText>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
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

                        {/* Tap Count */}
                        <View style={styles.tapCountContainer}>
                            <NeonText size={72} weight="bold" glow color={COLORS.limeGlow}>
                                {tapCount}
                            </NeonText>
                            <NeonText size={16} color="#aaa">TAPS</NeonText>
                        </View>

                        {/* THE BIG BUTTON */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={handleTap}
                            style={styles.buttonWrapper}
                        >
                            <Animated.View
                                style={[
                                    styles.mashButton,
                                    { transform: [{ scale: buttonScale }] }
                                ]}
                            >
                                <NeonText size={32} weight="bold" color="#000">
                                    TAP!
                                </NeonText>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Live Leaderboard */}
                        <View style={styles.liveLeaderboard}>
                            {leaderboard.slice(0, 3).map((player, index) => (
                                <View key={player.id} style={styles.leaderboardItem}>
                                    <NeonText size={12} color={index === 0 ? COLORS.limeGlow : '#888'}>
                                        {index + 1}. {player.name}: {player.tapCount}
                                    </NeonText>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Waiting Phase */}
                {phase === 'waiting' && (
                    <View style={styles.centerContent}>
                        <NeonText size={64} weight="bold" glow color={COLORS.limeGlow}>
                            {tapCount}
                        </NeonText>
                        <NeonText size={20} color="#888" style={styles.subtitle}>
                            TAPS!
                        </NeonText>
                        <NeonText size={16} color="#666" style={{ marginTop: 30 }}>
                            Waiting for other players...
                        </NeonText>
                    </View>
                )}

                {/* Results Phase */}
                {phase === 'results' && results && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={24} weight="bold" glow color={COLORS.limeGlow} style={styles.winnerText}>
                            🏆 {results.winner?.name} WINS! 🏆
                        </NeonText>
                        <NeonText size={18} color={COLORS.neonCyan} style={styles.winnerScore}>
                            {results.winner?.tapCount} taps
                        </NeonText>

                        <View style={styles.rankingsContainer}>
                            {results.rankings?.map((player, index) => (
                                <View
                                    key={player.id}
                                    style={[
                                        styles.rankingRow,
                                        index === 0 && styles.winnerRow,
                                        player.id === SocketService.socket?.id && styles.myRow
                                    ]}
                                >
                                    <NeonText size={18} weight="bold" color={index === 0 ? COLORS.limeGlow : '#fff'}>
                                        #{index + 1}
                                    </NeonText>
                                    <NeonText size={16} style={styles.rankName}>
                                        {player.name}
                                    </NeonText>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                        {player.tapCount}
                                    </NeonText>
                                </View>
                            ))}
                        </View>

                        {myRank && myRank > 1 && (
                            <NeonText size={14} color="#888" style={styles.yourRank}>
                                You placed #{myRank} with {tapCount} taps
                            </NeonText>
                        )}

                        <View style={styles.buttonsContainer}>
                            {isHost && (
                                <NeonButton
                                    title="PLAY AGAIN"
                                    onPress={handlePlayAgain}
                                    style={styles.actionButton}
                                />
                            )}
                            <NeonButton
                                title="BACK TO LOBBY"
                                variant="secondary"
                                onPress={handleBackToLobby}
                                style={styles.actionButton}
                            />
                        </View>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        marginTop: 10,
    },
    playingContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.limeGlow,
        borderRadius: 4,
    },
    tapCountContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    buttonWrapper: {
        width: 200,
        height: 200,
        marginBottom: 30,
    },
    mashButton: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        backgroundColor: COLORS.limeGlow,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 20,
    },
    liveLeaderboard: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 10,
        minWidth: 150,
    },
    leaderboardItem: {
        paddingVertical: 4,
    },
    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    winnerText: {
        marginBottom: 5,
    },
    winnerScore: {
        marginBottom: 30,
    },
    rankingsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    rankingRow: {
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
    rankName: {
        flex: 1,
        marginLeft: 15,
    },
    yourRank: {
        marginBottom: 20,
    },
    buttonsContainer: {
        width: '100%',
        gap: 10,
    },
    actionButton: {
        marginBottom: 10,
    },
});

export default ButtonMashScreen;
