import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';

const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const P1 = 'p1';
const P2 = 'p2';

const getLowestEmpty = (board, col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (!board[row][col]) return row;
    }
    return -1;
};

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // H, V, D↘, D↗

const getWinningCells = (board) => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (!p) continue;
            for (const [dr, dc] of DIRECTIONS) {
                const cells = [[r, c]];
                while (
                    cells.length < 4 &&
                    r + dr * cells.length >= 0 && r + dr * cells.length < ROWS &&
                    c + dc * cells.length >= 0 && c + dc * cells.length < COLS &&
                    board[r + dr * cells.length][c + dc * cells.length] === p
                ) {
                    cells.push([r + dr * cells.length, c + dc * cells.length]);
                }
                if (cells.length >= 4) {
                    return {
                        set: new Set(cells.map(([rr, cc]) => `${rr},${cc}`)),
                        line: cells
                    };
                }
            }
        }
    }
    return { set: new Set(), line: [] };
};

const OnlineConnectFourScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, playerName, gameState: initialGameState } = route.params;

    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost: room.players?.find(p => p.name === playerName)?.isHost }
    });

    const [gameState, setGameState] = useState(initialGameState);
    const myUserId = useMemo(() => room.players?.find(p => p.name === playerName)?.id, [room, playerName]);
    
    const [hoverCol, setHoverCol] = useState(null);
    const winScaleAnim = useRef(new Animated.Value(0)).current;
    const winGlowAnim = useRef(new Animated.Value(0)).current;
    const winAnim = useRef(new Animated.Value(0)).current;

    // Derived Match State
    const myMatch = useMemo(() => {
        if (!gameState?.matches) return null;
        return gameState.matches.find(m => m.p1 === myUserId || m.p2 === myUserId);
    }, [gameState, myUserId]);

    const isMyTurn = myMatch && (
        (myMatch.turn === P1 && myMatch.p1 === myUserId) ||
        (myMatch.turn === P2 && myMatch.p2 === myUserId)
    );

    const myRole = myMatch?.p1 === myUserId ? P1 : P2;
    const opponentId = myRole === P1 ? myMatch?.p2 : myMatch?.p1;
    let opponentName = 'AI';
    if (opponentId !== 'ai') {
        const oppPlayer = room.players?.find(p => p.id === opponentId);
        if (oppPlayer) opponentName = oppPlayer.name;
    }

    // Server events
    useEffect(() => {
        const handleGameState = (data) => setGameState(data);
        SocketService.on('game-state', handleGameState);
        return () => SocketService.off('game-state', handleGameState);
    }, []);

    // Win Animations
    useEffect(() => {
        if (myMatch && (myMatch.winner || myMatch.isDraw)) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(winAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(winAnim, { toValue: 0, duration: 600, useNativeDriver: true })
                ])
            ).start();
        } else {
            winAnim.stopAnimation();
            winAnim.setValue(0);
        }
    }, [myMatch?.winner, myMatch?.isDraw]);

    useEffect(() => {
        if (gameState?.tournamentWinner) {
            winScaleAnim.setValue(0);
            Animated.spring(winScaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(winGlowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(winGlowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [gameState?.tournamentWinner, winScaleAnim, winGlowAnim]);

    const handleColumnPress = (col) => {
        if (!isMyTurn || myMatch.winner || myMatch.isDraw) return;
        const lowestRow = getLowestEmpty(myMatch.board, col);
        if (lowestRow === -1) return; // Column full
        SocketService.emit('connect-four-move', { matchId: myMatch.matchId, col });
    };

    if (!gameState || !myMatch) {
        return (
            <NeonContainer>
                <NeonText type="h2">Loading Match...</NeonText>
            </NeonContainer>
        );
    }

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const MAX_BOARD_WIDTH = Math.min(screenWidth - 40, screenHeight * 0.55, 500);
    const CELL_SIZE = Math.floor((MAX_BOARD_WIDTH - (COLS + 1) * 2) / COLS);
    
    const winCells = myMatch.winner ? getWinningCells(myMatch.board) : { set: new Set(), line: [] };

    // View specific checks
    const amITournamentWinner = gameState.tournamentWinner === myUserId;
    const isWaitingForOthers = (myMatch.winner || myMatch.isDraw) && !gameState.tournamentWinner;
    
    let matchResultText = '';
    if (myMatch.winner) {
        if (myMatch.winner === myRole) matchResultText = 'You Won this match!';
        else matchResultText = 'You Lost this match!';
    } else if (myMatch.isDraw) {
        matchResultText = 'Match Draw!';
    }

    const renderCell = (row, col) => {
        const piece = myMatch.board[row][col];
        const isWinningCell = winCells.set.has(`${row},${col}`);
        let pieceColor = 'transparent';
        if (piece === P1) pieceColor = COLORS.neonCyan;
        else if (piece === P2) pieceColor = COLORS.hotPink;

        return (
            <TouchableOpacity
                key={`${row}-${col}`}
                style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                onPress={() => handleColumnPress(col)}
                onPressIn={() => setHoverCol(col)}
                onPressOut={() => setHoverCol(null)}
                disabled={!isMyTurn || myMatch.winner || myMatch.isDraw}
                activeOpacity={0.9}
            >
                <View style={styles.hole} />
                <Animated.View
                    style={[
                        styles.disc,
                        {
                            backgroundColor: pieceColor,
                            width: CELL_SIZE * 0.8,
                            height: CELL_SIZE * 0.8,
                            borderRadius: CELL_SIZE * 0.4,
                        },
                        piece && {
                            shadowColor: pieceColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 1,
                            shadowRadius: 12,
                            elevation: 10,
                        },
                        isWinningCell && {
                            transform: [{ scale: winAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
                        },
                    ]}
                />
            </TouchableOpacity>
        );
    };

    const renderColumnHeader = (col) => {
        const full = getLowestEmpty(myMatch.board, col) === -1;
        const active = isMyTurn && !myMatch.winner && !myMatch.isDraw;
        return (
            <TouchableOpacity
                key={col}
                style={[styles.colHeader, { width: CELL_SIZE }]}
                onPress={() => handleColumnPress(col)}
                disabled={full || !active}
            >
                {active && !full && (
                    <Ionicons
                        name="caret-down"
                        size={16}
                        color={col === hoverCol ? COLORS.neonCyan : COLORS.neonCyan + '55'}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <NeonContainer showBackButton scrollable onBackPress={() => navigation.goBack()}>
            <View style={styles.header}>
                <NeonText type="h3">Tournament: Round {gameState.round}</NeonText>
                <NeonText type="body">You vs {opponentName}</NeonText>
            </View>

            <View style={styles.statusBox}>
                {!myMatch.winner && !myMatch.isDraw ? (
                    <NeonText type="h3" color={isMyTurn ? COLORS.neonCyan : COLORS.hotPink}>
                        {isMyTurn ? "Your Turn!" : `${opponentName}'s Turn`}
                    </NeonText>
                ) : (
                    <NeonText type="h3" color={myMatch.winner === myRole ? COLORS.neonCyan : COLORS.neonRed}>
                        {matchResultText}
                    </NeonText>
                )}
            </View>

            <View style={styles.boardContainer}>
                <View style={styles.colHeaders}>
                    {Array.from({ length: COLS }, (_, c) => renderColumnHeader(c))}
                </View>

                <View style={[styles.board, { width: MAX_BOARD_WIDTH }]}>
                    <View style={{ position: 'relative' }}>
                        {myMatch.board.map((rowArr, row) => (
                            <View key={row} style={styles.row}>
                                {rowArr.map((_, col) => renderCell(row, col))}
                            </View>
                        ))}
                        {(() => {
                            if (winCells.line.length === 4) {
                                const [r1, c1] = winCells.line[0];
                                const [r2, c2] = winCells.line[3];
                                
                                const gap = 2; // match styles.row gap and styles.board gap
                                const cx1 = c1 * CELL_SIZE + c1 * gap + CELL_SIZE / 2;
                                const cy1 = r1 * CELL_SIZE + r1 * gap + CELL_SIZE / 2;
                                const cx2 = c2 * CELL_SIZE + c2 * gap + CELL_SIZE / 2;
                                const cy2 = r2 * CELL_SIZE + r2 * gap + CELL_SIZE / 2;

                                const dx = cx2 - cx1;
                                const dy = cy2 - cy1;
                                const length = Math.sqrt(dx * dx + dy * dy);
                                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                                return (
                                    <Animated.View
                                        style={[
                                            styles.winLine,
                                            {
                                                width: length,
                                                left: cx1,
                                                top: cy1,
                                                transform: [
                                                    { translateY: -2 },
                                                    { rotate: `${angle}deg` },
                                                    { translateX: 0 },
                                                ],
                                                opacity: winAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.6, 1],
                                                }),
                                            },
                                        ]}
                                        pointerEvents="none"
                                    />
                                );
                            }
                            return null;
                        })()}
                    </View>
                </View>
            </View>

            {/* Waiting for others Overlay */}
            <Modal visible={isWaitingForOthers} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <NeonText type="h2">{matchResultText}</NeonText>
                        <NeonText type="body" style={{ marginTop: 20 }}>
                            Waiting for other tournament matches to finish...
                        </NeonText>
                    </View>
                </View>
            </Modal>

            {/* Tournament Champion Overlay */}
            <Modal visible={!!gameState.tournamentWinner} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.winnerCard, { transform: [{ scale: winScaleAnim }] }]}>
                        <Animated.View style={[styles.winnerGlow, { opacity: winGlowAnim }]} />
                        <NeonText type="h1" color={COLORS.neonCyan}>TOURNAMENT COMPLETE!</NeonText>
                        
                        <View style={styles.winnerInfo}>
                            <Ionicons name="trophy" size={60} color="#FFD700" />
                            <NeonText type="h2" style={{ marginTop: 15 }}>
                                {amITournamentWinner ? "YOU ARE THE CHAMPION!" : `${room.players?.find(p => p.id === gameState.tournamentWinner)?.name || 'Someone'} won the tournament!`}
                            </NeonText>
                        </View>
                        
                        <NeonButton
                            title="Return to Lobby"
                            onPress={() => navigation.navigate('Lobby', { room })}
                            variant="primary"
                        />
                    </Animated.View>
                </View>
            </Modal>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginVertical: 15,
    },
    statusBox: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        marginBottom: 20,
    },
    boardContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    colHeaders: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
        gap: 2,
    },
    colHeader: {
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    board: {
        backgroundColor: '#1E40AF',
        padding: 5,
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 2,
        marginBottom: 2,
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    hole: {
        position: 'absolute',
        width: '85%',
        height: '85%',
        borderRadius: 100,
        backgroundColor: '#0F172A',
        borderWidth: 2,
        borderColor: '#1E3A8A',
    },
    disc: {
        position: 'absolute',
    },
    winLine: {
        position: 'absolute',
        height: 4,
        backgroundColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
        transformOrigin: '0% 50%',
        borderRadius: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#1a1a2e',
        padding: 30,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
    },
    winnerCard: {
        backgroundColor: '#1a1a2e',
        padding: 40,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
    },
    winnerGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 25,
        borderWidth: 15,
        borderColor: COLORS.neonCyan,
        opacity: 0.3,
    },
    winnerInfo: {
        marginVertical: 30,
        alignItems: 'center',
    },
});

export default OnlineConnectFourScreen;
