import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import ConfettiEffect from '../components/ConfettiEffect';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import ProfileService from '../services/ProfileService';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

const ScoreboardScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, finalScores } = route.params;
    // Optional extra player list (used by Whot to include bots)
    const extraPlayers = route.params.players || [];

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost: room.players.find(p => p.uid === SocketService.userId || p.userId === SocketService.userId || p.id === SocketService.userId)?.isHost }
    });

    const [isRematchLoading, setIsRematchLoading] = useState(false);

    // Check if current player is the winner for rave lights
    const currentUserId = SocketService.userId;
    const winner = finalScores[0]; // First place
    const showRaveLights = winner?.playerId === currentUserId;
    const isWinner = winner?.playerId === currentUserId;
    const isHost = room.players.find(p => (p.uid || p.userId) === currentUserId)?.isHost || false;

    // Get current player's score and position
    const currentPlayer = room.players.find(p => (p.uid || p.userId) === currentUserId)
        || extraPlayers.find(p => (p.uid || p.userId) === currentUserId);
    const playerScore = finalScores.find(s => s.playerId === currentUserId);
    const playerRank = finalScores.findIndex(s => s.playerId === currentUserId) + 1;

    // Record game stats and play sounds
    useEffect(() => {
        // Record stats
        const recordStats = async () => {
            try {
                const points = playerScore?.score || 0;
                await ProfileService.recordGame(room.gameType, isWinner, points);
                console.log('Game stats recorded:', { gameType: room.gameType, won: isWinner, points });
            } catch (error) {
                console.error('Error recording stats:', error);
            }
        };
        recordStats();

        // Play music and sounds
        if (showRaveLights) {
            SoundService.playWinner();
            SoundService.playGameOverMusic();
        } else {
            SoundService.playGameOverMusic();
        }

        return () => SoundService.stopMusic();
    }, []);

    // Listen for rematch game started
    useEffect(() => {
        const onGameStarted = (data) => {
            console.log('Rematch game started:', data);
            setIsRematchLoading(false);

            // Robust gameType detection with fallbacks
            const { 
                gameType: rawGameType, 
                question, 
                statement, 
                prompt, 
                players, 
                hostParticipates: hostPlays, 
                gameState 
            } = data;
            
            const gameType = rawGameType || data.type || gameState?.type;
            const navParams = { ...data, room, hostParticipates: hostPlays, isHost, gameState, players };
            
            if (!gameType) {
                console.error('[ScoreboardScreen] Failed to determine gameType from payload:', data);
                return;
            }

            if (gameType === 'trivia') {
                navigation.replace('Question', { ...navParams, question, questionIndex: 0 });
            } else if (gameType === 'myth-or-fact') {
                navigation.replace('MythOrFactQuestion', { ...navParams, statement, statementIndex: 0 });
            } else if (gameType === 'whos-most-likely') {
                navigation.replace('WhosMostLikelyQuestion', {
                    ...navParams,
                    prompt: null,
                    promptIndex: null,
                    totalPrompts: gameState?.totalPrompts || null,
                });
            } else if (gameType === 'neon-tap') {
                navigation.replace('NeonTapGame', navParams);
            } else if (gameType === 'word-rush') {
                navigation.replace('WordRushGame', navParams);
            } else if (gameType === 'whot') {
                navigation.replace('WhotGame', navParams);
            } else if (gameType === 'truth-or-dare') {
                navigation.replace('OnlineTruthOrDareGame', { ...navParams, category: gameState?.category || 'normal' });
            } else if (gameType === 'never-have-i-ever') {
                navigation.replace('OnlineNeverHaveIEver', navParams);
            } else if (gameType === 'confession-roulette') {
                navigation.replace('ConfessionRoulette', navParams);
            } else if (gameType === 'spill-the-tea') {
                navigation.replace('SpillTheTea', navParams);
            } else if (gameType === 'imposter') {
                navigation.replace('Imposter', navParams);
            } else if (gameType === 'unpopular-opinions') {
                navigation.replace('UnpopularOpinions', navParams);
            } else if (gameType === 'hot-seat') {
                navigation.replace('HotSeat', navParams);
            } else if (gameType === 'hot-seat-mc') {
                navigation.replace('HotSeatMC', navParams);
            } else if (gameType === 'button-mash') {
                navigation.replace('ButtonMash', navParams);
            } else if (gameType === 'type-race') {
                navigation.replace('TypeRace', navParams);
            } else if (gameType === 'math-blitz') {
                navigation.replace('MathBlitz', navParams);
            } else if (gameType === 'color-rush') {
                navigation.replace('ColorRush', navParams);
            } else if (gameType === 'tic-tac-toe') {
                navigation.replace('TicTacToe', navParams);
            } else if (gameType === 'draw-battle') {
                navigation.replace('DrawBattle', navParams);
            } else if (gameType === 'scrabble') {
                navigation.replace('OnlineScrabble', navParams);
            }
        };

        SocketService.on('game-started', onGameStarted);
        return () => SocketService.off('game-started', onGameStarted);
    }, [navigation, room, isHost]);

    const getPlayerName = (playerId) => {
        if (playerId === 'ai-player') return 'Rave AI';
        // Check extra players list first (includes bots from Whot)
        const extraPlayer = extraPlayers.find(p => p.uid === playerId || p.userId === playerId || p.id === playerId);
        if (extraPlayer) return extraPlayer.name;
        const player = room.players.find(p => p.uid === playerId || p.id === playerId);
        return player?.name || 'Unknown';
    };

    const handleRematch = () => {
        console.log('Starting rematch for game:', room.gameType);
        setIsRematchLoading(true);

        // Emit start-game event with the same game type
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: room.gameType,
            hostParticipates: true // Default to host participates for rematch
        });
    };

    const handleBackToLobby = () => {
        try {
            if (isHost) {
                // Host goes back to game selection
                navigation.navigate('GameSelection', {
                    room,
                    playerName: currentPlayer?.name
                });
            } else {
                // Participants go to lobby with fromGame flag
                navigation.navigate('Lobby', {
                    room,
                    isHost: false,
                    playerName: currentPlayer?.name,
                    selectedGame: room.gameType,
                    fromGame: true
                });
            }
        } catch (e) {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
    };

    const renderScore = ({ item, index }) => {
        const isWinner = index === 0;
        const hasPenalty = item.score > 0 && item.penaltyCards !== undefined;

        return (
            <View style={[styles.scoreRow, isWinner && styles.winnerRow]}>
                <View style={styles.rankContainer}>
                    <NeonText size={24} weight="bold" color={isWinner ? COLORS.limeGlow : COLORS.white}>
                        #{index + 1}
                    </NeonText>
                </View>
                <View style={styles.playerInfo}>
                    <NeonText size={20} weight="bold">
                        {getPlayerName(item.playerId)} {isWinner ? '🏆' : ''}
                    </NeonText>
                    {hasPenalty && (
                        <NeonText size={12} color={COLORS.textMuted}>
                            {item.penaltyCards} card{item.penaltyCards !== 1 ? 's' : ''} remaining
                        </NeonText>
                    )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                        {`${item.score} pts`}
                    </NeonText>
                    {hasPenalty && (
                        <NeonText size={11} color={COLORS.hotPink}>penalty</NeonText>
                    )}
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showMuteButton showBackButton>
            <ConfettiEffect show={isWinner} pieceCount={60} />
            <RaveLights trigger={showRaveLights} intensity="high" duration={3000} />
            <View style={styles.header}>
                <NeonText size={36} weight="bold" glow style={styles.title}>
                    GAME OVER
                </NeonText>
                {finalScores.length > 0 && (
                    <NeonText size={20} color={COLORS.limeGlow} style={styles.winner}>
                        Winner: {getPlayerName(finalScores[0].playerId)}!
                    </NeonText>
                )}
            </View>

            <NeonText size={18} style={styles.sectionTitle}>FINAL SCORES</NeonText>

            <FlatList
                data={finalScores}
                keyExtractor={item => item.playerId}
                renderItem={renderScore}
                contentContainerStyle={styles.list}
            />

            {isHost && (
                <NeonButton
                    title={isRematchLoading ? "STARTING..." : "🔄 REMATCH"}
                    onPress={handleRematch}
                    disabled={isRematchLoading}
                    style={styles.rematchButton}
                />
            )}

            <NeonButton
                title="BACK TO LOBBY"
                onPress={handleBackToLobby}
                variant="secondary"
                style={styles.backButton}
            />
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        letterSpacing: 3,
        marginBottom: 15,
    },
    winner: {
        letterSpacing: 1,
    },
    sectionTitle: {
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    list: {
        paddingBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    winnerRow: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
    },
    playerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    rematchButton: {
        marginTop: 20,
    },
    backButton: {
        marginTop: 10,
    }
});

export default ScoreboardScreen;
