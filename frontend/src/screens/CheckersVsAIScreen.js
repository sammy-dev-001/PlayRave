import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';

const BOARD_SIZE = 8;
const P1 = 'player';
const AI = 'ai';

// Helper to create initial board
const createInitialBoard = () => {
    const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) {
                if (r < 3) b[r][c] = { owner: AI, isKing: false };
                else if (r > 4) b[r][c] = { owner: P1, isKing: false };
            }
        }
    }
    return b;
};

// ─── Checkers Logic Engine ──────────────────────────────────────────────────
const getValidMovesForPiece = (board, r, c, owner, isKing, requireJump = false) => {
    const moves = [];
    const jumps = [];
    const dirs = [];
    if (isKing || owner === AI) dirs.push([1, -1], [1, 1]); // AI moves DOWN
    if (isKing || owner === P1) dirs.push([-1, -1], [-1, 1]); // P1 moves UP

    for (const [dr, dc] of dirs) {
        // Normal move
        if (!requireJump) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                moves.push({ to: { r: nr, c: nc }, jump: null });
            }
        }
        // Jump move
        const jr = r + dr * 2, jc = c + dc * 2;
        const mr = r + dr, mc = c + dc; // middle piece
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
    // Forced jump rule
    return allJumps.length > 0 ? allJumps : allMoves;
};

const applyMove = (board, move) => {
    const newBoard = board.map(row => [...row]);
    const piece = { ...newBoard[move.from.r][move.from.c] }; // Clone to avoid mutating original state during AI simulation
    newBoard[move.from.r][move.from.c] = null;
    
    let madeKing = false;
    // King promotion
    if (!piece.isKing) {
        if ((piece.owner === P1 && move.to.r === 0) || (piece.owner === AI && move.to.r === BOARD_SIZE - 1)) {
            piece.isKing = true;
            madeKing = true;
        }
    }
    newBoard[move.to.r][move.to.c] = piece;

    if (move.jump) {
        newBoard[move.jump.r][move.jump.c] = null;
    }
    return { newBoard, madeKing };
};

// ─── Minimax AI ─────────────────────────────────────────────────────────────
const evaluateBoard = (board) => {
    let score = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = board[r][c];
            if (p) {
                const val = p.isKing ? 3 : 1;
                // Add minor positional advantage for advancing
                const posBonus = p.isKing ? 0 : (p.owner === AI ? r * 0.1 : (7 - r) * 0.1);
                score += p.owner === AI ? (val + posBonus) : -(val + posBonus);
            }
        }
    }
    return score;
};

const minimax = (board, depth, alpha, beta, isMaximizing, player) => {
    const moves = getAllValidMoves(board, player);
    if (depth === 0 || moves.length === 0) {
        return { score: evaluateBoard(board) };
    }

    let bestMove = null;
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const { newBoard, madeKing } = applyMove(board, move);
            // Handle multi-jumps (simplified: AI just searches the board state after one jump, we treat it as end of turn for search depth purposes)
            // A more complex AI would chain jumps, but for a fast mobile AI, evaluating the resulting state is often enough.
            const evalResult = minimax(newBoard, depth - 1, alpha, beta, false, P1);
            if (evalResult.score > maxEval) {
                maxEval = evalResult.score;
                bestMove = move;
            }
            alpha = Math.max(alpha, evalResult.score);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const { newBoard } = applyMove(board, move);
            const evalResult = minimax(newBoard, depth - 1, alpha, beta, true, AI);
            if (evalResult.score < minEval) {
                minEval = evalResult.score;
                bestMove = move;
            }
            beta = Math.min(beta, evalResult.score);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
};

const CheckersVsAIScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { players, searchDepth = 3 } = route?.params || {};
    const playerName = players?.[0]?.name || 'You';

    const [board, setBoard] = useState(createInitialBoard());
    const [turn, setTurn] = useState(P1);
    const [selectedSquare, setSelectedSquare] = useState(null); // {r, c}
    const [validMoves, setValidMoves] = useState([]); // from getAllValidMoves
    const [currentJumpingPiece, setCurrentJumpingPiece] = useState(null); // {r, c} if in middle of multi-jump
    const [winner, setWinner] = useState(null);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [animatingMove, setAnimatingMove] = useState(null);
    const moveAnim = useRef(new Animated.Value(0)).current;
    const winScaleAnim = useRef(new Animated.Value(0)).current;
    const winGlowAnim = useRef(new Animated.Value(0)).current;

    const resetGame = useCallback(() => {
        setBoard(createInitialBoard());
        setTurn(P1);
        setWinner(null);
        setShowWinnerModal(false);
        setSelectedSquare(null);
        setValidMoves([]);
        setCurrentJumpingPiece(null);
        winScaleAnim.setValue(0);
        winGlowAnim.setValue(0);
    }, [winScaleAnim, winGlowAnim]);

    // Pulse animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])).start();
    }, []);

    // Winner animation + delayed modal
    useEffect(() => {
        if (!winner) return;
        const t = setTimeout(() => {
            setShowWinnerModal(true);
            winScaleAnim.setValue(0);
            Animated.spring(winScaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(winGlowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(winGlowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        }, 400);
        return () => clearTimeout(t);
    }, [winner, winScaleAnim, winGlowAnim]);

    // Calculate moves whenever turn changes
    useEffect(() => {
        if (winner) return;

        const moves = getAllValidMoves(board, turn);
        if (moves.length === 0) {
            setWinner(turn === P1 ? AI : P1);
            return;
        }

        if (turn === P1) {
            setValidMoves(moves);
            // If locked in a multi-jump, filter moves to only allow the jumping piece
            if (currentJumpingPiece) {
                const forced = moves.filter(m => m.from.r === currentJumpingPiece.r && m.from.c === currentJumpingPiece.c);
                if (forced.length === 0) {
                    setCurrentJumpingPiece(null);
                    setTurn(AI);
                } else {
                    setValidMoves(forced);
                    setSelectedSquare(currentJumpingPiece);
                }
            } else {
                setSelectedSquare(null);
            }
        } else if (turn === AI) {
            setSelectedSquare(null);
            setValidMoves([]);
            setTimeout(() => {
                // Determine AI move
                let move;
                if (currentJumpingPiece) {
                    const forced = moves.filter(m => m.from.r === currentJumpingPiece.r && m.from.c === currentJumpingPiece.c);
                    if (forced.length > 0) {
                        // AI continues jump (pick randomly if multiple, or evaluate)
                        move = forced[0]; 
                    } else {
                        setCurrentJumpingPiece(null);
                        setTurn(P1);
                        return;
                    }
                } else {
                    const result = minimax(board, searchDepth, -Infinity, Infinity, true, AI);
                    move = result.move;
                }

                if (move) {
                    executeMove(move);
                } else {
                    setWinner(P1);
                }
            }, 800);
        }
    }, [turn, board, winner, currentJumpingPiece, searchDepth]);

    const executeMove = (move) => {
        const piece = board[move.from.r][move.from.c];
        setAnimatingMove({ ...move, piece });
        moveAnim.setValue(0);
        
        Animated.timing(moveAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start(() => {
            setAnimatingMove(null);
            
            const { newBoard, madeKing } = applyMove(board, move);
            setBoard(newBoard);

            // Check for multi-jumps
            if (move.jump && !madeKing) {
                const furtherJumps = getValidMovesForPiece(newBoard, move.to.r, move.to.c, turn, newBoard[move.to.r][move.to.c].isKing, true);
                if (furtherJumps.length > 0) {
                    setCurrentJumpingPiece(move.to);
                    return;
                }
            }

            setCurrentJumpingPiece(null);
            setTurn(turn === P1 ? AI : P1);
        });
    };

    const handleSquarePress = (r, c) => {
        if (turn !== P1 || winner) return;

        // If in multi-jump, can't select another piece
        if (currentJumpingPiece && (r !== currentJumpingPiece.r || c !== currentJumpingPiece.c)) {
            // Check if tapped a valid destination
            const move = validMoves.find(m => m.from.r === currentJumpingPiece.r && m.from.c === currentJumpingPiece.c && m.to.r === r && m.to.c === c);
            if (move) executeMove(move);
            return;
        }

        // Tap a valid destination square
        if (selectedSquare) {
            const move = validMoves.find(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c && m.to.r === r && m.to.c === c);
            if (move) {
                executeMove(move);
                return;
            }
        }

        // Tap own piece to select
        const piece = board[r][c];
        if (piece && piece.owner === P1) {
            // Only allow selection if the piece has valid moves
            const hasMoves = validMoves.some(m => m.from.r === r && m.from.c === c);
            if (hasMoves) {
                setSelectedSquare({ r, c });
            }
        }
    };

    const { width: SW, height: SH } = Dimensions.get('window');
    const boardSizePx = Math.min(SW - 40, SH * 0.55, 500);
    const squareSize = Math.floor((boardSizePx - 4) / BOARD_SIZE);

    let p1Count = 0;
    let aiCount = 0;
    board.forEach(row => row.forEach(p => {
        if (p?.owner === P1) p1Count++;
        else if (p?.owner === AI) aiCount++;
    }));

    const boardBorderColor = turn === P1 ? COLORS.neonCyan : COLORS.hotPink;

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={24} weight="bold" glow>NEON CHECKERS</NeonText>
                
                <View style={styles.scoreboardRow}>
                    <View style={[styles.scoreBadge, { borderColor: COLORS.neonCyan, shadowColor: COLORS.neonCyan }]}>
                        <NeonText size={20} color={COLORS.neonCyan} weight="bold">{p1Count}</NeonText>
                        <NeonText size={10} color={COLORS.neonCyan}>PLAYER</NeonText>
                    </View>
                    <View style={[styles.scoreBadge, { borderColor: COLORS.hotPink, shadowColor: COLORS.hotPink }]}>
                        <NeonText size={20} color={COLORS.hotPink} weight="bold">{aiCount}</NeonText>
                        <NeonText size={10} color={COLORS.hotPink}>AI</NeonText>
                    </View>
                </View>

                {winner ? (
                    <View style={styles.turnIndicator}>
                        <NeonText size={14} color={winner === P1 ? COLORS.limeGlow : COLORS.hotPink}>
                            {winner === P1 ? '🏆 You won!' : '💀 AI won!'}
                        </NeonText>
                    </View>
                ) : (
                    <View style={styles.turnIndicator}>
                        <NeonText size={16} color={turn === P1 ? COLORS.neonCyan : COLORS.hotPink}>
                            {turn === P1 ? `${playerName}'s Turn` : 'AI is Thinking...'}
                        </NeonText>
                    </View>
                )}
            </View>

            <View style={styles.boardContainer}>
                <View style={[styles.board, { 
                    width: boardSizePx, 
                    height: boardSizePx,
                    borderColor: boardBorderColor,
                    shadowColor: boardBorderColor,
                    shadowOpacity: 0.8,
                    shadowRadius: 15,
                    elevation: 10
                }]}>
                    {board.map((row, r) => (
                        <View key={`row-${r}`} style={styles.row}>
                            {row.map((piece, c) => {
                                const isDark = (r + c) % 2 === 1;
                                const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                                const isHighlightMove = selectedSquare && validMoves.some(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c && m.to.r === r && m.to.c === c);
                                
                                return (
                                    <TouchableOpacity
                                        key={`sq-${r}-${c}`}
                                        style={[
                                            styles.square,
                                            { width: squareSize, height: squareSize },
                                            isDark ? styles.darkSquare : styles.lightSquare,
                                            isSelected && styles.selectedSquare,
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
                                                piece.owner === P1 ? styles.p1Piece : styles.aiPiece,
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
                            {/* Ghost Trail 1 (Lags behind by 20%) */}
                            <Animated.View style={[
                                styles.piece,
                                animatingMove.piece.owner === P1 ? styles.p1Piece : styles.aiPiece,
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
                            
                            {/* Ghost Trail 2 (Lags behind by 40%) */}
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
                                animatingMove.piece.owner === P1 ? styles.p1Piece : styles.aiPiece,
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
                                <Animated.View style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        backgroundColor: animatingMove.piece.owner === P1 ? COLORS.neonCyan : COLORS.hotPink,
                                        borderRadius: 50,
                                        transform: [{ scale: 2.2 }],
                                        opacity: moveAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0, 0.6, 0]
                                        })
                                    }
                                ]} pointerEvents="none" />
                            </Animated.View>
                        </>
                    )}
                </View>
            </View>

        {/* ── Winner Modal ── */}
        <Modal visible={showWinnerModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.modalCard, {
                    borderColor: winner === P1 ? COLORS.limeGlow : COLORS.hotPink,
                    transform: [{ scale: winScaleAnim }],
                    shadowColor: winner === P1 ? COLORS.limeGlow : COLORS.hotPink,
                    shadowOpacity: winGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                    shadowRadius: 30,
                    elevation: 30,
                }]}>
                    <NeonText size={72} style={{ marginBottom: 8 }}>
                        {winner === P1 ? '🏆' : '💀'}
                    </NeonText>
                    <NeonText size={32} weight="bold" glow color={winner === P1 ? COLORS.limeGlow : COLORS.hotPink}>
                        {winner === P1 ? 'YOU WIN!' : 'AI WINS!'}
                    </NeonText>
                    <NeonText size={14} color="#aaa" style={{ marginTop: 8, marginBottom: 28, textAlign: 'center' }}>
                        {winner === P1 ? 'All opponent pieces captured!' : 'Your pieces were captured!'}
                    </NeonText>
                    <View style={{ gap: 12, width: '100%' }}>
                        <NeonButton title="PLAY AGAIN" onPress={resetGame} variant="primary" />
                        <NeonButton title="MENU" onPress={() => navigation.navigate('LocalGameSelection', { players: route?.params?.players || [], isSinglePlayer: true })} variant="secondary" />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    turnIndicator: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    boardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400, // Safe fallback
    },
    board: {
        borderWidth: 4,
        borderColor: COLORS.neonCyan,
        backgroundColor: '#111',
        shadowColor: COLORS.neonCyan,
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        flex: 1,
    },
    square: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    darkSquare: {
        backgroundColor: '#0a0a1a', 
    },
    lightSquare: {
        backgroundColor: '#1e1e38', 
    },
    selectedSquare: {
        backgroundColor: 'rgba(0, 255, 255, 0.4)',
    },
    moveHighlight: {
        position: 'absolute',
        width: '50%',
        height: '50%',
        borderRadius: 50,
        backgroundColor: COLORS.limeGlow,
        opacity: 0.9,
    },
    piece: {
        width: '80%',
        height: '80%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: '#fff',
    },
    p1Piece: {
        backgroundColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 20,
    },
    aiPiece: {
        backgroundColor: COLORS.hotPink,
        shadowColor: COLORS.hotPink,
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 20,
    },
    scoreboardRow: {
        flexDirection: 'row',
        gap: 30,
        marginTop: 15,
        marginBottom: 5,
    },
    scoreBadge: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#0e0e1e',
        borderRadius: 24,
        borderWidth: 2,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowOffset: { width: 0, height: 0 },
    },
});

export default CheckersVsAIScreen;
