import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, TextInput, Alert, ScrollView,
    Platform, StatusBar, Modal, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemeBackground from '../components/ThemeBackground';
import AvatarPicker from '../components/AvatarPicker';
import InstallAppModal from '../components/InstallAppModal';
import LoadingOverlay from '../components/LoadingOverlay';
import TopHeader from '../components/home/TopHeader';
import ProfileSection from '../components/home/ProfileSection';
import OnlineLobbyCard from '../components/home/OnlineLobbyCard';
import SecondaryModes from '../components/home/SecondaryModes';
import ProfileStatsBar from '../components/home/ProfileStatsBar';
import NeonText from '../components/NeonText';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { useTheme } from '../context/ThemeContext';
import { getRandomAvatar, getRandomColor } from '../data/avatars';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { STORAGE_KEYS } from '../constants/storage';

// 30 minutes: covers long-running games (Whot, Scrabble, Trivia tournament).
// The backend keeps the player slot alive during this window via grace timer.
const SESSION_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Ping the server to check if a room still exists.
 * Module-level (not inside the component) because it only uses SocketService,
 * a module singleton — no props, state, or hooks required.
 * Keeping it outside avoids a new function reference per render and prevents
 * accidental stale-closure bugs if state access were ever added.
 *
 * @param {string} roomId
 * @returns {Promise<boolean>}
 */
function checkRoomExists(roomId) {
    return new Promise((resolve) => {
        if (!SocketService.isConnected()) {
            // No socket yet — show modal optimistically.
            // JoinScreen will handle "Room not found" gracefully if needed.
            resolve(true);
            return;
        }

        let settled = false;

        const onResult = ({ roomId: returnedId, exists }) => {
            // Only accept the response meant for this specific room query.
            if (returnedId !== roomId) return;
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            // Remove listener on success path — matches timeout branch cleanup.
            SocketService.off('check-room-result', onResult);
            resolve(!!exists);
        };

        // Timeout: if server doesn't respond in 3s, fail-safe to false.
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            SocketService.off('check-room-result', onResult);
            resolve(false);
        }, 3000);

        SocketService.on('check-room-result', onResult);
        SocketService.emit('check-room', { roomId });
    });
}

