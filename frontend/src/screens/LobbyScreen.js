import React, { useEffect, useState, useCallback } from 'react';
import {
    View, StyleSheet, ScrollView, Modal, TouchableOpacity,
    Image, Share, Alert, StatusBar, Platform, SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ThemeBackground from '../components/ThemeBackground';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import HeaderIcons from '../components/lobby/HeaderIcons';
import RoomCodeBanner from '../components/lobby/RoomCodeBanner';
import CurrentGameCard from '../components/lobby/CurrentGameCard';
import PlayerList from '../components/lobby/PlayerList';
import SettingsToggle from '../components/lobby/SettingsToggle';
import ActionFooter from '../components/lobby/ActionFooter';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { navigateToGame } from '../utils/gameNavigation';

const LobbyScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    
    // Guard against undefined room (e.g. if navigated here from an error boundary without params)
    useEffect(() => {
        if (!route.params?.room) {
            navigation.replace('Home');
        }
    }, [navigation, route.params?.room]);

    const [room, setRoom] = useState(route.params?.room);
    const playerName = route.params?.playerName;

    if (!room) {
        return null; // Wait for the useEffect to redirect
    }

    // Session persistence and reconnection handling
    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Home',
    });

    const fromGame = route.params.fromGame || false;
    const [selectedGame, setSelectedGame] = useState(
        route.params.selectedGame || route.params.room?.gameType
    );
    const [hostParticipates, setHostParticipates] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [myReadyStatus, setMyReadyStatus] = useState(false);

    // Dynamically determine if the current player is host.
    // useMemo: only re-runs find() when room.players changes, not on every render.
    // isHost is a dep of useFocusEffect — this keeps it stable and prevents
    // unnecessary effect re-runs when unrelated state changes.
    const isHost = React.useMemo(() => {
        const myUid = SocketService.userId;
        if (!myUid || !room) return false;
        if (room.hostUserId === myUid) return true;
        return room.players?.find(p => p.uid === myUid)?.isHost || false;
    }, [room]);

    // roomRef tracks the latest room snapshot synchronously in the render body.
    // Event handlers inside useFocusEffect read from this ref so they always have
    // the current room without needing `room` (an object) in the dep array.
    // Putting an object in a dep array causes the effect to re-run on every
    // room-updated event, which re-emits get-room, creating a feedback loop.
    const roomRef = React.useRef(room);
    roomRef.current = room;

    useFocusEffect(
        useCallback(() => {
            // Request a fresh room snapshot on focus in case we missed updates
            // while the screen was backgrounded.
            if (SocketService.socket?.connected) {
                SocketService.emit('get-room', { roomId: room.id });
            }

            const onRoomUpdated = (updatedRoom) => {
                setRoom(updatedRoom);
                if (updatedRoom.gameType) {
                    setSelectedGame(updatedRoom.gameType);
                }
                const myUid = SocketService.userId;
                const me = updatedRoom.players.find(p => p.uid === myUid);
                if (me) {
                    setMyReadyStatus(me.isReady || false);
                }
            };

            const onPlayerKicked = ({ userId }) => {
                const myUid = SocketService.userId;
                if (userId && userId !== myUid) return;
                Alert.alert(
                    'Kicked from Lobby',
                    'You have been removed from this lobby by the host.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                );
            };

            // ── Shared routing via gameNavigation utility ─────────────────
            const onGameStarted = (payload) => {
                console.log('[LobbyScreen] game-started received:', payload.gameType || payload.type);
                const gameType = payload.gameType || payload.type || payload.gameState?.type;
                // Read from ref — not closed-over `room` — so we always have the
                // latest room snapshot even if the dep array doesn't include room.
                const latestRoom = roomRef.current;
                const enrichedRoom = { ...latestRoom, gameType: gameType || latestRoom.gameType };

                navigateToGame(
                    navigation,
                    enrichedRoom,
                    payload.gameState || null,
                    playerName,
                    isHost,
                    {
                        gameType,
                        hostParticipates: payload.hostParticipates,
                        question:  payload.question,
                        statement: payload.statement,
                        players:   payload.players,
                        category:  payload.category,
                    }
                );
            };
            // ─────────────────────────────────────────────────────────────

            const onHostChanged = ({ newHostName }) => {
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

            return () => {
                SocketService.off('room-updated', onRoomUpdated);
                SocketService.off('game-started', onGameStarted);
                SocketService.off('player-kicked', onPlayerKicked);
                SocketService.off('host-changed', onHostChanged);
            };
        // Deps: only stable scalars. `room` (object) intentionally excluded —
        // it changes on every room-updated event, which would cause the effect
        // to re-run and re-emit get-room, creating a self-feeding loop.
        // onGameStarted reads the latest room from roomRef instead.
        //
        // IMPORTANT: isHost MUST stay in this dep array. It controls the host UI
        // visible to the player entering the game. If removed, onGameStarted captures
        // a stale isHost value and a migrated host sees the wrong UI on game start.
        }, [navigation, room.id, playerName, isHost])
    );

    const handleStartGame = () => {
        if (selectedGame === 'truth-or-dare') {
            navigation.navigate('OnlineTruthOrDareCategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'never-have-i-ever') {
            navigation.navigate('OnlineNHIECategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'real-talk') {
            navigation.navigate('OnlineRealTalkCategory', { room, isHost, playerName });
            return;
        }
        if (selectedGame === 'hot-seat-mc' || selectedGame === 'hot-seat') {
            navigation.navigate('HotSeatCategory', { room, isHost, playerName });
            return;
        }
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: selectedGame,
            hostParticipates,
            category: selectedGame === 'trivia' ? 'All' : undefined,
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
                title: 'Join PlayRave Game',
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
            <ThemeBackground />

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
                        currentPlayerId={SocketService.userId}
                        isHost={isHost}
                        maxPlayers={20}
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
                        <NeonText size={14} color={COLORS.textMuted} style={styles.qrSubtitle}>
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

const getStyles = (COLORS) => StyleSheet.create({
    screen: {
        flex: 1,
        ...Platform.select({
            web: { height: '100%', minHeight: '100vh' },
            default: { flex: 1 },
        }),
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
    qrTitle: { marginBottom: 20 },
    qrImage: { width: 200, height: 200, marginBottom: 15 },
    qrSubtitle: { marginBottom: 20 },
    qrShareBtn: { marginBottom: 15 },
});

export default LobbyScreen;
