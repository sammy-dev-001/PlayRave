import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, Modal, TouchableOpacity,
    Animated, Easing, Platform, ScrollView, TextInput
} from 'react-native';
import NeonText from './NeonText';
import GlassView from './GlassView';
import GameIcon from './GameIcon';
import { useTheme } from '../context/ThemeContext';
import SoundService from '../services/SoundService';
import HapticService from '../services/HapticService';

const MODES = {
    SOLO: 'SOLO',
    SERIES: 'SERIES',
    DUEL: 'DUEL',
    DECISION: 'DECISION',
};

const DECISION_PRESETS = [
    {
        id: 'food',
        label: '🍕 vs 🍔',
        headsEmoji: '🍕',
        headsLabel: 'PIZZA',
        tailsEmoji: '🍔',
        tailsLabel: 'BURGER',
        description: 'Pizza vs Burger',
    },
    {
        id: 'shot',
        label: '🥃 vs 🛡️',
        headsEmoji: '🥃',
        headsLabel: 'SHOT',
        tailsEmoji: '🛡️',
        tailsLabel: 'PASS',
        description: 'Take a Shot vs Pass Safe',
    },
    {
        id: 'truth',
        label: '😈 vs 💥',
        headsEmoji: '😈',
        headsLabel: 'TRUTH',
        tailsEmoji: '💥',
        tailsLabel: 'DARE',
        description: 'Truth vs Dare',
    },
    {
        id: 'pay',
        label: '💳 vs 💸',
        headsEmoji: '💳',
        headsLabel: 'I PAY',
        tailsEmoji: '💸',
        tailsLabel: 'YOU PAY',
        description: 'I Pay vs You Pay',
    },
    {
        id: 'night',
        label: '🌙 vs 🛋️',
        headsEmoji: '🌙',
        headsLabel: 'GO OUT',
        tailsEmoji: '🛋️',
        tailsLabel: 'STAY IN',
        description: 'Go Out vs Stay In',
    },
    {
        id: 'vibe',
        label: '🎬 vs 🎮',
        headsEmoji: '🎬',
        headsLabel: 'MOVIE',
        tailsEmoji: '🎮',
        tailsLabel: 'GAMES',
        description: 'Movie Night vs Game Night',
    },
];

const DUEL_STAKES = [
    '🍻 Buys the next round',
    '😈 Takes the next Dare',
    '🎲 Goes first in the game',
    '🧼 Does the dishes / cleanup',
    '🍕 Picks what we eat',
    '💸 Pays for the ride',
];

const PARTICLE_COUNT = 12;

