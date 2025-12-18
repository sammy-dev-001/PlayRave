import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Keyboard } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const WordRushGameScreen = ({ route, navigation }) => {
    const { room, hostParticipates, isHost } = route.params;
    const [gameState, setGameState] = useState('waiting'); // waiting, playing, submitted, eliminated
    const [currentLetter, setCurrentLetter] = useState('');
    const [word, setWord] = useState('');
    const [timeLeft, setTimeLeft] = useState(7);
    const [currentRound, setCurrentRound] = useState(0);
    const [isEliminated, setIsEliminated] = useState(false);
    const [validationFeedback, setValidationFeedback] = useState('');

    const inputRef = useRef(null);
    const canPlay = (!isHost || hostParticipates) && !isEliminated;

    const timerRef = useRef(null);

    // Cleanup function for timer
    const clearGameTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        // Start first round
        if (isHost) {
            setTimeout(() => {
                SocketService.emit('start-word-rush-round', { roomId: room.id });
            }, 1000);
        }

        const onRoundStarted = ({ letter, roundStartTime, currentRound: round, activePlayers }) => {
            console.log('Round started - raw data:', { letter, roundStartTime, round, activePlayers });

            // Validate letter is present
            if (!letter) {
                console.error('ERROR: No letter received in round data!');
                return;
            }

            // Clear any existing timer first
            clearGameTimer();

            setCurrentLetter(letter);
            setCurrentRound(round);
            setWord('');
            setValidationFeedback('');
            setGameState('playing');
            setTimeLeft(7);

            // Focus input if player can play
            if (canPlay) {
                setTimeout(() => inputRef.current?.focus(), 100);
            }

            // Start countdown
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearGameTimer();
                        // Auto-show results - increased delay to allow network sync
                        if (isHost) {
                            setTimeout(() => {
                                SocketService.emit('show-word-rush-results', { roomId: room.id });
                            }, 2000);
                        }
                        return 0;
                    }
                    // Play tick sound in last 3 seconds
                    if (prev <= 4 && prev > 1) {
                        SoundService.playTick();
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const onWordSubmitted = ({ success, isValid }) => {
            if (success) {
                setGameState('submitted');
                setValidationFeedback(isValid ? '✓ Valid word!' : '✗ Invalid word');
                // Play sound based on validity
                if (isValid) {
                    SoundService.playCorrect();
                } else {
                    SoundService.playWrong();
                }
                Keyboard.dismiss();
            }
        };

        const onResults = (results) => {
            console.log('Word Rush results received:', results);
            clearGameTimer(); // Clear timer when navigating away

            // Check if current player was eliminated
            const currentPlayerId = SocketService.socket?.id;
            if (results.eliminated.includes(currentPlayerId)) {
                console.log('Current player was eliminated!');
                setIsEliminated(true);
            }

            navigation.navigate('WordRushResults', { room, results, hostParticipates, isHost });
        };

        const onReadyForNext = () => {
            console.log('Ready for next round');
            setGameState('waiting');
            if (isHost) {
                setTimeout(() => {
                    SocketService.emit('start-word-rush-round', { roomId: room.id });
                }, 500);
            }
        };

        const onWinner = ({ winner }) => {
            console.log('Word Rush winner:', winner);
            clearGameTimer();
            navigation.navigate('WordRushWinner', { room, winner });
        };

        SocketService.on('word-rush-round-started', onRoundStarted);
        SocketService.on('word-submitted', onWordSubmitted);
        SocketService.on('word-rush-results', onResults);
        SocketService.on('word-rush-ready-for-next', onReadyForNext);
        SocketService.on('word-rush-winner', onWinner);

        return () => {
            clearGameTimer();
            SocketService.off('word-rush-round-started', onRoundStarted);
            SocketService.off('word-submitted', onWordSubmitted);
            SocketService.off('word-rush-results', onResults);
            SocketService.off('word-rush-ready-for-next', onReadyForNext);
            SocketService.off('word-rush-winner', onWinner);
        };
    }, [navigation, room, isHost, hostParticipates, canPlay]);

    const handleSubmit = () => {
        if (gameState !== 'playing' || !canPlay || !word.trim()) return;

        console.log('Submitting word:', word);
        SocketService.emit('submit-word-rush-word', { roomId: room.id, word: word.trim() });
    };

    const validateInput = (text) => {
        // Only allow letters
        return text.replace(/[^a-zA-Z]/g, '');
    };

    return (
        <NeonContainer showMuteButton showBackButton>
            {/* Spectator Banner for Eliminated Players */}
            {isEliminated && (
                <View style={styles.eliminatedBanner}>
                    <NeonText size={16} color={COLORS.hotPink} glow>
                        ❌ ELIMINATED - SPECTATING ❌
                    </NeonText>
                </View>
            )}

            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    ROUND {currentRound + 1}
                </NeonText>
                {gameState === 'playing' && (
                    <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                        {timeLeft}s
                    </NeonText>
                )}
            </View>

            <View style={styles.gameArea}>
                {gameState === 'waiting' && (
                    <NeonText size={24} weight="bold" style={styles.centerText}>
                        GET READY...
                    </NeonText>
                )}

                {gameState === 'playing' && (
                    <>
                        <View style={styles.letterContainer}>
                            <NeonText size={14} color={COLORS.neonCyan} style={styles.instruction}>
                                Type a word starting with:
                            </NeonText>
                            <NeonText size={120} weight="bold" color={COLORS.limeGlow} glow>
                                {currentLetter}
                            </NeonText>
                        </View>

                        {canPlay ? (
                            <>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    value={word}
                                    onChangeText={(text) => setWord(validateInput(text))}
                                    placeholder="Type your word..."
                                    placeholderTextColor="#666"
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    maxLength={20}
                                    editable={gameState === 'playing'}
                                />

                                <NeonButton
                                    title="SUBMIT WORD"
                                    onPress={handleSubmit}
                                    disabled={!word.trim() || gameState !== 'playing'}
                                    style={styles.submitButton}
                                />
                            </>
                        ) : (
                            <NeonText style={styles.spectatorText}>
                                {isEliminated ? '(Eliminated)' : '(Spectating)'}
                            </NeonText>
                        )}
                    </>
                )}

                {gameState === 'submitted' && (
                    <View style={styles.feedbackContainer}>
                        <NeonText size={24} weight="bold" color={validationFeedback.includes('✓') ? COLORS.limeGlow : COLORS.hotPink}>
                            {validationFeedback}
                        </NeonText>
                        <NeonText size={18} style={styles.wordDisplay}>
                            {word.toUpperCase()}
                        </NeonText>
                    </View>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerText: {
        textAlign: 'center',
    },
    letterContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    instruction: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderRadius: 12,
        padding: 20,
        fontSize: 24,
        color: COLORS.white,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    submitButton: {
        width: '100%',
    },
    feedbackContainer: {
        alignItems: 'center',
    },
    wordDisplay: {
        marginTop: 15,
        textAlign: 'center',
    },
    spectatorText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#888',
        fontSize: 14,
    },
    eliminatedBanner: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 63, 164, 0.2)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        marginBottom: 15,
    }
});

export default WordRushGameScreen;
