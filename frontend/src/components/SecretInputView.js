// ============================================================================
// SecretInputView.js — AWAITING_SECRET Phase UI
// ============================================================================
//
// PURPOSE
// ───────
// Renders the UI for the 'AWAITING_SECRET' gamePhase of Guess the Number.
// Returns null immediately if gamePhase !== 'AWAITING_SECRET', so the parent
// screen can always mount it without any conditional wrapping.
//
// PROP CONTRACT
// ─────────────
//   gamePhase        {'AWAITING_SECRET'|'PLAYING'|'GAME_OVER'}  ← from engine
//   currentUserId    {string}  — local player's persistent userId
//   secretSetterId   {string}  — the userId of the designated setter
//   rangeMin         {number}  — lower bound of the allowed secret range
//   rangeMax         {number}  — upper bound of the allowed secret range
//   onSubmit         {(number) => void}  — fires when setter confirms a secret
//   style            {ViewStyle}  — optional outer style override
//
// CONDITIONAL RENDERING STRATEGY
// ───────────────────────────────
//   gamePhase !== 'AWAITING_SECRET'  →  null            (hard gate at top)
//   currentUserId === secretSetterId →  <SetterView />   (masked numpad)
//   currentUserId !== secretSetterId →  <WaitingView />  (pulsing neon idle)
//
// SECURITY NOTE
// ─────────────
// The numpad digit display uses masked '●' bullets — not a native TextInput —
// so the OS cannot offer auto-fill, screenshot-based leak, or text selection.
// The actual numeric value lives in component state only.
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from './GlassView';
import NeonText from './NeonText';
import HapticService from '../services/HapticService';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../constants/themes';

// ── Numpad layout ────────────────────────────────────────────────────────────
// Rows of keys. 'DEL' removes last digit; 'OK' confirms.
const NUMPAD_KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['DEL', '0', 'OK'],
];

const MAX_DIGITS = 4; // cap display width; engine validates actual range

// ── Root Component ───────────────────────────────────────────────────────────

/**
 * SecretInputView
 *
 * Drop this component into any Guess-the-Number game screen.
 * It self-gates on `gamePhase` and renders the appropriate sub-view.
 *
 * @param {{ gamePhase, currentUserId, secretSetterId, rangeMin, rangeMax, onSubmit, style }} props
 */
const SecretInputView = ({
    gameState,
    currentUserId,
    rangeMin = 1,
    rangeMax = 100,
    onSecretSubmit,
    style,
}) => {
    // ── Hard gate: render nothing outside AWAITING_SECRET ───────────────────
    if (gameState?.gamePhase !== 'AWAITING_SECRET') return null;

    const hasSetSecret = gameState.secretsSetBy?.includes(currentUserId);

    return !hasSetSecret ? (
        <SetterView
            rangeMin={rangeMin}
            rangeMax={rangeMax}
            onSubmit={onSecretSubmit}
            style={style}
        />
    ) : (
        <WaitingView style={style} />
    );
};

// ── SetterView ───────────────────────────────────────────────────────────────
// Shown to the player who is setting the secret number.
// Custom masked display + numpad — no native TextInput — prevents OS autofill,
// keyboard screenshots, and clipboard exposure.

