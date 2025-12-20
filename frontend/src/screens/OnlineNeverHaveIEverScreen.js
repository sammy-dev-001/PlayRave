import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const OnlineNeverHaveIEverScreen = ({ route, navigation }) => {
    const { room, isHost, initialGameState, players } = route.params;
    const [gameState, setGameState] = useState(initialGameState || {});
    const [hasResponded, setHasResponded] = useState(false);

    const currentPlayerId = SocketService.socket?.id;

    useEffect(() => {
        const onResponse = ({ playerScores, playerResponses, allResponded }) => {
            setGameState(prev => ({
                ...prev,
                playerScores,
                playerResponses
            }));
        };

        const onNewRound = ({ currentPrompt, roundNumber, playerResponses }) => {
            setGameState(prev => ({
                ...prev,
                currentPrompt,
                roundNumber,
                playerResponses
            }));
            setHasResponded(false);
        };

        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, isHost, playerName: players.find(p => p.id === currentPlayerId)?.name });
        };

        SocketService.on('nhie-response', onResponse);
        SocketService.on('nhie-new-round', onNewRound);
        SocketService.on('nhie-ended', onGameEnded);

        return () => {
            SocketService.off('nhie-response', onResponse);
            SocketService.off('nhie-new-round', onNewRound);
            SocketService.off('nhie-ended', onGameEnded);
        };
    }, [navigation, room, isHost, currentPlayerId, players]);

    const handleRespond = (hasDoneIt) => {
        if (hasResponded) return;
        setHasResponded(true);
        SocketService.emit('nhie-respond', { roomId: room.id, hasDoneIt });
    };

    const handleNextRound = () => {
        SocketService.emit('nhie-next-round', { roomId: room.id });
    };

    const handleEndGame = () => {
        SocketService.emit('end-nhie', { roomId: room.id });
    };

    const getCategoryColor = () => {
        switch (gameState.category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    const getPlayerName = (playerId) => {
        const player = players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const myResponse = gameState.playerResponses?.[currentPlayerId];

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={24} weight="bold" glow>
                    NEVER HAVE I EVER
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {gameState.category?.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color="#888">
                    Round {gameState.roundNumber}
                </NeonText>
            </View>

            {/* Current Prompt */}
            <View style={styles.promptContainer}>
                <NeonText size={22} weight="bold" style={styles.promptText} glow>
                    {gameState.currentPrompt}
                </NeonText>
            </View>

            {/* Response Buttons */}
            {!hasResponded ? (
                <View style={styles.responseButtons}>
                    <TouchableOpacity
                        style={[styles.responseBtn, styles.yesBtn]}
                        onPress={() => handleRespond(true)}
                    >
                        <NeonText size={24}>🍺</NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.hotPink}>
                            I HAVE
                        </NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.responseBtn, styles.noBtn]}
                        onPress={() => handleRespond(false)}
                    >
                        <NeonText size={24}>😇</NeonText>
                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                            NEVER
                        </NeonText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.waitingContainer}>
                    <NeonText size={16} color={COLORS.neonCyan}>
                        {myResponse ? "You've done it! 🍺" : "You're innocent! 😇"}
                    </NeonText>
                    <NeonText size={14} color="#888">
                        Waiting for others...
                    </NeonText>
                </View>
            )}

            {/* Player Responses */}
            <ScrollView style={styles.playersContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.playersGrid}>
                    {players.map(player => {
                        const response = gameState.playerResponses?.[player.id];
                        const score = gameState.playerScores?.[player.id] || 0;
                        return (
                            <View
                                key={player.id}
                                style={[
                                    styles.playerCard,
                                    response === true && styles.playerDrink,
                                    response === false && styles.playerSafe
                                ]}
                            >
                                <NeonText size={20}>
                                    {response === true ? '🍺' : response === false ? '😇' : '❓'}
                                </NeonText>
                                <NeonText size={14} weight="bold">
                                    {player.name}
                                </NeonText>
                                <NeonText size={12} color={COLORS.hotPink}>
                                    {score} drinks
                                </NeonText>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                {isHost && (
                    <NeonButton
                        title="NEXT PROMPT"
                        onPress={handleNextRound}
                    />
                )}
                <NeonButton
                    title="END GAME"
                    variant="secondary"
                    onPress={handleEndGame}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 15,
    },
    categoryBadge: {
        marginTop: 8,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    promptContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 20,
        marginBottom: 15,
        minHeight: 100,
        justifyContent: 'center',
    },
    promptText: {
        textAlign: 'center',
        lineHeight: 28,
    },
    responseButtons: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    responseBtn: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    yesBtn: {
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderColor: COLORS.hotPink,
    },
    noBtn: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderColor: COLORS.limeGlow,
    },
    waitingContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 15,
    },
    playersContainer: {
        flex: 1,
        marginBottom: 10,
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    playerCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#444',
        padding: 10,
        alignItems: 'center',
        minWidth: 80,
    },
    playerDrink: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
    },
    playerSafe: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    actions: {
        gap: 10,
    }
});

export default OnlineNeverHaveIEverScreen;
