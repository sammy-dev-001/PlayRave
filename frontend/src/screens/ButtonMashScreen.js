import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated, Vibration,
    Platform
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

const GAME_DURATION = 10000;

const ButtonMashScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, playerName, isHost } = route.params;

    useGameDisconnectHandler({
        navigation, room, playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState('countdown');
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(10);
    const [tapCount, setTapCount] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [results, setResults] = useState(null);

    const buttonScale = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        if (phase === 'countdown') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' })
                ])
            ).start();
        }
    }, [phase]);

    useEffect(() => {
        const onGo = ({ startTime }) => {
            console.log('Button Mash GO!');
            setPhase('playing');
            setTapCount(0);
            let remaining = 10;
            setTimeLeft(remaining);

            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: GAME_DURATION,
                useNativeDriver: false
            }).start();

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                remaining -= 1;
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    clearInterval(timerRef.current);
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
            setPhase('results');
            setResults(data);
            if (timerRef.current) clearInterval(timerRef.current);
        };

        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, playerName, isHost });
        };

        const onGameStateSync = (data) => {
            console.log('Button Mash state sync:', data);
            if (data.gameState) {
                if (data.gameState.phase === 'results') {
                    // results will come via another event or handled here if needed
                }
            }
        };

        SocketService.on('button-mash-go', onGo);
        SocketService.on('button-mash-tap-ack', onTapAck);
        SocketService.on('button-mash-leaderboard', onLeaderboard);
        SocketService.on('button-mash-results', onResults);
        SocketService.on('button-mash-game-ended', onGameEnded);
        SocketService.on('game-state-sync', onGameStateSync);

        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            SocketService.off('button-mash-go', onGo);
            SocketService.off('button-mash-tap-ack', onTapAck);
            SocketService.off('button-mash-leaderboard', onLeaderboard);
            SocketService.off('button-mash-results', onResults);
            SocketService.off('button-mash-game-ended', onGameEnded);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id, isHost]);

    useEffect(() => {
        if (phase !== 'countdown') return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
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

    const handleTap = useCallback(() => {
        if (phase !== 'playing') return;
        if (Platform.OS !== 'web') Vibration.vibrate(5);

        Animated.sequence([
            Animated.timing(buttonScale, { toValue: 0.9, duration: 30, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: Platform.OS !== 'web' })
        ]).start();

        setTapCount(prev => prev + 1);
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

    const myId = SocketService.socket?.id || SocketService.userId;
    const myRank = results?.rankings?.findIndex(p => p.id === myId || p.userId === myId) + 1;

    return (
        <NeonContainer>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={28} weight="bold" glow color={COLORS.hotPink}>BUTTON MASH</NeonText>
                </View>

                {phase === 'countdown' && (
                    <View style={styles.centerContent}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <NeonText size={120} weight="bold" glow color={COLORS.limeGlow}>{countdown || 'GO!'}</NeonText>
                        </Animated.View>
                        <NeonText size={18} color={COLORS.textMuted} style={styles.subtitle}>Get ready to tap!</NeonText>
                    </View>
                )}

                {phase === 'playing' && (
                    <View style={styles.playingContainer}>
                        <View style={styles.timerContainer}>
                            <NeonText size={48} weight="bold" glow color={timeLeft <= 3 ? COLORS.hotPink : COLORS.neonCyan}>{timeLeft}</NeonText>
                            <NeonText size={14} color={COLORS.textMuted}>seconds</NeonText>
                        </View>

                        <View style={styles.progressBarContainer}>
                            <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        </View>

                        <View style={styles.tapCountContainer}>
                            <NeonText size={72} weight="bold" glow color={COLORS.limeGlow}>{tapCount}</NeonText>
                            <NeonText size={16} color="#aaa">TAPS</NeonText>
                        </View>

                        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.buttonWrapper}>
                            <Animated.View style={[styles.mashButton, { transform: [{ scale: buttonScale }] }]}>
                                <NeonText size={32} weight="bold" color="#000">TAP!</NeonText>
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.liveLeaderboard}>
                            {leaderboard.slice(0, 3).map((player, index) => (
                                <View key={index} style={styles.leaderboardItem}>
                                    <NeonText size={12} color={index === 0 ? COLORS.limeGlow : COLORS.textMuted}>
                                        {index + 1}. {player.name}: {player.tapCount}
                                    </NeonText>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {(phase === 'waiting' || (phase === 'playing' && timeLeft <= 0)) && (
                    <View style={styles.centerContent}>
                        <NeonText size={64} weight="bold" glow color={COLORS.limeGlow}>{tapCount}</NeonText>
                        <NeonText size={20} color={COLORS.textMuted} style={styles.subtitle}>TAPS!</NeonText>
                        <NeonText size={16} color={COLORS.textMuted} style={{ marginTop: 30 }}>Waiting for results...</NeonText>
                    </View>
                )}

                {phase === 'results' && results && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={24} weight="bold" glow color={COLORS.limeGlow} style={styles.winnerText}>
                            {results.winner?.name} WINS!
                        </NeonText>
                        <NeonText size={18} color={COLORS.neonCyan} style={styles.winnerScore}>{results.winner?.tapCount} taps</NeonText>

                        <View style={styles.rankingsContainer}>
                            {results.rankings?.map((player, index) => (
                                <View key={index} style={[styles.rankingRow, index === 0 && styles.winnerRow, (player.id === myId || player.userId === myId) && styles.myRow]}>
                                    <NeonText size={18} weight="bold" color={index === 0 ? COLORS.limeGlow : COLORS.white}>#{index + 1}</NeonText>
                                    <NeonText size={16} style={styles.rankName}>{player.name}</NeonText>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>{player.tapCount}</NeonText>
                                </View>
                            ))}
                        </View>

                        <View style={styles.buttonsContainer}>
                            {isHost && <NeonButton title="PLAY AGAIN" onPress={handlePlayAgain} style={styles.actionButton} />}
                            <NeonButton title="BACK TO LOBBY" variant="secondary" onPress={handleBackToLobby} style={styles.actionButton} />
                        </View>
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { alignItems: 'center', marginBottom: 20 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { marginTop: 10 },
    playingContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
    timerContainer: { alignItems: 'center', marginBottom: 10 },
    progressBarContainer: { width: '100%', height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
    progressBar: { height: '100%', backgroundColor: COLORS.limeGlow, borderRadius: 4 },
    tapCountContainer: { alignItems: 'center', marginBottom: 30 },
    buttonWrapper: { width: 180, height: 180, marginBottom: 30 },
    mashButton: { width: '100%', height: '100%', borderRadius: 100, backgroundColor: COLORS.limeGlow, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.limeGlow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 },
    liveLeaderboard: { backgroundColor: COLORS.overlayDark, borderRadius: 12, padding: 10, minWidth: 150 },
    leaderboardItem: { paddingVertical: 4 },
    resultsContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    winnerText: { marginBottom: 5 },
    winnerScore: { marginBottom: 30 },
    rankingsContainer: { width: '100%', marginBottom: 20 },
    rankingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 10 },
    winnerRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    myRow: { borderWidth: 2, borderColor: COLORS.neonCyan },
    rankName: { flex: 1, marginLeft: 15 },
    buttonsContainer: { width: '100%', gap: 10 },
    actionButton: { marginBottom: 10 }
});

export default ButtonMashScreen;
