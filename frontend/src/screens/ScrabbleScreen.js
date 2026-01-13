import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ScorePopup from '../components/ScorePopup';
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
import ScrabbleAI from '../ai/ScrabbleAI';
import PlayerStatsService from '../services/PlayerStatsService';

const HAND_SIZE = 7;


const ScrabbleScreen = ({ route, navigation }) => {
    const { players = [], difficulty = null } = route.params || {};
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Debug logging
    console.log('[ScrabbleScreen] Params:', { players, difficulty, paramsExist: !!route.params });

    // Early validation - if no players, show error and go back
    React.useEffect(() => {
        if (!players || players.length === 0) {
            console.error('[ScrabbleScreen] No players provided - navigating back');
            Alert.alert('Error', 'No players specified', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    }, []);

    // Check if this is AI mode (single player with difficulty)
    const isAIMode = difficulty !== null && players && players.length === 1;

    console.log('[ScrabbleScreen] Mode:', { isAIMode, playerCount: players?.length });

    // Create players array with AI if in AI mode
    const gamePlayers = isAIMode
        ? [...players, { id: 'ai', name: 'AI Opponent 🤖', gender: 'other', isAI: true }]
        : (players || []);

    // Calculate tile size dynamically based on screen dimensions
    // For desktop (wider screens), use a larger minimum tile size
    const isDesktop = screenWidth > 768;
    const availableSize = Math.min(screenWidth * 0.9, screenHeight - 300); // Use 90% width, leave space for header/controls
    const minTileSize = isDesktop ? 28 : 18; // Larger minimum on desktop
    const maxTileSize = isDesktop ? 40 : 30; // Cap tile size
    const tileSize = Math.min(maxTileSize, Math.max(Math.floor(availableSize / BOARD_SIZE), minTileSize));
    const rackTileSize = Math.min(Math.max(tileSize * 1.3, 40), 55); // Rack tiles slightly larger

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [tileBag, setTileBag] = useState(() => createTileBag());

    // Game State
    const [board, setBoard] = useState({}); // { "x,y": { letter: 'A', value: 1, isLocked: true } }
    const [playerHands, setPlayerHands] = useState(() => {
        const hands = {};
        const bag = createTileBag();
        gamePlayers.forEach(player => {
            hands[player.id] = drawTiles(bag, HAND_SIZE);
        });
        setTileBag(bag);
        return hands;
    });

    const [playerScores, setPlayerScores] = useState(() => {
        const scores = {};
        gamePlayers.forEach(player => { scores[player.id] = 0; });
        return scores;
    });

    const [selectedTileIndex, setSelectedTileIndex] = useState(null); // Index in hand
    const [placedTiles, setPlacedTiles] = useState([]); // Array of { x, y, letter, value, handIndex }
    const [placementHistory, setPlacementHistory] = useState([]); // Track for undo
    const [turnNumber, setTurnNumber] = useState(1);
    const [consecutivePasses, setConsecutivePasses] = useState(0); // Track passes for end game
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);

    // Tile exchange state
    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedTilesForExchange, setSelectedTilesForExchange] = useState([]); // Indices in hand

    // Score popup state
    const [showScorePopup, setShowScorePopup] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [lastWords, setLastWords] = useState([]);

    // AI state
    const [isAIThinking, setIsAIThinking] = useState(false);
    const aiRef = useRef(isAIMode ? new ScrabbleAI(difficulty) : null);

    // Blank tile selection modal state
    const [blankTileModalVisible, setBlankTileModalVisible] = useState(false);
    const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null); // { x, y, handIndex }

    const currentPlayer = gamePlayers[currentPlayerIndex];
    const currentHand = playerHands[currentPlayer?.id] || [];
    const scrollViewRef = useRef(null);

    // AI Turn Handler
    useEffect(() => {
        if (isAIMode && currentPlayer?.isAI && !isAIThinking) {
            setIsAIThinking(true);

            // Delay for realism
            setTimeout(() => {
                executeAITurn();
            }, 1500);
        }
    }, [currentPlayerIndex, isAIMode]);

    const executeAITurn = () => {
        if (!aiRef.current) return;

        const aiHand = playerHands['ai'] || [];
        const move = aiRef.current.findBestMove(board, aiHand, tileBag);

        if (!move || move.type === 'pass') {
            // AI passes
            handleAIPass();
        } else if (move.type === 'exchange') {
            // AI exchanges tiles
            handleAIExchange(move.tileIndices);
        } else if (move.type === 'move' && move.tiles) {
            // AI plays tiles
            handleAIMove(move);
        } else {
            // No valid move found, pass
            handleAIPass();
        }

        setIsAIThinking(false);
    };

    const handleAIPass = () => {
        const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handleAIExchange = (tileIndices) => {
        const aiHand = playerHands['ai'] || [];
        const tilesToExchange = tileIndices.map(i => aiHand[i]).filter(Boolean);
        const newHand = aiHand.filter((_, i) => !tileIndices.includes(i));
        const newTiles = drawTiles(tileBag, tilesToExchange.length);

        setPlayerHands(prev => ({
            ...prev,
            ai: [...newHand, ...newTiles]
        }));

        const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handleAIMove = (move) => {
        // Place AI tiles on board
        const newBoard = { ...board };
        move.tiles.forEach(t => {
            newBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
        });
        setBoard(newBoard);

        // Update AI score
        setPlayerScores(prev => ({
            ...prev,
            ai: prev.ai + (move.score || 0)
        }));

        // Show score popup
        setLastScore(move.score || 0);
        setLastWords([move.word]);
        setShowScorePopup(true);

        // Remove used tiles from AI hand
        const aiHand = playerHands['ai'] || [];
        const usedLetters = move.tiles.map(t => t.letter);
        const newHand = [...aiHand];
        usedLetters.forEach(letter => {
            const idx = newHand.findIndex(t => t.letter === letter);
            if (idx !== -1) newHand.splice(idx, 1);
        });

        // Draw new tiles
        const newTiles = drawTiles(tileBag, usedLetters.length);
        setPlayerHands(prev => ({
            ...prev,
            ai: [...newHand, ...newTiles]
        }));

        // Next turn
        const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

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

            // Check if this is a blank tile - show letter selection modal
            if (tile.letter === '_') {
                setPendingBlankPlacement({ x, y, handIndex: selectedTileIndex });
                setBlankTileModalVisible(true);
                setSelectedTileIndex(null);
                return;
            }

            const newPlacement = {
                x, y,
                letter: tile.letter,
                value: tile.value,
                handIndex: selectedTileIndex,
                isBlank: false
            };

            const updatedPlacedTiles = [...placedTiles, newPlacement];
            setPlacementHistory([...placementHistory, placedTiles]); // Save for undo
            setPlacedTiles(updatedPlacedTiles);
            setSelectedTileIndex(null); // Auto-deselect after placement
        }
    };

    // Handle blank tile letter selection
    const handleBlankLetterSelect = (chosenLetter) => {
        if (!pendingBlankPlacement) return;

        const { x, y, handIndex } = pendingBlankPlacement;
        const newPlacement = {
            x, y,
            letter: chosenLetter,
            value: 0, // Blank tiles are worth 0 points
            handIndex,
            isBlank: true // Mark as blank so it displays differently
        };

        const updatedPlacedTiles = [...placedTiles, newPlacement];
        setPlacementHistory([...placementHistory, placedTiles]);
        setPlacedTiles(updatedPlacedTiles);
        setBlankTileModalVisible(false);
        setPendingBlankPlacement(null);
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
        const nextPlayerIndex = (currentPlayerIndex + 1) % gamePlayers.length;
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
        // Calculate score with proper bonus squares
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

        let finalScore = score * wordMultiplier;

        // BINGO BONUS: 50 extra points for using all 7 tiles
        if (placements.length === 7) {
            finalScore += 50;
        }

        return finalScore;
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

        // Validation 4: No gaps - tiles must be contiguous (or bridged by existing tiles)
        if (placedTiles.length > 1) {
            const placedKeys = new Set(placedTiles.map(t => `${t.x},${t.y}`));

            if (isHorizontal) {
                const y = ys[0];
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);

                for (let x = minX; x <= maxX; x++) {
                    const key = `${x},${y}`;
                    // Each position must have either a placed tile or an existing locked tile
                    if (!placedKeys.has(key) && !(board[key] && board[key].isLocked)) {
                        Alert.alert("Invalid Move", "There are gaps between your tiles. Word must be continuous.");
                        return;
                    }
                }
            } else if (isVertical) {
                const x = xs[0];
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                for (let y = minY; y <= maxY; y++) {
                    const key = `${x},${y}`;
                    if (!placedKeys.has(key) && !(board[key] && board[key].isLocked)) {
                        Alert.alert("Invalid Move", "There are gaps between your tiles. Word must be continuous.");
                        return;
                    }
                }
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

        // Lock placed tiles on the board
        const newBoard = { ...board };
        placedTiles.forEach(t => {
            newBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
        });
        setBoard(newBoard);

        // Clear undo history after successful move
        setPlacementHistory([]);

        // Calculate and update score
        const turnScore = calculateTurnScore(placedTiles);
        setPlayerScores(prev => ({
            ...prev,
            [currentPlayer.id]: prev[currentPlayer.id] + turnScore
        }));

        // Show score popup with animation
        setLastScore(turnScore);
        setLastWords(formedWords.map(w => w.word));
        setShowScorePopup(true);

        // Refill Hand
        const usedIndices = placedTiles.map(t => t.handIndex);
        const keptTiles = currentHand.filter((_, i) => !usedIndices.includes(i));
        const newTiles = drawTiles(tileBag, usedIndices.length);

        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: [...keptTiles, ...newTiles]
        }));

        // Next Turn - reset consecutive passes on successful move
        setPlacedTiles([]);
        setConsecutivePasses(0); // Reset pass counter on successful move
        const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    const handlePass = () => {
        setPlacedTiles([]);
        const newPassCount = consecutivePasses + 1;
        setConsecutivePasses(newPassCount);

        // Game ends after all players pass consecutively (2 for 2 players, numPlayers for more)
        const passThreshold = gamePlayers.length;
        if (newPassCount >= passThreshold) {
            // Auto-end game due to consecutive passes
            handleAutoEndGame();
            return;
        }

        const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
        if (nextIndex === 0) setTurnNumber(prev => prev + 1);
        setCurrentPlayerIndex(nextIndex);
    };

    // Handle automatic game end (consecutive passes or empty bag + empty hand)
    const handleAutoEndGame = async () => {
        // Calculate final scores with tile deduction (official rule)
        const finalScoresWithDeduction = gamePlayers.map(p => {
            const baseScore = playerScores[p.id];
            const hand = playerHands[p.id] || [];
            // Subtract remaining tile values from score
            const tileDeduction = hand.reduce((sum, tile) => sum + tile.value, 0);
            return {
                playerId: p.id,
                name: p.name,
                score: Math.max(0, baseScore - tileDeduction), // Can't go negative
                tileDeduction
            };
        }).sort((a, b) => b.score - a.score);

        // Record stats for human player
        const humanPlayer = gamePlayers.find(p => !p.isAI);
        if (humanPlayer) {
            const playerFinal = finalScoresWithDeduction.find(s => s.playerId === humanPlayer.id);
            const won = finalScoresWithDeduction[0].playerId === humanPlayer.id;

            try {
                await PlayerStatsService.recordGame('scrabble', {
                    won,
                    score: playerFinal?.score || 0,
                    players: gamePlayers.map(p => p.name)
                });
            } catch (error) {
                console.error('[Scrabble] Failed to record stats:', error);
            }
        }

        navigation.navigate('Scoreboard', {
            finalScores: finalScoresWithDeduction,
            players: gamePlayers,
            gameEnded: 'passes'
        });
    };

    const handleEndGameConfirm = async () => {
        setEndGameModalVisible(false);

        // Calculate final scores list
        const finalScores = gamePlayers.map(p => ({
            playerId: p.id,
            score: playerScores[p.id]
        })).sort((a, b) => b.score - a.score);

        // Record stats for the player (not AI)
        const humanPlayer = gamePlayers.find(p => !p.isAI);
        if (humanPlayer) {
            const playerScore = playerScores[humanPlayer.id];
            const won = finalScores[0].playerId === humanPlayer.id;

            try {
                await PlayerStatsService.recordGame('scrabble', {
                    won,
                    score: playerScore,
                    players: gamePlayers.map(p => p.name)
                });
                console.log('[Scrabble] Stats recorded:', { won, score: playerScore });
            } catch (error) {
                console.error('[Scrabble] Failed to record stats:', error);
            }
        }

        // Construct simplified room object for ScoreboardScreen
        const roomData = {
            id: 'local',
            gameType: 'scrabble',
            players: gamePlayers  // Use gamePlayers to include AI
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

        // Enhanced bonus square colors
        let bgColor = 'rgba(20,30,40,0.9)';
        let bonusTextColor = '#fff';
        let borderColor = 'rgba(255,255,255,0.1)';

        if (bonus === 'TW') {
            bgColor = '#d10000'; // Vibrant red
            borderColor = '#ff0000';
        } else if (bonus === 'DW') {
            bgColor = '#ff6b93'; // Pink
            borderColor = '#ff99aa';
        } else if (bonus === 'TL') {
            bgColor = '#0044cc'; // Deep blue
            borderColor = '#0066ff';
        } else if (bonus === 'DL') {
            bgColor = '#00aaff'; // Bright cyan
            bonusTextColor = '#000';
            borderColor = '#33bbff';
        }

        if (x === CENTER_SQUARE && y === CENTER_SQUARE) {
            bgColor = '#ff1493'; // Deep pink
            borderColor = '#ff69b4';
        }

        if (tile) {
            bgColor = tile.isLocked ? '#d4a574' : '#ffee99';
            borderColor = tile.isLocked ? '#b8935a' : '#ffd700';
        }

        return (
            <TouchableOpacity
                key={key}
                style={[
                    styles.square,
                    {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        borderWidth: bonus || (x === CENTER_SQUARE && y === CENTER_SQUARE) ? 1.5 : 0.5,
                    }
                ]}
                onPress={() => handleBoardSquarePress(x, y)}
                activeOpacity={0.8}
            >
                {tile ? (
                    <View style={styles.tileContent}>
                        {tile.isBlank && <View style={styles.blankTileIndicator} />}
                        <NeonText size={Math.max(tileSize * 0.55, 10)} color="#000" weight="bold">{tile.letter}</NeonText>
                        <NeonText size={Math.max(tileSize * 0.25, 6)} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                    </View>
                ) : (
                    <View style={styles.bonusContent}>
                        {x === CENTER_SQUARE && y === CENTER_SQUARE && (
                            <NeonText size={Math.max(tileSize * 0.5, 8)} color={bonusTextColor}>★</NeonText>
                        )}
                        {bonus && (
                            <NeonText size={Math.max(tileSize * 0.35, 6)} weight="bold" color={bonusTextColor}>
                                {bonus}
                            </NeonText>
                        )}
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
                    {gamePlayers.map(p => (
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
                                    <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">
                                        {tile.letter === '_' ? '★' : tile.letter}
                                    </NeonText>
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
                                <TouchableOpacity style={styles.smallBtn} onPress={handlePass}>
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

            {/* Score Popup */}
            <ScorePopup
                score={lastScore}
                words={lastWords}
                visible={showScorePopup}
                onComplete={() => setShowScorePopup(false)}
                position="center"
            />

            {/* End Game Button */}
            <TouchableOpacity
                style={styles.endGameBtn}
                onPress={() => setEndGameModalVisible(true)}
            >
                <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
            </TouchableOpacity>

            {/* Blank Tile Letter Selection Modal */}
            <Modal
                transparent={true}
                visible={blankTileModalVisible}
                animationType="fade"
                onRequestClose={() => {
                    setBlankTileModalVisible(false);
                    setPendingBlankPlacement(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, styles.blankTileModal]}>
                        <NeonText size={20} weight="bold" glow style={{ marginBottom: 5 }}>
                            Choose a Letter
                        </NeonText>
                        <NeonText size={12} color="#888" style={{ marginBottom: 15 }}>
                            Select what letter your blank tile will represent
                        </NeonText>
                        <View style={styles.letterGrid}>
                            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                                <TouchableOpacity
                                    key={letter}
                                    style={styles.letterButton}
                                    onPress={() => handleBlankLetterSelect(letter)}
                                >
                                    <NeonText size={18} weight="bold" color={COLORS.limeGlow}>
                                        {letter}
                                    </NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.modalCancel}
                            onPress={() => {
                                setBlankTileModalVisible(false);
                                setPendingBlankPlacement(null);
                            }}
                        >
                            <NeonText>Cancel</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    blankTileModal: {
        maxWidth: 350,
    },
    letterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 15,
    },
    letterButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
    },
    blankTileIndicator: {
        position: 'absolute',
        top: 1,
        left: 1,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.neonCyan,
    },
});

export default ScrabbleScreen;
