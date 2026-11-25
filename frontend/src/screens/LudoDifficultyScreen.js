import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';

const SEAT_COLORS = ['#FF007F', '#00FFFF', '#FFD700', '#39FF14'];
const SEAT_COLOR_NAMES = ['Pink', 'Cyan', 'Yellow', 'Green'];

export const buildLudoSeats = (incomingPlayers = [], isSinglePlayer = true) => {
    const cleanPlayers = (incomingPlayers || []).slice(0, 4);
    const count = isSinglePlayer || cleanPlayers.length <= 1 ? 1 : cleanPlayers.length;

    // 2 players get diagonally opposite seats (Pink & Yellow); 1/3/4 fill from Pink clockwise
    const humanSeatOrder = count === 2 ? [0, 2] : [0, 1, 2, 3].slice(0, count);
    const seatByIdx = new Array(4).fill(null);

    humanSeatOrder.forEach((seatIdx, pIdx) => {
        const name = cleanPlayers[pIdx]?.name || (count === 1 ? 'You' : `Player ${pIdx + 1}`);
        seatByIdx[seatIdx] = {
            idx: seatIdx,
            name,
            color: SEAT_COLORS[seatIdx],
            colorName: SEAT_COLOR_NAMES[seatIdx],
            isAI: false,
        };
    });

    let botNum = 1;
    for (let i = 0; i < 4; i++) {
        if (!seatByIdx[i]) {
            seatByIdx[i] = {
                idx: i,
                name: `AI ${SEAT_COLOR_NAMES[i]}`,
                shortName: `Bot ${botNum}`,
                color: SEAT_COLORS[i],
                colorName: SEAT_COLOR_NAMES[i],
                isAI: true,
            };
            botNum += 1;
        }
    }
    return seatByIdx;
};

const LudoDifficultyScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { players = [], isSinglePlayer = true } = route?.params || {};
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

    const seats = useMemo(() => buildLudoSeats(players, isSinglePlayer), [players, isSinglePlayer]);
    const aiCount = seats.filter(s => s.isAI).length;
    const humanCount = 4 - aiCount;

    const difficulties = [
        {
            id: 'easy',
            name: 'Easy',
            description: 'AI moves casually — great for beginners',
            icon: 'happy-outline',
            color: COLORS.limeGlow,
            depth: 1
        },
        {
            id: 'medium',
            name: 'Medium',
            description: 'Smart AI — prioritizes capturing tokens',
            icon: 'fitness-outline',
            color: COLORS.neonCyan,
            depth: 2
        },
        {
            id: 'hard',
            name: 'Hard',
            description: 'Expert AI — strategic blocks & aggressive plays',
            icon: 'skull-outline',
            color: COLORS.hotPink,
            depth: 3
        },
    ];

    const handleStart = () => {
        const diff = difficulties.find(d => d.id === selectedDifficulty);
        navigation.navigate('LudoVsAI', {
            players,
            isSinglePlayer: humanCount <= 1,
            difficulty: diff.id,
            searchDepth: diff.depth,
        });
    };

    const subtitleText = aiCount === 0
        ? '4 PLAYERS PASS & PLAY — All 4 colors filled!'
        : `${humanCount} PLAYER${humanCount > 1 ? 'S' : ''} + ${aiCount} AI BOT${aiCount > 1 ? 'S' : ''} — Pick bot skill`;

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <View style={styles.iconRow}>
                    <NeonText size={48}>🎲</NeonText>
                </View>
                <NeonText size={32} weight="bold" glow>NEON LUDO</NeonText>
                <NeonText size={13} color={COLORS.neonCyan} style={styles.subtitle}>
                    {subtitleText}
                </NeonText>

                {/* Color Seat Assignment Preview */}
                <View style={styles.seatsPreviewRow}>
                    {seats.map(seat => (
                        <View
                            key={seat.idx}
                            style={[
                                styles.seatPill,
                                { borderColor: seat.color, backgroundColor: `${seat.color}18` }
                            ]}
                        >
                            <View style={[styles.seatDot, { backgroundColor: seat.color }]} />
                            <NeonText size={11} weight="bold" color={seat.color} numberOfLines={1}>
                                {seat.name}{seat.isAI ? ' (Bot)' : ''}
                            </NeonText>
                        </View>
                    ))}
                </View>
            </View>

            {aiCount > 0 ? (
                <View style={styles.cardsContainer}>
                    {difficulties.map(diff => (
                        <TouchableOpacity
                            key={diff.id}
                            style={[
                                styles.card,
                                { borderColor: diff.color },
                                selectedDifficulty === diff.id && [styles.selectedCard, { backgroundColor: diff.color + '22' }],
                            ]}
                            onPress={() => setSelectedDifficulty(diff.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={diff.icon}
                                size={52}
                                color={diff.color}
                                style={{ marginBottom: 12 }}
                            />
                            <NeonText size={24} weight="bold" color={diff.color} glow={selectedDifficulty === diff.id}>
                                {diff.name}
                            </NeonText>
                            <NeonText size={13} color={COLORS.textMuted} style={styles.desc}>
                                {diff.description}
                            </NeonText>
                            {selectedDifficulty === diff.id && (
                                <View style={[styles.badge, { backgroundColor: diff.color }]}>
                                    <NeonText size={11} color="#000" weight="bold">SELECTED ✓</NeonText>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.allHumansBanner}>
                    <Ionicons name="people" size={44} color={COLORS.limeGlow} style={{ marginBottom: 10 }} />
                    <NeonText size={18} weight="bold" color={COLORS.limeGlow} glow>
                        FULL 4-PLAYER LOCAL MATCH
                    </NeonText>
                    <NeonText size={13} color={COLORS.textMuted} style={styles.desc}>
                        Each player controls their assigned color corner. Pass the device clockwise each turn!
                    </NeonText>
                </View>
            )}

            <View style={styles.footer}>
                <NeonButton title="START GAME" onPress={handleStart} style={{ width: '100%' }} />
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 22,
        marginTop: 10,
    },
    iconRow: {
        marginBottom: 8,
    },
    subtitle: {
        marginTop: 8,
        textAlign: 'center',
    },
    seatsPreviewRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 14,
    },
    seatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        maxWidth: 150,
    },
    seatDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    cardsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    allHumansBanner: {
        backgroundColor: 'rgba(57, 255, 20, 0.06)',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    selectedCard: {
        borderWidth: 3,
    },
    desc: {
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    footer: {
        paddingBottom: 24,
    },
});

export default LudoDifficultyScreen;
