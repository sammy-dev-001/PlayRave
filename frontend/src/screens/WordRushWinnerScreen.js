import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import ProfileService from '../services/ProfileService';
import { COLORS } from '../constants/theme';

const WordRushWinnerScreen = ({ route, navigation }) => {
    const { room, winner } = route.params;
    const currentPlayerId = SocketService.socket?.id;
    const isWinner = winner && winner === currentPlayerId;
    const noWinner = !winner; // Everyone lost

    // Play sounds, music, and record stats
    useEffect(() => {
        // Record stats
        const recordStats = async () => {
            try {
                // Word Rush doesn't have points, just win/lose
                await ProfileService.recordGame('word-rush', isWinner, isWinner ? 100 : 0);
                console.log('Word Rush stats recorded:', { won: isWinner });
            } catch (error) {
                console.error('Error recording stats:', error);
            }
        };
        recordStats();

        // Play sounds
        if (noWinner) {
            SoundService.playDefeatMusic();
        } else if (isWinner) {
            SoundService.playWinner();
            SoundService.playVictoryMusic();
        } else {
            SoundService.playDefeatMusic();
        }

        return () => SoundService.stopMusic();
    }, []);

    const getPlayerName = (playerId) => {
        if (!playerId) return 'No One';
        const player = room.players.find(p => p.id === playerId);
        return player?.name || 'Unknown';
    };

    const handleBackToLobby = () => {
        const currentPlayer = room.players.find(p => p.id === currentPlayerId);
        const isHost = currentPlayer?.isHost || false;

        if (isHost) {
            navigation.navigate('GameSelection', {
                room,
                playerName: currentPlayer?.name
            });
        } else {
            navigation.navigate('Lobby', {
                room,
                isHost: false,
                playerName: currentPlayer?.name,
                selectedGame: room.gameType,
                fromGame: true
            });
        }
    };

    return (
        <NeonContainer showBackButton>
            <RaveLights trigger={isWinner} intensity="high" duration={4000} />
            <View style={styles.container}>
                <NeonText size={36} weight="bold" glow style={styles.title}>
                    GAME OVER
                </NeonText>

                {noWinner ? (
                    <View style={[styles.winnerContainer, { borderColor: COLORS.hotPink, backgroundColor: 'rgba(255, 63, 164, 0.1)' }]}>
                        <NeonText size={24} color={COLORS.hotPink} style={styles.winnerLabel}>
                            💀 NO SURVIVORS 💀
                        </NeonText>
                        <NeonText size={36} weight="bold" color={COLORS.hotPink} glow style={styles.winnerName}>
                            EVERYONE LOST!
                        </NeonText>
                    </View>
                ) : (
                    <View style={styles.winnerContainer}>
                        <NeonText size={24} color={COLORS.limeGlow} style={styles.winnerLabel}>
                            🏆 WINNER 🏆
                        </NeonText>
                        <NeonText size={48} weight="bold" color={COLORS.limeGlow} glow style={styles.winnerName}>
                            {getPlayerName(winner)}
                        </NeonText>
                    </View>
                )}

                <NeonText size={18} style={styles.message}>
                    {noWinner ? 'Better luck next time!' : 'Last one standing wins!'}
                </NeonText>

                <NeonButton
                    title="BACK TO LOBBY"
                    onPress={handleBackToLobby}
                    style={styles.button}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        letterSpacing: 4,
        marginBottom: 40,
    },
    winnerContainer: {
        alignItems: 'center',
        marginBottom: 40,
        padding: 30,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.limeGlow,
    },
    winnerLabel: {
        marginBottom: 20,
    },
    winnerName: {
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        marginBottom: 40,
        color: '#888',
    },
    button: {
        minWidth: 200,
    }
});

export default WordRushWinnerScreen;