const HomeScreen = ({ navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { user, isAuthenticated, isGuest, updateUsername, isLoading: isAuthLoading } = useAuth();
    const { setPlayer } = useGame();
    const [name, setName] = useState('');
    const [musicStarted, setMusicStarted] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
    const [selectedColor, setSelectedColor] = useState(getRandomColor());
    const [loading, setLoading] = useState(false);

    // CoD-style rejoin modal state
    const [rejoinSession, setRejoinSession] = useState(null);
    const [showRejoinModal, setShowRejoinModal] = useState(false);

    // Reactive Sync for name input (autofill on hydration)
    useEffect(() => {
        if (user && user.username && user.username !== 'Guest') {
            console.log('[HOME] Autofilling name input with:', user.username);
            setName(user.username);
        }
    }, [user]);

    useEffect(() => {
        if (isAuthenticated && user?.avatar) {
            setSelectedAvatar(user.avatar);
        }
        if (isAuthenticated && user?.avatarColor) {
            setSelectedColor(user.avatarColor);
        }
    }, [isAuthenticated, user]);

    // Start music on user interaction (required for web audio policy)
    const startMusicOnInteraction = async () => {
        if (musicStarted) return;
        try {
            await SoundService.init();
            await SoundService.playLobbyMusic();
            setMusicStarted(true);
        } catch (error) {
            console.error('Error starting music:', error);
        }
    };

    const handleAvatarSelect = ({ avatar, color }) => {
        setSelectedAvatar(avatar);
        setSelectedColor(color);
    };

    const handleCreate = async () => {
        if (!name) {
            Alert.alert('Enter Name', 'Please enter a name to host.');
            return;
        }
        await startMusicOnInteraction();
        setLoading(true);
        console.log('[HOME] Updating stored profile name to:', name);
        if (updateUsername) updateUsername(name);

        SocketService.emit('create-room', {
            playerName: name,
            avatar: selectedAvatar,
            avatarColor: selectedColor,
            userId: user?.id
        });
        setTimeout(() => setLoading(false), 10000);
    };

    const handleJoin = async () => {
        await startMusicOnInteraction();
        console.log('[HOME] Updating stored profile name to:', name);
        if (updateUsername) updateUsername(name);

        navigation.navigate('Join', {
            playerName: name,
            avatar: selectedAvatar,
            avatarColor: selectedColor,
        });
    };

    const handleLocalParty = async () => {
        await startMusicOnInteraction();
        navigation.navigate('LocalPartySetup');
    };

    // Initialize SoundService
    useEffect(() => {
        SoundService.init();
    }, []);

    // ─── CoD-Style Rejoin Session Check ───────────────────────────────────────
    // checkRoomExists is a module-level function (above the component).
    // On mount, check AsyncStorage for a recent session.
    // If found AND the room still exists on the server, show the rejoin modal.
    useEffect(() => {
        const checkSession = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION);
                if (!raw) return;

                const session = JSON.parse(raw);
                const age = Date.now() - (session.savedAt || 0);

                if (age >= SESSION_MAX_AGE_MS || !session.roomId) {
                    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
                    return;
                }

                const roomStillExists = await checkRoomExists(session.roomId);
                if (!roomStillExists) {
                    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
                    return;
                }

                setRejoinSession(session);
                setShowRejoinModal(true);
            } catch (_) {
                // Storage or network error — non-fatal, just don't show modal
            }
        };
        checkSession();
    }, []);
    // ──────────────────────────────────────────────────────────────────────────────

    const handleRejoin = () => {
        setShowRejoinModal(false);
        if (!rejoinSession) return;
        navigation.navigate('Join', {
            playerName: rejoinSession.playerName || name,
            roomCode: rejoinSession.roomId,
            avatar: rejoinSession.avatar || selectedAvatar,
            avatarColor: rejoinSession.avatarColor || selectedColor,
            isRejoining: true,
        });
    };

    const handleDismissRejoin = async () => {
        setShowRejoinModal(false);
        setRejoinSession(null);
        try { await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION); } catch (_) {}
    };

    // Check for deep link / join parameter (web)
    useEffect(() => {
        const checkDeepLink = () => {
            if (typeof window !== 'undefined' && window.location) {
                const params = new URLSearchParams(window.location.search);
                const joinCode = params.get('join');
                if (joinCode) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                    navigation.navigate('Join', {
                        playerName: name,
                        roomCode: joinCode,
                        avatar: selectedAvatar,
                        avatarColor: selectedColor,
                    });
                }
            }
        };
        checkDeepLink();
    }, []);

    // Listen for room-created event
    useEffect(() => {
        const onRoomCreated = (room) => {
            setLoading(false);
            navigation.navigate('GameSelection', { room, playerName: name });
        };

        SocketService.on('room-created', onRoomCreated);
        return () => {
            SocketService.off('room-created', onRoomCreated);
        };
    }, [navigation, name]);

    // Derive display values
    const displayName = name || user?.username || 'GUEST';
    const userLevel = user?.level || 1;
    const userRank = ProfileSection.getRankTitle
        ? ProfileSection.getRankTitle(userLevel)
        : 'ROOKIE';

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            <ThemeBackground />
            <LoadingOverlay visible={loading} message="Creating Party..." />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top Header */}
                <TopHeader
                    onSettingsPress={() => navigation.navigate('Settings')}
                    onProfilePress={() =>
                        navigation.navigate(user ? 'Profile' : 'Auth')
                    }
                    isAuthenticated={isAuthenticated}
                />

                {/* Profile Section */}
                <ProfileSection
                    avatar={selectedAvatar}
                    avatarColor={selectedColor}
                    userName={displayName}
                    level={userLevel}
                    rank={userRank}
                    onAvatarPress={() => setShowAvatarPicker(true)}
                    onEditPress={() =>
                        navigation.navigate(user ? 'Profile' : 'Auth')
                    }
                />

                {/* Name input for non-authenticated users */}
                {(!isAuthenticated || isGuest) && (
                    <View style={styles.nameInputWrapper}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Enter your name..."
                            placeholderTextColor={COLORS.textMuted}
                            value={name}
                            onChangeText={setName}
                            maxLength={20}
                        />
                    </View>
                )}

                {/* Online Lobby Card */}
                <OnlineLobbyCard
                    onHostPress={handleCreate}
                    onJoinPress={handleJoin}
                    disabled={loading}
                />

                {/* Secondary Modes */}
                <SecondaryModes
                    onLocalPress={handleLocalParty}
                    onLANPress={() => navigation.navigate('LANMode')}
                />

                {/* Profile & Stats Bar */}
                <ProfileStatsBar
                    onPress={() => navigation.navigate('Profile')}
                />

                {/* Bottom spacing */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* ─── CoD-Style Rejoin Modal ──────────────────────────────── */}
            <Modal
                visible={showRejoinModal}
                transparent
                animationType="fade"
                onRequestClose={handleDismissRejoin}
            >
                <View style={styles.rejoinOverlay}>
                    <View style={styles.rejoinCard}>
                        {/* Lightning bolt accent */}
                        <View style={styles.rejoinBadge}>
                            <NeonText size={32}>⚡</NeonText>
                        </View>

                        <NeonText
                            size={11}
                            color={COLORS.neonCyan}
                            weight="bold"
                            style={styles.rejoinEyebrow}
                        >
                            PREVIOUS SESSION FOUND
                        </NeonText>

                        <NeonText
                            size={24}
                            weight="bold"
                            glow
                            style={styles.rejoinTitle}
                        >
                            REJOIN GAME?
                        </NeonText>

                        <NeonText size={14} color={COLORS.textMuted} style={styles.rejoinRoom}>
                            Room: {rejoinSession?.roomId}
                        </NeonText>

                        {rejoinSession?.playerName ? (
                            <NeonText size={13} color={COLORS.textMuted} style={{ marginBottom: 28 }}>
                                Playing as: {rejoinSession.playerName}
                            </NeonText>
                        ) : null}

                        {/* Primary action */}
                        <TouchableOpacity
                            style={[styles.rejoinBtn, { backgroundColor: COLORS.neonCyan }]}
                            onPress={handleRejoin}
                            activeOpacity={0.85}
                        >
                            <NeonText size={15} weight="bold" color={COLORS.deepNightBlack}>
                                ▶  REJOIN
                            </NeonText>
                        </TouchableOpacity>

                        {/* Secondary action */}
                        <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={handleDismissRejoin}
                            activeOpacity={0.7}
                        >
                            <NeonText size={13} color={COLORS.textMuted}>
                                DISMISS
                            </NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* ──────────────────────────────────────────────────────────── */}

            {/* Avatar Picker Modal */}
            <AvatarPicker
                visible={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={handleAvatarSelect}
                currentAvatar={selectedAvatar}
            />

            {/* iOS Install App Prompt */}
            <InstallAppModal />
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    rootContainer: {
        flex: 1,
        ...Platform.select({
            web: { height: '100%', minHeight: '100vh' },
            default: { flex: 1 },
        }),
        backgroundColor: COLORS.deepNightBlack,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
        paddingBottom: 40,
    },
    nameInputWrapper: {
        paddingHorizontal: 40,
        marginBottom: 20,
    },
    nameInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: COLORS.white,
        fontSize: 15,
        textAlign: 'center',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' })
    },
    bottomSpacer: {
        height: 30,
    },

    // ── Rejoin Modal ──────────────────────────────────────────────────────────
    rejoinOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    rejoinCard: {
        backgroundColor: '#0d0d1a',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        paddingVertical: 36,
        paddingHorizontal: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        // Subtle glow
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },
    rejoinBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 240, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    rejoinEyebrow: {
        letterSpacing: 2,
        marginBottom: 8,
    },
    rejoinTitle: {
        marginBottom: 10,
    },
    rejoinRoom: {
        marginBottom: 6,
        letterSpacing: 1,
    },
    rejoinBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    dismissBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
});

export default HomeScreen;
