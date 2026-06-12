import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import WhotCard from '../components/WhotCard';
import WhotToast from '../components/WhotToast';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { COLORS } from '../constants/theme';

// ─── Constants ───────────────────────────────────────────────────────────────
const SPECIAL_TOAST_CONFIG = {
    'pick2':          { message: 'Pick 2!',            icon: '⚡', color: COLORS.hotPink },
    'pick3':          { message: 'Pick 3!',            icon: '🔥', color: COLORS.hotPink },
    'general-market': { message: 'General Market!',    icon: '🛒', color: COLORS.neonCyan },
    'skip':           { message: 'Hold On! Skipped',   icon: '✋', color: COLORS.limeGlow },
    'suspension':     { message: 'Suspension!',        icon: '⏸️', color: COLORS.electricPurple },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const getShapeSymbol = (shape) => {
    const symbols = { circle: '○', triangle: '△', cross: '+', square: '□', star: '★' };
    return symbols[shape] || shape;
};

// ─── Component ────────────────────────────────────────────────────────────────
const WhotGameScreen = ({ route, navigation }) => {
    const { room, isHost, gameState: initialGameState } = route.params;
    const gamePlayers = route.params.players || room.players;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost },
    });

    const myId = SocketService.userId;

    // ── Core State ────────────────────────────────────────────────────────────
    const [gameState, setGameState]       = useState(initialGameState || null);
    const [showShapeSelector, setShowShapeSelector] = useState(false);
    const [selectedCardId, setSelectedCardId]       = useState(null);
    const [winner, setWinner]             = useState(null);

    // ── Feature 1: Last Card alert tracking ──────────────────────────────────
    // Tracks which player IDs have already triggered the "Last Card!" badge
    // so we only flash it once per card drop.
    const lastCardRef = useRef(new Set());

    // ── Feature 2: Toast notification state ──────────────────────────────────
    const [toast, setToast] = useState({ visible: false, message: '', icon: '', color: COLORS.neonCyan });
    const showToast = (config) => {
        setToast({ ...config, visible: true });
    };
    const dismissToast = () => setToast(prev => ({ ...prev, visible: false }));

    // ── Feature 1: "Last Card!" pulse animation ───────────────────────────────
    const lastCardPulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(lastCardPulse, { toValue: 1.12, duration: 500, useNativeDriver: true }),
                Animated.timing(lastCardPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // ── Computed ──────────────────────────────────────────────────────────────
    const isMyTurn    = gameState?.currentPlayerId === myId;
    const isSpectator = !gameState?.playerHand;

    // ── Stale closure refs ─────────────────────────────────────────────────────
    const winnerRef = useRef(winner);
    useEffect(() => { winnerRef.current = winner; }, [winner]);
    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // ── Socket Listeners ──────────────────────────────────────────────────────
    useEffect(() => {
        const onGameStarted = (data) => {
            const initialState = data.gameState || data;
            setGameState(initialState);
            setWinner(initialState.winner || null);
        };

        const onStateUpdate = ({ gameState: newState, actionTaken, winner: gameWinner }) => {
            setGameState(newState);

            // ── Feature 1: Check for Last Card across all players ──────────
            if (newState?.otherPlayers) {
                newState.otherPlayers.forEach(p => {
                    if (p.cardCount === 1 && !lastCardRef.current.has(p.id)) {
                        lastCardRef.current.add(p.id);
                        const name = getPlayerName(p.id);
                        showToast({ message: `${name}: LAST CARD!`, icon: '🃏', color: COLORS.limeGlow });
                    } else if (p.cardCount !== 1) {
                        // Reset tracker when card count changes away from 1
                        lastCardRef.current.delete(p.id);
                    }
                });
            }

            // Check if local player also has last card
            if (newState?.playerHand?.length === 1 && !lastCardRef.current.has(myId)) {
                lastCardRef.current.add(myId);
                showToast({ message: 'YOU HAVE LAST CARD!', icon: '🃏', color: COLORS.limeGlow });
            } else if (newState?.playerHand?.length !== 1) {
                lastCardRef.current.delete(myId);
            }

            // ── Feature 2: Special Card Toast ──────────────────────────────
            const toastConfig = SPECIAL_TOAST_CONFIG[actionTaken];
            if (toastConfig && !gameWinner) {
                // Small delay so state-update renders first
                setTimeout(() => showToast(toastConfig), 100);
            }

            // ── Feature 3: Game Over → navigate to Scoreboard ─────────────
            const detectedWinner = gameWinner || newState?.winner;
            if (detectedWinner && !winnerRef.current) {
                setWinner(detectedWinner);
            }
        };

        const onGameEnded = (data) => {
            // Feature 3: If finalScores provided, navigate to Scoreboard
            if (data?.finalScores && Array.isArray(data.finalScores) && data.finalScores.length > 0) {
                navigation.navigate('Scoreboard', {
                    room: { ...room, gameType: 'whot' },
                    finalScores: data.finalScores,
                    players: gamePlayers,
                });
            } else {
                // Host ended game manually — go back to lobby
                const myName = gamePlayers.find(p => p.userId === myId || p.uid === myId)?.name;
                navigation.navigate('Lobby', { room, isHost, playerName: myName });
            }
        };

        const onGameStateSync = (data) => {
            if (data && (data.gameType === 'whot' || data.type === 'whot')) {
                setGameState(data.gameState || data);
            }
        };

        const onError = (data) => {
            showToast({ message: data.message || 'Invalid move', icon: '⚠️', color: COLORS.hotPink });
        };

        SocketService.on('game-started',      onGameStarted);
        SocketService.on('whot-state-update', onStateUpdate);
        SocketService.on('whot-card-played',  onStateUpdate);   // Legacy
        SocketService.on('whot-card-drawn',   onStateUpdate);   // Legacy
        SocketService.on('whot-game-ended',   onGameEnded);
        SocketService.on('game-state-sync',   onGameStateSync);
        SocketService.on('error',             onError);

        SocketService.emit('whot-get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started',      onGameStarted);
            SocketService.off('whot-state-update', onStateUpdate);
            SocketService.off('whot-card-played',  onStateUpdate);
            SocketService.off('whot-card-drawn',   onStateUpdate);
            SocketService.off('whot-game-ended',   onGameEnded);
            SocketService.off('game-state-sync',   onGameStateSync);
            SocketService.off('error',             onError);
        };
    }, [navigation, room.id]);

    // Navigate to Scoreboard once winner is set and data arrives
    // (handled inside onGameEnded — winner state just locks the UI)

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleEndGame = () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game for everyone?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End Game', style: 'destructive', onPress: () => SocketService.emit('whot-end-game', { roomId: room.id }) },
            ]
        );
    };

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
        SocketService.emit('whot-play-card', { roomId: room.id, cardId, calledShape });
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
        const player = gamePlayers.find(p => p.uid === playerId || p.userId === playerId || p.id === playerId);
        return player?.name || 'Unknown';
    };

    // ── Loading State ─────────────────────────────────────────────────────────
    if (!gameState) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.center}>
                    <NeonText size={24} glow>LOADING WHOT...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <NeonContainer
            showBackButton
            scrollable
            onBackPress={() => {
                if (isHost) {
                    handleEndGame();
                } else {
                    navigation.navigate('Lobby', { room, isHost, playerName: gamePlayers.find(p => p.userId === myId || p.uid === myId)?.name });
                }
            }}
        >
            {/* ── Feature 2: Toast (rendered at root so it floats above everything) */}
            <WhotToast
                message={toast.message}
                icon={toast.icon}
                color={toast.color}
                visible={toast.visible}
                onDone={dismissToast}
            />

            <View style={styles.container}>
                {/* Host controls */}
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

                {/* Spectator badge */}
                {isSpectator && (
                    <View style={styles.spectatorBadge}>
                        <Ionicons name="eye" size={18} color={COLORS.hotPink} />
                        <NeonText size={16} color={COLORS.hotPink} glow>SPECTATOR MODE</NeonText>
                    </View>
                )}

                {/* Top Card */}
                <View style={styles.topCardContainer}>
                    <NeonText size={14} color="#888" style={styles.label}>TOP CARD</NeonText>
                    <WhotCard card={gameState.topCard} disabled isTopCard />
                    {gameState.calledShape && (
                        <View style={styles.calledBadge}>
                            <NeonText size={14} color={COLORS.limeGlow} weight="bold">
                                CALLED: {gameState.calledShape.toUpperCase()}
                            </NeonText>
                        </View>
                    )}
                </View>

                {/* Other Players — with Feature 1: Last Card badge */}
                <View style={styles.otherPlayersContainer}>
                    {gameState.otherPlayers
                        .filter(p => p.id !== myId)
                        .map(player => {
                            const isLastCard = player.cardCount === 1;
                            return (
                                <View
                                    key={player.id}
                                    style={[styles.otherPlayer, player.isCurrentPlayer && styles.currentPlayer]}
                                >
                                    {/* Feature 1: Pulsing "LAST CARD!" badge */}
                                    {isLastCard && (
                                        <Animated.View
                                            style={[styles.lastCardBadge, { transform: [{ scale: lastCardPulse }] }]}
                                        >
                                            <NeonText size={9} color="#000" weight="bold">LAST CARD!</NeonText>
                                        </Animated.View>
                                    )}
                                    <NeonText size={13} weight="bold">{getPlayerName(player.id)}</NeonText>
                                    <View style={[styles.cardCountBadge, isLastCard && styles.lastCardCountBadge]}>
                                        <Ionicons name="copy" size={12} color={isLastCard ? COLORS.limeGlow : COLORS.hotPink} />
                                        <NeonText size={12} color={isLastCard ? COLORS.limeGlow : COLORS.hotPink}>
                                            {player.cardCount}
                                        </NeonText>
                                    </View>
                                </View>
                            );
                        })}
                </View>

                {/* My Hand */}
                {!isSpectator && (
                    <View style={styles.myHandSection}>
                        <View style={styles.handHeader}>
                            {/* Feature 1: My own "Last Card!" label */}
                            {gameState.playerHand?.length === 1 ? (
                                <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, transform: [{ scale: lastCardPulse }] }}>
                                    <NeonText size={16} weight="bold" color={COLORS.limeGlow} glow>
                                        🃏 LAST CARD!
                                    </NeonText>
                                </Animated.View>
                            ) : (
                                <NeonText size={16} weight="bold">
                                    YOUR HAND ({gameState.playerHand?.length || 0})
                                </NeonText>
                            )}
                            {isMyTurn && (
                                <View style={styles.turnBadge}>
                                    <NeonText size={12} color="#000" weight="bold">YOUR TURN</NeonText>
                                </View>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                            {gameState.playerHand?.map((card, index) => (
                                <View key={card.id} style={[styles.cardWrapper, { zIndex: index + 1 }]}>
                                    <WhotCard
                                        card={card}
                                        onPress={() => handleCardPress(card)}
                                        disabled={!isMyTurn || !!winner}
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <NeonButton
                            title={gameState.attackStack > 0
                                ? `PICK ${gameState.attackStack} CARDS!`
                                : `DRAW CARD (${gameState.deckCount} left)`}
                            onPress={handleDrawCard}
                            disabled={!isMyTurn || !!winner}
                            variant={gameState.attackStack > 0 ? 'primary' : 'secondary'}
                            style={styles.drawButton}
                        />
                    </View>
                )}
            </View>

            {/* Shape Selector Modal */}
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
    // Feature 1: Last card badge on opponent card
    lastCardBadge: {
        backgroundColor: COLORS.limeGlow,
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 2,
        marginBottom: 2,
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
    lastCardCountBadge: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
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
    },
});

export default WhotGameScreen;
