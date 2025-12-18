import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const WordRushResultsScreen = ({ route, navigation }) => {
    const { room, results, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Check if current player was eliminated and play sound
        const currentPlayerId = SocketService.socket?.id;
        if (results.eliminated.includes(currentPlayerId)) {
            SoundService.playElimination();
        }

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

        const onReadyForNext = () => {
            console.log('Results screen received ready for next round - navigating back');
            navigation.goBack();
        };

        const onWinner = ({ winner }) => {
            console.log('Results screen received winner - navigating to winner screen');
            navigation.navigate('WordRushWinner', { room, winner });
        };

        SocketService.on('word-rush-ready-for-next', onReadyForNext);
        SocketService.on('word-rush-winner', onWinner);

        return () => {
            clearInterval(timer);
            SocketService.off('word-rush-ready-for-next', onReadyForNext);
            SocketService.off('word-rush-winner', onWinner);
        };
    }, [isHost, navigation]);

    const handleNext = () => {
        console.log('Host requesting next round');
        SocketService.emit('next-word-rush-round', {
            roomId: room.id,
            eliminated: results.eliminated
        });
    };

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const renderSubmission = ({ item }) => {
        const playerName = getPlayerName(item.playerId);
        const isEliminated = results.eliminated.includes(item.playerId);

        return (
            <View style={[styles.submissionRow, isEliminated && styles.eliminatedRow]}>
                <View style={styles.playerInfo}>
                    <NeonText size={18} weight={isEliminated ? 'bold' : 'normal'}>
                        {playerName}
                    </NeonText>
                </View>
                <View style={styles.wordInfo}>
                    <NeonText size={18} color={item.isValid ? COLORS.limeGlow : COLORS.hotPink}>
                        {item.word || 'NO WORD'}
                    </NeonText>
                    {item.reactionTime !== null && (
                        <NeonText size={14} color="#888" style={styles.time}>
                            {(item.reactionTime / 1000).toFixed(2)}s
                        </NeonText>
                    )}
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showMuteButton showBackButton>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    ROUND {results.currentRound + 1} RESULTS
                </NeonText>
            </View>

            <View style={styles.letterDisplay}>
                <NeonText size={18} color={COLORS.neonCyan}>
                    Letter: <NeonText size={24} weight="bold" color={COLORS.limeGlow}>{results.letter}</NeonText>
                </NeonText>
            </View>

            {results.eliminated.length > 0 && (
                <View style={styles.eliminationAnnouncement}>
                    <NeonText size={20} color={COLORS.hotPink} style={styles.eliminationText}>
                        ❌ ELIMINATED ❌
                    </NeonText>
                    <NeonText size={16} style={styles.eliminatedNames}>
                        {results.eliminated.map(id => getPlayerName(id)).join(', ')}
                    </NeonText>
                </View>
            )}

            <NeonText size={18} style={styles.sectionTitle}>SUBMISSIONS</NeonText>

            <FlatList
                data={results.submissions}
                keyExtractor={item => item.playerId}
                renderItem={renderSubmission}
                contentContainerStyle={styles.list}
            />

            <NeonText style={styles.autoAdvance}>
                {results.remainingPlayers > 1
                    ? `Next round in ${countdown}s... (${results.remainingPlayers} players left)`
                    : `Determining winner in ${countdown}s...`}
            </NeonText>
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
    letterDisplay: {
        alignItems: 'center',
        marginBottom: 20,
    },
    eliminationAnnouncement: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
    },
    eliminationText: {
        textAlign: 'center',
        marginBottom: 10,
    },
    eliminatedNames: {
        textAlign: 'center',
        color: COLORS.white,
    },
    sectionTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    submissionRow: {
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
    eliminatedRow: {
        borderColor: COLORS.hotPink,
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
        borderWidth: 2,
    },
    playerInfo: {
        flex: 1,
    },
    wordInfo: {
        alignItems: 'flex-end',
    },
    time: {
        marginTop: 4,
    },
    autoAdvance: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.limeGlow,
    }
});

export default WordRushResultsScreen;
