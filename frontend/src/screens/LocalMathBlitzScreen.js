import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated,
    Platform, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ConfettiEffect from '../components/ConfettiEffect';
import GameIcon from '../components/GameIcon';
import { useTheme } from '../context/ThemeContext';
import SoundService from '../services/SoundService';
import HapticService from '../services/HapticService';

const HIGH_SCORE_KEY = 'playrave_local_mathblitz_highscore';
const TOTAL_GAME_TIME = 60; // 60 seconds
const TARGET_DUEL_SCORE = 10; // First to 10 wins in split-screen duel

const DIFFICULTIES = [
    { key: 'easy', label: 'EASY', multiplier: 1, desc: '+ and - up to 20' },
    { key: 'medium', label: 'MEDIUM', multiplier: 1.5, desc: '+, - and × up to 100' },
    { key: 'hard', label: 'HARD', multiplier: 2.2, desc: 'Multiplication & division' },
];

const safePlay = (action) => {
    try {
        action();
    } catch (_) {
        // Audio error ignored
    }
};

const safeHaptic = (action) => {
    try {
        action();
    } catch (_) {
        // Haptic error ignored
    }
};

const generateProblem = (difficulty = 'medium') => {
    let num1, num2, op, answer;
    if (difficulty === 'easy') {
        const ops = ['+', '-'];
        op = ops[Math.floor(Math.random() * ops.length)];
        num1 = Math.floor(Math.random() * 14) + 2;
        num2 = Math.floor(Math.random() * 12) + 1;
        if (op === '-' && num2 > num1) [num1, num2] = [num2, num1];
        answer = op === '+' ? num1 + num2 : num1 - num2;
    } else if (difficulty === 'hard') {
        const ops = ['+', '-', '*', '/'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '/') {
            num2 = Math.floor(Math.random() * 8) + 2;
            answer = Math.floor(Math.random() * 12) + 2;
            num1 = num2 * answer;
        } else if (op === '*') {
            num1 = Math.floor(Math.random() * 14) + 3;
            num2 = Math.floor(Math.random() * 11) + 2;
            answer = num1 * num2;
        } else {
            num1 = Math.floor(Math.random() * 60) + 15;
            num2 = Math.floor(Math.random() * 45) + 10;
            if (op === '-' && num2 > num1) [num1, num2] = [num2, num1];
            answer = op === '+' ? num1 + num2 : num1 - num2;
        }
    } else {
        // Medium
        const ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '*') {
            num1 = Math.floor(Math.random() * 11) + 2;
            num2 = Math.floor(Math.random() * 9) + 2;
            answer = num1 * num2;
        } else {
            num1 = Math.floor(Math.random() * 32) + 5;
            num2 = Math.floor(Math.random() * 24) + 3;
            if (op === '-' && num2 > num1) [num1, num2] = [num2, num1];
            answer = op === '+' ? num1 + num2 : num1 - num2;
        }
    }
    const displayOp = op === '*' ? '×' : op === '/' ? '÷' : op;
    return {
        display: `${num1} ${displayOp} ${num2}`,
        answer,
    };
};

const generateChoices = (correctAnswer) => {
    const choices = new Set([correctAnswer]);
    const offsets = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];
    let attempts = 0;
    while (choices.size < 4 && attempts < 50) {
        attempts++;
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        const distractor = correctAnswer + offset;
        if (distractor !== correctAnswer && distractor >= 0) {
            choices.add(distractor);
        } else {
            choices.add(correctAnswer + Math.floor(Math.random() * 12) + 1);
        }
    }
    while (choices.size < 4) {
        choices.add(correctAnswer + choices.size * 2);
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
};

const LocalMathBlitzScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Navigation params
    const incomingPlayers = route?.params?.players;
    const isSinglePlayer = route?.params?.isSinglePlayer ?? (!incomingPlayers || incomingPlayers.length <= 1);
    const players = useMemo(() => incomingPlayers || [{ name: 'Player 1' }, { name: 'Player 2' }], [incomingPlayers]);
    const p1Name = players[0]?.name || 'Player 1';
    const p2Name = players[1]?.name || 'Player 2';

    // Mode: 'menu' | 'solo' | 'duel'
    const [gameMode, setGameMode] = useState('menu');
    const [difficulty, setDifficulty] = useState('medium');
    const [highScore, setHighScore] = useState(0);

    // Solo Mode State
    const [soloPhase, setSoloPhase] = useState('ready'); // 'ready' | 'playing' | 'gameover'
    const [timeLeft, setTimeLeft] = useState(TOTAL_GAME_TIME);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [inputAnswer, setInputAnswer] = useState('');
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Duel Mode State (Split-Screen)
    const [duelPhase, setDuelPhase] = useState('ready'); // 'ready' | 'countdown' | 'playing' | 'gameover'
    const [duelCountdown, setDuelCountdown] = useState(3);
    const [duelScores, setDuelScores] = useState({ p1: 0, p2: 0 });
    const [duelProblem, setDuelProblem] = useState(null);
    const [duelChoices, setDuelChoices] = useState([]);
    const [duelWinner, setDuelWinner] = useState(null);
    const [p1Penalty, setP1Penalty] = useState(false);
    const [p2Penalty, setP2Penalty] = useState(false);

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const countdownAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    // Load High Score
    useEffect(() => {
        const loadHighScore = async () => {
            try {
                const saved = await AsyncStorage.getItem(HIGH_SCORE_KEY);
                if (saved) setHighScore(parseInt(saved, 10) || 0);
            } catch (_) {
                // High score read error ignored
            }
        };
        loadHighScore();
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const nextDuelRound = useCallback(() => {
        const prob = generateProblem(difficulty);
        const choices = generateChoices(prob.answer);
        setDuelProblem(prob);
        setDuelChoices(choices);
    }, [difficulty]);

    const startDuelGame = useCallback(() => {
        safePlay(() => SoundService.playButtonClick?.());
        safeHaptic(() => HapticService.trigger?.('impactMedium'));
        nextDuelRound();
        setDuelScores({ p1: 0, p2: 0 });
        setDuelWinner(null);
        setShowConfetti(false);
        setP1Penalty(false);
        setP2Penalty(false);
        setDuelCountdown(3);
        setGameMode('duel');
        setDuelPhase('countdown');
    }, [nextDuelRound]);

    // Duel Countdown Timer
    useEffect(() => {
        let timer = null;
        if (gameMode === 'duel' && duelPhase === 'countdown') {
            countdownAnim.setValue(0.5);
            Animated.spring(countdownAnim, {
                toValue: 1.2,
                friction: 3,
                useNativeDriver: Platform.OS !== 'web',
            }).start();

            safePlay(() => SoundService.playTick?.());
            safeHaptic(() => HapticService.trigger?.('impactMedium'));

            timer = setInterval(() => {
                setDuelCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setDuelPhase('playing');
                        safePlay(() => SoundService.playGameStart?.());
                        safeHaptic(() => HapticService.trigger?.('notificationSuccess'));
                        return 0;
                    }
                    countdownAnim.setValue(0.5);
                    Animated.spring(countdownAnim, {
                        toValue: 1.2,
                        friction: 3,
                        useNativeDriver: Platform.OS !== 'web',
                    }).start();
                    safePlay(() => SoundService.playTick?.());
                    safeHaptic(() => HapticService.trigger?.('impactMedium'));
                    return prev - 1;
                });
            }, 900);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameMode, duelPhase, countdownAnim]);

    // Trigger Screen Shake
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    };

    // Trigger Pulse
    const triggerPulse = () => {
        Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // SOLO MODE LOGIC
    // ─────────────────────────────────────────────────────────────────────────────

    const startSoloGame = () => {
        safePlay(() => SoundService.playButtonClick?.());
        safeHaptic(() => HapticService.trigger?.('impactMedium'));
        setGameMode('solo');
        setSoloPhase('playing');
        setTimeLeft(TOTAL_GAME_TIME);
        setScore(0);
        setStreak(0);
        setMaxStreak(0);
        setCorrectCount(0);
        setTotalAnswered(0);
        setIsNewHighScore(false);
        setShowConfetti(false);
        setInputAnswer('');

        const firstProblem = generateProblem(difficulty);
        setCurrentProblem(firstProblem);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    finishSoloGame();
                    return 0;
                }
                if (prev <= 6) {
                    safePlay(() => SoundService.playTick?.());
                }
                return prev - 1;
            });
        }, 1000);
    };

    const finishSoloGame = async () => {
        setSoloPhase('gameover');
        safePlay(() => SoundService.playWinner?.());
        safeHaptic(() => HapticService.celebration?.());

        setScore((finalScore) => {
            if (finalScore > highScore) {
                setHighScore(finalScore);
                setIsNewHighScore(true);
                setShowConfetti(true);
                AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString()).catch(() => {});
            }
            return finalScore;
        });
    };

    const handleNumpadPress = (digit) => {
        if (soloPhase !== 'playing') return;
        safeHaptic(() => HapticService.selection?.());

        if (digit === 'BACK') {
            setInputAnswer((prev) => prev.slice(0, -1));
            return;
        }

        if (digit === '-') {
            setInputAnswer((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
            return;
        }

        const newAnswerStr = inputAnswer + digit;
        setInputAnswer(newAnswerStr);

        const numVal = parseInt(newAnswerStr, 10);
        if (numVal === currentProblem?.answer) {
            handleSoloCorrect();
        }
    };

    const handleSoloCorrect = () => {
        safePlay(() => SoundService.playCorrect?.());
        safeHaptic(() => HapticService.trigger?.('impactMedium'));
        triggerPulse();

        const diffMultiplier = DIFFICULTIES.find((d) => d.key === difficulty)?.multiplier || 1;
        const comboMultiplier = streak >= 9 ? 4 : streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
        const pointsEarned = Math.round(10 * diffMultiplier * comboMultiplier);

        setScore((prev) => prev + pointsEarned);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        setCorrectCount((prev) => prev + 1);
        setTotalAnswered((prev) => prev + 1);
        setInputAnswer('');

        setCurrentProblem(generateProblem(difficulty));
    };

    const handleSoloSubmit = () => {
        if (!inputAnswer || soloPhase !== 'playing' || !currentProblem) return;
        const numVal = parseInt(inputAnswer, 10);

        if (numVal === currentProblem.answer) {
            handleSoloCorrect();
        } else {
            safePlay(() => SoundService.playWrong?.());
            safeHaptic(() => HapticService.trigger?.('notificationWarning'));
            triggerShake();
            setStreak(0);
            setTotalAnswered((prev) => prev + 1);
            setInputAnswer('');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 2-PLAYER DUEL LOGIC (Split-Screen)
    // ─────────────────────────────────────────────────────────────────────────────

    const handleDuelAnswer = (player, chosenValue) => {
        if (duelPhase !== 'playing') return;
        if (player === 'p1' && p1Penalty) return;
        if (player === 'p2' && p2Penalty) return;
        if (!duelProblem) return;

        if (chosenValue === duelProblem.answer) {
            // Correct!
            safePlay(() => SoundService.playCorrect?.());
            safeHaptic(() => HapticService.trigger?.('impactHeavy'));

            const newScores = {
                ...duelScores,
                [player]: duelScores[player] + 1,
            };
            setDuelScores(newScores);

            if (newScores[player] >= TARGET_DUEL_SCORE) {
                // Game Won!
                setDuelPhase('gameover');
                setDuelWinner(player === 'p1' ? p1Name : p2Name);
                safePlay(() => SoundService.playWinner?.());
                safeHaptic(() => HapticService.celebration?.());
                setShowConfetti(true);
            } else {
                nextDuelRound();
            }
        } else {
            // Wrong answer penalty!
            safePlay(() => SoundService.playWrong?.());
            safeHaptic(() => HapticService.trigger?.('notificationError'));

            if (player === 'p1') {
                setP1Penalty(true);
                setTimeout(() => setP1Penalty(false), 800);
            } else {
                setP2Penalty(true);
                setTimeout(() => setP2Penalty(false), 800);
            }
        }
    };

    // Helper: render 2x2 grid of choices safely
    const renderDuelChoices = (player, penalty) => {
        if (!duelChoices || duelChoices.length < 4) return null;
        const row1 = duelChoices.slice(0, 2);
        const row2 = duelChoices.slice(2, 4);

        return (
            <View style={styles.duelChoicesContainer}>
                <View style={styles.duelChoiceRow}>
                    {row1.map((choice, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.duelChoiceBtn,
                                player === 'p2' ? styles.duelChoiceBtnP2 : styles.duelChoiceBtnP1,
                                penalty && styles.penaltyBtn,
                            ]}
                            onPress={() => handleDuelAnswer(player, choice)}
                            disabled={penalty || duelPhase !== 'playing'}
                            activeOpacity={0.7}
                        >
                            <NeonText
                                size={22}
                                weight="bold"
                                color={penalty ? '#6B7280' : '#FFFFFF'}
                            >
                                {choice}
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.duelChoiceRow}>
                    {row2.map((choice, i) => (
                        <TouchableOpacity
                            key={i + 2}
                            style={[
                                styles.duelChoiceBtn,
                                player === 'p2' ? styles.duelChoiceBtnP2 : styles.duelChoiceBtnP1,
                                penalty && styles.penaltyBtn,
                            ]}
                            onPress={() => handleDuelAnswer(player, choice)}
                            disabled={penalty || duelPhase !== 'playing'}
                            activeOpacity={0.7}
                        >
                            <NeonText
                                size={22}
                                weight="bold"
                                color={penalty ? '#6B7280' : '#FFFFFF'}
                            >
                                {choice}
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: MENU SCREEN
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'menu') {
        return (
            <NeonContainer showBackButton onBack={() => navigation.goBack()} scrollable>
                <View style={styles.menuContainer}>
                    <View style={styles.menuHeader}>
                        <GameIcon gameId="math-blitz" size={72} style={styles.headerIcon} />
                        <NeonText size={28} weight="bold" glow color={COLORS.neonCyan}>
                            MATH BLITZ
                        </NeonText>
                        <NeonText size={12} color="#9CA3AF" style={{ marginTop: 4 }}>
                            {isSinglePlayer ? 'SPEED MENTAL MATH CHALLENGE' : `${p1Name} VS ${p2Name} • DUEL READY`}
                        </NeonText>

                        {highScore > 0 && (
                            <View style={styles.highScorePill}>
                                <NeonText size={12} weight="bold" color="#FFD700">
                                    🏆 ALL-TIME BEST: {highScore} PTS
                                </NeonText>
                            </View>
                        )}
                    </View>

                    {/* Difficulty Selector */}
                    <View style={styles.sectionCard}>
                        <NeonText size={13} weight="bold" color="#E5E7EB" style={{ marginBottom: 10 }}>
                            SELECT DIFFICULTY
                        </NeonText>
                        <View style={styles.diffRow}>
                            {DIFFICULTIES.map((d) => (
                                <TouchableOpacity
                                    key={d.key}
                                    style={[
                                        styles.diffBtn,
                                        difficulty === d.key && styles.diffBtnActive,
                                    ]}
                                    onPress={() => {
                                        safePlay(() => SoundService.playButtonClick?.());
                                        safeHaptic(() => HapticService.selection?.());
                                        setDifficulty(d.key);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <NeonText
                                        size={11}
                                        weight="bold"
                                        color={difficulty === d.key ? '#000' : '#9CA3AF'}
                                    >
                                        {d.label}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <NeonText size={10} color="#6B7280" style={{ marginTop: 6, textAlign: 'center' }}>
                            {DIFFICULTIES.find((d) => d.key === difficulty)?.desc}
                        </NeonText>
                    </View>

                    {/* Mode Cards */}
                    <View style={styles.modesContainer}>
                        {/* Mode 1: 2-Player Split-Screen Duel */}
                        <TouchableOpacity
                            style={[styles.modeCard, { borderColor: `${COLORS.hotPink}88` }]}
                            onPress={startDuelGame}
                            activeOpacity={0.85}
                        >
                            <View style={styles.modeCardHeader}>
                                <NeonText size={28}>⚔️</NeonText>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <NeonText size={16} weight="bold" color={COLORS.hotPink} glow>
                                        2-PLAYER SPLIT-SCREEN DUEL
                                    </NeonText>
                                    <NeonText size={11} color="#9CA3AF" style={{ marginTop: 2 }}>
                                        Face opposite ends of the screen. Race to tap the answer first to 10 points!
                                    </NeonText>
                                </View>
                            </View>
                            <View style={[styles.playTag, { backgroundColor: COLORS.hotPink }]}>
                                <NeonText size={11} weight="bold" color="#FFF">START DUEL ›</NeonText>
                            </View>
                        </TouchableOpacity>

                        {/* Mode 2: Solo 60s Blitz */}
                        <TouchableOpacity
                            style={styles.modeCard}
                            onPress={startSoloGame}
                            activeOpacity={0.85}
                        >
                            <View style={styles.modeCardHeader}>
                                <NeonText size={28}>⚡</NeonText>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <NeonText size={16} weight="bold" color={COLORS.neonYellow || '#FFD700'} glow>
                                        SOLO 60s TIME ATTACK
                                    </NeonText>
                                    <NeonText size={11} color="#9CA3AF" style={{ marginTop: 2 }}>
                                        Solve as many equations as you can in 1 minute. Rack up huge combos!
                                    </NeonText>
                                </View>
                            </View>
                            <View style={styles.playTag}>
                                <NeonText size={11} weight="bold" color="#000">PLAY SOLO ›</NeonText>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: SOLO 60-SECOND TIME ATTACK
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'solo') {
        const combo = streak >= 9 ? 4 : streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

        return (
            <NeonContainer>
                <ConfettiEffect show={showConfetti} pieceCount={40} />

                {/* Top Status Bar */}
                <View style={styles.soloTopBar}>
                    <TouchableOpacity
                        style={styles.quitBtn}
                        onPress={() => {
                            if (timerRef.current) clearInterval(timerRef.current);
                            setGameMode('menu');
                        }}
                    >
                        <NeonText size={12} color="#9CA3AF">✕ QUIT</NeonText>
                    </TouchableOpacity>

                    <View style={styles.soloStatItem}>
                        <NeonText size={10} color="#6B7280">TIME</NeonText>
                        <NeonText
                            size={18}
                            weight="bold"
                            color={timeLeft <= 10 ? '#EF4444' : COLORS.neonCyan}
                            glow={timeLeft <= 10}
                        >
                            {timeLeft}s
                        </NeonText>
                    </View>

                    <View style={styles.soloStatItem}>
                        <NeonText size={10} color="#6B7280">SCORE</NeonText>
                        <NeonText size={18} weight="bold" color={COLORS.neonYellow || '#FFD700'} glow>
                            {score}
                        </NeonText>
                    </View>

                    {streak >= 2 && (
                        <View style={styles.comboPill}>
                            <NeonText size={11} weight="bold" color="#FF8C00">
                                🔥 {combo}x COMBO
                            </NeonText>
                        </View>
                    )}
                </View>

                {/* Playing View */}
                {soloPhase === 'playing' && (
                    <Animated.View style={[styles.soloPlayArea, { transform: [{ translateX: shakeAnim }] }]}>
                        {/* Equation Box */}
                        <Animated.View style={[styles.equationCard, { transform: [{ scale: pulseAnim }] }]}>
                            <NeonText size={11} color="#9CA3AF" style={{ marginBottom: 6, letterSpacing: 1 }}>
                                SOLVE THE EQUATION
                            </NeonText>
                            <NeonText size={38} weight="bold" color={COLORS.white} glow>
                                {currentProblem?.display}
                            </NeonText>

                            <View style={styles.answerBox}>
                                <NeonText size={30} weight="bold" color={COLORS.neonCyan}>
                                    {inputAnswer || '_'}
                                </NeonText>
                            </View>
                        </Animated.View>

                        {/* Numpad */}
                        <View style={styles.numpadContainer}>
                            <View style={styles.numpadRow}>
                                {['1', '2', '3'].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        style={styles.numpadBtn}
                                        onPress={() => handleNumpadPress(n)}
                                        activeOpacity={0.7}
                                    >
                                        <NeonText size={22} weight="bold">{n}</NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                {['4', '5', '6'].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        style={styles.numpadBtn}
                                        onPress={() => handleNumpadPress(n)}
                                        activeOpacity={0.7}
                                    >
                                        <NeonText size={22} weight="bold">{n}</NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                {['7', '8', '9'].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        style={styles.numpadBtn}
                                        onPress={() => handleNumpadPress(n)}
                                        activeOpacity={0.7}
                                    >
                                        <NeonText size={22} weight="bold">{n}</NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.numpadRow}>
                                <TouchableOpacity
                                    style={[styles.numpadBtn, styles.numpadActionBtn]}
                                    onPress={() => handleNumpadPress('BACK')}
                                    activeOpacity={0.7}
                                >
                                    <NeonText size={18} color="#EF4444">⌫</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.numpadBtn}
                                    onPress={() => handleNumpadPress('0')}
                                    activeOpacity={0.7}
                                >
                                    <NeonText size={22} weight="bold">0</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.numpadBtn, styles.numpadSubmitBtn]}
                                    onPress={handleSoloSubmit}
                                    activeOpacity={0.7}
                                >
                                    <NeonText size={14} weight="bold" color="#000">↵</NeonText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Game Over Modal / Summary */}
                {soloPhase === 'gameover' && (
                    <View style={styles.summaryCard}>
                        {isNewHighScore && (
                            <View style={styles.newRecordBadge}>
                                <NeonText size={12} weight="bold" color="#000">🎉 NEW HIGH SCORE!</NeonText>
                            </View>
                        )}

                        <NeonText size={14} color="#9CA3AF" style={{ marginTop: 8 }}>{"TIME'S UP!"}</NeonText>
                        <NeonText size={42} weight="bold" color={COLORS.neonYellow || '#FFD700'} glow>
                            {score} PTS
                        </NeonText>

                        <View style={styles.summaryStatsGrid}>
                            <View style={styles.summaryStatItem}>
                                <NeonText size={10} color="#6B7280">CORRECT</NeonText>
                                <NeonText size={16} weight="bold" color={COLORS.neonCyan}>{correctCount}</NeonText>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryStatItem}>
                                <NeonText size={10} color="#6B7280">ACCURACY</NeonText>
                                <NeonText size={16} weight="bold" color="#10B981">{accuracy}%</NeonText>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryStatItem}>
                                <NeonText size={10} color="#6B7280">MAX STREAK</NeonText>
                                <NeonText size={16} weight="bold" color="#F59E0B">🔥 {maxStreak}</NeonText>
                            </View>
                        </View>

                        <View style={styles.summaryButtons}>
                            <NeonButton
                                title="PLAY AGAIN"
                                onPress={startSoloGame}
                                style={{ width: '100%', marginBottom: 10 }}
                            />
                            <TouchableOpacity
                                style={styles.menuReturnBtn}
                                onPress={() => setGameMode('menu')}
                            >
                                <NeonText size={12} weight="bold" color="#9CA3AF">CHANGE MODE / DIFFICULTY</NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </NeonContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: 2-PLAYER DUEL - COUNTDOWN PHASE
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'duel' && duelPhase === 'countdown') {
        return (
            <NeonContainer style={[styles.container, styles.centerAll]}>
                <View style={styles.countdownContainer}>
                    <NeonText size={14} color="#9CA3AF" weight="bold" style={styles.countdownVsHeader}>
                        ⚔️ 2-PLAYER DUEL
                    </NeonText>

                    <View style={styles.countdownVsRow}>
                        <View style={styles.countdownPlayerPillP2}>
                            <NeonText size={15} weight="bold" color={COLORS.hotPink}>
                                {p2Name}
                            </NeonText>
                        </View>
                        <NeonText size={16} weight="bold" color="#6B7280">VS</NeonText>
                        <View style={styles.countdownPlayerPillP1}>
                            <NeonText size={15} weight="bold" color={COLORS.neonCyan}>
                                {p1Name}
                            </NeonText>
                        </View>
                    </View>

                    <Animated.View style={{ transform: [{ scale: countdownAnim }], marginVertical: 24, alignItems: 'center' }}>
                        <NeonText
                            size={72}
                            weight="bold"
                            color={duelCountdown > 0 ? (COLORS.neonYellow || '#FFD700') : COLORS.neonCyan}
                            glow
                        >
                            {duelCountdown > 0 ? duelCountdown : 'GO!'}
                        </NeonText>
                    </Animated.View>

                    <NeonText size={14} weight="bold" color="#E5E7EB" style={styles.countdownPrompt}>
                        FIRST TO {TARGET_DUEL_SCORE} POINTS WINS!
                    </NeonText>
                    <NeonText size={12} color="#9CA3AF" style={{ marginTop: 4 }}>
                        Tap the right answer before your opponent
                    </NeonText>

                    <TouchableOpacity
                        style={styles.countdownCancelBtn}
                        onPress={() => setGameMode('menu')}
                        activeOpacity={0.7}
                    >
                        <NeonText size={12} color="#9CA3AF">CANCEL</NeonText>
                    </TouchableOpacity>
                </View>
            </NeonContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: 2-PLAYER DUEL - GAME OVER PHASE
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'duel' && duelPhase === 'gameover') {
        const isP1Winner = duelWinner === p1Name;

        return (
            <NeonContainer style={[styles.container, styles.centerAll]}>
                <ConfettiEffect show={showConfetti} pieceCount={50} />

                <View style={styles.duelGameOverContainer}>
                    <NeonText size={14} color="#9CA3AF" weight="bold" style={{ letterSpacing: 1.5 }}>
                        MATCH FINISHED
                    </NeonText>

                    <NeonText
                        size={32}
                        weight="bold"
                        color={isP1Winner ? COLORS.neonCyan : COLORS.hotPink}
                        glow
                        style={styles.duelWinnerText}
                    >
                        🏆 {duelWinner} WINS!
                    </NeonText>

                    <View style={styles.duelFinalScoreCard}>
                        <View style={styles.duelFinalPlayerRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.playerColorDot, { backgroundColor: COLORS.hotPink }]} />
                                <NeonText size={16} weight="bold" color={COLORS.hotPink}>{p2Name}</NeonText>
                            </View>
                            <NeonText size={22} weight="bold" color={COLORS.hotPink} glow>
                                {duelScores.p2} PTS
                            </NeonText>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.duelFinalPlayerRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.playerColorDot, { backgroundColor: COLORS.neonCyan }]} />
                                <NeonText size={16} weight="bold" color={COLORS.neonCyan}>{p1Name}</NeonText>
                            </View>
                            <NeonText size={22} weight="bold" color={COLORS.neonCyan} glow>
                                {duelScores.p1} PTS
                            </NeonText>
                        </View>
                    </View>

                    <View style={styles.summaryButtons}>
                        <NeonButton
                            title="REMATCH 🔄"
                            onPress={startDuelGame}
                            style={{ width: '100%', marginBottom: 12 }}
                        />
                        <TouchableOpacity
                            style={styles.menuReturnBtn}
                            onPress={() => setGameMode('menu')}
                            activeOpacity={0.8}
                        >
                            <NeonText size={13} weight="bold" color="#9CA3AF">
                                CHANGE MODE / MENU
                            </NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: 2-PLAYER SPLIT-SCREEN DUEL (PLAYING)
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'duel' && duelPhase === 'playing') {
        return (
            <View style={styles.duelScreenWrapper}>
                <StatusBar hidden={Platform.OS !== 'web'} barStyle="light-content" />

                {/* ─ TOP HALF: PLAYER 2 (ROTATED 180 DEG) ─ */}
                <View style={[styles.playerZone, styles.p2Zone]}>
                    <View style={styles.rotatedContent}>
                        {/* P2 Header */}
                        <View style={styles.duelPlayerBar}>
                            <View style={styles.duelPlayerInfo}>
                                <View style={[styles.playerColorDot, { backgroundColor: COLORS.hotPink }]} />
                                <NeonText size={15} weight="bold" color={COLORS.hotPink}>
                                    {p2Name}
                                </NeonText>
                            </View>
                            <View style={styles.duelScorePillP2}>
                                <NeonText size={16} weight="bold" color={COLORS.hotPink} glow>
                                    {duelScores.p2} / {TARGET_DUEL_SCORE}
                                </NeonText>
                            </View>
                        </View>

                        {/* P2 Equation */}
                        <View style={styles.duelEquationWrap}>
                            <NeonText size={11} color="#9CA3AF" style={styles.duelSolveLabel}>
                                SOLVE FIRST:
                            </NeonText>
                            <NeonText size={32} weight="bold" color="#FFFFFF" glow>
                                {duelProblem?.display} = ?
                            </NeonText>
                            {p2Penalty && (
                                <View style={styles.penaltyBanner}>
                                    <NeonText size={10} weight="bold" color="#EF4444">
                                        ⚠️ WRONG ANSWER – LOCKED (0.8s)
                                    </NeonText>
                                </View>
                            )}
                        </View>

                        {/* P2 Choices */}
                        {renderDuelChoices('p2', p2Penalty)}
                    </View>
                </View>

                {/* ─ CENTER DIVIDER ─ */}
                <View style={styles.centerDivider}>
                    <View style={styles.dividerSide}>
                        <NeonText size={12} weight="bold" color={COLORS.hotPink}>
                            {p2Name.slice(0, 10)}: {duelScores.p2}
                        </NeonText>
                    </View>

                    <View style={styles.dividerCenter}>
                        <View style={styles.targetBadge}>
                            <NeonText size={10} weight="bold" color="#FFD700">
                                FIRST TO {TARGET_DUEL_SCORE}
                            </NeonText>
                        </View>
                        <TouchableOpacity
                            style={styles.duelQuitBtn}
                            onPress={() => setGameMode('menu')}
                            activeOpacity={0.7}
                        >
                            <NeonText size={10} weight="bold" color="#9CA3AF">
                                ✕ QUIT
                            </NeonText>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.dividerSide, { alignItems: 'flex-end' }]}>
                        <NeonText size={12} weight="bold" color={COLORS.neonCyan}>
                            {p1Name.slice(0, 10)}: {duelScores.p1}
                        </NeonText>
                    </View>
                </View>

                {/* ─ BOTTOM HALF: PLAYER 1 (UPRIGHT) ─ */}
                <View style={[styles.playerZone, styles.p1Zone]}>
                    <View style={styles.normalContent}>
                        {/* P1 Header */}
                        <View style={styles.duelPlayerBar}>
                            <View style={styles.duelPlayerInfo}>
                                <View style={[styles.playerColorDot, { backgroundColor: COLORS.neonCyan }]} />
                                <NeonText size={15} weight="bold" color={COLORS.neonCyan}>
                                    {p1Name}
                                </NeonText>
                            </View>
                            <View style={styles.duelScorePillP1}>
                                <NeonText size={16} weight="bold" color={COLORS.neonCyan} glow>
                                    {duelScores.p1} / {TARGET_DUEL_SCORE}
                                </NeonText>
                            </View>
                        </View>

                        {/* P1 Equation */}
                        <View style={styles.duelEquationWrap}>
                            <NeonText size={11} color="#9CA3AF" style={styles.duelSolveLabel}>
                                SOLVE FIRST:
                            </NeonText>
                            <NeonText size={32} weight="bold" color="#FFFFFF" glow>
                                {duelProblem?.display} = ?
                            </NeonText>
                            {p1Penalty && (
                                <View style={styles.penaltyBanner}>
                                    <NeonText size={10} weight="bold" color="#EF4444">
                                        ⚠️ WRONG ANSWER – LOCKED (0.8s)
                                    </NeonText>
                                </View>
                            )}
                        </View>

                        {/* P1 Choices */}
                        {renderDuelChoices('p1', p1Penalty)}
                    </View>
                </View>
            </View>
        );
    }

    return null;
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#0a0a1a',
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 24,
        alignItems: 'center',
    },
    menuHeader: {
        alignItems: 'center',
        marginBottom: 18,
    },
    headerIcon: {
        marginBottom: 8,
    },
    highScorePill: {
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.35)',
    },
    sectionCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    diffRow: {
        flexDirection: 'row',
        gap: 8,
    },
    diffBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    diffBtnActive: {
        backgroundColor: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
    },
    modesContainer: {
        width: '100%',
        maxWidth: 420,
        gap: 14,
    },
    modeCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1.5,
        borderColor: `${COLORS.neonYellow || '#FFD700'}66`,
    },
    modeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    playTag: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.neonYellow || '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    soloTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    quitBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    soloStatItem: {
        alignItems: 'center',
    },
    comboPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 140, 0, 0.15)',
        borderWidth: 1,
        borderColor: '#FF8C00',
    },
    soloPlayArea: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    equationCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    answerBox: {
        marginTop: 12,
        minWidth: 140,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    numpadContainer: {
        width: '100%',
        maxWidth: 340,
        gap: 8,
    },
    numpadRow: {
        flexDirection: 'row',
        gap: 8,
    },
    numpadBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numpadActionBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    numpadSubmitBtn: {
        backgroundColor: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
    },
    summaryCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    newRecordBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    summaryStatsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        maxWidth: 360,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingVertical: 14,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    summaryButtons: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    menuReturnBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // DUEL SPLIT SCREEN STYLES
    // ─────────────────────────────────────────────────────────────────────────
    duelScreenWrapper: {
        flex: 1,
        width: '100%',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        maxHeight: Platform.OS === 'web' ? '100vh' : undefined,
        backgroundColor: '#050711',
        overflow: 'hidden',
        flexDirection: 'column',
    },
    playerZone: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    p2Zone: {
        backgroundColor: 'rgba(255, 0, 127, 0.03)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 0, 127, 0.15)',
    },
    p1Zone: {
        backgroundColor: 'rgba(0, 240, 255, 0.03)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 240, 255, 0.15)',
    },
    rotatedContent: {
        flex: 1,
        transform: [{ rotate: '180deg' }],
        justifyContent: 'space-between',
    },
    normalContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    duelPlayerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    duelPlayerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playerColorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    duelScorePillP2: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 127, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 127, 0.35)',
    },
    duelScorePillP1: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.35)',
    },
    duelEquationWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    duelSolveLabel: {
        letterSpacing: 1,
        marginBottom: 2,
    },
    penaltyBanner: {
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    duelChoicesContainer: {
        width: '100%',
        gap: 8,
    },
    duelChoiceRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    duelChoiceBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
                userSelect: 'none',
            },
        }),
    },
    duelChoiceBtnP2: {
        backgroundColor: 'rgba(255, 0, 127, 0.12)',
        borderColor: 'rgba(255, 0, 127, 0.35)',
    },
    duelChoiceBtnP1: {
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        borderColor: 'rgba(0, 240, 255, 0.35)',
    },
    penaltyBtn: {
        opacity: 0.35,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: '#EF4444',
    },
    centerDivider: {
        height: 44,
        backgroundColor: '#0a0d1e',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        zIndex: 50,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    dividerSide: {
        flex: 1,
        justifyContent: 'center',
    },
    dividerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    targetBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    duelQuitBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    countdownContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        maxWidth: 400,
        width: '100%',
    },
    countdownVsHeader: {
        letterSpacing: 2,
        marginBottom: 16,
    },
    countdownVsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    countdownPlayerPillP2: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 127, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 127, 0.4)',
    },
    countdownPlayerPillP1: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.4)',
    },
    countdownPrompt: {
        letterSpacing: 1,
        marginTop: 8,
    },
    countdownCancelBtn: {
        marginTop: 32,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    duelGameOverContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        maxWidth: 420,
        width: '100%',
    },
    duelWinnerText: {
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
    },
    duelFinalScoreCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        marginBottom: 24,
        gap: 12,
    },
    duelFinalPlayerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default LocalMathBlitzScreen;
