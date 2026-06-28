import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated, ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import InGameOverlay from '../components/InGameOverlay';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const getModes = (COLORS) => [
    {
        id: 'confessions',
        name: 'Confessions',
        emoji: '🎰',
        tagline: 'Guess the secret',
        description: 'Everyone submits a secret story. Can you guess who wrote it?',
        color: COLORS.hotPink,
        borderColor: COLORS.hotPink,
        bg: 'rgba(255, 57, 139, 0.07)',
        glowColor: COLORS.hotPink,
        engine: 'confession-roulette'
    },
    {
        id: 'spill-the-tea',
        name: 'Spill The Tea',
        emoji: '🍵',
        tagline: 'Anonymous hot takes',
        description: 'Anonymous questions and secrets. See what the group really thinks!',
        color: COLORS.electricPurple,
        borderColor: COLORS.electricPurple,
        bg: 'rgba(148, 0, 211, 0.09)',
        glowColor: COLORS.electricPurple,
        engine: 'spill-the-tea'
    }
];

const WhispersHubScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, isHost, playerName } = route.params;
    const [selectedMode, setSelectedMode] = useState(null);
    const [starting, setStarting] = useState(false);

    // Chat State handled by InGameOverlay

    const anim0 = useRef(new Animated.Value(1)).current;
    const anim1 = useRef(new Animated.Value(1)).current;
    const cardAnims = [anim0, anim1];

    const entranceFade = useRef(new Animated.Value(0)).current;
    const entranceY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceFade, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(entranceY, { toValue: 0, friction: 7, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
    }, []);

    const handleCardPress = (mode, index) => {
        if (!isHost) return;
        Animated.sequence([
            Animated.timing(cardAnims[index], { toValue: 0.93, duration: 70, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(cardAnims[index], { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
        ]).start();
        setSelectedMode(mode.id);
    };

    useEffect(() => {
        const onGameStarted = ({ gameType, gameState, players, roomId }) => {
            if (roomId && roomId !== room.id) return;

            if (gameType === 'confession-roulette') {
                navigation.navigate('ConfessionRoulette', { room, isHost, playerName, initialGameState: gameState, players });
            } else if (gameType === 'spill-the-tea') {
                navigation.navigate('SpillTheTea', { room, isHost, playerName, initialGameState: gameState, players });
            }
        };

        // Chat received handled by InGameOverlay

        SocketService.on('game-started', onGameStarted);
        // chat-message-received handled by InGameOverlay
        return () => {
            SocketService.off('game-started', onGameStarted);
            // chat-message-received handled by InGameOverlay
        };
    }, [navigation, room, isHost, playerName]);

    const handleStartGame = () => {
        if (!selectedMode || starting) return;
        setStarting(true);

        const mode = getModes(COLORS).find(m => m.id === selectedMode);
        
        // Set the sub-game type
        SocketService.emit('set-game-type', {
            roomId: room.id,
            gameType: mode.engine
        });

        // Go back to lobby so everyone can join
        navigation.navigate('Lobby', { 
            room: { ...room, gameType: mode.engine }, 
            playerName 
        });
    };

    // Chat sending handled by InGameOverlay

    return (
        <NeonContainer showBackButton scrollable>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.header, { opacity: entranceFade, transform: [{ translateY: entranceY }] }]}>
                    <View style={styles.iconRow}>
                        <Ionicons name="lock-closed" size={30} color={COLORS.hotPink} />
                        <NeonText size={34} weight="bold" glow style={styles.title}>WHISPERS</NeonText>
                        <Ionicons name="eye-off" size={30} color={COLORS.hotPink} />
                    </View>
                    <NeonText size={14} color={COLORS.hotPink} style={styles.subtitle}>
                        {isHost ? 'Choose your anonymous poison' : 'Waiting for host to pick a mode…'}
                    </NeonText>
                </Animated.View>

                <Animated.View style={{ opacity: entranceFade }}>
                    {getModes(COLORS).map((mode, i) => {
                        const isSelected = selectedMode === mode.id;
                        return (
                            <Animated.View key={mode.id} style={{ transform: [{ scale: cardAnims[i] }], marginBottom: 16 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: isSelected ? mode.bg : 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected ? mode.borderColor : COLORS.surfaceLight,
                                            borderWidth: isSelected ? 3 : 2,
                                            shadowColor: isSelected ? mode.glowColor : 'transparent',
                                        },
                                    ]}
                                    onPress={() => handleCardPress(mode, i)}
                                    activeOpacity={isHost ? 0.78 : 1}
                                    disabled={!isHost}
                                >
                                    {isSelected && (
                                        <View style={[styles.checkBadge, { backgroundColor: mode.color }]}>
                                            <Ionicons name="checkmark" size={13} color="#000" />
                                        </View>
                                    )}
                                    <NeonText size={50} style={styles.emoji}>{mode.emoji}</NeonText>
                                    <View style={styles.cardText}>
                                        <NeonText size={24} weight="bold" color={isSelected ? mode.color : COLORS.white} glow={isSelected}>{mode.name}</NeonText>
                                        <View style={[styles.taglinePill, { borderColor: mode.color }]}>
                                            <NeonText size={12} color={mode.color} style={{ fontStyle: 'italic' }}>{mode.tagline}</NeonText>
                                        </View>
                                        <NeonText size={13} color="#777" style={styles.cardDesc}>{mode.description}</NeonText>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </Animated.View>

                {isHost ? (
                    <View style={styles.startSection}>
                        <NeonButton
                            title={starting ? 'STARTING…' : 'REVEAL THE SECRETS 🤫'}
                            onPress={handleStartGame}
                            disabled={!selectedMode || starting}
                        />
                    </View>
                ) : (
                    <View style={styles.waitingContainer}>
                        <Ionicons name="hourglass-outline" size={36} color={COLORS.electricPurple} />
                        <NeonText size={15} color="#777" style={{ marginTop: 14, textAlign: 'center' }}>
                            Waiting for the host to pick a secret…
                        </NeonText>
                    </View>
                )}
            </ScrollView>

            {/* In-Game Voice and Chat Overlay */}
            <InGameOverlay />
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 50 },
    header: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    title: { letterSpacing: 1 },
    subtitle: { textAlign: 'center', letterSpacing: 0.5 },
    card: { borderRadius: 22, padding: 26, alignItems: 'center', position: 'relative' },
    checkBadge: { position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    emoji: { marginBottom: 14 },
    cardText: { alignItems: 'center', gap: 8 },
    taglinePill: { borderWidth: 1, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 },
    cardDesc: { textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
    startSection: { marginTop: 20, alignItems: 'center' },
    waitingContainer: { alignItems: 'center', paddingVertical: 36 },
    // chatOverlay removed, handled inside InGameOverlay
});

export default WhispersHubScreen;
