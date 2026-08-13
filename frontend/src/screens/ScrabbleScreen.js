import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ScorePopup from '../components/ScorePopup';
import DraggableRack from '../components/DraggableRack';
import {
    LETTER_TILES,
    createTileBag,
    drawTiles,
    isValidWord,
    BOARD_SIZE,
    CENTER_SQUARE,
    BONUS_SQUARES,
    loadDictionary,
    isDictionaryLoaded
} from '../data/scrabbleData';
import { useTheme } from '../context/ThemeContext';
import PlayerStatsService from '../services/PlayerStatsService';
import { findBestMove, warmUp } from '../ai/ScrabbleAIEngine';

const HAND_SIZE = 7;

const ScrabbleScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { players = [], difficulty = 'medium', isSinglePlayer = false } = route.params || {};
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Debug logging
    console.log('[ScrabbleScreen] Params:', { players, difficulty, paramsExist: !!route.params });

    // Early validation - if no players, show error and go back
    useEffect(() => {
        if (!players || players.length === 0) {
            console.error('[ScrabbleScreen] No players provided - navigating back');
            Alert.alert('Error', 'No players specified', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    }, []);
    const gamePlayers = [...(players || [])];
    // Inject AI player if it's single player and AI is missing
    if (isSinglePlayer && gamePlayers.length === 1) {
        gamePlayers.push({
            id: 'ai-player',
            uid: 'ai-player',
            name: 'Rave AI',
            isAI: true,
            avatar: 'https://api.dicebear.com/7.x/bottts/png?seed=RaveAI&backgroundColor=b6e3f4'
        });
    }
    // Calculate tile size dynamically based on screen dimensions
    const isDesktop = screenWidth > 768;
    const availableWidth = screenWidth * 0.96;
    // For mobile, leave space for header and controls (approx 250-300px)
    const availableHeight = Math.max(screenHeight - (isDesktop ? 300 : 320), 150);
    const availableSize = Math.min(availableWidth, availableHeight);
    
    // Simply take the available size divided by 15, keeping a sensible minimum
    const tileSize = Math.max(Math.floor(availableSize / BOARD_SIZE), 18);
    const rackTileSize = Math.min(Math.max(tileSize * 1.3, 40), 55);

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    // Initialize bag and hands together without triggering state updates during render
    const initialGameState = useMemo(() => {
        const bag = createTileBag();
        const hands = {};
        gamePlayers.forEach(player => {
            hands[player.id] = drawTiles(bag, HAND_SIZE);
        });
        return { bag, hands };
    }, [gamePlayers]);

    const [tileBag, setTileBag] = useState(initialGameState.bag);
    const [dictionaryLoaded, setDictionaryLoaded] = useState(isDictionaryLoaded);
    const scrollViewRef = useRef(null);
    const boardGridRef = useRef(null); // FIX: Track board grid for absolute measurement

    // Game State
    const [board, setBoard] = useState({}); // { "x,y": { letter: 'A', value: 1, isLocked: true } }
    const [playerHands, setPlayerHands] = useState(initialGameState.hands);

    const [playerScores, setPlayerScores] = useState(() => {
        const scores = {};
        gamePlayers.forEach(player => { scores[player.id] = 0; });
        return scores;
    });

    const currentPlayer = gamePlayers[currentPlayerIndex];
    const currentHand = playerHands[currentPlayer?.id] || [];

    const [selectedTileIndex, setSelectedTileIndex] = useState(null); // Index in hand
    const [placedTiles, setPlacedTiles] = useState([]); // Array of { x, y, letter, value, handIndex }
    const [placementHistory, setPlacementHistory] = useState([]); // Track for undo
    const [turnNumber, setTurnNumber] = useState(1);
    const [consecutivePasses, setConsecutivePasses] = useState(0); // Track passes for end game
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);
    const [blankTileModalVisible, setBlankTileModalVisible] = useState(false);
    const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null);

    // Tile exchange state
    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedTilesForExchange, setSelectedTilesForExchange] = useState([]); // Indices in hand

    // Score popup state
    const [showScorePopup, setShowScorePopup] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [lastWords, setLastWords] = useState([]);
    
    // Custom Error Modal State
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

    // Helper to show custom alert
    const showAlert = (title, message) => {
        setErrorModalContent({ title, message });
        setErrorModalVisible(true);
    };

    // Load dictionary on mount
    useEffect(() => {
        if (!isDictionaryLoaded) {
            loadDictionary().then(() => {
                setDictionaryLoaded(true);
                if (isSinglePlayer) {
                    warmUp();
                }
            });
        } else if (isSinglePlayer) {
            warmUp();
        }
    }, [isSinglePlayer]);

    // AI Turn logic
    useEffect(() => {
        if (!isSinglePlayer || !dictionaryLoaded || currentPlayerIndex !== 1 || endGameModalVisible || errorModalVisible) {
            return;
        }

        const aiId = currentPlayer.id;
        if (!aiId || !aiId.startsWith('ai-')) return; 

        console.log(`[ScrabbleScreen] AI Turn Starting (${difficulty})`);

        const timerId = setTimeout(() => {
            const aiMove = findBestMove(board, currentHand, tileBag, difficulty);
            
            if (!aiMove || aiMove.type === 'pass') {
                console.log('[ScrabbleScreen] AI decided to pass');
                handlePass();
                return;
            }

            if (aiMove.type === 'exchange') {
                console.log('[ScrabbleScreen] AI decided to exchange', aiMove.tileIndices);
                
                const keptTiles = currentHand.filter((_, i) => !aiMove.tileIndices.includes(i));
                const exchangedTiles = currentHand.filter((_, i) => aiMove.tileIndices.includes(i));

                // Work from a copy so mutations from drawTiles don't corrupt the original ref.
                // Shuffle returned tiles into the bag before drawing, matching the human exchange path.
                const bagCopy = [...tileBag, ...exchangedTiles];
                for (let i = bagCopy.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bagCopy[i], bagCopy[j]] = [bagCopy[j], bagCopy[i]];
                }
                const newTiles = bagCopy.splice(0, exchangedTiles.length);

                setTileBag(bagCopy); // bagCopy now has the drawn tiles removed
                setPlayerHands(prev => ({
                    ...prev,
                    [aiId]: [...keptTiles, ...newTiles]
                }));
                
                setConsecutivePasses(0); 
                const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
                if (nextIndex === 0) setTurnNumber(prev => prev + 1);
                setCurrentPlayerIndex(nextIndex);
                
                setLastScore(0);
                setLastWords(['(Exchanged Tiles)']);
                setShowScorePopup(true);
                return;

            }

            if (aiMove.type === 'move') {
                console.log('[ScrabbleScreen] AI decided to play word for', aiMove.score);
                
                const newBoard = { ...board };
                aiMove.tiles.forEach(t => {
                    newBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
                });
                
                setBoard(newBoard);
                
                setPlayerScores(prev => ({
                    ...prev,
                    [aiId]: prev[aiId] + aiMove.score
                }));
                
                setLastScore(aiMove.score);
                const playedLetters = aiMove.tiles.map(t => t.letter).join('');
                setLastWords([playedLetters]);
                setShowScorePopup(true);
                
                const newHand = [...currentHand];
                aiMove.tiles.forEach(pt => {
                    const searchLetter = pt.isBlank ? '_' : pt.letter;
                    const idx = newHand.findIndex(t => t.letter === searchLetter);
                    if (idx !== -1) {
                        newHand.splice(idx, 1);
                    }
                });
                
                const drawn = drawTiles(tileBag, aiMove.tiles.length);
                
                setPlayerHands(prev => ({
                    ...prev,
                    [aiId]: [...newHand, ...drawn]
                }));
                
                setConsecutivePasses(0);
                const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
                if (nextIndex === 0) setTurnNumber(prev => prev + 1);
                setCurrentPlayerIndex(nextIndex);
            }

        }, 1500); 

        return () => clearTimeout(timerId);
    }, [currentPlayerIndex, isSinglePlayer, dictionaryLoaded, endGameModalVisible, errorModalVisible]);

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

    // FIX: Scrabble Drag and Drop
    const handleTileDrop = (handIndex, moveX, moveY) => {
        if (!boardGridRef.current) return;
        
        boardGridRef.current.measure((x, y, width, height, pageX, pageY) => {
            // Check if dropped inside the board grid
            const dropX = moveX - pageX;
            const dropY = moveY - pageY;

            if (dropX >= 0 && dropX <= width && dropY >= 0 && dropY <= height) {
                const gridX = Math.floor(dropX / tileSize);
                const gridY = Math.floor(dropY / tileSize);

                // Set selection state purely for UI consistency
                setSelectedTileIndex(handIndex);
                
                // Immediately press the board square using the dragIndex parameter
                handleBoardSquarePress(gridX, gridY, handIndex);
            }
        });
    };

    const handleBoardSquarePress = (x, y, dragIndex = null) => {
        const indexToUse = dragIndex !== null ? dragIndex : selectedTileIndex;
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
        if (indexToUse !== null) {
            // Check if this specific tile from hand is already placed elsewhere?
            // Actually, we track availability by checking if hand index is in placedTiles
            const isAlreadyPlaced = placedTiles.some(t => t.handIndex === indexToUse);
            if (isAlreadyPlaced) {
                // Should not happen if UI disables used tiles, but safety check
                return;
            }

            const tile = currentHand[indexToUse];

            // Check if this is a blank tile - show letter selection modal
            if (tile.letter === '_') {
                setPendingBlankPlacement({ x, y, handIndex: indexToUse });
                setBlankTileModalVisible(true);
                setSelectedTileIndex(null);
                return;
            }

            const newPlacement = {
                x, y,
                letter: tile.letter,
                value: tile.value,
                handIndex: indexToUse,
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

        // Advance turn — exchange counts as a non-pass action, so reset the counter
        setConsecutivePasses(0);
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
        const tiles = [];

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

    /**
     * Calculate the total score for a turn given the list of formed words and
     * the set of newly placed tiles. Each word is scored in full (all tiles in
     * the word), but bonus squares (DL/TL/DW/TW) only apply to freshly placed
     * tiles — existing board tiles are counted at face value.
     */
    const calculateTurnScore = (formedWordsList, placements) => {
        const placedKeys = new Set(placements.map(t => `${t.x},${t.y}`));
        let totalScore = 0;

        formedWordsList.forEach(({ tiles }) => {
            let wordScore = 0;
            let wordMultiplier = 1;

            tiles.forEach(t => {
                let letterScore = t.value || 0;
                const key = `${t.x},${t.y}`;

                // Bonus squares only activate for newly placed tiles
                if (placedKeys.has(key)) {
                    const bonus = BONUS_SQUARES[key];
                    if (bonus === 'DL') letterScore *= 2;
                    if (bonus === 'TL') letterScore *= 3;
                    if (bonus === 'DW') wordMultiplier *= 2;
                    if (bonus === 'TW') wordMultiplier *= 3;
                }

                wordScore += letterScore;
            });

            totalScore += wordScore * wordMultiplier;
        });

        // BINGO BONUS: 50 extra points for using all 7 tiles
        if (placements.length === 7) {
            totalScore += 50;
        }

        return totalScore;
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
            showAlert("Invalid Move", "You must form at least one valid word.");
            return;
        }

        // Validate each word against dictionary
        const invalidWords = formedWords.filter(w => !isValidWord(w.word));
        if (invalidWords.length > 0) {
            const wordList = invalidWords.map(w => w.word).join(', ');
            showAlert(
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

        // Calculate and update score — pass all formed words so that existing
        // board tiles in the word (e.g. ATE in FATE) are included in the total.
        const turnScore = calculateTurnScore(formedWords, placedTiles);
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

        const finalHand = [...keptTiles, ...newTiles];
        setPlayerHands(prev => ({
            ...prev,
            [currentPlayer.id]: finalHand
        }));

        if (finalHand.length === 0 && tileBag.length === 0) {
            handleAutoEndGame();
            return;
        }

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

        // Standard Scrabble: game ends after 6 consecutive passes (3 full rounds for 2 players).
        // Use numPlayers * 3 so it scales correctly for more players.
        const passThreshold = gamePlayers.length * 3;
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

        const roomData = {
            id: 'local',
            gameType: 'scrabble',
            players: gamePlayers
        };

        navigation.navigate('Scoreboard', {
            room: roomData,
            finalScores: finalScoresWithDeduction,
            players: gamePlayers,
            gameEnded: 'passes'
        });
    };

    const handleEndGameConfirm = async () => {
        setEndGameModalVisible(false);

        // Calculate final scores list — include name so ScoreboardScreen can display it
        const finalScores = gamePlayers.map(p => ({
            playerId: p.id,
            name: p.name,
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
        let bonusTextColor = COLORS.white;
        let borderColor = COLORS.surfaceLight;

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
                            <NeonText 
                                size={Math.max(tileSize * 0.35, 6)} 
                                weight="bold" 
                                color={bonusTextColor}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                                style={{ textAlign: 'center', width: '100%' }}
                            >
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

    const renderActionButtons = () => (
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
    );

    const renderRackSection = () => (
        <View style={styles.rackContainer}>
            <NeonText size={12} color={COLORS.textDarkMuted} style={{ marginBottom: 4 }}>Your Rack:</NeonText>
            <DraggableRack
                hand={currentHand}
                placedTiles={placedTiles}
                selectedTileIndex={selectedTileIndex}
                exchangeMode={exchangeMode}
                selectedTilesForExchange={selectedTilesForExchange}
                rackTileSize={rackTileSize}
                onTilePress={handleRackTilePress}
                onTileDrop={handleTileDrop} // Pass down the drop handler
            />
        </View>
    );

    if (!dictionaryLoaded) {
        return (
            <NeonContainer showMuteButton={!isSinglePlayer}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <NeonText size={24} weight="bold" glow>Loading Dictionary...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showMuteButton={!isSinglePlayer}>
            <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
                
                {isDesktop ? (
                    <View style={styles.desktopLayout}>
                        {/* ─ DESKTOP TOP HEADER ─ */}
                        <View style={styles.desktopTopHeader}>
                            <NeonText size={28} weight="bold" glow>SCRABBLE</NeonText>
                            <View style={styles.desktopHeaderCenter}>
                                <NeonText size={18} color={COLORS.limeGlow} weight="bold">
                                    {`⏳ ${currentPlayer.name}'s Turn`}
                                </NeonText>
                            </View>
                            <View style={styles.desktopScoreRow}>
                                {gamePlayers.map(p => (
                                    <View key={p.id} style={[styles.miniScore, styles.desktopMiniScore, p.id === currentPlayer.id && styles.activeMiniScore]}>
                                        <NeonText size={10} color={p.id === currentPlayer.id ? COLORS.neonCyan : COLORS.textMuted} numberOfLines={1}>{p.name}</NeonText>
                                        <NeonText size={16} weight="bold">{playerScores[p.id]}</NeonText>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.desktopMainRow}>
                            {/* ─ DESKTOP LEFT BOARD AREA ─ */}
                            <View style={styles.desktopBoardArea}>
                                <View style={styles.desktopBoardWrapper}>
                                    <ScrollView
                                        ref={scrollViewRef}
                                        style={styles.boardContainer}
                                        contentContainerStyle={styles.boardContent}
                                        maximumZoomScale={3}
                                        minimumZoomScale={1}
                                        horizontal
                                        bounces={false}
                                    >
                                        <ScrollView nestedScrollEnabled bounces={false} contentContainerStyle={styles.innerScrollContent}>
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <View 
                                                    style={styles.gridContainer}
                                                    ref={boardGridRef}
                                                    collapsable={false}
                                                >
                                                    {renderGrid()}
                                                </View>
                                            </View>
                                        </ScrollView>
                                    </ScrollView>
                                </View>
                                {/* RACK PINNED AT BOTTOM OF BOARD AREA */}
                                <View style={styles.desktopRackContainer}>
                                    {renderRackSection()}
                                </View>
                            </View>

                            {/* ─ DESKTOP RIGHT SIDEBAR ─ */}
                            <View style={styles.desktopRightSidebar}>
                                <ScrollView contentContainerStyle={styles.desktopControlsScroll} bounces={false}>
                                    <View style={styles.desktopControlsArea}>
                                        {renderActionButtons()}
                                    </View>
                                </ScrollView>
                                <TouchableOpacity style={[styles.smallBtn, { marginTop: 'auto', alignSelf: 'center', marginBottom: 20 }]} onPress={() => setEndGameModalVisible(true)}>
                                    <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.header}>
                            <NeonText size={18} weight="bold" glow>SCRABBLE</NeonText>
                            <View style={styles.scoreRow}>
                                {gamePlayers.map(p => (
                                    <View key={p.id} style={[styles.miniScore, p.id === currentPlayer.id && styles.activeMiniScore]}>
                                        <NeonText size={10} color={p.id === currentPlayer.id ? COLORS.neonCyan : COLORS.textMuted}>{p.name}</NeonText>
                                        <NeonText size={14} weight="bold">{playerScores[p.id]}</NeonText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}



                {!isDesktop && (
                    <View style={[styles.boardWrapper, isDesktop && styles.desktopBoardWrapper]}>
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.boardContainer}
                            contentContainerStyle={styles.boardContent}
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                            horizontal
                            bounces={false}
                        >
                            <ScrollView nestedScrollEnabled bounces={false} contentContainerStyle={styles.innerScrollContent}>
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <View 
                                        style={styles.gridContainer}
                                        ref={boardGridRef}
                                        collapsable={false}
                                    >
                                        {renderGrid()}
                                    </View>
                                </View>
                            </ScrollView>
                        </ScrollView>
                    </View>
                )}

                {!isDesktop && (
                    <View style={styles.controlsArea}>
                        {renderRackSection()}
                        {renderActionButtons()}
                    </View>
                )}
            </View>

            {/* Score Popup */}
            <ScorePopup
                score={lastScore}
                words={lastWords}
                visible={showScorePopup}
                onComplete={() => setShowScorePopup(false)}
                position="center"
            />

            {!isDesktop && (
                <TouchableOpacity
                    style={styles.endGameBtn}
                    onPress={() => setEndGameModalVisible(true)}
                >
                    <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
                </TouchableOpacity>
            )}

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
                        <NeonText size={12} color={COLORS.textMuted} style={{ marginBottom: 15 }}>
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

            {/* Error Popup Modal */}
            <Modal
                transparent={true}
                visible={errorModalVisible}
                animationType="fade"
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setErrorModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { borderColor: COLORS.cancelRed, shadowColor: COLORS.cancelRed, shadowOpacity: 0.5, shadowRadius: 10 }]}>
                            <NeonText size={22} weight="bold" color={COLORS.cancelRed} glow style={styles.errorModalTitle}>
                                {errorModalContent.title === 'Invalid Word(s)' ? 'INCORRECT WORD' : errorModalContent.title.toUpperCase()}
                            </NeonText>
                            <NeonText size={16} color="#ddd" style={{ textAlign: 'center', marginBottom: 25, lineHeight: 24 }}>
                                {errorModalContent.message}
                            </NeonText>
                            <TouchableOpacity style={styles.errorDismissBtn} onPress={() => setErrorModalVisible(false)}>
                                <NeonText color="#000" weight="bold" size={16}>Thank you</NeonText>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </NeonContainer>
    );
};


const getStyles = (COLORS) => StyleSheet.create({
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
    boardWrapper: {
        flex: 1,
    },
    mainLayout: {
        flex: 1,
        flexDirection: 'column',
    },
    boardContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    innerScrollContent: {
        flexGrow: 1,
        minHeight: '100%',
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
        borderColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        userSelect: 'none',
        aspectRatio: 1,
        flexShrink: 0,
    },
    bonusContent: {
        justifyContent: 'center',
        alignItems: 'center',
        userSelect: 'none',
        aspectRatio: 1,
    },
    tileContent: {
        width: '90%',
        height: '90%',
        backgroundColor: '#e1c699', // Classic wood color look
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
        userSelect: 'none',
        aspectRatio: 1,
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
        backgroundColor: COLORS.surfaceLight,
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
        backgroundColor: COLORS.surfaceLight,
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
    errorModalTitle: {
        marginBottom: 15,
        textShadowColor: COLORS.cancelRed,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    errorDismissBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        backgroundColor: COLORS.cancelRed,
        minWidth: 120,
        alignItems: 'center',
        shadowColor: COLORS.cancelRed,
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    // Desktop Responsive Styles
    desktopLayout: {
        flex: 1,
        flexDirection: 'column',
    },
    desktopTopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 15,
        backgroundColor: COLORS.deepNightBlack,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    desktopHeaderCenter: {
        flex: 1,
        alignItems: 'center',
    },
    desktopScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    desktopMainRow: {
        flex: 1,
        flexDirection: 'row',
        minHeight: 0,
        overflow: 'hidden',
    },
    desktopBoardArea: {
        flex: 3,
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        minHeight: 0,
        overflow: 'hidden',
    },
    desktopBoardWrapper: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        overflow: 'hidden',
    },
    desktopRackContainer: {
        paddingVertical: 20,
        paddingHorizontal: 10,
        backgroundColor: COLORS.deepNightBlack,
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'center',
    },
    desktopRightSidebar: {
        flex: 1,
        maxWidth: 320,
        backgroundColor: COLORS.deepNightBlack,
        borderLeftWidth: 1,
        borderLeftColor: '#333',
        paddingTop: 20,
        zIndex: 10,
    },
    desktopMiniScore: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    desktopControlsScroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    desktopControlsArea: {
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 20,
    },
    desktopRack: {
        flexDirection: 'row',
        gap: 8,
    },
});

export default ScrabbleScreen;
