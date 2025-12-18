import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const WhosMostLikelyResultsScreen = ({ route }) => {
    const { room, results, players, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(5);

    // Check if current player won for rave lights
    const currentPlayerId = SocketService.socket?.id;
    const currentPlayerResult = results.voteResults.find(r => r.playerId === currentPlayerId);
    const showRaveLights = currentPlayerResult?.isWinner || false;

    useEffect(() => {
        if (hostParticipates) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (isHost) {
                            handleNext();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [hostParticipates, isHost]);

    const handleNext = () => {
        console.log('Host requesting next prompt');
        SocketService.emit('next-whos-most-likely-prompt', { roomId: room.id });
    };

    const renderVoteResult = ({ item }) => {
        const player = players.find(p => p.id === item.playerId);
        const playerName = player?.name || 'Unknown';

        return (
            <View style={[styles.voteRow, item.isWinner && styles.winnerRow]}>
                <View style={styles.playerInfo}>
                    {item.isWinner && <NeonText size={20}>👑 </NeonText>}
                    <NeonText size={18} weight={item.isWinner ? 'bold' : 'normal'}>
                        {playerName}
                    </NeonText>
                </View>
                <View style={styles.voteInfo}>
                    <NeonText size={18} color={COLORS.hotPink}>
                        {item.votes} {item.votes === 1 ? 'vote' : 'votes'}
                    </NeonText>
                    <NeonText size={14} color="#888" style={styles.totalVotes}>
                        ({item.totalVotes} total)
                    </NeonText>
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton>
            <RaveLights trigger={showRaveLights} intensity="high" />
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    RESULTS
                </NeonText>
            </View>

            <View style={styles.promptContainer}>
                <NeonText size={18} color={COLORS.neonCyan} style={styles.promptLabel}>
                    {results.prompt}
                </NeonText>
            </View>

            <NeonText size={18} style={styles.sectionTitle}>VOTE DISTRIBUTION</NeonText>

            <FlatList
                data={results.voteResults}
                keyExtractor={item => item.playerId}
                renderItem={renderVoteResult}
                contentContainerStyle={styles.list}
            />

            {isHost && !hostParticipates && (
                <NeonButton
                    title={results.isLastPrompt ? "PROCEED TO SCOREBOARD" : "NEXT PROMPT"}
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            )}

            {isHost && hostParticipates && (
                <NeonText style={styles.autoAdvance}>
                    {results.isLastPrompt
                        ? `Proceeding to scoreboard in ${countdown}s...`
                        : `Next prompt in ${countdown}s...`}
                </NeonText>
            )}

            {!isHost && (
                <NeonText style={styles.waiting}>
                    {hostParticipates
                        ? (results.isLastPrompt
                            ? `Proceeding to scoreboard in ${countdown}s...`
                            : `Next prompt in ${countdown}s...`)
                        : 'Waiting for host...'}
                </NeonText>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        letterSpacing: 2,
    },
    promptContainer: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: 'rgba(177, 78, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    promptLabel: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sectionTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    voteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 63, 164, 0.3)',
    },
    winnerRow: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderWidth: 2,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    voteInfo: {
        alignItems: 'flex-end',
    },
    totalVotes: {
        marginTop: 4,
    },
    nextButton: {
        marginTop: 20,
    },
    autoAdvance: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.limeGlow,
    },
    waiting: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: '#888',
    }
});

export default WhosMostLikelyResultsScreen;
