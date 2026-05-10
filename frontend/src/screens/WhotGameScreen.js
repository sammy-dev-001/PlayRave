import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import WhotCard from '../components/WhotCard';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { COLORS } from '../constants/theme';

const WhotGameScreen = ({ route, navigation }) => {
    const { room, hostParticipates, isHost, gameState: initialGameState } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [gameState, setGameState] = useState(initialGameState || null);
    const [showShapeSelector, setShowShapeSelector] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [winner, setWinner] = useState(null);

    const myId = SocketService.userId;
    const isMyTurn = gameState?.currentPlayerId === myId;

    const handleEndGame = () => {
        Alert.alert(
            "End Game",
            "Are you sure you want to end the game for everyone?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "End Game", 
                    style: "destructive",
                    onPress: () => SocketService.emit('whot-end-game', { roomId: room.id })
                }
            ]
        );
    };

    // Use ref to avoid stale closures in socket listeners
    const winnerRef = React.useRef(winner);
    useEffect(() => {
        winnerRef.current = winner;
    }, [winner]);

    useEffect(() => {
        console.log('WhotGameScreen mounted, setting up listeners');

        const onGameStarted = (data) => {
            console.log('game-started event received:', data);
            const initialState = data.gameState || data;
            setGameState(initialState);
            setWinner(initialState.winner || null);
        };

        const onStateUpdate = ({ gameState: newState, action, winner: gameWinner }) => {
            console.log('State update received:', action);
            setGameState(newState);

            const detectedWinner = gameWinner || newState?.winner;
            if (detectedWinner && !winnerRef.current) {
                setWinner(detectedWinner);
                const winnerPlayer = room.players.find(p => p.uid === detectedWinner || p.userId === detectedWinner);
                Alert.alert(
                    'Game Over!',
                    `${winnerPlayer?.name || 'Someone'} wins!`,
                    [{ text: 'OK', onPress: () => {
                        try {
                            navigation.navigate('Lobby', { room, isHost, playerName: room.players.find(p => p.userId === myId)?.name });
                        } catch (e) {
                            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                        }
                    } }]
                );
            }

            if (action && !detectedWinner) {
                const messages = {
                    'pick2': 'Pick 2! Attack stacked',
                    'pick3': 'Pick 3! Attack stacked',
                    'general-market': 'General Market! Everyone draws 1 card',
                    'skip': 'Hold On! Next player skipped'
                };
                if (messages[action]) {
                    Alert.alert('Special Card!', messages[action]);
                }
            }
        };

        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, isHost, playerName: room.players.find(p => p.userId === myId)?.name });
        };

        const onGameStateSync = (data) => {
            if (data && (data.gameType === 'whot' || data.type === 'whot')) {
                setGameState(data.gameState || data);
            }
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('whot-state-update', onStateUpdate);
        SocketService.on('whot-card-played', onStateUpdate); // Legacy support
        SocketService.on('whot-card-drawn', onStateUpdate); // Legacy support
        SocketService.on('whot-game-ended', onGameEnded);
        SocketService.on('game-state-sync', onGameStateSync);

        // Fetch state on mount
        SocketService.emit('whot-get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', onGameStarted);
            SocketService.off('whot-state-update', onStateUpdate);
            SocketService.off('whot-card-played', onStateUpdate);
            SocketService.off('whot-card-drawn', onStateUpdate);
            SocketService.off('whot-game-ended', onGameEnded);
            SocketService.off('game-state-sync', onGameStateSync);
        };

    }, [navigation, room.id]);

    const handleCardPress = (card) => {
        if (!isMyTurn || winner) return;
        if (card.shape === 'whot') {
            setSelectedCardId(card.id);
            setShowShapeSelector(true);
        } else {
            playCard(card.id);
        }
    };

    const playCard = (cardId, calledShape = null) => {
        SocketService.emit('whot-play-card', {
            roomId: room.id,
            cardId,
            calledShape
        });
    };

    const handleShapeSelect = (shape) => {
        setShowShapeSelector(false);
        playCard(selectedCardId, shape);
        setSelectedCardId(null);
    };

    const handleDrawCard = () => {
        if (!isMyTurn || winner) return;
        SocketService.emit('whot-draw-cards', { roomId: room.id });
    };

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.uid === playerId || p.userId === playerId);
        return player?.name || 'Unknown'
    };

    const isSpectator = !gameState?.playerHand;

    if (!gameState) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.center}>
                    <NeonText size={24} glow>LOADING WHOT...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer 
            showBackButton 
            scrollable
            onBackPress={() => {
                if (isHost) {
                    handleEndGame();
                } else {
                    navigation.navigate('Lobby', { room, isHost, playerName: room.players.find(p => p.userId === myId)?.name });
                }
            }}
        >
            <View style={styles.container}>
                {isHost && (
                    <View style={styles.hostControls}>
                        <NeonButton 
                            title="END GAME" 
                            onPress={handleEndGame} 
                            variant="secondary" 
                            size="small"
                            color={COLORS.hotPink}
                        />
                    </View>
                )}

                {isSpectator && (
                    <View style={styles.spectatorBadge}>
                        <Ionicons name="eye" size={18} color={COLORS.hotPink} />
                        <NeonText size={16} color={COLORS.hotPink} glow>SPECTATOR MODE</NeonText>
                    </View>
                )}

                <View style={styles.topCardContainer}>
                    <NeonText size={14} color="#888" style={styles.label}>TOP CARD</NeonText>
                    <WhotCard card={gameState.topCard} disabled={true} isTopCard={true} />
                    {gameState.calledShape && (
                        <View style={styles.calledBadge}>
                            <NeonText size={14} color={COLORS.limeGlow} weight="bold">
                                CALLED: {gameState.calledShape.toUpperCase()}
                            </NeonText>
                        </View>
                    )}
                </View>

                <View style={styles.otherPlayersContainer}>
                    {gameState.otherPlayers
                        .filter(p => p.id !== myId)
                        .map(player => (
                            <View key={player.id} style={[
                                styles.otherPlayer,
                                player.isCurrentPlayer && styles.currentPlayer
                            ]}>
                                <NeonText size={13} weight="bold">{getPlayerName(player.id)}</NeonText>
                                <View style={styles.cardCountBadge}>
                                    <Ionicons name="copy" size={12} color={COLORS.hotPink} />
                                    <NeonText size={12} color={COLORS.hotPink}>{player.cardCount}</NeonText>
                                </View>
                            </View>
                        ))}
                </View>

                {!isSpectator && (
                    <View style={styles.myHandSection}>
                        <View style={styles.handHeader}>
                            <NeonText size={16} weight="bold">YOUR HAND ({gameState.playerHand?.length || 0})</NeonText>
                            {isMyTurn && (
                                <View style={styles.turnBadge}>
                                    <NeonText size={12} color="#000" weight="bold">YOUR TURN</NeonText>
                                </View>
                            )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                            {gameState.playerHand?.map((card, index) => (
                                <View key={card.id} style={[styles.cardWrapper, { zIndex: 100 - index }]}>
                                    <WhotCard
                                        card={card}
                                        onPress={() => handleCardPress(card)}
                                        disabled={!isMyTurn || winner}
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <NeonButton
                            title={gameState.attackStack > 0
                                ? `PICK ${gameState.attackStack} CARDS!`
                                : `DRAW CARD (${gameState.deckCount} left)`}
                            onPress={handleDrawCard}
                            disabled={!isMyTurn || winner}
                            variant={gameState.attackStack > 0 ? "primary" : "secondary"}
                            style={styles.drawButton}
                        />
                    </View>
                )}
            </View>

            <Modal
                visible={showShapeSelector}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShapeSelector(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.shapeSelector}>
                        <NeonText size={20} weight="bold" style={styles.modalTitle} glow>
                            SELECT SHAPE
                        </NeonText>
                        <View style={styles.shapesGrid}>
                            {['circle', 'triangle', 'cross', 'square', 'star'].map(shape => (
                                <TouchableOpacity
                                    key={shape}
                                    style={styles.shapeButton}
                                    onPress={() => handleShapeSelect(shape)}
                                >
                                    <NeonText size={32} color={COLORS.neonCyan}>{getShapeSymbol(shape)}</NeonText>
                                    <NeonText size={12} color="#AAA">{shape.toUpperCase()}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <NeonButton title="CANCEL" onPress={() => setShowShapeSelector(false)} variant="secondary" size="small" />
                    </View>
                </View>
            </Modal>
        </NeonContainer>
    );
};

const getShapeSymbol = (shape) => {
    const symbols = {
        circle: '○',
        triangle: '△',
        cross: '✕',
        square: '□',
        star: '★'
    };
    return symbols[shape] || shape;
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostControls: {
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    spectatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
        marginBottom: 20,
    },
    topCardContainer: {
        alignItems: 'center',
        marginBottom: 25,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    label: {
        marginBottom: 15,
        letterSpacing: 2,
    },
    calledBadge: {
        marginTop: 15,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
    },
    otherPlayersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 25,
        justifyContent: 'center',
    },
    otherPlayer: {
        width: 100,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(157, 78, 221, 0.4)',
        alignItems: 'center',
        gap: 5,
    },
    currentPlayer: {
        borderColor: COLORS.limeGlow,
        borderWidth: 2,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    cardCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    myHandSection: {
        width: '100%',
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    turnBadge: {
        backgroundColor: COLORS.limeGlow,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cardsScroll: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    cardWrapper: {
        marginRight: -30,
    },
    drawButton: {
        marginTop: 25,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shapeSelector: {
        width: '85%',
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 25,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
    },
    modalTitle: {
        marginBottom: 20,
        letterSpacing: 2,
    },
    shapesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 25,
    },
    shapeButton: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    }
});

export default WhotGameScreen;
