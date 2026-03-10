import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, ScrollView, Platform, StatusBar } from 'react-native';
import NeonBackground from '../components/NeonBackground';
import AvatarPicker from '../components/AvatarPicker';
import InstallAppModal from '../components/InstallAppModal';
import LoadingOverlay from '../components/LoadingOverlay';
import TopHeader from '../components/home/TopHeader';
import ProfileSection from '../components/home/ProfileSection';
import OnlineLobbyCard from '../components/home/OnlineLobbyCard';
import SecondaryModes from '../components/home/SecondaryModes';
import ProfileStatsBar from '../components/home/ProfileStatsBar';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';
import { getRandomAvatar, getRandomColor } from '../data/avatars';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

const HomeScreen = ({ navigation }) => {
    const { user, isAuthenticated, isGuest } = useAuth();
    const { setPlayer } = useGame();
    const [name, setName] = useState('');
    const [musicStarted, setMusicStarted] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
    const [selectedColor, setSelectedColor] = useState(getRandomColor());
    const [hasShownAuthModal, setHasShownAuthModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fix: Reactive Sync for name input (autofill on hydration)
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
        if (useAuth().updateUsername) useAuth().updateUsername(name);
        
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
        if (useAuth().updateUsername) useAuth().updateUsername(name);

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

    // Check for deep link / join parameter
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

    // Show auth modal on first load if not authenticated
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isAuthenticated && !hasShownAuthModal) {
                setHasShownAuthModal(true);
                navigation.navigate('Auth');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Derive display values
    const displayName = name || user?.username || 'GUEST';
    const userLevel = user?.level || 1;
    const userRank = ProfileSection.getRankTitle
        ? ProfileSection.getRankTitle(userLevel)
        : 'ROOKIE';

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNightBlack} />
            <NeonBackground />
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
                        navigation.navigate(isAuthenticated ? 'Profile' : 'Auth')
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
                        navigation.navigate(isAuthenticated ? 'Profile' : 'Auth')
                    }
                />

                {/* Hidden TextInput for name (preserves name-entry for non-authenticated users) */}
                {(!isAuthenticated || isGuest) && (
                    <View style={styles.nameInputWrapper}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Enter your name..."
                            placeholderTextColor="#666"
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

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        height: '100%',
        minHeight: '100vh',
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
    },
    bottomSpacer: {
        height: 30,
    },
});

export default HomeScreen;
