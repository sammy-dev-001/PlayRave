import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';

const ConnectFourDifficultyScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const { players, isSinglePlayer } = route.params;
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

    const difficulties = [
        {
            id: 'easy',
            name: 'Easy',
            description: 'AI drops randomly — perfect for beginners',
            icon: 'happy-outline',
            color: COLORS.limeGlow,
        },
        {
            id: 'medium',
            name: 'Medium',
            description: 'Heuristic AI — wins when it can, blocks when needed',
            icon: 'fitness-outline',
            color: COLORS.neonCyan,
        },
        {
            id: 'hard',
            name: 'Hard',
            description: 'Minimax AI — nearly unbeatable with deep lookahead',
            icon: 'skull-outline',
            color: COLORS.hotPink,
        },
    ];

    const handleStart = () => {
        navigation.navigate('ConnectFour', { players, isSinglePlayer, difficulty: selectedDifficulty });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <View style={styles.iconRow}>
                    <NeonText size={48}>🔴🟡</NeonText>
                </View>
                <NeonText size={32} weight="bold" glow>CONNECT FOUR</NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    VS AI — Choose difficulty
                </NeonText>
            </View>

            <View style={styles.rulesBox}>
                <NeonText size={12} color={COLORS.textMuted} style={{ textAlign: 'center', lineHeight: 18 }}>
                    Drop discs into the grid. Get 4 in a row — horizontal, vertical or diagonal — to win!
                </NeonText>
            </View>

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
                        <Ionicons name={diff.icon} size={52} color={diff.color} style={{ marginBottom: 12 }} />
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

            <View style={styles.footer}>
                <NeonButton title="START GAME" onPress={handleStart} style={{ width: '100%' }} />
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
    iconRow: { marginBottom: 8 },
    subtitle: { marginTop: 8, textAlign: 'center' },
    rulesBox: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        marginBottom: 20,
    },
    cardsContainer: { gap: 16, marginBottom: 24 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    selectedCard: { borderWidth: 3 },
    desc: { textAlign: 'center', marginTop: 6, lineHeight: 18 },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    footer: { paddingBottom: 24 },
});

export default ConnectFourDifficultyScreen;
