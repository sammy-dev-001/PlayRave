import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Vibration,
    ScrollView
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

// Card content - emojis for matching
const CARD_PAIRS = [
    '🎮', '🎯', '🎪', '🎭', '🎨', '🎬',
    '🎤', '🎧', '🎸', '🎹', '🎺', '🎻',
    '🏆', '⭐', '💎', '🔥', '⚡', '🌈'
];

const MemoryMatchScreen = ({ route, navigation }) => {
    const { players = [] } = route.params || {};

    const [gamePhase, setGamePhase] = useState('setup'); // setup, playing, finished
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [scores, setScores] = useState({});
    const [gridSize, setGridSize] = useState(4); // 4x4 default
    const [isProcessing, setIsProcessing] = useState(false);

    const flipAnims = useRef({}).current;

    // Initialize the game
    const initGame = () => {
        const totalCards = gridSize * gridSize;
        const pairsNeeded = totalCards / 2;

        // Select random emojis and create pairs
        const shuffledEmojis = [...CARD_PAIRS].sort(() => Math.random() - 0.5);
        const selectedEmojis = shuffledEmojis.slice(0, pairsNeeded);
        const cardPairs = [...selectedEmojis, ...selectedEmojis];

        // Shuffle the cards
        const shuffledCards = cardPairs
            .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }))
            .sort(() => Math.random() - 0.5);

        // Initialize flip animations
        shuffledCards.forEach(card => {
            flipAnims[card.id] = new Animated.Value(0);
        });

        setCards(shuffledCards);
        setFlippedCards([]);
        setMatchedPairs([]);
        setIsProcessing(false);

        // Initialize scores
        const initialScores = {};
        players.forEach(player => { initialScores[player.id] = 0; });
        setScores(initialScores);

        setGamePhase('playing');
    };

    const handleCardPress = (cardIndex) => {
        if (isProcessing) return;

        const card = cards[cardIndex];
        if (card.isFlipped || card.isMatched) return;
        if (flippedCards.length >= 2) return;

        // Flip the card
        if (Platform.OS !== 'web') Vibration.vibrate(10);

        Animated.timing(flipAnims[card.id], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
        }).start();

        const newCards = [...cards];
        newCards[cardIndex].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, cardIndex];
        setFlippedCards(newFlipped);

        // Check for match if two cards are flipped
        if (newFlipped.length === 2) {
            setIsProcessing(true);
            const [first, second] = newFlipped;

            if (cards[first].emoji === cards[second].emoji) {
                // Match found!
                setTimeout(() => {
                    const updatedCards = [...cards];
                    updatedCards[first].isMatched = true;
                    updatedCards[second].isMatched = true;
                    setCards(updatedCards);
                    setMatchedPairs([...matchedPairs, cards[first].emoji]);

                    // Update score for current player
                    const currentPlayer = players[currentPlayerIndex];
                    if (currentPlayer) {
                        setScores(prev => ({
                            ...prev,
                            [currentPlayer.id]: (prev[currentPlayer.id] || 0) + 1
                        }));
                    }

                    setFlippedCards([]);
                    setIsProcessing(false);

                    // Check if game is over
                    const totalPairs = (gridSize * gridSize) / 2;
                    if (matchedPairs.length + 1 >= totalPairs) {
                        setGamePhase('finished');
                    }
                }, 500);
            } else {
                // No match - flip back after delay
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(flipAnims[cards[first].id], { toValue: 0, duration: 200, useNativeDriver: true }),
                        Animated.timing(flipAnims[cards[second].id], { toValue: 0, duration: 200, useNativeDriver: true })
                    ]).start();

                    const updatedCards = [...cards];
                    updatedCards[first].isFlipped = false;
                    updatedCards[second].isFlipped = false;
                    setCards(updatedCards);
                    setFlippedCards([]);

                    // Next player's turn
                    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    const getRankings = () => {
        return Object.entries(scores)
            .map(([playerId, score]) => ({
                player: players.find(p => p.id === playerId),
                score
            }))
            .sort((a, b) => b.score - a.score);
    };

    const currentPlayer = players[currentPlayerIndex];
    const cardSize = gridSize === 4 ? 70 : gridSize === 6 ? 50 : 40;

    return (
        <NeonContainer>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                            🧠 MEMORY MATCH
                        </NeonText>
                    </View>

                    {/* Setup Phase */}
                    {gamePhase === 'setup' && (
                        <View style={styles.setupContainer}>
                            <NeonText size={20} weight="bold" style={styles.setupTitle}>
                                Grid Size
                            </NeonText>
                            <View style={styles.gridOptions}>
                                {[4, 6].map(size => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[styles.gridOption, gridSize === size && styles.selectedGrid]}
                                        onPress={() => setGridSize(size)}
                                    >
                                        <NeonText size={18} weight="bold" color={gridSize === size ? COLORS.limeGlow : '#888'}>
                                            {size}x{size}
                                        </NeonText>
                                        <NeonText size={12} color="#666">
                                            {(size * size) / 2} pairs
                                        </NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <NeonText size={16} color="#888" style={styles.playersLabel}>
                                Players: {players.length}
                            </NeonText>
                            <View style={styles.playersList}>
                                {players.map((player, index) => (
                                    <View key={player.id} style={styles.playerChip}>
                                        <NeonText size={14}>{player.name}</NeonText>
                                    </View>
                                ))}
                            </View>

                            <NeonButton
                                title="START GAME"
                                onPress={initGame}
                                style={styles.startButton}
                            />
                        </View>
                    )}

                    {/* Playing Phase */}
                    {gamePhase === 'playing' && (
                        <>
                            <View style={styles.gameInfo}>
                                <NeonText size={16} color={COLORS.limeGlow}>
                                    {currentPlayer?.name}'s turn
                                </NeonText>
                                <NeonText size={14} color="#888">
                                    Pairs: {matchedPairs.length}/{(gridSize * gridSize) / 2}
                                </NeonText>
                            </View>

                            <View style={[styles.grid, { width: gridSize * (cardSize + 10) }]}>
                                {cards.map((card, index) => {
                                    const flipRotation = flipAnims[card.id]?.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '180deg']
                                    }) || '0deg';

                                    return (
                                        <TouchableOpacity
                                            key={card.id}
                                            onPress={() => handleCardPress(index)}
                                            disabled={card.isMatched || isProcessing}
                                            activeOpacity={0.8}
                                        >
                                            <Animated.View
                                                style={[
                                                    styles.card,
                                                    {
                                                        width: cardSize,
                                                        height: cardSize,
                                                        transform: [{ rotateY: flipRotation }]
                                                    },
                                                    card.isMatched && styles.matchedCard,
                                                    card.isFlipped && styles.flippedCard
                                                ]}
                                            >
                                                {(card.isFlipped || card.isMatched) ? (
                                                    <NeonText size={cardSize * 0.5}>{card.emoji}</NeonText>
                                                ) : (
                                                    <NeonText size={cardSize * 0.4} color={COLORS.neonCyan}>?</NeonText>
                                                )}
                                            </Animated.View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.scoresRow}>
                                {players.map((player, index) => (
                                    <View
                                        key={player.id}
                                        style={[
                                            styles.scoreBox,
                                            currentPlayerIndex === index && styles.activeScoreBox
                                        ]}
                                    >
                                        <NeonText size={12} color="#888">{player.name}</NeonText>
                                        <NeonText size={20} weight="bold" color={COLORS.limeGlow}>
                                            {scores[player.id] || 0}
                                        </NeonText>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Finished Phase */}
                    {gamePhase === 'finished' && (
                        <View style={styles.finishedContainer}>
                            <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                                🏆 Game Over! 🏆
                            </NeonText>

                            <View style={styles.rankings}>
                                {getRankings().map((entry, index) => (
                                    <View key={entry.player?.id} style={[styles.rankRow, index === 0 && styles.winnerRow]}>
                                        <NeonText size={18} weight="bold">#{index + 1}</NeonText>
                                        <NeonText size={16} style={styles.rankName}>{entry.player?.name}</NeonText>
                                        <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                            {entry.score} pairs
                                        </NeonText>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.buttonRow}>
                                <NeonButton title="PLAY AGAIN" onPress={initGame} style={styles.actionButton} />
                                <NeonButton
                                    title="EXIT"
                                    variant="secondary"
                                    onPress={() => navigation.goBack()}
                                    style={styles.actionButton}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1 },
    container: { flex: 1, paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
    header: { marginBottom: 20 },
    setupContainer: { alignItems: 'center', paddingTop: 40 },
    setupTitle: { marginBottom: 20 },
    gridOptions: { flexDirection: 'row', gap: 20, marginBottom: 30 },
    gridOption: {
        padding: 20, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', minWidth: 100, borderWidth: 2, borderColor: 'transparent'
    },
    selectedGrid: { borderColor: COLORS.limeGlow, backgroundColor: 'rgba(198, 255, 74, 0.1)' },
    playersLabel: { marginBottom: 10 },
    playersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30, justifyContent: 'center' },
    playerChip: {
        paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(0, 255, 255, 0.2)', borderWidth: 1, borderColor: COLORS.neonCyan
    },
    startButton: { minWidth: 200 },
    gameInfo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, paddingHorizontal: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 30 },
    card: {
        borderRadius: 10, backgroundColor: 'rgba(0, 255, 255, 0.2)', justifyContent: 'center',
        alignItems: 'center', borderWidth: 2, borderColor: COLORS.neonCyan
    },
    flippedCard: { backgroundColor: 'rgba(255,255,255,0.15)' },
    matchedCard: { backgroundColor: 'rgba(198, 255, 74, 0.3)', borderColor: COLORS.limeGlow },
    scoresRow: { flexDirection: 'row', gap: 15, flexWrap: 'wrap', justifyContent: 'center' },
    scoreBox: { padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', minWidth: 80 },
    activeScoreBox: { borderWidth: 2, borderColor: COLORS.limeGlow },
    finishedContainer: { alignItems: 'center', paddingTop: 40 },
    rankings: { width: '100%', marginTop: 30, marginBottom: 30 },
    rankRow: {
        flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12
    },
    winnerRow: { backgroundColor: 'rgba(198, 255, 74, 0.15)', borderWidth: 2, borderColor: COLORS.limeGlow },
    rankName: { flex: 1, marginLeft: 15 },
    buttonRow: { flexDirection: 'row', gap: 15 },
    actionButton: { minWidth: 120 },
});

export default MemoryMatchScreen;
