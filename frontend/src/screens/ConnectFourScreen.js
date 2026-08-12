import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, StyleSheet, TouchableOpacity,
    Animated, useWindowDimensions, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';

// ─── Board Constants ───────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const PLAYER = 'P';
const AI = 'AI';

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

// ─── Board Utilities ───────────────────────────────────────────────────────────
const getLowestEmpty = (board, col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (!board[row][col]) return row;
    }
    return -1;
};

const dropPiece = (board, col, piece) => {
    const row = getLowestEmpty(board, col);
    if (row === -1) return board;
    const next = board.map(r => [...r]);
    next[row][col] = piece;
    return next;
};

const getValidCols = (board) =>
    Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === EMPTY);

const isBoardFull = (board) => board[0].every(c => c !== EMPTY);

// ─── Win Detection ─────────────────────────────────────────────────────────────
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // H, V, D↘, D↗

const checkWinner = (board) => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (!p) continue;
            for (const [dr, dc] of DIRECTIONS) {
                let count = 1;
                while (
                    count < 4 &&
                    r + dr * count >= 0 && r + dr * count < ROWS &&
                    c + dc * count >= 0 && c + dc * count < COLS &&
                    board[r + dr * count][c + dc * count] === p
                ) count++;
                if (count >= 4) return p;
            }
        }
    }
    return null;
};

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

// ─── Minimax Heuristics ────────────────────────────────────────────────────────
const scoreWindow = (window, piece) => {
    const opp = piece === AI ? PLAYER : AI;
    const pCount = window.filter(c => c === piece).length;
    const eCount = window.filter(c => c === EMPTY).length;
    const oCount = window.filter(c => c === opp).length;
    if (oCount > 0 && pCount > 0) return 0;
    if (pCount === 4) return 100;
    if (pCount === 3 && eCount === 1) return 5;
    if (pCount === 2 && eCount === 2) return 2;
    if (oCount === 3 && eCount === 1) return -4;
    return 0;
};

const scoreBoard = (board) => {
    let score = 0;
    // Center column preference
    const centerCol = board.map(row => row[3]);
    score += centerCol.filter(c => c === AI).length * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], AI);
        }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - 4; r++) {
            score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], AI);
        }
    }
    // Diagonal ↘
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], AI);
        }
    }
    // Diagonal ↗
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], AI);
        }
    }
    return score;
};

