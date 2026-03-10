import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomQuestion } from '../data/wouldYouRatherQuestions';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const WouldYouRatherScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [currentQuestion, setCurrentQuestion] = useState(getRandomQuestion());
    const [usedQuestions, setUsedQuestions] = useState([currentQuestion.id]);
    const [votes, setVotes] = useState({ A: [], B: [] });
    const [showResults, setShowResults] = useState(false);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [selectedOption, setSelectedOption] = useState(null);
    const [streaks, setStreaks] = useState({}); // Track unanimous streaks

    // Animations
    const cardASlide = useRef(new Animated.Value(-width)).current;
    const cardBSlide = useRef(new Animated.Value(width)).current;
    const vsScale = useRef(new Animated.Value(0)).current;
    const vsPulse = useRef(new Animated.Value(1)).current;
    const playerBounce = useRef(new Animated.Value(0)).current;
    const resultBarA = useRef(new Animated.Value(0)).current;
    const resultBarB = useRef(new Animated.Value(0)).current;
    const selectFlash = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    const currentPlayer = players[currentPlayerIndex];

    // Entrance animation
    useEffect(() => {
        animateEntrance();
    }, [currentQuestion]);

    // Player bounce animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(playerBounce, {
                    toValue: -8,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(playerBounce, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // VS pulse animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(vsPulse, {
                    toValue: 1.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(vsPulse, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const animateEntrance = () => {
        cardASlide.setValue(-width);
        cardBSlide.setValue(width);
        vsScale.setValue(0);
        fadeIn.setValue(0);

        Animated.parallel([
            Animated.spring(cardASlide, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(cardBSlide, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
                delay: 150,
            }),
            Animated.spring(vsScale, {
                toValue: 1,
                tension: 80,
                friction: 6,
                useNativeDriver: true,
                delay: 300,
            }),
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateResults = () => {
        const totalVotes = votes.A.length + votes.B.length;
        const percentA = totalVotes > 0 ? votes.A.length / totalVotes : 0;
        const percentB = totalVotes > 0 ? votes.B.length / totalVotes : 0;

        resultBarA.setValue(0);
        resultBarB.setValue(0);
        fadeIn.setValue(0);

        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(resultBarA, {
                toValue: percentA,
                duration: 1000,
                useNativeDriver: false,
            }),
            Animated.timing(resultBarB, {
                toValue: percentB,
                duration: 1000,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handleVote = (option) => {
        setSelectedOption(option);

        // Fade out the entire screen, then update state, then fade back in
        Animated.timing(fadeIn, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            const newVotes = { ...votes };
            newVotes[option].push(currentPlayer.name);
            setVotes(newVotes);
            setSelectedOption(null);

            if (currentPlayerIndex < players.length - 1) {
                setCurrentPlayerIndex(currentPlayerIndex + 1);
                // Fade in + slide cards for next player
                animateEntrance();
            } else {
                // Check for unanimous vote
                const newStreaks = { ...streaks };
                if (newVotes.A.length === 0 || newVotes.B.length === 0) {
                    newStreaks.unanimous = (newStreaks.unanimous || 0) + 1;
                } else {
                    newStreaks.unanimous = 0;
                }
                setStreaks(newStreaks);
                setShowResults(true);
                setTimeout(() => animateResults(), 100);
            }
        });
    };

    const handleNextQuestion = () => {
        const nextQuestion = getRandomQuestion(usedQuestions);
        setCurrentQuestion(nextQuestion);
        setUsedQuestions([...usedQuestions, nextQuestion.id]);
        setVotes({ A: [], B: [] });
        setShowResults(false);
        setCurrentPlayerIndex(0);
        setQuestionNumber(questionNumber + 1);
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Get reaction label based on vote split
    const getReactionLabel = () => {
        const total = votes.A.length + votes.B.length;
        if (total === 0) return 'WAITING...';
        const percentA = (votes.A.length / total) * 100;
        if (percentA === 100 || percentA === 0) return 'UNANIMOUS!';
        if (percentA >= 80 || percentA <= 20) return 'LANDSLIDE!';
        if (percentA >= 60 || percentA <= 40) return 'CLOSE CALL!';
        return 'SPLIT DECISION!';
    };

    // Results Screen
    if (showResults) {
        const totalVotes = votes.A.length + votes.B.length;
        const percentA = totalVotes > 0 ? Math.round((votes.A.length / totalVotes) * 100) : 0;
        const percentB = totalVotes > 0 ? Math.round((votes.B.length / totalVotes) * 100) : 0;
        const winnerIsA = votes.A.length >= votes.B.length;

        return (
            <NeonContainer scrollable>
                <Animated.View style={{ opacity: fadeIn }}>
                    {/* Reaction Header */}
                    <View style={styles.reactionHeader}>
                        <NeonText size={32} weight="bold" glow>
                            {getReactionLabel()}
                        </NeonText>
                    </View>

                    {/* Visual Vote Bar */}
                    <View style={styles.voteBarWrapper}>
                        <View style={styles.voteBarOuter}>
                            <Animated.View style={[
                                styles.voteBarFillA,
                                {
                                    width: resultBarA.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    })
                                }
                            ]}>
                                <NeonText size={18} weight="bold" color="#000">
                                    {percentA}%
                                </NeonText>
                            </Animated.View>
                            <Animated.View style={[
                                styles.voteBarFillB,
                                {
                                    width: resultBarB.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    })
                                }
                            ]}>
                                <NeonText size={18} weight="bold" color="#000">
                                    {percentB}%
                                </NeonText>
                            </Animated.View>
                        </View>
                    </View>

                    {/* Option A Result */}
                    <View style={[
                        styles.resultCard,
                        { borderColor: COLORS.neonCyan },
                        winnerIsA && styles.resultCardWinner
                    ]}>
                        <View style={styles.resultCardHeader}>
                            <View style={styles.optionBadge}><NeonText size={16} weight="bold" color="#000">A</NeonText></View>
                            <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                {currentQuestion.optionA}
                            </NeonText>
                            {winnerIsA && (
                                <Ionicons name="trophy" size={18} color={COLORS.limeGlow} />
                            )}
                        </View>
                        <View style={styles.votersList}>
                            {votes.A.length > 0 ? (
                                votes.A.map((name, i) => (
                                    <View key={i} style={styles.voterChip}>
                                        <NeonText size={12} color={COLORS.neonCyan}>{name}</NeonText>
                                    </View>
                                ))
                            ) : (
                                <NeonText size={14} color="#555">Nobody chose this</NeonText>
                            )}
                        </View>
                    </View>

                    {/* VS Divider */}
                    <View style={styles.resultDivider}>
                        <View style={styles.dividerLine} />
                        <NeonText size={16} weight="bold" color="#555">VS</NeonText>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Option B Result */}
                    <View style={[
                        styles.resultCard,
                        { borderColor: COLORS.hotPink },
                        !winnerIsA && styles.resultCardWinnerB
                    ]}>
                        <View style={styles.resultCardHeader}>
                            <View style={[styles.optionBadge, { backgroundColor: COLORS.hotPink }]}><NeonText size={16} weight="bold" color="#000">B</NeonText></View>
                            <NeonText size={18} weight="bold" color={COLORS.hotPink}>
                                {currentQuestion.optionB}
                            </NeonText>
                            {!winnerIsA && (
                                <Ionicons name="trophy" size={18} color={COLORS.limeGlow} />
                            )}
                        </View>
                        <View style={styles.votersList}>
                            {votes.B.length > 0 ? (
                                votes.B.map((name, i) => (
                                    <View key={i} style={[styles.voterChip, { borderColor: COLORS.hotPink }]}>
                                        <NeonText size={12} color={COLORS.hotPink}>{name}</NeonText>
                                    </View>
                                ))
                            ) : (
                                <NeonText size={14} color="#555">Nobody chose this</NeonText>
                            )}
                        </View>
                    </View>

                    {/* Streak Banner */}
                    {streaks.unanimous > 1 && (
                        <View style={styles.streakBanner}>
                            <NeonText size={14} color={COLORS.limeGlow} weight="bold">
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="flame" size={16} color={COLORS.limeGlow} /><NeonText size={14} color={COLORS.limeGlow} weight="bold">{streaks.unanimous} unanimous streak!</NeonText></View>
                            </NeonText>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion} activeOpacity={0.7}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="flash" size={18} color="#000" /><NeonText size={18} weight="bold" color="#000">NEXT QUESTION</NeonText></View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.endGameBtn} onPress={handleEndGame} activeOpacity={0.7}>
                            <NeonText size={14} color="#888">
                                End Game
                            </NeonText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </NeonContainer >
        );
    }

    // Voting Screen
    return (
        <NeonContainer>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeIn }]}>
                <NeonText size={12} color={COLORS.hotPink}>
                    QUESTION #{questionNumber}
                </NeonText>
                <NeonText size={22} weight="bold" glow>
                    WOULD YOU RATHER
                </NeonText>
            </Animated.View>

            {/* Player Turn Card */}
            <Animated.View style={[
                styles.playerCard,
                { transform: [{ translateY: playerBounce }] }
            ]}>
                <NeonText size={12} color="#888">PASS TO</NeonText>
                <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow>
                    {currentPlayer.name}
                </NeonText>
                <View style={styles.playerDots}>
                    {players.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.playerDot,
                                i < currentPlayerIndex && styles.playerDotDone,
                                i === currentPlayerIndex && styles.playerDotActive,
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>

            {/* Option Cards */}
            <View style={styles.optionsWrapper}>
                {/* Option A */}
                <Animated.View style={{ transform: [{ translateX: cardASlide }] }}>
                    <TouchableOpacity
                        style={[
                            styles.choiceCard,
                            styles.choiceCardA,
                            selectedOption === 'A' && styles.choiceCardSelected
                        ]}
                        onPress={() => handleVote('A')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.choiceLabel}>
                            <View style={styles.optionBadge}><NeonText size={16} weight="bold" color="#000">A</NeonText></View>
                        </View>
                        <NeonText size={18} weight="bold" color="#fff" style={styles.choiceText}>
                            {currentQuestion.optionA}
                        </NeonText>
                        <View style={styles.choiceGlow} />
                    </TouchableOpacity>
                </Animated.View>

                {/* VS Badge */}
                <Animated.View style={[
                    styles.vsBadge,
                    {
                        transform: [
                            { scale: Animated.multiply(vsScale, vsPulse) }
                        ]
                    }
                ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="flash" size={18} color="#fff" /><NeonText size={20} weight="bold" color="#fff">VS</NeonText><Ionicons name="flash" size={18} color="#fff" /></View>
                </Animated.View>

                {/* Option B */}
                <Animated.View style={{ transform: [{ translateX: cardBSlide }] }}>
                    <TouchableOpacity
                        style={[
                            styles.choiceCard,
                            styles.choiceCardB,
                            selectedOption === 'B' && styles.choiceCardSelected
                        ]}
                        onPress={() => handleVote('B')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.choiceLabelB}>
                            <View style={[styles.optionBadge, { backgroundColor: COLORS.hotPink }]}><NeonText size={16} weight="bold" color="#000">B</NeonText></View>
                        </View>
                        <NeonText size={18} weight="bold" color="#fff" style={styles.choiceText}>
                            {currentQuestion.optionB}
                        </NeonText>
                        <View style={styles.choiceGlowB} />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* End Game */}
            <TouchableOpacity style={styles.endGameBtnSmall} onPress={handleEndGame} activeOpacity={0.7}>
                <NeonText size={12} color="#555">End Game</NeonText>
            </TouchableOpacity>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 15,
    },
    // Player Turn
    playerCard: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(198, 255, 74, 0.08)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        marginBottom: 20,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    playerDots: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 10,
    },
    playerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    playerDotDone: {
        backgroundColor: COLORS.limeGlow,
    },
    playerDotActive: {
        backgroundColor: COLORS.limeGlow,
        width: 20,
        borderRadius: 4,
        shadowColor: COLORS.limeGlow,
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    // Choice Cards
    optionsWrapper: {
        flex: 1,
        justifyContent: 'center',
        gap: 0,
    },
    choiceCard: {
        borderRadius: 20,
        padding: 25,
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    choiceCardA: {
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    choiceCardB: {
        backgroundColor: 'rgba(255, 63, 164, 0.12)',
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    choiceCardSelected: {
        transform: [{ scale: 0.95 }],
        opacity: 0.7,
    },
    choiceLabel: {
        position: 'absolute',
        top: 10,
        left: 15,
    },
    choiceLabelB: {
        position: 'absolute',
        top: 10,
        left: 15,
    },
    choiceText: {
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 10,
    },
    choiceGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.neonCyan,
        opacity: 0.06,
    },
    choiceGlowB: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.hotPink,
        opacity: 0.06,
    },
    // VS Badge
    vsBadge: {
        alignSelf: 'center',
        backgroundColor: COLORS.electricPurple,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginVertical: -10,
        zIndex: 10,
        shadowColor: COLORS.electricPurple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    // Results Screen
    reactionHeader: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    voteBarWrapper: {
        marginBottom: 20,
    },
    voteBarOuter: {
        flexDirection: 'row',
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    voteBarFillA: {
        backgroundColor: COLORS.neonCyan,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 40,
    },
    voteBarFillB: {
        backgroundColor: COLORS.hotPink,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 40,
    },
    resultCard: {
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 2,
    },
    resultCardWinner: {
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    resultCardWinnerB: {
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    resultCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    votersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    voterChip: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
    },
    resultDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    streakBanner: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 12,
        marginTop: 12,
    },
    actions: {
        gap: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    nextQuestionBtn: {
        backgroundColor: COLORS.limeGlow,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    endGameBtn: {
        paddingVertical: 10,
    },
    endGameBtnSmall: {
        alignSelf: 'center',
        paddingVertical: 8,
        marginTop: 10,
    },
    optionBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.neonCyan,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default WouldYouRatherScreen;
