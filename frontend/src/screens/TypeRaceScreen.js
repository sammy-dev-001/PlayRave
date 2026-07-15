import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Animated, Platform, Vibration, Keyboard, ScrollView, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

const TypeRaceScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, playerName, isHost } = route.params;

    useGameDisconnectHandler({
        navigation, room, playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState('waiting'); // waiting, countdown, typing, results, finished
    const [countdown, setCountdown] = useState(3);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(5);
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

    useEffect(() => {
        const onRoundStart = ({ sentence, round, totalRounds: total }) => {
            setTargetSentence(sentence);
            setCurrentRound(round);
            setTotalRounds(total);
            setTypedText('');
            setFinished(false);
            setRoundResults(null);
            setPhase('countdown');
            setCountdown(3);
            progressAnim.setValue(0);
        };

        const onProgressUpdate = ({ playerId, playerName: name, progress }) => {
            setPlayerProgress(prev => ({ ...prev, [playerId]: { name, progress } }));
        };

        const onFinishAck = ({ points }) => {
            setMyScore(prev => prev + points);
            setFinished(true);
        };

        const onRoundResults = (data) => {
            setPhase('results');
            setRoundResults(data);
            Keyboard.dismiss();
        };

        const onNextRoundReady = ({ nextRound }) => {
            setCurrentRound(nextRound);
            setPhase('waiting');
        };

        const onGameFinished = (data) => {
            setPhase('finished');
            setFinalResults(data);
        };

        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, playerName, isHost });
        };

        const onGameStateSync = (data) => {
            console.log('Type Race sync:', data);
            if (data.gameState) {
                setTotalRounds(data.gameState.totalRounds || 5);
                if (data.gameState.currentSentence) setTargetSentence(data.gameState.currentSentence);
            }
        };

        SocketService.on('type-race-round-start', onRoundStart);
        SocketService.on('type-race-progress-update', onProgressUpdate);
        SocketService.on('type-race-finish-ack', onFinishAck);
        SocketService.on('type-race-round-results', onRoundResults);
        SocketService.on('type-race-next-round-ready', onNextRoundReady);
        SocketService.on('type-race-game-finished', onGameFinished);
        SocketService.on('type-race-game-ended', onGameEnded);
        SocketService.on('game-state-sync', onGameStateSync);

        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('type-race-round-start', onRoundStart);
            SocketService.off('type-race-progress-update', onProgressUpdate);
            SocketService.off('type-race-finish-ack', onFinishAck);
            SocketService.off('type-race-round-results', onRoundResults);
            SocketService.off('type-race-next-round-ready', onNextRoundReady);
            SocketService.off('type-race-game-finished', onGameFinished);
            SocketService.off('type-race-game-ended', onGameEnded);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id, isHost]);

    useEffect(() => {
        if (phase !== 'countdown') return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('typing');
                    setStartTime(Date.now());
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    const handleTextChange = useCallback((text) => {
        if (phase !== 'typing' || finished) return;

        setTypedText(text);
        const progress = Math.min(text.length / targetSentence.length, 1);
        
        Animated.timing(progressAnim, { toValue: progress, duration: 100, useNativeDriver: false }).start();

        if (text.length % 5 === 0 || text.length === targetSentence.length) {
            SocketService.emit('type-race-progress', {
                roomId: room.id,
                progress: Math.round(progress * 100)
            });
        }

        if (text.length > 0 && text[text.length - 1] !== targetSentence[text.length - 1]) {
            if (Platform.OS !== 'web') Vibration.vibrate(20);
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: Platform.OS !== 'web' })
            ]).start();
        }

        if (text.trim() === targetSentence.trim()) {
            const timeTaken = (Date.now() - startTime) / 1000;
            Keyboard.dismiss();
            SocketService.emit('type-race-finish', { roomId: room.id, typed: text, timeTaken });
        }
    }, [phase, finished, targetSentence, startTime, room.id]);

    const renderSentence = () => {
        return targetSentence.split('').map((char, index) => {
            let color = COLORS.textDarkMuted;
            if (index < typedText.length) {
                color = typedText[index] === char ? COLORS.limeGlow : COLORS.hotPink;
            }
            return <NeonText key={index} size={20} color={color} style={styles.sentenceChar}>{char}</NeonText>;
        });
    };

    return (
        <NeonContainer scrollable>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>TYPE RACE</NeonText>
                    <View style={styles.roundInfo}>
                        <NeonText size={14} color={COLORS.textMuted}>Round {currentRound}/{totalRounds}</NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>Score: {myScore}</NeonText>
                    </View>
                </View>

                {phase === 'waiting' && (
                    <View style={styles.centerContent}>
                        <NeonText size={24} weight="bold" glow>Round {currentRound}</NeonText>
                        <NeonText size={16} color={COLORS.textMuted} style={styles.subtitle}>Type the sentence exactly as shown!</NeonText>
                        {isHost && <NeonButton title="START ROUND" onPress={() => SocketService.emit('type-race-start-round', { roomId: room.id })} style={styles.startButton} />}
                        {!isHost && <NeonText size={14} color={COLORS.textDarkMuted} style={styles.subtitle}>Waiting for host...</NeonText>}
                    </View>
                )}

                {phase === 'countdown' && (
                    <View style={styles.centerContent}>
                        <NeonText size={120} weight="bold" glow color={COLORS.limeGlow}>{countdown || 'GO!'}</NeonText>
                    </View>
                )}

                {phase === 'typing' && (
                    <Animated.View style={[styles.typingContainer, { transform: [{ translateX: shakeAnim }] }]}>
                        <View style={styles.progressContainer}>
                            <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        </View>

                        <View style={styles.sentenceContainer}>
                            <View style={styles.sentenceWrap}>{renderSentence()}</View>
                        </View>

                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            value={typedText}
                            onChangeText={handleTextChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="off"
                            placeholder="Start typing..."
                            placeholderTextColor="#444"
                            editable={!finished}
                        />

                        <View style={styles.playersProgress}>
                            {Object.entries(playerProgress).map(([id, data]) => (
                                <View key={id} style={styles.playerProgressRow}>
                                    <NeonText size={12} color={COLORS.textMuted} style={{ width: 80 }}>{data.name}</NeonText>
                                    <View style={styles.miniProgress}>
                                        <View style={[styles.miniProgressBar, { width: `${data.progress}%` }]} />
                                    </View>
                                </View>
                            ))}
                        </View>

                        {isHost && (
                            <TouchableOpacity onPress={() => SocketService.emit('type-race-skip-round', { roomId: room.id })} style={styles.skipButton}>
                                <NeonText size={12} color={COLORS.hotPink}>HOST: SKIP ROUND</NeonText>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {phase === 'results' && roundResults && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={22} weight="bold" glow style={styles.resultsTitle}>Round {roundResults.currentRound} Results</NeonText>
                        <ScrollView style={{ flex: 1 }}>
                            {roundResults.roundResults?.map((player, index) => (
                                <View key={index} style={[styles.resultRow, index === 0 && styles.winnerRow]}>
                                    <NeonText size={18} weight="bold">#{index + 1}</NeonText>
                                    <View style={styles.resultInfo}>
                                        <NeonText size={16}>{player.name}</NeonText>
                                        <NeonText size={12} color={COLORS.textMuted}>{player.finished ? `${player.time?.toFixed(2)}s • ${player.accuracy}%` : 'Did not finish'}</NeonText>
                                    </View>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>+{player.points}</NeonText>
                                </View>
                            ))}
                        </ScrollView>
                        {isHost && <NeonButton title={currentRound >= totalRounds ? "SHOW FINAL RESULTS" : "NEXT ROUND"} onPress={() => SocketService.emit('type-race-next-round', { roomId: room.id })} style={styles.nextButton} />}
                    </View>
                )}

                {phase === 'finished' && finalResults && (
                    <View style={styles.finalContainer}>
                        <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>{finalResults.winner?.name} WINS!</NeonText>
                        <View style={styles.finalRankings}>
                            {finalResults.rankings?.map((player, index) => (
                                <View key={index} style={[styles.resultRow, index === 0 && styles.winnerRow]}>
                                    <NeonText size={18} weight="bold">#{index + 1}</NeonText>
                                    <NeonText size={16} style={styles.rankName}>{player.name}</NeonText>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>{player.score}</NeonText>
                                </View>
                            ))}
                        </View>
                        <NeonButton title="BACK TO LOBBY" variant="secondary" onPress={() => navigation.navigate('Lobby', { room, playerName, isHost })} style={styles.backButton} />
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: { flex: 1, paddingTop: 40, paddingHorizontal: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    roundInfo: { alignItems: 'flex-end' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { marginTop: 10, textAlign: 'center' },
    startButton: { marginTop: 30, minWidth: 200 },
    typingContainer: { flex: 1 },
    progressContainer: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: COLORS.limeGlow },
    sentenceContainer: { backgroundColor: COLORS.overlayDark, borderRadius: 12, padding: 15, marginBottom: 20, minHeight: 80 },
    sentenceWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    sentenceChar: { fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' },
    textInput: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 15, fontSize: 18, color: COLORS.white, borderWidth: 2, borderColor: COLORS.neonCyan, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' },
    playersProgress: { marginTop: 20 },
    playerProgressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    miniProgress: { flex: 1, height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, marginLeft: 10, overflow: 'hidden' },
    miniProgressBar: { height: '100%', backgroundColor: COLORS.neonCyan },
    skipButton: { marginTop: 20, alignSelf: 'center', padding: 10 },
    resultsContainer: { flex: 1, paddingTop: 10 },
    resultsTitle: { textAlign: 'center', marginBottom: 20 },
    resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 10 },
    winnerRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    resultInfo: { flex: 1, marginLeft: 15 },
    nextButton: { marginTop: 10 },
    finalContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
    finalRankings: { width: '100%', marginTop: 20 },
    rankName: { flex: 1, marginLeft: 15 },
    backButton: { marginTop: 20, minWidth: 200 }
});

export default TypeRaceScreen;
