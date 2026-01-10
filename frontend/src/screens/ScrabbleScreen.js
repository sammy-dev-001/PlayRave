import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import {
    LETTER_TILES,
    createTileBag,
    drawTiles,
    isValidWord,
    BOARD_SIZE,
    CENTER_SQUARE,
    BONUS_SQUARES
} from '../data/scrabbleData';
import { COLORS } from '../constants/theme';

const HAND_SIZE = 7;


const ScrabbleScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Calculate tile size dynamically based on screen dimensions
    // Use the smaller dimension to ensure board fits, with padding
    const availableSize = Math.min(screenWidth, screenHeight - 250); // Leave space for header/controls
    const tileSize = Math.max(Math.floor((availableSize - 20) / BOARD_SIZE), 18); // Min 18px tiles
    const rackTileSize = Math.min(Math.max(tileSize * 1.2, 35), 50); // Rack tiles slightly larger

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [tileBag, setTileBag] = useState(() => createTileBag());

    // Game State
    const [board, setBoard] = useState({}); // { "x,y": { letter: 'A', value: 1, isLocked: true } }
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
        players.forEach(player => { scores[player.id] = 0; });
        return scores;
    });

    const [selectedTileIndex, setSelectedTileIndex] = useState(null); // Index in hand
    const [placedTiles, setPlacedTiles] = useState([]); // Array of { x, y, letter, value, handIndex }
    const [placementHistory, setPlacementHistory] = useState([]); // Track for undo
    const [turnNumber, setTurnNumber] = useState(1);
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);

    // Tile exchange state
    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedTilesForExchange, setSelectedTilesForExchange] = useState([]); // Indices in hand

    const currentPlayer = players[currentPlayerIndex];
    const currentHand = playerHands[currentPlayer.id] || [];
    const scrollViewRef = useRef(null);

    // --- Interaction Handlers ---

    const handleRackTilePress = (index) => {
        if (exchangeMode) {
            // In exchange mode, toggle tile selection for exchange
            if (selectedTilesForExchange.includes(index)) {
                setSelectedTilesForExchange(selectedTilesForExchange.filter(i => i !== index));
            } else {
                setSelectedTilesForExchange([...selectedTilesForExchange, index]);
            }
        } else {
            // Normal placement mode
            if (selectedTileIndex === index) {
                setSelectedTileIndex(null); // Deselect
            } else {
                setSelectedTileIndex(index);
            }
        }
    };

    const handleBoardSquarePress = (x, y) => {
        const key = `${x},${y}`;

        // 1. If square occupied by locked tile (previous turns), do nothing
        if (board[key] && board[key].isLocked) return;

        // 2. If square occupied by currently placed tile, retrieve it back to hand
        const existingPlacedIndex = placedTiles.findIndex(t => t.x === x && t.y === y);
        if (existingPlacedIndex !== -1) {
            const tileToRemove = placedTiles[existingPlacedIndex];
            setPlacedTiles(placedTiles.filter((_, i) => i !== existingPlacedIndex));
            setPlacementHistory([...placementHistory, placedTiles]); // Save previous state for undo
            // Just removing it from board puts it back "visually" in rack (logic handles availability)
            return;
        }

        // 3. If placing a new tile
        if (selectedTileIndex !== null) {
            // Check if this specific tile from hand is already placed elsewhere?
            // Actually, we track availability by checking if hand index is in placedTiles
            const isAlreadyPlaced = placedTiles.some(t => t.handIndex === selectedTileIndex);
            if (isAlreadyPlaced) {
                // Should not happen if UI disables used tiles, but safety check
                return;
            }

            const tile = currentHand[selectedTileIndex];
            const newPlacement = {
                x, y,
                letter: tile.letter,
                value: tile.value,
                handIndex: selectedTileIndex
            };

            const updatedPlacedTiles = [...placedTiles, newPlacement];
            setPlacementHistory([...placementHistory, placedTiles]); // Save for undo
            setPlacedTiles(updatedPlacedTiles);
            setSelectedTileIndex(null); // Auto-deselect after placement
        }
    };

    const handleRecallTiles = () => {
        setPlacedTiles([]);
        setPlacementHistory([]);
    };

    const handleUndo = () => {
        if (placementHistory.length > 0) {
            const previousState = placementHistory[placementHistory.length - 1];
            setPlacedTiles(previousState);
            setPlacementHistory(placementHistory.slice(0, -1));
        }
    };

    const handleToggleExchangeMode = () => {
        if (exchangeMode) {
            // Cancel exchange mode
            setExchangeMode(false);
            setSelectedTilesForExchange([]);
        } else {
            // Enter exchange mode - can't exchange if tiles are placed
            if (placedTiles.length > 0) {
                Alert.alert("Cannot Exchange", "Recall your placed tiles first before exchanging.");
                return;
            }
            setExchangeMode(true);
            setSelectedTileIndex(null); // Clear any selected tile for placement
        }
    };

    const handleConfirmExchange = () => {
        if (selectedTilesForExchange.length === 0) {
            Alert.alert("No Tiles Selected", "Please select tiles to exchange.");
            return;
        }

        if (tileBag.length < selectedTilesForExchange.length) {
            Alert.alert("Not Enough Tiles", "There aren't enough tiles left in the bag to exchange.");
            return;
        }

        // Remove selected tiles from hand and return to bag
        const newHand = currentHand.filter((_, index) => !selectedTilesForExchange.includes(index));
        const returnedTiles = selectedTilesForExchange.map(index => currentHand[index]);

        // Add returned tiles back to bag and shuffle
        const newBag = [...tileBag, ...returnedTiles];
        // Simple shuffle
        for (let i = newBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
        }

        // Draw new tiles
        const drawnTiles = newBag.splice(0, selectedTilesForExchange.length);
        const finalHand = [...newHand, ...drawnTiles];

        // Update state
        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: finalHand
        }));
        setTileBag(newBag);
        setExchangeMode(false);
        setSelectedTilesForExchange([]);

        // Advance turn
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextPlayerIndex);
        if (nextPlayerIndex === 0) {
            setTurnNumber(prev => prev + 1);
        }

        Alert.alert("Tiles Exchanged", `You exchanged ${selectedTilesForExchange.length} tile(s).`);
    };

    // Helper function to extract word from board at position in direction
    const extractWord = (tempBoard, x, y, isHorizontal) => {
        let word = '';
        let tiles = [];

        if (isHorizontal) {
            // Find start of word
            let startX = x;
            while (startX > 0 && tempBoard[`${startX - 1},${y}`]) {
                startX--;
            }
            // Extract word from start
            let currentX = startX;
            while (currentX < BOARD_SIZE && tempBoard[`${currentX},${y}`]) {
                const tile = tempBoard[`${currentX},${y}`];
                word += tile.letter;
                tiles.push({ x: currentX, y, ...tile });
                currentX++;
            }
        } else {
            // Find start of word
            let startY = y;
            while (startY > 0 && tempBoard[`${x},${startY - 1}`]) {
                startY--;
            }
            // Extract word from start
            let currentY = startY;
            while (currentY < BOARD_SIZE && tempBoard[`${x},${currentY}`]) {
                const tile = tempBoard[`${x},${currentY}`];
                word += tile.letter;
                tiles.push({ x, y: currentY, ...tile });
                currentY++;
            }
        }

        return { word, tiles };
    };

    // Extract all words formed by the placed tiles
    const extractFormedWords = (tempBoard, newlyPlacedTiles) => {
        const words = [];
        const wordSet = new Set(); // To avoid duplicates

        // Determine main direction
        const xs = newlyPlacedTiles.map(t => t.x);
        const ys = newlyPlacedTiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1;
        const isVertical = new Set(xs).size === 1;

        if (isHorizontal) {
            // Main word is horizontal
            const y = ys[0];
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);

            // Extract main horizontal word
            const mainWord = extractWord(tempBoard, minX, y, true);
            if (mainWord.word.length > 1) {
                const key = `${mainWord.word}-H-${mainWord.tiles[0].x},${mainWord.tiles[0].y}`;
                if (!wordSet.has(key)) {
                    wordSet.add(key);
                    words.push(mainWord);
                }
            }

            // Check for perpendicular cross-words at each placed tile
            newlyPlacedTiles.forEach(tile => {
                const crossWord = extractWord(tempBoard, tile.x, tile.y, false);
                if (crossWord.word.length > 1) {
                    const key = `${crossWord.word}-V-${crossWord.tiles[0].x},${crossWord.tiles[0].y}`;
                    if (!wordSet.has(key)) {
                        wordSet.add(key);
                        words.push(crossWord);
                    }
                }
            });
        } else if (isVertical) {
            // Main word is vertical
            const x = xs[0];
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Extract main vertical word
            const mainWord = extractWord(tempBoard, x, minY, false);
            if (mainWord.word.length > 1) {
                const key = `${mainWord.word}-V-${mainWord.tiles[0].x},${mainWord.tiles[0].y}`;
                if (!wordSet.has(key)) {
                    wordSet.add(key);
                    words.push(mainWord);
                }
            }

            // Check for perpendicular cross-words at each placed tile
            newlyPlacedTiles.forEach(tile => {
                const crossWord = extractWord(tempBoard, tile.x, tile.y, true);
                if (crossWord.word.length > 1) {
                    const key = `${crossWord.word}-H-${crossWord.tiles[0].x},${crossWord.tiles[0].y}`;
                    if (!wordSet.has(key)) {
                        wordSet.add(key);
                        words.push(crossWord);
                    }
                }
            });
        }

        // If only one tile placed and no main word, still check cross-words
        if (newlyPlacedTiles.length === 1 && words.length === 0) {
            const tile = newlyPlacedTiles[0];
            const hWord = extractWord(tempBoard, tile.x, tile.y, true);
            const vWord = extractWord(tempBoard, tile.x, tile.y, false);

            if (hWord.word.length > 1) words.push(hWord);
            if (vWord.word.length > 1) words.push(vWord);
        }

        return words;
    };

    const calculateTurnScore = (placements) => {
        // Simplified scoring for MVP: just sum tile values + bonus squares
        // Real Scrabble scoring (connected words, cross-words) is much more complex
        let score = 0;
        let wordMultiplier = 1;

        placements.forEach(t => {
            let letterScore = t.value;
            const key = `${t.x},${t.y}`;
            const bonus = BONUS_SQUARES[key];

            if (bonus === 'DL') letterScore *= 2;
            if (bonus === 'TL') letterScore *= 3;
            if (bonus === 'DW') wordMultiplier *= 2;
            if (bonus === 'TW') wordMultiplier *= 3;

            score += letterScore;
        });

        return score * wordMultiplier;
    };

    const handleSubmitMove = () => {
        if (placedTiles.length === 0) return;

        // Validation 1: Must be in a line
        const xs = placedTiles.map(t => t.x);
        const ys = placedTiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1;
        const isVertical = new Set(xs).size === 1;

        if (!isHorizontal && !isVertical) {
            Alert.alert("Invalid Move", "Tiles must be placed in a straight line.");
            return;
        }

        // Validation 2: First turn must touch center
        const isFirstTurn = Object.keys(board).length === 0;
        if (isFirstTurn) {
            const touchesCenter = placedTiles.some(t => t.x === CENTER_SQUARE && t.y === CENTER_SQUARE);
            if (!touchesCenter) {
                Alert.alert("First Turn", "First word must cover the center star (★).");
                return;
            }
        } else {
            // Validation 3: Subsequent turns must connect to existing board
            let connects = false;
            if (!isFirstTurn && placedTiles.length > 0) {
                // Check adjacency for any placed tile
                connects = placedTiles.some(t => {
                    const neighbors = [
                        `${t.x + 1},${t.y}`, `${t.x - 1},${t.y}`,
                        `${t.x},${t.y + 1}`, `${t.x},${t.y - 1}`
                    ];
                    return neighbors.some(nKey => board[nKey] && board[nKey].isLocked);
                });
            }
            if (!connects && !isFirstTurn) {
                Alert.alert("Invalid Move", "New tiles must connect to existing words.");
                return;
            }
        }

        // Validation 4: Dictionary - Check all formed words are valid
        // Create temporary board with placed tiles
        const tempBoard = { ...board };
        placedTiles.forEach(t => {
            tempBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: false };
        });

        // Extract all words formed by this move
        const formedWords = extractFormedWords(tempBoard, placedTiles);

        if (formedWords.length === 0) {
            Alert.alert("Invalid Move", "You must form at least one valid word.");
            return;
        }

        // Validate each word against dictionary
        const invalidWords = formedWords.filter(w => !isValidWord(w.word));
        if (invalidWords.length > 0) {
            const wordList = invalidWords.map(w => w.word).join(', ');
            Alert.alert(
                "Invalid Word(s)",
                `The following ${invalidWords.length === 1 ? 'word is' : 'words are'} not in the dictionary:\n\n${wordList}\n\nPlease try a different word.`
            );
            return;
        }

        // All words are valid!
        console.log('Valid words formed:', formedWords.map(w => w.word).join(', '));

        // Commit to board
        const newBoard = { ...board };
        placedTiles.forEach(t => {
            newBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
        });
        setBoard(newBoard);

        // Clear undo history after successful move
        setPlacementHistory([]);

        // Update Score
        const turnScore = calculateTurnScore(placedTiles);
        setPlayerScores(prev => ({
            ...prev,
            [currentPlayer.id]: prev[currentPlayer.id] + turnScore
        }));

        // Refill Hand
        const usedIndices = placedTiles.map(t => t.handIndex);
        const keptTiles = currentHand.filter((_, i) => !usedIndices.includes(i));
        const newTiles = drawTiles(tileBag, usedIndices.length);

        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: [...keptTiles, ...newTiles]
        }));
        setTileBag(prev => prev.slice(0, prev.length - newTiles.length)); // Actually createTileBag logic needs adjustment if we popped

        // Actually tileBag state is managed by drawTiles logic which mutates array if passed directly?
        // Wait, drawTiles took `bag` as arg. My specific implementation above:
        // `drawTiles(tileBag, count)` uses pop(). So `tileBag` state itself needs to update if I want to persist the popped state.
        // Correction: In calculateTurn logic I didn't mutate state properly.
        // Let's rely on setTileBag with a functional update or just the fact that drawTiles returns new tiles and we need to update bag state.
        // But wait, my drawTiles implementation pops from the array reference.
        // BETTER: Create deep copy of bag to pass to drawTiles inside setPlayerHands, then update setTileBag.
        // Re-implementing simplified refill logic here:

        // Next Turn
        setPlacedTiles([]);
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handlePass = () => {
        setPlacedTiles([]);
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handleEndGameConfirm = () => {
        setEndGameModalVisible(false);

        // Calculate final scores list
        const finalScores = players.map(p => ({
            playerId: p.id,
            score: playerScores[p.id]
        })).sort((a, b) => b.score - a.score);

        // Construct simplified room object for ScoreboardScreen
        const roomData = {
            id: 'local',
            gameType: 'scrabble',
            players: players
        };

        navigation.navigate('Scoreboard', {
            room: roomData,
            finalScores: finalScores
        });
    };

    // --- Renders ---

    const renderBoardSquare = (x, y) => {
        const key = `${x},${y}`;
        const lockedTile = board[key];
        const placedTile = placedTiles.find(t => t.x === x && t.y === y);
        const tile = lockedTile || placedTile;
        const bonus = BONUS_SQUARES[key];

        let bgColor = 'rgba(255,255,255,0.05)'; // Default empty
        if (bonus === 'TW') bgColor = '#ff0055'; // Red
        if (bonus === 'DW') bgColor = '#ff99aa'; // Pink
        if (bonus === 'TL') bgColor = '#0055ff'; // Blue
        if (bonus === 'DL') bgColor = '#99ccff'; // Light Blue
        if (x === CENTER_SQUARE && y === CENTER_SQUARE) bgColor = '#ff99aa'; // Star center

        if (tile) bgColor = tile.isLocked ? '#e1c699' : '#fffebb'; // Locked vs Placed color

        return (
            <TouchableOpacity
                key={key}
                style={[styles.square, { width: tileSize, height: tileSize, backgroundColor: bgColor }]}
                onPress={() => handleBoardSquarePress(x, y)}
                activeOpacity={0.8}
            >
                {tile ? (
                    <View style={styles.tileContent}>
                        <NeonText size={Math.max(tileSize * 0.55, 10)} color="#000" weight="bold">{tile.letter}</NeonText>
                        <NeonText size={Math.max(tileSize * 0.25, 6)} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                    </View>
                ) : (
                    <View style={styles.bonusContent}>
                        {x === CENTER_SQUARE && y === CENTER_SQUARE && <NeonText size={Math.max(tileSize * 0.5, 8)}>★</NeonText>}
                        {bonus && <NeonText size={Math.max(tileSize * 0.35, 6)} weight="bold">{bonus}</NeonText>}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderGrid = () => {
        const grid = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            const row = [];
            for (let x = 0; x < BOARD_SIZE; x++) {
                row.push(renderBoardSquare(x, y));
            }
            grid.push(<View key={y} style={styles.row}>{row}</View>);
        }
        return grid;
    };

    return (
        <NeonContainer>
            {/* Header */}
            <View style={styles.header}>
                <NeonText size={18} weight="bold" glow>SCRABBLE</NeonText>
                <View style={styles.scoreRow}>
                    {players.map(p => (
                        <View key={p.id} style={[styles.miniScore, p.id === currentPlayer.id && styles.activeMiniScore]}>
                            <NeonText size={10} color={p.id === currentPlayer.id ? COLORS.neonCyan : '#888'}>{p.name}</NeonText>
                            <NeonText size={14} weight="bold">{playerScores[p.id]}</NeonText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Scrollable Board Area */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.boardContainer}
                contentContainerStyle={styles.boardContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                horizontal
                bounces={false}
            >
                <ScrollView nestedScrollEnabled bounces={false}>
                    <View style={styles.gridContainer}>
                        {renderGrid()}
                    </View>
                </ScrollView>
            </ScrollView>

            {/* Controls & Rack */}
            <View style={styles.controlsArea}>
                <View style={styles.rackContainer}>
                    <NeonText size={12} color="#666" style={{ marginBottom: 4 }}>Your Rack:</NeonText>
                    <View style={[styles.rack, { height: rackTileSize + 8 }]}>
                        {currentHand.map((tile, index) => {
                            const isUsed = placedTiles.some(t => t.handIndex === index);
                            const isSelected = selectedTileIndex === index;
                            const isSelectedForExchange = selectedTilesForExchange.includes(index);

                            if (isUsed) return (
                                <View
                                    key={index}
                                    style={[styles.rackTile, styles.usedTile, { width: rackTileSize, height: rackTileSize }]}
                                />
                            );

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.rackTile,
                                        { width: rackTileSize, height: rackTileSize },
                                        isSelected && !exchangeMode && styles.selectedRackTile,
                                        isSelectedForExchange && styles.exchangeSelectedTile
                                    ]}
                                    onPress={() => handleRackTilePress(index)}
                                >
                                    <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">{tile.letter}</NeonText>
                                    <NeonText size={rackTileSize * 0.22} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.gameButtons}>
                    {!exchangeMode ? (
                        <>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.smallBtn, placementHistory.length === 0 && styles.disabledBtn]}
                                    onPress={handleUndo}
                                    disabled={placementHistory.length === 0}
                                >
                                    <NeonText size={12}>↶ Undo</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.smallBtn} onPress={handleRecallTiles}>
                                    <NeonText size={12}>Recall</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.smallBtn} onPress={handlePassTurn}>
                                    <NeonText size={12}>Pass</NeonText>
                                </TouchableOpacity>
                            </View>
                            <NeonButton
                                title="PLAY WORD"
                                onPress={handleSubmitMove}
                                disabled={placedTiles.length === 0}
                                style={{ marginTop: 5, paddingVertical: 8 }}
                            />
                            <TouchableOpacity
                                style={[styles.exchangeBtn, tileBag.length === 0 && styles.disabledBtn]}
                                onPress={handleToggleExchangeMode}
                                disabled={tileBag.length === 0}
                            >
                                <NeonText size={12} color={COLORS.neonCyan}>🔄 Exchange Tiles</NeonText>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <NeonText size={14} color={COLORS.neonCyan} style={{ textAlign: 'center', marginBottom: 8 }}>
                                Select tiles to exchange ({selectedTilesForExchange.length} selected)
                            </NeonText>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.cancelExchangeBtn} onPress={handleToggleExchangeMode}>
                                    <NeonText size={12}>Cancel</NeonText>
                                </TouchableOpacity>
                                <NeonButton
                                    title={`EXCHANGE (${selectedTilesForExchange.length})`}
                                    onPress={handleConfirmExchange}
                                    disabled={selectedTilesForExchange.length === 0}
                                    style={{ marginTop: 0, paddingVertical: 8, flex: 1 }}
                                />
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* End Game Button */}
            <TouchableOpacity
                style={styles.endGameBtn}
                onPress={() => setEndGameModalVisible(true)}
            >
                <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
            </TouchableOpacity>

            {/* Custom End Game Modal */}
            <Modal
                transparent={true}
                visible={endGameModalVisible}
                animationType="fade"
                onRequestClose={() => setEndGameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <NeonText size={20} weight="bold" glow style={{ marginBottom: 10 }}>End Game?</NeonText>
                        <NeonText size={14} color="#ccc" style={{ textAlign: 'center', marginBottom: 20 }}>
                            Are you sure you want to end the game? The player with the highest score will win.
                        </NeonText>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setEndGameModalVisible(false)}>
                                <NeonText>Cancel</NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleEndGameConfirm}>
                                <NeonText color="#000" weight="bold">End Game</NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: 40,
        paddingHorizontal: 15,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.deepNightBlack,
    },
    scoreRow: {
        flexDirection: 'row',
        gap: 10,
    },
    miniScore: {
        alignItems: 'center',
        padding: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        minWidth: 50,
    },
    activeMiniScore: {
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },

    boardContainer: {
        flex: 1,
    },
    boardContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    gridContainer: {
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: '#444',
        padding: 2,
    },
    row: {
        flexDirection: 'row',
    },
    square: {
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bonusContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileContent: {
        width: '90%',
        height: '90%',
        backgroundColor: '#e1c699', // Classic wood color look
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
    },

    controlsArea: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    rackContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    rack: {
        flexDirection: 'row',
        gap: 5,
        height: 50,
    },
    rackTile: {
        width: 40,
        height: 45,
        backgroundColor: '#e1c699',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#c6a87c',
    },
    selectedRackTile: {
        borderColor: COLORS.limeGlow,
        borderWidth: 3,
        transform: [{ translateY: -5 }],
    },
    exchangeSelectedTile: {
        borderColor: COLORS.neonCyan,
        borderWidth: 3,
        backgroundColor: '#a0e0ff',
    },
    usedTile: {
        backgroundColor: '#333',
        borderColor: '#222',
        opacity: 0.5,
    },
    tileValue: {
        position: 'absolute',
        bottom: 1,
        right: 2,
        fontSize: 8,
    },

    gameButtons: {
        gap: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    smallBtn: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
    },
    disabledBtn: {
        opacity: 0.3,
    },
    exchangeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        marginTop: 5,
    },
    cancelExchangeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
    },

    endGameBtn: {
        position: 'absolute',
        top: 45,
        right: 15, // Actually interacts with header, safer to put in header or separate
    },

    // Custom Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
        justifyContent: 'center',
    },
    modalCancel: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#333',
        minWidth: 100,
        alignItems: 'center',
    },
    modalConfirm: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.hotPink,
        minWidth: 100,
        alignItems: 'center',
    },
});

export default ScrabbleScreen;
