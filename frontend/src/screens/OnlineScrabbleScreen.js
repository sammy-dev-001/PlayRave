import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { BOARD_SIZE, CENTER_SQUARE, BONUS_SQUARES } from '../data/scrabbleData';
import { COLORS } from '../constants/theme';

const OnlineScrabbleScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Calculate tile sizes
    const availableSize = Math.min(screenWidth, screenHeight - 250);
    const tileSize = Math.max(Math.floor((availableSize - 20) / BOARD_SIZE), 18);
    const rackTileSize = Math.min(Math.max(tileSize * 1.2, 35), 50);

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
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        // Listen for game start
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

        SocketService.on('game-started', handleGameStarted);
        SocketService.on('scrabble-move-submitted', handleMoveSubmitted);
        SocketService.on('scrabble-turn-passed', handleTurnPassed);
        SocketService.on('scrabble-game-ended', handleGameEnded);
        SocketService.on('error', handleError);

        return () => {
            SocketService.off('game-started', handleGameStarted);
            SocketService.off('scrabble-move-submitted', handleMoveSubmitted);
            SocketService.off('scrabble-turn-passed', handleTurnPassed);
            SocketService.off('scrabble-game-ended', handleGameEnded);
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

        if (selectedTileIndex === index) {
            setSelectedTileIndex(null);
        } else {
            setSelectedTileIndex(index);
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
            const newPlacement = {
                x, y,
                letter: tile.letter,
                value: tile.value,
                handIndex: selectedTileIndex
            };

            setPlacedTiles([...placedTiles, newPlacement]);
            setSelectedTileIndex(null);
        }
    };

    const handleRecallTiles = () => {
        setPlacedTiles([]);
        SocketService.emit('scrabble-recall-tiles', { roomId: room.id });
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
                                        isSelected && styles.selectedRackTile
                                    ]}
                                    onPress={() => handleRackTilePress(index)}
                                    disabled={!isMyTurn}
                                >
                                    <NeonText size={rackTileSize * 0.45} color="#000" weight="bold">{tile.letter}</NeonText>
                                    <NeonText size={rackTileSize * 0.22} color="#000" style={styles.tileValue}>{tile.value}</NeonText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.gameButtons}>
                    <View style={styles.buttonRow}>
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
                </View>
            </View>

            {/* End Game Button */}
            <TouchableOpacity
                style={styles.endGameBtn}
                onPress={() => setEndGameModalVisible(true)}
            >
                <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
            </TouchableOpacity>

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
});

export default OnlineScrabbleScreen;
