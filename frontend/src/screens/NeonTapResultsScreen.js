import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const NeonTapResultsScreen = ({ route, navigation }) => {
    const { room, results, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(3);

    // Check if current player won for rave lights
    const currentPlayerId = SocketService.socket?.id;
    const showRaveLights = results.winner === currentPlayerId;

    useEffect(() => {
        // Listen for next round or game finished events
        const onReadyForNext = () => {
            console.log('Ready for next round - navigating back to game');
            navigation.navigate('NeonTapGame', { room, hostParticipates, isHost });
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('neon-tap-ready-for-next', onReadyForNext);
        SocketService.on('game-finished', onGameFinished);

        // Countdown timer
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

        return () => {
            clearInterval(timer);
            SocketService.off('neon-tap-ready-for-next', onReadyForNext);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [isHost, navigation, room, hostParticipates]);

    const handleNext = () => {
        console.log('Host requesting next round');
        SocketService.emit('next-neon-tap-round', { roomId: room.id });
    };

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const renderTapResult = ({ item, index }) => {
        const playerName = getPlayerName(item.playerId);
        const isWinner = item.playerId === results.winner;

        return (
            <View style={[styles.tapRow, isWinner && styles.winnerRow]}>
                <View style={styles.rankContainer}>
                    <NeonText size={20} weight="bold" color={isWinner ? COLORS.limeGlow : COLORS.white}>
                        #{index + 1}
                    </NeonText>
                </View>
                <View style={styles.playerInfo}>
                    {isWinner && <NeonText size={20}>⚡ </NeonText>}
                    <NeonText size={18} weight={isWinner ? 'bold' : 'normal'}>
                        {playerName}
                    </NeonText>
                </View>
                <View style={styles.timeInfo}>
                    <NeonText size={18} color={isWinner ? COLORS.limeGlow : COLORS.hotPink}>
                        {item.reactionTime !== null ? `${item.reactionTime}ms` : 'NO TAP'}
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
                    ROUND {results.currentRound + 1} RESULTS
                </NeonText>
            </View>

            {results.winner && (
                <View style={styles.winnerAnnouncement}>
                    <NeonText size={20} color={COLORS.limeGlow} style={styles.winnerText}>
                        🏆 {getPlayerName(results.winner)} WINS! 🏆
                    </NeonText>
                </View>
            )}

            <NeonText size={18} style={styles.sectionTitle}>REACTION TIMES</NeonText>

            <FlatList
                data={results.roundTaps}
                keyExtractor={item => item.playerId}
                renderItem={renderTapResult}
                contentContainerStyle={styles.list}
            />

            <NeonText style={styles.autoAdvance}>
                {results.isLastRound
                    ? `Final results in ${countdown}s...`
                    : `Next round in ${countdown}s...`}
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
    winnerAnnouncement: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
    },
    winnerText: {
        textAlign: 'center',
    },
    sectionTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    tapRow: {
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
    rankContainer: {
        width: 40,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    autoAdvance: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.limeGlow,
    }
});

export default NeonTapResultsScreen;
