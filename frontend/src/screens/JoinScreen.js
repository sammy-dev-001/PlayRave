import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS, FONTS } from '../constants/theme';

const JoinScreen = ({ navigation, route }) => {
    const [name, setName] = useState(route.params?.playerName || '');
    const [code, setCode] = useState(route.params?.roomCode || '');

    const handleJoin = () => {
        if (!name || !code) {
            Alert.alert("Missing Info", "Please enter your name and a room code.");
            return;
        }

        SocketService.emit('join-room', { roomId: code.toUpperCase(), playerName: name });
        // Listen for success/fail in App or Manager, but for now we assume success triggers event
        // Ideally we wait for an ack, but Socket.io generic emit doesn't wait. Use listeners.
    };

    React.useEffect(() => {
        const onJoined = (room) => {
            console.log('Room joined event received:', room);
            navigation.navigate('Lobby', { room, isHost: false, playerName: name, selectedGame: room.gameType });
        };

        const onError = ({ message }) => {
            console.log('Error received:', message);
            Alert.alert("Error", message);
        };

        console.log('Setting up join listeners');
        SocketService.on('room-joined', onJoined);
        SocketService.on('error', onError);

        return () => {
            console.log('Cleaning up join listeners');
            SocketService.off('room-joined', onJoined);
            SocketService.off('error', onError);
        };
    }, [navigation]);

    return (
        <NeonContainer style={styles.container} showBackButton>
            <NeonText size={32} weight="bold" glow style={styles.title}>JOIN PARTY</NeonText>

            <View style={styles.inputContainer}>
                <NeonText style={styles.label}>YOUR NAME</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Neon Ninja"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.inputContainer}>
                <NeonText style={styles.label}>ROOM CODE</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="ABCD"
                    placeholderTextColor="#666"
                    value={code}
                    onChangeText={text => setCode(text.toUpperCase())}
                    maxLength={4}
                    autoCapitalize="characters"
                />
            </View>

            <NeonButton title="ENTER ROOM" onPress={handleJoin} style={styles.button} />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: COLORS.neonCyan,
        fontSize: 14,
        fontWeight: '700',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        padding: 15,
        color: COLORS.white,
        fontFamily: FONTS.regular,
        fontSize: 18,
    },
    button: {
        marginTop: 20,
    }
});

export default JoinScreen;
