import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ConnectionStatus from '../components/ConnectionStatus';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import { COLORS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [musicStarted, setMusicStarted] = useState(false);

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

    const handleCreate = async () => {
        console.log('handleCreate called, name:', name);
        if (!name) {
            Alert.alert("Enter Name", "Please enter a name to host.");
            return;
        }
        // Start music on first interaction
        await startMusicOnInteraction();
        console.log('Emitting create-room event with playerName:', name);
        SocketService.emit('create-room', { playerName: name });
    };

    const handleJoin = async () => {
        // Start music on first interaction
        await startMusicOnInteraction();
        navigation.navigate('Join', { playerName: name });
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
                    navigation.navigate('Join', { playerName: name, roomCode: joinCode });
                }
            }
        };
        checkDeepLink();
    }, []);

    React.useEffect(() => {
        const onRoomCreated = (room) => {
            console.log('Room created event received:', room);
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

    return (
        <NeonContainer style={styles.container} showMuteButton>
            {/* Connection Status Indicator */}
            <View style={styles.connectionContainer}>
                <ConnectionStatus showLabel={true} size="small" />
            </View>

            <View style={styles.logoArea}>
                <NeonText size={42} weight="bold" glow>PLAYRAVE</NeonText>
                <NeonText size={16} color={COLORS.limeGlow} style={{ letterSpacing: 2 }}>NEON PARTY</NeonText>
            </View>

            <View style={styles.inputArea}>
                <NeonText style={{ marginBottom: 10 }}>ENTER YOUR NAME</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.actions}>
                <NeonButton title="HOST ONLINE PARTY" onPress={handleCreate} />
                <NeonButton title="JOIN ONLINE PARTY" variant="secondary" onPress={handleJoin} />
                <NeonButton
                    title="START LOCAL PARTY"
                    variant="secondary"
                    onPress={handleLocalParty}
                    style={{ marginTop: 20 }}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 20,
    },
    connectionContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    logoArea: {
        alignItems: 'center',
        marginBottom: 60,
    },
    inputArea: {
        marginBottom: 30,
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
        gap: 15,
    }
});

export default HomeScreen;
