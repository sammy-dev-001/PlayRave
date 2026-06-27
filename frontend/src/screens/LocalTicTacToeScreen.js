import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import { useTheme } from '../context/ThemeContext';

// ─── Win conditions ────────────────────────────────────────────────────────────
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
];

const checkWinner = (board) => {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: [a, b, c] };
        }
    }
    if (board.every(cell => cell !== null)) return { winner: 'draw', line: [] };
    return null;
};

// ─── AI Logic ─────────────────────────────────────────────────────────────────
const getEmptyCells = (board) => board.map((v, i) => v === null ? i : null).filter(i => i !== null);

// Minimax — symbol-agnostic (aiSym maximises, playerSym minimises)
const minimax = (board, isMaximizing, aiSym, playerSym, depth = 0) => {
    const result = checkWinner(board);
    if (result) {
        if (result.winner === aiSym) return 10 - depth;
        if (result.winner === playerSym) return depth - 10;
        return 0;
    }
    const cells = getEmptyCells(board);
    if (isMaximizing) {
        let best = -Infinity;
        for (const i of cells) {
            board[i] = aiSym;
            best = Math.max(best, minimax(board, false, aiSym, playerSym, depth + 1));
            board[i] = null;
        }
        return best;
    } else {
        let best = Infinity;
        for (const i of cells) {
            board[i] = playerSym;
            best = Math.min(best, minimax(board, true, aiSym, playerSym, depth + 1));
            board[i] = null;
        }
        return best;
    }
};

const getAIMove = (board, difficulty, aiSym, playerSym) => {
    const empty = getEmptyCells(board);
    if (empty.length === 0) return null;

    if (difficulty === 'easy') {
        return empty[Math.floor(Math.random() * empty.length)];
    }

    if (difficulty === 'medium') {
        // Take winning move
        for (const i of empty) {
            board[i] = aiSym;
            if (checkWinner(board)?.winner === aiSym) { board[i] = null; return i; }
            board[i] = null;
        }
        // Block player winning move
        for (const i of empty) {
            board[i] = playerSym;
            if (checkWinner(board)?.winner === playerSym) { board[i] = null; return i; }
            board[i] = null;
        }
        if (board[4] === null) return 4;
        return empty[Math.floor(Math.random() * empty.length)];
    }

    // Hard - minimax
    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const i of empty) {
        board[i] = aiSym;
        const score = minimax(board, false, aiSym, playerSym);
        board[i] = null;
        if (score > bestScore) { bestScore = score; bestMove = i; }
    }
    return bestMove;
};

