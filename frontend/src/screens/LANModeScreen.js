import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import LANService from '../services/LANService';
import SocketService from '../services/socket';

const LANModeScreen = ({ navigation }) => {
    const [mode, setMode] = useState('menu'); // menu, host, join
    const [serverIP, setServerIP] = useState('');
    const [localIP, setLocalIP] = useState(null);
    const [testing, setTesting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [currentMode, setCurrentMode] = useState(null);

    useEffect(() => {
        checkCurrentMode();
        detectLocalIP();
    }, []);

    const checkCurrentMode = async () => {
        const savedUrl = await LANService.checkSavedLANServer();
        if (savedUrl) {
            setCurrentMode('LAN');
            setServerIP(savedUrl.replace('http://', '').replace(':4000', ''));
        } else {
            setCurrentMode('Online');
        }
    };

    const detectLocalIP = async () => {
        const ip = await LANService.getLocalIP();
        if (ip) setLocalIP(ip);
    };

    const handleTestConnection = async () => {
        if (!serverIP.trim()) {
            Alert.alert('Error', 'Please enter the server IP address');
            return;
        }

        const url = `http://${serverIP.trim()}:4000`;
        setTesting(true);

        try {
            const success = await LANService.testConnection(url);
            if (success) {
                setConnected(true);
                Alert.alert('Success!', 'Connected to local server. You can now join games.');
            } else {
                Alert.alert('Connection Failed', 'Could not connect to server. Make sure:\n\n1. Server is running\n2. Both devices are on same WiFi\n3. IP address is correct');
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setTesting(false);
        }
    };

    const handleEnableLAN = async () => {
        const url = `http://${serverIP.trim()}:4000`;
        try {
            await LANService.enableLANMode(url);

            // Reconnect socket with new URL
            SocketService.disconnect();
            setTimeout(() => {
                SocketService.connect();
            }, 500);

            Alert.alert(
                'LAN Mode Enabled!',
                'You are now connected to the local server. Go back to create or join a room.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const handleSwitchToOnline = async () => {
        await LANService.disableLANMode();
        SocketService.disconnect();
        setTimeout(() => {
            SocketService.connect();
        }, 500);

        Alert.alert('Online Mode', 'Switched back to online mode.');
        setCurrentMode('Online');
        setServerIP('');
        setConnected(false);
    };

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <NeonText size={24} weight="bold" glow style={styles.title}>📡 Network Mode</NeonText>

            <View style={styles.statusCard}>
                <NeonText size={14} color="#888">CURRENT MODE</NeonText>
                <NeonText size={20} weight="bold" color={currentMode === 'LAN' ? COLORS.limeGlow : COLORS.neonCyan}>
                    {currentMode === 'LAN' ? '🏠 Local Network (LAN)' : '🌐 Online'}
                </NeonText>
                {currentMode === 'LAN' && (
                    <NeonText size={12} color="#888">Server: {LANService.lanServerUrl}</NeonText>
                )}
            </View>

            <View style={styles.infoCard}>
                <NeonText size={14} weight="bold" color={COLORS.neonCyan}>🎮 LAN Mode Benefits:</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• No internet required</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• Faster response times</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• Works on same WiFi network</NeonText>
            </View>

            <NeonButton
                title="🏠 JOIN LOCAL GAME"
                onPress={() => setMode('join')}
                style={styles.menuBtn}
            />

            <NeonButton
                title="💻 HOST INFO"
                variant="secondary"
                onPress={() => setMode('host')}
                style={styles.menuBtn}
            />

            {currentMode === 'LAN' && (
                <NeonButton
                    title="🌐 SWITCH TO ONLINE"
                    variant="secondary"
                    onPress={handleSwitchToOnline}
                    style={styles.menuBtn}
                />
            )}

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <NeonText size={14} color={COLORS.neonCyan}>← Back to Home</NeonText>
            </TouchableOpacity>
        </View>
    );

    const renderHostInfo = () => (
        <View style={styles.container}>
            <NeonText size={24} weight="bold" glow style={styles.title}>💻 Hosting a Local Server</NeonText>

            <View style={styles.infoCard}>
                <NeonText size={14} weight="bold" color={COLORS.hotPink}>Requirements:</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• A computer on the same WiFi</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• Node.js installed</NeonText>
                <NeonText size={12} color="#ccc" style={styles.infoText}>• PlayRave backend code</NeonText>
            </View>

            <View style={styles.stepCard}>
                <NeonText size={14} weight="bold" color={COLORS.limeGlow}>Steps to Host:</NeonText>
                <NeonText size={12} color="#ccc" style={styles.stepText}>1. Open terminal on your computer</NeonText>
                <NeonText size={12} color="#ccc" style={styles.stepText}>2. Navigate to PlayRave/backend folder</NeonText>
                <NeonText size={12} color="#ccc" style={styles.stepText}>3. Run: <NeonText size={12} color={COLORS.neonCyan}>npm start</NeonText></NeonText>
                <NeonText size={12} color="#ccc" style={styles.stepText}>4. Note your computer's IP address</NeonText>
                <NeonText size={12} color="#ccc" style={styles.stepText}>5. Share IP with other players</NeonText>
            </View>

            {localIP && (
                <View style={styles.ipCard}>
                    <NeonText size={12} color="#888">This device's IP (if hosting):</NeonText>
                    <NeonText size={20} weight="bold" color={COLORS.limeGlow}>{localIP}</NeonText>
                </View>
            )}

            <NeonButton title="← BACK" variant="secondary" onPress={() => setMode('menu')} style={styles.backMenuBtn} />
        </View>
    );

    const renderJoin = () => (
        <View style={styles.container}>
            <NeonText size={24} weight="bold" glow style={styles.title}>🏠 Join Local Game</NeonText>

            <NeonText size={14} color="#888" style={styles.label}>Enter Host's IP Address:</NeonText>
            <View style={styles.inputRow}>
                <NeonText size={16} color="#666">http://</NeonText>
                <TextInput
                    style={styles.input}
                    placeholder="192.168.1.100"
                    placeholderTextColor="#555"
                    value={serverIP}
                    onChangeText={setServerIP}
                    keyboardType="numeric"
                />
                <NeonText size={16} color="#666">:4000</NeonText>
            </View>

            <NeonButton
                title={testing ? "TESTING..." : "TEST CONNECTION"}
                variant="secondary"
                onPress={handleTestConnection}
                disabled={testing}
                style={styles.testBtn}
            />

            {testing && <ActivityIndicator color={COLORS.neonCyan} style={{ marginTop: 15 }} />}

            {connected && (
                <View style={styles.successCard}>
                    <NeonText size={16} color={COLORS.limeGlow}>✓ Connected!</NeonText>
                    <NeonButton
                        title="ENABLE LAN MODE"
                        onPress={handleEnableLAN}
                        style={styles.enableBtn}
                    />
                </View>
            )}

            <NeonButton title="← BACK" variant="secondary" onPress={() => setMode('menu')} style={styles.backMenuBtn} />
        </View>
    );

    return (
        <NeonContainer scrollable showBackButton>
            {mode === 'menu' && renderMenu()}
            {mode === 'host' && renderHostInfo()}
            {mode === 'join' && renderJoin()}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 30, paddingHorizontal: 20 },
    menuContainer: { flex: 1, paddingTop: 30, paddingHorizontal: 20, alignItems: 'center' },
    title: { marginBottom: 25, textAlign: 'center' },
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15,
        padding: 20, width: '100%', alignItems: 'center', marginBottom: 20
    },
    infoCard: {
        backgroundColor: 'rgba(0,255,255,0.05)', borderRadius: 12,
        padding: 15, width: '100%', marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.neonCyan
    },
    infoText: { marginTop: 5, marginLeft: 10 },
    menuBtn: { width: '100%', marginBottom: 15 },
    backBtn: { marginTop: 20, padding: 15 },
    stepCard: {
        backgroundColor: 'rgba(198,255,74,0.05)', borderRadius: 12,
        padding: 15, width: '100%', marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.limeGlow
    },
    stepText: { marginTop: 8, marginLeft: 10 },
    ipCard: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
        padding: 20, width: '100%', alignItems: 'center', marginBottom: 20
    },
    label: { marginBottom: 10, alignSelf: 'flex-start' },
    inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    input: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
        padding: 15, color: '#fff', fontSize: 18, textAlign: 'center', marginHorizontal: 10
    },
    testBtn: { marginTop: 20, width: '100%' },
    successCard: {
        backgroundColor: 'rgba(198,255,74,0.1)', borderRadius: 15,
        padding: 20, width: '100%', alignItems: 'center', marginTop: 20,
        borderWidth: 2, borderColor: COLORS.limeGlow
    },
    enableBtn: { marginTop: 15, width: '100%' },
    backMenuBtn: { marginTop: 30 }
});

export default LANModeScreen;
