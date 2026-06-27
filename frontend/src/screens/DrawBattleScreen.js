import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 40, 320);

const BRUSH_COLORS = [COLORS.white, COLORS.neonCyan, COLORS.hotPink, COLORS.limeGlow, COLORS.electricPurple, '#ff9900'];

const DrawBattleScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState(initialGameState?.phase || 'waiting');
    const [currentRound, setCurrentRound] = useState(initialGameState?.currentRound || 1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 5);
    const [prompt, setPrompt] = useState(initialGameState?.currentPrompt || '');
    const [timeLeft, setTimeLeft] = useState(60);
    const [dots, setDots] = useState([]);
    const [brushColor, setBrushColor] = useState(COLORS.white);
    const [drawings, setDrawings] = useState([]);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(room?.players?.length || 0);
    const [hasVoted, setHasVoted] = useState(false);
    const [roundResults, setRoundResults] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [myScore, setMyScore] = useState(0);

    useEffect(() => {
        const onGameStarted = (data) => {
            console.log("Draw Battle started:", data);
            if (data.gameState) {
                handleStateUpdate(data.gameState);
            }
        };

        const onRoundStarted = (data) => {
            setPrompt(data.prompt);
            setTimeLeft(data.drawingTime || 60);
            setCurrentRound(data.round);
            setTotalRounds(data.totalRounds);
            setDots([]);
            setHasVoted(false);
            setRoundResults(null);
            setPhase('drawing');
        };

        const onSubmissionUpdate = ({ submittedCount: count, totalPlayers: total }) => {
            setSubmittedCount(count);
            setTotalPlayers(total);
        };

        const onVotingStarted = (data) => {
            setDrawings(data.drawings);
            setPhase('voting');
        };

        const onRoundResults = (data) => {
            setRoundResults(data);
            const me = data.standings.find(p => p.userId === SocketService.userId || p.id === SocketService.socket?.id);
            if (me) setMyScore(me.score);
            setPhase('results');
        };

        const onNextRoundReady = ({ nextRound, nextPrompt }) => {
            setCurrentRound(nextRound);
            if (nextPrompt) setPrompt(nextPrompt);
            setPhase('waiting');
        };

        const onGameFinished = (data) => {
            setFinalResults(data);
            setPhase('finished');
        };

        const onGameStateSync = (data) => {
            if (data && (data.gameType === 'draw-battle' || data.type === 'draw-battle')) {
                handleStateUpdate(data.gameState || data);
            }
        };

        const handleStateUpdate = (state) => {
            if (state.phase) setPhase(state.phase);
            if (state.currentRound) setCurrentRound(state.currentRound);
            if (state.totalRounds) setTotalRounds(state.totalRounds);
            if (state.currentPrompt) setPrompt(state.currentPrompt);
            if (state.players) {
                const me = state.players.find(p => p.userId === SocketService.userId);
                if (me) setMyScore(me.score);
                setTotalPlayers(state.players.length);
            }
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('draw-battle-round-started', onRoundStarted);
        SocketService.on('draw-battle-submission-update', onSubmissionUpdate);
        SocketService.on('draw-battle-voting-started', onVotingStarted);
        SocketService.on('draw-battle-round-results', onRoundResults);
        SocketService.on('draw-battle-next-round-ready', onNextRoundReady);
        SocketService.on('draw-battle-game-finished', onGameFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch state
        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('draw-battle-round-started', onRoundStarted);
            SocketService.off('draw-battle-submission-update', onSubmissionUpdate);
            SocketService.off('draw-battle-voting-started', onVotingStarted);
            SocketService.off('draw-battle-round-results', onRoundResults);
            SocketService.off('draw-battle-next-round-ready', onNextRoundReady);
            SocketService.off('draw-battle-game-finished', onGameFinished);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id]);

    useEffect(() => {
        if (phase !== 'drawing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { 
                    clearInterval(timer); 
                    if (phase === 'drawing') handleSubmitDrawing(); 
                    return 0; 
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setDots(prev => [...prev, { x: locationX, y: locationY, color: brushColor }]);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setDots(prev => [...prev, { x: locationX, y: locationY, color: brushColor }]);
            },
        })
    ).current;

    const handleSubmitDrawing = () => {
        if (phase !== 'drawing') return;
        SocketService.emit('draw-battle-submit-drawing', { roomId: room.id, drawingData: JSON.stringify(dots) });
        setPhase('submitted');
    };

    const handleVote = (targetUserId) => {
        if (hasVoted || targetUserId === SocketService.userId) return;
        SocketService.emit('draw-battle-vote', { roomId: room.id, votedForUserId: targetUserId });
        setHasVoted(true);
    };

    const handleStartRound = () => SocketService.emit('draw-battle-start-round', { roomId: room.id });
    const handleNextRound = () => SocketService.emit('draw-battle-next-round', { roomId: room.id });
    const handleBackToLobby = () => navigation.goBack();

    const renderMiniDrawing = (drawingData, size = 140) => {
        try {
            const pts = JSON.parse(drawingData);
            const scale = size / CANVAS_SIZE;
            return (
                <View style={[styles.miniCanvas, { width: size, height: size }]}>
                    {pts.slice(0, 800).map((p, i) => (
                        <View key={i} style={[styles.dotMini, { left: p.x * scale, top: p.y * scale, backgroundColor: p.color }]} />
                    ))}
                </View>
            );
        } catch { return <View style={[styles.miniCanvas, { width: size, height: size }]} />; }
    };

    return (
        <NeonContainer>
            <GameOverlay roomId={room.id} playerName={playerName}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View>
                            <NeonText size={18} weight="bold" glow color={COLORS.hotPink}>DRAW BATTLE</NeonText>
                            <NeonText size={12} color={COLORS.textMuted}>Round {currentRound}/{totalRounds}</NeonText>
                        </View>
                        <View style={styles.scoreBadge}>
                            <NeonText size={12} color="#aaa">MY SCORE</NeonText>
                            <NeonText size={18} weight="bold" color={COLORS.limeGlow}>{myScore}</NeonText>
                        </View>
                    </View>

                    {phase === 'waiting' && (
                        <View style={styles.centerContent}>
                            <Ionicons name="brush" size={60} color={COLORS.neonCyan} />
                            <NeonText size={24} weight="bold" glow style={styles.marginTop}>Ready for Round {currentRound}?</NeonText>
                            <NeonText size={16} color={COLORS.textMuted} style={styles.textCenter}>You'll have 60 seconds to draw the prompt. Best drawing wins the votes!</NeonText>
                            {isHost ? (
                                <NeonButton title="START ROUND" onPress={handleStartRound} style={styles.startBtn} />
                            ) : (
                                <NeonText size={14} color={COLORS.hotPink} style={styles.marginTop}>Waiting for host to start...</NeonText>
                            )}
                        </View>
                    )}

                    {phase === 'drawing' && (
                        <View style={styles.drawingContainer}>
                            <View style={styles.promptCard}>
                                <NeonText size={14} color={COLORS.textMuted}>DRAW THIS:</NeonText>
                                <NeonText size={24} weight="bold" color={COLORS.neonCyan} glow>{prompt}</NeonText>
                                <View style={styles.timerBar}>
                                    <View style={[styles.timerProgress, { width: `${(timeLeft/60)*100}%`, backgroundColor: timeLeft <= 10 ? COLORS.hotPink : COLORS.limeGlow }]} />
                                </View>
                                <NeonText size={14} color={timeLeft <= 10 ? COLORS.hotPink : COLORS.textMuted}>{timeLeft}s remaining</NeonText>
                            </View>

                            <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]} {...panResponder.panHandlers}>
                                {dots.map((p, i) => (
                                    <View key={i} style={[styles.dot, { left: p.x - 3, top: p.y - 3, backgroundColor: p.color }]} />
                                ))}
                            </View>

                            <View style={styles.toolsRow}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPicker}>
                                    {BRUSH_COLORS.map(c => (
                                        <TouchableOpacity key={c} style={[styles.colorBtn, { backgroundColor: c }, brushColor === c && styles.selectedColor]} onPress={() => setBrushColor(c)} />
                                    ))}
                                </ScrollView>
                                <TouchableOpacity style={styles.clearBtn} onPress={() => setDots([])}>
                                    <Ionicons name="trash-outline" size={24} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <NeonButton title="SUBMIT DRAWING" onPress={handleSubmitDrawing} style={styles.submitBtn} />
                        </View>
                    )}

                    {phase === 'submitted' && (
                        <View style={styles.centerContent}>
                            <Ionicons name="cloud-upload" size={60} color={COLORS.limeGlow} />
                            <NeonText size={22} weight="bold" color={COLORS.limeGlow} style={styles.marginTop}>Drawing Sent!</NeonText>
                            <NeonText size={16} color={COLORS.textMuted} style={styles.marginTop}>Waiting for others... ({submittedCount}/{totalPlayers})</NeonText>
                        </View>
                    )}

                    {phase === 'voting' && (
                        <View style={styles.votingContainer}>
                            <View style={styles.votingHeader}>
                                <NeonText size={14} color={COLORS.textMuted}>PROMPT WAS:</NeonText>
                                <NeonText size={20} weight="bold" color={COLORS.neonCyan}>"{prompt}"</NeonText>
                                <NeonText size={14} color={COLORS.hotPink} style={styles.marginTop}>Vote for the best one!</NeonText>
                            </View>

                            <View style={styles.drawingsGrid}>
                                {drawings.map((item) => (
                                    <TouchableOpacity 
                                        key={item.userId} 
                                        style={[styles.drawingCard, hasVoted && styles.dim, item.userId === SocketService.userId && styles.myCard]} 
                                        onPress={() => handleVote(item.userId)} 
                                        disabled={hasVoted || item.userId === SocketService.userId}
                                    >
                                        {renderMiniDrawing(item.drawing)}
                                        {item.userId === SocketService.userId && (
                                            <View style={styles.myLabel}>
                                                <NeonText size={10} weight="bold" color={COLORS.neonCyan}>YOURS</NeonText>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {hasVoted && (
                                <View style={styles.voteConfirmation}>
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.limeGlow} />
                                    <NeonText size={14} color={COLORS.limeGlow}> Vote recorded!</NeonText>
                                </View>
                            )}
                        </View>
                    )}

                    {phase === 'results' && roundResults && (
                        <View style={styles.resultsContainer}>
                            <NeonText size={22} weight="bold" glow>ROUND {roundResults.currentRound} RESULTS</NeonText>
                            
                            {roundResults.winner && (
                                <View style={styles.winnerCard}>
                                    <NeonText size={14} color={COLORS.textMuted}>ROUND WINNER</NeonText>
                                    <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow>{roundResults.winner.name}</NeonText>
                                    {renderMiniDrawing(roundResults.results[0].drawing, 200)}
                                </View>
                            )}

                            <View style={styles.standingsList}>
                                <NeonText size={14} weight="bold" color={COLORS.textDarkMuted} style={styles.standingTitle}>LEADERBOARD</NeonText>
                                {roundResults.standings.map((p, i) => (
                                    <View key={p.userId} style={styles.standingRow}>
                                        <NeonText size={16} color={i === 0 ? COLORS.neonCyan : '#ccc'}>#{i+1} {p.name}</NeonText>
                                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>{p.score} pts</NeonText>
                                    </View>
                                ))}
                            </View>

                            {isHost && (
                                <NeonButton 
                                    title={currentRound >= totalRounds ? "VIEW FINAL RESULTS" : "START NEXT ROUND"} 
                                    onPress={handleNextRound} 
                                    style={styles.nextBtn} 
                                />
                            )}
                        </View>
                    )}

                    {phase === 'finished' && finalResults && (
                        <View style={styles.centerContent}>
                            <Ionicons name="trophy" size={80} color="#FFD700" />
                            <NeonText size={14} color={COLORS.textMuted} style={styles.marginTop}>GAME CHAMPION</NeonText>
                            <NeonText size={36} weight="bold" glow color={COLORS.limeGlow}>{finalResults.winner?.name}</NeonText>
                            <NeonText size={24} color={COLORS.neonCyan}>{finalResults.winner?.score} total pts</NeonText>
                            
                            <NeonButton title="BACK TO LOBBY" onPress={handleBackToLobby} style={styles.lobbyBtn} />
                        </View>
                    )}
            </ScrollView>
        </GameOverlay>
    </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    scoreBadge: {
        alignItems: 'flex-end'
    },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 40 },
    textCenter: { textAlign: 'center', lineHeight: 22, marginTop: 10 },
    marginTop: { marginTop: 20 },
    startBtn: { marginTop: 40, minWidth: 200 },
    drawingContainer: { alignItems: 'center', paddingHorizontal: 15, paddingTop: 20 },
    promptCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.2)'
    },
    timerBar: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 3,
        marginVertical: 12,
        overflow: 'hidden'
    },
    timerProgress: {
        height: '100%',
    },
    canvas: { 
        backgroundColor: '#0a0a0a', 
        borderRadius: 20, 
        borderWidth: 3, 
        borderColor: COLORS.neonCyan, 
        position: 'relative', 
        overflow: 'hidden',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5
    },
    dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    dotMini: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
    toolsRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        width: '100%', 
        marginTop: 20,
        paddingHorizontal: 10
    },
    colorPicker: { flexDirection: 'row', gap: 12, paddingRight: 10 },
    colorBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
    selectedColor: { borderColor: COLORS.white, borderWidth: 3 },
    clearBtn: {
        padding: 10,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 10,
        marginLeft: 10
    },
    submitBtn: { marginTop: 30, width: '100%', height: 60 },
    votingContainer: { alignItems: 'center', paddingHorizontal: 15, paddingTop: 20 },
    votingHeader: { alignItems: 'center', marginBottom: 25 },
    drawingsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: 15,
        width: '100%'
    },
    drawingCard: { 
        padding: 10, 
        borderRadius: 15, 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    myCard: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.05)'
    },
    myLabel: {
        marginTop: 5,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 5
    },
    dim: { opacity: 0.5 },
    miniCanvas: { backgroundColor: '#0a0a0a', borderRadius: 10, position: 'relative', overflow: 'hidden' },
    voteConfirmation: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
    resultsContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    winnerCard: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(198, 255, 74, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginVertical: 25,
        borderWidth: 2,
        borderColor: COLORS.limeGlow
    },
    standingsList: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30
    },
    standingTitle: { marginBottom: 15, textAlign: 'center', letterSpacing: 2 },
    standingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    nextBtn: { minWidth: 220, height: 55 },
    lobbyBtn: { marginTop: 40, minWidth: 200 }
});

export default DrawBattleScreen;
