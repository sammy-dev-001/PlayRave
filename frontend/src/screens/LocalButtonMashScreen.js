import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';

const HIGH_SCORE_KEY = '@playrave_local_button_mash_high_score';
const GAME_MODES = [
    { key: 'tug_of_war', title: 'Tug of War', icon: 'swap-horizontal', desc: 'Push the plasma beam to the enemy side!' },
    { key: 'speed_duel', title: '10s Speed Blitz', icon: 'flash', desc: '10 seconds. Highest taps wins!' },
    { key: 'target_100', title: 'First to 100', icon: 'trophy', desc: 'First player to reach 100 taps!' },
    { key: 'solo_drill', title: 'Solo CPS Test', icon: 'finger-print', desc: 'Measure your max clicks per second!' },
];

const LocalButtonMashScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Players passed from local party setup or defaults
    const incomingPlayers = route?.params?.players;
    const isSingle = route?.params?.isSinglePlayer || false;

    const player1Name = incomingPlayers?.[0]?.name || 'Player 1';
    const player2Name = incomingPlayers?.[1]?.name || 'Player 2';

    // State
    const [mode, setMode] = useState(isSingle ? 'solo_drill' : 'tug_of_war');
    const [phase, setPhase] = useState('menu'); // 'menu' | 'countdown' | 'playing' | 'gameover'
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(10);

    // Duel State
    const [p1Taps, setP1Taps] = useState(0);
    const [p2Taps, setP2Taps] = useState(0);
    // Tug of War: 0 (P2 wins) to 100 (P1 wins), starts at 50
    const [tugPosition, setTugPosition] = useState(50);

    // Solo State
    const [soloTaps, setSoloTaps] = useState(0);
    const [soloHighScore, setSoloHighScore] = useState(0);
    const [winner, setWinner] = useState(null); // 'p1' | 'p2' | 'tie'

    // Button Animations
    const p1Scale = useRef(new Animated.Value(1)).current;
    const p2Scale = useRef(new Animated.Value(1)).current;
    const soloScale = useRef(new Animated.Value(1)).current;
    const countdownScale = useRef(new Animated.Value(1)).current;

    // Load High Score on Mount
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(HIGH_SCORE_KEY);
                if (saved) setSoloHighScore(parseInt(saved, 10));
            } catch (e) {
                console.log('Error reading high score', e);
            }
        })();
    }, []);

    // Countdown Logic
    useEffect(() => {
        let timer = null;
        if (phase === 'countdown') {
            countdownScale.setValue(0.5);
            Animated.spring(countdownScale, {
                toValue: 1.2,
                friction: 3,
                useNativeDriver: Platform.OS !== 'web'
            }).start();

            SoundService.play('tick');
            HapticService.trigger('impactMedium');

            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setPhase('playing');
                        SoundService.play('game-start');
                        HapticService.trigger('notificationSuccess');
                        return 0;
                    }
                    SoundService.play('tick');
                    HapticService.trigger('impactMedium');
                    return prev - 1;
                });
            }, 900);
        }
        return () => clearInterval(timer);
    }, [phase]);

    // Timer Logic during playing
    useEffect(() => {
        let interval = null;
        if (phase === 'playing' && (mode === 'speed_duel' || mode === 'solo_drill' || mode === 'tug_of_war')) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [phase, mode, p1Taps, p2Taps, tugPosition]);

    const startGame = (selectedMode) => {
        const gameM = selectedMode || mode;
        setMode(gameM);
        setP1Taps(0);
        setP2Taps(0);
        setSoloTaps(0);
        setTugPosition(50);
        setTimeLeft(gameM === 'tug_of_war' ? 15 : 10);
        setCountdown(3);
        setWinner(null);
        setPhase('countdown');
    };

    const endGame = (forcedWinner = null) => {
        setPhase('gameover');
        SoundService.play('victory');
        HapticService.trigger('notificationSuccess');

        if (forcedWinner) {
            setWinner(forcedWinner);
            return;
        }

        if (mode === 'tug_of_war') {
            if (tugPosition > 50) setWinner('p1');
            else if (tugPosition < 50) setWinner('p2');
            else setWinner('tie');
        } else if (mode === 'speed_duel') {
            if (p1Taps > p2Taps) setWinner('p1');
            else if (p2Taps > p1Taps) setWinner('p2');
            else setWinner('tie');
        } else if (mode === 'solo_drill') {
            // Check high score
            if (soloTaps > soloHighScore) {
                setSoloHighScore(soloTaps);
                AsyncStorage.setItem(HIGH_SCORE_KEY, soloTaps.toString()).catch(() => {});
            }
        }
    };

    // --- TAP HANDLERS ---
    const handleP1Tap = () => {
        if (phase !== 'playing') return;
        HapticService.trigger('impactLight');
        SoundService.play('click');

        // Bounce animation
        p1Scale.setValue(0.92);
        Animated.spring(p1Scale, { toValue: 1, friction: 3, useNativeDriver: Platform.OS !== 'web' }).start();

        setP1Taps(prev => {
            const next = prev + 1;
            if (mode === 'target_100' && next >= 100) {
                endGame('p1');
            }
            return next;
        });

        if (mode === 'tug_of_war') {
            setTugPosition(prev => {
                const next = Math.min(100, prev + 2.5);
                if (next >= 100) endGame('p1');
                return next;
            });
        }
    };

    const handleP2Tap = () => {
        if (phase !== 'playing') return;
        HapticService.trigger('impactLight');
        SoundService.play('click');

        // Bounce animation
        p2Scale.setValue(0.92);
        Animated.spring(p2Scale, { toValue: 1, friction: 3, useNativeDriver: Platform.OS !== 'web' }).start();

        setP2Taps(prev => {
            const next = prev + 1;
            if (mode === 'target_100' && next >= 100) {
                endGame('p2');
            }
            return next;
        });

        if (mode === 'tug_of_war') {
            setTugPosition(prev => {
                const next = Math.max(0, prev - 2.5);
                if (next <= 0) endGame('p2');
                return next;
            });
        }
    };

    const handleSoloTap = () => {
        if (phase !== 'playing') return;
        HapticService.trigger('impactLight');
        SoundService.play('click');

        soloScale.setValue(0.94);
        Animated.spring(soloScale, { toValue: 1, friction: 3, useNativeDriver: Platform.OS !== 'web' }).start();

        setSoloTaps(prev => prev + 1);
    };

    const getSoloTier = (cps) => {
        if (cps >= 11) return { label: 'GODLIKE ⚡⚡', color: COLORS.hotPink };
        if (cps >= 9) return { label: 'CYBORG FINGERS 🤖', color: COLORS.electricPurple };
        if (cps >= 7) return { label: 'SPEED DEMON 🔥', color: COLORS.limeGlow };
        if (cps >= 5) return { label: 'FAST TAPPER ⚡', color: COLORS.neonCyan };
        return { label: 'WARMING UP 🐾', color: COLORS.textSecondary };
    };

    // ==========================================
    // RENDER: MENU
    // ==========================================
    if (phase === 'menu') {
        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.limeGlow} style={styles.titleText}>
                        BUTTON MASH
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.menuContent}>
                    <NeonText style={styles.menuSubtitle}>
                        Hyper-speed finger duels & reflex challenges!
                    </NeonText>

                    <View style={styles.modeCardsContainer}>
                        {GAME_MODES.map(m => {
                            const isSelected = mode === m.key;
                            return (
                                <TouchableOpacity
                                    key={m.key}
                                    style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                                    onPress={() => {
                                        setMode(m.key);
                                        HapticService.trigger('impactLight');
                                    }}
                                >
                                    <View style={styles.modeIconCircle}>
                                        <Ionicons name={m.icon} size={28} color={isSelected ? COLORS.neonCyan : COLORS.textMuted} />
                                    </View>
                                    <View style={styles.modeInfo}>
                                        <NeonText style={[styles.modeTitle, isSelected && { color: COLORS.neonCyan }]}>
                                            {m.title}
                                        </NeonText>
                                        <NeonText style={styles.modeDesc}>{m.desc}</NeonText>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={22} color={COLORS.neonCyan} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {mode === 'solo_drill' && soloHighScore > 0 && (
                        <View style={styles.highScoreCard}>
                            <Ionicons name="trophy" size={22} color="#FFD700" />
                            <NeonText style={styles.highScoreText}>
                                Personal Best: <NeonText style={{ color: '#FFD700', fontWeight: 'bold' }}>{soloHighScore} taps</NeonText> ({(soloHighScore / 10).toFixed(1)} CPS)
                            </NeonText>
                        </View>
                    )}

                    <View style={{ flex: 1 }} />
                    <NeonButton
                        title="BATTLE START!"
                        onPress={() => startGame(mode)}
                        color={COLORS.limeGlow}
                        glow={true}
                        style={styles.startButton}
                    />
                </View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: COUNTDOWN OVERLAY
    // ==========================================
    if (phase === 'countdown') {
        return (
            <NeonContainer style={[styles.container, styles.centerAll]}>
                <Animated.View style={{ transform: [{ scale: countdownScale }], alignItems: 'center' }}>
                    <NeonText glowColor={COLORS.limeGlow} style={styles.countdownNumber}>
                        {countdown}
                    </NeonText>
                    <NeonText style={styles.countdownPrompt}>GET READY TO MASH!</NeonText>
                </Animated.View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: PLAYING - SOLO MODE
    // ==========================================
    if (phase === 'playing' && mode === 'solo_drill') {
        const cps = soloTaps > 0 ? (soloTaps / (10 - timeLeft || 1)).toFixed(1) : '0.0';
        return (
            <NeonContainer style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setPhase('menu')} style={styles.iconButton}>
                        <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <NeonText glowColor={COLORS.neonCyan} style={styles.timerBadge}>
                        ⏱️ {timeLeft}s
                    </NeonText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.soloContainer}>
                    <View style={styles.soloStatsRow}>
                        <View style={styles.statBox}>
                            <NeonText style={styles.statLabel}>TAPS</NeonText>
                            <NeonText glowColor={COLORS.neonCyan} style={styles.statValue}>{soloTaps}</NeonText>
                        </View>
                        <View style={styles.statBox}>
                            <NeonText style={styles.statLabel}>CPS</NeonText>
                            <NeonText glowColor={COLORS.limeGlow} style={styles.statValue}>{cps}</NeonText>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSoloTap}
                        style={styles.soloTapArea}
                    >
                        <Animated.View style={[styles.soloTapButton, { transform: [{ scale: soloScale }] }]}>
                            <Ionicons name="finger-print" size={72} color={COLORS.neonCyan} />
                            <NeonText glowColor={COLORS.neonCyan} style={styles.tapPromptText}>
                                TAP FAST!
                            </NeonText>
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </NeonContainer>
        );
    }

    // ==========================================
    // RENDER: PLAYING - 2-PLAYER SPLIT SCREEN
    // ==========================================
    if (phase === 'playing') {
        return (
            <View style={styles.duelContainer}>
                {/* PLAYER 2 ZONE (TOP, ROTATED 180 DEG) */}
                <View style={[styles.playerZone, styles.p2Zone]}>
                    <View style={styles.rotatedContent}>
                        <View style={styles.playerZoneHeader}>
                            <NeonText glowColor={COLORS.hotPink} style={styles.zonePlayerName}>{player2Name}</NeonText>
                            <NeonText style={styles.zoneScore}>
                                {mode === 'target_100' ? `${p2Taps}/100` : `${p2Taps} Taps`}
                            </NeonText>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleP2Tap}
                            style={styles.tapTargetArea}
                        >
                            <Animated.View style={[styles.giantTapButton, styles.p2Button, { transform: [{ scale: p2Scale }] }]}>
                                <NeonText glowColor={COLORS.hotPink} style={styles.giantTapText}>MASH!</NeonText>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CENTER DIVIDER / TUG OF WAR BAR */}
                <View style={styles.centerDivider}>
                    {mode === 'tug_of_war' ? (
                        <View style={styles.tugTrack}>
                            {/* P2 Side (Pink) */}
                            <View style={[styles.tugFillP2, { flex: 100 - tugPosition }]} />
                            {/* Plasma Orb */}
                            <View style={styles.plasmaOrb} />
                            {/* P1 Side (Cyan) */}
                            <View style={[styles.tugFillP1, { flex: tugPosition }]} />
                        </View>
                    ) : (
                        <View style={styles.dividerLine} />
                    )}

                    <View style={styles.centerTimerBadge}>
                        <NeonText style={styles.centerTimerText}>
                            {mode === 'target_100' ? 'RACE' : `${timeLeft}s`}
                        </NeonText>
                    </View>

                    <TouchableOpacity
                        style={styles.centerQuitBtn}
                        onPress={() => setPhase('menu')}
                        activeOpacity={0.7}
                    >
                        <NeonText size={10} weight="bold" color="#9CA3AF">✕ QUIT</NeonText>
                    </TouchableOpacity>
                </View>

                {/* PLAYER 1 ZONE (BOTTOM, NORMAL ORIENTATION) */}
                <View style={[styles.playerZone, styles.p1Zone]}>
                    <View style={styles.normalContent}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleP1Tap}
                            style={styles.tapTargetArea}
                        >
                            <Animated.View style={[styles.giantTapButton, styles.p1Button, { transform: [{ scale: p1Scale }] }]}>
                                <NeonText glowColor={COLORS.neonCyan} style={styles.giantTapText}>MASH!</NeonText>
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.playerZoneHeader}>
                            <NeonText glowColor={COLORS.neonCyan} style={styles.zonePlayerName}>{player1Name}</NeonText>
                            <NeonText style={styles.zoneScore}>
                                {mode === 'target_100' ? `${p1Taps}/100` : `${p1Taps} Taps`}
                            </NeonText>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // ==========================================
    // RENDER: GAME OVER
    // ==========================================
    if (phase === 'gameover') {
        const isP1 = winner === 'p1';
        const isP2 = winner === 'p2';
        const isTie = winner === 'tie';

        if (mode === 'solo_drill') {
            const cps = (soloTaps / 10).toFixed(1);
            const tier = getSoloTier(parseFloat(cps));

            return (
                <NeonContainer style={styles.container}>
                    <View style={styles.menuContent}>
                        <View style={[styles.victoryBox, { borderColor: tier.color }]}>
                            <Ionicons name="speedometer" size={64} color={tier.color} />
                            <NeonText glowColor={tier.color} style={styles.victoryTitle}>
                                {soloTaps} TAPS!
                            </NeonText>
                            <NeonText style={styles.cpsBadge}>{cps} Clicks / Sec</NeonText>
                            <NeonText glowColor={tier.color} style={styles.tierLabel}>{tier.label}</NeonText>
                        </View>

                        <View style={{ height: 30 }} />
                        <NeonButton
                            title="TRY AGAIN"
                            onPress={() => startGame('solo_drill')}
                            color={COLORS.neonCyan}
                            glow={true}
                        />
                        <View style={{ height: 14 }} />
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhase('menu')}>
                            <NeonText style={styles.secondaryBtnText}>Back to Modes</NeonText>
                        </TouchableOpacity>
                    </View>
                </NeonContainer>
            );
        }

        return (
            <NeonContainer style={styles.container}>
                <View style={styles.menuContent}>
                    <View style={[styles.victoryBox, { borderColor: isP1 ? COLORS.neonCyan : isP2 ? COLORS.hotPink : COLORS.limeGlow }]}>
                        <Ionicons
                            name="trophy"
                            size={64}
                            color={isP1 ? COLORS.neonCyan : isP2 ? COLORS.hotPink : COLORS.limeGlow}
                        />
                        <NeonText
                            glowColor={isP1 ? COLORS.neonCyan : isP2 ? COLORS.hotPink : COLORS.limeGlow}
                            style={styles.victoryTitle}
                        >
                            {isTie ? "IT'S A TIE!" : `${isP1 ? player1Name : player2Name} WINS!`}
                        </NeonText>

                        <View style={styles.duelScoresBox}>
                            <View style={styles.scoreRow}>
                                <NeonText style={{ color: COLORS.neonCyan, fontWeight: 'bold' }}>{player1Name}:</NeonText>
                                <NeonText glowColor={COLORS.neonCyan} style={styles.scoreNum}>{p1Taps} taps</NeonText>
                            </View>
                            <View style={styles.scoreRow}>
                                <NeonText style={{ color: COLORS.hotPink, fontWeight: 'bold' }}>{player2Name}:</NeonText>
                                <NeonText glowColor={COLORS.hotPink} style={styles.scoreNum}>{p2Taps} taps</NeonText>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 30 }} />
                    <NeonButton
                        title="REMATCH!"
                        onPress={() => startGame(mode)}
                        color={COLORS.limeGlow}
                        glow={true}
                    />
                    <View style={{ height: 14 }} />
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhase('menu')}>
                        <NeonText style={styles.secondaryBtnText}>Select Another Mode</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                        <NeonText style={[styles.secondaryBtnText, { color: COLORS.textMuted }]}>Exit Game</NeonText>
                    </TouchableOpacity>
                </View>
            </NeonContainer>
        );
    }

    return null;
};

