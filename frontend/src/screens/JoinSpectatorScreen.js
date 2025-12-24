import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Alert
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const JoinSpectatorScreen = ({ navigation }) => {
    const [roomCode, setRoomCode] = useState('');
    const [spectatorName, setSpectatorName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!roomCode.trim()) {
            Alert.alert('Error', 'Please enter a room code');
            return;
        }
        if (!spectatorName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);

        // Check if room exists
        SocketService.emit('check-room', { roomId: roomCode.trim().toUpperCase() });

        const handleRoomCheck = (data) => {
            setLoading(false);
            SocketService.off('room-exists', handleRoomCheck);
            SocketService.off('room-not-found', handleRoomNotFound);

            if (data) {
                navigation.navigate('Spectator', {
                    room: data.room || { id: roomCode.trim().toUpperCase() },
                    spectatorName: spectatorName.trim()
                });
            }
        };

        const handleRoomNotFound = () => {
            setLoading(false);
            SocketService.off('room-exists', handleRoomCheck);
            SocketService.off('room-not-found', handleRoomNotFound);
            Alert.alert('Error', 'Room not found. Please check the code and try again.');
        };

        SocketService.on('room-exists', handleRoomCheck);
        SocketService.on('room-not-found', handleRoomNotFound);

        // Timeout fallback
        setTimeout(() => {
            if (loading) {
                setLoading(false);
                // Try to join anyway as spectator in case events not implemented
                navigation.navigate('Spectator', {
                    room: { id: roomCode.trim().toUpperCase() },
                    spectatorName: spectatorName.trim()
                });
            }
        }, 3000);
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={48}>👁️</NeonText>
                    <NeonText size={28} weight="bold" glow style={styles.title}>
                        SPECTATE GAME
                    </NeonText>
                    <NeonText size={14} color="#888" style={styles.subtitle}>
                        Watch your friends play without participating!
                    </NeonText>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <NeonText size={12} color={COLORS.neonCyan} style={styles.label}>
                            YOUR NAME
                        </NeonText>
                        <TextInput
                            style={styles.input}
                            value={spectatorName}
                            onChangeText={setSpectatorName}
                            placeholder="Enter your name"
                            placeholderTextColor="#666"
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <NeonText size={12} color={COLORS.neonCyan} style={styles.label}>
                            ROOM CODE
                        </NeonText>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            value={roomCode}
                            onChangeText={(text) => setRoomCode(text.toUpperCase())}
                            placeholder="XXXX"
                            placeholderTextColor="#666"
                            maxLength={6}
                            autoCapitalize="characters"
                        />
                    </View>

                    <NeonButton
                        title={loading ? "CONNECTING..." : "👁️ START WATCHING"}
                        onPress={handleJoin}
                        disabled={loading}
                        style={styles.joinBtn}
                    />
                </View>

                <View style={styles.info}>
                    <NeonText size={12} color="#666">
                        💡 As a spectator you can:
                    </NeonText>
                    <NeonText size={12} color="#888">
                        • Watch the game in real-time
                    </NeonText>
                    <NeonText size={12} color="#888">
                        • See player scores and answers
                    </NeonText>
                    <NeonText size={12} color="#888">
                        • Chat with other spectators
                    </NeonText>
                    <NeonText size={12} color="#888">
                        • Send emoji reactions
                    </NeonText>
                </View>
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        marginTop: 15,
    },
    subtitle: {
        marginTop: 10,
        textAlign: 'center',
    },
    form: {
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    codeInput: {
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 10,
        fontWeight: 'bold',
    },
    joinBtn: {
        marginTop: 10,
    },
    info: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    }
});

export default JoinSpectatorScreen;
