import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Image, Share, Alert, StatusBar, Platform, SafeAreaView } from 'react-native';
import NeonBackground from '../components/NeonBackground';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import HeaderIcons from '../components/lobby/HeaderIcons';
import RoomCodeBanner from '../components/lobby/RoomCodeBanner';
import CurrentGameCard from '../components/lobby/CurrentGameCard';
import PlayerList from '../components/lobby/PlayerList';
import SettingsToggle from '../components/lobby/SettingsToggle';
import ActionFooter from '../components/lobby/ActionFooter';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';


const LobbyScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { playerName } = route.params;

    // Session persistence and reconnection handling
    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Home' // If lobby is gone, go home
    });

    const fromGame = route.params.fromGame || false;
    const [selectedGame, setSelectedGame] = useState(route.params.selectedGame || route.params.room.gameType);
    const [hostParticipates, setHostParticipates] = useState(true);
    const [socketConnected, setSocketConnected] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [myReadyStatus, setMyReadyStatus] = useState(false);

    // Dynamically determine if current player is host
    const getCurrentPlayerId = () => SocketService.userId;
    const currentPlayerIsHost = () => {
        const myUid = getCurrentPlayerId();
        if (!myUid || !room) return false;
        if (room.hostUserId === myUid) return true;
        const currentPlayer = room.players.find(p => p.uid === myUid);
        return currentPlayer?.isHost || false;
    };
    const isHost = currentPlayerIsHost();

    useEffect(() => {
        const checkConnection = () => {
            const connected = SocketService.socket?.connected || false;
            setSocketConnected(connected);
        };

        checkConnection();

        const onRoomUpdated = (updatedRoom) => {
            setRoom(updatedRoom);
            if (updatedRoom.gameType) {
                setSelectedGame(updatedRoom.gameType);
            }
            const myUid = getCurrentPlayerId();
            const me = updatedRoom.players.find(p => p.uid === myUid);
            if (me) {
                setMyReadyStatus(me.isReady || false);
            }
        };

        const onPlayerKicked = () => {
            Alert.alert(
                'Kicked from Lobby',
                'You have been removed from this lobby by the host.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );
        };

        const onGameStarted = (payload) => {
            console.log('[LobbyScreen] Game started payload received:', JSON.stringify(payload, null, 2));
            
            // Robust gameType detection with fallbacks
            const { 
                gameType: rawGameType, 
                question, 
                statement, 
                prompt, 
                players, 
                hostParticipates: hostPlays, 
                gameState 
            } = payload;
            
            const gameType = rawGameType || payload.type || gameState?.type;
            const navParams = { room, playerName, hostParticipates: hostPlays, isHost, gameState, players };
            
            console.log(`[LobbyScreen] Navigating to ${gameType} (detected from ${rawGameType ? 'gameType' : (payload.type ? 'type' : 'gameState.type')}) with params:`, Object.keys(navParams));

            if (!gameType) {
                console.error('[LobbyScreen] Failed to determine gameType from payload:', payload);
                return;
            }
            if (gameType === 'trivia') {
                navigation.navigate('Question', { ...navParams, question, questionIndex: 0 });
            } else if (gameType === 'myth-or-fact') {
                navigation.navigate('MythOrFactQuestion', { ...navParams, statement, statementIndex: 0 });
            } else if (gameType === 'whos-most-likely') {
                navigation.navigate('WhosMostLikelyQuestion', { ...navParams, prompt, promptIndex: 0 });
            } else if (gameType === 'neon-tap') {
                navigation.navigate('NeonTapGame', navParams);
            } else if (gameType === 'word-rush') {
                navigation.navigate('WordRushGame', navParams);
            } else if (gameType === 'whot') {
                navigation.navigate('WhotGame', navParams);
            } else if (gameType === 'truth-or-dare') {
                navigation.navigate('OnlineTruthOrDareGame', { ...navParams, category: gameState?.category || 'normal' });
            } else if (gameType === 'never-have-i-ever') {
                navigation.navigate('OnlineNeverHaveIEver', navParams);
            } else if (gameType === 'rapid-fire') {
                navigation.navigate('OnlineRapidFire', navParams);
            } else if (gameType === 'confession-roulette') {
                navigation.navigate('ConfessionRoulette', navParams);
            } else if (gameType === 'spill-the-tea') {
                navigation.navigate('SpillTheTea', navParams);
            } else if (gameType === 'imposter') {
                navigation.navigate('Imposter', navParams);
            } else if (gameType === 'unpopular-opinions') {
                navigation.navigate('UnpopularOpinions', navParams);
            } else if (gameType === 'hot-seat') {
                navigation.navigate('HotSeat', navParams);
            } else if (gameType === 'hot-seat-mc') {
                navigation.navigate('HotSeatMC', navParams);
            } else if (gameType === 'button-mash') {
                navigation.navigate('ButtonMash', navParams);
            } else if (gameType === 'type-race') {
                navigation.navigate('TypeRace', navParams);
            } else if (gameType === 'math-blitz') {
                navigation.navigate('MathBlitz', navParams);
            } else if (gameType === 'color-rush') {
                navigation.navigate('ColorRush', navParams);
            } else if (gameType === 'tic-tac-toe') {
                navigation.navigate('TicTacToe', navParams);
            } else if (gameType === 'draw-battle') {
                navigation.navigate('DrawBattle', navParams);
            } else if (gameType === 'lie-detector') {
                navigation.navigate('LieDetector', navParams);
            } else if (gameType === 'scrabble') {
                navigation.navigate('OnlineScrabble', navParams);
            }
        };


        const onHostChanged = ({ newHostName, reason }) => {
            Alert.alert(
                '👑 Host Migrated',
                `${newHostName} is now the lobby host!`,
                [{ text: 'OK' }]
            );
        };

        SocketService.on('room-updated', onRoomUpdated);
        SocketService.on('game-started', onGameStarted);
        SocketService.on('player-kicked', onPlayerKicked);
        SocketService.on('host-changed', onHostChanged);

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
            SocketService.off('host-changed', onHostChanged);
        };
    }, [navigation, room]);

    const handleStartGame = () => {
        if (selectedGame === 'truth-or-dare') {
            navigation.navigate('OnlineTruthOrDareCategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'never-have-i-ever') {
            navigation.navigate('OnlineNHIECategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'rapid-fire') {
            navigation.navigate('OnlineRapidFireCategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'hot-seat-mc') {
            navigation.navigate('HotSeatCategory', { room, isHost, playerName });
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

    const handleKickPlayer = (playerId, name) => {
        Alert.alert(
            'Kick Player',
            `Are you sure you want to remove ${name} from the lobby?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Kick',
                    style: 'destructive',
                    onPress: () => SocketService.emit('kick-player', { roomId: room.id, playerIdToKick: playerId }),
                },
            ]
        );
    };

    const handleToggleReady = () => {
        const newReadyStatus = !myReadyStatus;
        setMyReadyStatus(newReadyStatus);
        SocketService.emit('player-ready', { roomId: room.id, isReady: newReadyStatus });
    };

    const getJoinLink = () => {
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

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#05050A" />
            <NeonBackground />

            <SafeAreaView style={styles.safeArea}>
                {/* FIXED: Header */}
                <HeaderIcons
                    onBackPress={handleLeaveLobby}
                    roomId={room.id}
                />

                {/* SCROLLABLE: Middle */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <RoomCodeBanner
                        roomCode={room.id}
                        onSharePress={handleShareLink}
                        onQRPress={() => setShowShareModal(true)}
                    />

                    <CurrentGameCard
                        gameId={selectedGame}
                        isHost={isHost}
                        onChangeGame={() =>
                            navigation.navigate('GameSelection', { room, playerName })
                        }
                    />

                    <PlayerList
                        players={room.players}
                        currentPlayerId={getCurrentPlayerId()}
                        isHost={isHost}
                        maxPlayers={8}
                        onKick={handleKickPlayer}
                    />

                    {isHost && !fromGame && (
                        <SettingsToggle
                            value={hostParticipates}
                            onValueChange={setHostParticipates}
                            label="Host Participates"
                            subtitle="Allow host to be part of the game turns"
                        />
                    )}

                    {/* Bottom spacing for scroll content */}
                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* FIXED: Bottom actions */}
                <ActionFooter
                    isHost={isHost}
                    onStartGame={handleStartGame}
                    onTournament={() =>
                        navigation.navigate('TournamentSetup', {
                            room,
                            playerName,
                            isHost: true,
                        })
                    }
                    onLeave={handleLeaveLobby}
                    onReadyUp={handleToggleReady}
                    isReady={myReadyStatus}
                />
            </SafeAreaView>

            {/* QR Code Modal */}
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
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        height: '100%',
        minHeight: '100vh',
        backgroundColor: '#05050A',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
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
});

export default LobbyScreen;