// ==========================================
// STYLES
// ==========================================
const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 12 : 16,
        paddingBottom: 12
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    timerBadge: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    menuContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 30
    },
    menuSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20
    },
    modeCardsContainer: {
        gap: 12
    },
    modeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16
    },
    modeCardSelected: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 255, 255, 0.08)'
    },
    modeIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14
    },
    modeInfo: {
        flex: 1
    },
    modeTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    modeDesc: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2
    },
    highScoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        padding: 12,
        marginTop: 18
    },
    highScoreText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        marginLeft: 8
    },
    startButton: {
        width: '100%'
    },

    // COUNTDOWN
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    countdownNumber: {
        fontSize: 96,
        fontWeight: '900',
        marginBottom: 10
    },
    countdownPrompt: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 2
    },

    // SOLO MODE
    soloContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
        justifyContent: 'space-between'
    },
    soloStatsRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 10
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        alignItems: 'center'
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: 'bold'
    },
    statValue: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 4
    },
    soloTapArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    soloTapButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(0, 255, 255, 0.12)',
        borderWidth: 4,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tapPromptText: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 10,
        letterSpacing: 1.5
    },

    // DUEL SPLIT SCREEN
    duelContainer: {
        flex: 1,
        width: '100%',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        maxHeight: Platform.OS === 'web' ? '100vh' : undefined,
        backgroundColor: '#0a0a14',
        overflow: 'hidden'
    },
    playerZone: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        overflow: 'hidden',
        position: 'relative'
    },
    p2Zone: {
        backgroundColor: 'rgba(255, 0, 127, 0.05)'
    },
    p1Zone: {
        backgroundColor: 'rgba(0, 255, 255, 0.05)'
    },
    rotatedContent: {
        flex: 1,
        transform: [{ rotate: '180deg' }],
        justifyContent: 'space-between'
    },
    normalContent: {
        flex: 1,
        justifyContent: 'space-between'
    },
    playerZoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8
    },
    zonePlayerName: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    zoneScore: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textPrimary
    },
    tapTargetArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    giantTapButton: {
        width: '90%',
        height: '75%',
        borderRadius: 24,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    p2Button: {
        backgroundColor: 'rgba(255, 0, 127, 0.15)',
        borderColor: COLORS.hotPink
    },
    p1Button: {
        backgroundColor: 'rgba(0, 255, 255, 0.15)',
        borderColor: COLORS.neonCyan
    },
    giantTapText: {
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 2
    },

    // DIVIDER & TUG BAR
    centerDivider: {
        height: 48,
        backgroundColor: '#0d0d1e',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    dividerLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    tugTrack: {
        flexDirection: 'row',
        height: 12,
        width: '85%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
        overflow: 'hidden',
        alignItems: 'center'
    },
    tugFillP2: {
        height: '100%',
        backgroundColor: COLORS.hotPink
    },
    tugFillP1: {
        height: '100%',
        backgroundColor: COLORS.neonCyan
    },
    plasmaOrb: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#fff',
        zIndex: 10
    },
    centerTimerBadge: {
        position: 'absolute',
        backgroundColor: '#1b1b33',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    centerTimerText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    centerQuitBtn: {
        position: 'absolute',
        right: 14,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 20
    },

    // VICTORY
    victoryBox: {
        borderRadius: 24,
        borderWidth: 2,
        padding: 28,
        alignItems: 'center',
        marginTop: 40,
        backgroundColor: 'rgba(255,255,255,0.03)'
    },
    victoryTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginTop: 12,
        textAlign: 'center'
    },
    cpsBadge: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginTop: 6
    },
    tierLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8
    },
    duelScoresBox: {
        marginTop: 16,
        width: '100%',
        gap: 8
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12
    },
    scoreNum: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    secondaryBtn: {
        paddingVertical: 12,
        alignItems: 'center'
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.neonCyan
    }
});

export default LocalButtonMashScreen;

