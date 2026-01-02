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

const TicTacToeScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialGameState } = route.params;

    const [phase, setPhase] = useState('bracket'); // bracket, playing, matchResult, roundComplete, finished
    const [matches, setMatches] = useState(initialGameState?.matches || []);
    const [roundNumber, setRoundNumber] = useState(initialGameState?.roundNumber || 1);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [currentTurn, setCurrentTurn] = useState(null);
    const [player1, setPlayer1] = useState(null);
    const [player2, setPlayer2] = useState(null);
    const [matchResult, setMatchResult] = useState(null);
    const [champion, setChampion] = useState(null);
    const [allPlayers, setAllPlayers] = useState(initialGameState?.players || []);

    const myId = SocketService.socket?.id;
    const isMyTurn = currentTurn === myId;
    const amInMatch = player1?.id === myId || player2?.id === myId;
    const mySymbol = player1?.id === myId ? 'X' : 'O';

    const cellAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const onMatchStarted = (data) => {
            console.log('Match started:', data);
            setPlayer1(data.player1);
            setPlayer2(data.player2);
            setBoard(data.board);
            setCurrentTurn(data.currentTurn);
            setPhase('playing');
            // Reset animations
            cellAnims.forEach(anim => anim.setValue(0));
        };

        const onMoveMade = (data) => {
            setBoard(data.board);
            if (!data.gameOver) {
                setCurrentTurn(data.currentTurn);
            }
            // Animate the placed cell
            Animated.spring(cellAnims[data.position], {
                toValue: 1,
                friction: 3,
                useNativeDriver: true
            }).start();

            if (data.gameOver) {
                if (Platform.OS !== 'web') Vibration.vibrate(100);
            }
        };

        const onMatchEnded = (data) => {
            setMatchResult(data);
            setPhase('matchResult');
        };

        const onNextMatchReady = () => {
            setPhase('bracket');
            setMatchResult(null);
            setBoard(Array(9).fill(null));
        };

        const onRoundComplete = (data) => {
            setRoundNumber(data.nextRound);
            setMatches(data.nextMatches);
            setPhase('roundComplete');
        };

        const onTournamentFinished = (data) => {
            setChampion(data.champion);
            setAllPlayers(data.allPlayers);
            setPhase('finished');
        };

        const onGameEnded = ({ room: updatedRoom }) => {
            navigation.navigate('Lobby', { room: updatedRoom, playerName, isHost });
        };

        SocketService.on('ttt-match-started', onMatchStarted);
        SocketService.on('ttt-move-made', onMoveMade);
        SocketService.on('ttt-match-ended', onMatchEnded);
        SocketService.on('ttt-next-match-ready', onNextMatchReady);
        SocketService.on('ttt-round-complete', onRoundComplete);
        SocketService.on('ttt-tournament-finished', onTournamentFinished);
        SocketService.on('ttt-game-ended', onGameEnded);

        return () => {
            SocketService.off('ttt-match-started', onMatchStarted);
            SocketService.off('ttt-move-made', onMoveMade);
            SocketService.off('ttt-match-ended', onMatchEnded);
            SocketService.off('ttt-next-match-ready', onNextMatchReady);
            SocketService.off('ttt-round-complete', onRoundComplete);
            SocketService.off('ttt-tournament-finished', onTournamentFinished);
            SocketService.off('ttt-game-ended', onGameEnded);
        };
    }, [navigation, playerName, isHost, cellAnims]);

    const handleCellPress = (index) => {
        if (!isMyTurn || board[index] !== null || !amInMatch) return;

        if (Platform.OS !== 'web') Vibration.vibrate(10);

        SocketService.emit('ttt-make-move', {
            roomId: room.id,
            position: index
        });
    };

    const handleStartMatch = () => {
        SocketService.emit('ttt-start-match', { roomId: room.id });
    };

    const handleNextMatch = () => {
        SocketService.emit('ttt-next-match', { roomId: room.id });
    };

    const handleBackToLobby = () => {
        SocketService.emit('ttt-end-game', { roomId: room.id });
    };

    const renderCell = (index) => {
        const value = board[index];
        const scale = cellAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
        });

        return (
            <TouchableOpacity
                key={index}
                style={[styles.cell, value && styles.filledCell]}
                onPress={() => handleCellPress(index)}
                disabled={!isMyTurn || board[index] !== null || !amInMatch}
                activeOpacity={0.7}
            >
                {value && (
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <NeonText
                            size={48}
                            weight="bold"
                            glow
                            color={value === 'X' ? COLORS.neonCyan : COLORS.hotPink}
                        >
                            {value}
                        </NeonText>
                    </Animated.View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <NeonContainer>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={22} weight="bold" glow color={COLORS.electricPurple}>
                        🎮 TIC-TAC-TOE TOURNAMENT
                    </NeonText>
                    <NeonText size={14} color="#888">Round {roundNumber}</NeonText>
                </View>

                {/* Bracket View */}
                {phase === 'bracket' && (
                    <View style={styles.bracketContainer}>
                        <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                            Upcoming Matches
                        </NeonText>
                        {matches.map((match, index) => (
                            <View key={index} style={styles.matchCard}>
                                <NeonText size={16} color={COLORS.neonCyan}>{match.player1}</NeonText>
                                <NeonText size={14} color="#666">vs</NeonText>
                                <NeonText size={16} color={COLORS.hotPink}>
                                    {match.player2 || 'BYE'}
                                </NeonText>
                                {match.isBye && (
                                    <NeonText size={12} color={COLORS.limeGlow}>(Auto-advance)</NeonText>
                                )}
                            </View>
                        ))}
                        {isHost && (
                            <NeonButton
                                title="START NEXT MATCH"
                                onPress={handleStartMatch}
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                )}

                {/* Playing Phase */}
                {phase === 'playing' && (
                    <View style={styles.gameContainer}>
                        <View style={styles.playersRow}>
                            <View style={[styles.playerTag, currentTurn === player1?.id && styles.activePlayer]}>
                                <NeonText size={14} weight="bold" color={COLORS.neonCyan}>
                                    {player1?.name} (X)
                                </NeonText>
                            </View>
                            <NeonText size={16} color="#666">vs</NeonText>
                            <View style={[styles.playerTag, currentTurn === player2?.id && styles.activePlayer]}>
                                <NeonText size={14} weight="bold" color={COLORS.hotPink}>
                                    {player2?.name} (O)
                                </NeonText>
                            </View>
                        </View>

                        {amInMatch && (
                            <NeonText size={16} color={isMyTurn ? COLORS.limeGlow : '#888'} style={styles.turnText}>
                                {isMyTurn ? "Your turn!" : "Opponent's turn..."}
                            </NeonText>
                        )}

                        {!amInMatch && (
                            <NeonText size={14} color="#888" style={styles.turnText}>
                                Watching match...
                            </NeonText>
                        )}

                        <View style={styles.board}>
                            {[0, 1, 2].map(row => (
                                <View key={row} style={styles.boardRow}>
                                    {[0, 1, 2].map(col => renderCell(row * 3 + col))}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Match Result */}
                {phase === 'matchResult' && (
                    <View style={styles.resultContainer}>
                        {matchResult?.winner ? (
                            <>
                                <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                                    🏆 {matchResult.winner.name} Wins!
                                </NeonText>
                                {matchResult.winner.id === myId && (
                                    <NeonText size={18} color={COLORS.neonCyan} style={styles.subtitle}>
                                        You advance to the next round!
                                    </NeonText>
                                )}
                            </>
                        ) : (
                            <NeonText size={28} weight="bold" glow color={COLORS.hotPink}>
                                It's a Draw!
                            </NeonText>
                        )}
                        {isHost && (
                            <NeonButton
                                title="CONTINUE"
                                onPress={handleNextMatch}
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                )}

                {/* Round Complete */}
                {phase === 'roundComplete' && (
                    <View style={styles.resultContainer}>
                        <NeonText size={24} weight="bold" glow>
                            Round {roundNumber - 1} Complete!
                        </NeonText>
                        <NeonText size={16} color="#888" style={styles.subtitle}>
                            Next Round Matchups:
                        </NeonText>
                        {matches.map((match, index) => (
                            <View key={index} style={styles.matchCard}>
                                <NeonText size={16}>{match.player1} vs {match.player2 || 'BYE'}</NeonText>
                            </View>
                        ))}
                        {isHost && (
                            <NeonButton
                                title="START NEXT ROUND"
                                onPress={handleStartMatch}
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                )}

                {/* Tournament Finished */}
                {phase === 'finished' && (
                    <View style={styles.finishedContainer}>
                        <NeonText size={32} weight="bold" glow color={COLORS.limeGlow}>
                            🏆 CHAMPION 🏆
                        </NeonText>
                        <NeonText size={28} weight="bold" color={COLORS.neonCyan} style={styles.championName}>
                            {champion?.name}
                        </NeonText>

                        <View style={styles.standings}>
                            {allPlayers.map((player, index) => (
                                <View key={player.id} style={[styles.standingRow, index === 0 && styles.championRow]}>
                                    <NeonText size={16}>#{index + 1}</NeonText>
                                    <NeonText size={16} style={styles.standingName}>{player.name}</NeonText>
                                    <NeonText size={14} color="#888">{player.wins} wins</NeonText>
                                </View>
                            ))}
                        </View>

                        <NeonButton
                            title="BACK TO LOBBY"
                            variant="secondary"
                            onPress={handleBackToLobby}
                            style={styles.actionButton}
                        />
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
    header: { alignItems: 'center', marginBottom: 20 },
    bracketContainer: { alignItems: 'center', paddingTop: 20 },
    sectionTitle: { marginBottom: 20 },
    matchCard: {
        flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, width: '100%', justifyContent: 'center'
    },
    actionButton: { marginTop: 30, minWidth: 200 },
    gameContainer: { alignItems: 'center', flex: 1 },
    playersRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
    playerTag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    activePlayer: { backgroundColor: 'rgba(198, 255, 74, 0.2)', borderWidth: 2, borderColor: COLORS.limeGlow },
    turnText: { marginBottom: 20 },
    board: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 10 },
    boardRow: { flexDirection: 'row' },
    cell: {
        width: 80, height: 80, margin: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent'
    },
    filledCell: { borderColor: 'rgba(255,255,255,0.2)' },
    resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    subtitle: { marginTop: 15 },
    finishedContainer: { flex: 1, alignItems: 'center', paddingTop: 30 },
    championName: { marginTop: 10, marginBottom: 30 },
    standings: { width: '100%', marginBottom: 30 },
    standingRow: {
        flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10
    },
    championRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    standingName: { flex: 1, marginLeft: 15 },
});

export default TicTacToeScreen;
