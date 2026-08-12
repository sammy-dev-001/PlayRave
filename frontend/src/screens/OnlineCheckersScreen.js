import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';

const BOARD_SIZE = 8;
const P1 = 'p1';
const P2 = 'p2';

// ─── Checkers Logic Helpers (Frontend validation) ───────────────────────────
const getValidMovesForPiece = (board, r, c, owner, isKing, requireJump = false) => {
    const moves = [];
    const jumps = [];
    const dirs = [];
    if (isKing || owner === P2) dirs.push([1, -1], [1, 1]); // P2 moves DOWN
    if (isKing || owner === P1) dirs.push([-1, -1], [-1, 1]); // P1 moves UP

    for (const [dr, dc] of dirs) {
        if (!requireJump) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                moves.push({ to: { r: nr, c: nc }, jump: null });
            }
        }
        const jr = r + dr * 2, jc = c + dc * 2;
        const mr = r + dr, mc = c + dc;
        if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE) {
            if (!board[jr][jc] && board[mr][mc] && board[mr][mc].owner !== owner) {
                jumps.push({ to: { r: jr, c: jc }, jump: { r: mr, c: mc } });
            }
        }
    }
    return jumps.length > 0 ? jumps : (requireJump ? [] : moves);
};

const getAllValidMoves = (board, player) => {
    const allJumps = [];
    const allMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = board[r][c];
            if (p && p.owner === player) {
                const jumps = getValidMovesForPiece(board, r, c, p.owner, p.isKing, true);
                if (jumps.length > 0) {
                    jumps.forEach(j => allJumps.push({ from: { r, c }, ...j }));
                } else if (allJumps.length === 0) {
                    const moves = getValidMovesForPiece(board, r, c, p.owner, p.isKing, false);
                    moves.forEach(m => allMoves.push({ from: { r, c }, ...m }));
                }
            }
        }
    }
    return allJumps.length > 0 ? allJumps : allMoves;
};