const CoinFlipModal = ({ visible, onClose }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Active Game Mode
    const [mode, setMode] = useState(MODES.SOLO);

    // Coin & Flip State
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState(null); // 'HEADS' | 'TAILS' | null
    const [displayedFace, setDisplayedFace] = useState('HEADS');
    const [alternatingFace, setAlternatingFace] = useState('HEADS');
    const [announcement, setAnnouncement] = useState('Tap coin or button to flip');

    // Stats & History
    const [stats, setStats] = useState({ heads: 0, tails: 0, total: 0 });
    const [history, setHistory] = useState([]); // Array of 'HEADS' | 'TAILS'

    // SOLO Mode (Call It & Streaks)
    const [calledFace, setCalledFace] = useState(null); // 'HEADS' | 'TAILS' | null
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // SERIES Mode (Best of 3 / 5)
    const [seriesLength, setSeriesLength] = useState(3);
    const [seriesScore, setSeriesScore] = useState({ heads: 0, tails: 0 });

    // DUEL Mode (2 Players)
    const [duelPlayers, setDuelPlayers] = useState({ p1: 'Player 1', p2: 'Player 2' });
    const [duelScore, setDuelScore] = useState({ p1: 0, p2: 0 });
    const [selectedStake, setSelectedStake] = useState(DUEL_STAKES[0]);
    const [showCustomStake, setShowCustomStake] = useState(false);
    const [customStakeInput, setCustomStakeInput] = useState('');

    // DECISION Mode
    const [decisionIndex, setDecisionIndex] = useState(0);
    const [isCustomDecision, setIsCustomDecision] = useState(false);
    const [customDecision, setCustomDecision] = useState({ heads: 'Option A', tails: 'Option B' });

    // Animation Refs
    const flipAnim = useRef(new Animated.Value(0)).current;
    const heightAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shadowScale = useRef(new Animated.Value(1)).current;
    const toggleIntervalRef = useRef(null);

    // Particles system
    const particleAnims = useRef(
        Array.from({ length: PARTICLE_COUNT }, () => ({
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
        }))
    ).current;

    // Series targets
    const targetWins = Math.ceil(seriesLength / 2);
    const seriesWinner = seriesScore.heads >= targetWins ? 'HEADS' : seriesScore.tails >= targetWins ? 'TAILS' : null;

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (toggleIntervalRef.current) clearInterval(toggleIntervalRef.current);
        };
    }, []);

    // Particle burst trigger
    const triggerParticles = () => {
        particleAnims.forEach((p, i) => {
            const angle = (i / PARTICLE_COUNT) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
            const distance = 70 + Math.random() * 45;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            p.x.setValue(0);
            p.y.setValue(0);
            p.scale.setValue(1);
            p.opacity.setValue(1);

            Animated.parallel([
                Animated.timing(p.x, {
                    toValue: targetX,
                    duration: 650,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(p.y, {
                    toValue: targetY,
                    duration: 650,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(p.scale, {
                    toValue: 0.1,
                    duration: 650,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(p.opacity, {
                    toValue: 0,
                    duration: 650,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]).start();
        });
    };

    // Mode Switch Handler
    const handleSwitchMode = (newMode) => {
        if (isFlipping) return;
        SoundService.playButtonClick();
        HapticService.selection();
        setMode(newMode);
        setResult(null);
        setAnnouncement('Tap coin or button to flip');
    };

    // Flip Handler
    const handleFlip = () => {
        if (isFlipping) return;
        if (mode === MODES.SERIES && seriesWinner) {
            handleResetSeries();
            return;
        }

        SoundService.playButtonClick();
        HapticService.impact('medium');

        setIsFlipping(true);
        setResult(null);
        setAnnouncement('🌀 Flipping in mid-air...');

        // Random outcome
        const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

        // Choose number of half-flips so alternating sequence ends exactly on outcome
        const current = displayedFace;
        const halfFlips = (current === outcome) ? 16 : 17;

        const duration = 1600;
        const tickStep = Math.round(duration / halfFlips);

        flipAnim.setValue(0);
        heightAnim.setValue(0);
        scaleAnim.setValue(1);
        shadowScale.setValue(1);

        let currFace = current;
        if (toggleIntervalRef.current) clearInterval(toggleIntervalRef.current);
        toggleIntervalRef.current = setInterval(() => {
            currFace = currFace === 'HEADS' ? 'TAILS' : 'HEADS';
            setAlternatingFace(currFace);
            SoundService.playTick();
            HapticService.selection();
        }, tickStep);

        // 3D Arc & Tumble Physics
        Animated.parallel([
            // Tumble compression
            Animated.timing(flipAnim, {
                toValue: halfFlips,
                duration: duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
            }),
            // Height trajectory (launch -> apex -> bounce landing)
            Animated.sequence([
                Animated.timing(heightAnim, {
                    toValue: -115,
                    duration: duration * 0.45,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(heightAnim, {
                    toValue: 0,
                    duration: duration * 0.55,
                    easing: Easing.in(Easing.bounce),
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]),
            // Scale trajectory (expands closer to viewer in air, squishes on landing)
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.15,
                    duration: duration * 0.45,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: duration * 0.48,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1.0,
                    friction: 4,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]),
            // Ground shadow dynamic scaling
            Animated.sequence([
                Animated.timing(shadowScale, {
                    toValue: 0.45,
                    duration: duration * 0.45,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(shadowScale, {
                    toValue: 1.15,
                    duration: duration * 0.50,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.spring(shadowScale, {
                    toValue: 1.0,
                    friction: 5,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]),
        ]).start(() => {
            if (toggleIntervalRef.current) clearInterval(toggleIntervalRef.current);
            setIsFlipping(false);
            setResult(outcome);
            setDisplayedFace(outcome);
            setAlternatingFace(outcome);

            // Ground impact haptic
            HapticService.impact('heavy');

            // Update stats & history
            setStats((prev) => ({
                heads: outcome === 'HEADS' ? prev.heads + 1 : prev.heads,
                tails: outcome === 'TAILS' ? prev.tails + 1 : prev.tails,
                total: prev.total + 1,
            }));
            setHistory((prev) => [outcome, ...prev].slice(0, 8));

            // Mode-specific outcome resolution
            if (mode === MODES.SOLO) {
                if (calledFace) {
                    if (calledFace === outcome) {
                        const newStreak = streak + 1;
                        setStreak(newStreak);
                        if (newStreak > bestStreak) setBestStreak(newStreak);
                        setAnnouncement(`🔥 BINGO! STREAK: ${newStreak}!`);
                        SoundService.playCorrect();
                        HapticService.celebration();
                        triggerParticles();
                    } else {
                        setStreak(0);
                        setAnnouncement(`❌ MISSED CALL! Streak reset.`);
                        SoundService.playWrong();
                    }
                } else {
                    setAnnouncement(outcome === 'HEADS' ? '👑 HEADS WINS!' : '⭐ TAILS WINS!');
                    SoundService.playWinner();
                    triggerParticles();
                }
            } else if (mode === MODES.SERIES) {
                setSeriesScore((prev) => {
                    const newH = outcome === 'HEADS' ? prev.heads + 1 : prev.heads;
                    const newT = outcome === 'TAILS' ? prev.tails + 1 : prev.tails;

                    if (newH >= targetWins || newT >= targetWins) {
                        const winnerName = newH >= targetWins ? 'HEADS' : 'TAILS';
                        setAnnouncement(`🏆 ${winnerName} WINS THE SERIES (${newH} - ${newT})!`);
                        SoundService.playWinner();
                        HapticService.celebration();
                        triggerParticles();
                    } else {
                        setAnnouncement(`${outcome === 'HEADS' ? '👑 Round to HEADS' : '⭐ Round to TAILS'} (${newH} - ${newT})`);
                        SoundService.playCorrect();
                    }
                    return { heads: newH, tails: newT };
                });
            } else if (mode === MODES.DUEL) {
                if (outcome === 'HEADS') {
                    setDuelScore((prev) => ({ ...prev, p1: prev.p1 + 1 }));
                    setAnnouncement(`👑 ${duelPlayers.p1} WINS! ${selectedStake}`);
                } else {
                    setDuelScore((prev) => ({ ...prev, p2: prev.p2 + 1 }));
                    setAnnouncement(`⭐ ${duelPlayers.p2} WINS! ${selectedStake}`);
                }
                SoundService.playWinner();
                HapticService.celebration();
                triggerParticles();
            } else if (mode === MODES.DECISION) {
                let choiceText = '';
                if (isCustomDecision) {
                    choiceText = outcome === 'HEADS' ? customDecision.heads : customDecision.tails;
                } else {
                    const preset = DECISION_PRESETS[decisionIndex];
                    choiceText = outcome === 'HEADS' ? `${preset.headsEmoji} ${preset.headsLabel}` : `${preset.tailsEmoji} ${preset.tailsLabel}`;
                }
                setAnnouncement(`✨ DECISION: ${choiceText}!`);
                SoundService.playWinner();
                HapticService.celebration();
                triggerParticles();
            }
        });
    };

    // Resets
    const handleResetStats = () => {
        SoundService.playButtonClick();
        HapticService.buttonTap();
        if (toggleIntervalRef.current) clearInterval(toggleIntervalRef.current);
        setStats({ heads: 0, tails: 0, total: 0 });
        setHistory([]);
        setStreak(0);
        setResult(null);
        setAnnouncement('Tap coin or button to flip');
    };

    const handleResetSeries = () => {
        SoundService.playButtonClick();
        HapticService.buttonTap();
        setSeriesScore({ heads: 0, tails: 0 });
        setResult(null);
        setAnnouncement(`Best of ${seriesLength}: First to ${targetWins} wins!`);
    };

    const handleResetDuel = () => {
        SoundService.playButtonClick();
        HapticService.buttonTap();
        setDuelScore({ p1: 0, p2: 0 });
        setResult(null);
        setAnnouncement('Tap coin or button to flip');
    };

    // Smooth top-to-bottom edge-on compression:
    // Scale is 1.0 at integers, 0.06 at half-integers.
    const inputRange = [];
    const outputRange = [];
    for (let i = 0; i <= 36; i++) {
        inputRange.push(i * 0.5);
        outputRange.push(i % 2 === 0 ? 1 : 0.06);
    }

    const scaleY = flipAnim.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
    });

    const activeFace = isFlipping ? alternatingFace : (result || displayedFace);
    const isTails = activeFace === 'TAILS';

    // Face content based on active mode
    const getFaceContent = (face) => {
        if (mode === MODES.DECISION) {
            if (isCustomDecision) {
                return face === 'HEADS'
                    ? { emoji: '🅰️', label: customDecision.heads.toUpperCase().slice(0, 11) }
                    : { emoji: '🅱️', label: customDecision.tails.toUpperCase().slice(0, 11) };
            }
            const preset = DECISION_PRESETS[decisionIndex];
            return face === 'HEADS'
                ? { emoji: preset.headsEmoji, label: preset.headsLabel }
                : { emoji: preset.tailsEmoji, label: preset.tailsLabel };
        }
        if (mode === MODES.DUEL) {
            return face === 'HEADS'
                ? { emoji: '👑', label: duelPlayers.p1.toUpperCase().slice(0, 11) }
                : { emoji: '⭐', label: duelPlayers.p2.toUpperCase().slice(0, 11) };
        }
        return face === 'HEADS'
            ? { emoji: '👑', label: 'HEADS' }
            : { emoji: '⭐', label: 'TAILS' };
    };

    const activeFaceContent = getFaceContent(activeFace);

    // Stats calculations
    const headsPercent = stats.total > 0 ? Math.round((stats.heads / stats.total) * 100) : 50;
    const tailsPercent = stats.total > 0 ? 100 - headsPercent : 50;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <GlassView style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <GameIcon gameId="coin-flip" size={38} style={styles.headerIcon} />
                            <View>
                                <NeonText size={17} weight="bold" color={COLORS.neonYellow || '#FFD700'} glow>
                                    COIN FLIP
                                </NeonText>
                                <NeonText size={10} color="#6B7280" style={styles.headerSub}>
                                    3D TIEBREAKER & PARTY BETS
                                </NeonText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => {
                                SoundService.playButtonClick();
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <NeonText size={18} color="#9CA3AF">✕</NeonText>
                        </TouchableOpacity>
                    </View>

                    {/* Mode Navigation Tabs */}
                    <View style={styles.tabContainer}>
                        {[
                            { key: MODES.SOLO, label: 'CLASSIC' },
                            { key: MODES.SERIES, label: 'SERIES' },
                            { key: MODES.DUEL, label: 'DUEL' },
                            { key: MODES.DECISION, label: 'DECISION' },
                        ].map((tab) => {
                            const isActive = mode === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                    onPress={() => handleSwitchMode(tab.key)}
                                    activeOpacity={0.8}
                                >
                                    <NeonText
                                        size={11}
                                        weight="bold"
                                        color={isActive ? COLORS.deepNightBlack : '#9CA3AF'}
                                    >
                                        {tab.label}
                                    </NeonText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* SOLO MODE: Call It & Streaks */}
                        {mode === MODES.SOLO && (
                            <View style={styles.modeSection}>
                                <View style={styles.callRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.callBtn,
                                            calledFace === 'HEADS' && styles.callBtnActiveHeads,
                                        ]}
                                        onPress={() => {
                                            SoundService.playButtonClick();
                                            HapticService.selection();
                                            setCalledFace(calledFace === 'HEADS' ? null : 'HEADS');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <NeonText size={12} weight="bold" color={calledFace === 'HEADS' ? '#000' : (COLORS.neonYellow || '#FFD700')}>
                                            👑 CALL HEADS
                                        </NeonText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.callBtn,
                                            calledFace === 'TAILS' && styles.callBtnActiveTails,
                                        ]}
                                        onPress={() => {
                                            SoundService.playButtonClick();
                                            HapticService.selection();
                                            setCalledFace(calledFace === 'TAILS' ? null : 'TAILS');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <NeonText size={12} weight="bold" color={calledFace === 'TAILS' ? '#000' : COLORS.neonCyan}>
                                            ⭐ CALL TAILS
                                        </NeonText>
                                    </TouchableOpacity>
                                </View>

                                {calledFace && (
                                    <View style={styles.streakBadge}>
                                        <NeonText size={11} weight="bold" color="#F59E0B">
                                            🔥 STREAK: {streak}
                                        </NeonText>
                                        <NeonText size={11} color="#6B7280" style={{ marginHorizontal: 8 }}>|</NeonText>
                                        <NeonText size={11} color="#9CA3AF">
                                            🏆 BEST: {bestStreak}
                                        </NeonText>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* SERIES MODE: Best of 3 / 5 Pip Indicator */}
                        {mode === MODES.SERIES && (
                            <View style={styles.modeSection}>
                                <View style={styles.seriesSelectorRow}>
                                    <TouchableOpacity
                                        style={[styles.seriesLenBtn, seriesLength === 3 && styles.seriesLenBtnActive]}
                                        onPress={() => {
                                            setSeriesLength(3);
                                            handleResetSeries();
                                        }}
                                    >
                                        <NeonText size={11} weight="bold" color={seriesLength === 3 ? '#000' : '#9CA3AF'}>
                                            BEST OF 3
                                        </NeonText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.seriesLenBtn, seriesLength === 5 && styles.seriesLenBtnActive]}
                                        onPress={() => {
                                            setSeriesLength(5);
                                            handleResetSeries();
                                        }}
                                    >
                                        <NeonText size={11} weight="bold" color={seriesLength === 5 ? '#000' : '#9CA3AF'}>
                                            BEST OF 5
                                        </NeonText>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.seriesTrackerRow}>
                                    {/* Heads pips */}
                                    <View style={styles.pipsContainer}>
                                        <NeonText size={11} weight="bold" color={COLORS.neonYellow || '#FFD700'}>
                                            👑 HEADS ({seriesScore.heads}/{targetWins})
                                        </NeonText>
                                        <View style={styles.pipsList}>
                                            {Array.from({ length: targetWins }).map((_, i) => (
                                                <View
                                                    key={`h-${i}`}
                                                    style={[
                                                        styles.pip,
                                                        i < seriesScore.heads && styles.pipFilledHeads,
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    </View>

                                    <NeonText size={14} weight="bold" color="#6B7280" style={{ marginHorizontal: 12 }}>
                                        VS
                                    </NeonText>

                                    {/* Tails pips */}
                                    <View style={styles.pipsContainer}>
                                        <NeonText size={11} weight="bold" color={COLORS.neonCyan}>
                                            ⭐ TAILS ({seriesScore.tails}/{targetWins})
                                        </NeonText>
                                        <View style={styles.pipsList}>
                                            {Array.from({ length: targetWins }).map((_, i) => (
                                                <View
                                                    key={`t-${i}`}
                                                    style={[
                                                        styles.pip,
                                                        i < seriesScore.tails && styles.pipFilledTails,
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* DUEL MODE: 2 Players & Stakes */}
                        {mode === MODES.DUEL && (
                            <View style={styles.modeSection}>
                                <View style={styles.duelPlayersRow}>
                                    <View style={styles.duelPlayerBox}>
                                        <NeonText size={10} color={COLORS.neonYellow || '#FFD700'}>👑 HEADS</NeonText>
                                        <NeonText size={13} weight="bold" color={COLORS.white} numberOfLines={1}>
                                            {duelPlayers.p1}
                                        </NeonText>
                                        <NeonText size={16} weight="bold" color={COLORS.neonYellow || '#FFD700'}>
                                            {duelScore.p1}
                                        </NeonText>
                                    </View>

                                    <NeonText size={13} weight="bold" color="#6B7280">VS</NeonText>

                                    <View style={styles.duelPlayerBox}>
                                        <NeonText size={10} color={COLORS.neonCyan}>⭐ TAILS</NeonText>
                                        <NeonText size={13} weight="bold" color={COLORS.white} numberOfLines={1}>
                                            {duelPlayers.p2}
                                        </NeonText>
                                        <NeonText size={16} weight="bold" color={COLORS.neonCyan}>
                                            {duelScore.p2}
                                        </NeonText>
                                    </View>
                                </View>

                                <View style={styles.stakesBanner}>
                                    <NeonText size={11} color="#9CA3AF" style={{ marginBottom: 4 }}>
                                        STAKES:
                                    </NeonText>
                                    <NeonText size={12} weight="bold" color={COLORS.white} numberOfLines={1}>
                                        {selectedStake}
                                    </NeonText>
                                </View>

                                {/* Stake Quick Selector */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                    {DUEL_STAKES.map((stake, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.stakeChip, selectedStake === stake && styles.stakeChipActive]}
                                            onPress={() => {
                                                SoundService.playButtonClick();
                                                setSelectedStake(stake);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <NeonText size={10} color={selectedStake === stake ? '#000' : '#D1D5DB'}>
                                                {stake}
                                            </NeonText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* DECISION MODE: Dilemma Presets */}
                        {mode === MODES.DECISION && (
                            <View style={styles.modeSection}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                    {DECISION_PRESETS.map((preset, idx) => (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={[
                                                styles.decisionChip,
                                                !isCustomDecision && decisionIndex === idx && styles.decisionChipActive,
                                            ]}
                                            onPress={() => {
                                                SoundService.playButtonClick();
                                                setIsCustomDecision(false);
                                                setDecisionIndex(idx);
                                                setResult(null);
                                                setAnnouncement(`Decide: ${preset.description}`);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <NeonText
                                                size={11}
                                                weight="bold"
                                                color={!isCustomDecision && decisionIndex === idx ? '#000' : '#D1D5DB'}
                                            >
                                                {preset.label}
                                            </NeonText>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.decisionChip, isCustomDecision && styles.decisionChipActive]}
                                        onPress={() => {
                                            SoundService.playButtonClick();
                                            setIsCustomDecision(true);
                                            setResult(null);
                                            setAnnouncement('Enter choices & flip to decide!');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <NeonText
                                            size={11}
                                            weight="bold"
                                            color={isCustomDecision ? '#000' : '#D1D5DB'}
                                        >
                                            ✏️ CUSTOM
                                        </NeonText>
                                    </TouchableOpacity>
                                </ScrollView>

                                {isCustomDecision && (
                                    <View style={styles.customDecisionRow}>
                                        <TextInput
                                            style={[styles.customInput, { borderColor: COLORS.neonYellow || '#FFD700' }]}
                                            value={customDecision.heads}
                                            onChangeText={(t) => setCustomDecision((prev) => ({ ...prev, heads: t }))}
                                            placeholder="👑 Option A"
                                            placeholderTextColor="#6B7280"
                                            maxLength={16}
                                        />
                                        <NeonText size={11} color="#6B7280" style={{ marginHorizontal: 6 }}>vs</NeonText>
                                        <TextInput
                                            style={[styles.customInput, { borderColor: COLORS.neonCyan }]}
                                            value={customDecision.tails}
                                            onChangeText={(t) => setCustomDecision((prev) => ({ ...prev, tails: t }))}
                                            placeholder="⭐ Option B"
                                            placeholderTextColor="#6B7280"
                                            maxLength={16}
                                        />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* 3D Interactive Coin Arena */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleFlip}
                            disabled={isFlipping}
                            style={styles.coinArena}
                        >
                            {/* Dynamic Ground Shadow */}
                            <Animated.View
                                style={[
                                    styles.coinShadow,
                                    {
                                        backgroundColor: isTails ? `${COLORS.neonCyan}45` : 'rgba(255, 215, 0, 0.40)',
                                        transform: [{ scale: shadowScale }],
                                    },
                                ]}
                            />

                            {/* Particle Explosion on Win */}
                            <View style={styles.particlesContainer} pointerEvents="none">
                                {particleAnims.map((p, idx) => (
                                    <Animated.View
                                        key={idx}
                                        style={[
                                            styles.particle,
                                            {
                                                backgroundColor: isTails ? COLORS.neonCyan : (COLORS.neonYellow || '#FFD700'),
                                                transform: [
                                                    { translateX: p.x },
                                                    { translateY: p.y },
                                                    { scale: p.scale },
                                                ],
                                                opacity: p.opacity,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>

                            {/* Animated Coin */}
                            <Animated.View
                                style={[
                                    styles.coinWrapper,
                                    {
                                        transform: [
                                            { perspective: 1000 },
                                            { translateY: heightAnim },
                                            { scale: scaleAnim },
                                            { scaleY: scaleY },
                                        ],
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.coin,
                                        isTails ? styles.coinTails : styles.coinHeads,
                                    ]}
                                >
                                    <View style={styles.coinBevel}>
                                        <View style={styles.coinInnerRing}>
                                            <NeonText size={42} weight="bold">
                                                {activeFaceContent.emoji}
                                            </NeonText>
                                            <NeonText
                                                size={12}
                                                weight="bold"
                                                color={isTails ? COLORS.neonCyan : (COLORS.neonYellow || '#FFD700')}
                                                glow
                                                numberOfLines={1}
                                                style={styles.coinLabel}
                                            >
                                                {activeFaceContent.label}
                                            </NeonText>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Result & Feedback Announcement */}
                        <View style={styles.resultContainer}>
                            <NeonText
                                size={15}
                                weight="bold"
                                color={
                                    result === 'HEADS'
                                        ? (COLORS.neonYellow || '#FFD700')
                                        : result === 'TAILS'
                                        ? COLORS.neonCyan
                                        : '#E5E7EB'
                                }
                                glow={!!result}
                                numberOfLines={2}
                                style={styles.announcementText}
                            >
                                {announcement}
                            </NeonText>
                        </View>

                        {/* Primary Action Button */}
                        <TouchableOpacity
                            style={[
                                styles.flipBtn,
                                isFlipping && styles.flipBtnDisabled,
                                mode === MODES.SERIES && seriesWinner && styles.flipBtnWinner,
                            ]}
                            onPress={handleFlip}
                            disabled={isFlipping}
                            activeOpacity={0.85}
                        >
                            <NeonText size={15} weight="bold" color={COLORS.deepNightBlack}>
                                {isFlipping
                                    ? '🌀 FLIPPING IN AIR...'
                                    : mode === MODES.SERIES && seriesWinner
                                    ? '🏆 START NEW SERIES'
                                    : '🎲 FLIP COIN'}
                            </NeonText>
                        </TouchableOpacity>

                        {/* Flip History Trail */}
                        {history.length > 0 && (
                            <View style={styles.historyContainer}>
                                <NeonText size={10} color="#6B7280" style={{ marginRight: 8 }}>
                                    RECENT:
                                </NeonText>
                                <View style={styles.historyRow}>
                                    {history.map((face, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.historyDot,
                                                face === 'HEADS' ? styles.historyDotHeads : styles.historyDotTails,
                                                idx === 0 && styles.historyDotNew,
                                            ]}
                                        >
                                            <NeonText size={9} weight="bold" color={face === 'HEADS' ? (COLORS.neonYellow || '#FFD700') : COLORS.neonCyan}>
                                                {face === 'HEADS' ? '👑' : '⭐'}
                                            </NeonText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Odds & Distribution Meter */}
                        {stats.total > 0 && (
                            <View style={styles.meterSection}>
                                <View style={styles.meterBarContainer}>
                                    <View style={[styles.meterSegmentHeads, { flex: Math.max(headsPercent, 5) }]} />
                                    <View style={[styles.meterSegmentTails, { flex: Math.max(tailsPercent, 5) }]} />
                                </View>
                                <View style={styles.meterLabels}>
                                    <NeonText size={9} color={COLORS.neonYellow || '#FFD700'}>
                                        👑 {headsPercent}%
                                    </NeonText>
                                    <NeonText size={9} color={COLORS.neonCyan}>
                                        ⭐ {tailsPercent}%
                                    </NeonText>
                                </View>
                            </View>
                        )}

                        {/* Stats Summary Footer */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <NeonText size={9} color="#6B7280">HEADS</NeonText>
                                <NeonText size={13} weight="bold" color={COLORS.neonYellow || '#FFD700'}>
                                    {stats.heads}
                                </NeonText>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <NeonText size={9} color="#6B7280">TAILS</NeonText>
                                <NeonText size={13} weight="bold" color={COLORS.neonCyan}>
                                    {stats.tails}
                                </NeonText>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <NeonText size={9} color="#6B7280">TOTAL</NeonText>
                                <NeonText size={13} weight="bold" color={COLORS.white}>
                                    {stats.total}
                                </NeonText>
                            </View>
                            {stats.total > 0 && (
                                <TouchableOpacity onPress={handleResetStats} style={styles.resetBtn} activeOpacity={0.7}>
                                    <NeonText size={9} weight="bold" color="#9CA3AF">RESET</NeonText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </GlassView>
            </View>
        </Modal>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '92%',
        backgroundColor: 'rgba(15, 23, 42, 0.97)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        paddingTop: 18,
        paddingBottom: 14,
        paddingHorizontal: 16,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        marginRight: 10,
    },
    headerSub: {
        letterSpacing: 1,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 18,
        padding: 3,
        marginBottom: 12,
        width: '100%',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
    },
    scrollArea: {
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 8,
    },
    modeSection: {
        width: '100%',
        marginBottom: 8,
        alignItems: 'center',
    },
    callRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 8,
    },
    callBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    callBtnActiveHeads: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
        borderColor: COLORS.neonYellow || '#FFD700',
    },
    callBtnActiveTails: {
        backgroundColor: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    seriesSelectorRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        padding: 3,
        marginBottom: 8,
    },
    seriesLenBtn: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 9,
    },
    seriesLenBtnActive: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
    },
    seriesTrackerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    pipsContainer: {
        alignItems: 'center',
    },
    pipsList: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 4,
    },
    pip: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#4B5563',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    pipFilledHeads: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
        borderColor: COLORS.neonYellow || '#FFD700',
    },
    pipFilledTails: {
        backgroundColor: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
    },
    duelPlayersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    duelPlayerBox: {
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    stakesBanner: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 6,
    },
    chipsScroll: {
        width: '100%',
        marginVertical: 4,
    },
    stakeChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    stakeChipActive: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
        borderColor: COLORS.neonYellow || '#FFD700',
    },
    decisionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    decisionChipActive: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
        borderColor: COLORS.neonYellow || '#FFD700',
    },
    customDecisionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 6,
    },
    customInput: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    coinArena: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 6,
        position: 'relative',
        width: '100%',
    },
    coinShadow: {
        position: 'absolute',
        bottom: 12,
        width: 110,
        height: 22,
        borderRadius: 11,
    },
    particlesContainer: {
        position: 'absolute',
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    coinWrapper: {
        width: 144,
        height: 144,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coin: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 18,
        elevation: 14,
    },
    coinHeads: {
        backgroundColor: '#1b1404',
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
    },
    coinTails: {
        backgroundColor: '#031720',
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
    },
    coinBevel: {
        width: 124,
        height: 124,
        borderRadius: 62,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.38)',
    },
    coinInnerRing: {
        width: 108,
        height: 108,
        borderRadius: 54,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinLabel: {
        letterSpacing: 2,
        marginTop: 4,
        textAlign: 'center',
    },
    resultContainer: {
        minHeight: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    announcementText: {
        textAlign: 'center',
    },
    flipBtn: {
        width: '100%',
        backgroundColor: COLORS.neonYellow || '#FFD700',
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 6,
    },
    flipBtnWinner: {
        backgroundColor: COLORS.neonGreen || '#00FF66',
        shadowColor: COLORS.neonGreen || '#00FF66',
    },
    flipBtnDisabled: {
        opacity: 0.6,
    },
    historyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    historyRow: {
        flexDirection: 'row',
        gap: 6,
    },
    historyDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
    },
    historyDotHeads: {
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    historyDotTails: {
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    historyDotNew: {
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    meterSection: {
        width: '100%',
        marginTop: 10,
    },
    meterBarContainer: {
        height: 6,
        borderRadius: 3,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    meterSegmentHeads: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
    },
    meterSegmentTails: {
        backgroundColor: COLORS.neonCyan,
    },
    meterLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 3,
        paddingHorizontal: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    resetBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
});

export default CoinFlipModal;