// ─── Component ────────────────────────────────────────────────────────────────
const LocalTicTacToeScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { players, difficulty = 'medium' } = route.params;
    const playerName = players[0]?.name || 'You';

    // aiStartsNext: if true the AI goes first next round (plays as X)
    const [aiStartsNext, setAiStartsNext] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(null));
    // isPlayerTurn: true = player's turn, false = AI's turn
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameResult, setGameResult] = useState(null);
    const [aiThinking, setAiThinking] = useState(false);
    const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
    const [winLine, setWinLine] = useState([]);
    const [showResult, setShowResult] = useState(false);

    // Symbols depend on who starts: starter is always X
    // aiStartsNext=false → player=X, ai=O
    // aiStartsNext=true  → ai=X, player=O
    const playerSym = aiStartsNext ? 'O' : 'X';
    const aiSym     = aiStartsNext ? 'X' : 'O';

    const thinkingAnim = useRef(new Animated.Value(0)).current;
    const cellAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;
    const resultAnim = useRef(new Animated.Value(0)).current;

    // AI thinking pulse
    useEffect(() => {
        if (aiThinking) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(thinkingAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(thinkingAnim, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
    }, [aiThinking, thinkingAnim]);

    const animateCell = useCallback((index) => {
        cellAnims[index].setValue(0);
        Animated.spring(cellAnims[index], {
            toValue: 1,
            friction: 3,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, [cellAnims]);

    const animateResult = useCallback(() => {
        resultAnim.setValue(0);
        Animated.spring(resultAnim, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }).start();
    }, [resultAnim]);

    const processMove = useCallback((newBoard, index) => {
        animateCell(index);
        if (Platform.OS !== 'web') Vibration.vibrate(10);

        const result = checkWinner(newBoard);
        if (result) {
            setWinLine(result.line);
            setGameResult(result);
            setScores(prev => ({
                player: result.winner === playerSym ? prev.player + 1 : prev.player,
                ai:     result.winner === aiSym     ? prev.ai + 1     : prev.ai,
                draws:  result.winner === 'draw'    ? prev.draws + 1  : prev.draws,
            }));
            setTimeout(() => { setShowResult(true); animateResult(); }, 600);
            return;
        }
        setBoard(newBoard);
    }, [animateCell, animateResult, playerSym, aiSym]);

    // AI turn
    useEffect(() => {
        if (!isPlayerTurn && !gameResult) {
            setAiThinking(true);
            const delay = difficulty === 'hard' ? 700 : 400;
            const timer = setTimeout(() => {
                setAiThinking(false);
                const boardCopy = [...board];
                const move = getAIMove(boardCopy, difficulty, aiSym, playerSym);
                if (move !== null) {
                    boardCopy[move] = aiSym;
                    setIsPlayerTurn(true);
                    processMove(boardCopy, move);
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, board, gameResult, difficulty, processMove, aiSym, playerSym]);

    const handleCellPress = (index) => {
        if (!isPlayerTurn || board[index] !== null || gameResult || aiThinking) return;
        const newBoard = [...board];
        newBoard[index] = playerSym;
        setIsPlayerTurn(false);
        processMove(newBoard, index);
    };

    const handlePlayAgain = () => {
        // Flip who starts next round
        const nextAiStarts = !aiStartsNext;
        setAiStartsNext(nextAiStarts);
        setBoard(Array(9).fill(null));
        // If AI starts next, it goes first (isPlayerTurn = false)
        setIsPlayerTurn(!nextAiStarts);
        setGameResult(null);
        setWinLine([]);
        setShowResult(false);
        cellAnims.forEach(a => a.setValue(0));
    };

    const handleQuit = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    const difficultyLabel = { easy: '😊 Easy', medium: '💪 Medium', hard: '💀 Hard' }[difficulty];
    const difficultyColor = { easy: COLORS.limeGlow, medium: COLORS.neonCyan, hard: COLORS.hotPink }[difficulty];

    const renderCell = (index) => {
        const value = board[index];
        const isWinCell = winLine.includes(index);
        const scale = cellAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.cell,
                    isWinCell && styles.winCell,
                    value && styles.filledCell,
                ]}
                onPress={() => handleCellPress(index)}
                disabled={!!value || !isPlayerTurn || !!gameResult}
                activeOpacity={0.7}
            >
                {value && (
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Ionicons
                            name={value === 'X' ? 'close' : 'ellipse-outline'}
                            size={56}
                            color={value === 'X' ? COLORS.neonCyan : COLORS.hotPink}
                            style={{
                                textShadowColor: value === 'X' ? COLORS.neonCyan : COLORS.hotPink,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 15,
                            }}
                        />
                    </Animated.View>
                )}
            </TouchableOpacity>
        );
    };

    // ── Result overlay ──
    if (showResult && gameResult) {
        const isWin = gameResult.winner === playerSym;
        const isDraw = gameResult.winner === 'draw';

        return (
            <NeonContainer>
                <RaveLights trigger={isWin} intensity={isWin ? 'high' : 'low'} />
                <Animated.View style={[styles.resultOverlay, { transform: [{ scale: resultAnim }] }]}>
                    <Ionicons
                        name={isWin ? 'trophy' : isDraw ? 'remove-circle' : 'sad'}
                        size={80}
                        color={isWin ? COLORS.limeGlow : isDraw ? COLORS.textMuted : COLORS.hotPink}
                        style={{ marginBottom: 10 }}
                    />
                    <NeonText size={36} weight="bold" glow color={isWin ? COLORS.limeGlow : isDraw ? COLORS.textMuted : COLORS.hotPink}>
                        {isWin ? 'YOU WIN!' : isDraw ? "IT'S A DRAW" : 'AI WINS!'}
                    </NeonText>
                    <NeonText size={16} color={COLORS.textMuted} style={{ marginTop: 8 }}>
                        {isWin ? `Great job, ${playerName}!` : isDraw ? 'Nobody wins this round.' : 'Better luck next time!'}
                    </NeonText>

                    <View style={styles.scoreBoard}>
                        <View style={styles.scoreItem}>
                            <NeonText size={28} weight="bold" color={COLORS.neonCyan}>{scores.player}</NeonText>
                            <NeonText size={12} color={COLORS.textMuted}>{playerName}</NeonText>
                        </View>
                        <View style={styles.scoreItem}>
                            <NeonText size={28} weight="bold" color="#555">{scores.draws}</NeonText>
                            <NeonText size={12} color={COLORS.textMuted}>Draws</NeonText>
                        </View>
                        <View style={styles.scoreItem}>
                            <NeonText size={28} weight="bold" color={COLORS.hotPink}>{scores.ai}</NeonText>
                            <NeonText size={12} color={COLORS.textMuted}>AI</NeonText>
                        </View>
                    </View>

                    <View style={styles.resultButtons}>
                        <NeonButton title="PLAY AGAIN" onPress={handlePlayAgain} style={styles.resultBtn} />
                        <NeonButton title="QUIT" onPress={handleQuit} variant="secondary" style={styles.resultBtn} />
                    </View>
                </Animated.View>
            </NeonContainer>
        );
    }

    // ── Main board ──
    return (
        <NeonContainer showBackButton onBackPress={handleQuit}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.electricPurple}>
                        TIC-TAC-TOE
                    </NeonText>
                    <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
                        <NeonText size={12} color={difficultyColor}>{difficultyLabel}</NeonText>
                    </View>
                </View>

                {/* Players row */}
                <View style={styles.playersRow}>
                    <View style={[styles.playerTag, isPlayerTurn && !aiThinking && styles.activeTag]}>
                        <NeonText size={14} weight="bold" color={COLORS.neonCyan}>
                            {playerName} ({playerSym})
                        </NeonText>
                    </View>
                    <NeonText size={18} color="#444">vs</NeonText>
                    <View style={[styles.playerTag, (!isPlayerTurn || aiThinking) && styles.activeTag]}>
                        <Ionicons name="hardware-chip-outline" size={14} color={COLORS.hotPink} />
                        <NeonText size={14} weight="bold" color={COLORS.hotPink}> AI ({aiSym})</NeonText>
                    </View>
                </View>

                {/* Scores */}
                <View style={styles.scoreRow}>
                    <NeonText size={22} weight="bold" color={COLORS.neonCyan}>{scores.player}</NeonText>
                    <NeonText size={14} color="#555">—  {scores.draws}  —</NeonText>
                    <NeonText size={22} weight="bold" color={COLORS.hotPink}>{scores.ai}</NeonText>
                </View>

                {/* Status */}
                <View style={styles.statusRow}>
                    {aiThinking ? (
                        <Animated.View style={{ opacity: thinkingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }}>
                            <NeonText size={15} color={COLORS.electricPurple} glow>AI is thinking...</NeonText>
                        </Animated.View>
                    ) : (
                        <NeonText size={15} color={isPlayerTurn ? COLORS.limeGlow : '#555'}>
                            {isPlayerTurn ? "Your turn!" : "AI's turn..."}
                        </NeonText>
                    )}
                </View>

                {/* Board */}
                <View style={styles.board}>
                    {[0, 1, 2].map(row => (
                        <View key={row} style={styles.boardRow}>
                            {[0, 1, 2].map(col => renderCell(row * 3 + col))}
                        </View>
                    ))}
                </View>
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    difficultyBadge: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    playersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    playerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    activeTag: {
        backgroundColor: 'rgba(198,255,74,0.12)',
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 10,
    },
    statusRow: {
        height: 28,
        justifyContent: 'center',
        marginBottom: 20,
    },
    board: {
        backgroundColor: COLORS.overlayDark,
        borderRadius: 18,
        padding: 12,
        borderWidth: 2,
        borderColor: 'rgba(167,139,250,0.3)',
    },
    boardRow: {
        flexDirection: 'row',
    },
    cell: {
        width: 88,
        height: 88,
        margin: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    filledCell: {
        borderColor: 'rgba(255,255,255,0.15)',
    },
    winCell: {
        backgroundColor: 'rgba(198,255,74,0.15)',
        borderColor: COLORS.limeGlow,
        borderWidth: 2,
    },
    resultOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    scoreBoard: {
        flexDirection: 'row',
        gap: 30,
        marginTop: 30,
        paddingVertical: 20,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
    },
    scoreItem: {
        alignItems: 'center',
        gap: 4,
    },
    resultButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 30,
    },
    resultBtn: {
        minWidth: 140,
    },
});

export default LocalTicTacToeScreen;