// ─── Minimax with Alpha-Beta ───────────────────────────────────────────────────
const minimax = (board, depth, alpha, beta, isMaximizing) => {
    const winner = checkWinner(board);
    if (winner === AI)     return 100000 + depth;
    if (winner === PLAYER) return -100000 - depth;
    if (isBoardFull(board) || depth === 0) return scoreBoard(board);

    const cols = getValidCols(board);
    if (isMaximizing) {
        let value = -Infinity;
        for (const col of cols) {
            value = Math.max(value, minimax(dropPiece(board, col, AI), depth - 1, alpha, beta, false));
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return value;
    } else {
        let value = Infinity;
        for (const col of cols) {
            value = Math.min(value, minimax(dropPiece(board, col, PLAYER), depth - 1, alpha, beta, true));
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return value;
    }
};

// ─── AI Move Selector ─────────────────────────────────────────────────────────
const getAIMove = (board, difficulty) => {
    const validCols = getValidCols(board);
    if (!validCols.length) return null;

    if (difficulty === 'easy') {
        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    if (difficulty === 'medium') {
        // Win immediately if possible
        for (const col of validCols) {
            if (checkWinner(dropPiece(board, col, AI)) === AI) return col;
        }
        // Block player from winning
        for (const col of validCols) {
            if (checkWinner(dropPiece(board, col, PLAYER)) === PLAYER) return col;
        }
        // Prefer center
        if (validCols.includes(3)) return 3;
        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // Hard: Minimax depth 6
    let bestScore = -Infinity;
    let bestCol = validCols[0];
    for (const col of validCols) {
        const score = minimax(dropPiece(board, col, AI), 5, -Infinity, Infinity, false);
        if (score > bestScore) { bestScore = score; bestCol = col; }
    }
    return bestCol;
};

const AI_DELAY = { easy: [400, 800], medium: [700, 1200], hard: [1200, 2000] };

// ─── Component ────────────────────────────────────────────────────────────────
const ConnectFourScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { difficulty = 'medium', players } = route.params;
    const playerName = players?.[0]?.name || 'You';

    const CELL_SIZE = Math.min(Math.floor((SCREEN_WIDTH - 48) / COLS), 56);
    const styles = useMemo(() => getStyles(COLORS, CELL_SIZE), [COLORS, CELL_SIZE]);

    // ── Game State ────────────────────────────────────────────────────────────
    const [board, setBoard]             = useState(emptyBoard);
    const [currentTurn, setCurrentTurn] = useState(PLAYER);
    const [winner, setWinner]           = useState(null); // PLAYER | AI | 'draw' | null
    const [showModal, setShowModal]     = useState(false);
    const [winCells, setWinCells]       = useState({ set: new Set(), line: [] });
    const [isThinking, setIsThinking]   = useState(false);
    const [scores, setScores]           = useState({ player: 0, ai: 0 });
    const [hoverCol, setHoverCol]       = useState(null);

    // Win glow animation
    const winAnim  = useRef(new Animated.Value(0)).current;
    const lineAnim = useRef(new Animated.Value(0)).current;

    const latestBoard = useRef(board);
    useEffect(() => { latestBoard.current = board; }, [board]);


    // ── Win animation ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (winner) {
            if (winner !== 'draw') {
                winAnim.setValue(0);
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(winAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(winAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                    ]),
                    { iterations: 8 }
                ).start();

                lineAnim.setValue(0);
                Animated.timing(lineAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true
                }).start();
            }
            
            // Delay modal popup so user can see the win line and glow
            const t = setTimeout(() => setShowModal(true), 2500);
            return () => clearTimeout(t);
        }
    }, [winner, winAnim, lineAnim]);

    // ── Apply Move ────────────────────────────────────────────────────────────
    const applyMove = useCallback((b, col, piece) => {
        const row = getLowestEmpty(b, col);
        if (row === -1) return;
        const next = b.map(r => [...r]);
        next[row][col] = piece;

        const w = checkWinner(next);
        if (w) {
            setBoard(next);
            setWinner(w);
            setWinCells(getWinningCells(next));
            setScores(prev => ({
                player: w === PLAYER ? prev.player + 1 : prev.player,
                ai:     w === AI     ? prev.ai + 1     : prev.ai,
            }));
            return;
        }
        if (isBoardFull(next)) {
            setBoard(next);
            setWinner('draw');
            return;
        }
        setBoard(next);
        setCurrentTurn(piece === PLAYER ? AI : PLAYER);
    }, []);

    // ── Player Move ───────────────────────────────────────────────────────────
    const handleColumnPress = useCallback((col) => {
        if (currentTurn !== PLAYER || winner || isThinking) return;
        if (getLowestEmpty(board, col) === -1) return; // column full
        applyMove(board, col, PLAYER);
    }, [currentTurn, winner, isThinking, board, applyMove]);

    // ── AI Turn ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (currentTurn !== AI || winner) return;
        setIsThinking(true);

        const [min, max] = AI_DELAY[difficulty] || AI_DELAY.medium;
        const delay = min + Math.random() * (max - min);

        const t = setTimeout(() => {
            setIsThinking(false);
            const b = latestBoard.current;
            const col = getAIMove(b, difficulty);
            if (col !== null) applyMove(b, col, AI);
        }, delay);
        return () => clearTimeout(t);
    }, [currentTurn, winner, difficulty, applyMove]);

    // ── Reset ─────────────────────────────────────────────────────────────────
    const resetGame = useCallback(() => {
        setBoard(emptyBoard());
        setCurrentTurn(PLAYER);
        setWinner(null);
        setShowModal(false);
        setWinCells({ set: new Set(), line: [] });
        setIsThinking(false);
        setHoverCol(null);
    }, []);

    // ─ Render board cell ──────────────────────────────────────────────────────
    const renderCell = (row, col) => {
        const piece = board[row][col];
        const cellKey = `${row},${col}`;
        const isWinCell = winCells.set.has(cellKey);
        const isHovered = col === hoverCol && !piece && currentTurn === PLAYER && !winner && !isThinking;

        const discColor = piece === PLAYER ? COLORS.neonCyan : piece === AI ? COLORS.hotPink : null;
        const glowColor = isWinCell ? (piece === PLAYER ? COLORS.neonCyan : COLORS.hotPink) : null;

        return (
            <TouchableOpacity
                key={cellKey}
                style={[
                    styles.cell,
                    isHovered && styles.cellHovered,
                ]}
                onPress={() => handleColumnPress(col)}
                onPressIn={() => setHoverCol(col)}
                onPressOut={() => setHoverCol(null)}
                activeOpacity={0.9}
            >
                <Animated.View
                    style={[
                        styles.disc,
                        piece && { backgroundColor: discColor },
                        !piece && isHovered && {
                            backgroundColor: COLORS.neonCyan + '33',
                            borderColor: COLORS.neonCyan + '66',
                        },
                        isWinCell && {
                            shadowColor: glowColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 1,
                            shadowRadius: 12,
                            elevation: 10,
                            transform: [{ scale: winAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
                        },
                    ]}
                />
            </TouchableOpacity>
        );
    };

    // ─ Column drop indicators ─────────────────────────────────────────────────
    const renderColumnHeader = (col) => {
        const full = getLowestEmpty(board, col) === -1;
        const active = !winner && !isThinking && currentTurn === PLAYER;
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
            {/* ── Header ── */}
            <View style={styles.header}>
                <NeonText size={22} weight="bold" glow>CONNECT FOUR</NeonText>
                <View style={styles.diffBadge}>
                    <Ionicons name="hardware-chip-outline" size={12} color={COLORS.electricPurple} />
                    <NeonText size={11} color={COLORS.electricPurple}> {difficulty.toUpperCase()}</NeonText>
                </View>
            </View>

            {/* ── Scores ── */}
            <View style={styles.scoreRow}>
                <View style={[styles.scoreSide, currentTurn === PLAYER && !winner && styles.activeSide]}>
                    <View style={[styles.discSmall, { backgroundColor: COLORS.neonCyan }]} />
                    <NeonText size={13} weight="bold" color={COLORS.neonCyan}>{playerName}</NeonText>
                    <NeonText size={28} weight="bold" color={COLORS.neonCyan} glow>{scores.player}</NeonText>
                    {currentTurn === PLAYER && !winner && (
                        <NeonText size={10} color={COLORS.limeGlow}>YOUR TURN</NeonText>
                    )}
                </View>

                <View style={styles.vsContainer}>
                    <NeonText size={20} weight="bold" color="rgba(255,255,255,0.3)">VS</NeonText>
                    {isThinking && (
                        <NeonText size={9} color={COLORS.hotPink} style={{ marginTop: 4 }}>THINKING...</NeonText>
                    )}
                </View>

                <View style={[styles.scoreSide, currentTurn === AI && !winner && styles.activeSideAI]}>
                    <View style={[styles.discSmall, { backgroundColor: COLORS.hotPink }]} />
                    <NeonText size={13} weight="bold" color={COLORS.hotPink}>AI</NeonText>
                    <NeonText size={28} weight="bold" color={COLORS.hotPink} glow>{scores.ai}</NeonText>
                    {currentTurn === AI && !winner && (
                        <NeonText size={10} color={COLORS.hotPink}>AI THINKING...</NeonText>
                    )}
                </View>
            </View>

            {/* ── Board ── */}
            <View style={styles.boardContainer}>
                {/* Column tap indicators */}
                <View style={styles.colHeaders}>
                    {Array.from({ length: COLS }, (_, c) => renderColumnHeader(c))}
                </View>

                {/* Grid */}
                <View style={styles.board}>
                    <View style={{ position: 'relative' }}>
                        {board.map((rowArr, row) => (
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
                                const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                                const cx = (cx1 + cx2) / 2;
                                const cy = (cy1 + cy2) / 2;

                                return (
                                    <Animated.View pointerEvents="none" style={{
                                        position: 'absolute',
                                        left: cx,
                                        top: cy,
                                        width: length + CELL_SIZE * 0.5,
                                        height: 8,
                                        backgroundColor: '#FFF',
                                        borderRadius: 4,
                                        shadowColor: winner === PLAYER ? COLORS.limeGlow : COLORS.hotPink,
                                        shadowOffset: {width: 0, height: 0},
                                        shadowRadius: 15,
                                        shadowOpacity: 1,
                                        elevation: 10,
                                        zIndex: 100,
                                        transform: [
                                            { translateX: -(length + CELL_SIZE * 0.5) / 2 },
                                            { translateY: -4 },
                                            { rotate: `${angle}deg` },
                                            { scaleX: lineAnim }
                                        ]
                                    }} />
                                );
                            }
                            return null;
                        })()}
                    </View>
                </View>
            </View>

            <View style={{ height: 40 }} />

            {/* ── Winner Modal ── */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.winOverlay}>
                    <View style={styles.winCard}>
                        <NeonText size={64} style={{ marginBottom: 12 }}>
                            {winner === 'draw' ? '🤝' : winner === PLAYER ? '🏆' : '🤖'}
                        </NeonText>
                        <NeonText size={32} weight="bold" glow
                            color={winner === PLAYER ? COLORS.limeGlow : winner === 'draw' ? COLORS.neonCyan : COLORS.hotPink}>
                            {winner === 'draw' ? "IT'S A DRAW!" : winner === PLAYER ? 'YOU WIN!' : 'AI WINS!'}
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={{ marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
                            {winner === 'draw' ? "So close! Neither could connect four." :
                             winner === PLAYER ? "Amazing! 4 in a row! 🎉" :
                             "The AI connected four this time!"}
                        </NeonText>
                        <View style={styles.winScores}>
                            <View style={{ alignItems: 'center', gap: 2 }}>
                                <View style={[styles.discSmall, { backgroundColor: COLORS.neonCyan }]} />
                                <NeonText size={28} weight="bold" color={COLORS.neonCyan}>{scores.player}</NeonText>
                            </View>
                            <NeonText size={20} color={COLORS.textMuted} style={{ marginHorizontal: 16 }}>–</NeonText>
                            <View style={{ alignItems: 'center', gap: 2 }}>
                                <View style={[styles.discSmall, { backgroundColor: COLORS.hotPink }]} />
                                <NeonText size={28} weight="bold" color={COLORS.hotPink}>{scores.ai}</NeonText>
                            </View>
                        </View>
                        <NeonButton title="PLAY AGAIN" onPress={resetGame} style={styles.winBtn} />
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
                            <NeonText size={14} color={COLORS.textMuted}>← Back to menu</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </NeonContainer>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (COLORS, CELL_SIZE) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    diffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.electricPurple + '22',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.electricPurple + '44',
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    scoreSide: {
        alignItems: 'center',
        gap: 2,
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
    },
    activeSide: {
        backgroundColor: COLORS.neonCyan + '11',
        borderWidth: 1,
        borderColor: COLORS.neonCyan + '33',
    },
    activeSideAI: {
        backgroundColor: COLORS.hotPink + '11',
        borderWidth: 1,
        borderColor: COLORS.hotPink + '33',
    },
    vsContainer: { alignItems: 'center', paddingHorizontal: 8 },
    discSmall: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginBottom: 2,
    },
    boardContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    colHeaders: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    colHeader: {
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    board: {
        backgroundColor: 'rgba(0,100,255,0.15)',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: 'rgba(0,100,255,0.3)',
        gap: 2,
    },
    row: {
        flexDirection: 'row',
        gap: 2,
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: CELL_SIZE / 2,
        backgroundColor: 'rgba(0,0,30,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cellHovered: {
        backgroundColor: 'rgba(0,255,255,0.08)',
    },
    disc: {
        width: CELL_SIZE - 10,
        height: CELL_SIZE - 10,
        borderRadius: (CELL_SIZE - 10) / 2,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    winOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    winCard: {
        backgroundColor: 'rgba(10,10,30,0.98)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    winScores: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    winBtn: { width: '100%' },
});

export default ConnectFourScreen;
