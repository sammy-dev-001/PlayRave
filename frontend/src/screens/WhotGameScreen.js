import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import WhotCard from '../components/WhotCard';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const WhotGameScreen = ({ route, navigation }) => {
    const { room, hostParticipates, isHost, initialGameState } = route.params;
    const [gameState, setGameState] = useState(initialGameState || null);
    const [showShapeSelector, setShowShapeSelector] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [winner, setWinner] = useState(null);

    const currentPlayerId = SocketService.socket?.id;
    const isMyTurn = gameState?.currentPlayerId === currentPlayerId;

    useEffect(() => {
        console.log('WhotGameScreen mounted, setting up listeners');

        const onGameStarted = (data) => {
            console.log('game-started event received:', data);
            // Handle both formats: direct gameState or nested in data
            const initialState = data.gameState || data;
            console.log('Setting game state:', initialState);
            setGameState(initialState);
        };

        const onCardPlayed = ({ gameState: newState, action, winner: gameWinner }) => {
            console.log('Card played:', newState, action);
            setGameState(newState);

            if (gameWinner) {
                setWinner(gameWinner);
                setTimeout(() => {
                    const winnerPlayer = room.players.find(p => p.id === gameWinner);
                    Alert.alert(
                        'Game Over!',
                        `${winnerPlayer?.name || 'Someone'} wins!`,
                        [{ text: 'OK', onPress: () => navigation.navigate('Lobby', { room, isHost, playerName: room.players.find(p => p.id === currentPlayerId)?.name }) }]
                    );
                }, 500);
            }

            // Show action message
            if (action) {
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

        const onCardDrawn = ({ gameState: newState }) => {
            console.log('Card drawn:', newState);
            setGameState(newState);
        };

        SocketService.on('game-started', onGameStarted);
        SocketService.on('whot-card-played', onCardPlayed);
        SocketService.on('whot-card-drawn', onCardDrawn);

        return () => {
            console.log('WhotGameScreen unmounting, removing listeners');
            SocketService.off('game-started', onGameStarted);
            SocketService.off('whot-card-played', onCardPlayed);
            SocketService.off('whot-card-drawn', onCardDrawn);
        };
    }, [navigation, room, currentPlayerId, isHost]);

    // Handle winner state changes
    useEffect(() => {
        if (gameState?.winner && !winner) {
            console.log('Winner detected from game state:', gameState.winner);
            setWinner(gameState.winner);

            setTimeout(() => {
                const winnerPlayer = room.players.find(p => p.id === gameState.winner);
                const winnerName = winnerPlayer?.name || 'Unknown Player';

                Alert.alert(
                    'Game Over! 🏆',
                    `${winnerName} wins the game!`,
                    [{
                        text: 'Back to Lobby',
                        onPress: () => navigation.navigate('Lobby', {
                            room,
                            isHost,
                            playerName: room.players.find(p => p.id === currentPlayerId)?.name
                        })
                    }]
                );
            }, 500);
        }
    }, [gameState, winner, room, navigation, isHost, currentPlayerId]);

    const handleCardPress = (card) => {
        if (!isMyTurn || winner) return;

        // If it's a Whot card, show shape selector
        if (card.shape === 'whot') {
            setSelectedCardId(card.id);
            setShowShapeSelector(true);
        } else {
            playCard(card.id);
        }
    };

    const playCard = (cardId, calledShape = null) => {
        SocketService.emit('play-whot-card', {
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
        SocketService.emit('draw-whot-card', { roomId: room.id });
    };

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
        return player?.name || 'Unknown'
    };

    // Check if current user is a spectator (host not participating)
    const isSpectator = !gameState?.playerHand;

    if (!gameState) {
        return (
            <NeonContainer showBackButton>
                <NeonText size={24}>Loading game...</NeonText>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showBackButton>
            {/* Spectator Badge */}
            {isSpectator && (
                <View style={styles.spectatorBadge}>
                    <NeonText size={16} color={COLORS.hotPink} glow>
                        👁️ SPECTATOR MODE
                    </NeonText>
                </View>
            )}

            {/* Top Card */}
            <View style={styles.topCardContainer}>
                <NeonText size={16} style={styles.label}>TOP CARD</NeonText>
                <WhotCard card={gameState.topCard} disabled={true} />
                {gameState.calledShape && (
                    <NeonText size={14} color={COLORS.limeGlow} style={styles.calledShape}>
                        Called: {gameState.calledShape.toUpperCase()}
                    </NeonText>
                )}
            </View>

            {/* Other Players */}
            <View style={styles.otherPlayersContainer}>
                {gameState.otherPlayers
                    .filter(p => p.id !== currentPlayerId)
                    .map(player => (
                        <View key={player.id} style={[
                            styles.otherPlayer,
                            player.isCurrentPlayer && styles.currentPlayer
                        ]}>
                            <NeonText size={14}>{getPlayerName(player.id)}</NeonText>
                            <NeonText size={12} color={COLORS.hotPink}>
                                {player.cardCount} cards
                            </NeonText>
                        </View>
                    ))}
            </View>

            {/* Player's Hand - Only show for participating players */}
            {!isSpectator && (
                <>
                    <View style={styles.handContainer}>
                        <View style={styles.handHeader}>
                            <NeonText size={16}>YOUR HAND ({gameState.playerHand?.length || 0})</NeonText>
                            {isMyTurn && (
                                <NeonText size={14} color={COLORS.limeGlow} glow>
                                    YOUR TURN ⚡
                                </NeonText>
                            )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                            {gameState.playerHand?.map((card, index) => (
                                <View key={card.id} style={{ marginRight: -20, zIndex: gameState.playerHand.length - index }}>
                                    <WhotCard
                                        card={card}
                                        onPress={() => handleCardPress(card)}
                                        disabled={!isMyTurn || winner}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Draw Button */}
                    <NeonButton
                        title={gameState.attackStack > 0
                            ? `PICK ${gameState.attackStack} CARDS!`
                            : `DRAW CARD (${gameState.deckCount} left)`}
                        onPress={handleDrawCard}
                        disabled={!isMyTurn || winner}
                        variant={gameState.attackStack > 0 ? "primary" : "secondary"}
                        style={styles.drawButton}
                    />
                </>
            )}

            {/* Shape Selector Modal */}
            <Modal
                visible={showShapeSelector}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShapeSelector(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.shapeSelector}>
                        <NeonText size={20} weight="bold" style={styles.modalTitle}>
                            SELECT SHAPE
                        </NeonText>
                        {['circle', 'triangle', 'cross', 'square', 'star'].map(shape => (
                            <TouchableOpacity
                                key={shape}
                                style={styles.shapeButton}
                                onPress={() => handleShapeSelect(shape)}
                            >
                                <NeonText size={24}>{getShapeSymbol(shape)}</NeonText>
                                <NeonText size={16}>{shape.toUpperCase()}</NeonText>
                            </TouchableOpacity>
                        ))}
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
    spectatorBadge: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255, 63, 164, 0.2)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        marginBottom: 20,
    },
    topCardContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        marginBottom: 10,
    },
    calledShape: {
        marginTop: 10,
    },
    otherPlayersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
        justifyContent: 'center',
    },
    otherPlayer: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        alignItems: 'center',
    },
    currentPlayer: {
        borderColor: COLORS.limeGlow,
        borderWidth: 2,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    handContainer: {
        flex: 1,
        marginBottom: 15,
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardsScroll: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    drawButton: {
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shapeSelector: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 30,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        gap: 15,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 10,
    },
    shapeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.white,
    }
});

export default WhotGameScreen;
