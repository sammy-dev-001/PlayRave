// ============================================================================
// GuessNumberScreen.js — Main Game Screen
// ============================================================================
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';
import NeonContainer from '../components/NeonContainer';
import GlassHeader from '../components/GlassHeader';

// Components
import SecretInputView from '../components/SecretInputView';
import GuessNumberBoard from '../components/GuessNumberBoard';
import GuessNumberResults from '../components/GuessNumberResults';
import InGameOverlay from '../components/InGameOverlay';

const GuessNumberScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { COLORS } = useTheme();

    const { room, playerName, isHost } = route.params || {};
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        // Initial setup/sync if we need to request room sync
        if (room?.id) {
            SocketService.emit('request-room-sync', { roomId: room.id, userId: SocketService.userId });
        }

        const handleStateUpdate = (payload) => {
            if (payload.gameType === 'guess-number' && payload.gameState) {
                setGameState(payload.gameState);
            }
        };

        const handleEngineUpdate = (payload) => {
            if (payload.gameState) {
                setGameState(payload.gameState);
            }
        };

        const handleError = (err) => {
            console.error('[GuessNumber] Error:', err.message);
            // Optionally show toast/alert
        };

        const handleGameOver = (payload) => {
            if (payload.gameState) {
                setGameState({
                    ...payload.gameState,
                    targets: payload.targets,
                });
            }
        };

        SocketService.on('game-state-sync', handleStateUpdate);
        SocketService.on('guess-number-secret-set', handleEngineUpdate);
        SocketService.on('guess-number-guess-result', handleEngineUpdate);
        SocketService.on('guess-number-game-over', handleGameOver);
        SocketService.on('error', handleError);

        return () => {
            SocketService.off('game-state-sync', handleStateUpdate);
            SocketService.off('guess-number-secret-set', handleEngineUpdate);
            SocketService.off('guess-number-guess-result', handleEngineUpdate);
            SocketService.off('guess-number-game-over', handleGameOver);
            SocketService.off('error', handleError);
        };
    }, [room?.id]);

    const handleSetSecret = (secretNumber) => {
        SocketService.emit('game-action', {
            roomId: room?.id,
            eventName: 'set-secret',
            payload: { number: secretNumber },
        });
    };

    const handleGuess = (guessNumber) => {
        SocketService.emit('game-action', {
            roomId: room?.id,
            eventName: 'make-guess',
            payload: { number: guessNumber },
        });
    };

    const handlePlayAgain = () => {
        // GameRouter expects a start-game event to restart
        SocketService.emit('game-action', { 
            roomId: room?.id, 
            eventName: 'start-game', 
            payload: {} 
        });
    };

    const handleReturnToArcade = () => {
        SocketService.emit('leave-room', { roomId: room?.id });
        navigation.navigate('Lobby', { room, playerName, isHost });
    };

    if (!gameState) {
        return (
            <NeonContainer style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.neonCyan} />
            </NeonContainer>
        );
    }

    const currentUserId = SocketService.userId;

    return (
        <NeonContainer>
            <GlassHeader 
                title="Guess the Number" 
                onBack={() => handleReturnToArcade()} 
            />
            
            <View style={styles.content}>
                {gameState.gamePhase === 'AWAITING_SECRET' && (
                    <SecretInputView
                        gameState={gameState}
                        currentUserId={currentUserId}
                        onSecretSubmit={handleSetSecret}
                    />
                )}

                {gameState.gamePhase === 'PLAYING' && (
                    <GuessNumberBoard
                        gameState={gameState}
                        currentUserId={currentUserId}
                        onGuess={handleGuess}
                    />
                )}

                {gameState.gamePhase === 'GAME_OVER' && (
                    <GuessNumberResults
                        gameState={gameState}
                        targets={gameState.targets}
                        currentUserId={currentUserId}
                        winner={gameState.players?.find(p => p.isWinner) || null}
                        message="Game Over"
                        onPlayAgain={handlePlayAgain}
                        onReturnToArcade={handleReturnToArcade}
                    />
                )}
            </View>

            {/* In-Game Voice and Chat Overlay */}
            <InGameOverlay />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
    },
});

export default GuessNumberScreen;
