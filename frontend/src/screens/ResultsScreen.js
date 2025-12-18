import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const ResultsScreen = ({ route, navigation }) => {
    const { room, results, hostParticipates, isHost } = route.params;
    const [countdown, setCountdown] = useState(5);

    // Check if current player got it right for rave lights
    const currentPlayerId = SocketService.socket?.id;
    const currentPlayerResult = results.playerResults.find(r => r.playerId === currentPlayerId);
    const showRaveLights = currentPlayerResult?.isCorrect || false;

    // Play sound based on result
    useEffect(() => {
        if (showRaveLights) {
            SoundService.playCorrect();
        } else {
            SoundService.playWrong();
        }
    }, []);

    useEffect(() => {
        // Listen for next question
        const onNextQuestionReady = ({ question }) => {
            console.log('Next question ready:', question);
            navigation.replace('Question', {
                room,
                question,
                questionIndex: question.questionIndex,
                hostParticipates,
                isHost
            });
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('next-question-ready', onNextQuestionReady);
        SocketService.on('game-finished', onGameFinished);

        // If host participates, auto-advance after 5 seconds
        let timer;
        if (hostParticipates && isHost) {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleNext();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
            SocketService.off('next-question-ready', onNextQuestionReady);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [hostParticipates, isHost, navigation, room]);

    const handleNext = () => {
        console.log('Host requesting next question');
        SocketService.emit('next-question', { roomId: room.id });
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
                <NeonText size={28} weight="bold" glow={true} style={styles.title}>
                    RESULTS
                </NeonText>
            </View>

            <View style={styles.answerContainer}>
                <NeonText size={16} color={COLORS.hotPink}>CORRECT ANSWER:</NeonText>
                <NeonText size={24} weight="bold" color={COLORS.neonCyan} style={styles.correctAnswer}>
                    {results.correctOption}
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
                    title={results.isLastQuestion ? "PROCEED TO SCOREBOARD" : "NEXT QUESTION"}
                    onPress={handleNext}
                    style={styles.nextButton}
                />
            )}

            {isHost && hostParticipates && (
                <NeonText style={styles.autoAdvance}>
                    {results.isLastQuestion ? `Proceeding to scoreboard in ${countdown}s...` : `Next question in ${countdown}s...`}
                </NeonText>
            )}

            {!isHost && (
                <NeonText style={styles.waiting}>
                    {hostParticipates
                        ? (results.isLastQuestion ? `Proceeding to scoreboard in ${countdown}s...` : `Next question in ${countdown}s...`)
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
        marginBottom: 30,
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

export default ResultsScreen;
