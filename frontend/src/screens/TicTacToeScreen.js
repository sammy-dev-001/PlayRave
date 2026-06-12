import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Vibration,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import TournamentBracket from '../components/TournamentBracket';
import GameOverlay from '../components/GameOverlay';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { COLORS } from '../constants/theme';

const TicTacToeScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState(
        (initialGameState?.phase === 'lobby' ? 'bracket' : initialGameState?.phase) || 'bracket'
    );
    const [matches, setMatches] = useState(initialGameState?.matches || []);
    const [roundNumber, setRoundNumber] = useState(initialGameState?.roundNumber || 1);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(initialGameState?.currentMatchIndex || 0);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [currentTurn, setCurrentTurn] = useState(null);
    const [player1, setPlayer1] = useState(null);
    const [player2, setPlayer2] = useState(null);
    const [matchResult, setMatchResult] = useState(null);
    const [champion, setChampion] = useState(null);
    const [allPlayers, setAllPlayers] = useState(initialGameState?.players || []);
    const [isAIMatch, setIsAIMatch] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);
    // FIX 9: Track the 3 winning cell indices for highlight
    const [winningLine, setWinningLine] = useState(null);
    // FIX 5: Track next-round data for roundComplete display
    const [nextRoundNumber, setNextRoundNumber] = useState(null);

    const myId = SocketService.userId;
    const isMyTurn = currentTurn === myId;
    const amInMatch = player1?.userId === myId || player2?.userId === myId;
    const mySymbol = player1?.userId === myId ? 'X' : 'O';

    // Animation for AI thinking
    const thinkingAnim = useRef(new Animated.Value(0)).current;
    const thinkingLoop = useRef(null);
    const cellAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        return () => {
            if (thinkingLoop.current) thinkingLoop.current.stop();
        };
    }, []);

    useEffect(() => {
        const onGameStarted = (data) => {
            console.log('TicTacToe game started:', data);
            if (data.gameState) handleStateUpdate(data.gameState);
        };

        const onMatchStarted = (data) => {
            console.log('Match started:', data);
            setPlayer1(data.player1);
            setPlayer2(data.player2);
            setBoard(data.board);
            setCurrentTurn(data.currentTurn);
            setIsAIMatch(data.isAIMatch || false);
            setAiThinking(false);
            setPhase('playing');
            cellAnims.forEach(anim => anim.setValue(0));
        };

        const onMoveMade = (data) => {
            setAiThinking(false);
            if (thinkingLoop.current) thinkingLoop.current.stop();
            setBoard(data.board);
            if (!data.gameOver) {
                setCurrentTurn(data.currentTurn);
            }
            if (data.position !== undefined && cellAnims[data.position]) {
                Animated.spring(cellAnims[data.position], {
                    toValue: 1,
                    friction: 3,
                    useNativeDriver: Platform.OS !== 'web'
                }).start();
            }
            if (data.gameOver && Platform.OS !== 'web') Vibration.vibrate(100);
        };

        const onAIThinking = () => {
            setAiThinking(true);
            thinkingLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(thinkingAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(thinkingAnim, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                ])
            );
            thinkingLoop.current.start();
        };

        const onMatchEnded = (data) => {
            setAiThinking(false);
            if (thinkingLoop.current) thinkingLoop.current.stop();
            setMatchResult(data);
            // FIX 9: Store winning line indices if server provides them
            setWinningLine(data?.winningLine || null);
            setPhase('matchResult');
        };

        const onNextMatchReady = (data) => {
            setPhase('bracket');
            setMatchResult(null);
            setWinningLine(null); // FIX 9: reset winning line for next match
            setIsAIMatch(false);
            setBoard(Array(9).fill(null));
            if (data?.nextMatchIndex !== undefined) setCurrentMatchIndex(data.nextMatchIndex);
        };

        const onRoundComplete = (data) => {
            setNextRoundNumber(data.nextRound);
            setMatches(data.nextMatches);
            setWinningLine(null);
            setPhase('roundComplete'); // FIX 5: set correct phase string
        };

        const onTournamentFinished = (data) => {
            setChampion(data.champion);
            setAllPlayers(data.allPlayers);
            setPhase('finished');
        };

        const onGameStateSync = (data) => {
            if (data && (data.gameType === 'tic-tac-toe' || data.type === 'tic-tac-toe')) {
                handleStateUpdate(data.gameState || data);
            }
        };

        const handleStateUpdate = (state) => {
            // Map engine's 'lobby' phase to the frontend 'bracket' view
            if (state.phase) setPhase(state.phase === 'lobby' ? 'bracket' : state.phase);
            if (state.roundNumber) setRoundNumber(state.roundNumber);
            if (state.currentMatchIndex !== undefined) setCurrentMatchIndex(state.currentMatchIndex);
            if (state.players) setAllPlayers(state.players);
            if (state.matches) setMatches(state.matches);
            if (state.currentMatch) {
                setPlayer1(state.currentMatch.player1);
                setPlayer2(state.currentMatch.player2);
                setBoard(state.currentMatch.board || Array(9).fill(null));
                setCurrentTurn(state.currentMatch.currentTurn);
            }
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('ttt-match-started', onMatchStarted);
        SocketService.on('ttt-move-made', onMoveMade);
        SocketService.on('ttt-ai-thinking', onAIThinking);
        SocketService.on('ttt-match-ended', onMatchEnded);
        SocketService.on('ttt-next-match-ready', onNextMatchReady);
        SocketService.on('ttt-round-complete', onRoundComplete);
        SocketService.on('ttt-tournament-finished', onTournamentFinished);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch initial state
        SocketService.emit('ttt-get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('ttt-match-started', onMatchStarted);
            SocketService.off('ttt-move-made', onMoveMade);
            SocketService.off('ttt-ai-thinking', onAIThinking);
            SocketService.off('ttt-match-ended', onMatchEnded);
            SocketService.off('ttt-next-match-ready', onNextMatchReady);
            SocketService.off('ttt-round-complete', onRoundComplete);
            SocketService.off('ttt-tournament-finished', onTournamentFinished);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [navigation, room.id]);

    const handleCellPress = (index) => {
        if (!isMyTurn || board[index] !== null || !amInMatch) return;
        if (Platform.OS !== 'web') Vibration.vibrate(10);
        SocketService.emit('ttt-make-move', {
            roomId: room.id,
            position: index
        });
    };

    const handleStartMatch = () => SocketService.emit('ttt-start-match', { roomId: room.id });
    const handleNextMatch = () => SocketService.emit('ttt-next-match', { roomId: room.id });
    const handleEndGame = () => {
        Alert.alert("End Game", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "End Game", style: "destructive", onPress: () => SocketService.emit('ttt-end-game', { roomId: room.id }) }
        ]);
    };

    const renderCell = (index) => {
        const value = board[index];
        const scale = cellAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
        });
        // FIX 9: Highlight winning line cells
        const isWinCell = winningLine?.includes(index);

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.cell,
                    value && styles.filledCell,
                    isWinCell && styles.winCell,
                ]}
                onPress={() => handleCellPress(index)}
                disabled={!isMyTurn || board[index] !== null || !amInMatch}
            >
                {value && (
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Ionicons
                            name={value === 'X' ? 'close' : 'ellipse-outline'}
                            size={56}
                            color={value === 'X' ? COLORS.neonCyan : COLORS.hotPink}
                        />
                    </Animated.View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <NeonContainer 
            showBackButton 
            onBackPress={() => {
                if (isHost) handleEndGame();
                else navigation.navigate('Lobby', { room, isHost, playerName });
            }}
        >
            <GameOverlay roomId={room.id} playerName={playerName}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <NeonText size={20} weight="bold" glow color={COLORS.electricPurple}>TIC-TAC-TOE TOURNAMENT</NeonText>
                        <NeonText size={14} color="#888">Round {roundNumber}</NeonText>
                    </View>

                    {phase === 'bracket' && (
                        <View style={styles.phaseContainer}>
                            <NeonText size={18} weight="bold" style={styles.sectionTitle}>Tournament Bracket</NeonText>
                            <TournamentBracket
                                rounds={[{ matches: matches }]}
                                currentMatch={{ round: roundNumber, match: currentMatchIndex }}
                                allPlayers={allPlayers}
                            />
                            {isHost && (
                                <NeonButton title="START MATCH" onPress={handleStartMatch} style={styles.actionButton} />
                            )}
                        </View>
                    )}

                    {phase === 'playing' && (
                        <View style={styles.phaseContainer}>
                            <View style={styles.playersRow}>
                                <View style={[styles.playerTag, currentTurn === player1?.userId && styles.activeTag]}>
                                    <NeonText size={14} weight="bold" color={COLORS.neonCyan}>{player1?.name} (X)</NeonText>
                                </View>
                                <NeonText size={16} color="#666">VS</NeonText>
                                <View style={[styles.playerTag, currentTurn === player2?.userId && styles.activeTag]}>
                                    <NeonText size={14} weight="bold" color={COLORS.hotPink}>{player2?.name} (O)</NeonText>
                                </View>
                            </View>

                            {aiThinking && (
                                <Animated.View style={[styles.thinking, { opacity: thinkingAnim }]}>
                                    <NeonText size={16} color={COLORS.electricPurple}>AI is thinking...</NeonText>
                                </Animated.View>
                            )}

                            <NeonText size={16} color={isMyTurn ? COLORS.limeGlow : '#888'} style={styles.turnText}>
                                {amInMatch ? (isMyTurn ? "Your turn!" : "Opponent's turn...") : "Spectating Match"}
                            </NeonText>

                            <View style={styles.board}>
                                {[0, 1, 2].map(row => (
                                    <View key={row} style={styles.boardRow}>
                                        {[0, 1, 2].map(col => renderCell(row * 3 + col))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {phase === 'matchResult' && (
                        <View style={styles.centerContent}>
                            {matchResult?.winner ? (
                                <>
                                    <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>{matchResult.winner.name} WINS!</NeonText>
                                    <NeonText size={16} color="#888" style={styles.marginTop}>Advancing to next round</NeonText>
                                </>
                            ) : (
                                <NeonText size={28} weight="bold" glow color={COLORS.hotPink}>IT'S A DRAW!</NeonText>
                            )}
                            {isHost && <NeonButton title="CONTINUE" onPress={handleNextMatch} style={styles.actionButton} />}
                        </View>
                    )}

                    {/* FIX 5: roundComplete phase — was previously a blank screen */}
                    {phase === 'roundComplete' && (
                        <View style={styles.centerContent}>
                            <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                                🏆 ROUND {nextRoundNumber ? nextRoundNumber - 1 : roundNumber} COMPLETE!
                            </NeonText>
                            <NeonText size={16} color={COLORS.neonCyan} style={styles.marginTop}>
                                Round {nextRoundNumber || roundNumber + 1} starting...
                            </NeonText>
                            <NeonText size={14} color="#888" style={styles.marginTop}>
                                {isHost ? 'Advancing bracket...' : 'Waiting for host...'}
                            </NeonText>
                            {isHost && (
                                <NeonButton
                                    title="CONTINUE TO NEXT ROUND"
                                    onPress={() => {
                                        setRoundNumber(nextRoundNumber || roundNumber + 1);
                                        setPhase('bracket');
                                    }}
                                    style={styles.actionButton}
                                />
                            )}
                        </View>
                    )}

                    {phase === 'finished' && (
                        <View style={styles.centerContent}>
                            <Ionicons name="trophy" size={80} color="#FFD700" />
                            <NeonText size={32} weight="bold" glow color={COLORS.limeGlow}>CHAMPION</NeonText>
                            <NeonText size={28} weight="bold" color={COLORS.neonCyan}>{champion?.name}</NeonText>
                            <NeonButton title="BACK TO LOBBY" variant="secondary" onPress={() => navigation.navigate('Lobby', { room, isHost, playerName })} style={styles.actionButton} />
                        </View>
                    )}
                </ScrollView>
            </GameOverlay>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: 15 },
    header: { alignItems: 'center', marginVertical: 20 },
    phaseContainer: { alignItems: 'center', width: '100%' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    sectionTitle: { marginBottom: 20 },
    actionButton: { marginTop: 30, minWidth: 200 },
    playersRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
    playerTag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    activeTag: { borderColor: COLORS.limeGlow, backgroundColor: 'rgba(198,255,74,0.1)' },
    turnText: { marginBottom: 20 },
    thinking: { marginBottom: 15 },
    board: { padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    boardRow: { flexDirection: 'row' },
    cell: { width: 90, height: 90, margin: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    filledCell: { borderColor: 'rgba(255,255,255,0.1)' },
    // FIX 9: Winning line glow
    winCell: { borderColor: COLORS.limeGlow, backgroundColor: 'rgba(198, 255, 74, 0.18)', shadowColor: COLORS.limeGlow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 12 },
    marginTop: { marginTop: 10 }
});

export default TicTacToeScreen;
