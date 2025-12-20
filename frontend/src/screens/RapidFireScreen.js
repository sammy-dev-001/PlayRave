import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
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
    const progressAnim = useRef(new Animated.Value(1)).current;

    const currentPlayer = players[currentPlayerIndex];

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
        setTimeLeft(QUESTION_TIME);
        setShowQuestion(true);
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
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={24} weight="bold" glow>
                    ⚡ RAPID FIRE
                </NeonText>
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

            {/* Timer Bar */}
            {isTimerRunning && (
                <View style={styles.timerContainer}>
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
                    <NeonText size={24} weight="bold" color={timeLeft <= 2 ? COLORS.hotPink : COLORS.white}>
                        {timeLeft}s
                    </NeonText>
                </View>
            )}

            {/* Question */}
            <View style={styles.questionContainer}>
                <NeonText size={28} weight="bold" style={styles.questionText} glow>
                    {currentQuestion}
                </NeonText>
            </View>

            {/* Actions */}
            {!isTimerRunning ? (
                <View style={styles.actions}>
                    <NeonButton
                        title="START TIMER"
                        onPress={startTimer}
                        style={styles.startBtn}
                    />
                    <NeonButton
                        title="SKIP QUESTION"
                        variant="secondary"
                        onPress={() => handleNext(false)}
                    />
                </View>
            ) : (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.answerBtn, styles.answeredBtn]}
                        onPress={() => handleNext(true)}
                    >
                        <NeonText size={40}>✓</NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                            ANSWERED!
                        </NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.answerBtn, styles.skippedBtn]}
                        onPress={() => handleNext(false)}
                    >
                        <NeonText size={40}>✗</NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.hotPink}>
                            SKIP
                        </NeonText>
                    </TouchableOpacity>
                </View>
            )}

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
        marginTop: 30,
        marginBottom: 15,
    },
    categoryBadge: {
        marginTop: 8,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    playerContainer: {
        alignItems: 'center',
        marginBottom: 15,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    timerBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    timerProgress: {
        height: '100%',
        borderRadius: 4,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 25,
        marginBottom: 15,
    },
    questionText: {
        textAlign: 'center',
        lineHeight: 36,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    startBtn: {
        flex: 1,
    },
    answerBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    answeredBtn: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderColor: COLORS.limeGlow,
    },
    skippedBtn: {
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderColor: COLORS.hotPink,
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
        minWidth: 70,
        alignItems: 'center',
    },
    endBtn: {
        marginTop: 'auto',
    }
});

export default RapidFireScreen;
