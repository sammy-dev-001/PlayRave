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
    Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
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
        <NeonContainer hideBackground showBackButton rootStyle={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <SafeAreaView style={styles.container}>
                    {/* Radial Glow Effects */}
                    <View style={styles.glowTopLeft} pointerEvents="none" />
                    <View style={styles.glowBottomRight} pointerEvents="none" />

                    {/* Header Spacer for MuteButton/BackButton in NeonContainer */}
                    <View style={styles.headerSpacer} />

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
                                        placeholderTextColor="#6B7280"
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
                                        placeholderTextColor="#6B7280"
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
                                    <View style={styles.enterButtonInner}>
                                        <NeonText size={20} weight="bold" color="#05050A">
                                            Enter Room
                                        </NeonText>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        {/* Footer Text */}
                        <View style={styles.footerSection}>
                            <NeonText size={12} color="#4B5563" style={styles.footerText}>
                                NIGHTCLUB PROTOCOL V4.2 // ACTIVE
                            </NeonText>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    root: {
        backgroundColor: '#05050A',
        paddingHorizontal: 0,
        paddingTop: 0,
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden',
    },
    glowTopLeft: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(177, 78, 255, 0.08)',
    },
    glowBottomRight: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(0, 248, 255, 0.05)',
    },
    headerSpacer: {
        height: 60,
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        color: COLORS.white,
        letterSpacing: 2,
    },
    titleUnderline: {
        width: 80,
        height: 4,
        backgroundColor: '#00E5FF',
        marginTop: 10,
        borderRadius: 2,
    },
    card: {
        width: '100%',
        backgroundColor: '#0F0F1A',
        borderRadius: 30,
        padding: 25,
        paddingVertical: 35,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
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
        backgroundColor: '#1A1A2E',
        borderRadius: 15,
        height: 60,
        paddingHorizontal: 15,
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
        height: 65,
        width: '100%',
        borderRadius: 15,
        backgroundColor: '#00E5FF',
        alignItems: 'center',
        justifyContent: 'center',
        // Cyan Neon Glow
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 15,
        elevation: 10,
    },
    enterButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    footerSection: {
        marginTop: 80,
    },
    footerText: {
        letterSpacing: 3,
        textAlign: 'center',
    }
});

export default JoinScreen;