const SetterView = ({ rangeMin, rangeMax, onSubmit, style }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getSetterStyles(COLORS), [COLORS]);
    const isGlass = theme?.isGlass;

    const [digits, setDigits] = useState('');
    const [validationMsg, setValidationMsg] = useState('');

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // ── Numpad key handler ────────────────────────────────────────────────
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

        // Micro scale pop on each digit entry
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

    // ── Submit handler ────────────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        const parsed = parseInt(digits, 10);
        if (!digits || isNaN(parsed)) {
            triggerShake('Enter a number first.');
            return;
        }
        if (parsed < rangeMin || parsed > rangeMax) {
            triggerShake(`Must be between ${rangeMin} and ${rangeMax}.`);
            return;
        }
        HapticService.success?.();
        onSubmit?.(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digits, rangeMin, rangeMax, onSubmit]);

    const triggerShake = (msg) => {
        setValidationMsg(msg);
        HapticService.error?.();
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 6,  duration: 45, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 45, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 0,  duration: 35, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    };

    // Display actual digits instead of masking
    const displayDigits = digits || null;

    return (
        <View style={[styles.root, style]}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Ionicons name="lock-closed" size={24} color={COLORS.neonCyan} style={{ marginRight: 8 }} />
                <NeonText
                    variant="display"
                    size={22}
                    color={COLORS.neonCyan}
                    glow
                    style={[styles.headerText, { marginBottom: 0 }]}
                >
                    Set the Secret Number
                </NeonText>
            </View>
            <NeonText size={13} color={COLORS.textMuted} style={styles.rangeLabel}>
                Choose any 4-digit number
            </NeonText>

            {/* ── Masked display card ──────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.displayWrapper,
                    { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
                ]}
            >
                <GlassView
                    variant="primary"
                    style={[
                        styles.displayCard,
                        { borderColor: COLORS.neonCyan },
                        !isGlass && SHADOWS.neonGlow,
                    ]}
                >
                    {displayDigits ? (
                        <NeonText
                            variant="arcade"
                            size={38}
                            color={COLORS.neonCyan}
                            glow
                            style={styles.maskedText}
                        >
                            {displayDigits}
                        </NeonText>
                    ) : (
                        <NeonText size={14} color={COLORS.textMuted} style={styles.placeholder}>
                            tap a number below…
                        </NeonText>
                    )}
                </GlassView>
            </Animated.View>

            {/* ── Validation error ─────────────────────────────────────────── */}
            {!!validationMsg && (
                <NeonText size={12} color={COLORS.danger} style={styles.validationMsg}>
                    ⚠ {validationMsg}
                </NeonText>
            )}

            {/* ── Numpad grid ──────────────────────────────────────────────── */}
            <GlassView style={[styles.numpadPanel, { borderColor: COLORS.borderDefault }]}>
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

            {/* ── Shoulder-surf notice ─────────────────────────────────────── */}
            <NeonText size={11} color={COLORS.textDarkMuted} style={styles.privacyNote}>
                🛡 Your opponent cannot see this screen
            </NeonText>
        </View>
    );
};

// ── NumpadKey ─────────────────────────────────────────────────────────────────
// Individual key cell. Uses spring press-in/out animation for tactile feel.

const NumpadKey = React.memo(({ label, onPress, isAction, isConfirm, COLORS, isGlass }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.86,
            useNativeDriver: Platform.OS !== 'web',
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
            friction: 5,
            tension: 140,
        }).start();
    };

    const keyColor = isConfirm
        ? COLORS.neonCyan
        : isAction ? COLORS.hotPink : COLORS.white;

    const keyBg = isConfirm
        ? (isGlass ? 'rgba(0,194,255,0.15)' : 'rgba(0,248,255,0.12)')
        : isAction
            ? (isGlass ? 'rgba(255,45,85,0.12)' : 'rgba(255,62,164,0.10)')
            : 'transparent';

    const borderColor = isConfirm
        ? COLORS.neonCyan
        : isAction ? COLORS.hotPink : COLORS.borderDefault;

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            accessibilityLabel={label === 'DEL' ? 'Delete digit' : label === 'OK' ? 'Confirm secret' : `Digit ${label}`}
            accessibilityRole="button"
        >
            <Animated.View
                style={[
                    keyStyles.key,
                    {
                        backgroundColor: keyBg,
                        borderColor,
                        transform: [{ scale: pressAnim }],
                    },
                    isConfirm && !isGlass && SHADOWS.neonGlow,
                ]}
            >
                {label === 'DEL' ? (
                    <Ionicons name="backspace-outline" size={22} color={keyColor} />
                ) : (
                    <NeonText
                        variant={isConfirm ? 'arcade' : 'regular'}
                        weight={isAction ? 'bold' : 'regular'}
                        size={isAction ? 14 : 22}
                        color={keyColor}
                        glow={isConfirm}
                    >
                        {label}
                    </NeonText>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
});

// ── WaitingView ───────────────────────────────────────────────────────────────
// Shown to the non-setter player. Neon orbit ring + blinking text + dots.

