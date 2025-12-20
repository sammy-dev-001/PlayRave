import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import {
    LETTER_TILES,
    createTileBag,
    drawTiles,
    calculateWordScore,
    isValidWord,
    canFormWord
} from '../data/scrabbleData';
import { COLORS } from '../constants/theme';

const HAND_SIZE = 7;

const ScrabbleScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [tileBag, setTileBag] = useState(() => createTileBag());
    const [playerHands, setPlayerHands] = useState(() => {
        const hands = {};
        const bag = createTileBag();
        players.forEach(player => {
            hands[player.id] = drawTiles(bag, HAND_SIZE);
        });
        setTileBag(bag);
        return hands;
    });
    const [playerScores, setPlayerScores] = useState(() => {
        const scores = {};
        players.forEach(player => {
            scores[player.id] = 0;
        });
        return scores;
    });
    const [selectedTiles, setSelectedTiles] = useState([]);
    const [currentWord, setCurrentWord] = useState('');
    const [lastPlayedWord, setLastPlayedWord] = useState(null);
    const [turnNumber, setTurnNumber] = useState(1);

    const currentPlayer = players[currentPlayerIndex];
    const currentHand = playerHands[currentPlayer.id] || [];

    const handleTilePress = (tile, index) => {
        const isSelected = selectedTiles.some(s => s.index === index);

        if (isSelected) {
            // Deselect tile
            setSelectedTiles(selectedTiles.filter(s => s.index !== index));
            setCurrentWord(currentWord.replace(tile.letter, ''));
        } else {
            // Select tile
            setSelectedTiles([...selectedTiles, { ...tile, index }]);
            setCurrentWord(currentWord + tile.letter);
        }
    };

    const handleSubmitWord = () => {
        if (currentWord.length < 2) {
            Alert.alert('Too Short', 'Words must be at least 2 letters!');
            return;
        }

        if (!isValidWord(currentWord)) {
            Alert.alert('Invalid Word', `"${currentWord}" is not in our dictionary!`);
            return;
        }

        const score = calculateWordScore(currentWord);

        // Update scores
        setPlayerScores(prev => ({
            ...prev,
            [currentPlayer.id]: prev[currentPlayer.id] + score
        }));

        // Remove used tiles from hand and draw new ones
        const usedIndices = selectedTiles.map(s => s.index);
        const remainingTiles = currentHand.filter((_, i) => !usedIndices.includes(i));
        const newTiles = drawTiles(tileBag, usedIndices.length);

        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: [...remainingTiles, ...newTiles]
        }));

        setLastPlayedWord({ word: currentWord, score, player: currentPlayer.name });

        // Clear selection and move to next player
        setSelectedTiles([]);
        setCurrentWord('');

        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setTurnNumber(turnNumber + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handleSwapTiles = () => {
        if (selectedTiles.length === 0) {
            Alert.alert('Select Tiles', 'Select tiles you want to swap!');
            return;
        }

        // Return selected tiles to bag and draw new ones
        const usedIndices = selectedTiles.map(s => s.index);
        const tilesToReturn = currentHand.filter((_, i) => usedIndices.includes(i));
        const remainingTiles = currentHand.filter((_, i) => !usedIndices.includes(i));

        const newBag = [...tileBag, ...tilesToReturn];
        // Shuffle
        for (let i = newBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
        }

        const newTiles = drawTiles(newBag, tilesToReturn.length);
        setTileBag(newBag);

        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: [...remainingTiles, ...newTiles]
        }));

        // Clear and pass turn
        setSelectedTiles([]);
        setCurrentWord('');

        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setTurnNumber(turnNumber + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handlePass = () => {
        setSelectedTiles([]);
        setCurrentWord('');
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setTurnNumber(turnNumber + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handleEndGame = () => {
        // Find winner
        const sortedPlayers = [...players].sort((a, b) =>
            playerScores[b.id] - playerScores[a.id]
        );
        const winner = sortedPlayers[0];

        Alert.alert(
            '🏆 Game Over!',
            `${winner.name} wins with ${playerScores[winner.id]} points!`,
            [{ text: 'OK', onPress: () => navigation.navigate('LocalGameSelection', { players }) }]
        );
    };

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={24} weight="bold" glow>
                    📝 WORD BUILDER
                </NeonText>
                <NeonText size={14} color="#888">
                    Turn {turnNumber} • Tiles left: {tileBag.length}
                </NeonText>
            </View>

            {/* Current Player */}
            <View style={styles.playerInfo}>
                <NeonText size={14} color={COLORS.neonCyan}>NOW PLAYING:</NeonText>
                <NeonText size={24} weight="bold" glow>{currentPlayer.name}</NeonText>
            </View>

            {/* Last Played Word */}
            {lastPlayedWord && (
                <View style={styles.lastWordContainer}>
                    <NeonText size={12} color="#888">Last word:</NeonText>
                    <NeonText size={16} color={COLORS.limeGlow} weight="bold">
                        {lastPlayedWord.word} (+{lastPlayedWord.score} by {lastPlayedWord.player})
                    </NeonText>
                </View>
            )}

            {/* Current Word Display */}
            <View style={styles.wordDisplay}>
                <NeonText size={14} color="#888">YOUR WORD:</NeonText>
                <NeonText size={32} weight="bold" glow color={currentWord ? COLORS.neonCyan : '#444'}>
                    {currentWord || '_ _ _ _'}
                </NeonText>
                {currentWord.length >= 2 && (
                    <NeonText size={14} color={isValidWord(currentWord) ? COLORS.limeGlow : COLORS.hotPink}>
                        {isValidWord(currentWord) ? `✓ Valid (+${calculateWordScore(currentWord)} pts)` : '✗ Not a word'}
                    </NeonText>
                )}
            </View>

            {/* Tile Rack */}
            <View style={styles.tileRack}>
                <NeonText size={12} color="#888" style={styles.rackLabel}>TAP TILES TO SELECT:</NeonText>
                <View style={styles.tilesContainer}>
                    {currentHand.map((tile, index) => {
                        const isSelected = selectedTiles.some(s => s.index === index);
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.tile, isSelected && styles.selectedTile]}
                                onPress={() => handleTilePress(tile, index)}
                            >
                                <NeonText size={24} weight="bold" color={isSelected ? '#000' : COLORS.white}>
                                    {tile.letter}
                                </NeonText>
                                <View style={styles.tileValue}>
                                    <NeonText size={10} color={isSelected ? '#000' : COLORS.neonCyan}>
                                        {tile.value}
                                    </NeonText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <NeonButton
                    title="SUBMIT WORD"
                    onPress={handleSubmitWord}
                    disabled={currentWord.length < 2 || !isValidWord(currentWord)}
                />
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleSwapTiles}>
                        <NeonText size={14} color={COLORS.hotPink}>🔄 SWAP</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handlePass}>
                        <NeonText size={14} color="#888">⏭️ PASS</NeonText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scoreboard */}
            <ScrollView horizontal style={styles.scoreboardScroll} showsHorizontalScrollIndicator={false}>
                <View style={styles.scoreboard}>
                    {players.map(player => (
                        <View
                            key={player.id}
                            style={[
                                styles.scoreCard,
                                player.id === currentPlayer.id && styles.activeScore
                            ]}
                        >
                            <NeonText size={12} weight="bold">{player.name}</NeonText>
                            <NeonText size={20} color={COLORS.limeGlow} weight="bold">
                                {playerScores[player.id]}
                            </NeonText>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <NeonButton
                title="END GAME"
                variant="secondary"
                onPress={handleEndGame}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 10,
    },
    playerInfo: {
        alignItems: 'center',
        marginBottom: 10,
    },
    lastWordContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    wordDisplay: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    tileRack: {
        marginBottom: 15,
    },
    rackLabel: {
        textAlign: 'center',
        marginBottom: 10,
    },
    tilesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    tile: {
        width: 44,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    selectedTile: {
        backgroundColor: COLORS.limeGlow,
        borderColor: COLORS.limeGlow,
    },
    tileValue: {
        position: 'absolute',
        bottom: 2,
        right: 4,
    },
    actions: {
        gap: 10,
        marginBottom: 10,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    secondaryBtn: {
        flex: 1,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    scoreboardScroll: {
        maxHeight: 70,
        marginBottom: 10,
    },
    scoreboard: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 5,
    },
    scoreCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    activeScore: {
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    }
});

export default ScrabbleScreen;
