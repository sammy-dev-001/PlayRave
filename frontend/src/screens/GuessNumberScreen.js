// ============================================================================
// GuessNumberScreen.js — Main Game Screen
// ============================================================================
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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
    // The number THIS player set as the secret (2-player mode only)
    const [mySecretNumber, setMySecretNumber] = useState(null);
    const [opponentLastGuess, setOpponentLastGuess] = useState(null);
    // Transitory state to hold round-over data before the next round begins
    const [roundOverData, setRoundOverData] = useState(null);
    // Server-side turn duration so the board can render a live countdown
    const TURN_TIMEOUT_MS = 30_000;

    useEffect(() => {
        // Initial setup/sync if we need to request room sync
        if (room?.id) {
            SocketService.emit('request-room-sync', { roomId: room.id, userId: SocketService.userId });
        }

        const handleStateUpdate = (payload) => {
            if (payload.gameType === 'guess-number' && payload.gameState) {
                setGameState(payload.gameState);
                // If returning to AWAITING_SECRET, clear round-over overlay & local secrets
                if (payload.gameState.gamePhase === 'AWAITING_SECRET') {
                    setMySecretNumber(null);
                    setOpponentLastGuess(null);
                    setRoundOverData(null);
                }
            }
        };

        const handleEngineUpdate = (payload) => {
            if (payload.gameState) {
                setGameState(payload.gameState);
            }
            // Capture opponent's last guess to show when it's our turn
            if (payload.opponentLastGuess && payload.opponentLastGuess.playerId !== SocketService.userId) {
                setOpponentLastGuess(payload.opponentLastGuess);
            }
        };

        const handleError = (err) => {
            console.error('[GuessNumber] Error:', err.message);
        };

        const handleRoundOver = (payload) => {
            if (payload.gameState) {
                setGameState(payload.gameState);
            }
            setRoundOverData(payload);
        };

        const handleGameOver = (payload) => {
            if (payload.gameState) {
                setGameState({
                    ...payload.gameState,
                    targets: payload.targets,
                });
            }
        };

        const handleTurnTimeout = (payload) => {
            // Update game state from the timeout event
            if (payload.gameState) setGameState(payload.gameState);
            // Clear the stale opponent guess when a timeout fires
            setOpponentLastGuess(null);
        };

        SocketService.on('game-state-sync', handleStateUpdate);
        SocketService.on('guess-number-secret-set', handleEngineUpdate);
        SocketService.on('guess-number-guess-result', handleEngineUpdate);
        SocketService.on('guess-number-round-over', handleRoundOver);
        SocketService.on('guess-number-game-over', handleGameOver);
        SocketService.on('guess-number-turn-timeout', handleTurnTimeout);
        SocketService.on('error', handleError);

        return () => {
            SocketService.off('game-state-sync', handleStateUpdate);
            SocketService.off('guess-number-secret-set', handleEngineUpdate);
            SocketService.off('guess-number-guess-result', handleEngineUpdate);
            SocketService.off('guess-number-round-over', handleRoundOver);
            SocketService.off('guess-number-game-over', handleGameOver);
            SocketService.off('guess-number-turn-timeout', handleTurnTimeout);
            SocketService.off('error', handleError);
        };
    }, [room?.id]);

    const handleSetSecret = (secretNumber) => {
        setMySecretNumber(secretNumber);
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
            
            <ScrollView style={styles.content} contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false}>
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
                        mySecretNumber={mySecretNumber}
                        opponentLastGuess={opponentLastGuess}
                        turnTimeoutMs={TURN_TIMEOUT_MS}
                    />
                )}

                {gameState.gamePhase === 'BETWEEN_ROUNDS' && (
                    <GuessNumberResults
                        gameState={gameState}
                        targets={gameState.targets} // might be undefined, that's okay
                        currentUserId={currentUserId}
                        winner={roundOverData?.roundWinner} // Passed from handleRoundOver
                        message={roundOverData ? `Round ${gameState.roundNumber - 1} Complete!` : 'Round Complete!'}
                        isBetweenRounds={true}
                        roundScores={gameState.roundScores}
                        maxRounds={gameState.maxRounds}
                    />
                )}

                {gameState.gamePhase === 'GAME_OVER' && (
                    <GuessNumberResults
                        gameState={gameState}
                        targets={gameState.targets}
                        currentUserId={currentUserId}
                        winner={gameState.players?.find(p => p.isWinner) || null}
                        message="Final Results"
                        isBetweenRounds={false}
                        roundScores={gameState.roundScores}
                        maxRounds={gameState.maxRounds}
                        onPlayAgain={handlePlayAgain}
                        onReturnToArcade={handleReturnToArcade}
                    />
                )}
            </ScrollView>

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
