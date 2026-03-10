import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomQuestion } from '../data/rapidFirePrompts';
import { COLORS } from '../constants/theme';

const QUESTION_TIME = 5; // seconds per question

const RapidFireScreen = ({ route, navigation }) => {
    const { players, category = 'normal' } = route.params;
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(() => getRandomQuestion(category, []));
    const [usedQuestions, setUsedQuestions] = useState([currentQuestion]);
    const [roundNumber, setRoundNumber] = useState(1);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showQuestion, setShowQuestion] = useState(true);
    const [playerScores, setPlayerScores] = useState(() => {
        const scores = {};
        players.forEach(player => {
            scores[player.id] = 0;
        });
        return scores;
    });

    const timerRef = useRef(null);
    // Pulse animation for low time
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (timeLeft <= 3 && isTimerRunning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [timeLeft, isTimerRunning]);

    // Auto-start on new question
    useEffect(() => {
        startTimer();
    }, [currentQuestion]);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Time's up - auto skip
            handleNext(false);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isTimerRunning, timeLeft]);

    useEffect(() => {
        if (isTimerRunning) {
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: QUESTION_TIME * 1000,
                useNativeDriver: false
            }).start();
        }
    }, [isTimerRunning, currentQuestion]);

    const startTimer = () => {
        setIsTimerRunning(true);
        setTimeLeft(QUESTION_TIME);
    };

    const handleNext = (answered) => {
        setIsTimerRunning(false);

        if (answered) {
            setPlayerScores(prev => ({
                ...prev,
                [currentPlayer.id]: prev[currentPlayer.id] + 1
            }));
        }

        // Move to next player or question
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const newRound = nextPlayerIndex === 0;

        const newQuestion = getRandomQuestion(category, usedQuestions);
        setCurrentQuestion(newQuestion);
        setUsedQuestions([...usedQuestions, newQuestion]);
        setCurrentPlayerIndex(nextPlayerIndex);
        if (newRound) setRoundNumber(roundNumber + 1);
        // Timer will auto-start via useEffect on currentQuestion change
    };

    const getCategoryColor = () => {
        switch (category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="flash" size={22} color={COLORS.limeGlow} /><NeonText size={24} weight="bold" glow>RAPID FIRE</NeonText></View>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color="#888">
                    Round {roundNumber}
                </NeonText>
            </View>

            {/* Current Player */}
            <View style={styles.playerContainer}>
                <NeonText size={16} color={COLORS.neonCyan}>
                    ANSWERING NOW:
                </NeonText>
                <NeonText size={32} weight="bold" glow>
                    {currentPlayer.name}
                </NeonText>
            </View>

            {/* Timer and Question */}
            <View style={styles.gameArea}>
                <View style={styles.timerContainer}>
                    <Animated.Text style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: timeLeft <= 2 ? COLORS.hotPink : COLORS.white,
                        transform: [{ scale: pulseAnim }],
                        textShadowColor: timeLeft <= 2 ? COLORS.hotPink : COLORS.neonCyan,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 20
                    }}>
                        {timeLeft}
                    </Animated.Text>
                    <View style={styles.timerBar}>
                        <Animated.View
                            style={[
                                styles.timerProgress,
                                {
                                    width: progressWidth,
                                    backgroundColor: timeLeft <= 2 ? COLORS.hotPink : COLORS.limeGlow
                                }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.questionContainer}>
                    <NeonText size={32} weight="bold" style={styles.questionText} glow>
                        {currentQuestion}
                    </NeonText>
                </View>
            </View>

            {/* Actions - Always show buttons due to auto-start */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.answerBtn, styles.answeredBtn]}
                    onPress={() => handleNext(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="flash" size={50} color={COLORS.limeGlow} />
                    <NeonText size={20} weight="bold" color={COLORS.limeGlow}>
                        GOT IT!
                    </NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.answerBtn, styles.skippedBtn]}
                    onPress={() => handleNext(false)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="snow" size={50} color={COLORS.hotPink} />
                    <NeonText size={20} weight="bold" color={COLORS.hotPink}>
                        PASS
                    </NeonText>
                </TouchableOpacity>
            </View>

            {/* Scoreboard */}
            <View style={styles.scoreboard}>
                {players.map(player => (
                    <View key={player.id} style={styles.scoreItem}>
                        <NeonText size={14} weight={player.id === currentPlayer.id ? 'bold' : 'normal'}>
                            {player.name}
                        </NeonText>
                        <NeonText size={14} color={COLORS.limeGlow}>
                            {playerScores[player.id]}
                        </NeonText>
                    </View>
                ))}
            </View>

            <NeonButton
                title="END GAME"
                variant="secondary"
                onPress={() => navigation.navigate('LocalGameSelection', { players })}
                style={styles.endBtn}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    categoryBadge: {
        marginTop: 5,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    playerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    gameArea: {
        marginBottom: 20,
        alignItems: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    timerBar: {
        width: '80%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 10,
    },
    timerProgress: {
        height: '100%',
        borderRadius: 5,
    },
    questionContainer: {
        width: '100%',
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 20,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    questionText: {
        textAlign: 'center',
        lineHeight: 40,
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
        height: 140, // Fixed height for big buttons
    },
    answerBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    answeredBtn: {
        borderColor: COLORS.limeGlow,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    skippedBtn: {
        borderColor: COLORS.hotPink,
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    scoreboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 10,
    },
    scoreItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    endBtn: {
        marginTop: 10,
        marginBottom: 20
    }
});

export default RapidFireScreen;
