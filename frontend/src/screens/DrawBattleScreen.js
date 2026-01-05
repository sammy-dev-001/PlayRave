import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 40, 300);

const BRUSH_COLORS = ['#ffffff', COLORS.neonCyan, COLORS.hotPink, COLORS.limeGlow, COLORS.electricPurple, '#ff9900'];

const DrawBattleScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('waiting');
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 5);
    const [prompt, setPrompt] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [dots, setDots] = useState([]);
    const [brushColor, setBrushColor] = useState('#ffffff');
    const [drawings, setDrawings] = useState([]);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [roundResults, setRoundResults] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [myScore, setMyScore] = useState(0);

    useEffect(() => {
        const onRoundStarted = (data) => {
            setPrompt(data.prompt);
            setTimeLeft(data.drawingTime);
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
            const me = data.standings.find(p => p.id === SocketService.socket?.id);
            if (me) setMyScore(me.score);
            setPhase('results');
        };

        const onNextRoundReady = ({ nextRound }) => {
            setCurrentRound(nextRound);
            setPhase('waiting');
        };

        const onGameFinished = (data) => {
            setFinalResults(data);
            setPhase('finished');
        };

        const onGameEnded = ({ room: updatedRoom }) => {
            navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost });
        };

        SocketService.on('draw-battle-round-started', onRoundStarted);
        SocketService.on('draw-battle-submission-update', onSubmissionUpdate);
        SocketService.on('draw-battle-voting-started', onVotingStarted);
        SocketService.on('draw-battle-round-results', onRoundResults);
        SocketService.on('draw-battle-next-round-ready', onNextRoundReady);
        SocketService.on('draw-battle-game-finished', onGameFinished);
        SocketService.on('draw-battle-game-ended', onGameEnded);

        return () => {
            SocketService.off('draw-battle-round-started', onRoundStarted);
            SocketService.off('draw-battle-submission-update', onSubmissionUpdate);
            SocketService.off('draw-battle-voting-started', onVotingStarted);
            SocketService.off('draw-battle-round-results', onRoundResults);
            SocketService.off('draw-battle-next-round-ready', onNextRoundReady);
            SocketService.off('draw-battle-game-finished', onGameFinished);
            SocketService.off('draw-battle-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost]);

    useEffect(() => {
        if (phase !== 'drawing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); handleSubmitDrawing(); return 0; }
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
        SocketService.emit('draw-battle-submit-drawing', { roomId: room.id, drawingData: JSON.stringify(dots) });
        setPhase('submitted');
    };

    const handleVote = (playerId) => {
        if (hasVoted || playerId === SocketService.socket?.id) return;
        SocketService.emit('draw-battle-vote', { roomId: room.id, votedPlayerId: playerId });
        setHasVoted(true);
    };

    const handleStartRound = () => SocketService.emit('draw-battle-start-round', { roomId: room.id });
    const handleNextRound = () => SocketService.emit('draw-battle-next-round', { roomId: room.id });
    const handleBackToLobby = () => SocketService.emit('draw-battle-end-game', { roomId: room.id });

    const renderMiniDrawing = (drawingData, size = 120) => {
        try {
            const pts = JSON.parse(drawingData);
            const scale = size / CANVAS_SIZE;
            return (
                <View style={[styles.miniCanvas, { width: size, height: size }]}>
                    {pts.slice(0, 500).map((p, i) => (
                        <View key={i} style={[styles.dot, { left: p.x * scale - 2, top: p.y * scale - 2, backgroundColor: p.color }]} />
                    ))}
                </View>
            );
        } catch { return <View style={[styles.miniCanvas, { width: size, height: size }]} />; }
    };

    return (
        <NeonContainer>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <NeonText size={22} weight="bold" glow color={COLORS.hotPink}>🎨 DRAW BATTLE</NeonText>
                        <NeonText size={14} color={COLORS.limeGlow}>Score: {myScore}</NeonText>
                    </View>

                    {phase === 'waiting' && (
                        <View style={styles.centerContent}>
                            <NeonText size={24} weight="bold" glow>Round {currentRound}/{totalRounds}</NeonText>
                            <NeonText size={16} color="#888">Get ready to draw!</NeonText>
                            {isHost && <NeonButton title="START" onPress={handleStartRound} style={styles.btn} />}
                        </View>
                    )}

                    {phase === 'drawing' && (
                        <View style={styles.drawingContainer}>
                            <View style={styles.promptRow}>
                                <NeonText size={16} weight="bold" color={COLORS.neonCyan}>{prompt}</NeonText>
                                <NeonText size={18} weight="bold" color={timeLeft <= 10 ? COLORS.hotPink : COLORS.limeGlow}>{timeLeft}s</NeonText>
                            </View>
                            <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]} {...panResponder.panHandlers}>
                                {dots.map((p, i) => (
                                    <View key={i} style={[styles.dot, { left: p.x - 3, top: p.y - 3, backgroundColor: p.color }]} />
                                ))}
                            </View>
                            <View style={styles.colorPicker}>
                                {BRUSH_COLORS.map(c => (
                                    <TouchableOpacity key={c} style={[styles.colorBtn, { backgroundColor: c }, brushColor === c && styles.selectedColor]} onPress={() => setBrushColor(c)} />
                                ))}
                            </View>
                            <View style={styles.btnRow}>
                                <NeonButton title="CLEAR" variant="secondary" onPress={() => setDots([])} style={styles.smallBtn} />
                                <NeonButton title="SUBMIT" onPress={handleSubmitDrawing} style={styles.smallBtn} />
                            </View>
                        </View>
                    )}

                    {phase === 'submitted' && (
                        <View style={styles.centerContent}>
                            <NeonText size={20} weight="bold" color={COLORS.limeGlow}>✓ Submitted!</NeonText>
                            <NeonText size={16} color="#888">Waiting... ({submittedCount}/{totalPlayers})</NeonText>
                        </View>
                    )}

                    {phase === 'voting' && (
                        <View style={styles.votingContainer}>
                            <NeonText size={16} weight="bold">Vote for: "{prompt}"</NeonText>
                            <View style={styles.grid}>
                                {drawings.map((item) => (
                                    <TouchableOpacity key={item.playerId} style={[styles.card, hasVoted && styles.dim]} onPress={() => handleVote(item.playerId)} disabled={hasVoted || item.playerId === SocketService.socket?.id}>
                                        {renderMiniDrawing(item.drawing)}
                                        {item.playerId === SocketService.socket?.id && <NeonText size={10} color={COLORS.neonCyan}>(Yours)</NeonText>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {hasVoted && <NeonText size={14} color={COLORS.limeGlow}>Vote sent!</NeonText>}
                        </View>
                    )}

                    {phase === 'results' && roundResults && (
                        <View style={styles.centerContent}>
                            <NeonText size={20} weight="bold" glow>Round {roundResults.currentRound} Winner</NeonText>
                            {roundResults.winner && <NeonText size={24} weight="bold" color={COLORS.limeGlow}>{roundResults.winner.name}</NeonText>}
                            {isHost && <NeonButton title={currentRound >= totalRounds ? "FINAL" : "NEXT"} onPress={handleNextRound} style={styles.btn} />}
                        </View>
                    )}

                    {phase === 'finished' && finalResults && (
                        <View style={styles.centerContent}>
                            <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>🏆 {finalResults.winner?.name} WINS!</NeonText>
                            <NeonButton title="LOBBY" variant="secondary" onPress={handleBackToLobby} style={styles.btn} />
                        </View>
                    )}
                </View>
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1 },
    container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
    drawingContainer: { alignItems: 'center' },
    promptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
    canvas: { backgroundColor: '#111', borderRadius: 12, borderWidth: 2, borderColor: COLORS.neonCyan, position: 'relative', overflow: 'hidden' },
    miniCanvas: { backgroundColor: '#111', borderRadius: 8, position: 'relative', overflow: 'hidden' },
    dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
    colorPicker: { flexDirection: 'row', gap: 8, marginTop: 12 },
    colorBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
    selectedColor: { borderColor: '#fff', borderWidth: 3 },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    smallBtn: { minWidth: 90 },
    btn: { marginTop: 20, minWidth: 150 },
    votingContainer: { alignItems: 'center', gap: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    card: { padding: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    dim: { opacity: 0.5 },
});

export default DrawBattleScreen;
