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
import { Feather, Ionicons } from '@expo/vector-icons';
import NeonBackground from '../components/NeonBackground';
import MuteButton from '../components/MuteButton';
import NeonText from '../components/NeonText';
import SocketService from '../services/socket';
import { COLORS, SHADOWS } from '../constants/theme';

const JoinScreen = ({ navigation, route }) => {
    const [name, setName] = useState(route.params?.playerName || '');
    const [code, setCode] = useState(route.params?.roomCode || '');
    const avatar = route.params?.avatar;
    const avatarColor = route.params?.avatarColor;

    // Pulse animation for the button
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();
    }, []);

    const handleJoin = () => {
        if (!name || !code) {
            Alert.alert("Missing Info", "Please enter your name and a room code.");
            return;
        }

        SocketService.emit('join-room', {
            roomId: code.toUpperCase(),
            playerName: name,
            avatar,
            avatarColor
        });
    };

    useEffect(() => {
        const onJoined = (room) => {
            navigation.navigate('Lobby', { room, isHost: false, playerName: name, selectedGame: room.gameType });
        };

        const onError = ({ message }) => {
            Alert.alert("Error", message);
        };

        SocketService.on('room-joined', onJoined);
        SocketService.on('error', onError);

        return () => {
            SocketService.off('room-joined', onJoined);
            SocketService.off('error', onError);
        };
    }, [navigation, name]);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#05050A" />
            <NeonBackground />

            <SafeAreaView style={styles.safeArea}>
                {/* Header — same pattern as LobbyScreen */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
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
                        <View style={styles.card}>
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
                                        placeholderTextColor="#FFFFFF"
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
                                        placeholderTextColor="#FFFFFF"
                                        value={code}
                                        onChangeText={text => setCode(text.toUpperCase())}
                                        autoCapitalize="characters"
                                        maxLength={4}
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
                        </View>

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

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        // Bug 7: Removed height:'100%' and minHeight:'100vh' — 100vh includes the browser
        // URL bar on mobile, clipping bottom content. flex:1 fills parent correctly.
        // paddingTop handled by the SafeAreaView already wrapping content in JSX.
        backgroundColor: '#05050A',
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        outlineStyle: 'none',
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
