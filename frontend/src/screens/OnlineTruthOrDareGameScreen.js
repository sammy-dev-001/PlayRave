import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const OnlineTruthOrDareGameScreen = ({ route, navigation }) => {
    const { room, isHost, category = 'normal', players = [] } = route.params;
    const [gameState, setGameState] = useState(null);
    const [playerNames, setPlayerNames] = useState({});

    // Build player name lookup
    useEffect(() => {
        const names = {};
        players.forEach(p => {
            names[p.id] = p.name;
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

        const onTurnComplete = ({ gameState: newState }) => {
            console.log('Turn complete, new state:', newState);
            setGameState(newState);
        };

        const onGameEnded = () => {
            console.log('Game ended');
            navigation.navigate('GameSelection', { room, playerName: playerNames[SocketService.socket?.id] });
        };

        SocketService.on('truth-or-dare-chosen', onTruthOrDareChosen);
        SocketService.on('truth-or-dare-turn-complete', onTurnComplete);
        SocketService.on('truth-or-dare-ended', onGameEnded);

        return () => {
            SocketService.off('truth-or-dare-chosen', onTruthOrDareChosen);
            SocketService.off('truth-or-dare-turn-complete', onTurnComplete);
            SocketService.off('truth-or-dare-ended', onGameEnded);
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

    const handleChooseDare = () => {
        SocketService.emit('choose-truth-or-dare', { roomId: room.id, choice: 'dare' });
    };

    const handleDone = () => {
        SocketService.emit('complete-truth-or-dare-turn', { roomId: room.id });
    };

    const handleEndGame = () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Game',
                    onPress: () => {
                        SocketService.emit('end-truth-or-dare', { roomId: room.id });
                    },
                    style: 'destructive'
                }
            ]
        );
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

    const currentPlayerName = playerNames[gameState.currentPlayerId] || 'Unknown';
    const isMyTurn = gameState.isCurrentPlayer;

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    TRUTH OR DARE
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color="#888" style={styles.turnCount}>
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
                <View style={styles.watchingContainer}>
                    <NeonText
                        size={24}
                        weight="bold"
                        color={gameState.promptType === 'truth' ? COLORS.neonCyan : COLORS.hotPink}
                        glow
                    >
                        {currentPlayerName} is doing a {gameState.promptType?.toUpperCase()}!
                    </NeonText>
                    <NeonText size={48} style={styles.watchingEmoji}>
                        {gameState.promptType === 'truth' ? '💬' : '🎯'}
                    </NeonText>
                    <NeonText size={16} color="#888" style={styles.watchingHint}>
                        Wait for them to complete their turn...
                    </NeonText>
                </View>
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
        borderColor: 'rgba(255,255,255,0.2)',
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
    }
});

export default OnlineTruthOrDareGameScreen;
