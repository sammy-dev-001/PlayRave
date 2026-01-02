import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    PanResponder,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 40, 350);

const BRUSH_COLORS = ['#ffffff', COLORS.neonCyan, COLORS.hotPink, COLORS.limeGlow, COLORS.electricPurple, '#ff9900'];

const DrawBattleScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('waiting'); // waiting, drawing, submitted, voting, results, finished
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(initialGameState?.totalRounds || 5);
    const [prompt, setPrompt] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [brushColor, setBrushColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(4);
    const [drawings, setDrawings] = useState([]);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [roundResults, setRoundResults] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [myScore, setMyScore] = useState(0);

    const svgRef = useRef(null);

    // Socket listeners
    useEffect(() => {
        const onRoundStarted = (data) => {
            console.log('Round started:', data);
            setPrompt(data.prompt);
            setTimeLeft(data.drawingTime);
            setCurrentRound(data.round);
            setTotalRounds(data.totalRounds);
            setPaths([]);
            setCurrentPath('');
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

    // Drawing timer
    useEffect(() => {
        if (phase !== 'drawing') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitDrawing();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    // Pan responder for drawing
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => phase === 'drawing',
            onMoveShouldSetPanResponder: () => phase === 'drawing',
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(prev => prev + ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
            },
            onPanResponderRelease: () => {
                if (currentPath) {
                    setPaths(prev => [...prev, { d: currentPath, color: brushColor, width: brushSize }]);
                    setCurrentPath('');
                }
            }
        })
    ).current;

    const handleSubmitDrawing = () => {
        // Convert paths to serializable format
        const drawingData = JSON.stringify(paths);

        SocketService.emit('draw-battle-submit-drawing', {
            roomId: room.id,
            drawingData
        });
        setPhase('submitted');
    };

    const handleVote = (playerId) => {
        if (hasVoted || playerId === SocketService.socket?.id) return;

        SocketService.emit('draw-battle-vote', {
            roomId: room.id,
            votedPlayerId: playerId
        });
        setHasVoted(true);
    };

    const handleStartRound = () => {
        SocketService.emit('draw-battle-start-round', { roomId: room.id });
    };

    const handleNextRound = () => {
        SocketService.emit('draw-battle-next-round', { roomId: room.id });
    };

    const handleBackToLobby = () => {
        SocketService.emit('draw-battle-end-game', { roomId: room.id });
    };

    const handleClear = () => {
        setPaths([]);
        setCurrentPath('');
    };

    const renderDrawing = (drawingData, size = CANVAS_SIZE * 0.4) => {
        try {
            const drawingPaths = JSON.parse(drawingData);
            const scale = size / CANVAS_SIZE;

            return (
                <Svg width={size} height={size} style={{ backgroundColor: '#111' }}>
                    {drawingPaths.map((path, index) => (
                        <Path
                            key={index}
                            d={path.d}
                            stroke={path.color}
                            strokeWidth={path.width * scale}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            transform={`scale(${scale})`}
                        />
                    ))}
                </Svg>
            );
        } catch (e) {
            return <View style={[styles.emptyDrawing, { width: size, height: size }]} />;
        }
    };

    return (
        <NeonContainer>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <NeonText size={22} weight="bold" glow color={COLORS.hotPink}>
                            🎨 DRAW BATTLE
                        </NeonText>
                        <View style={styles.roundInfo}>
                            <NeonText size={14} color="#888">Round {currentRound}/{totalRounds}</NeonText>
                            <NeonText size={14} color={COLORS.limeGlow}>Score: {myScore}</NeonText>
                        </View>
                    </View>

                    {/* Waiting Phase */}
                    {phase === 'waiting' && (
                        <View style={styles.centerContent}>
                            <NeonText size={24} weight="bold" glow>Round {currentRound}</NeonText>
                            <NeonText size={16} color="#888" style={styles.subtitle}>
                                Get ready to draw!
                            </NeonText>
                            {isHost && (
                                <NeonButton title="START DRAWING" onPress={handleStartRound} style={styles.actionButton} />
                            )}
                        </View>
                    )}

                    {/* Drawing Phase */}
                    {phase === 'drawing' && (
                        <View style={styles.drawingContainer}>
                            <View style={styles.promptRow}>
                                <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                    Draw: {prompt}
                                </NeonText>
                                <NeonText size={18} weight="bold" color={timeLeft <= 10 ? COLORS.hotPink : COLORS.limeGlow}>
                                    {timeLeft}s
                                </NeonText>
                            </View>

                            <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]} {...panResponder.panHandlers}>
                                <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
                                    {paths.map((path, index) => (
                                        <Path
                                            key={index}
                                            d={path.d}
                                            stroke={path.color}
                                            strokeWidth={path.width}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                    {currentPath && (
                                        <Path
                                            d={currentPath}
                                            stroke={brushColor}
                                            strokeWidth={brushSize}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </Svg>
                            </View>

                            <View style={styles.colorPicker}>
                                {BRUSH_COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorButton,
                                            { backgroundColor: color },
                                            brushColor === color && styles.selectedColor
                                        ]}
                                        onPress={() => setBrushColor(color)}
                                    />
                                ))}
                            </View>

                            <View style={styles.brushControls}>
                                <NeonButton title="CLEAR" variant="secondary" onPress={handleClear} style={styles.smallButton} />
                                <NeonButton title="SUBMIT" onPress={handleSubmitDrawing} style={styles.smallButton} />
                            </View>
                        </View>
                    )}

                    {/* Submitted Phase */}
                    {phase === 'submitted' && (
                        <View style={styles.centerContent}>
                            <NeonText size={20} weight="bold" color={COLORS.limeGlow}>✓ Drawing Submitted!</NeonText>
                            <NeonText size={16} color="#888" style={styles.subtitle}>
                                Waiting for others... ({submittedCount}/{totalPlayers})
                            </NeonText>
                        </View>
                    )}

                    {/* Voting Phase */}
                    {phase === 'voting' && (
                        <View style={styles.votingContainer}>
                            <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                                Vote for the best: "{prompt}"
                            </NeonText>
                            <View style={styles.drawingsGrid}>
                                {drawings.map((item) => (
                                    <TouchableOpacity
                                        key={item.playerId}
                                        style={[styles.drawingCard, hasVoted && styles.votedCard]}
                                        onPress={() => handleVote(item.playerId)}
                                        disabled={hasVoted || item.playerId === SocketService.socket?.id}
                                    >
                                        {renderDrawing(item.drawing)}
                                        {item.playerId === SocketService.socket?.id && (
                                            <NeonText size={10} color={COLORS.neonCyan}>(Yours)</NeonText>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {hasVoted && (
                                <NeonText size={14} color={COLORS.limeGlow}>Vote submitted! Waiting for others...</NeonText>
                            )}
                        </View>
                    )}

                    {/* Results Phase */}
                    {phase === 'results' && roundResults && (
                        <View style={styles.resultsContainer}>
                            <NeonText size={20} weight="bold" glow>Round {roundResults.currentRound} Winner</NeonText>
                            {roundResults.winner && (
                                <NeonText size={24} weight="bold" color={COLORS.limeGlow}>{roundResults.winner.name}</NeonText>
                            )}
                            <View style={styles.resultsList}>
                                {roundResults.results?.slice(0, 3).map((r, i) => (
                                    <View key={r.id} style={styles.resultRow}>
                                        <NeonText size={14}>#{i + 1} {r.name}</NeonText>
                                        <NeonText size={14} color={COLORS.neonCyan}>{r.votes} votes (+{r.points})</NeonText>
                                    </View>
                                ))}
                            </View>
                            {isHost && (
                                <NeonButton
                                    title={currentRound >= totalRounds ? "FINAL RESULTS" : "NEXT ROUND"}
                                    onPress={handleNextRound}
                                    style={styles.actionButton}
                                />
                            )}
                        </View>
                    )}

                    {/* Finished Phase */}
                    {phase === 'finished' && finalResults && (
                        <View style={styles.finishedContainer}>
                            <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                                🏆 {finalResults.winner?.name} WINS! 🏆
                            </NeonText>
                            <View style={styles.finalRankings}>
                                {finalResults.rankings?.map((p, i) => (
                                    <View key={p.id} style={[styles.resultRow, i === 0 && styles.winnerRow]}>
                                        <NeonText size={16}>#{i + 1} {p.name}</NeonText>
                                        <NeonText size={16} color={COLORS.neonCyan}>{p.score} pts</NeonText>
                                    </View>
                                ))}
                            </View>
                            <NeonButton title="BACK TO LOBBY" variant="secondary" onPress={handleBackToLobby} style={styles.actionButton} />
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
    roundInfo: { alignItems: 'flex-end' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { marginTop: 10 },
    actionButton: { marginTop: 30, minWidth: 200 },
    drawingContainer: { alignItems: 'center' },
    promptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
    canvas: { backgroundColor: '#111', borderRadius: 15, borderWidth: 2, borderColor: COLORS.neonCyan, overflow: 'hidden' },
    colorPicker: { flexDirection: 'row', gap: 10, marginTop: 15 },
    colorButton: { width: 35, height: 35, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    selectedColor: { borderColor: '#fff', borderWidth: 3 },
    brushControls: { flexDirection: 'row', gap: 15, marginTop: 15 },
    smallButton: { minWidth: 100 },
    votingContainer: { alignItems: 'center' },
    sectionTitle: { marginBottom: 20 },
    drawingsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    drawingCard: { padding: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    votedCard: { opacity: 0.6 },
    emptyDrawing: { backgroundColor: '#222', borderRadius: 10 },
    resultsContainer: { alignItems: 'center', paddingTop: 30 },
    resultsList: { width: '100%', marginTop: 20 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
    winnerRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    finishedContainer: { alignItems: 'center', paddingTop: 30 },
    finalRankings: { width: '100%', marginTop: 30, marginBottom: 30 },
});

export default DrawBattleScreen;
