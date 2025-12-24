import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Animated
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import { COLORS, SHADOWS } from '../constants/theme';

const MVPVotingScreen = ({ route, navigation }) => {
    const { room, finalScores, fromGame } = route.params;
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [votes, setVotes] = useState({});
    const [mvpWinner, setMvpWinner] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [countdown, setCountdown] = useState(15);

    const currentPlayerId = SocketService.socket?.id;
    const crownScale = new Animated.Value(0);

    // Filter out current player from voting options
    const otherPlayers = room.players.filter(p => p.id !== currentPlayerId);

    useEffect(() => {
        // Listen for MVP votes from other players
        const onMvpVote = ({ playerId, votedFor }) => {
            setVotes(prev => ({
                ...prev,
                [playerId]: votedFor
            }));
        };

        const onMvpResults = ({ winner, voteCounts }) => {
            setMvpWinner(winner);
            setShowResults(true);

            // Animate the crown
            Animated.spring(crownScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true
            }).start();
        };

        SocketService.on('mvp-vote', onMvpVote);
        SocketService.on('mvp-results', onMvpResults);

        // Countdown timer
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Auto-submit vote if not voted
                    if (!hasVoted && selectedPlayer) {
                        handleSubmitVote();
                    } else if (!hasVoted) {
                        // Skip to results if no vote
                        handleSkip();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            SocketService.off('mvp-vote', onMvpVote);
            SocketService.off('mvp-results', onMvpResults);
        };
    }, [hasVoted, selectedPlayer]);

    const handleSelectPlayer = (playerId) => {
        if (!hasVoted) {
            setSelectedPlayer(playerId);
        }
    };

    const handleSubmitVote = () => {
        if (!selectedPlayer || hasVoted) return;

        setHasVoted(true);
        SocketService.emit('mvp-vote', {
            roomId: room.id,
            votedFor: selectedPlayer
        });
    };

    const handleSkip = () => {
        setHasVoted(true);
        // Navigate to scoreboard without voting
        navigation.navigate('Scoreboard', { room, finalScores });
    };

    const handleContinue = () => {
        navigation.navigate('Scoreboard', { room, finalScores });
    };

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const renderPlayerOption = ({ item }) => {
        const isSelected = selectedPlayer === item.id;
        const playerScore = finalScores.find(s => s.playerId === item.id)?.score || 0;

        return (
            <TouchableOpacity
                style={[
                    styles.playerOption,
                    isSelected && styles.playerOptionSelected
                ]}
                onPress={() => handleSelectPlayer(item.id)}
                disabled={hasVoted}
            >
                <View style={styles.playerAvatar}>
                    <NeonText size={32}>👤</NeonText>
                </View>
                <View style={styles.playerInfo}>
                    <NeonText size={18} weight="bold">{item.name}</NeonText>
                    <NeonText size={14} color={COLORS.neonCyan}>{playerScore} pts</NeonText>
                </View>
                {isSelected && (
                    <View style={styles.checkmark}>
                        <NeonText size={20}>⭐</NeonText>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (showResults && mvpWinner) {
        return (
            <NeonContainer>
                <RaveLights trigger={mvpWinner === currentPlayerId} intensity="high" duration={3000} />
                <View style={styles.resultsContainer}>
                    <NeonText size={24} weight="bold" style={styles.resultsTitle}>
                        MOST VALUABLE PLAYER
                    </NeonText>

                    <Animated.View style={[
                        styles.mvpContainer,
                        { transform: [{ scale: crownScale }] }
                    ]}>
                        <NeonText size={80}>👑</NeonText>
                        <View style={styles.mvpAvatar}>
                            <NeonText size={64}>👤</NeonText>
                        </View>
                        <NeonText size={32} weight="bold" glow color={COLORS.limeGlow}>
                            {getPlayerName(mvpWinner)}
                        </NeonText>
                        <NeonText size={16} color={COLORS.hotPink} style={styles.mvpLabel}>
                            🎉 MVP OF THE GAME 🎉
                        </NeonText>
                    </Animated.View>

                    <NeonButton
                        title="CONTINUE TO SCOREBOARD"
                        onPress={handleContinue}
                        style={styles.continueButton}
                    />
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow>
                    VOTE FOR MVP
                </NeonText>
                <NeonText size={14} color="#888" style={styles.subtitle}>
                    Who was the Most Valuable Player?
                </NeonText>
                <View style={styles.timer}>
                    <NeonText size={24} weight="bold" color={countdown <= 5 ? COLORS.hotPink : COLORS.neonCyan}>
                        {countdown}s
                    </NeonText>
                </View>
            </View>

            {hasVoted ? (
                <View style={styles.waitingContainer}>
                    <NeonText size={48}>🗳️</NeonText>
                    <NeonText size={20} style={styles.waitingText}>
                        Vote submitted!
                    </NeonText>
                    <NeonText size={14} color="#888">
                        Waiting for other players...
                    </NeonText>
                </View>
            ) : (
                <>
                    <FlatList
                        data={otherPlayers}
                        keyExtractor={item => item.id}
                        renderItem={renderPlayerOption}
                        contentContainerStyle={styles.list}
                    />

                    <View style={styles.buttonRow}>
                        <NeonButton
                            title="SUBMIT VOTE"
                            onPress={handleSubmitVote}
                            disabled={!selectedPlayer}
                            style={styles.submitButton}
                        />
                        <NeonButton
                            title="SKIP"
                            onPress={handleSkip}
                            variant="secondary"
                            style={styles.skipButton}
                        />
                    </View>
                </>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    subtitle: {
        marginTop: 10,
    },
    timer: {
        marginTop: 15,
        padding: 15,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
    },
    list: {
        paddingBottom: 20,
    },
    playerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    playerOptionSelected: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    playerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    playerInfo: {
        flex: 1,
    },
    checkmark: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.limeGlow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    submitButton: {
        flex: 2,
    },
    skipButton: {
        flex: 1,
    },
    waitingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waitingText: {
        marginTop: 20,
        marginBottom: 10,
    },
    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    resultsTitle: {
        marginBottom: 30,
        letterSpacing: 2,
    },
    mvpContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    mvpAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(198, 255, 74, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        borderWidth: 3,
        borderColor: COLORS.limeGlow,
        ...SHADOWS.neonGlow,
    },
    mvpLabel: {
        marginTop: 15,
        letterSpacing: 1,
    },
    continueButton: {
        minWidth: 250,
    }
});

export default MVPVotingScreen;
