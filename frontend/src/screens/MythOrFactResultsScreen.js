import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const MythOrFactResultsScreen = ({ route }) => {
    const { room, results, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(5);

    // Check if current player got it right for rave lights
    const currentPlayerId = SocketService.socket?.id;
    const currentPlayerResult = results.playerResults.find(r => r.playerId === currentPlayerId);
    const showRaveLights = currentPlayerResult?.isCorrect || false;

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
        console.log('Host requesting next statement');
        SocketService.emit('next-myth-or-fact-statement', { roomId: room.id });
    };

    const renderPlayerResult = ({ item }) => {
        const player = room.players.find(p => p.id === item.playerId);
        const playerName = player?.name || 'Unknown';

        return (
            <View style={[styles.playerRow, item.isCorrect && styles.correctRow]}>
                <NeonText size={18}>
                    {item.isCorrect ? '✓' : '✗'} {playerName}
                </NeonText>
                <NeonText size={18} color={COLORS.limeGlow}>
                    {item.currentScore} pts
                </NeonText>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton>
            <RaveLights trigger={showRaveLights} intensity="medium" />
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    RESULTS
                </NeonText>
            </View>

            <View style={styles.answerContainer}>
                <NeonText size={16} color={COLORS.hotPink}>CORRECT ANSWER:</NeonText>
                <NeonText
                    size={32}
                    weight="bold"
                    color={results.correctAnswer ? COLORS.limeGlow : COLORS.hotPink}
                    style={styles.correctAnswer}
                >
                    {results.answerText}
                </NeonText>
            </View>

            <View style={styles.explanationContainer}>
                <NeonText size={14} color="#999">EXPLANATION:</NeonText>
                <NeonText size={16} style={styles.explanation}>
                    {results.explanation}
                </NeonText>
            </View>

            <NeonText size={18} style={styles.sectionTitle}>PLAYER SCORES</NeonText>

            <FlatList
                data={results.playerResults}
                keyExtractor={item => item.playerId}
                renderItem={renderPlayerResult}
                contentContainerStyle={styles.list}
            />

            {isHost && !hostParticipates && (
                <NeonButton
                    title={results.isLastStatement ? "PROCEED TO SCOREBOARD" : "NEXT STATEMENT"}
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            )}

            {isHost && hostParticipates && (
                <NeonText style={styles.autoAdvance}>
                    {results.isLastStatement ? `Proceeding to scoreboard in ${countdown}s...` : `Next statement in ${countdown}s...`}
                </NeonText>
            )}

            {!isHost && (
                <NeonText style={styles.waiting}>
                    {hostParticipates
                        ? (results.isLastStatement ? `Proceeding to scoreboard in ${countdown}s...` : `Next statement in ${countdown}s...`)
                        : 'Waiting for host...'}
                </NeonText>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        letterSpacing: 2,
    },
    answerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    correctAnswer: {
        marginTop: 10,
        textAlign: 'center',
    },
    explanationContainer: {
        marginBottom: 30,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    explanation: {
        marginTop: 8,
        lineHeight: 22,
        color: '#ddd',
    },
    sectionTitle: {
        marginBottom: 15,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    playerRow: {
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
    correctRow: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
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

export default MythOrFactResultsScreen;
