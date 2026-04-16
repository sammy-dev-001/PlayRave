import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const CATEGORIES = [
    {
        id: 'Icebreaker',
        name: 'Icebreaker',
        emoji: '🧊',
        tagline: 'Chill vibes, light laughs',
        description: 'Fun & low-stakes — perfect for warming up the crew',
        color: COLORS.neonCyan,
        borderColor: COLORS.neonCyan,
        bg: 'rgba(0, 240, 255, 0.07)',
        glowColor: COLORS.neonCyan,
    },
    {
        id: 'Spicy',
        name: 'Spicy',
        emoji: '🌶️',
        tagline: 'Call outs & chaos',
        description: 'Raw, real, and slightly unhinged. Receipts will be pulled.',
        color: COLORS.hotPink,
        borderColor: COLORS.hotPink,
        bg: 'rgba(255, 57, 139, 0.07)',
        glowColor: COLORS.hotPink,
    },
    {
        id: 'Deep Dive',
        name: 'Deep Dive',
        emoji: '🫀',
        tagline: 'Close friends only',
        description: 'Do they actually know you? Therapy hour starts now.',
        color: COLORS.electricPurple,
        borderColor: COLORS.electricPurple,
        bg: 'rgba(148, 0, 211, 0.09)',
        glowColor: COLORS.electricPurple,
    },
];

const HotSeatCategoryScreen = ({ route, navigation }) => {
    const { room, isHost, playerName } = route.params;
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [starting, setStarting] = useState(false);

    // Separate animated values per card to avoid hooks-in-loops
    const anim0 = useRef(new Animated.Value(1)).current;
    const anim1 = useRef(new Animated.Value(1)).current;
    const anim2 = useRef(new Animated.Value(1)).current;
    const cardAnims = [anim0, anim1, anim2];

    // Entrance animation
    const entranceFade = useRef(new Animated.Value(0)).current;
    const entranceY = useRef(new Animated.Value(30)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(entranceFade, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(entranceY, { toValue: 0, friction: 7, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleCardPress = (cat, index) => {
        if (!isHost) return;
        Animated.sequence([
            Animated.timing(cardAnims[index], { toValue: 0.93, duration: 70, useNativeDriver: true }),
            Animated.spring(cardAnims[index], { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        setSelectedCategory(cat.id);
    };

    useEffect(() => {
        const onGameStarted = ({ gameType, gameState, players }) => {
            if (gameType !== 'hot-seat-mc') return;
            navigation.navigate('HotSeatMC', {
                room,
                isHost,
                playerName,
                initialGameState: gameState,
                players,
            });
        };

        SocketService.on('game-started', onGameStarted);
        return () => SocketService.off('game-started', onGameStarted);
    }, [navigation, room, isHost, playerName]);

    const handleStartGame = () => {
        if (!selectedCategory || starting) return;
        setStarting(true);
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: 'hot-seat-mc',
            hostParticipates: true,
            category: selectedCategory,
        });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View style={[styles.header, { opacity: entranceFade, transform: [{ translateY: entranceY }] }]}>
                    <View style={styles.flameRow}>
                        <Ionicons name="flame" size={30} color={COLORS.hotPink} />
                        <NeonText size={34} weight="bold" glow style={styles.title}>
                            THE HOT SEAT
                        </NeonText>
                        <Ionicons name="flame" size={30} color={COLORS.hotPink} />
                    </View>
                    <NeonText size={14} color={COLORS.hotPink} style={styles.subtitle}>
                        {isHost ? 'Pick a vibe for the room' : 'Waiting for host to set the mood…'}
                    </NeonText>
                    <View style={styles.rulePill}>
                        <Ionicons name="information-circle-outline" size={13} color="#555" />
                        <NeonText size={12} color="#555" style={{ marginLeft: 5, lineHeight: 18 }}>
                            Each player answers. Everyone else guesses.
                        </NeonText>
                    </View>
                </Animated.View>

                {/* Category cards */}
                <Animated.View style={{ opacity: entranceFade }}>
                    {CATEGORIES.map((cat, i) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <Animated.View key={cat.id} style={{ transform: [{ scale: cardAnims[i] }], marginBottom: 16 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: isSelected ? cat.bg : 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected ? cat.borderColor : 'rgba(255,255,255,0.1)',
                                            borderWidth: isSelected ? 3 : 2,
                                            shadowColor: isSelected ? cat.glowColor : 'transparent',
                                        },
                                    ]}
                                    onPress={() => handleCardPress(cat, i)}
                                    activeOpacity={isHost ? 0.78 : 1}
                                    disabled={!isHost}
                                >
                                    {/* Selected badge */}
                                    {isSelected && (
                                        <View style={[styles.checkBadge, { backgroundColor: cat.color }]}>
                                            <Ionicons name="checkmark" size={13} color="#000" />
                                        </View>
                                    )}

                                    {/* Emoji */}
                                    <NeonText size={50} style={styles.emoji}>{cat.emoji}</NeonText>

                                    {/* Text */}
                                    <View style={styles.cardText}>
                                        <NeonText
                                            size={24}
                                            weight="bold"
                                            color={isSelected ? cat.color : '#fff'}
                                            glow={isSelected}
                                            style={{ letterSpacing: 0.5 }}
                                        >
                                            {cat.name}
                                        </NeonText>

                                        <View style={[styles.taglinePill, { borderColor: cat.color }]}>
                                            <NeonText size={12} color={cat.color} style={{ fontStyle: 'italic' }}>
                                                {cat.tagline}
                                            </NeonText>
                                        </View>

                                        <NeonText size={13} color="#777" style={styles.cardDesc}>
                                            {cat.description}
                                        </NeonText>
                                    </View>

                                    {/* Right arrow */}
                                    {!isSelected && (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color="rgba(255,255,255,0.2)"
                                            style={styles.chevron}
                                        />
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </Animated.View>

                {/* Bottom action */}
                {isHost ? (
                    <View style={styles.startSection}>
                        {!selectedCategory && (
                            <NeonText size={13} color="#555" style={{ marginBottom: 12, textAlign: 'center' }}>
                                Select a category above to start
                            </NeonText>
                        )}
                        <NeonButton
                            title={starting ? 'STARTING…' : 'START THE HOT SEAT 🔥'}
                            onPress={handleStartGame}
                            disabled={!selectedCategory || starting}
                        />
                    </View>
                ) : (
                    <View style={styles.waitingContainer}>
                        <Ionicons name="hourglass-outline" size={36} color={COLORS.electricPurple} />
                        <NeonText size={15} color="#777" style={{ marginTop: 14, textAlign: 'center', lineHeight: 22 }}>
                            Waiting for the host to pick a vibe…
                        </NeonText>
                    </View>
                )}

            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingBottom: 50,
    },
    header: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 28,
    },
    flameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    title: {
        letterSpacing: 1,
    },
    subtitle: {
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    rulePill: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    card: {
        borderRadius: 22,
        padding: 26,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 5,
    },
    checkBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        marginBottom: 14,
    },
    cardText: {
        alignItems: 'center',
        gap: 8,
    },
    taglinePill: {
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 14,
    },
    cardDesc: {
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 8,
    },
    chevron: {
        position: 'absolute',
        right: 18,
        top: '50%',
    },
    startSection: {
        marginTop: 8,
        alignItems: 'center',
    },
    waitingContainer: {
        alignItems: 'center',
        paddingVertical: 36,
    },
});

export default HotSeatCategoryScreen;