const WaitingView = ({ style }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getWaitingStyles(COLORS), [COLORS]);

    const glowAnim  = useRef(new Animated.Value(0.4)).current;
    const orbitAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Breathing glow on the ring border
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.4,
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        );

        // Slow continuous orbit spin
        const orbit = Animated.loop(
            Animated.timing(orbitAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: Platform.OS !== 'web',
            })
        );

        // Subtitle text slow blink
        const blink = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, {
                    toValue: 0.25,
                    duration: 850,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 850,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        );

        glow.start();
        orbit.start();
        blink.start();

        return () => { glow.stop(); orbit.stop(); blink.stop(); };
    }, []);

    const orbitRotate = orbitAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.root, style]}>
            <GlassView
                variant="default"
                style={[styles.card, { borderColor: COLORS.electricPurple }]}
            >
                {/* ── Neon orbit ring ──────────────────────────────────────── */}
                <View style={styles.orbitWrapper}>
                    {/* Static pulsing base ring */}
                    <Animated.View
                        style={[
                            styles.ring,
                            {
                                borderColor: COLORS.electricPurple,
                                opacity: glowAnim,
                                ...Platform.select({
                                    ios: {
                                        shadowColor: COLORS.electricPurple,
                                        shadowOpacity: 0.95,
                                        shadowRadius: 18,
                                        shadowOffset: { width: 0, height: 0 },
                                    },
                                    android: { elevation: 8 },
                                    web: { boxShadow: `0 0 22px ${COLORS.electricPurple}` },
                                }),
                            },
                        ]}
                    />

                    {/* Orbiting accent dot */}
                    <Animated.View
                        style={[styles.orbitContainer, { transform: [{ rotate: orbitRotate }] }]}
                        pointerEvents="none"
                    >
                        <View
                            style={[
                                styles.orbitDot,
                                { backgroundColor: COLORS.neonCyan },
                                Platform.OS === 'ios' && {
                                    shadowColor: COLORS.neonCyan,
                                    shadowOpacity: 1,
                                    shadowRadius: 8,
                                    shadowOffset: { width: 0, height: 0 },
                                },
                            ]}
                        />
                    </Animated.View>

                    {/* Lock icon centred in the ring */}
                    <View style={styles.iconWrapper} pointerEvents="none">
                        <Ionicons name="lock-closed" size={34} color={COLORS.electricPurple} />
                    </View>
                </View>

                {/* ── Status text ──────────────────────────────────────────── */}
                <NeonText variant="display" size={17} color={COLORS.white} style={styles.titleLine}>
                    Opponent is setting
                </NeonText>
                <NeonText variant="display" size={17} color={COLORS.neonCyan} glow style={styles.titleLine}>
                    the secret number…
                </NeonText>

                <Animated.View style={{ opacity: blinkAnim }}>
                    <NeonText size={12} color={COLORS.textMuted} style={styles.subtitle}>
                        Get ready to guess!
                    </NeonText>
                </Animated.View>

                {/* ── Bouncing dots indicator ──────────────────────────────── */}
                <PulsingDots color={COLORS.electricPurple} />
            </GlassView>
        </View>
    );
};

// ── PulsingDots ───────────────────────────────────────────────────────────────
// Three staggered neon dots bouncing vertically.

const PulsingDots = React.memo(({ color }) => {
    // Initialise all three Animated.Values inside a single stable ref
    const dotsRef = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);
    const dots = dotsRef.current;

    useEffect(() => {
        const animations = dots.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 170),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 340,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 340,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.delay((dots.length - i - 1) * 170),
                ])
            )
        );
        animations.forEach(a => a.start());
        return () => animations.forEach(a => a.stop());
    }, []);

    return (
        <View style={dotStyles.row}>
            {dots.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        dotStyles.dot,
                        {
                            backgroundColor: color,
                            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 1] }),
                            transform: [{
                                translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }),
                            }],
                        },
                    ]}
                />
            ))}
        </View>
    );
});

// ── StyleSheets ──────────────────────────────────────────────────────────────

const getSetterStyles = (COLORS) => StyleSheet.create({
    root: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    headerText: {
        textAlign: 'center',
        marginBottom: 4,
    },
    rangeLabel: {
        textAlign: 'center',
        marginBottom: 20,
    },
    displayWrapper: {
        width: '100%',
        marginBottom: 8,
    },
    displayCard: {
        borderRadius: 20,
        borderWidth: 2,
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 82,
    },
    maskedText: {
        letterSpacing: 14,
        textAlign: 'center',
    },
    placeholder: {
        textAlign: 'center',
    },
    validationMsg: {
        textAlign: 'center',
        marginBottom: 8,
    },
    numpadPanel: {
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 12,
        width: '100%',
        marginTop: 4,
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    privacyNote: {
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.65,
    },
});

const getWaitingStyles = (COLORS) => StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        borderRadius: 28,
        borderWidth: 1.5,
        padding: 36,
        alignItems: 'center',
        width: '100%',
    },
    orbitWrapper: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    ring: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2.5,
    },
    orbitContainer: {
        position: 'absolute',
        width: 96,
        height: 96,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    orbitDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: -6,  // Sit exactly on the ring perimeter
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleLine: {
        textAlign: 'center',
        marginBottom: 2,
    },
    subtitle: {
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
});

const keyStyles = StyleSheet.create({
    key: {
        width: 80,
        height: 64,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
});

const dotStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },
});

export default React.memo(SecretInputView);
