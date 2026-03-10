import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import { COLORS, SHADOWS } from '../constants/theme';

// Emojis for the memory game
const MEMORY_ITEMS = ['🍎', '🍕', '🎸', '', '🌙', '⚡', '🎲', '🌈', '🦄', '🎯', '🔥', '💎', '🎪', '🎭', '🌺', '🦋'];

const MemoryChainScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [phase, setPhase] = useState('show'); // 'show', 'input', 'result', 'gameover'
    const [playerSequences, setPlayerSequences] = useState({}); // Store sequences per player
    const [currentSequence, setCurrentSequence] = useState([]);
    const [playerInput, setPlayerInput] = useState([]);
    const [showingIndex, setShowingIndex] = useState(0);
    const [scores, setScores] = useState(() =>
        players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {})
    );
    const [eliminated, setEliminated] = useState([]);
    const [lastEliminated, setLastEliminated] = useState(null);
    const [showWinner, setShowWinner] = useState(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const currentPlayer = players[currentPlayerIndex];
    const activePlayers = players.filter(p => !eliminated.includes(p.name));

    // Initialize game with first sequences for each player
    useEffect(() => {
        generatePlayerSequence();
    }, []);

    // Show sequence animation
    useEffect(() => {
        if (phase === 'show' && currentSequence.length > 0) {
            showSequence();
        }
    }, [phase, currentSequence]);

    const [currentLevel, setCurrentLevel] = useState(1);
    const [playersAttemptedLevel, setPlayersAttemptedLevel] = useState([]);

    // ... existing ...

    const generatePlayerSequence = (level = 1) => {
        const currentPlayer = players[currentPlayerIndex];
        const playerKey = `${currentPlayerIndex}-${currentPlayer.name}`;

        // Generate a random sequence for this player
        const newSequence = [];
        for (let i = 0; i < level; i++) {
            const randomItem = MEMORY_ITEMS[Math.floor(Math.random() * MEMORY_ITEMS.length)];
            newSequence.push(randomItem);
        }

        setPlayerSequences(prev => ({
            ...prev,
            [playerKey]: newSequence
        }));
        setCurrentSequence(newSequence);
    };

    const showSequence = async () => {
        for (let i = 0; i < currentSequence.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setShowingIndex(i);

            // Animate the item
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }

        // Wait a bit then switch to input phase
        await new Promise(resolve => setTimeout(resolve, 500));
        setShowingIndex(-1);
        setPhase('input');
    };

    const handleNextTurn = () => {
        setPlayerInput([]);

        // Add current player to attempted list
        const updatedAttempted = [...playersAttemptedLevel, players[currentPlayerIndex].name];
        setPlayersAttemptedLevel(updatedAttempted);

        // Check if only one player remains
        const remaining = players.filter(p => !eliminated.includes(p.name));
        // Note: if current player was just eliminated, they are in 'eliminated'

        if (remaining.length <= 1) { // 1 or 0 (if everyone dead)
            // If 1 winner
            if (remaining.length === 1) {
                setShowWinner(true);
                return;
            }
            // If everyone dead (0), show game over with score
            setShowWinner(true);
            return;
        }

        // Determine if level is complete
        // Level is complete if all CURRENTLY active players have attempted it
        const levelComplete = remaining.every(p => updatedAttempted.includes(p.name));

        let nextLevel = currentLevel;
        if (levelComplete) {
            nextLevel = currentLevel + 1;
            setCurrentLevel(nextLevel);
            setPlayersAttemptedLevel([]);
        }

        // Find next active player
        let nextIndex = (currentPlayerIndex + 1) % players.length;
        while (eliminated.includes(players[nextIndex].name)) {
            nextIndex = (nextIndex + 1) % players.length;
        }

        setCurrentPlayerIndex(nextIndex);

        // Generate new random sequence for next player
        generatePlayerSequence(nextLevel);

        setLastEliminated(null);
        setPhase('show');
    };

    const handleEndGame = () => {
        navigation.navigate('LocalGameSelection', { players });
    };

    // Sort scores for display
    const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => b - a);

    // Winner Screen
    if (showWinner) {
        const winner = activePlayers[0];
        const winnerScore = scores[winner?.name] || 0;

        return (
            <NeonContainer>
                <RaveLights trigger={true} intensity="high" />
                <View style={styles.winnerContainer}>
                    <NeonText size={28} weight="bold" glow>
                        MEMORY MASTER
                    </NeonText>
                    <NeonText size={80}></NeonText>
                    <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                        {winner?.name}
                    </NeonText>
                    <NeonText size={20} color={COLORS.neonCyan}>
                        Remembered {currentSequence.length} items!
                    </NeonText>
                    <NeonText size={16} color="#888">
                        Score: {winnerScore} points
                    </NeonText>

                    <View style={styles.finalScores}>
                        <NeonText size={14} color="#888" style={styles.scoresTitle}>
                            ELIMINATION ORDER
                        </NeonText>
                        {eliminated.map((name, index) => (
                            <View key={name} style={styles.eliminatedRow}>
                                <NeonText size={14} color={COLORS.hotPink}>
                                    {eliminated.length - index}. {name}
                                </NeonText>
                                <NeonText size={12} color="#888">
                                    {scores[name]} pts
                                </NeonText>
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

    // Show Sequence Phase
    if (phase === 'show') {
        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.hotPink}>
                        ROUND {currentSequence.length}
                    </NeonText>
                    <NeonText size={24} weight="bold" glow>
                        MEMORY CHAIN
                    </NeonText>
                </View>

                <View style={styles.playerInfo}>
                    <NeonText size={16}>
                        {currentPlayer.name}'s turn
                    </NeonText>
                    <NeonText size={12} color="#888">
                        {activePlayers.length} players remaining
                    </NeonText>
                </View>

                <View style={styles.watchCard}>
                    <NeonText size={16} color={COLORS.neonCyan}>
                        WATCH CAREFULLY!
                    </NeonText>

                    <Animated.View style={[
                        styles.showItem,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        {showingIndex >= 0 && (
                            <NeonText size={80}>
                                {currentSequence[showingIndex]}
                            </NeonText>
                        )}
                    </Animated.View>

                    <View style={styles.progressDots}>
                        {currentSequence.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i <= showingIndex && styles.dotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </NeonContainer>
        );
    }

    // Input Phase
    if (phase === 'input') {
        return (
            <NeonContainer>
                <View style={styles.header}>
                    <NeonText size={14} color={COLORS.limeGlow}>
                        YOUR TURN!
                    </NeonText>
                    <NeonText size={24} weight="bold" glow>
                        REPEAT THE SEQUENCE
                    </NeonText>
                </View>

                <View style={styles.progressBar}>
                    <NeonText size={14}>
                        {playerInput.length} / {currentSequence.length}
                    </NeonText>
                    <View style={styles.inputDots}>
                        {currentSequence.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.inputDot,
                                    i < playerInput.length && styles.inputDotFilled
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.itemGrid}>
                    {MEMORY_ITEMS.slice(0, 16).map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.itemButton}
                            onPress={() => handleItemPress(item)}
                        >
                            <NeonText size={36}>{item}</NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            </NeonContainer>
        );
    }

    // Result Phase
    if (phase === 'result') {
        const wasCorrect = !eliminated.includes(currentPlayer.name) || lastEliminated !== currentPlayer.name;

        return (
            <NeonContainer>
                <View style={styles.resultContainer}>
                    {lastEliminated === currentPlayer.name ? (
                        <>
                            <NeonText size={64}>❌</NeonText>
                            <NeonText size={28} weight="bold" color={COLORS.hotPink}>
                                WRONG!
                            </NeonText>
                            <NeonText size={18} style={styles.resultText}>
                                {currentPlayer.name} is eliminated!
                            </NeonText>
                            <View style={styles.correctSequence}>
                                <NeonText size={12} color="#888">The sequence was:</NeonText>
                                <View style={styles.sequenceRow}>
                                    {currentSequence.map((item, i) => (
                                        <NeonText key={i} size={24}>{item}</NeonText>
                                    ))}
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <NeonText size={64}>✅</NeonText>
                            <NeonText size={28} weight="bold" color={COLORS.limeGlow}>
                                CORRECT!
                            </NeonText>
                            <NeonText size={18} style={styles.resultText}>
                                {currentPlayer.name} advances to round {currentSequence.length + 1}!
                            </NeonText>
                            <NeonText size={24} color={COLORS.neonCyan}>
                                +{currentSequence.length * 10} points
                            </NeonText>
                        </>
                    )}

                    <NeonButton
                        title="CONTINUE"
                        onPress={handleNextTurn}
                        style={styles.continueBtn}
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
    playerInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    watchCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    showItem: {
        marginVertical: 40,
        width: 150,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    progressDots: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        backgroundColor: COLORS.neonCyan,
    },
    progressBar: {
        alignItems: 'center',
        marginBottom: 20,
    },
    inputDots: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 10,
    },
    inputDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    inputDotFilled: {
        backgroundColor: COLORS.limeGlow,
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    itemButton: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    resultContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    resultText: {
        marginVertical: 15,
        textAlign: 'center',
    },
    correctSequence: {
        marginTop: 20,
        alignItems: 'center',
    },
    sequenceRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    continueBtn: {
        marginTop: 30,
        minWidth: 200,
    },
    winnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    finalScores: {
        width: '100%',
        marginTop: 25,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    scoresTitle: {
        textAlign: 'center',
        marginBottom: 10,
    },
    eliminatedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    playAgainBtn: {
        marginTop: 25,
    }
});

export default MemoryChainScreen;
