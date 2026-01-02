import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Vibration
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const ColorRushScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('waiting');
    const [countdown, setCountdown] = useState(3);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 15);
    const [targetColorName, setTargetColorName] = useState('');
    const [displayColorHex, setDisplayColorHex] = useState('#fff');
    const [colorButtons, setColorButtons] = useState([]);
    const [myScore, setMyScore] = useState(0);
    const [standings, setStandings] = useState([]);
    const [roundWinner, setRoundWinner] = useState(null);
    const [myResult, setMyResult] = useState(null);
    const [finalResults, setFinalResults] = useState(null);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const onRoundStart = (data) => {
            console.log('Round starting:', data);
            setTargetColorName(data.targetColorName);
            setDisplayColorHex(data.displayColorHex);
            setColorButtons(data.buttons);
            setCurrentRound(data.round);
            setTotalRounds(data.totalRounds);
            setRoundWinner(null);
            setMyResult(null);
            setPhase('countdown');
            setCountdown(3);
        };

        const onAnswerResult = (result) => {
            setMyResult(result);
            if (result.correct) {
                // Flash green
                Animated.sequence([
                    Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
                    Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false })
                ]).start();
                if (Platform.OS !== 'web') Vibration.vibrate(100);
            } else {
                // Flash red
                if (Platform.OS !== 'web') Vibration.vibrate([0, 50, 50, 50]);
            }
        };

        const onRoundWon = ({ winnerName }) => {
            setRoundWinner(winnerName);
            setPhase('roundWon');
        };

        const onRoundResults = (data) => {
            setPhase('results');
            setStandings(data.standings);
            const me = data.standings.find(p => p.id === SocketService.socket?.id);
            if (me) setMyScore(me.score);
        };

        const onNextRoundReady = ({ nextRound }) => {
            setCurrentRound(nextRound);
            setPhase('waiting');
        };

        const onGameFinished = (data) => {
            setPhase('finished');
            setFinalResults(data);
        };

        const onGameEnded = ({ room: updatedRoom }) => {
            navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost });
        };

        SocketService.on('color-rush-round-start', onRoundStart);
        SocketService.on('color-rush-answer-result', onAnswerResult);
        SocketService.on('color-rush-round-won', onRoundWon);
        SocketService.on('color-rush-round-results', onRoundResults);
        SocketService.on('color-rush-next-round-ready', onNextRoundReady);
        SocketService.on('color-rush-game-finished', onGameFinished);
        SocketService.on('color-rush-game-ended', onGameEnded);

        return () => {
            SocketService.off('color-rush-round-start', onRoundStart);
            SocketService.off('color-rush-answer-result', onAnswerResult);
            SocketService.off('color-rush-round-won', onRoundWon);
            SocketService.off('color-rush-round-results', onRoundResults);
            SocketService.off('color-rush-next-round-ready', onNextRoundReady);
            SocketService.off('color-rush-game-finished', onGameFinished);
            SocketService.off('color-rush-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost]);

    useEffect(() => {
        if (phase !== 'countdown') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('playing');
                    Animated.sequence([
                        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                        Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
                    ]).start();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, scaleAnim]);

    const handleColorPress = (colorName) => {
        if (myResult) return;

        SocketService.emit('color-rush-answer', {
            roomId: room.id,
            colorName
        });
    };

    const handleStartRound = () => {
        SocketService.emit('color-rush-start-round', { roomId: room.id });
    };

    const handleNextRound = () => {
        SocketService.emit('color-rush-next-round', { roomId: room.id });
    };

    const handleBackToLobby = () => {
        SocketService.emit('color-rush-end-game', { roomId: room.id });
    };

    const flashBackground = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0,0,0,0)', 'rgba(198,255,74,0.3)']
    });

    return (
        <NeonContainer>
            <Animated.View style={[styles.container, { backgroundColor: flashBackground }]}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.electricPurple}>
                        🎨 COLOR RUSH
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

                {phase === 'waiting' && (
                    <View style={styles.centerContent}>
                        <NeonText size={28} weight="bold" glow>
                            Round {currentRound}
                        </NeonText>
                        <NeonText size={16} color="#888" style={styles.subtitle}>
                            Tap the color that matches the WORD!
                        </NeonText>
                        <NeonText size={14} color="#666" style={styles.hint}>
                            ⚠️ Be careful - the word color might trick you!
                        </NeonText>
                        {isHost && (
                            <NeonButton
                                title="START ROUND"
                                onPress={handleStartRound}
                                style={styles.startButton}
                            />
                        )}
                    </View>
                )}

                {phase === 'countdown' && (
                    <View style={styles.centerContent}>
                        <NeonText size={120} weight="bold" glow color={COLORS.limeGlow}>
                            {countdown || 'GO!'}
                        </NeonText>
                    </View>
                )}

                {phase === 'playing' && (
                    <View style={styles.playingContainer}>
                        <View style={styles.targetContainer}>
                            <NeonText size={14} color="#888">Tap the color:</NeonText>
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <NeonText
                                    size={64}
                                    weight="bold"
                                    glow
                                    style={[styles.targetWord, { color: displayColorHex }]}
                                >
                                    {targetColorName}
                                </NeonText>
                            </Animated.View>
                        </View>

                        <View style={styles.buttonsGrid}>
                            {colorButtons.map((color) => (
                                <TouchableOpacity
                                    key={color.name}
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: color.hex },
                                        myResult && color.name !== targetColorName && styles.dimmedButton,
                                        myResult?.correct && color.name === targetColorName && styles.correctButton
                                    ]}
                                    onPress={() => handleColorPress(color.name)}
                                    disabled={!!myResult}
                                    activeOpacity={0.7}
                                >
                                    <NeonText size={14} weight="bold" color="#000">
                                        {color.name}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {myResult && (
                            <NeonText
                                size={24}
                                weight="bold"
                                color={myResult.correct ? COLORS.limeGlow : COLORS.hotPink}
                                style={styles.resultText}
                            >
                                {myResult.correct
                                    ? (myResult.isWinner ? '🏆 FASTEST!' : '✓ Correct!')
                                    : '✗ Wrong!'}
                            </NeonText>
                        )}
                    </View>
                )}

                {phase === 'roundWon' && (
                    <View style={styles.centerContent}>
                        <NeonText size={24} weight="bold" glow color={COLORS.limeGlow}>
                            🏆 {roundWinner} was fastest!
                        </NeonText>
                    </View>
                )}

                {phase === 'results' && (
                    <View style={styles.resultsContainer}>
                        <NeonText size={22} weight="bold" glow style={styles.resultsTitle}>
                            Standings
                        </NeonText>
                        {standings.slice(0, 5).map((player, index) => (
                            <View
                                key={player.id}
                                style={[
                                    styles.standingRow,
                                    index === 0 && styles.leaderRow,
                                    player.id === SocketService.socket?.id && styles.myRow
                                ]}
                            >
                                <NeonText size={18} weight="bold">#{index + 1}</NeonText>
                                <NeonText size={16} style={styles.standingName}>{player.name}</NeonText>
                                <NeonText size={18} weight="bold" color={COLORS.neonCyan}>{player.score}</NeonText>
                            </View>
                        ))}
                        {isHost && (
                            <NeonButton
                                title={currentRound >= totalRounds ? "FINAL RESULTS" : "NEXT ROUND"}
                                onPress={handleNextRound}
                                style={styles.nextButton}
                            />
                        )}
                    </View>
                )}

                {phase === 'finished' && finalResults && (
                    <View style={styles.finalContainer}>
                        <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                            🏆 {finalResults.winner?.name} WINS! 🏆
                        </NeonText>
                        <NeonText size={18} color={COLORS.neonCyan} style={styles.winnerScore}>
                            {finalResults.winner?.score} points
                        </NeonText>
                        <View style={styles.finalRankings}>
                            {finalResults.rankings?.slice(0, 5).map((player, index) => (
                                <View key={player.id} style={[styles.standingRow, index === 0 && styles.leaderRow]}>
                                    <NeonText size={18} weight="bold">#{index + 1}</NeonText>
                                    <NeonText size={16} style={styles.standingName}>{player.name}</NeonText>
                                    <NeonText size={18} weight="bold" color={COLORS.neonCyan}>{player.score}</NeonText>
                                </View>
                            ))}
                        </View>
                        <NeonButton title="BACK TO LOBBY" variant="secondary" onPress={handleBackToLobby} style={styles.backButton} />
                    </View>
                )}
            </Animated.View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    roundInfo: { alignItems: 'flex-end' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { marginTop: 10 },
    hint: { marginTop: 5 },
    startButton: { marginTop: 30, minWidth: 200 },
    playingContainer: { flex: 1, paddingTop: 30 },
    targetContainer: { alignItems: 'center', marginBottom: 40 },
    targetWord: { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
    buttonsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    colorButton: {
        width: 100, height: 70, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
    },
    dimmedButton: { opacity: 0.4 },
    correctButton: { borderWidth: 4, borderColor: '#fff' },
    resultText: { textAlign: 'center', marginTop: 30 },
    resultsContainer: { flex: 1, paddingTop: 20 },
    resultsTitle: { textAlign: 'center', marginBottom: 20 },
    standingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 10 },
    leaderRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    myRow: { borderWidth: 2, borderColor: COLORS.neonCyan },
    standingName: { flex: 1, marginLeft: 15 },
    nextButton: { marginTop: 20 },
    finalContainer: { flex: 1, alignItems: 'center', paddingTop: 30 },
    winnerScore: { marginBottom: 30 },
    finalRankings: { width: '100%', marginBottom: 20 },
    backButton: { marginTop: 20, minWidth: 200 },
});

export default ColorRushScreen;
