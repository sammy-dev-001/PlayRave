import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ScorePopup from '../components/ScorePopup';
import SocketService from '../services/socket';
import { BOARD_SIZE, CENTER_SQUARE, BONUS_SQUARES } from '../data/scrabbleData';
import { COLORS } from '../constants/theme';

const OnlineScrabbleScreen = ({ route, navigation }) => {
    const { room, playerName, gameState: initialGameState } = route.params;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Calculate tile sizes - improved for desktop
    const isDesktop = screenWidth > 768;
    const availableSize = Math.min(screenWidth * 0.9, screenHeight - 300);
    const minTileSize = isDesktop ? 28 : 18;
    const maxTileSize = isDesktop ? 40 : 30;
    const tileSize = Math.min(maxTileSize, Math.max(Math.floor(availableSize / BOARD_SIZE), minTileSize));
    const rackTileSize = Math.min(Math.max(tileSize * 1.3, 40), 55);

    // Game state from server
    const [gameState, setGameState] = useState(null);
    const [board, setBoard] = useState({});
    const [myHand, setMyHand] = useState([]);
    const [players, setPlayers] = useState([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [currentPlayerName, setCurrentPlayerName] = useState('');

    // Local UI state
    const [selectedTileIndex, setSelectedTileIndex] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);
    const [placementHistory, setPlacementHistory] = useState([]); // Track for undo
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);

    // Tile exchange state
    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedTilesForExchange, setSelectedTilesForExchange] = useState([]);

    // Score popup state
    const [showScorePopup, setShowScorePopup] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [lastWords, setLastWords] = useState([]);
    const scrollViewRef = useRef(null);

    // Blank tile selection modal state
    const [blankTileModalVisible, setBlankTileModalVisible] = useState(false);
    const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null); // { x, y, handIndex }

    // Initialize from route params if available
    useEffect(() => {
        if (initialGameState) {
            console.log('Initializing from route params:', initialGameState);
            updateGameState(initialGameState);
        }
    }, []);

    useEffect(() => {
        // Listen for game start (for late joiners or reconnections)
        const handleGameStarted = (data) => {
            if (data.gameType === 'scrabble') {
                console.log('Scrabble game started:', data.gameState);
                updateGameState(data.gameState);
            }
        };

        // Listen for move submissions
        const handleMoveSubmitted = (data) => {
            console.log('Move submitted:', data);
            if (data.success) {
                updateGameState(data.gameState);

                // Show score popup
                if (data.score) {
                    setLastScore(data.score);
                    setLastWords(data.formedWords || []);
                    setShowScorePopup(true);
                }

                if (data.gameEnded) {
                    // Navigate to scoreboard
                    navigation.navigate('Scoreboard', {
                        room: room,
                        finalScores: data.finalScores
                    });
                }
            }
        };

        // Listen for turn passes
        const handleTurnPassed = (data) => {
            console.log('Turn passed:', data);
            updateGameState(data.gameState);

            if (data.gameEnded) {
                navigation.navigate('Scoreboard', {
                    room: room,
                    finalScores: data.finalScores
                });
            }
        };

        // Listen for game end
        const handleGameEnded = (data) => {
            console.log('Game ended:', data);
            navigation.navigate('Scoreboard', {
                room: room,
                finalScores: data.finalScores
            });
        };

        // Listen for errors
        const handleError = (error) => {
            console.error('Socket error:', error);
            if (error.invalidWords && error.invalidWords.length > 0) {
                Alert.alert(
                    'Invalid Words',
                    `These words are not in the dictionary:\n\n${error.invalidWords.join(', ')}`
                );
            } else {
                Alert.alert('Error', error.message || 'An error occurred');
            }
        };

        // Listen for tile exchange
        const handleTilesExchanged = (data) => {
            console.log('Tiles exchanged:', data);
            if (data.success) {
                updateGameState(data.gameState);
                setExchangeMode(false);
                setSelectedTilesForExchange([]);
            }
        };

        SocketService.on('game-started', handleGameStarted);
        SocketService.on('scrabble-move-submitted', handleMoveSubmitted);
        SocketService.on('scrabble-turn-passed', handleTurnPassed);
        SocketService.on('scrabble-game-ended', handleGameEnded);
        SocketService.on('scrabble-tiles-exchanged', handleTilesExchanged);
        SocketService.on('error', handleError);

        return () => {
            SocketService.off('game-started', handleGameStarted);
            SocketService.off('scrabble-move-submitted', handleMoveSubmitted);
            SocketService.off('scrabble-turn-passed', handleTurnPassed);
            SocketService.off('scrabble-game-ended', handleGameEnded);
            SocketService.off('scrabble-tiles-exchanged', handleTilesExchanged);
            SocketService.off('error', handleError);
        };
    }, [navigation, room]);

    const updateGameState = (state) => {
        if (!state) return;

        setGameState(state);
        setBoard(state.board || {});
        setMyHand(state.myHand || []);
        setPlayers(state.players || []);
        setIsMyTurn(state.isMyTurn || false);
        setCurrentPlayerName(state.currentPlayerName || '');
        setPlacedTiles([]); // Clear placed tiles when state updates
    };

    const handleRackTilePress = (index) => {
        if (!isMyTurn) {
            Alert.alert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        if (exchangeMode) {
            // Exchange mode: toggle selection
            if (selectedTilesForExchange.includes(index)) {
                setSelectedTilesForExchange(selectedTilesForExchange.filter(i => i !== index));
            } else {
                setSelectedTilesForExchange([...selectedTilesForExchange, index]);
            }
        } else {
            // Normal placement mode
            if (selectedTileIndex === index) {
                setSelectedTileIndex(null);
            } else {
                setSelectedTileIndex(index);
            }
        }
    };

    const handleBoardSquarePress = (x, y) => {
        if (!isMyTurn) {
            Alert.alert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        const key = `${x},${y}`;

        // Can't place on locked tiles
        if (board[key] && board[key].isLocked) return;

        // Remove tile if already placed here
        const existingPlacedIndex = placedTiles.findIndex(t => t.x === x && t.y === y);
        if (existingPlacedIndex !== -1) {
            setPlacedTiles(placedTiles.filter((_, i) => i !== existingPlacedIndex));
            return;
        }

        // Place new tile
        if (selectedTileIndex !== null) {
            const isAlreadyPlaced = placedTiles.some(t => t.handIndex === selectedTileIndex);
            if (isAlreadyPlaced) return;

            const tile = myHand[selectedTileIndex];

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
            setSelectedTileIndex(null);
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
            isBlank: true
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
        SocketService.emit('scrabble-recall-tiles', { roomId: room.id });
    };

    const handleUndo = () => {
        if (placementHistory.length > 0) {
            const previousState = placementHistory[placementHistory.length - 1];
            setPlacedTiles(previousState);
            setPlacementHistory(placementHistory.slice(0, -1));
        }
    };

    const handleSubmitMove = () => {
        if (!isMyTurn) {
            Alert.alert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        if (placedTiles.length === 0) {
            Alert.alert('No Tiles Placed', 'Please place some tiles first');
            return;
        }

        // Submit to server
        SocketService.emit('scrabble-submit-move', {
            roomId: room.id,
            tiles: placedTiles
        });
    };

    const handlePass = () => {
        if (!isMyTurn) {
            Alert.alert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        Alert.alert(
            'Pass Turn',
            'Are you sure you want to pass your turn?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pass',
                    onPress: () => {
                        SocketService.emit('scrabble-pass-turn', { roomId: room.id });
                        setPlacedTiles([]);
                    }
                }
            ]
        );
    };

    const handleToggleExchangeMode = () => {
        if (!isMyTurn) {
            Alert.alert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        if (exchangeMode) {
            setExchangeMode(false);
            setSelectedTilesForExchange([]);
        } else {
            if (placedTiles.length > 0) {
                Alert.alert("Cannot Exchange", "Recall your placed tiles first.");
                return;
            }
            setExchangeMode(true);
            setSelectedTileIndex(null);
        }
    };

    const handleConfirmExchange = () => {
        if (selectedTilesForExchange.length === 0) {
            Alert.alert("No Tiles Selected", "Please select tiles to exchange.");
            return;
        }

        SocketService.emit('scrabble-exchange-tiles', {
            roomId: room.id,
            tileIndices: selectedTilesForExchange
        });
    };

    const handleEndGameConfirm = () => {
        setEndGameModalVisible(false);
        SocketService.emit('scrabble-end-game', { roomId: room.id });
    };

    const renderBoardSquare = (x, y) => {
        const key = `${x},${y}`;
        const lockedTile = board[key];
        const placedTile = placedTiles.find(t => t.x === x && t.y === y);
        const tile = lockedTile || placedTile;
        const bonus = BONUS_SQUARES[key];

        let bgColor = 'rgba(255,255,255,0.05)';
        if (bonus === 'TW') bgColor = '#ff0055';
        if (bonus === 'DW') bgColor = '#ff99aa';
        if (bonus === 'TL') bgColor = '#0055ff';
        if (bonus === 'DL') bgColor = '#99ccff';
        if (x === CENTER_SQUARE && y === CENTER_SQUARE) bgColor = '#ff99aa';

        if (tile) bgColor = tile.isLocked ? '#e1c699' : '#fffebb';

        return (
            <TouchableOpacity
                key={key}
                style={[styles.square, { width: tileSize, height: tileSize, backgroundColor: bgColor }]}
                onPress={() => handleBoardSquarePress(x, y)}
                activeOpacity={0.8}
                disabled={!isMyTurn}
            >
                {tile ? (
                    <View style={styles.tileContent}>
                        {tile.isBlank && <View style={styles.blankTileIndicator} />}
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

    if (!gameState) {
        return (
            <NeonContainer>
                <View style={styles.loadingContainer}>
                    <NeonText size={20} weight="bold">Loading game...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer>
            {/* Header */}
            <View style={styles.header}>
                <NeonText size={18} weight="bold" glow>SCRABBLE</NeonText>
                <View style={styles.scoreRow}>
                    {players.map(p => (
                        <View key={p.id} style={[styles.miniScore, p.name === currentPlayerName && styles.activeMiniScore]}>
                            <NeonText size={10} color={p.name === currentPlayerName ? COLORS.neonCyan : '#888'}>{p.name}</NeonText>
                            <NeonText size={14} weight="bold">{p.score}</NeonText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Turn Indicator */}
            <View style={styles.turnIndicator}>
                <NeonText size={14} color={isMyTurn ? COLORS.limeGlow : COLORS.hotPink} weight="bold">
                    {isMyTurn ? '🎯 YOUR TURN' : `⏳ ${currentPlayerName}'s Turn`}
                </NeonText>
            </View>

            {/* Board */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.boardContainer}
                contentContainerStyle={styles.boardContent}
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
                        {myHand.map((tile, index) => {
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
                                    disabled={!isMyTurn}
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
                                    style={[styles.smallBtn, (!isMyTurn || placementHistory.length === 0) && styles.disabledBtn]}
                                    onPress={handleUndo}
                                    disabled={!isMyTurn || placementHistory.length === 0}
                                >
                                    <NeonText size={12}>↶ Undo</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.smallBtn, !isMyTurn && styles.disabledBtn]}
                                    onPress={handleRecallTiles}
                                    disabled={!isMyTurn}
                                >
                                    <NeonText size={12}>Recall</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.smallBtn, !isMyTurn && styles.disabledBtn]}
                                    onPress={handlePass}
                                    disabled={!isMyTurn}
                                >
                                    <NeonText size={12}>Pass</NeonText>
                                </TouchableOpacity>
                            </View>
                            <NeonButton
                                title="PLAY WORD"
                                onPress={handleSubmitMove}
                                disabled={placedTiles.length === 0 || !isMyTurn}
                                style={{ marginTop: 5, paddingVertical: 8 }}
                            />
                            <TouchableOpacity
                                style={[styles.exchangeBtn, !isMyTurn && styles.disabledBtn]}
                                onPress={handleToggleExchangeMode}
                                disabled={!isMyTurn}
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

            {/* End Game Modal */}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    turnIndicator: {
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        backgroundColor: '#e1c699',
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
    exchangeSelectedTile: {
        borderColor: COLORS.neonCyan,
        borderWidth: 3,
        backgroundColor: '#a0e0ff',
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
        right: 15,
    },
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

export default OnlineScrabbleScreen;
