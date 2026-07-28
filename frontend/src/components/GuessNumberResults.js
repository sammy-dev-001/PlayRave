// ============================================================================
// GuessNumberResults.js — GAME_OVER Phase UI
// ============================================================================
import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Platform,
    Easing,
} from 'react-native';
import GlassView from './GlassView';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import HapticService from '../services/HapticService';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../constants/themes';

/**
 * GuessNumberResults
 *
 * @param {{ gameState, targets, currentUserId, winner, message, onPlayAgain, onReturnToArcade, style }} props
 */
const GuessNumberResults = ({
    gameState,
    targets,
    currentUserId,
    winner,
    message,
    isBetweenRounds,
    roundScores,
    maxRounds,
    onPlayAgain,
    onReturnToArcade,
    style,
}) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const isGlass = theme?.isGlass;

    // Determine which target number to display
    let displayTarget = '???';
    if (targets) {
        if (winner && targets[winner.userId]) {
            displayTarget = targets[winner.userId];
        } else if (currentUserId && targets[currentUserId]) {
            displayTarget = targets[currentUserId];
        } else {
            // fallback
            const firstKey = Object.keys(targets)[0];
            if (firstKey) displayTarget = targets[firstKey];
        }
    }

    // ── Animations ────────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Play success haptic when results mount
        if (winner) {
            HapticService.success?.();
        } else {
            HapticService.error?.(); // E.g., everyone eliminated
        }

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous floating animation for the number
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -8,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winner]);

    if (!gameState || (gameState.gamePhase !== 'GAME_OVER' && gameState.gamePhase !== 'BETWEEN_ROUNDS')) return null;

    const hasWinner = !!winner;
    const revealText = hasWinner ? "The Secret Number they guessed was" : "The Secret Number you were trying to guess was";
    const winnerCount = winner?.guessCount || gameState.players?.find(p => p.userId === winner?.userId)?.guessCount || '?';

    return (
        <Animated.View style={[styles.root, style, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            
            {/* ── Header & Winner Announcement ─────────────────────────────── */}
            <View style={styles.headerContainer}>
                {isBetweenRounds ? (
                    <View style={styles.winnerWrapper}>
                        <NeonText variant="display" size={24} color={COLORS.electricPurple} glow style={styles.winnerText}>
                            {message}
                        </NeonText>
                        <NeonText size={16} color={COLORS.textMuted} style={styles.subtitle}>
                            {hasWinner ? `${winner.name} won that round!` : 'No one guessed it!'}
                        </NeonText>
                        {roundScores && (
                            <View style={styles.scorePill}>
                                <NeonText size={14} weight="bold" color={COLORS.neonCyan}>
                                    SCORE: {Object.values(roundScores).join(' - ')}
                                </NeonText>
                            </View>
                        )}
                    </View>
                ) : hasWinner ? (
                    <View style={styles.winnerWrapper}>
                        <NeonText variant="display" size={28} color={COLORS.accent} glow style={styles.winnerText}>
                            🎉 {winner.name} WINS! 🎉
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={styles.subtitle}>
                            Guessed the number in {winnerCount} tries!
                        </NeonText>
                    </View>
                ) : (
                    <View style={styles.winnerWrapper}>
                        <NeonText variant="display" size={24} color={COLORS.danger} glow style={styles.winnerText}>
                            GAME OVER
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={styles.subtitle}>
                            {message || 'No one guessed their number.'}
                        </NeonText>
                    </View>
                )}
            </View>

            {/* ── Secret Number Display ──────────────────────────────────── */}
            <Animated.View style={[styles.numberContainer, { transform: [{ translateY: floatAnim }] }]}>
                <GlassView
                    variant="primary"
                    style={[
                        styles.numberCard,
                        { borderColor: hasWinner ? COLORS.accent : COLORS.neonCyan },
                        !isGlass && (hasWinner ? SHADOWS.purpleGlow : SHADOWS.neonGlow)
                    ]}
                >
                    <NeonText size={16} color={COLORS.textMuted} style={styles.revealLabel}>
                        {revealText}
                    </NeonText>
                    
                    <View style={styles.numberWrapper}>
                        <NeonText
                            variant="arcade"
                            size={72}
                            color={hasWinner ? COLORS.accent : COLORS.neonCyan}
                            glow
                            style={styles.secretNumber}
                        >
                            {displayTarget}
                        </NeonText>
                    </View>
                </GlassView>
            </Animated.View>

            {/* ── Action Buttons (Hidden between rounds) ─────────────────── */}
            {!isBetweenRounds && (
                <View style={styles.actionsContainer}>
                    <NeonButton
                        title="PLAY AGAIN"
                        variant="primary"
                        color={COLORS.neonCyan}
                        size="large"
                        icon="refresh-outline"
                        onPress={onPlayAgain}
                        style={styles.actionBtn}
                    />
                    <NeonButton
                        title="RETURN TO ARCADE"
                        variant="ghost"
                        color={COLORS.textMuted}
                        size="medium"
                        icon="home-outline"
                        onPress={onReturnToArcade}
                        style={styles.actionBtn}
                    />
                </View>
            )}
        </Animated.View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    root: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    winnerWrapper: {
        alignItems: 'center',
    },
    winnerText: {
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        textAlign: 'center',
    },
    scorePill: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    numberContainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        marginVertical: 30,
    },
    numberCard: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 2,
    },
    revealLabel: {
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 2,
        opacity: 0.8,
    },
    numberWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    secretNumber: {
        textAlign: 'center',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    actionsContainer: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
        marginTop: 20,
    },
    actionBtn: {
        width: '100%',
    },
});

export default GuessNumberResults;
