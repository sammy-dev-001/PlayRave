import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import { COLORS, SHADOWS } from '../constants/theme';
import { getRandomCategories } from '../data/speedCategories';

const SpeedCategoriesScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [categories] = useState(() => getRandomCategories(10, 'all'));
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState('ready'); // 'ready', 'playing', 'judging', 'results'
    const [countdown, setCountdown] = useState(10);
    const [scores, setScores] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {})
    );
    const [showWinner, setShowWinner] = useState(false);

    const timerRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(1)).current;

    const currentCategory = categories[currentCategoryIndex];
    const currentPlayer = players[currentPlayerIndex];

    // Timer logic
    useEffect(() => {
        if (phase === 'playing') {
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: 10000,
                useNativeDriver: false,
            }).start();

            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setPhase('judging');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]);

    const handleStart = () => {
        setCountdown(10);
        setPhase('playing');
    };

    const handleSuccess = () => {
        // Player successfully named 5 things
        if (timerRef.current) clearInterval(timerRef.current);

        // Award points based on time remaining
        const points = Math.max(5, countdown * 2); // 2 points per second remaining, min 5
        setScores(prev => ({
            ...prev,
            [currentPlayer.name]: prev[currentPlayer.name] + points
        }));

        setPhase('results');
    };

    const handleFail = () => {
        // Player failed to name 5 things
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('results');
    };

    const handleJudgeSuccess = () => {
        // Group judges the player succeeded
        const points = 10;
        setScores(prev => ({
            ...prev,
            [currentPlayer.name]: prev[currentPlayer.name] + points
        }));
        setPhase('results');
    };

    const handleJudgeFail = () => {
        // Group judges the player failed
        setPhase('results');
    };

    const handleNextTurn = () => {
        // Move to next player or next category
        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(currentPlayerIndex + 1);
        } else if (currentCategoryIndex < categories.length - 1) {
            setCurrentCategoryIndex(currentCategoryIndex + 1);
            setCurrentPlayerIndex(0);
        } else {
            // Game over
            setShowWinner(true);
            return;
        }
        setPhase('ready');
        setCountdown(10);
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Sort scores for leaderboard
    const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => b - a);

    // Winner Screen
    if (showWinner) {
        const winner = sortedScores[0];
        return (
            <NeonContainer>
                <RaveLights trigger={true} intensity="high" />
                <View style={styles.winnerContainer}>
                    <NeonText size={24}>🏆</NeonText>
                    <NeonText size={32} weight="bold" glow style={styles.winnerTitle}>
                        SPEED CHAMPION
                    </NeonText>
                    <NeonText size={48}>🏃⚡</NeonText>
                    <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                        {winner[0]}
                    </NeonText>
                    <NeonText size={24} color={COLORS.neonCyan}>
                        {winner[1]} points
                    </NeonText>

                    <View style={styles.finalScores}>
                        {sortedScores.map(([name, score], index) => (
                            <View key={name} style={styles.finalScoreRow}>
                                <NeonText size={16}>{index + 1}. {name}</NeonText>
                                <NeonText size={16} color={COLORS.neonCyan}>{score}</NeonText>
                            </View>
                        ))}
                    </View>

                    <NeonButton
                        title="PLAY AGAIN"
                        onPress={handleEndGame}
                        style={styles.playAgainBtn}
                    />
                </View>
            </NeonContainer>
        );
    }

    // Ready Phase
    if (phase === 'ready') {
        return (
            <NeonContainer showBackButton>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        ROUND {currentCategoryIndex + 1} / {categories.length}
                    </NeonText>
                    <NeonText size={28} weight="bold" glow>
                        🏃 SPEED CATEGORIES
                    </NeonText>
                </View>

                <View style={styles.playerTurnCard}>
                    <NeonText size={16} color="#888">IT'S YOUR TURN</NeonText>
                    <NeonText size={32} weight="bold" color={COLORS.limeGlow}>
                        {currentPlayer.name}
                    </NeonText>
                </View>

                <View style={styles.categoryCard}>
                    <NeonText size={64}>{currentCategory.emoji}</NeonText>
                    <NeonText size={14} color="#888" style={styles.challengeLabel}>
                        NAME 5...
                    </NeonText>
                    <NeonText size={24} weight="bold" style={styles.categoryText}>
                        {currentCategory.category}
                    </NeonText>
                    <View style={styles.difficultyBadge}>
                        <NeonText size={12} color={
                            currentCategory.difficulty === 'easy' ? COLORS.limeGlow :
                                currentCategory.difficulty === 'medium' ? COLORS.neonCyan :
                                    currentCategory.difficulty === 'hard' ? COLORS.hotPink :
                                        COLORS.electricPurple
                        }>
                            {currentCategory.difficulty.toUpperCase()}
                        </NeonText>
                    </View>
                </View>

                <NeonText size={16} style={styles.instruction}>
                    You have 10 seconds to name 5 things!
                </NeonText>

                <NeonButton
                    title="I'M READY - START!"
                    onPress={handleStart}
                    style={styles.startBtn}
                />

                {/* Scoreboard */}
                <View style={styles.miniScoreboard}>
                    {sortedScores.slice(0, 3).map(([name, score], index) => (
                        <View key={name} style={styles.miniScoreRow}>
                            <NeonText size={12} color={index === 0 ? COLORS.limeGlow : '#888'}>
                                {index + 1}. {name}: {score}
                            </NeonText>
                        </View>
                    ))}
                </View>
            </NeonContainer>
        );
    }

    // Playing Phase
    if (phase === 'playing') {
        const progressWidth = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
        });

        return (
            <NeonContainer>
                <View style={styles.playingHeader}>
                    <NeonText size={64}>{currentCategory.emoji}</NeonText>
                    <NeonText size={20} weight="bold" style={styles.playingCategory}>
                        {currentCategory.category}
                    </NeonText>
                </View>

                <View style={styles.timerContainer}>
                    <NeonText
                        size={100}
                        weight="bold"
                        color={countdown <= 3 ? COLORS.hotPink : COLORS.neonCyan}
                        glow
                    >
                        {countdown}
                    </NeonText>
                </View>

                <View style={styles.progressContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressWidth,
                                backgroundColor: countdown <= 3 ? COLORS.hotPink : COLORS.limeGlow
                            }
                        ]}
                    />
                </View>

                <View style={styles.playingButtons}>
                    <TouchableOpacity style={styles.successBtn} onPress={handleSuccess}>
                        <NeonText size={48}>✅</NeonText>
                        <NeonText size={14} color={COLORS.limeGlow}>GOT 5!</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.failBtn} onPress={handleFail}>
                        <NeonText size={48}>❌</NeonText>
                        <NeonText size={14} color={COLORS.hotPink}>FAILED</NeonText>
                    </TouchableOpacity>
                </View>
            </NeonContainer>
        );
    }

    // Judging Phase (when timer runs out)
    if (phase === 'judging') {
        return (
            <NeonContainer>
                <View style={styles.judgingContainer}>
                    <NeonText size={32} weight="bold" glow>
                        ⏰ TIME'S UP!
                    </NeonText>

                    <NeonText size={20} style={styles.judgingQuestion}>
                        Did {currentPlayer.name} name 5 {currentCategory.category}?
                    </NeonText>

                    <View style={styles.judgingButtons}>
                        <NeonButton
                            title="✓ YES, THEY DID!"
                            onPress={handleJudgeSuccess}
                            style={styles.judgeBtn}
                        />
                        <NeonButton
                            title="✗ NOPE, FAILED"
                            onPress={handleJudgeFail}
                            variant="secondary"
                            style={styles.judgeBtn}
                        />
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // Results Phase
    if (phase === 'results') {
        const earnedPoints = scores[currentPlayer.name] -
            (sortedScores.find(([name]) => name === currentPlayer.name)?.[1] || 0);

        return (
            <NeonContainer>
                <View style={styles.resultsContainer}>
                    <NeonText size={48}>
                        {earnedPoints > 0 ? '🎉' : '😅'}
                    </NeonText>
                    <NeonText size={24} weight="bold" style={styles.resultsTitle}>
                        {earnedPoints > 0 ? 'WELL DONE!' : 'BETTER LUCK NEXT TIME!'}
                    </NeonText>

                    <View style={styles.pointsEarned}>
                        <NeonText size={48} weight="bold" color={COLORS.limeGlow}>
                            +{scores[currentPlayer.name]}
                        </NeonText>
                        <NeonText size={16} color="#888">points for {currentPlayer.name}</NeonText>
                    </View>

                    <NeonButton
                        title={currentCategoryIndex < categories.length - 1 || currentPlayerIndex < players.length - 1
                            ? "NEXT TURN"
                            : "SEE FINAL SCORES"}
                        onPress={handleNextTurn}
                        style={styles.nextBtn}
                    />
                </View>
            </NeonContainer>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    playerTurnCard: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        marginBottom: 20,
    },
    categoryCard: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        marginBottom: 20,
    },
    challengeLabel: {
        marginTop: 10,
    },
    categoryText: {
        marginTop: 5,
        textAlign: 'center',
    },
    difficultyBadge: {
        marginTop: 15,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    instruction: {
        textAlign: 'center',
        marginBottom: 20,
    },
    startBtn: {
        marginBottom: 20,
    },
    miniScoreboard: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    miniScoreRow: {
        paddingVertical: 3,
    },
    playingHeader: {
        alignItems: 'center',
        marginTop: 40,
    },
    playingCategory: {
        marginTop: 10,
        textAlign: 'center',
    },
    timerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        marginHorizontal: 20,
        marginBottom: 30,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 5,
    },
    playingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 40,
    },
    successBtn: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        minWidth: 120,
    },
    failBtn: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        minWidth: 120,
    },
    judgingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    judgingQuestion: {
        marginVertical: 30,
        textAlign: 'center',
    },
    judgingButtons: {
        width: '100%',
        gap: 15,
    },
    judgeBtn: {
        marginVertical: 0,
    },
    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    resultsTitle: {
        marginTop: 15,
    },
    pointsEarned: {
        alignItems: 'center',
        marginVertical: 30,
    },
    nextBtn: {
        minWidth: 200,
    },
    winnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    winnerTitle: {
        marginVertical: 20,
    },
    finalScores: {
        width: '100%',
        marginTop: 30,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    finalScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    playAgainBtn: {
        marginTop: 30,
    }
});

export default SpeedCategoriesScreen;
