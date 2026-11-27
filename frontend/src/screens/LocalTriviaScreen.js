import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated, ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import SoundService from '../services/SoundService';
import { getRandomLocalQuestions } from '../data/localTriviaQuestions';

const BUZZER_COLORS = [
    '#00FFFF',
    '#FF007F',
    '#39FF14',
    '#B026FF',
    '#FFD700',
    '#FF6B35',
    '#00E5FF',
    '#FF3864',
];

const LocalTriviaScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { players = [], isSinglePlayer = false } = route.params;
    
    // Safety ref for cleanup
    const isMounted = useRef(true);
    
    // Game State
    const [questions] = useState(getRandomLocalQuestions(10));
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState({});
    const [gameState, setGameState] = useState('STARTING'); 
    const [timeLeft, setTimeLeft] = useState(10);
    const [buzzedPlayer, setBuzzedPlayer] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const timerRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const currentQuestion = questions[currentQuestionIndex];

    // Initialize scores
    useEffect(() => {
        isMounted.current = true;
        const initialScores = {};
        if (isSinglePlayer) {
            initialScores['Player 1'] = 0;
        } else {
            players.forEach(p => {
                initialScores[p.name || p.id] = 0;
            });
        }
        setScores(initialScores);
        startNextQuestion(0);

        return () => {
            isMounted.current = false;
        };
    }, []);

    const startNextQuestion = (index) => {
        if (!isMounted.current) return;
        
        if (index >= questions.length) {
            setGameState('FINISHED');
            return;
        }

        setCurrentQuestionIndex(index);
        setGameState('QUESTION');
        setBuzzedPlayer(null);
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setTimeLeft(isSinglePlayer ? 10 : 15);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    // Timer Logic
    useEffect(() => {
        if (gameState === 'QUESTION' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                if (!isMounted.current) return;
                
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleTimeOut();
                        return 0;
                    }
                    if (prev <= 3) SoundService.playTick();
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [gameState, timeLeft]);

    const handleTimeOut = () => {
        if (!isMounted.current) return;
        if (isSinglePlayer) {
            revealAnswer(null);
        } else {
            setGameState('RESULTS');
            setTimeout(() => {
                if (isMounted.current) startNextQuestion(currentQuestionIndex + 1);
            }, 3000);
        }
    };

    const handleBuzz = (playerName) => {
        if (gameState !== 'QUESTION') return;
        setBuzzedPlayer(playerName);
        setGameState('BUZZED');
        setTimeLeft(5); // Reset timer to 5 seconds for them to answer
        SoundService.play('pop');
    };

    const handleAnswerSelect = (index) => {
        if (gameState !== 'BUZZED' && !isSinglePlayer) return;
        if (isSinglePlayer && gameState !== 'QUESTION') return;

        revealAnswer(index);
    };

    const revealAnswer = (index) => {
        const isCorrect = index === currentQuestion.correctAnswer;
        setSelectedAnswer(index);
        setCorrectAnswer(currentQuestion.correctAnswer);
        setGameState('RESULTS');

        if (isCorrect) {
            SoundService.playCorrect();
            const playerKey = isSinglePlayer ? 'Player 1' : buzzedPlayer;
            setScores(prev => ({
                ...prev,
                [playerKey]: (prev[playerKey] || 0) + 10
            }));
        } else {
            SoundService.playWrong();
            // In 2-player head-to-head trivia, missed buzz awards points to the opponent
            if (!isSinglePlayer && buzzedPlayer && players.length === 2) {
                const otherPlayer = players.find(p => (p.name || p.id) !== buzzedPlayer);
                if (otherPlayer) {
                    const otherPlayerKey = otherPlayer.name || otherPlayer.id;
                    setScores(prev => ({
                        ...prev,
                        [otherPlayerKey]: (prev[otherPlayerKey] || 0) + 10
                    }));
                }
            }
        }

        // Auto-advance with safety check
        setTimeout(() => {
            if (isMounted.current) {
                startNextQuestion(currentQuestionIndex + 1);
            }
        }, 3000);
    };

    const renderBuzzerButton = (player, index) => {
        const playerKey = player.name || player.id || `Player ${index + 1}`;
        const color = BUZZER_COLORS[index % BUZZER_COLORS.length];
        const isActiveBuzzer = gameState === 'BUZZED' && buzzedPlayer === playerKey;

        return (
            <TouchableOpacity
                key={player.id || playerKey}
                style={[
                    styles.buzzer,
                    players.length > 4 && styles.buzzerCompact,
                    {
                        backgroundColor: isActiveBuzzer ? color + '40' : color + '20',
                        borderColor: isActiveBuzzer ? color : color + '80',
                    },
                ]}
                onPress={() => handleBuzz(playerKey)}
                disabled={gameState !== 'QUESTION'}
                activeOpacity={0.75}
            >
                <NeonText
                    size={players.length > 4 ? 13 : 15}
                    color={color}
                    weight="bold"
                    numberOfLines={1}
                    style={{ opacity: gameState === 'QUESTION' || isActiveBuzzer ? 1 : 0.45 }}
                >
                    {playerKey}
                </NeonText>
                <NeonText size={11} color={color} weight="bold" style={{ marginTop: 2, opacity: gameState === 'QUESTION' ? 1 : 0.75 }}>
                    {gameState === 'QUESTION' ? 'TAP TO BUZZ' : `${scores[playerKey] || 0} PTS`}
                </NeonText>
            </TouchableOpacity>
        );
    };

    if (gameState === 'FINISHED') {
        return (
            <NeonContainer showBackButton onBackPress={() => navigation.goBack()} scrollable>
                <View style={styles.center}>
                    <NeonText size={42} weight="bold" glow color={COLORS.neonCyan} variant="display">GAME OVER</NeonText>
                    <View style={styles.scoreBoard}>
                        {Object.entries(scores)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, score], i) => (
                                <View key={name} style={styles.scoreRow}>
                                    <NeonText size={20} color={i === 0 ? COLORS.limeGlow : COLORS.white}>
                                        {i === 0 ? '🏆 ' : `${i + 1}. `}{name}
                                    </NeonText>
                                    <NeonText size={20} weight="bold" color={i === 0 ? COLORS.limeGlow : COLORS.white} variant="arcade">
                                        {score}
                                    </NeonText>
                                </View>
                            ))}
                    </View>
                    <NeonButton 
                        title="PLAY AGAIN" 
                        onPress={() => navigation.replace('LocalTrivia', { players, isSinglePlayer })} 
                        style={{ marginTop: 32, width: 200 }}
                    />
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showBackButton onBackPress={() => navigation.goBack()}>
            <ScrollView 
                style={{ flex: 1, minHeight: 0 }}
                contentContainerStyle={[styles.scrollContent, { paddingTop: 12, paddingBottom: 16 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gameArea}>
                    <View style={styles.header}>
                        <NeonText size={16} color={COLORS.neonCyan}>
                            {currentQuestionIndex + 1} / {questions.length}
                        </NeonText>
                        <NeonText size={32} weight="bold" variant="arcade" color={timeLeft <= 3 ? COLORS.hotPink : COLORS.limeGlow}>
                            {timeLeft}s
                        </NeonText>
                        {isSinglePlayer && (
                            <NeonText size={16} color={COLORS.limeGlow} variant="arcade">SCORE: {scores['Player 1']}</NeonText>
                        )}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.quitButton}>
                            <Ionicons name="close" size={24} color={COLORS.error || '#FF5252'} />
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
                        <NeonText size={14} color={COLORS.textMuted} style={{ marginBottom: 10 }}>{currentQuestion.category}</NeonText>
                        <NeonText size={22} weight="bold" style={styles.questionText}>
                            {currentQuestion.question}
                        </NeonText>
                    </Animated.View>

                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            let variant = 'secondary';
                            if (gameState === 'RESULTS') {
                                if (index === correctAnswer) variant = 'success';
                                else if (index === selectedAnswer) variant = 'danger';
                            } else if (selectedAnswer === index) {
                                variant = 'primary';
                            }

                            return (
                                <NeonButton
                                    key={index}
                                    title={option}
                                    variant={variant}
                                    onPress={() => handleAnswerSelect(index)}
                                    disabled={gameState === 'RESULTS' || (gameState === 'QUESTION' && !isSinglePlayer)}
                                    style={styles.optionButton}
                                />
                            );
                        })}
                    </View>

                    {gameState === 'BUZZED' && (
                        <View style={styles.buzzedBanner}>
                            <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                {buzzedPlayer}&apos;s TURN! Choose your answer above
                            </NeonText>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Non-overlapping Buzzer Dock (supports 2-8 players cleanly) */}
            {!isSinglePlayer && (
                <View style={styles.buzzerDock}>
                    {players.map((p, idx) => renderBuzzerButton(p, idx))}
                </View>
            )}
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    gameArea: { padding: 20, zIndex: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    quitButton: { padding: 5 },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 25,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 25,
        alignItems: 'center',
    },
    questionText: { textAlign: 'center' },
    optionsContainer: { gap: 12 },
    optionButton: { width: '100%' },
    buzzerDock: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 10,
        paddingBottom: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    buzzer: {
        width: '48%',
        minHeight: 62,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    buzzerCompact: {
        minHeight: 50,
        paddingVertical: 5,
    },
    buzzedBanner: {
        marginTop: 14,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
    },
    scoreBoard: { width: '100%', marginTop: 40, gap: 15 },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 12
    }
});

export default LocalTriviaScreen;