const OnlineCheckersScreen = ({ route, navigation }) => {
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
    
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    
    const [animatingMove, setAnimatingMove] = useState(null);
    const moveAnim = useRef(new Animated.Value(0)).current;
    
    const winScaleAnim = useRef(new Animated.Value(0)).current;
    const winGlowAnim = useRef(new Animated.Value(0)).current;

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

    // Win Animation Trigger
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

    // Local Move Validation
    useEffect(() => {
        if (!myMatch || myMatch.winner) return;
        if (isMyTurn) {
            const moves = getAllValidMoves(myMatch.board, myRole);
            if (myMatch.currentJumpingPiece) {
                const forced = moves.filter(m => m.from.r === myMatch.currentJumpingPiece.r && m.from.c === myMatch.currentJumpingPiece.c);
                setValidMoves(forced);
                setSelectedSquare(myMatch.currentJumpingPiece);
            } else {
                setValidMoves(moves);
                setSelectedSquare(null);
            }
        } else {
            setSelectedSquare(null);
            setValidMoves([]);
        }
    }, [myMatch?.turn, myMatch?.board, myMatch?.currentJumpingPiece, isMyTurn, myRole]);

    // Pulse animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])).start();
    }, []);

    const executeMove = (move) => {
        const piece = myMatch.board[move.from.r][move.from.c];
        setAnimatingMove({ ...move, piece });
        moveAnim.setValue(0);
        
        Animated.timing(moveAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start(() => {
            setAnimatingMove(null);
            // Send move to server
            SocketService.emit('checkers-move', { matchId: myMatch.matchId, move });
        });
    };

    const handleSquarePress = (r, c) => {
        if (!isMyTurn || myMatch.winner || animatingMove) return;

        const piece = myMatch.board[r][c];
        
        // If clicking a valid move target
        if (selectedSquare) {
            const move = validMoves.find(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c && m.to.r === r && m.to.c === c);
            if (move) {
                executeMove(move);
                setSelectedSquare(null);
                return;
            }
        }

        // Select a piece
        if (piece && piece.owner === myRole) {
            const hasMoves = validMoves.some(m => m.from.r === r && m.from.c === c);
            if (hasMoves && (!myMatch.currentJumpingPiece || (myMatch.currentJumpingPiece.r === r && myMatch.currentJumpingPiece.c === c))) {
                setSelectedSquare({ r, c });
            }
        }
    };

    const { width: SW, height: SH } = Dimensions.get('window');
    const boardSizePx = Math.min(SW - 40, SH * 0.55, 500);
    const squareSize = Math.floor((boardSizePx - 4) / BOARD_SIZE);

    if (!gameState || !myMatch) {
        return (
            <NeonContainer>
                <NeonText type="h2">Loading Match...</NeonText>
            </NeonContainer>
        );
    }

    const boardBorderColor = myMatch.turn === P1 ? COLORS.neonCyan : COLORS.hotPink;

    // View specific checks
    const amITournamentWinner = gameState.tournamentWinner === myUserId;
    const isWaitingForOthers = myMatch.winner && !gameState.tournamentWinner;
    
    let matchResultText = '';
    if (myMatch.winner) {
        if (myMatch.winner === myRole) matchResultText = 'You Won this match!';
        else matchResultText = 'You Lost this match!';
    }

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText type="h3">Tournament: Round {gameState.round}</NeonText>
                <NeonText type="body">You vs {opponentName}</NeonText>
            </View>

            <View style={styles.statusBox}>
                {!myMatch.winner ? (
                    <NeonText type="h3" color={isMyTurn ? COLORS.neonCyan : COLORS.hotPink}>
                        {isMyTurn ? "Your Turn!" : `${opponentName}'s Turn`}
                    </NeonText>
                ) : (
                    <NeonText type="h3" color={myMatch.winner === myRole ? COLORS.neonCyan : COLORS.neonRed}>
                        {matchResultText}
                    </NeonText>
                )}
            </View>

            <View style={[styles.boardContainer, { width: boardSizePx, height: boardSizePx, borderColor: boardBorderColor }]}>
                <View style={styles.board}>
                    {myMatch.board.map((row, r) => (
                        <View key={`r-${r}`} style={styles.row}>
                            {row.map((piece, c) => {
                                const isDark = (r + c) % 2 === 1;
                                const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                                const isHighlightMove = selectedSquare && validMoves.some(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c && m.to.r === r && m.to.c === c);
                                
                                return (
                                    <TouchableOpacity 
                                        key={`c-${c}`}
                                        style={[
                                            styles.square,
                                            { width: squareSize, height: squareSize },
                                            isDark ? styles.darkSquare : styles.lightSquare,
                                            isSelected && styles.selectedSquare
                                        ]}
                                        onPress={() => handleSquarePress(r, c)}
                                        activeOpacity={0.9}
                                    >
                                        {isHighlightMove && (
                                            <Animated.View style={[styles.moveHighlight, { transform: [{ scale: pulseAnim }] }]} />
                                        )}
                                        {piece && (!animatingMove || animatingMove.from.r !== r || animatingMove.from.c !== c) && (
                                            <View style={[
                                                styles.piece,
                                                piece.owner === P1 ? styles.p1Piece : styles.p2Piece,
                                                { shadowColor: piece.owner === P1 ? COLORS.neonCyan : COLORS.hotPink }
                                            ]}>
                                                {piece.isKing && <Ionicons name="star" size={squareSize * 0.4} color="#fff" />}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                    {animatingMove && (
                        <>
                            {/* Ghost Trail 1 */}
                            <Animated.View style={[
                                styles.piece,
                                animatingMove.piece.owner === P1 ? styles.p1Piece : styles.p2Piece,
                                {
                                    position: 'absolute',
                                    width: squareSize * 0.75,
                                    height: squareSize * 0.75,
                                    left: animatingMove.from.c * squareSize + (squareSize * 0.125),
                                    top: animatingMove.from.r * squareSize + (squareSize * 0.125),
                                    zIndex: 98,
                                    borderColor: '#FFF',
                                    borderWidth: 4,
                                    opacity: moveAnim.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, 0.9, 0.2, 0.9, 0.2, 0] }),
                                    transform: [
                                        { scale: 0.85 },
                                        { translateX: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (animatingMove.to.c - animatingMove.from.c) * squareSize * 0.75] }) },
                                        { translateY: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (animatingMove.to.r - animatingMove.from.r) * squareSize * 0.75] }) },
                                        { rotate: moveAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }
                                    ]
                                }
                            ]} pointerEvents="none" />
                            
                            {/* Ghost Trail 2 */}
                            <Animated.View style={[
                                styles.piece,
                                {
                                    backgroundColor: '#FFF',
                                    shadowColor: '#FFF',
                                    shadowOpacity: 1,
                                    shadowRadius: 15,
                                },
                                {
                                    position: 'absolute',
                                    width: squareSize * 0.6,
                                    height: squareSize * 0.6,
                                    left: animatingMove.from.c * squareSize + (squareSize * 0.2),
                                    top: animatingMove.from.r * squareSize + (squareSize * 0.2),
                                    zIndex: 97,
                                    opacity: moveAnim.interpolate({ inputRange: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1], outputRange: [0, 1, 0.1, 1, 0.1, 0.8, 0] }),
                                    transform: [
                                        { scale: moveAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 0.5] }) },
                                        { translateX: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (animatingMove.to.c - animatingMove.from.c) * squareSize * 0.5] }) },
                                        { translateY: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (animatingMove.to.r - animatingMove.from.r) * squareSize * 0.5] }) },
                                        { rotate: moveAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] }) }
                                    ]
                                }
                            ]} pointerEvents="none" />

                            {/* Main Animating Piece */}
                            <Animated.View style={[
                                styles.piece,
                                animatingMove.piece.owner === P1 ? styles.p1Piece : styles.p2Piece,
                                {
                                    position: 'absolute',
                                    width: squareSize * 0.75,
                                    height: squareSize * 0.75,
                                    shadowColor: animatingMove.piece.owner === P1 ? COLORS.neonCyan : COLORS.hotPink,
                                    left: animatingMove.from.c * squareSize + (squareSize * 0.125),
                                    top: animatingMove.from.r * squareSize + (squareSize * 0.125),
                                    zIndex: 100,
                                    transform: [
                                        {
                                            translateX: moveAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, (animatingMove.to.c - animatingMove.from.c) * squareSize]
                                            })
                                        },
                                        {
                                            translateY: moveAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, (animatingMove.to.r - animatingMove.from.r) * squareSize]
                                            })
                                        }
                                    ]
                                }
                            ]}>
                                {animatingMove.piece.isKing && <Ionicons name="star" size={squareSize * 0.4} color="#fff" />}
                            </Animated.View>
                        </>
                    )}
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
        alignSelf: 'center',
        borderWidth: 2,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        shadowColor: '#00FFFF',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    board: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#111',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    square: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    darkSquare: {
        backgroundColor: '#0f0f1a',
    },
    lightSquare: {
        backgroundColor: '#2a2a4a',
    },
    selectedSquare: {
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    moveHighlight: {
        width: '40%',
        height: '40%',
        borderRadius: 100,
        backgroundColor: COLORS.neonCyan,
        opacity: 0.6,
    },
    piece: {
        width: '75%',
        height: '75%',
        borderRadius: 100,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },
    p1Piece: {
        backgroundColor: '#0a0a0a',
        borderColor: COLORS.neonCyan,
    },
    p2Piece: {
        backgroundColor: '#0a0a0a',
        borderColor: COLORS.hotPink,
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

export default OnlineCheckersScreen;
