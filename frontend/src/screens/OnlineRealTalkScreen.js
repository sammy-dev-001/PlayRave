import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import SocketService from '../services/socket';
import { REAL_TALK_CATEGORIES } from '../data/realTalkData';
import InGameOverlay from '../components/InGameOverlay';
import ConfirmModal from '../components/ConfirmModal';

const { width } = Dimensions.get('window');

const OnlineRealTalkScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, isHost, gameState: initialGameState } = route.params;

    const [gameState, setGameState] = useState(initialGameState || null);
    const [flipAnim] = useState(new Animated.Value(0));
    const [lastQuestion, setLastQuestion] = useState(initialGameState ? initialGameState.currentQuestion : null);
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    useEffect(() => {
        const handleStateUpdate = (response) => {
            if (response.success && response.gameState) {
                if (response.gameState.currentQuestion !== lastQuestion) {
                    // Animate flip when question changes
                    Animated.sequence([
                        Animated.timing(flipAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                        Animated.timing(flipAnim, { toValue: 0, duration: 200, useNativeDriver: true })
                    ]).start();
                    setLastQuestion(response.gameState.currentQuestion);
                }
                setGameState(response.gameState);
            }
        };

        const handleSync = (data) => {
            if (data.type === 'real-talk') {
                if (data.gameState.currentQuestion !== lastQuestion) {
                    Animated.sequence([
                        Animated.timing(flipAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                        Animated.timing(flipAnim, { toValue: 0, duration: 200, useNativeDriver: true })
                    ]).start();
                    setLastQuestion(data.gameState.currentQuestion);
                }
                setGameState(data.gameState);
            }
        };

        const handleGameEnded = () => {
            navigation.navigate('Lobby', { room, isHost: isHost, playerName: room.players.find(p => p.userId === SocketService.userId || p.uid === SocketService.userId)?.name, selectedGame: room.gameType, fromGame: true });
        };

        SocketService.on('real-talk-state-update', handleStateUpdate);
        SocketService.on('game-state-sync', handleSync);
        SocketService.on('real-talk-game-ended', handleGameEnded);

        if (!gameState) {
            SocketService.emit('real-talk-get-state', { roomId: room.id });
        }

        return () => {
            SocketService.off('real-talk-state-update', handleStateUpdate);
            SocketService.off('game-state-sync', handleSync);
            SocketService.off('real-talk-game-ended', handleGameEnded);
        };
    }, [room.id, lastQuestion]);

    const handleNext = () => {
        SocketService.emit('real-talk-next-question', { roomId: room.id });
    };

    const handleEndGameRequest = () => {
        if (isHost) {
            setShowEndGameModal(true);
        }
    };

    const confirmEndGame = () => {
        setShowEndGameModal(false);
        SocketService.emit('real-talk-end-game', { roomId: room.id });
    };

    const handleBackPress = () => {
        if (isHost) {
            setShowEndGameModal(true);
        } else {
            navigation.navigate('Lobby', { room, isHost });
        }
    };

    if (!gameState) {
        return (
            <NeonContainer showBackButton>
                <NeonText>Loading...</NeonText>
            </NeonContainer>
        );
    }

    const category = REAL_TALK_CATEGORIES.find(c => c.id === gameState.categoryId) || REAL_TALK_CATEGORIES[0];
    const { currentQuestion, currentPlayer } = gameState;

    const cardAnimatedStyle = {
        transform: [
            {
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg']
                })
            }
        ]
    };

    return (
        <NeonContainer 
            showBackButton 
            onBackPress={handleBackPress}
        >
            <View style={styles.header}>
                <Ionicons name={category.icon} size={32} color={category.color} />
                <NeonText size={24} weight="bold" color={category.color} glow style={{ marginLeft: 10 }}>
                    {category.title}
                </NeonText>
            </View>

            {currentPlayer && (
                <View style={styles.playerTurnContainer}>
                    <NeonText size={16} color={COLORS.textMuted}>Current Player</NeonText>
                    <NeonText size={28} weight="bold" glow color={gameState.isMyTurn ? COLORS.limeGlow : COLORS.white}>
                        {gameState.isMyTurn ? "YOUR TURN" : currentPlayer.name}
                    </NeonText>
                </View>
            )}

            <View style={styles.cardWrapper}>
                <Animated.View style={[styles.card, { borderColor: category.color }, cardAnimatedStyle]}>
                    <Ionicons name="chatbubbles-outline" size={48} color={category.color} style={{ opacity: 0.5, marginBottom: 20 }} />
                    <NeonText size={28} weight="bold" style={styles.questionText}>
                        {currentQuestion}
                    </NeonText>
                </Animated.View>
            </View>

            <View style={styles.buttonContainer}>
                <NeonButton
                    title="NEXT QUESTION"
                    onPress={handleNext}
                    style={styles.nextButton}
                    color={category.color}
                />
                {isHost && (
                    <NeonButton
                        title="END GAME"
                        onPress={handleEndGameRequest}
                        style={{ marginTop: 15 }}
                        color={COLORS.danger || '#FF3B30'}
                        variant="outline"
                    />
                )}
            </View>

            <InGameOverlay />
            
            <ConfirmModal
                visible={showEndGameModal}
                title="END GAME?"
                message="Are you sure you want to end the game for everyone?"
                confirmText="END GAME"
                cancelText="CANCEL"
                variant="danger"
                onConfirm={confirmEndGame}
                onCancel={() => setShowEndGameModal(false)}
            />
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    playerTurnContainer: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 15,
        borderRadius: 16,
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#161622',
        borderRadius: 24,
        borderWidth: 3,
        padding: 30,
        width: width * 0.85,
        minHeight: 300,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    questionText: {
        textAlign: 'center',
        lineHeight: 38,
    },
    buttonContainer: {
        paddingBottom: 30,
        paddingTop: 20,
    },
    nextButton: {
        width: '100%',
    },
});

export default OnlineRealTalkScreen;
