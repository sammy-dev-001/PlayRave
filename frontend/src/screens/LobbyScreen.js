import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Switch, Share, Modal, TouchableOpacity, Image, Linking, Platform, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import VoiceToggle from '../components/VoiceToggle';
import { COLORS } from '../constants/theme';
import GameIcon from '../components/GameIcon';

const LobbyScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { playerName } = route.params;
    const fromGame = route.params.fromGame || false;
    const [selectedGame, setSelectedGame] = useState(route.params.selectedGame || route.params.room.gameType);
    const [hostParticipates, setHostParticipates] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [myReadyStatus, setMyReadyStatus] = useState(false);

    // Dynamically determine if current player is host
    const getCurrentPlayerId = () => SocketService.socket?.id;
    const currentPlayerIsHost = () => {
        const currentId = getCurrentPlayerId();
        if (!currentId || !room) return false;

        // Check if current player matches room hostId
        if (room.hostId === currentId) return true;

        // Also check player's isHost flag in players array
        const currentPlayer = room.players.find(p => p.id === currentId);
        return currentPlayer?.isHost || false;
    };
    const isHost = currentPlayerIsHost();

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
            // Update my ready status when room updates
            const currentId = getCurrentPlayerId();
            const me = updatedRoom.players.find(p => p.id === currentId);
            if (me) {
                setMyReadyStatus(me.isReady || false);
            }
        };

        const onPlayerKicked = () => {
            Alert.alert(
                'Kicked from Lobby',
                'You have been removed from this lobby by the host.',
                [{
                    text: 'OK',
                    onPress: () => navigation.navigate('Home')
                }]
            );
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
            } else if (gameType === 'truth-or-dare') {
                navigation.navigate('OnlineTruthOrDareGame', {
                    room,
                    hostParticipates: hostPlays,
                    isHost,
                    gameState,
                    players,
                    category: gameState?.category || 'normal'
                });
            } else if (gameType === 'never-have-i-ever') {
                navigation.navigate('OnlineNeverHaveIEver', {
                    room,
                    isHost,
                    initialGameState: gameState,
                    players
                });
            } else if (gameType === 'rapid-fire') {
                navigation.navigate('OnlineRapidFire', {
                    room,
                    isHost,
                    initialGameState: gameState,
                    players
                });
            } else if (gameType === 'confession-roulette') {
                navigation.navigate('ConfessionRoulette', {
                    room,
                    playerName,
                    isHost
                });
            } else if (gameType === 'imposter') {
                navigation.navigate('Imposter', {
                    room,
                    playerName,
                    isHost
                });
            } else if (gameType === 'unpopular-opinions') {
                navigation.navigate('UnpopularOpinions', {
                    room,
                    playerName,
                    isHost
                });
            } else if (gameType === 'hot-seat') {
                navigation.navigate('HotSeat', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'button-mash') {
                navigation.navigate('ButtonMash', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'type-race') {
                navigation.navigate('TypeRace', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'math-blitz') {
                navigation.navigate('MathBlitz', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'color-rush') {
                navigation.navigate('ColorRush', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'tic-tac-toe') {
                navigation.navigate('TicTacToe', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'draw-battle') {
                navigation.navigate('DrawBattle', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'lie-detector') {
                navigation.navigate('LieDetector', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            } else if (gameType === 'scrabble') {
                navigation.navigate('OnlineScrabble', {
                    room,
                    playerName,
                    isHost,
                    gameState
                });
            }
        };

        SocketService.on('room-updated', onRoomUpdated);
        SocketService.on('game-started', onGameStarted);
        SocketService.on('player-kicked', onPlayerKicked);

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
            SocketService.off('player-kicked', onPlayerKicked);
            // Don't stop music here - let it continue or stop when game starts
        };
    }, [navigation, room]);

    const handleStartGame = () => {
        // For Truth or Dare, navigate to category selection first
        if (selectedGame === 'truth-or-dare') {
            navigation.navigate('OnlineTruthOrDareCategory', {
                room,
                isHost,
                playerName
            });
            return;
        }

        // For Never Have I Ever, navigate to category selection
        if (selectedGame === 'never-have-i') {
            navigation.navigate('OnlineNHIECategory', {
                room,
                isHost,
                playerName
            });
            return;
        }

        // For Rapid Fire, navigate to category selection
        if (selectedGame === 'rapid-fire') {
            navigation.navigate('OnlineRapidFireCategory', {
                room,
                isHost,
                playerName
            });
            return;
        }

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

    const handleKickPlayer = (playerId, playerName) => {
        Alert.alert(
            'Kick Player',
            `Are you sure you want to remove ${playerName} from the lobby?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Kick',
                    style: 'destructive',
                    onPress: () => {
                        SocketService.emit('kick-player', { roomId: room.id, playerIdToKick: playerId });
                    }
                }
            ]
        );
    };

    const handleToggleReady = () => {
        const newReadyStatus = !myReadyStatus;
        setMyReadyStatus(newReadyStatus);
        SocketService.emit('player-ready', { roomId: room.id, isReady: newReadyStatus });
    };

    // Generate join link - using the deployed URL
    const getJoinLink = () => {
        // Use the current deployed URL
        const baseUrl = 'https://play-rave.vercel.app';
        return `${baseUrl}?join=${room.id}`;
    };

    const handleShareLink = async () => {
        try {
            await Share.share({
                message: `Join my PlayRave game! 🎮\n\nRoom Code: ${room.id}\n\nOr use this link:\n${getJoinLink()}`,
                title: 'Join PlayRave Game'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const getQRCodeUrl = () => {
        const joinLink = encodeURIComponent(getJoinLink());
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${joinLink}&bgcolor=1a1a2e&color=00f0ff`;
    };

    const renderPlayer = ({ item }) => {
        const isBase64Image = item.avatar && typeof item.avatar === 'string' && item.avatar.startsWith('data:image');
        const currentPlayerId = getCurrentPlayerId();
        const isMe = item.id === currentPlayerId;

        return (
            <View style={styles.playerRow}>
                <View style={styles.avatar}>
                    {isBase64Image ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                    ) : item.avatar?.emoji ? (
                        <NeonText size={20}>{item.avatar.emoji}</NeonText>
                    ) : (
                        <NeonText size={20}>👤</NeonText>
                    )}
                </View>
                <View style={styles.playerInfo}>
                    <NeonText size={18} style={styles.playerName}>
                        {item.name} {item.isHost ? '👑' : ''} {isMe ? '(You)' : ''}
                    </NeonText>
                    {item.isReady && !item.isHost && (
                        <NeonText size={12} color={COLORS.limeGlow}>✓ Ready</NeonText>
                    )}
                </View>
                {isHost && !item.isHost && (
                    <TouchableOpacity
                        style={styles.kickButton}
                        onPress={() => handleKickPlayer(item.id, item.name)}
                    >
                        <NeonText size={12} color={COLORS.hotPink}>KICK</NeonText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <NeonContainer showMuteButton showBackButton>
            {/* QR Code Modal moved outside or kept here */}

            <FlatList
                data={room.players}
                keyExtractor={item => item.id}
                renderItem={renderPlayer}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <NeonText size={14} color={COLORS.hotPink}>ROOM CODE</NeonText>
                            <NeonText size={48} weight="bold" glow color={COLORS.neonCyan}>
                                {room.id}
                            </NeonText>
                            {selectedGame && (
                                <View style={styles.gameNameContainer}>
                                    <GameIcon gameId={selectedGame} size={24} style={{ marginRight: 8 }} />
                                    <NeonText size={16} color={COLORS.limeGlow}>
                                        {selectedGame === 'trivia' ? 'Quick Trivia' : selectedGame}
                                    </NeonText>
                                </View>
                            )}
                            {/* Share Buttons */}
                            <View style={styles.shareButtons}>
                                <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink}>
                                    <NeonText size={20}>📤</NeonText>
                                    <NeonText size={12} color={COLORS.neonCyan}>Share</NeonText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShareModal(true)}>
                                    <NeonText size={20}>📱</NeonText>
                                    <NeonText size={12} color={COLORS.neonCyan}>QR Code</NeonText>
                                </TouchableOpacity>
                                <VoiceToggle roomId={room.id} style={styles.voiceToggle} />
                            </View>
                        </View>

                        <NeonText size={20} style={styles.sectionTitle}>PLAYERS IN LOBBY</NeonText>
                    </>
                }
                ListFooterComponent={
                    <View style={{ paddingBottom: 50 }}>
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

                        {!isHost && !fromGame && (
                            <View style={styles.readyContainer}>
                                <NeonButton
                                    title={myReadyStatus ? "✓ READY" : "READY UP"}
                                    onPress={handleToggleReady}
                                    variant={myReadyStatus ? "primary" : "secondary"}
                                    style={{ backgroundColor: myReadyStatus ? COLORS.limeGlow : undefined }}
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
                    </View>
                }
            />

            <Modal
                visible={showShareModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShareModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowShareModal(false)}
                >
                    <View style={styles.qrModal}>
                        <NeonText size={20} weight="bold" glow style={styles.qrTitle}>
                            SCAN TO JOIN
                        </NeonText>
                        <Image
                            source={{ uri: getQRCodeUrl() }}
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                        <NeonText size={14} color="#888" style={styles.qrSubtitle}>
                            Room: {room.id}
                        </NeonText>
                        <NeonButton
                            title="SHARE LINK"
                            onPress={() => {
                                setShowShareModal(false);
                                handleShareLink();
                            }}
                            style={styles.qrShareBtn}
                        />
                        <TouchableOpacity onPress={() => setShowShareModal(false)}>
                            <NeonText size={14} color={COLORS.hotPink}>Close</NeonText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
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
        overflow: 'hidden',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        color: 'white',
    },
    kickButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,0,102,0.2)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    readyContainer: {
        marginBottom: 20,
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
    },
    shareButtons: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 15,
    },
    shareBtn: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        minWidth: 70,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrModal: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        width: 300,
    },
    qrTitle: {
        marginBottom: 20,
    },
    qrImage: {
        width: 200,
        height: 200,
        marginBottom: 15,
    },
    qrSubtitle: {
        marginBottom: 20,
    },
    qrShareBtn: {
        marginBottom: 15,
    },
    voiceToggle: {
        marginLeft: 5,
    },
});

export default LobbyScreen;
