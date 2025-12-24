import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Keyboard
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import { COLORS, SHADOWS } from '../constants/theme';
import { getRandomCaptionPrompts } from '../data/captionPrompts';

const CaptionThisScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [prompts] = useState(() => getRandomCaptionPrompts(5));
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState('caption'); // 'caption', 'vote', 'results'
    const [caption, setCaption] = useState('');
    const [captions, setCaptions] = useState([]); // All captions for current prompt
    const [votes, setVotes] = useState({}); // {playerId: votedCaptionIndex}
    const [scores, setScores] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {})
    );
    const [showWinner, setShowWinner] = useState(false);
    const [countdown, setCountdown] = useState(30);

    const currentPrompt = prompts[currentPromptIndex];
    const currentPlayer = players[currentPlayerIndex];

    // Countdown timer for caption phase
    useEffect(() => {
        if (phase !== 'caption') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Auto-submit empty caption if time runs out
                    handleSubmitCaption();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, currentPlayerIndex]);

    const handleSubmitCaption = () => {
        Keyboard.dismiss();

        // Save caption
        const newCaptions = [...captions, {
            playerName: currentPlayer.name,
            text: caption.trim() || "...",
            playerIndex: currentPlayerIndex
        }];
        setCaptions(newCaptions);
        setCaption('');
        setCountdown(30);

        // Move to next player or voting phase
        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(currentPlayerIndex + 1);
        } else {
            // All players submitted, start voting
            setPhase('vote');
        }
    };

    const handleVote = (captionIndex) => {
        // Can't vote for your own caption
        const votedCaption = captions[captionIndex];
        if (votedCaption.playerName === currentPlayer.name) return;

        setVotes(prev => ({
            ...prev,
            [currentPlayer.name]: captionIndex
        }));

        // Check if all players have voted
        const totalVotes = Object.keys(votes).length + 1;
        if (totalVotes >= players.length) {
            // Calculate scores and show results
            calculateResults();
        } else {
            // Move to next voter
            const nextVoterIndex = players.findIndex(p => !votes[p.name] && p.name !== currentPlayer.name);
            if (nextVoterIndex >= 0) {
                setCurrentPlayerIndex(nextVoterIndex);
            } else {
                calculateResults();
            }
        }
    };

    const calculateResults = () => {
        // Count votes for each caption
        const voteCounts = captions.map(() => 0);
        Object.values(votes).forEach(index => {
            voteCounts[index]++;
        });

        // Award points (3 per vote)
        const newScores = { ...scores };
        captions.forEach((c, index) => {
            newScores[c.playerName] += voteCounts[index] * 3;
        });
        setScores(newScores);
        setPhase('results');
    };

    const handleNextRound = () => {
        if (currentPromptIndex < prompts.length - 1) {
            setCurrentPromptIndex(currentPromptIndex + 1);
            setCurrentPlayerIndex(0);
            setCaptions([]);
            setVotes({});
            setPhase('caption');
            setCountdown(30);
        } else {
            // Game over - show final scores
            setShowWinner(true);
        }
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Sort scores for leaderboard
    const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => b - a);

    // Final winner screen
    if (showWinner) {
        const winner = sortedScores[0];
        return (
            <NeonContainer>
                <RaveLights trigger={true} intensity="high" />
                <View style={styles.winnerContainer}>
                    <NeonText size={24}>🏆</NeonText>
                    <NeonText size={32} weight="bold" glow style={styles.winnerTitle}>
                        CAPTION CHAMPION
                    </NeonText>
                    <NeonText size={48}>📸</NeonText>
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

    // Caption Phase
    if (phase === 'caption') {
        return (
            <NeonContainer showBackButton>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        ROUND {currentPromptIndex + 1} of {prompts.length}
                    </NeonText>
                    <NeonText size={24} weight="bold" glow>
                        📸 CAPTION THIS
                    </NeonText>
                </View>

                <View style={styles.promptCard}>
                    <NeonText size={64}>{currentPrompt.emoji}</NeonText>
                    <NeonText size={18} style={styles.promptText}>
                        {currentPrompt.description}
                    </NeonText>
                </View>

                <View style={styles.playerTurn}>
                    <NeonText size={16}>
                        {currentPlayer.name}'s turn
                    </NeonText>
                    <View style={styles.timer}>
                        <NeonText
                            size={24}
                            weight="bold"
                            color={countdown <= 10 ? COLORS.hotPink : COLORS.neonCyan}
                        >
                            {countdown}s
                        </NeonText>
                    </View>
                </View>

                <TextInput
                    style={styles.captionInput}
                    placeholder="Write your caption..."
                    placeholderTextColor="#666"
                    value={caption}
                    onChangeText={setCaption}
                    maxLength={100}
                    multiline
                />

                <NeonButton
                    title="SUBMIT CAPTION"
                    onPress={handleSubmitCaption}
                    disabled={!caption.trim()}
                />
            </NeonContainer>
        );
    }

    // Voting Phase
    if (phase === 'vote') {
        return (
            <NeonContainer showBackButton>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.limeGlow}>VOTING TIME</NeonText>
                    <NeonText size={24} weight="bold" glow>
                        PICK THE BEST CAPTION!
                    </NeonText>
                </View>

                <View style={styles.promptCardSmall}>
                    <NeonText size={32}>{currentPrompt.emoji}</NeonText>
                    <NeonText size={14} color="#888">{currentPrompt.description}</NeonText>
                </View>

                <NeonText size={16} style={styles.voterName}>
                    {currentPlayer.name}, vote for your favorite:
                </NeonText>

                <FlatList
                    data={captions}
                    keyExtractor={(item, index) => String(index)}
                    renderItem={({ item, index }) => {
                        const isOwn = item.playerName === currentPlayer.name;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.captionOption,
                                    isOwn && styles.ownCaption
                                ]}
                                onPress={() => handleVote(index)}
                                disabled={isOwn}
                            >
                                <NeonText size={16}>"{item.text}"</NeonText>
                                {isOwn && (
                                    <NeonText size={10} color="#555">(your caption)</NeonText>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.captionList}
                />
            </NeonContainer>
        );
    }

    // Results Phase
    if (phase === 'results') {
        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.limeGlow}>RESULTS</NeonText>
                    <NeonText size={24} weight="bold" glow>
                        THE WINNING CAPTION!
                    </NeonText>
                </View>

                <View style={styles.promptCardSmall}>
                    <NeonText size={32}>{currentPrompt.emoji}</NeonText>
                </View>

                <FlatList
                    data={captions}
                    keyExtractor={(item, index) => String(index)}
                    renderItem={({ item, index }) => {
                        const voteCount = Object.values(votes).filter(v => v === index).length;
                        const isWinner = voteCount === Math.max(...Object.values(votes).map((v, i) =>
                            Object.values(votes).filter(x => x === i).length
                        ));

                        return (
                            <View style={[
                                styles.resultCaption,
                                isWinner && voteCount > 0 && styles.winningCaption
                            ]}>
                                <NeonText size={16}>"{item.text}"</NeonText>
                                <View style={styles.resultMeta}>
                                    <NeonText size={12} color={COLORS.neonCyan}>
                                        - {item.playerName}
                                    </NeonText>
                                    <NeonText size={14} color={COLORS.limeGlow}>
                                        {voteCount} votes (+{voteCount * 3})
                                    </NeonText>
                                </View>
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.captionList}
                />

                <NeonButton
                    title={currentPromptIndex < prompts.length - 1 ? "NEXT ROUND" : "SEE FINAL SCORES"}
                    onPress={handleNextRound}
                />
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
    promptCard: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        marginBottom: 20,
    },
    promptCardSmall: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 15,
    },
    promptText: {
        marginTop: 15,
        textAlign: 'center',
        lineHeight: 24,
    },
    playerTurn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    timer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    captionInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    voterName: {
        marginBottom: 15,
        textAlign: 'center',
    },
    captionList: {
        paddingBottom: 20,
    },
    captionOption: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    ownCaption: {
        opacity: 0.5,
        borderColor: '#444',
    },
    resultCaption: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    winningCaption: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    resultMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
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

export default CaptionThisScreen;
