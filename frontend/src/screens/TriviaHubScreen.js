import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const TRIVIA_MODES = [
    {
        id: 'trivia',
        name: 'Quick Trivia',
        emoji: '🧠',
        tagline: 'Multi-topic questions',
        description: 'Random questions across all categories. High speed, high stakes.',
        color: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
        bg: 'rgba(0, 240, 255, 0.07)',
        glowColor: COLORS.neonCyan,
        engine: 'trivia'
    },
    {
        id: 'myth-or-fact',
        name: 'Myth or Fact',
        emoji: '🤔',
        tagline: 'True or False',
        description: 'Separate truth from fiction. Can you spot the lie?',
        color: COLORS.limeGlow,
        borderColor: COLORS.limeGlow,
        bg: 'rgba(57, 255, 139, 0.07)',
        glowColor: COLORS.limeGlow,
        engine: 'myth-or-fact'
    }
];

const TriviaHubScreen = ({ route, navigation }) => {
    const { room, isHost, playerName } = route.params;
    const [selectedMode, setSelectedMode] = useState(null);
    const [starting, setStarting] = useState(false);

    const anim0 = useRef(new Animated.Value(1)).current;
    const anim1 = useRef(new Animated.Value(1)).current;
    const cardAnims = [anim0, anim1];

    const entranceFade = useRef(new Animated.Value(0)).current;
    const entranceY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceFade, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(entranceY, { toValue: 0, friction: 7, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleCardPress = (mode, index) => {
        if (!isHost) return;
        Animated.sequence([
            Animated.timing(cardAnims[index], { toValue: 0.93, duration: 70, useNativeDriver: true }),
            Animated.spring(cardAnims[index], { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        setSelectedMode(mode.id);
    };

    useEffect(() => {
        const onGameStarted = ({ gameType, gameState, players, roomId }) => {
            if (roomId && roomId !== room.id) return;

            if (gameType === 'trivia') {
                navigation.navigate('Question', { room, isHost, playerName, initialGameState: gameState, players });
            } else if (gameType === 'myth-or-fact') {
                navigation.navigate('MythOrFactQuestion', { room, isHost, playerName, initialGameState: gameState, players });
            }
        };

        SocketService.on('game-started', onGameStarted);
        return () => SocketService.off('game-started', onGameStarted);
    }, [navigation, room, isHost, playerName]);

    const handleStartGame = () => {
        if (!selectedMode || starting) return;
        setStarting(true);

        const mode = TRIVIA_MODES.find(m => m.id === selectedMode);
        
        // Update the room's game type on the server
        SocketService.emit('set-game-type', {
            roomId: room.id,
            gameType: mode.engine
        });

        // Navigate back to lobby so other players can join/see the choice
        navigation.navigate('Lobby', { 
            room: { ...room, gameType: mode.engine }, 
            playerName 
        });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.header, { opacity: entranceFade, transform: [{ translateY: entranceY }] }]}>
                    <View style={styles.iconRow}>
                        <Ionicons name="bulb" size={30} color={COLORS.neonCyan} />
                        <NeonText size={34} weight="bold" glow style={styles.title}>TRIVIA LAB</NeonText>
                        <Ionicons name="rocket" size={30} color={COLORS.neonCyan} />
                    </View>
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                        {isHost ? 'Pick your brain challenge' : 'Waiting for host to pick a challenge…'}
                    </NeonText>
                </Animated.View>

                <Animated.View style={{ opacity: entranceFade }}>
                    {TRIVIA_MODES.map((mode, i) => {
                        const isSelected = selectedMode === mode.id;
                        return (
                            <Animated.View key={mode.id} style={{ transform: [{ scale: cardAnims[i] }], marginBottom: 16 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: isSelected ? mode.bg : 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected ? mode.borderColor : 'rgba(255,255,255,0.1)',
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
                                        <NeonText size={24} weight="bold" color={isSelected ? mode.color : '#fff'} glow={isSelected}>{mode.name}</NeonText>
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
                            title={starting ? 'PREPARING…' : 'START CHALLENGE 🚀'}
                            onPress={handleStartGame}
                            disabled={!selectedMode || starting}
                        />
                    </View>
                ) : (
                    <View style={styles.waitingContainer}>
                        <Ionicons name="hourglass-outline" size={36} color={COLORS.neonCyan} />
                        <NeonText size={15} color="#777" style={{ marginTop: 14, textAlign: 'center' }}>
                            Waiting for the host to pick a category…
                        </NeonText>
                    </View>
                )}
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
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
});

export default TriviaHubScreen;
