import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated,
    Platform, Dimensions, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ConfettiEffect from '../components/ConfettiEffect';
import GameIcon from '../components/GameIcon';
import { useTheme } from '../context/ThemeContext';
import SoundService from '../services/SoundService';
import HapticService from '../services/HapticService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HIGH_SCORE_KEY = 'playrave_local_mathblitz_highscore';
const TOTAL_GAME_TIME = 60; // 60 seconds
const TARGET_DUEL_SCORE = 10; // First to 10 wins in split-screen duel

const DIFFICULTIES = [
    { key: 'easy', label: 'EASY', multiplier: 1, desc: '+ and - up to 20' },
    { key: 'medium', label: 'MEDIUM', multiplier: 1.5, desc: '+, - and × up to 100' },
    { key: 'hard', label: 'HARD', multiplier: 2.2, desc: 'Multiplication & division' },
];

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
    while (choices.size < 4) {
        const offset = offsets[Math.floor(Math.random() * offsets.length)];
        const distractor = correctAnswer + offset;
        if (distractor !== correctAnswer && distractor >= 0) {
            choices.add(distractor);
        } else {
            choices.add(correctAnswer + Math.floor(Math.random() * 12) + 1);
        }
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
};

const LocalMathBlitzScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Navigation params
    const { players = [{ name: 'Player 1' }, { name: 'Player 2' }] } = route?.params || {};

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
    const [duelPhase, setDuelPhase] = useState('ready'); // 'ready' | 'playing' | 'gameover'
    const [duelScores, setDuelScores] = useState({ p1: 0, p2: 0 });
    const [duelProblem, setDuelProblem] = useState(null);
    const [duelChoices, setDuelChoices] = useState([]);
    const [duelWinner, setDuelWinner] = useState(null);
    const [p1Penalty, setP1Penalty] = useState(false);
    const [p2Penalty, setP2Penalty] = useState(false);

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    // Load High Score
    useEffect(() => {
        const loadHighScore = async () => {
            try {
                const saved = await AsyncStorage.getItem(HIGH_SCORE_KEY);
                if (saved) setHighScore(parseInt(saved, 10) || 0);
            } catch (_) {}
        };
        loadHighScore();
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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
        SoundService.playButtonClick();
        HapticService.impact('medium');
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
                    SoundService.playTick();
                }
                return prev - 1;
            });
        }, 1000);
    };

    const finishSoloGame = async () => {
        setSoloPhase('gameover');
        SoundService.playWinner();
        HapticService.celebration();

        // Calculate and save high score
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
        HapticService.selection();

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

        // Check if correct immediately
        const numVal = parseInt(newAnswerStr, 10);
        if (numVal === currentProblem.answer) {
            handleSoloCorrect();
        }
    };

    const handleSoloCorrect = () => {
        SoundService.playCorrect();
        HapticService.impact('medium');
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

        // Generate next problem
        setCurrentProblem(generateProblem(difficulty));
    };

    const handleSoloSubmit = () => {
        if (!inputAnswer || soloPhase !== 'playing') return;
        const numVal = parseInt(inputAnswer, 10);

        if (numVal === currentProblem.answer) {
            handleSoloCorrect();
        } else {
            // Wrong answer
            SoundService.playWrong();
            HapticService.notification('warning');
            triggerShake();
            setStreak(0);
            setTotalAnswered((prev) => prev + 1);
            setInputAnswer('');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 2-PLAYER DUEL LOGIC (Split-Screen)
    // ─────────────────────────────────────────────────────────────────────────────

    const startDuelGame = () => {
        SoundService.playButtonClick();
        HapticService.impact('medium');
        setGameMode('duel');
        setDuelPhase('playing');
        setDuelScores({ p1: 0, p2: 0 });
        setDuelWinner(null);
        setShowConfetti(false);
        setP1Penalty(false);
        setP2Penalty(false);

        nextDuelRound();
    };

    const nextDuelRound = () => {
        const prob = generateProblem(difficulty);
        const choices = generateChoices(prob.answer);
        setDuelProblem(prob);
        setDuelChoices(choices);
    };

    const handleDuelAnswer = (player, chosenValue) => {
        if (duelPhase !== 'playing') return;
        if (player === 'p1' && p1Penalty) return;
        if (player === 'p2' && p2Penalty) return;

        if (chosenValue === duelProblem.answer) {
            // Correct!
            SoundService.playCorrect();
            HapticService.impact('heavy');

            const newScores = {
                ...duelScores,
                [player]: duelScores[player] + 1,
            };
            setDuelScores(newScores);

            if (newScores[player] >= TARGET_DUEL_SCORE) {
                // Game Won!
                setDuelPhase('gameover');
                setDuelWinner(player === 'p1' ? (players[0]?.name || 'Player 1') : (players[1]?.name || 'Player 2'));
                SoundService.playWinner();
                HapticService.celebration();
                setShowConfetti(true);
            } else {
                nextDuelRound();
            }
        } else {
            // Wrong answer penalty!
            SoundService.playWrong();
            HapticService.notification('error');

            if (player === 'p1') {
                setP1Penalty(true);
                setTimeout(() => setP1Penalty(false), 900);
            } else {
                setP2Penalty(true);
                setTimeout(() => setP2Penalty(false), 900);
            }
        }
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
                            SPEED MENTAL MATH CHALLENGE
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
                                        SoundService.playButtonClick();
                                        HapticService.selection();
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
                        {/* Mode 1: Solo 60s Blitz */}
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

                        {/* Mode 2: 2-Player Split-Screen Duel */}
                        <TouchableOpacity
                            style={[styles.modeCard, { borderColor: `${COLORS.hotPink}66` }]}
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

                        <NeonText size={14} color="#9CA3AF" style={{ marginTop: 8 }}>TIME'S UP!</NeonText>
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
    // RENDER: 2-PLAYER SPLIT-SCREEN DUEL
    // ─────────────────────────────────────────────────────────────────────────────
    if (gameMode === 'duel') {
        const p1Name = players[0]?.name || 'Player 1';
        const p2Name = players[1]?.name || 'Player 2';

        return (
            <View style={styles.duelContainer}>
                <ConfettiEffect show={showConfetti} pieceCount={40} />

                {/* ─ TOP HALF: PLAYER 2 (ROTATED 180 DEG) ─ */}
                <View style={[styles.duelHalf, styles.duelTopHalf]}>
                    <View style={styles.duelPlayerBar}>
                        <NeonText size={13} weight="bold" color={COLORS.hotPink}>
                            {p2Name}
                        </NeonText>
                        <NeonText size={18} weight="bold" color={COLORS.hotPink} glow>
                            {duelScores.p2} / {TARGET_DUEL_SCORE}
                        </NeonText>
                    </View>

                    {duelPhase === 'playing' ? (
                        <>
                            <View style={styles.duelEquationWrap}>
                                <NeonText size={30} weight="bold" color="#FFF">
                                    {duelProblem?.display}
                                </NeonText>
                            </View>

                            <View style={styles.duelChoicesGrid}>
                                {duelChoices.map((choice, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.duelChoiceBtn, p2Penalty && styles.penaltyBtn]}
                                        onPress={() => handleDuelAnswer('p2', choice)}
                                        disabled={p2Penalty}
                                        activeOpacity={0.8}
                                    >
                                        <NeonText size={18} weight="bold" color={p2Penalty ? '#6B7280' : '#FFF'}>
                                            {choice}
                                        </NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={styles.duelWinnerBox}>
                            <NeonText size={22} weight="bold" color={COLORS.hotPink} glow>
                                {duelWinner === p2Name ? '🏆 YOU WIN!' : 'GAME OVER'}
                            </NeonText>
                        </View>
                    )}
                </View>

                {/* ─ CENTER DIVIDER ─ */}
                <View style={styles.duelDivider}>
                    <TouchableOpacity
                        style={styles.duelCloseBtn}
                        onPress={() => setGameMode('menu')}
                    >
                        <NeonText size={10} weight="bold" color="#9CA3AF">✕ EXIT</NeonText>
                    </TouchableOpacity>
                </View>

                {/* ─ BOTTOM HALF: PLAYER 1 (UPRIGHT) ─ */}
                <View style={[styles.duelHalf, styles.duelBottomHalf]}>
                    <View style={styles.duelPlayerBar}>
                        <NeonText size={13} weight="bold" color={COLORS.neonCyan}>
                            {p1Name}
                        </NeonText>
                        <NeonText size={18} weight="bold" color={COLORS.neonCyan} glow>
                            {duelScores.p1} / {TARGET_DUEL_SCORE}
                        </NeonText>
                    </View>

                    {duelPhase === 'playing' ? (
                        <>
                            <View style={styles.duelEquationWrap}>
                                <NeonText size={30} weight="bold" color="#FFF">
                                    {duelProblem?.display}
                                </NeonText>
                            </View>

                            <View style={styles.duelChoicesGrid}>
                                {duelChoices.map((choice, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.duelChoiceBtn, p1Penalty && styles.penaltyBtn]}
                                        onPress={() => handleDuelAnswer('p1', choice)}
                                        disabled={p1Penalty}
                                        activeOpacity={0.8}
                                    >
                                        <NeonText size={18} weight="bold" color={p1Penalty ? '#6B7280' : '#FFF'}>
                                            {choice}
                                        </NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={styles.duelWinnerBox}>
                            <NeonText size={22} weight="bold" color={COLORS.neonCyan} glow>
                                {duelWinner === p1Name ? '🏆 YOU WIN!' : 'GAME OVER'}
                            </NeonText>
                            <TouchableOpacity
                                style={styles.duelRematchBtn}
                                onPress={startDuelGame}
                            >
                                <NeonText size={12} weight="bold" color="#000">REMATCH 🔄</NeonText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return null;
};

const getStyles = (COLORS) => StyleSheet.create({
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
    // Duel Split Screen Styles
    duelContainer: {
        flex: 1,
        backgroundColor: '#05070e',
    },
    duelHalf: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    duelTopHalf: {
        transform: [{ rotate: '180deg' }],
        backgroundColor: 'rgba(255, 0, 127, 0.03)',
    },
    duelBottomHalf: {
        backgroundColor: 'rgba(0, 240, 255, 0.03)',
    },
    duelDivider: {
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    duelCloseBtn: {
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: '#1E293B',
    },
    duelPlayerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    duelEquationWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    duelChoicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    duelChoiceBtn: {
        width: '48%',
        height: 52,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    penaltyBtn: {
        opacity: 0.3,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: '#EF4444',
    },
    duelWinnerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    duelRematchBtn: {
        marginTop: 12,
        backgroundColor: COLORS.neonCyan,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
    },
});

export default LocalMathBlitzScreen;

