import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity, Dimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ConnectionStatus from '../components/ConnectionStatus';
import AvatarPicker, { AvatarDisplay } from '../components/AvatarPicker';
import InstallAppModal from '../components/InstallAppModal';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';
import { getRandomAvatar, getRandomColor } from '../data/avatars';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, isAuthenticated } = useAuth();
    const [name, setName] = useState('');
    const [musicStarted, setMusicStarted] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
    const [selectedColor, setSelectedColor] = useState(getRandomColor());
    const [hasShownAuthModal, setHasShownAuthModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-fill name if user is authenticated
    useEffect(() => {
        if (isAuthenticated && user?.username && !name) {
            setName(user.username);
        }
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
            console.log('Music started on user interaction');
        } catch (error) {
            console.error('Error starting music:', error);
        }
    };

    const handleAvatarSelect = ({ avatar, color }) => {
        setSelectedAvatar(avatar);
        setSelectedColor(color);
    };

    const handleCreate = async () => {
        console.log('handleCreate called, name:', name);
        if (!name) {
            Alert.alert("Enter Name", "Please enter a name to host.");
            return;
        }
        // Start music on first interaction
        await startMusicOnInteraction();
        setLoading(true); // Start loading
        console.log('Emitting create-room event with playerName:', name, 'avatar:', selectedAvatar);
        SocketService.emit('create-room', {
            playerName: name,
            avatar: selectedAvatar,
            avatarColor: selectedColor
        });

        // Timeout safeguard
        setTimeout(() => setLoading(false), 10000);
    };

    const handleJoin = async () => {
        // Start music on first interaction
        await startMusicOnInteraction();
        navigation.navigate('Join', {
            playerName: name,
            avatar: selectedAvatar,
            avatarColor: selectedColor
        });
    };

    const handleLocalParty = async () => {
        // Start music on first interaction
        await startMusicOnInteraction();
        navigation.navigate('LocalPartySetup');
    };

    // Initialize SoundService (no autoplay)
    useEffect(() => {
        SoundService.init();
        // Don't stop music on cleanup - let it continue during lobby
    }, []);

    // Check for deep link / join parameter in URL
    useEffect(() => {
        const checkDeepLink = () => {
            if (typeof window !== 'undefined' && window.location) {
                const params = new URLSearchParams(window.location.search);
                const joinCode = params.get('join');
                if (joinCode) {
                    console.log('Deep link detected, room code:', joinCode);
                    // Clear the URL param to prevent re-triggering
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Navigate to join screen with the room code
                    navigation.navigate('Join', {
                        playerName: name,
                        roomCode: joinCode,
                        avatar: selectedAvatar,
                        avatarColor: selectedColor
                    });
                }
            }
        };
        checkDeepLink();
    }, []);

    React.useEffect(() => {
        const onRoomCreated = (room) => {
            console.log('Room created event received:', room);
            setLoading(false); // Stop loading
            // Don't stop music - let it play during game selection/lobby
            navigation.navigate('GameSelection', { room, playerName: name });
        };

        console.log('Setting up room-created listener');
        SocketService.on('room-created', onRoomCreated);

        return () => {
            console.log('Cleaning up room-created listener');
            SocketService.off('room-created', onRoomCreated);
        };
    }, [navigation, name]);

    // Show auth modal on first load if not authenticated
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isAuthenticated && !hasShownAuthModal) {
                setHasShownAuthModal(true);
                navigation.navigate('Auth');
            }
        }, 1000); // 1 second delay for better UX

        return () => clearTimeout(timer);
    }, []); // Only run once on mount

    return (
        <NeonContainer style={styles.container} showMuteButton scrollable>
            <LoadingOverlay visible={loading} message="Creating Party..." />
            {/* Header with Connection Status, Settings, and Profile */}
            <View style={styles.headerRow}>
                <ConnectionStatus showLabel={true} size="small" />
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.settingsIcon}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <NeonText size={22}>⚙️</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate(isAuthenticated ? 'Profile' : 'Auth')}
                    >
                        <NeonText size={24}>{user?.avatar || '👤'}</NeonText>
                        {isAuthenticated && (
                            <View style={styles.levelBadge}>
                                <NeonText size={10} color="#000" weight="bold">{user?.level || 1}</NeonText>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logo */}
            <View style={styles.logoArea}>
                <NeonText size={SCREEN_WIDTH < 375 ? 36 : 42} weight="bold" glow>PLAYRAVE</NeonText>
                <NeonText size={SCREEN_WIDTH < 375 ? 14 : 16} color={COLORS.limeGlow} style={{ letterSpacing: 2 }}>NEON PARTY</NeonText>
            </View>

            {/* Input Area */}
            <View style={styles.inputArea}>
                {/* Avatar Selection */}
                <TouchableOpacity
                    style={styles.avatarSection}
                    onPress={() => setShowAvatarPicker(true)}
                >
                    <AvatarDisplay
                        avatar={selectedAvatar}
                        color={selectedColor}
                        size={SCREEN_WIDTH < 375 ? 60 : 70}
                    />
                    <NeonText size={12} color={COLORS.neonCyan} style={styles.changeAvatarText}>
                        TAP TO CHANGE
                    </NeonText>
                </TouchableOpacity>

                <NeonText style={{ marginBottom: 10 }}>ENTER YOUR NAME</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
                <View style={styles.actionSection}>
                    <NeonText size={16} weight="bold" color={COLORS.neonCyan} style={styles.sectionLabel}>ONLINE</NeonText>
                    <NeonButton title="HOST PARTY" onPress={handleCreate} icon="🎮" />
                    <NeonButton title="JOIN PARTY" variant="secondary" onPress={handleJoin} icon="🎯" />
                </View>

                <View style={styles.actionSection}>
                    <NeonText size={16} weight="bold" color={COLORS.hotPink} style={styles.sectionLabel}>LOCAL / OFFLINE</NeonText>
                    <NeonButton
                        title="LOCAL GAMES"
                        variant="primary"
                        onPress={handleLocalParty}
                        icon="🎲"
                        style={{ borderColor: COLORS.hotPink }}
                    />
                    <NeonButton
                        title="LAN MODE (No Internet)"
                        variant="secondary"
                        onPress={() => navigation.navigate('LANMode')}
                        icon="📡"
                    />
                </View>
            </View>

            {/* Profile Button */}
            <TouchableOpacity
                style={styles.profileStatsLink}
                onPress={() => navigation.navigate('Profile')}
            >
                <NeonText size={14} color={COLORS.neonCyan}>
                    📊 MY PROFILE & STATS
                </NeonText>
            </TouchableOpacity>

            {/* Spectate Button */}
            <TouchableOpacity
                style={styles.spectateButton}
                onPress={() => navigation.navigate('JoinSpectator')}
            >
                <NeonText size={14} color={COLORS.electricPurple}>
                    👁️ SPECTATE A GAME
                </NeonText>
            </TouchableOpacity>

            {/* Avatar Picker Modal */}
            <AvatarPicker
                visible={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={handleAvatarSelect}
                currentAvatar={selectedAvatar}
            />

            {/* iOS Install App Prompt */}
            <InstallAppModal />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    connectionContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    logoArea: {
        alignItems: 'center',
        marginTop: 60, // Clear absolute header
        marginBottom: 60,
    },
    inputArea: {
        marginBottom: 30,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        padding: 15,
        color: COLORS.white,
        fontSize: 18,
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        gap: 30,
        paddingHorizontal: 20,
        maxWidth: 500,
        alignSelf: 'center',
    },
    actionSection: {
        gap: 12,
        width: '100%',
    },
    sectionLabel: {
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 1,
        opacity: 0.8,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    changeAvatarText: {
        marginTop: 8,
        letterSpacing: 1,
    },
    profileButton: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    profileStatsLink: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderRadius: 20,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    levelBadge: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: COLORS.limeGlow,
        width: 18, height: 18, borderRadius: 9,
        justifyContent: 'center', alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        top: 50, left: 20, right: 20,
        zIndex: 10,
    },
    spectateButton: {
        alignItems: 'center',
        padding: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginRight: 90, // Avoid overlap with MuteButton
    },
    settingsIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;
