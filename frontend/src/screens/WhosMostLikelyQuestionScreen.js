import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const WhosMostLikelyQuestionScreen = ({ route, navigation }) => {
    const { room, prompt, promptIndex, players, hostParticipates, isHost } = route.params;
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(20);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const canVote = !isHost || hostParticipates;

    // Get list of players to vote for (all participating players)
    const votablePlayers = players.filter(player => {
        if (!hostParticipates && player.isHost) return false;
        return true;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasSubmitted && canVote) {
                        // Auto-submit selected vote (or null if nothing selected)
                        handleSubmitVote(selectedPlayer);
                    }

                    setTimeout(() => {
                        console.log('Timer ended, auto-showing results');
                        SocketService.emit('show-whos-most-likely-results', { roomId: room.id });
                    }, 2000);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const onResults = (results) => {
            console.log('Whos Most Likely results received:', results);
            navigation.navigate('WhosMostLikelyResults', { room, results, players, hostParticipates, isHost });
        };

        const onNextPrompt = ({ prompt: nextPrompt }) => {
            console.log('Next prompt ready:', nextPrompt);
            navigation.replace('WhosMostLikelyQuestion', {
                room,
                prompt: nextPrompt,
                promptIndex: nextPrompt.promptIndex,
                players,
                hostParticipates,
                isHost
            });
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('whos-most-likely-results', onResults);
        SocketService.on('next-whos-most-likely-prompt-ready', onNextPrompt);
        SocketService.on('game-finished', onGameFinished);

        return () => {
            clearInterval(timer);
            SocketService.off('whos-most-likely-results', onResults);
            SocketService.off('next-whos-most-likely-prompt-ready', onNextPrompt);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [navigation, room, hasSubmitted, canVote, selectedPlayer]);

    const handleSelectPlayer = (playerId) => {
        if (hasSubmitted || !canVote) return;
        setSelectedPlayer(playerId);
    };

    const handleSubmitVote = (votedForPlayerId) => {
        if (hasSubmitted || !canVote) return;

        const finalVote = votedForPlayerId !== undefined ? votedForPlayerId : selectedPlayer;
        setSelectedPlayer(finalVote);
        setHasSubmitted(true);

        console.log('Submitting vote for player:', finalVote);
        SocketService.emit('submit-whos-most-likely-vote', { roomId: room.id, votedForPlayerId: finalVote });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    PROMPT {promptIndex + 1} / {prompt.totalPrompts}
                </NeonText>
                <NeonText size={36} weight="bold" color={COLORS.limeGlow}>
                    {timeLeft}s
                </NeonText>
            </View>

            <View style={styles.promptContainer}>
                <NeonText size={24} weight="bold" style={styles.prompt}>
                    {prompt.prompt}
                </NeonText>
                {prompt.category && (
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.category}>
                        {prompt.category}
                    </NeonText>
                )}
            </View>

            {canVote ? (
                <>
                    <ScrollView style={styles.playersContainer} contentContainerStyle={styles.playersContent}>
                        {votablePlayers.map((player) => (
                            <NeonButton
                                key={player.id}
                                title={player.name}
                                variant={selectedPlayer === player.id ? 'primary' : 'secondary'}
                                onPress={() => handleSelectPlayer(player.id)}
                                style={styles.playerButton}
                                disabled={hasSubmitted}
                            />
                        ))}
                    </ScrollView>

                    {selectedPlayer !== null && !hasSubmitted && (
                        <NeonButton
                            title="SUBMIT VOTE"
                            onPress={() => handleSubmitVote()}
                            style={styles.submitButton}
                        />
                    )}

                    {hasSubmitted && (
                        <NeonText style={styles.submittedText}>
                            Vote submitted! Waiting for others...
                        </NeonText>
                    )}
                </>
            ) : (
                <NeonText style={styles.spectatorText}>
                    (Spectating - voting disabled)
                </NeonText>
            )}
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
    promptContainer: {
        marginBottom: 30,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    prompt: {
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 32,
    },
    category: {
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    playersContainer: {
        maxHeight: 300,
    },
    playersContent: {
        gap: 12,
        paddingBottom: 10,
    },
    playerButton: {
        width: '100%',
    },
    submitButton: {
        marginTop: 20,
    },
    submittedText: {
        textAlign: 'center',
        marginTop: 30,
        fontStyle: 'italic',
        color: COLORS.limeGlow,
    },
    spectatorText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: '#888',
        fontSize: 14,
    }
});

export default WhosMostLikelyQuestionScreen;
