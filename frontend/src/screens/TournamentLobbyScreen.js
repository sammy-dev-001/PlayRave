import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Animated,
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameIcon from '../components/GameIcon';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Map game IDs to their screen names
const GAME_SCREENS = {
    'trivia': 'Question',
    'would-you-rather': 'WouldYouRather',
    'whos-most-likely': 'WhosMostLikelyQuestion',
    'rapid-fire': 'OnlineRapidFire',
    'myth-or-fact': 'MythOrFactQuestion',
    'imposter': 'Imposter',
    'memory-chain': 'MemoryChain',
    'math-blitz': 'MathBlitz',
    'type-race': 'TypeRace',
    'word-rush': 'WordRushGame',
    'never-have-i-ever': 'OnlineNeverHaveIEver',
    'truth-or-dare': 'OnlineTruthOrDareGame',
};

const TournamentLobbyScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, tournament: initialTournament } = route.params;
    const [tournament, setTournament] = useState(initialTournament);
    const [currentStandings, setCurrentStandings] = useState([]);
    const [phase, setPhase] = useState('lobby'); // lobby, between_games, starting, finished
    const [countdown, setCountdown] = useState(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse animation for current game
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const handleTournamentStarted = (data) => {
            setTournament(data.tournament);
            setPhase('starting');
            startCountdownToGame(data.currentGame);
        };

        const handleNextGame = (data) => {
            setTournament(data.tournament);
            setCurrentStandings(data.currentStandings);
            setPhase('between_games');
        };

        const handleGameStarting = (data) => {
            setPhase('starting');
            startCountdownToGame(data.currentGame);
        };

        const handleTournamentFinished = (data) => {
            navigation.replace('TournamentResults', {
                room,
                playerName,
                isHost,
                tournament: data.tournament,
                champion: data.champion,
                standings: data.finalStandings
            });
        };

        SocketService.on('tournament-started', handleTournamentStarted);
        SocketService.on('tournament-next-game', handleNextGame);
        SocketService.on('tournament-game-starting', handleGameStarting);
        SocketService.on('tournament-finished', handleTournamentFinished);

        return () => {
            SocketService.off('tournament-started', handleTournamentStarted);
            SocketService.off('tournament-next-game', handleNextGame);
            SocketService.off('tournament-game-starting', handleGameStarting);
            SocketService.off('tournament-finished', handleTournamentFinished);
        };
    }, [navigation, room, playerName, isHost]);

    const startCountdownToGame = (gameId) => {
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    navigateToGame(gameId);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const navigateToGame = (gameId) => {
        const screenName = GAME_SCREENS[gameId];
        if (screenName) {
            navigation.navigate(screenName, {
                room: { ...room, tournament },
                playerName,
                isHost,
                isTournamentMode: true,
                tournamentGameIndex: tournament.currentGameIndex
            });
        }
    };

    const startTournament = () => {
        SocketService.emit('start-tournament', { roomId: room.id });
    };

    const continueToNextGame = () => {
        SocketService.emit('tournament-continue', { roomId: room.id });
    };

    const renderGamePill = (gameId, index) => {
        const isCompleted = index < tournament.currentGameIndex;
        const isCurrent = index === tournament.currentGameIndex;

        return (
            <Animated.View
                key={index}
                style={[
                    styles.gamePill,
                    isCompleted && styles.completedPill,
                    isCurrent && styles.currentPill,
                    isCurrent && { transform: [{ scale: pulseAnim }] }
                ]}
            >
                <GameIcon gameId={gameId} size={24} />
                <NeonText size={10} color={isCompleted ? COLORS.limeGlow : (isCurrent ? '#fff' : '#888')}>
                    {index + 1}
                </NeonText>
                {isCompleted && <NeonText size={10}>✓</NeonText>}
            </Animated.View>
        );
    };

    return (
        <NeonContainer>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <NeonText size={22} weight="bold" glow color={COLORS.electricPurple}>
                        🏆 {tournament.name}
                    </NeonText>
                    <NeonText size={14} color="#888">
                        Game {tournament.currentGameIndex + 1} of {tournament.games.length}
                    </NeonText>
                </View>

                {/* Game Progress */}
                <View style={styles.progressContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.progressRow}>
                            {tournament.games.map((gameId, index) => renderGamePill(gameId, index))}
                        </View>
                    </ScrollView>
                </View>

                {/* Countdown */}
                {countdown !== null && (
                    <View style={styles.countdownContainer}>
                        <NeonText size={80} weight="bold" glow color={COLORS.neonCyan}>
                            {countdown}
                        </NeonText>
                        <NeonText size={18} color="#fff">
                            Starting {tournament.games[tournament.currentGameIndex]}...
                        </NeonText>
                    </View>
                )}

                {/* Standings */}
                {currentStandings.length > 0 && (
                    <View style={styles.standingsContainer}>
                        <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                            📊 Current Standings
                        </NeonText>
                        {currentStandings.slice(0, 5).map((standing, index) => (
                            <View key={standing.player?.id} style={[
                                styles.standingRow,
                                index === 0 && styles.leaderRow
                            ]}>
                                <NeonText size={14} color={index === 0 ? COLORS.limeGlow : '#fff'}>
                                    #{standing.rank} {index === 0 ? '👑' : ''}
                                </NeonText>
                                <NeonText size={14} style={styles.playerName}>
                                    {standing.player?.name}
                                </NeonText>
                                <NeonText size={14} weight="bold" color={COLORS.neonCyan}>
                                    {standing.score} pts
                                </NeonText>
                            </View>
                        ))}
                    </View>
                )}

                {/* Lobby State */}
                {phase === 'lobby' && countdown === null && (
                    <View style={styles.lobbyContainer}>
                        <NeonText size={16} color="#888">
                            {room.players?.length || 0} players ready
                        </NeonText>
                        {isHost && (
                            <NeonButton
                                title="🚀 START TOURNAMENT"
                                onPress={startTournament}
                                style={styles.actionButton}
                            />
                        )}
                        {!isHost && (
                            <NeonText size={14} color="#888">
                                Waiting for host to start...
                            </NeonText>
                        )}
                    </View>
                )}

                {/* Between Games */}
                {phase === 'between_games' && countdown === null && (
                    <View style={styles.lobbyContainer}>
                        <NeonText size={18} weight="bold" color={COLORS.limeGlow}>
                            🎉 Game Complete!
                        </NeonText>
                        <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                            Next up: {tournament.games[tournament.currentGameIndex]}
                        </NeonText>
                        {isHost && (
                            <NeonButton
                                title="CONTINUE TO NEXT GAME →"
                                onPress={continueToNextGame}
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                )}
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        minHeight: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    progressContainer: {
        marginBottom: 25,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 10,
    },
    gamePill: {
        width: 50,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    completedPill: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    currentPill: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.2)',
    },
    countdownContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    standingsContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
    },
    standingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    leaderRow: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    playerName: {
        flex: 1,
        marginLeft: 15,
    },
    lobbyContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    actionButton: {
        marginTop: 25,
        minWidth: 250,
    },
});

export default TournamentLobbyScreen;
