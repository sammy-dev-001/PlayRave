import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, useWindowDimensions, Platform, TouchableWithoutFeedback } from 'react-native';
import RoomCodeBanner from '../components/lobby/RoomCodeBanner';
import DraggableRack from '../components/DraggableRack';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ScorePopup from '../components/ScorePopup';
import SocketService from '../services/socket';
import { BOARD_SIZE, CENTER_SQUARE, BONUS_SQUARES } from '../data/scrabbleData';
import { useTheme } from '../context/ThemeContext';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import InGameOverlay from '../components/InGameOverlay';


const OnlineScrabbleScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, playerName, gameState: initialGameState } = route.params;

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Desktop Layout detection
    const isDesktop = screenWidth >= 800;
    const SIDEBAR_WIDTH = isDesktop ? 320 : 0;

    const BOARD_PADDING = isDesktop ? 60 : 20;
    const ESTIMATED_CONTROLS_HEIGHT = isDesktop ? 60 : 300;
    const maxAvailableDim = Math.min(
        screenWidth - SIDEBAR_WIDTH - BOARD_PADDING,
        Math.max(screenHeight - ESTIMATED_CONTROLS_HEIGHT, 300),
        1000 // Allow large expansion on desktop
    );

    const MIN_TILE_SIZE = 20;
    const idealTileSize = Math.floor(maxAvailableDim / BOARD_SIZE);
    const tileSize = Math.max(idealTileSize, MIN_TILE_SIZE);
    const needsScroll = idealTileSize < MIN_TILE_SIZE;
    const rackTileSize = isDesktop ? 48 : Math.min(48, Math.floor((screenWidth - 40) / 7));

    // Helper to gracefully show alerts using the new Neon Modal
    const showAlert = (title, message) => {
        setErrorModalContent({ title, message });
        setErrorModalVisible(true);
    };

    // Game state from server
    const [gameState, setGameState] = useState(null);
    const [board, setBoard] = useState({});
    const [myHand, setMyHand] = useState([]);
    const [players, setPlayers] = useState([]);
    const playersRef = useRef([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [currentPlayerName, setCurrentPlayerName] = useState('');

    // Local UI state
    const [selectedTileIndex, setSelectedTileIndex] = useState(null);
    const [placedTiles, setPlacedTiles] = useState([]);
    const [placementHistory, setPlacementHistory] = useState([]); // Track for undo
    const [endGameModalVisible, setEndGameModalVisible] = useState(false);

    // Custom Error Modal State
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

    // Tile exchange state
    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedTilesForExchange, setSelectedTilesForExchange] = useState([]);

    // Score popup state
    const [showScorePopup, setShowScorePopup] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [lastWords, setLastWords] = useState([]);
    // Bug 2: Remaining tiles counter from server game state
    const [tilesInBag, setTilesInBag] = useState(null);
    const scrollViewRef = useRef(null);
    const boardGridRef = useRef(null); // FIX: Track board grid for absolute measurement

    // Blank tile selection modal state
    const [blankTileModalVisible, setBlankTileModalVisible] = useState(false);
    const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null); // { x, y, handIndex }

    const updateGameState = useCallback((state) => {
        if (!state) return;

        setGameState(state);
        setBoard(state.board || {});
        setMyHand(state.myHand || []);
        setPlayers(state.players || []);
        playersRef.current = state.players || [];
        setIsMyTurn(state.isMyTurn || false);
        setCurrentPlayerName(state.currentPlayerName || '');
        setTilesInBag(state.tilesInBag ?? null);
        setPlacedTiles([]);
    }, []);

    // Hard state sync/overwrite after reconnection or snapshot recovery
    const handleStateSync = useCallback((data) => {
        console.log('[OnlineScrabble] Received state sync:', data);
        if (!data) return;
        const stateToApply = data.gameState || (data.board !== undefined ? data : null);
        if (stateToApply) {
            updateGameState(stateToApply);
            setSelectedTileIndex(null);
            setPlacementHistory([]);
            setExchangeMode(false);
            setSelectedTilesForExchange([]);
            setBlankTileModalVisible(false);
            setPendingBlankPlacement(null);
        }
    }, [updateGameState]);

    // Identity persistence, version gap healing, and reconnection handling
    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost: room.players?.find(p => p.name === playerName)?.isHost },
        onStateSync: handleStateSync
    });

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

            // Fatal errors: game/room no longer exists on server
            // Navigate out instead of showing a popup that loops
            const fatalMessages = ['Game not found', 'Room not found', 'Session expired'];
            if (fatalMessages.some(msg => error.message?.includes(msg))) {
                console.log('Fatal game error — navigating out:', error.message);

                // Map players list for scoreboard - use 'userId' for persistent identity
                // Fallback to room.players if state is empty, or use the latest players ref
                const activePlayers = playersRef.current.length > 0 ? playersRef.current : (room.players || []);
                const scoreboardData = activePlayers.map(p => ({
                    playerId: p.userId || p.uid || p.id,
                    playerName: p.name,
                    score: p.score || 0
                }));

                navigation.navigate('Scoreboard', {
                    room: room,
                    finalScores: scoreboardData,
                    gameEndedMessage: 'Game session ended'
                });
                return;
            }


            if (error.invalidWords && error.invalidWords.length > 0) {
                showAlert(
                    'Invalid Words',
                    `These words are not in the dictionary:\n\n${error.invalidWords.join(', ')}`
                );
            } else {
                showAlert('Error', error.message || 'An error occurred');
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

        // Fetch state on mount
        SocketService.emit('scrabble-get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', handleGameStarted);
            SocketService.off('scrabble-move-submitted', handleMoveSubmitted);
            SocketService.off('scrabble-turn-passed', handleTurnPassed);
            SocketService.off('scrabble-game-ended', handleGameEnded);
            SocketService.off('scrabble-tiles-exchanged', handleTilesExchanged);
            SocketService.off('error', handleError);
        };
    }, [navigation, room, updateGameState]);

    const handleRackTilePress = (index) => {
        if (!isMyTurn) {
            showAlert('Not Your Turn', 'Please wait for your turn');
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

    // FIX: Scrabble Drag and Drop
    const handleTileDrop = (handIndex, moveX, moveY) => {
        if (!boardGridRef.current || !isMyTurn) return;

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
        if (!isMyTurn) {
            showAlert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        const indexToUse = dragIndex !== null ? dragIndex : selectedTileIndex;
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
        if (indexToUse !== null) {
            const isAlreadyPlaced = placedTiles.some(t => t.handIndex === indexToUse);
            if (isAlreadyPlaced) return;

            const tile = myHand[indexToUse];

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

    const handleRecallTiles = async () => {
        setPlacedTiles([]);
        setPlacementHistory([]);
        try {
            await SocketService.sendGameAction(room.id, 'scrabble-recall-tiles', {});
        } catch (err) {
            console.warn('[OnlineScrabble] Failed to recall tiles:', err);
        }
    };

    const handleUndo = () => {
        if (placementHistory.length > 0) {
            const previousState = placementHistory[placementHistory.length - 1];
            setPlacedTiles(previousState);
            setPlacementHistory(placementHistory.slice(0, -1));
        }
    };

    const handleSubmitMove = async () => {
        if (!isMyTurn) {
            showAlert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        if (placedTiles.length === 0) {
            showAlert('No Tiles Placed', 'Please place some tiles first');
            return;
        }

        try {
            // FIX 4 & 5: Submit move using sendGameAction with actionId and HTTP fallback
            await SocketService.sendGameAction(room.id, 'scrabble-submit-move', {
                tiles: placedTiles
            });
        } catch (err) {
            console.error('[OnlineScrabble] Failed to submit move:', err);
            showAlert('Submission Error', err.message || 'Failed to submit move');
        }
    };

    const handlePass = () => {
        if (!isMyTurn) {
            showAlert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        const executePass = async () => {
            setPlacedTiles([]);
            try {
                await SocketService.sendGameAction(room.id, 'scrabble-pass-turn', {});
            } catch (err) {
                console.error('[OnlineScrabble] Failed to pass turn:', err);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to pass your turn?')) {
                executePass();
            }
        } else {
            showAlert(
                'Pass Turn',
                'Are you sure you want to pass your turn?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Pass',
                        onPress: executePass
                    }
                ]
            );
        }
    };

    const handleToggleExchangeMode = () => {
        if (!isMyTurn) {
            showAlert('Not Your Turn', 'Please wait for your turn');
            return;
        }

        if (exchangeMode) {
            setExchangeMode(false);
            setSelectedTilesForExchange([]);
        } else {
            if (placedTiles.length > 0) {
                showAlert("Cannot Exchange", "Recall your placed tiles first.");
                return;
            }
            setExchangeMode(true);
            setSelectedTileIndex(null);
        }
    };

    const handleConfirmExchange = async () => {
        if (selectedTilesForExchange.length === 0) {
            showAlert("No Tiles Selected", "Please select tiles to exchange.");
            return;
        }

        try {
            await SocketService.sendGameAction(room.id, 'scrabble-exchange-tiles', {
                tileIndices: selectedTilesForExchange
            });
        } catch (err) {
            console.error('[OnlineScrabble] Failed to exchange tiles:', err);
            showAlert('Exchange Error', err.message || 'Failed to exchange tiles');
        }
    };

    const handleEndGameConfirm = async () => {
        setEndGameModalVisible(false);
        try {
            await SocketService.sendGameAction(room.id, 'scrabble-end-game', {});
        } catch (err) {
            console.error('[OnlineScrabble] Failed to end game:', err);
        }
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
                        {bonus && (
                            <NeonText
                                size={Math.max(tileSize * 0.35, 6)}
                                weight="bold"
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

    if (!gameState) {
        return (
            <NeonContainer>
                <View style={styles.loadingContainer}>
                    <NeonText size={20} weight="bold">Loading game...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    const renderRackTiles = () => {
        return (
            <DraggableRack
                hand={myHand}
                placedTiles={placedTiles}
                selectedTileIndex={selectedTileIndex}
                exchangeMode={exchangeMode}
                selectedTilesForExchange={selectedTilesForExchange}
                rackTileSize={rackTileSize}
                onTilePress={handleRackTilePress}
                onTileDrop={handleTileDrop} // Pass down the drop handler
            />
        );
    };

    const renderActionButtons = () => {
        if (!exchangeMode) {
            return (
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
                    <View style={isDesktop ? { gap: 10, marginTop: 15 } : { flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <View style={isDesktop ? {} : { flex: 1 }}>
                            <NeonButton
                                title="PLAY WORD"
                                onPress={handleSubmitMove}
                                disabled={placedTiles.length === 0 || !isMyTurn}
                                style={isDesktop ? { paddingVertical: 12, marginTop: 0 } : { paddingVertical: 8 }}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.smallBtn, isDesktop ? { paddingVertical: 12, alignItems: 'center' } : { flex: 1, justifyContent: 'center', alignItems: 'center' }, !isMyTurn && styles.disabledBtn]}
                            onPress={handleToggleExchangeMode}
                            disabled={!isMyTurn}
                        >
                            <NeonText size={12} color={COLORS.neonCyan}>🔄 Exchange Tiles</NeonText>
                        </TouchableOpacity>
                    </View>
                </>
            );
        } else {
            return (
                <>
                    <NeonText size={14} color={COLORS.neonCyan} style={{ textAlign: 'center', marginBottom: 8 }}>
                        Select tiles to exchange ({selectedTilesForExchange.length} selected)
                    </NeonText>
                    <View style={isDesktop ? { gap: 10 } : styles.buttonRow}>
                        <TouchableOpacity style={[styles.cancelExchangeBtn, isDesktop && { alignItems: 'center' }]} onPress={handleToggleExchangeMode}>
                            <NeonText size={12}>Cancel</NeonText>
                        </TouchableOpacity>
                        <NeonButton
                            title={`EXCHANGE (${selectedTilesForExchange.length})`}
                            onPress={handleConfirmExchange}
                            disabled={selectedTilesForExchange.length === 0}
                            style={isDesktop ? { marginTop: 0, paddingVertical: 12 } : { marginTop: 0, paddingVertical: 8, flex: 1 }}
                        />
                    </View>
                </>
            );
        }
    };

    return (
        <NeonContainer>
            {isDesktop ? (
                <View style={styles.desktopLayout}>
                    {/* ─ DESKTOP TOP HEADER ─ */}
                    <View style={styles.desktopTopHeader}>
                        <NeonText size={28} weight="bold" glow>SCRABBLE</NeonText>
                        <View style={styles.desktopHeaderCenter}>
                            <NeonText size={18} color={isMyTurn ? COLORS.limeGlow : COLORS.hotPink} weight="bold">
                                {isMyTurn ? '🎯 YOUR TURN' : `⏳ ${currentPlayerName}'s Turn`}
                            </NeonText>
                        </View>
                        <View style={styles.desktopScoreRow}>
                            {tilesInBag !== null && (
                                <View style={[styles.tilesBadge, { marginRight: 15 }]}>
                                    <NeonText size={10} color={COLORS.textMuted}>🎲 TILES</NeonText>
                                    <NeonText size={16} weight="bold" color={COLORS.neonCyan}>{tilesInBag}</NeonText>
                                </View>
                            )}
                            {players.map((p, idx) => (
                                <View key={p.userId || p.name || p.id || idx} style={[styles.miniScore, styles.desktopMiniScore, p.name === currentPlayerName && styles.activeMiniScore]}>
                                    <NeonText size={10} color={p.name === currentPlayerName ? COLORS.neonCyan : COLORS.textMuted} numberOfLines={1}>{p.name}</NeonText>
                                    <NeonText size={16} weight="bold">{p.score}</NeonText>
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
                                <NeonText size={14} color={COLORS.textDarkMuted} style={{ marginBottom: 10, alignSelf: 'center' }}>Your Rack:</NeonText>
                                <View style={[styles.desktopRack, { justifyContent: 'center' }]}>
                                    {renderRackTiles()}
                                </View>
                            </View>
                        </View>

                        {/* ─ DESKTOP RIGHT SIDEBAR ─ */}
                        <View style={styles.desktopRightSidebar}>
                            <ScrollView contentContainerStyle={styles.desktopControlsScroll} bounces={false}>
                                <View style={styles.desktopControlsArea}>
                                    <View style={styles.gameButtons}>
                                        {renderActionButtons()}
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity style={[styles.smallBtn, { marginTop: 'auto', alignSelf: 'center', marginBottom: 20 }]} onPress={() => setEndGameModalVisible(true)}>
                                <NeonText size={12} color={COLORS.hotPink}>End Game</NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.mainLayout}>
                    <>
                        {/* MOBILE TOP CONTROLS */}
                        <View style={styles.header}>
                            {/* Top Tier: Title, Turn Pill, Tiles Count, End Game Button */}
                            <View style={styles.headerTopRow}>
                                <View style={styles.titleWrap}>
                                    <NeonText size={15} weight="bold" glow>SCRABBLE</NeonText>
                                    {tilesInBag !== null && (
                                        <View style={styles.tilesBadgeCompact}>
                                            <NeonText size={9} color={COLORS.textMuted}>🎲</NeonText>
                                            <NeonText size={11} weight="bold" color={COLORS.neonCyan} style={{ marginLeft: 3 }}>
                                                {tilesInBag}
                                            </NeonText>
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.turnPill, isMyTurn ? styles.turnPillMyTurn : styles.turnPillOther]}>
                                    <NeonText size={11} weight="bold" color={isMyTurn ? COLORS.limeGlow : COLORS.hotPink} numberOfLines={1}>
                                        {isMyTurn ? '🎯 YOUR TURN' : `⏳ ${currentPlayerName || 'Opponent'}`}
                                    </NeonText>
                                </View>

                                <TouchableOpacity
                                    style={styles.endGameHeaderBtn}
                                    onPress={() => setEndGameModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <NeonText size={10} weight="bold" color={COLORS.hotPink}>QUIT</NeonText>
                                </TouchableOpacity>
                            </View>

                            {/* Second Tier: Scrollable Player Score Strip */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={[
                                    styles.scoreStripContent,
                                    players.length <= 4 && styles.scoreStripContentSpread
                                ]}
                                style={styles.scoreStrip}
                            >
                                {players.map((p, idx) => {
                                    const isCurrent = p.name === currentPlayerName;
                                    const isCompact = players.length >= 3;
                                    return (
                                        <View
                                            key={p.userId || p.name || p.id || idx}
                                            style={[
                                                styles.playerScoreChip,
                                                isCurrent && styles.activePlayerScoreChip,
                                                players.length <= 4 && styles.playerScoreChipFlexible,
                                                isCompact && styles.playerScoreChipCompact,
                                            ]}
                                        >
                                            <View style={styles.playerChipNameRow}>
                                                {isCurrent && (
                                                    <NeonText size={isCompact ? 7 : 8} color={COLORS.limeGlow} style={{ marginRight: 2 }}>▶</NeonText>
                                                )}
                                                <NeonText
                                                    size={isCompact ? 9 : 10}
                                                    weight={isCurrent ? "bold" : "normal"}
                                                    color={isCurrent ? COLORS.neonCyan : COLORS.textMuted}
                                                    numberOfLines={1}
                                                    style={isCompact ? styles.playerChipNameCompact : styles.playerChipName}
                                                >
                                                    {p.name}
                                                </NeonText>
                                            </View>
                                            <NeonText
                                                size={isCompact ? 13 : 14}
                                                weight="bold"
                                                color={isCurrent ? COLORS.white : COLORS.textSecondary}
                                            >
                                                {p.score}
                                            </NeonText>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </>

                    {!isDesktop && (
                        <View style={styles.boardWrapper}>
                            <ScrollView
                                ref={scrollViewRef}
                                style={styles.boardContainer}
                                contentContainerStyle={styles.boardContent}
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
                            <View style={styles.rackContainer}>
                                <NeonText size={12} color={COLORS.textDarkMuted} style={{ marginBottom: 4 }}>Your Rack:</NeonText>
                                {renderRackTiles()}
                            </View>
                            <View style={styles.gameButtons}>
                                {renderActionButtons()}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Score Popup */}
            <ScorePopup
                score={lastScore}
                words={lastWords}
                visible={showScorePopup}
                onComplete={() => setShowScorePopup(false)}
                position="center"
            />



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
                                {errorModalContent.title === 'Invalid Words' ? 'INCORRECT WORD' : errorModalContent.title.toUpperCase()}
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

            <InGameOverlay />
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 44 : 36,
        paddingHorizontal: 12,
        paddingBottom: 8,
        backgroundColor: COLORS.deepNightBlack,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tilesBadgeCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    turnPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        maxWidth: 160,
    },
    turnPillMyTurn: {
        backgroundColor: 'rgba(57, 255, 20, 0.12)',
        borderColor: COLORS.limeGlow,
    },
    turnPillOther: {
        backgroundColor: 'rgba(255, 0, 127, 0.1)',
        borderColor: 'rgba(255, 0, 127, 0.35)',
    },
    endGameHeaderBtn: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 0, 127, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 127, 0.35)',
    },
    scoreStrip: {
        width: '100%',
    },
    scoreStripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 10,
    },
    scoreStripContentSpread: {
        width: '100%',
        justifyContent: 'space-between',
        paddingRight: 0,
        gap: 6,
    },
    playerScoreChip: {
        minWidth: 74,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    playerScoreChipWide: {
        flex: 1,
    },
    playerScoreChipFlexible: {
        flex: 1,
        minWidth: 0,
    },
    playerScoreChipCompact: {
        paddingHorizontal: 4,
        paddingVertical: 3,
    },
    activePlayerScoreChip: {
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 3,
    },
    playerChipNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
    },
    playerChipName: {
        maxWidth: 75,
    },
    playerChipNameCompact: {
        maxWidth: 60,
    },
    tilesBadge: {
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
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
        padding: 10,
        minWidth: '100%',
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
        margin: 'auto',
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
        aspectRatio: 1,
    },
    tileContent: {
        width: '90%',
        height: '90%',
        backgroundColor: '#e1c699',
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
        backgroundColor: COLORS.surfaceLight,
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
    // Desktop Responsive Styles
    mainLayout: {
        flex: 1,
    },
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
        flexWrap: 'wrap',
        height: 'auto',
        gap: 10,
        justifyContent: 'center',
    },
    boardWrapper: {
        flex: 1,
    },
});

export default OnlineScrabbleScreen;
