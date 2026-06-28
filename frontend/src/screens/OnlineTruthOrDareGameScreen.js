import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import InGameOverlay from '../components/InGameOverlay';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';


const OnlineTruthOrDareGameScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, isHost, category = 'normal', players = [], playerName } = route.params;
    
    // Session persistence and reconnection handling
    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'GameSelection',
        exitParams: { room, playerName }
    });

    // Component-level nav handler (used by back press AND socket event)
    const handleLeaveGame = (targetRoom) => {
        navigation.reset({
            index: 0,
            routes: [{
                name: 'Lobby',
                params: {
                    room: targetRoom || room,
                    playerName,
                    fromGame: true
                }
            }]
        });
    };

    const [gameState, setGameState] = useState(null);
    const [playerNames, setPlayerNames] = useState({});
    // FIX 10: Completion toast shown briefly when a turn ends
    const [completionToast, setCompletionToast] = useState(null);
    const completionTimerRef = useRef(null);

    // Chat State handled by InGameOverlay

    // Build player name lookup
    useEffect(() => {
        const names = {};
        players.forEach(p => {
            // Map both socket ID and multiple userId variants for maximum compatibility
            if (p.id) names[p.id] = p.name;
            if (p.uid) names[p.uid] = p.name;
            if (p.userId) names[p.userId] = p.name;
        });
        setPlayerNames(names);
    }, [players]);


    const getCategoryColor = () => {
        switch (category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    useEffect(() => {
        const onTruthOrDareChosen = ({ gameState: newState }) => {
            console.log('Truth or Dare chosen:', newState);
            setGameState(newState);
        };

        const onTurnComplete = ({ gameState: newState, completedBy, promptType }) => {
            // FIX 10: Show social feedback toast before advancing state
            if (completedBy) {
                const name = playerNames[completedBy] || 'Someone';
                const type = promptType === 'dare' ? 'Dare' : 'Truth';
                const emoji = promptType === 'dare' ? '🎯' : '💬';
                setCompletionToast(`${emoji} ${name} completed their ${type}!`);
                if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
                completionTimerRef.current = setTimeout(() => {
                    setCompletionToast(null);
                    setGameState(newState);
                }, 1800);
            } else {
                setGameState(newState);
            }
        };

        const onGameEnded = (data) => {
            console.log('Game ended received:', data);
            handleLeaveGame(data?.room);
        };

        // Keep player names in sync when room updates (socket IDs change on reconnect)
        const onRoomUpdated = (updatedRoom) => {
            const names = {};
            updatedRoom.players?.forEach(p => { 
                if (p.id) names[p.id] = p.name;
                if (p.uid) names[p.uid] = p.name;
                if (p.userId) names[p.userId] = p.name;
            });

            setPlayerNames(names);
        };

        // Full game state recovery after reconnection
        const onStateSync = ({ gameType, gameState: syncedState }) => {
            if (gameType === 'truth-or-dare' && syncedState) {
                setGameState(syncedState);
            }
        };

        const onInsufficientPlayers = ({ message }) => {
            console.log('Game ended - not enough players:', message);
            handleLeaveGame();
        };

        // Chat received handled by InGameOverlay

        SocketService.on('truth-or-dare-chosen', onTruthOrDareChosen);
        SocketService.on('truth-or-dare-turn-complete', onTurnComplete);
        SocketService.on('truth-or-dare-ended', onGameEnded);
        SocketService.on('game-ended', onGameEnded);
        SocketService.on('room-updated', onRoomUpdated);
        SocketService.on('game-state-sync', onStateSync);
        SocketService.on('game-ended-insufficient-players', onInsufficientPlayers);
        // chat-message-received handled by InGameOverlay

        return () => {
            SocketService.off('truth-or-dare-chosen', onTruthOrDareChosen);
            SocketService.off('truth-or-dare-turn-complete', onTurnComplete);
            SocketService.off('truth-or-dare-ended', onGameEnded);
            SocketService.off('game-ended', onGameEnded);
            SocketService.off('room-updated', onRoomUpdated);
            SocketService.off('game-state-sync', onStateSync);
            SocketService.off('game-ended-insufficient-players', onInsufficientPlayers);
            // chat-message-received handled by InGameOverlay
        };
    }, [navigation, room, playerNames]);

    // Set initial game state from route params
    useEffect(() => {
        if (route.params.gameState) {
            setGameState(route.params.gameState);
        }
    }, [route.params.gameState]);

    const handleChooseTruth = () => {
        SocketService.emit('choose-truth-or-dare', { roomId: room.id, choice: 'truth' });
    };

    // Chat sending handled by InGameOverlay

    const handleChooseDare = () => {
        SocketService.emit('choose-truth-or-dare', { roomId: room.id, choice: 'dare' });
    };

    const handleDone = () => {
        SocketService.emit('complete-truth-or-dare-turn', { roomId: room.id });
    };

    const handleEndGame = () => {
        SocketService.emit('end-truth-or-dare', { roomId: room.id });
    };

    if (!gameState) {
        return (
            <NeonContainer>
                <View style={styles.loadingContainer}>
                    <NeonText size={24} glow>Loading game...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    // Find current user's persistent ID safely
    const myPlayer = players.find(p => p.name === playerName) || players.find(p => p.id === SocketService.socket?.id);
    const myUserId = myPlayer?.uid || myPlayer?.userId || route.params.userId;
    const isMyTurn = gameState.currentPlayerId === myUserId;

    const currentPlayerName = playerNames[gameState.currentPlayerId] || 'Someone';


    return (
        <NeonContainer 
            showBackButton 
            onBackPress={() => {
                if (isHost) {
                    handleEndGame();
                } else {
                    handleLeaveGame();
                }
            }}
        >
            {/* FIX 10: Completion toast overlay — shows social feedback when a turn ends */}
            {completionToast && (
                <View style={styles.completionToast} pointerEvents="none">
                    <NeonText size={18} weight="bold" color={COLORS.limeGlow} style={{ textAlign: 'center' }}>
                        {completionToast}
                    </NeonText>
                </View>
            )}

            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    TRUTH OR DARE
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color={COLORS.textMuted} style={styles.turnCount}>
                    Turn {gameState.turnCount + 1}
                </NeonText>
            </View>

            {/* Current Player Display */}
            <View style={[styles.playerContainer, isMyTurn && styles.myTurnContainer]}>
                <NeonText size={18} color={COLORS.neonCyan} style={styles.turnLabel}>
                    {isMyTurn ? "IT'S YOUR TURN!" : "CURRENT PLAYER"}
                </NeonText>
                <NeonText size={42} weight="bold" color={isMyTurn ? COLORS.limeGlow : COLORS.white} glow style={styles.playerName}>
                    {currentPlayerName}
                </NeonText>
            </View>

            {/* Waiting for other player's choice */}
            {!isMyTurn && gameState.status === 'WAITING_FOR_CHOICE' && (
                <View style={styles.waitingContainer}>
                    <NeonText size={20} style={styles.waitingText}>
                        Waiting for {currentPlayerName} to choose...
                    </NeonText>
                    <NeonText size={48} style={styles.waitingEmoji}>🤔</NeonText>
                </View>
            )}

            {/* Watching other player's prompt */}
            {!isMyTurn && gameState.status === 'SHOWING_PROMPT' && (
                <>
                    <View style={styles.promptTypeContainer}>
                        <NeonText
                            size={32}
                            weight="bold"
                            color={gameState.promptType === 'truth' ? COLORS.neonCyan : COLORS.hotPink}
                            glow
                        >
                            {gameState.promptType?.toUpperCase()}
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={{ marginTop: 5 }}>
                            {currentPlayerName}'s challenge
                        </NeonText>
                    </View>

                    <View style={styles.promptContainer}>
                        <NeonText size={22} weight="bold" style={styles.prompt}>
                            {gameState.currentPrompt}
                        </NeonText>
                    </View>

                    <View style={styles.watchingContainer}>
                        <NeonText size={48} style={styles.watchingEmoji}>
                            {gameState.promptType === 'truth' ? '💬' : '🎯'}
                        </NeonText>
                        <NeonText size={16} color={COLORS.textMuted} style={styles.watchingHint}>
                            Wait for {currentPlayerName} to complete...
                        </NeonText>
                    </View>
                </>
            )}

            {/* My turn - Choose Truth or Dare */}
            {isMyTurn && gameState.status === 'WAITING_FOR_CHOICE' && (
                <View style={styles.choiceContainer}>
                    <NeonText size={20} style={styles.instruction}>
                        Choose your fate:
                    </NeonText>
                    <View style={styles.buttons}>
                        <NeonButton
                            title="TRUTH"
                            onPress={handleChooseTruth}
                            style={styles.choiceButton}
                        />
                        <NeonButton
                            title="DARE"
                            onPress={handleChooseDare}
                            variant="secondary"
                            style={styles.choiceButton}
                        />
                    </View>
                </View>
            )}

            {/* My turn - Showing my prompt */}
            {isMyTurn && gameState.status === 'SHOWING_PROMPT' && (
                <>
                    <View style={styles.promptTypeContainer}>
                        <NeonText
                            size={32}
                            weight="bold"
                            color={gameState.promptType === 'truth' ? COLORS.neonCyan : COLORS.hotPink}
                            glow
                        >
                            {gameState.promptType?.toUpperCase()}
                        </NeonText>
                    </View>

                    <View style={styles.promptContainer}>
                        <NeonText size={22} weight="bold" style={styles.prompt}>
                            {gameState.currentPrompt}
                        </NeonText>
                    </View>

                    <View style={styles.actionContainer}>
                        <NeonButton
                            title="DONE"
                            onPress={handleDone}
                            style={styles.doneButton}
                        />
                    </View>
                </>
            )}

            {/* End Game Button - Only for host */}
            {isHost && (
                <NeonButton
                    title="END GAME"
                    variant="secondary"
                    onPress={handleEndGame}
                    style={styles.endButton}
                />
            )}

            {/* In-Game Voice and Chat Overlay */}
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
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    categoryBadge: {
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    turnCount: {
        marginTop: 10,
    },
    playerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.borderDefault,
    },
    myTurnContainer: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    turnLabel: {
        marginBottom: 10,
        letterSpacing: 2,
    },
    playerName: {
        textAlign: 'center',
    },
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waitingText: {
        textAlign: 'center',
        marginBottom: 20,
    },
    waitingEmoji: {
        marginBottom: 20,
    },
    watchingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    watchingEmoji: {
        marginVertical: 20,
    },
    watchingHint: {
        textAlign: 'center',
    },
    choiceContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instruction: {
        marginBottom: 30,
        textAlign: 'center',
    },
    buttons: {
        width: '100%',
        gap: 15,
        paddingHorizontal: 20,
    },
    choiceButton: {
        width: '100%',
    },
    promptTypeContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    promptContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        marginHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    prompt: {
        textAlign: 'center',
        lineHeight: 32,
    },
    actionContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    doneButton: {
        minWidth: 200,
    },
    endButton: {
        marginTop: 20,
    },
    completionToast: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(10, 10, 26, 0.92)',
        borderWidth: 1.5,
        borderColor: COLORS.limeGlow,
        borderRadius: 24,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 20,
    },
    // chatOverlay removed, handled inside InGameOverlay
});

export default OnlineTruthOrDareGameScreen;
