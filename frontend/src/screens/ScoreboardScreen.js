import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import ConfettiEffect from '../components/ConfettiEffect';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import ProfileService from '../services/ProfileService';
import { COLORS } from '../constants/theme';

const ScoreboardScreen = ({ route, navigation }) => {
    const { room, finalScores } = route.params;
    const [isRematchLoading, setIsRematchLoading] = useState(false);

    // Check if current player is the winner for rave lights
    const currentPlayerId = SocketService.socket?.id;
    const winner = finalScores[0]; // First place
    const showRaveLights = winner?.playerId === currentPlayerId;
    const currentUserId = SocketService.socket?.id;
    const currentPlayer = room.players.find(p => p.id === currentUserId);
    const isHost = currentPlayer?.isHost || false;

    // Get current player's score and position
    const playerScore = finalScores.find(s => s.playerId === currentPlayerId);
    const playerRank = finalScores.findIndex(s => s.playerId === currentPlayerId) + 1;
    const isWinner = playerRank === 1;

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

            // Navigate based on game type
            if (data.gameType === 'trivia') {
                navigation.replace('Question', {
                    room,
                    question: data.question,
                    questionIndex: 0,
                    hostParticipates: data.hostParticipates,
                    isHost
                });
            } else if (data.gameType === 'myth-or-fact') {
                navigation.replace('MythOrFactQuestion', {
                    room,
                    statement: data.statement,
                    hostParticipates: data.hostParticipates,
                    isHost
                });
            } else if (data.gameType === 'whos-most-likely') {
                navigation.replace('WhosMostLikelyQuestion', {
                    room,
                    prompt: data.prompt,
                    players: data.players,
                    hostParticipates: data.hostParticipates,
                    isHost
                });
            } else if (data.gameType === 'neon-tap') {
                navigation.replace('NeonTapGame', {
                    room,
                    hostParticipates: data.hostParticipates,
                    isHost
                });
            } else if (data.gameType === 'word-rush') {
                navigation.replace('WordRushGame', {
                    room,
                    hostParticipates: data.hostParticipates,
                    isHost
                });
            }
        };

        SocketService.on('game-started', onGameStarted);
        return () => SocketService.off('game-started', onGameStarted);
    }, [navigation, room, isHost]);

    const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
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
    };

    const renderScore = ({ item, index }) => {
        const isWinner = index === 0;

        return (
            <View style={[styles.scoreRow, isWinner && styles.winnerRow]}>
                <View style={styles.rankContainer}>
                    <NeonText size={24} weight="bold" color={isWinner ? COLORS.limeGlow : COLORS.white}>
                        #{index + 1}
                    </NeonText>
                </View>
                <View style={styles.playerInfo}>
                    <NeonText size={20} weight="bold">
                        {getPlayerName(item.playerId)} {isWinner && '👑'}
                    </NeonText>
                </View>
                <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                    {item.score}
                </NeonText>
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

const styles = StyleSheet.create({
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
