import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Switch } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const LobbyScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { isHost, playerName } = route.params;
    const fromGame = route.params.fromGame || false;
    const [selectedGame, setSelectedGame] = useState(route.params.selectedGame || route.params.room.gameType);
    const [hostParticipates, setHostParticipates] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    useEffect(() => {
        const checkConnection = () => {
            const connected = SocketService.socket?.connected || false;
            setSocketConnected(connected);
        };

        checkConnection();

        // Music is already playing from HomeScreen - no need to start again

        const onRoomUpdated = (updatedRoom) => {
            setRoom(updatedRoom);
            if (updatedRoom.gameType) {
                setSelectedGame(updatedRoom.gameType);
            }
        };

        const onGameStarted = ({ gameType, question, statement, prompt, players, hostParticipates: hostPlays, gameState }) => {
            if (gameType === 'trivia') {
                navigation.navigate('Question', {
                    room,
                    question,
                    questionIndex: 0,
                    hostParticipates: hostPlays,
                    isHost
                });
            } else if (gameType === 'myth-or-fact') {
                navigation.navigate('MythOrFactQuestion', {
                    room,
                    statement,
                    statementIndex: 0,
                    hostParticipates: hostPlays,
                    isHost
                });
            } else if (gameType === 'whos-most-likely') {
                navigation.navigate('WhosMostLikelyQuestion', {
                    room,
                    prompt,
                    promptIndex: 0,
                    players,
                    hostParticipates: hostPlays,
                    isHost
                });
            } else if (gameType === 'neon-tap') {
                navigation.navigate('NeonTapGame', {
                    room,
                    hostParticipates: hostPlays,
                    isHost
                });
            } else if (gameType === 'word-rush') {
                navigation.navigate('WordRushGame', {
                    room,
                    hostParticipates: hostPlays,
                    isHost
                });
            } else if (gameType === 'whot') {
                navigation.navigate('WhotGame', {
                    room,
                    hostParticipates: hostPlays,
                    isHost,
                    initialGameState: gameState // Pass initial game state
                });
            }
        };

        SocketService.on('room-updated', onRoomUpdated);
        SocketService.on('game-started', onGameStarted);

        const pollInterval = setInterval(() => {
            checkConnection();
            if (SocketService.socket?.connected) {
                SocketService.emit('get-room', { roomId: room.id });
            }
        }, 2000);

        return () => {
            clearInterval(pollInterval);
            SocketService.off('room-updated', onRoomUpdated);
            SocketService.off('game-started', onGameStarted);
            // Don't stop music here - let it continue or stop when game starts
        };
    }, [navigation, room]);

    const handleStartGame = () => {
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: selectedGame,
            hostParticipates,
            category: selectedGame === 'trivia' ? 'All' : undefined
        });
    };

    const handleLeaveLobby = () => {
        SocketService.emit('leave-room', { roomId: room.id });
        navigation.navigate('Home');
    };

    const renderPlayer = ({ item }) => (
        <View style={styles.playerRow}>
            <View style={styles.avatar}>
                <NeonText size={20}>👤</NeonText>
            </View>
            <NeonText size={18} style={styles.playerName}>
                {item.name} {item.isHost ? '👑' : ''}
            </NeonText>
        </View>
    );

    return (
        <NeonContainer showMuteButton showBackButton>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>ROOM CODE</NeonText>
                <NeonText size={48} weight="bold" glow color={COLORS.neonCyan}>
                    {room.id}
                </NeonText>
                {selectedGame && (
                    <View style={styles.gameNameContainer}>
                        <NeonText size={16} color={COLORS.limeGlow}>
                            {selectedGame === 'trivia' ? '🧠 Quick Trivia' : selectedGame}
                        </NeonText>
                    </View>
                )}
            </View>

            <NeonText size={20} style={styles.sectionTitle}>PLAYERS IN LOBBY</NeonText>

            <FlatList
                data={room.players}
                keyExtractor={item => item.id}
                renderItem={renderPlayer}
                contentContainerStyle={styles.list}
            />

            {isHost && !fromGame && (
                <View style={styles.toggleContainer}>
                    <NeonText size={16}>Host Participates</NeonText>
                    <Switch
                        value={hostParticipates}
                        onValueChange={setHostParticipates}
                        trackColor={{ false: '#3e3e3e', true: COLORS.neonCyan }}
                        thumbColor={hostParticipates ? COLORS.limeGlow : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                    />
                </View>
            )}

            {isHost ? (
                <>
                    <NeonButton title="START GAME" onPress={handleStartGame} />
                    <NeonButton
                        title="LEAVE LOBBY"
                        onPress={handleLeaveLobby}
                        variant="secondary"
                        style={styles.leaveButton}
                    />
                </>
            ) : (
                <>
                    <NeonText style={styles.waiting}>Waiting for host to start...</NeonText>
                    <NeonButton
                        title="LEAVE LOBBY"
                        onPress={handleLeaveLobby}
                        variant="secondary"
                        style={styles.leaveButton}
                    />
                </>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    gameNameContainer: {
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
    },
    sectionTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    playerName: {
        color: 'white',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    waiting: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#888',
        marginTop: 20,
    },
    leaveButton: {
        marginTop: 10,
    }
});

export default LobbyScreen;
