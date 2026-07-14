import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import ThemeBackground from '../components/ThemeBackground';
import MuteButton from '../components/MuteButton';
import NeonText from '../components/NeonText';
import SocketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { navigateToGame } from '../utils/gameNavigation';
import { STORAGE_KEYS } from '../constants/storage';
import GlassView from '../components/GlassView';

const JoinScreen = ({ navigation, route }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { user } = useAuth();
    const [name, setName] = useState(route.params?.playerName || '');
    const [code, setCode] = useState(route.params?.roomCode || '');
    const avatar = route.params?.avatar;
    const avatarColor = route.params?.avatarColor;

    // Pulse animation stored in a ref so it can be stopped on unmount.
    // The previous pattern (.start(() => pulse())) was recursive with no escape,
    // causing warnings when the component unmounted mid-animation.
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseLoopRef = useRef(null);

    useEffect(() => {
        pulseLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        );
        pulseLoopRef.current.start();

        return () => {
            // Stop animation on unmount to prevent updates on unmounted component
            if (pulseLoopRef.current) {
                pulseLoopRef.current.stop();
                pulseLoopRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (route.params?.isRejoining && name && code) {
            const timer = setTimeout(() => {
                handleJoin();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [route.params?.isRejoining]);

    const handleJoin = () => {
        if (!name || !code) {
            Alert.alert("Missing Info", "Please enter your name and a room code.");
            return;
        }

        SocketService.emit('join-room', {
            roomId: code.toUpperCase(),
            playerName: name,
            avatar,
            avatarColor,
            userId: user?.id
        });
    };

    useEffect(() => {
        // roomRef stores the room snapshot from room-joined so the
        // game-state-sync handler (which may fire ~50ms later) can use it.
        const roomRef = { current: null };
        const syncTimeoutRef = { current: null };

        /**
         * Navigate directly to the active game screen.
         * One-shot: clears roomRef after navigating so that a late game-state-sync
         * rebroadcast cannot trigger a second navigation.
         */
        const goToGame = (room, gameState = null) => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }
            // Clear before navigating — onGameStateSync checks this ref as its guard.
            // Setting it to null here makes every subsequent call a no-op.
            roomRef.current = null;
            const myUid = user?.id;
            const isHost = room?.players?.find(p => (p.uid || p.userId) === myUid)?.isHost || false;
            navigateToGame(navigation, room, gameState, name, isHost);
        };

        const onJoined = async (room) => {
            // Save session checkpoint so HomeScreen can show rejoin modal on next open
            try {
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify({
                    roomId: room.id,
                    playerName: name,
                    avatar,
                    avatarColor,
                    userId: user?.id,
                    gameType: room.gameType,
                    savedAt: Date.now(),
                }));
            } catch (_) { /* storage errors are non-fatal */ }

            if (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER') {
                // Game is in progress — store room and wait briefly for game-state-sync
                console.log('[JoinScreen] Rejoining mid-game:', room.gameType);
                roomRef.current = room;

                // Fallback: if game-state-sync doesn't arrive within 2s, navigate anyway
                syncTimeoutRef.current = setTimeout(() => {
                    console.log('[JoinScreen] game-state-sync timeout — navigating with room data only');
                    goToGame(roomRef.current, null);
                }, 2000);
            } else {
                // Room is in LOBBY — standard flow.
                // Derive isHost from the player list, not hardcoded false.
                // A host who re-enters via JoinScreen should still see the host UI.
                const myUid = user?.id;
                const resolvedIsHost = room?.players?.find(
                    p => (p.uid || p.userId) === myUid
                )?.isHost || false;

                navigation.navigate('Lobby', {
                    room,
                    isHost: resolvedIsHost,
                    playerName: name,
                    selectedGame: room.gameType,
                });
            }
        };

        const onGameStateSync = ({ gameState, gameType }) => {
            // Only navigate if we are actually waiting for a mid-game rejoin.
            // Previously checked syncTimeoutRef.current too, but that is null
            // once the fallback timeout fires — causing late game-state-sync
            // packets to be silently dropped. roomRef.current is the correct guard.
            if (roomRef.current) {
                console.log('[JoinScreen] game-state-sync received — navigating to game');
                goToGame(roomRef.current, gameState);
            }
        };

        const onError = ({ message }) => {
            Alert.alert("Error", message);
        };

        SocketService.on('room-joined', onJoined);
        SocketService.on('game-state-sync', onGameStateSync);
        SocketService.on('error', onError);

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            SocketService.off('room-joined', onJoined);
            SocketService.off('game-state-sync', onGameStateSync);
            SocketService.off('error', onError);
        };
    }, [navigation, name, user?.id]);


    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#05050A" />
            <ThemeBackground />

            <SafeAreaView style={styles.safeArea}>
                {/* Header — same pattern as LobbyScreen */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <MuteButton style={styles.muteOverride} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Title Section */}
                        <View style={styles.titleSection}>
                            <NeonText size={42} weight="bold" style={styles.title}>
                                JOIN PARTY
                            </NeonText>
                            <View style={styles.titleUnderline} />
                        </View>

                        {/* Main Card */}
                        <GlassView style={[styles.card, theme?.isGlass && { backgroundColor: 'transparent', borderWidth: 0 }]}>
                            {/* Input: Your Name */}
                            <View style={styles.inputGroup}>
                                <NeonText size={12} weight="bold" color={COLORS.neonCyan} style={styles.label}>
                                    YOUR NAME
                                </NeonText>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Feather name="user" size={18} color="#00E5FF" style={styles.inputIcon} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Guest"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Input: Room Code */}
                            <View style={styles.inputGroup}>
                                <NeonText size={12} weight="bold" color={COLORS.neonCyan} style={styles.label}>
                                    ROOM CODE
                                </NeonText>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Feather name="hash" size={18} color="#00E5FF" style={styles.inputIcon} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ABCD"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={code}
                                        onChangeText={text => setCode(text.toUpperCase())}
                                        autoCapitalize="characters"
                                        maxLength={5}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Neon "Enter Room" Button */}
                            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                                <TouchableOpacity
                                    style={styles.enterButton}
                                    onPress={handleJoin}
                                    activeOpacity={0.8}
                                >
                                    <NeonText size={20} weight="bold" color="#05050A">
                                        Enter Room
                                    </NeonText>
                                </TouchableOpacity>
                            </Animated.View>
                        </GlassView>

                        {/* Footer Text */}
                        <View style={styles.footerSection}>
                            <NeonText size={12} color="rgba(0, 229, 255, 0.35)" style={styles.footerText}>
                                NIGHTCLUB PROTOCOL V4.2 // ACTIVE
                            </NeonText>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    muteOverride: {
        position: 'relative',
        top: 0,
        right: 0,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        color: COLORS.white,
        letterSpacing: 4,
    },
    titleUnderline: {
        width: 60,
        height: 4,
        backgroundColor: '#00E5FF',
        marginTop: 12,
        borderRadius: 2,
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(15, 15, 26, 0.85)',
        borderRadius: 24,
        padding: 25,
        paddingVertical: 35,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        marginBottom: 10,
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        height: 58,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    iconBox: {
        width: 30,
        alignItems: 'center',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: COLORS.white,
        fontSize: 18,
        height: '100%',
        paddingLeft: 5,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
    },
    enterButton: {
        marginTop: 15,
        height: 60,
        width: '100%',
        borderRadius: 14,
        backgroundColor: '#00E5FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 15,
        elevation: 10,
    },
    footerSection: {
        marginTop: 50,
    },
    footerText: {
        letterSpacing: 3,
        textAlign: 'center',
    },
});

export default JoinScreen;
