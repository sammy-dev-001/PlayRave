import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import SoundService from '../services/SoundService';
import { getRandomLocalQuestions } from '../data/localTriviaQuestions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LocalTriviaScreen = ({ route, navigation }) => {
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
            useNativeDriver: true,
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
        clearInterval(timerRef.current);
        setBuzzedPlayer(playerName);
        setGameState('BUZZED');
        SoundService.playClick();
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
            SoundService.playSuccess();
            const playerKey = isSinglePlayer ? 'Player 1' : buzzedPlayer;
            setScores(prev => ({
                ...prev,
                [playerKey]: (prev[playerKey] || 0) + 10
            }));
        } else {
            SoundService.playError();
        }

        // Auto-advance with safety check
        setTimeout(() => {
            if (isMounted.current) {
                startNextQuestion(currentQuestionIndex + 1);
            }
        }, 3000);
    };

    const renderBuzzerArea = (playerName, color, position) => {
        if (isSinglePlayer) return null;

        return (
            <TouchableOpacity
                style={[styles.buzzer, { backgroundColor: color + '15', borderColor: color + '40' }, styles[position]]}
                onPress={() => handleBuzz(playerName)}
                disabled={gameState !== 'QUESTION'}
            >
                <NeonText size={18} color={color} weight="bold" style={{ opacity: 0.6 }}>{playerName}</NeonText>
                <NeonText size={12} color={color} style={{ opacity: 0.6 }}>{scores[playerName]} PTS</NeonText>
            </TouchableOpacity>
        );
    };

    if (gameState === 'FINISHED') {
        return (
            <NeonContainer showBackButton onBackPress={() => navigation.goBack()}>
                <View style={styles.center}>
                    <NeonText size={48} weight="bold" glow color={COLORS.neonCyan}>GAME OVER</NeonText>
                    <View style={styles.scoreBoard}>
                        {Object.entries(scores)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, score], i) => (
                                <View key={name} style={styles.scoreRow}>
                                    <NeonText size={24} color={i === 0 ? COLORS.limeGlow : '#FFF'}>
                                        {i === 0 ? '🏆 ' : ''}{name}
                                    </NeonText>
                                    <NeonText size={24} weight="bold" color={i === 0 ? COLORS.limeGlow : '#FFF'}>
                                        {score}
                                    </NeonText>
                                </View>
                            ))}
                    </View>
                    <NeonButton 
                        title="PLAY AGAIN" 
                        onPress={() => navigation.replace('LocalTrivia', { players, isSinglePlayer })} 
                        style={{ marginTop: 40, width: 200 }}
                    />
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer>
            {/* Buzzer Areas for Local Multi-player */}
            {!isSinglePlayer && (
                <View style={StyleSheet.absoluteFill}>
                    {players[0] && renderBuzzerArea(players[0].name, COLORS.neonCyan, 'topLeft')}
                    {players[1] && renderBuzzerArea(players[1].name, COLORS.hotPink, 'topRight')}
                    {players[2] && renderBuzzerArea(players[2].name, COLORS.limeGlow, 'bottomLeft')}
                    {players[3] && renderBuzzerArea(players[3].name, COLORS.electricPurple, 'bottomRight')}
                </View>
            )}

            <View style={styles.gameArea}>
                <View style={styles.header}>
                    <NeonText size={16} color={COLORS.neonCyan}>
                        {currentQuestionIndex + 1} / {questions.length}
                    </NeonText>
                    <NeonText size={32} weight="bold" color={timeLeft <= 3 ? COLORS.hotPink : COLORS.limeGlow}>
                        {timeLeft}s
                    </NeonText>
                    {isSinglePlayer && (
                        <NeonText size={16} color={COLORS.limeGlow}>SCORE: {scores['Player 1']}</NeonText>
                    )}
                </View>

                <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
                    <NeonText size={14} color="#888" style={{ marginBottom: 10 }}>{currentQuestion.category}</NeonText>
                    <NeonText size={24} weight="bold" style={styles.questionText}>
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
                    <View style={styles.buzzedOverlay}>
                        <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                            {buzzedPlayer}'s TURN!
                        </NeonText>
                        <NeonText size={14} color="#AAA">Choose your answer now</NeonText>
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    gameArea: { flex: 1, padding: 20, justifyContent: 'center', zIndex: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    questionText: { textAlign: 'center' },
    optionsContainer: { gap: 12 },
    optionButton: { width: '100%' },
    buzzer: {
        position: 'absolute',
        width: SCREEN_WIDTH / 2,
        height: SCREEN_HEIGHT / 4,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    topLeft: { top: 0, left: 0, borderBottomRightRadius: 40 },
    topRight: { top: 0, right: 0, borderBottomLeftRadius: 40 },
    bottomLeft: { bottom: 0, left: 0, borderTopRightRadius: 40 },
    bottomRight: { bottom: 0, right: 0, borderTopLeftRadius: 40 },
    buzzedOverlay: {
        position: 'absolute',
        top: '40%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.95)',
        padding: 25,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        zIndex: 100,
        shadowColor: COLORS.neonCyan,
        shadowRadius: 15,
        shadowOpacity: 0.5
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
