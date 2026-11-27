import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    SafeAreaView,
    Text,
    Platform,
    useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { getAvatarEmoji } from '../utils/avatarUtils';
import {
    LUDO_RAVE_THEME,
    LUDO_STACK_OFFSETS,
    LUDO_MID_SAFE_STAR_COLORS,
    LudoHomeBase,
    LudoCenterGoal,
    LudoTrackTile,
    NeonStarToken
} from '../components/LudoBoardUI';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── Geometry & Constants ─────────────────────────────────────────────────────
const GRID = 15;

const PLAYER_COLORS = ['#FF007F', '#00FFFF', '#FFD700', '#39FF14']; // P0(Pink), P1(Cyan), P2(Yellow), P3(Green)

// 52-cell outer track coordinates [row, col] (clockwise)
// Start cells: P0=0 ([14,6]), P1=13 ([6,0]), P2=26 ([0,8]), P3=39 ([8,14])
const MAIN_TRACK = [
    // 0-5: col 6, rows 14 down to 9 (P0 entry)
    [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    // 6-12: row 8 going left
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
    // 13-18: row 6 going right (P1 entry)
    [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    // 19-24: col 6, rows 5 down to 0
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    // 25-26: top turn
    [0, 7], [0, 8],
    // 27-31: col 8, rows 1 to 5 (P2 entry at 26 is [0,8])
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    // 32-38: row 6 going right
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14],
    // 39-44: row 8 going left (P3 entry)
    [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    // 45-51: col 8, rows 9 to 14 + turn
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7]
];

const PLAYER_START = [0, 13, 26, 39];
const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home columns (5 cells each pointing toward center [7,7])
const HOME_COLS = [
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // P0 Pink (Bottom-Left yard, column 7 moving up)
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],     // P1 Cyan (Top-Left yard, row 7 moving right)
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],     // P2 Yellow (Top-Right yard, column 7 moving down)
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // P3 Green (Bottom-Right yard, row 7 moving left)
];

const CENTER = [7, 7];

// 4 Corner Bases (6x6 cells each)
const HOME_CORNERS = [
    { r: 9, c: 0 }, // P0 Pink (Bottom-Left)
    { r: 0, c: 0 }, // P1 Cyan (Top-Left)
    { r: 0, c: 9 }, // P2 Yellow (Top-Right)
    { r: 9, c: 9 }, // P3 Green (Bottom-Right)
];

const TOKEN_OFFSETS = [
    { r: 1.5, c: 1.5 }, { r: 1.5, c: 3.5 },
    { r: 3.5, c: 1.5 }, { r: 3.5, c: 3.5 },
];

const OnlineLudoScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const { width: SW, height: SH } = useWindowDimensions();

    // Responsive board size calculation: fits any mobile viewport cleanly
    const BOARD_PX = useMemo(() => {
        const maxW = SW - 16;
        const maxH = SH - 240;
        return Math.floor(Math.min(maxW, maxH, 460));
    }, [SW, SH]);

    const CELL = useMemo(() => Math.floor(BOARD_PX / GRID), [BOARD_PX]);
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    const { room, playerName, isHost, gameState: initialGameState } = route.params;
    const myUserId = SocketService.userId;

    // Game state
    const [gameState, setGameState] = useState(initialGameState || null);
    const [diceDisplay, setDiceDisplay] = useState(initialGameState?.diceValue || 1);
    const [isRolling, setIsRolling] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Game started! Roll the dice.');
    const [showGameOver, setShowGameOver] = useState(false);

    // Loading state: shown until first real gameState arrives
    const [isLoadingState, setIsLoadingState] = useState(!initialGameState);

    // State sync reconciler for HTTP snapshot & reconnection recovery
    const handleStateSync = useCallback((syncData) => {
        if (syncData?.gameState) {
            setGameState(syncData.gameState);
            setIsLoadingState(false);
            if (syncData.gameState.diceValue) {
                setDiceDisplay(syncData.gameState.diceValue);
            }
        }
    }, []);

    // Disconnect & Auto-Rejoin hook
    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost },
        onStateSync: handleStateSync
    });

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isMyTurn = gameState?.currentTurnUserId === myUserId;
    const isMovingPhase = gameState?.phase === 'moving';
    const isRollingPhase = gameState?.phase === 'rolling';
    const hasMovableToken = isMyTurn && isMovingPhase && (gameState?.movableTokens?.length || 0) > 0;

    // Pulsing animation for movable tokens (runs only when user has movable tokens)
    useEffect(() => {
        if (!hasMovableToken) {
            pulseAnim.setValue(1);
            return undefined;
        }
        pulseAnim.setValue(1);
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.18, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 420, useNativeDriver: USE_NATIVE_DRIVER })
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [hasMovableToken, pulseAnim]);

    // Socket Listeners
    useEffect(() => {
        const onStateUpdate = ({ gameState: updatedState, diceValue, message, lastMove }) => {
            if (updatedState) {
                setGameState(updatedState);
                setIsLoadingState(false);
                if (updatedState.diceValue) {
                    setDiceDisplay(updatedState.diceValue);
                }
            }

            if (message) {
                setStatusMessage(message);
            } else if (lastMove) {
                const mover = updatedState?.players?.find(p => p.userId === lastMove.userId);
                const moverName = mover ? mover.name : 'Player';
                if (lastMove.captured) {
                    setStatusMessage(`💥 ${moverName} captured ${lastMove.captured.victimName}'s token! Bonus roll!`);
                    SoundService.play('hit');
                    HapticService.trigger('impactHeavy');
                } else if (lastMove.reachedHome) {
                    setStatusMessage(`⭐ ${moverName} got a token HOME! Bonus roll!`);
                    SoundService.play('victory');
                    HapticService.trigger('notificationSuccess');
                } else if (lastMove.bonusRoll) {
                    setStatusMessage(`🔥 ${moverName} rolled a 6! Bonus roll!`);
                    SoundService.play('combo');
                }
            }

            setIsRolling(false);
        };

        const onGameOver = ({ gameState: finalState, winner, rankings }) => {
            if (finalState) setGameState(finalState);
            setShowGameOver(true);
            SoundService.play('victory');
            HapticService.trigger('notificationSuccess');
        };

        const onGameStateSync = (data) => {
            if (data?.gameState) {
                setGameState(data.gameState);
                setIsLoadingState(false);
                if (data.gameState.diceValue) {
                    setDiceDisplay(data.gameState.diceValue);
                }
            }
        };

        SocketService.on('ludo-state-update', onStateUpdate);
        SocketService.on('ludo-game-over', onGameOver);
        SocketService.on('game-state-sync', onGameStateSync);

        // Request initial state if missing
        if (!initialGameState && room?.id) {
            SocketService.emit('ludo-get-state', { roomId: room.id });
        }

        return () => {
            SocketService.off('ludo-state-update', onStateUpdate);
            SocketService.off('ludo-game-over', onGameOver);
            SocketService.off('game-state-sync', onGameStateSync);
        };
    }, [room?.id, initialGameState]);

    // ── Retry polling: re-request game state every 2 s until received ──
    useEffect(() => {
        if (!isLoadingState) return undefined;
        // Initial request already sent in the socket effect above.
        // Retry every 2 seconds in case the first emit is missed.
        const retryInterval = setInterval(() => {
            SocketService.emit('ludo-get-state', { roomId: room.id });
        }, 2000);
        return () => clearInterval(retryInterval);
    }, [isLoadingState, room?.id]);

    // ── Roll Action ──
    const handleRollDice = () => {
        if (!isMyTurn || !isRollingPhase || isRolling) return;

        setIsRolling(true);
        HapticService.trigger('impactMedium');
        SoundService.play('dice');

        // Rapid visual dice roll flicker
        let flickers = 0;
        const interval = setInterval(() => {
            setDiceDisplay(Math.floor(Math.random() * 6) + 1);
            flickers += 1;
            if (flickers >= 8) {
                clearInterval(interval);
                SocketService.sendGameAction(room.id, 'ludo-roll-dice', { roomId: room.id })
                    .catch((err) => console.warn('[OnlineLudo] sendGameAction ludo-roll-dice error:', err));
            }
        }, 60);
    };

    // ── Move Token Action ──
    const handleSelectToken = (tokenId) => {
        if (!isMyTurn || !isMovingPhase) return;
        if (!gameState?.movableTokens?.includes(tokenId)) return;

        HapticService.trigger('impactLight');
        SoundService.play('click');

        SocketService.sendGameAction(room.id, 'ludo-move-token', {
            roomId: room.id,
            tokenId
        }).catch((err) => console.warn('[OnlineLudo] sendGameAction ludo-move-token error:', err));
    };

    // Get absolute board cell for a token
    const getTokenCoords = (player, token) => {
        if (token.finished) return CENTER;

        if (token.pos === -1) {
            // In Yard
            const corner = HOME_CORNERS[player.colorIdx];
            const offset = TOKEN_OFFSETS[token.id];
            return [corner.r + offset.r, corner.c + offset.c];
        }

        if (token.homePos >= 0) {
            if (token.homePos >= 5) return CENTER;
            return HOME_COLS[player.colorIdx][token.homePos];
        }

        const absIdx = (PLAYER_START[player.colorIdx] + token.pos) % 52;
        return MAIN_TRACK[absIdx];
    };

    // Group all active tokens by their cell coordinate
    const tokensByCell = useMemo(() => {
        const map = {};
        if (!gameState?.players) return map;

        for (const p of gameState.players) {
            for (const t of p.tokens) {
                const [r, c] = getTokenCoords(p, t);
                const key = `${r}_${c}`;
                if (!map[key]) map[key] = [];
                map[key].push({
                    ...t,
                    player: p,
                    isMovable: isMyTurn && isMovingPhase && p.userId === myUserId && gameState.movableTokens?.includes(t.id)
                });
            }
        }
        return map;
    }, [gameState, isMyTurn, isMovingPhase, myUserId]);

    // ─── Render Cell Component ────────────────────────────────────────────────
    const renderCell = (r, c) => {
        // Skip corner base 6x6 blocks (rendered by LudoHomeBase components)
        if (
            (r < 6 && c < 6) ||
            (r < 6 && c >= 9) ||
            (r >= 9 && c < 6) ||
            (r >= 9 && c >= 9) ||
            (r >= 6 && r < 9 && c >= 6 && c < 9) // center
        ) {
            return <View key={`${r}_${c}`} style={{ width: CELL, height: CELL }} pointerEvents="none" />;
        }

        // Check if cell is an entry/safe cell
        let startColor = null;
        if (r === 14 && c === 6) startColor = PLAYER_COLORS[0]; // Pink start
        if (r === 6 && c === 0) startColor = PLAYER_COLORS[1];  // Cyan start
        if (r === 0 && c === 8) startColor = PLAYER_COLORS[2];  // Yellow start
        if (r === 8 && c === 14) startColor = PLAYER_COLORS[3]; // Green start

        // Check if cell is in home column
        let homeColColor = null;
        if (c === 7 && r >= 9 && r <= 13) homeColColor = PLAYER_COLORS[0]; // Pink runway
        if (r === 7 && c >= 1 && c <= 5) homeColColor = PLAYER_COLORS[1];  // Cyan runway
        if (c === 7 && r >= 1 && r <= 5) homeColColor = PLAYER_COLORS[2];  // Yellow runway
        if (r === 7 && c >= 9 && c <= 13) homeColColor = PLAYER_COLORS[3]; // Green runway

        // Safe star check
        const isStar = (
            (r === 8 && c === 2) ||
            (r === 2 && c === 6) ||
            (r === 6 && c === 12) ||
            (r === 12 && c === 8) ||
            Boolean(startColor)
        );

        let directionArrow = null;
        if (r === 14 && c === 7) directionArrow = { direction: 'up', color: PLAYER_COLORS[0] };
        else if (r === 7 && c === 0) directionArrow = { direction: 'right', color: PLAYER_COLORS[1] };
        else if (r === 0 && c === 7) directionArrow = { direction: 'down', color: PLAYER_COLORS[2] };
        else if (r === 7 && c === 14) directionArrow = { direction: 'left', color: PLAYER_COLORS[3] };

        const safeStarColor = startColor || LUDO_MID_SAFE_STAR_COLORS[`${r}_${c}`] || '#FFD700';

        const rawTokens = tokensByCell[`${r}_${c}`] || [];
        const cellTokens = rawTokens.length > 1
            ? [...rawTokens].sort((a, b) => (a.isMovable === b.isMovable ? 0 : a.isMovable ? 1 : -1))
            : rawTokens;
        const isStacked = cellTokens.length > 1;

        return (
            <LudoTrackTile
                key={`${r}_${c}`}
                size={CELL}
                startColor={startColor}
                homeColColor={homeColColor}
                isSafeStar={isStar && cellTokens.length === 0}
                safeStarColor={safeStarColor}
                directionArrow={directionArrow}
            >
                {cellTokens.length > 0 && (
                    <View style={styles.tokenStack} pointerEvents="box-none">
                        {cellTokens.slice(0, 4).map((t, idx) => {
                            const tColor = t.player.color;
                            const off = isStacked ? LUDO_STACK_OFFSETS[idx % 4] : { x: 0, y: 0 };
                            const tx = off.x * CELL;
                            const ty = off.y * CELL;
                            const baseScale = isStacked ? (t.isMovable ? 0.88 : 0.68) : (t.isMovable ? 1.06 : 0.94);

                            return (
                                <TouchableOpacity
                                    key={`${t.player.userId}_${t.id}`}
                                    onPress={() => t.isMovable && handleSelectToken(t.id)}
                                    disabled={!t.isMovable}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.tokenWrapper,
                                        {
                                            zIndex: 10 + idx,
                                            transform: [{ translateX: tx }, { translateY: ty }]
                                        }
                                    ]}
                                >
                                    <Animated.View style={t.isMovable ? { transform: [{ scale: pulseAnim }] } : undefined}>
                                        <View style={{ transform: [{ scale: baseScale }] }}>
                                            <NeonStarToken
                                                color={tColor}
                                                size={Math.floor(CELL * 0.86)}
                                                isMovable={t.isMovable}
                                            />
                                        </View>
                                    </Animated.View>
                                    {isStacked && idx === Math.min(cellTokens.length - 1, 3) && cellTokens.length > 4 && (
                                        <View style={styles.stackCountBadge}>
                                            <Text style={styles.stackCountText}>{cellTokens.length}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </LudoTrackTile>
        );
    };

    // ─── Render Yard Component (6x6 area in quadrant) ─────────────────────────
    const renderYard = (colorIdx, top, left) => {
        const player = gameState?.players?.find(p => p.colorIdx === colorIdx);
        const yardColor = PLAYER_COLORS[colorIdx];
        const isCurrentTurn = gameState?.currentTurnUserId === player?.userId;
        const yardTokens = player?.tokens?.filter(t => t.pos === -1) || [];

        return (
            <LudoHomeBase
                color={yardColor}
                size={6 * CELL}
                top={top * CELL}
                left={left * CELL}
                label={player ? player.name : 'Waiting...'}
                avatarEmoji={player ? getAvatarEmoji(player.avatar) : '👤'}
                isActive={isCurrentTurn}
                renderPadContent={(id, padSize) => {
                    const hasToken = yardTokens.some(t => t.id === id);
                    if (!hasToken) return null;
                    const isMovable = isMyTurn && isMovingPhase && player?.userId === myUserId && gameState.movableTokens?.includes(id);

                    return (
                        <TouchableOpacity
                            onPress={() => isMovable && handleSelectToken(id)}
                            disabled={!isMovable}
                            activeOpacity={0.75}
                        >
                            <Animated.View style={isMovable ? { transform: [{ scale: pulseAnim }] } : undefined}>
                                <NeonStarToken
                                    color={yardColor}
                                    size={Math.floor(padSize * 0.92)}
                                    isMovable={isMovable}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    );
                }}
            />
        );
    };

    // ─── Center Home Zone ─────────────────────────────────────────────────────
    const renderCenter = () => (
        <LudoCenterGoal
            size={3 * CELL}
            top={6 * CELL}
            left={6 * CELL}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#070714', '#0D0B21', '#070714']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* ── LOADING OVERLAY — shown until gameState arrives ── */}
            {isLoadingState && (
                <View style={styles.loadingOverlay}>
                    <NeonText glowColor="#00FFFF" style={styles.loadingTitle}>
                        NEON LUDO
                    </NeonText>
                    <View style={styles.loadingSpinnerRow}>
                        <NeonText style={styles.loadingDot}>■</NeonText>
                        <NeonText style={[styles.loadingDot, { color: '#FFD700' }]}>■</NeonText>
                        <NeonText style={[styles.loadingDot, { color: '#39FF14' }]}>■</NeonText>
                        <NeonText style={[styles.loadingDot, { color: '#FF007F' }]}>■</NeonText>
                    </View>
                    <NeonText style={styles.loadingSubtitle}>
                        Waiting for game to start…
                    </NeonText>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loadingBack}>
                        <NeonText style={{ fontSize: 13, color: '#8B8FA8' }}>← Back to Lobby</NeonText>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoadingState && (<>
            {/* TOP HEADER */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <NeonText glowColor={COLORS.hotPink} style={styles.headerTitle}>
                        NEON LUDO
                    </NeonText>
                    <NeonText style={styles.roomCodeBadge}>
                        ROOM: {room?.id || '----'}
                    </NeonText>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* PLAYER SCORES & TURN HUD */}
            <View style={styles.playerHudRow}>
                {gameState?.players?.map(p => {
                    const isTurn = gameState.currentTurnUserId === p.userId;
                    return (
                        <View
                            key={p.userId}
                            style={[
                                styles.hudPlayerCard,
                                { borderColor: isTurn ? '#FFFFFF' : `${p.color}55` },
                                isTurn && { backgroundColor: `${p.color}22` }
                            ]}
                        >
                            <View style={styles.hudAvatarRow}>
                                <NeonText style={{ fontSize: 16 }}>{getAvatarEmoji(p.avatar)}</NeonText>
                                <View style={[styles.colorDot, { backgroundColor: p.color }]} />
                            </View>
                            <NeonText style={[styles.hudName, isTurn && { color: p.color, fontWeight: 'bold' }]} numberOfLines={1}>
                                {p.name}
                            </NeonText>
                            {/* 4 Finished Pips */}
                            <View style={styles.pipsRow}>
                                {[0, 1, 2, 3].map(idx => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.hudPip,
                                            idx < p.finishedCount && { backgroundColor: p.color }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* STATUS BANNER */}
            <View style={styles.statusBanner}>
                <NeonText style={styles.statusText} numberOfLines={1}>
                    {statusMessage}
                </NeonText>
            </View>

            {/* 15x15 LUDO BOARD */}
            <View style={styles.boardContainer}>
                <View style={[styles.boardWrapper, { width: CELL * GRID, height: CELL * GRID }]}>
                    {/* 4 Corner Yards */}
                    {renderYard(0, 9, 0)} {/* P0 Pink: Bottom-Left */}
                    {renderYard(1, 0, 0)} {/* P1 Cyan: Top-Left */}
                    {renderYard(2, 0, 9)} {/* P2 Yellow: Top-Right */}
                    {renderYard(3, 9, 9)} {/* P3 Green: Bottom-Right */}

                    {/* Center Area */}
                    {renderCenter()}

                    {/* Grid Cells */}
                    <View style={styles.gridOverlay} pointerEvents="box-none">
                        {Array.from({ length: GRID }, (_, r) => (
                            <View key={r} style={{ flexDirection: 'row', height: CELL }} pointerEvents="box-none">
                                {Array.from({ length: GRID }, (_, c) => renderCell(r, c))}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* BOTTOM CONTROLS & DICE ROLLER */}
            <View style={styles.bottomControls}>
                <TouchableOpacity
                    style={[
                        styles.diceButton,
                        isMyTurn && isRollingPhase && styles.diceButtonActive,
                        !isMyTurn && styles.diceButtonDisabled
                    ]}
                    onPress={handleRollDice}
                    disabled={!isMyTurn || !isRollingPhase || isRolling}
                    activeOpacity={0.8}
                >
                    <Animated.View style={[styles.diceBox, isRolling && { transform: [{ rotate: '15deg' }] }]}>
                        <NeonText style={styles.diceNumberText}>{diceDisplay}</NeonText>
                    </Animated.View>
                    <View style={styles.diceLabelContainer}>
                        <NeonText style={styles.diceActionPrompt}>
                            {!isMyTurn
                                ? `Waiting for ${gameState?.players?.[gameState?.currentTurnIndex]?.name || 'player'}...`
                                : isRollingPhase
                                    ? 'TAP TO ROLL DICE! 🎲'
                                    : 'SELECT A MOVING TOKEN! ☝️'}
                        </NeonText>
                    </View>
                </TouchableOpacity>
            </View>

            {/* GAME OVER MODAL */}
            <Modal visible={showGameOver} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <NeonText style={{ fontSize: 64 }}>🏆</NeonText>
                        <NeonText glowColor={COLORS.hotPink} style={styles.winnerTitle}>
                            VICTORY!
                        </NeonText>
                        <NeonText style={styles.winnerSubtitle}>
                            {gameState?.players?.find(p => p.userId === gameState?.winner)?.name || 'Player'} has won the match!
                        </NeonText>
                        <NeonButton
                            title="RETURN TO LOBBY"
                            onPress={() => navigation.navigate('Lobby', { room, isHost })}
                            color={COLORS.neonCyan}
                            glow={true}
                            style={{ width: '100%', marginTop: 20 }}
                        />
                    </View>
                </View>
            </Modal>
            </>)}
        </SafeAreaView>
    );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LUDO_RAVE_THEME.screenBg
    },
    // ── Loading State ──────────────────────────────────────────────────────────
    loadingOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32
    },
    loadingTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 3,
        marginBottom: 24
    },
    loadingSpinnerRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    loadingDot: {
        fontSize: 20,
        color: '#00FFFF'
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#8B8FA8',
        textAlign: 'center',
        marginBottom: 32
    },
    loadingBack: {
        paddingVertical: 10,
        paddingHorizontal: 20
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 8 : 12,
        paddingBottom: 6
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    roomCodeBadge: {
        fontSize: 11,
        color: COLORS.textMuted,
        letterSpacing: 1
    },
    playerHudRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        gap: 6,
        marginBottom: 6
    },
    hudPlayerCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        borderWidth: 1.5,
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center'
    },
    hudAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    hudName: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginVertical: 2
    },
    pipsRow: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 2
    },
    hudPip: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.15)'
    },
    statusBanner: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 5,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 4
    },
    statusText: {
        fontSize: 12,
        color: COLORS.neonCyan,
        fontWeight: '600'
    },
    boardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    boardWrapper: {
        borderWidth: 2,
        borderColor: LUDO_RAVE_THEME.tileBorder,
        backgroundColor: LUDO_RAVE_THEME.boardBg,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 12
    },
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5
    },
    tokenStack: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    tokenWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stackCountBadge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        width: 12,
        height: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    stackCountText: {
        fontSize: 7,
        color: '#000',
        fontWeight: 'bold'
    },
    bottomControls: {
        paddingHorizontal: 20,
        paddingVertical: 12
    },
    diceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 12
    },
    diceButtonActive: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        shadowColor: COLORS.limeGlow,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8
    },
    diceButtonDisabled: {
        opacity: 0.6
    },
    diceBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#1b1b36',
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14
    },
    diceNumberText: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.limeGlow
    },
    diceLabelContainer: {
        flex: 1
    },
    diceActionPrompt: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#0f0f24',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        padding: 28,
        alignItems: 'center'
    },
    winnerTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 10
    },
    winnerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 6
    }
});

export default OnlineLudoScreen;

