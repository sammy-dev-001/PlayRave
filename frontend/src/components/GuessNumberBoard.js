// ============================================================================
// GuessNumberBoard.js — PLAYING Phase UI
// ============================================================================
//
// PURPOSE
// ───────
// Renders the main gameplay board for Guess the Number when gamePhase is 'PLAYING'.
// Includes the active player indicator, dynamic boundaries, custom numpad, and
// feedback history.
//
// ============================================================================

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from './GlassView';
import NeonText from './NeonText';
import HapticService from '../services/HapticService';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../constants/themes';

// ── Numpad layout ────────────────────────────────────────────────────────────
const NUMPAD_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['DEL', '0', 'OK'],
];

const MAX_DIGITS = 4;

/**
 * GuessNumberBoard
 *
 * @param {{ gameState, currentUserId, onGuess, style }} props
 */
const GuessNumberBoard = ({
    gameState,
    currentUserId,
    onGuess,
    style,
}) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const isGlass = theme?.isGlass;

    const {
        players = [],
        rangeMin = 0,
        rangeMax = 100,
        currentTurnId = null
    } = gameState || {};

    const { width: windowWidth } = useWindowDimensions();
    const isMobile = windowWidth < 768;

    const isMultiplayer = players.length > 2;
    // In multiplayer, it's always everyone's turn simultaneously.
    const isMyTurn = isMultiplayer || currentTurnId === currentUserId;

    const activePlayer = players.find(p => p.userId === currentTurnId);
    const myPlayer = players.find(p => p.userId === currentUserId);

    // ── Derive dynamic bounds & history from players ───────────────────────────
    const { currentMin, currentMax, combinedHistory } = useMemo(() => {
        let min = rangeMin;
        let max = rangeMax;
        const history = [];

        // In 2-player mode, players are guessing DIFFERENT targets. We only want
        // to show the history and bounds for OURSELVES to track our own progress.
        // In multiplayer, everyone guesses the SAME target, so we aggregate all.
        const relevantPlayers = isMultiplayer ? players : (myPlayer ? [myPlayer] : []);

        relevantPlayers.forEach(player => {
            player.guesses.forEach(guess => {
                history.push({ ...guess, playerName: player.name });
                if (guess.hint === 'TOO_LOW') {
                    min = Math.max(min, guess.value + 1);
                } else if (guess.hint === 'TOO_HIGH') {
                    max = Math.min(max, guess.value - 1);
                }
            });
        });

        // Simply reverse to show the most recent guesses at the top
        history.reverse();

        return { currentMin: min, currentMax: max, combinedHistory: history };
    }, [players, rangeMin, rangeMax, isMultiplayer, myPlayer]);

    // ── Local Input State ──────────────────────────────────────────────────
    const [digits, setDigits] = useState('');
    const [validationMsg, setValidationMsg] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Reset digits when turn changes
    useEffect(() => {
        setDigits('');
        setValidationMsg('');
    }, [currentTurnId]);

    // ── Numpad key handler ─────────────────────────────────────────────────
    const handleKey = useCallback((key) => {
        HapticService.buttonTap();
        setValidationMsg('');

        if (key === 'DEL') {
            setDigits(prev => prev.slice(0, -1));
            return;
        }

        if (key === 'OK') {
            handleSubmit();
            return;
        }

        if (digits.length >= MAX_DIGITS) return;
        setDigits(prev => prev + key);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.08,
                duration: 60,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits]);

    const handleSubmit = useCallback(() => {
        const parsed = parseInt(digits, 10);

        if (!digits || isNaN(parsed)) {
            triggerShake('Enter a guess.');
            return;
        }
        if (parsed < rangeMin || parsed > rangeMax) {
            triggerShake(`Must be between ${rangeMin} and ${rangeMax}.`);
            return;
        }

        HapticService.success?.();
        setDigits(''); // Clear on submit
        onGuess?.(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits, rangeMin, rangeMax, onGuess]);

    if (!gameState || gameState.gamePhase !== 'PLAYING') return null;

    const triggerShake = (msg) => {
        setValidationMsg(msg);
        HapticService.error?.();
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    };

    return (
        <View style={[styles.root, style]}>
            {/* ── Active Player Header ───────────────────────────────────── */}
            <View style={styles.headerContainer}>
                {isMyTurn ? (
                    <NeonText variant="display" size={20} color={COLORS.neonCyan} glow style={styles.headerText}>
                        YOUR TURN
                    </NeonText>
                ) : (
                    <NeonText variant="display" size={18} color={COLORS.electricPurple} style={styles.headerText}>
                        Waiting for {activePlayer?.name}...
                    </NeonText>
                )}
            </View>

            {/* ── Boundary Display ───────────────────────────────────────── */}
            <GlassView
                variant="primary"
                style={[
                    styles.boundsCard,
                    { borderColor: COLORS.neonCyan },
                    !isGlass && SHADOWS.neonGlow,
                ]}
            >
                <NeonText size={14} color={COLORS.textMuted} style={styles.boundsLabel}>
                    The secret number is between
                </NeonText>
                <View style={styles.boundsNumbers}>
                    <NeonText variant="arcade" size={36} color={COLORS.neonCyan} glow>
                        {currentMin}
                    </NeonText>
                    <NeonText variant="arcade" size={24} color={COLORS.textSecondary} style={{ marginHorizontal: 16 }}>
                        &
                    </NeonText>
                    <NeonText variant="arcade" size={36} color={COLORS.neonCyan} glow>
                        {currentMax}
                    </NeonText>
                </View>
            </GlassView>

            {/* ── Main Content Row ───────────────────────────────────────── */}
            <View style={[styles.mainContentRow, isMobile && { flexDirection: 'column' }]}>
                {isMobile ? (
                    <>
                        {/* On mobile, input/keypad goes TOP, history goes BOTTOM */}
                        <View style={[styles.inputContainer, { flex: undefined, flexGrow: 0, flexShrink: 0, flexBasis: 'auto', marginBottom: 16 }]}>
                            {renderInputSection()}
                        </View>
                        <View style={[styles.historyContainer, { marginRight: 0, flex: 1 }]}>
                            {renderHistorySection()}
                        </View>
                    </>
                ) : (
                    <>
                        {/* On desktop, history goes LEFT, input/keypad goes RIGHT */}
                        <View style={styles.historyContainer}>
                            {renderHistorySection()}
                        </View>
                        <View style={styles.inputContainer}>
                            {renderInputSection()}
                        </View>
                    </>
                )}
            </View>
        </View>
    );

    function renderHistorySection() {
        return combinedHistory.length > 0 ? (
            <ScrollView
                style={styles.historyScroll}
                contentContainerStyle={styles.historyContent}
                showsVerticalScrollIndicator={false}
            >
                {combinedHistory.map((guess, index) => {
                    const isHigh = guess.hint === 'TOO_HIGH';
                    const icon = isHigh ? 'arrow-down' : 'arrow-up';
                    const color = isHigh ? COLORS.hotPink : COLORS.neonCyan;
                    const text = isHigh ? 'LOWER' : 'HIGHER';

                    return (
                        <View key={index} style={[styles.historyRow, { borderBottomColor: COLORS.borderLight }]}>
                            <View style={styles.historyLeft}>
                                <NeonText size={12} color={COLORS.textMuted}>{guess.playerName} guessed</NeonText>
                                <NeonText variant="arcade" size={16} color={COLORS.white} style={styles.historyValue}>
                                    {guess.value}
                                </NeonText>
                            </View>
                            <View style={styles.historyRight}>
                                <Ionicons name={icon} size={16} color={color} style={{ marginRight: 4 }} />
                                <NeonText size={12} color={color} weight="bold">{text}</NeonText>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        ) : (
            <View style={styles.emptyHistory}>
                <NeonText size={13} color={COLORS.textMuted}>No guesses yet.</NeonText>
            </View>
        );
    }

    function renderInputSection() {
        return isMyTurn ? (
            <View style={styles.inputSection}>
                <Animated.View style={[styles.displayWrapper, { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }]}>
                    <GlassView style={[styles.inputDisplay, { borderColor: COLORS.borderDefault }]}>
                        {digits ? (
                            <NeonText variant="arcade" size={32} color={COLORS.white} glow>
                                {digits}
                            </NeonText>
                        ) : (
                            <NeonText size={14} color={COLORS.textMuted}>
                                tap to guess
                            </NeonText>
                        )}
                    </GlassView>
                </Animated.View>

                {!!validationMsg && (
                    <NeonText size={12} color={COLORS.danger} style={styles.validationText}>
                        ⚠ {validationMsg}
                    </NeonText>
                )}

                <GlassView style={[styles.numpadContainer, { borderColor: COLORS.borderDefault }]}>
                    {NUMPAD_KEYS.map((row, rowIdx) => (
                        <View key={rowIdx} style={styles.numpadRow}>
                            {row.map(key => (
                                <NumpadKey
                                    key={key}
                                    label={key}
                                    onPress={() => handleKey(key)}
                                    isAction={key === 'DEL' || key === 'OK'}
                                    isConfirm={key === 'OK'}
                                    COLORS={COLORS}
                                    isGlass={isGlass}
                                />
                            ))}
                        </View>
                    ))}
                </GlassView>
            </View>
        ) : (
            <View style={styles.waitingSection}>
                <GlassView style={[styles.waitingCard, { borderColor: COLORS.electricPurple }]}>
                    <NeonText variant="display" size={18} color={COLORS.electricPurple} glow style={styles.waitingText}>
                        Wait for your turn!
                    </NeonText>
                    <NeonText size={13} color={COLORS.textMuted} style={styles.waitingSub}>
                        {activePlayer?.name} is thinking...
                    </NeonText>
                </GlassView>
            </View>
        );
    }
};

// ── NumpadKey Component ───────────────────────────────────────────────────────
const NumpadKey = React.memo(({ label, onPress, isAction, isConfirm, COLORS, isGlass }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(pressAnim, { toValue: 0.88, useNativeDriver: Platform.OS !== 'web', friction: 10 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 5, tension: 140 }).start();
    };

    const keyColor = isConfirm ? COLORS.neonCyan : isAction ? COLORS.hotPink : COLORS.white;
    const keyBg = isConfirm ? (isGlass ? 'rgba(0,194,255,0.15)' : 'rgba(0,248,255,0.12)') : isAction ? (isGlass ? 'rgba(255,45,85,0.12)' : 'rgba(255,62,164,0.10)') : 'transparent';
    const borderColor = isConfirm ? COLORS.neonCyan : isAction ? COLORS.hotPink : COLORS.borderDefault;

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View style={[
                keyStyles.key,
                { backgroundColor: keyBg, borderColor, transform: [{ scale: pressAnim }] },
                isConfirm && !isGlass && SHADOWS.neonGlow,
            ]}>
                {label === 'DEL' ? (
                    <Ionicons name="backspace-outline" size={22} color={keyColor} />
                ) : (
                    <NeonText variant={isConfirm ? 'arcade' : 'regular'} weight={isAction ? 'bold' : 'regular'} size={isAction ? 14 : 22} color={keyColor} glow={isConfirm}>
                        {label}
                    </NeonText>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
});

// ── Styles ───────────────────────────────────────────────────────────────────
const getStyles = () => StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    headerText: {
        textAlign: 'center',
    },
    boundsCard: {
        borderRadius: 20,
        borderWidth: 2,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    boundsLabel: {
        marginBottom: 8,
    },
    boundsNumbers: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContentRow: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },
    historyContainer: {
        flex: 1,
        marginRight: 12,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    historyScroll: {
        flex: 1,
    },
    historyContent: {
        paddingVertical: 8,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    historyValue: {
        marginLeft: 8,
    },
    historyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emptyHistory: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    inputContainer: {
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    inputSection: {
        width: '100%',
        alignItems: 'center',
    },
    displayWrapper: {
        width: '100%',
        marginBottom: 8,
    },
    inputDisplay: {
        borderRadius: 16,
        borderWidth: 1.5,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
    },
    validationText: {
        marginBottom: 8,
    },
    numpadContainer: {
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 12,
        width: '100%',
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    waitingSection: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    waitingCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 32,
        alignItems: 'center',
    },
    waitingText: {
        textAlign: 'center',
        marginBottom: 8,
    },
    waitingSub: {
        textAlign: 'center',
    },
});

const keyStyles = StyleSheet.create({
    key: {
        width: 80,
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
});

export default React.memo(GuessNumberBoard);
