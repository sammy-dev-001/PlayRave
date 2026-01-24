import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomPrompt } from '../data/neverHaveIEverPrompts';
import { COLORS } from '../constants/theme';

const NeverHaveIEverScreen = ({ route, navigation }) => {
    const { players, category = 'normal' } = route.params;
    const [currentPrompt, setCurrentPrompt] = useState(() => getRandomPrompt(category, []));
    const [usedPrompts, setUsedPrompts] = useState([currentPrompt]);
    const [roundNumber, setRoundNumber] = useState(1);
    const [playerScores, setPlayerScores] = useState(() => {
        const scores = {};
        players.forEach(player => {
            scores[player.id] = 0;
        });
        return scores;
    });

    const handleNextPrompt = () => {
        const newPrompt = getRandomPrompt(category, usedPrompts);
        setCurrentPrompt(newPrompt);
        setUsedPrompts([...usedPrompts, newPrompt]);
        setRoundNumber(roundNumber + 1);
    };

    const handlePlayerDrink = (playerId) => {
        setPlayerScores(prev => ({
            ...prev,
            [playerId]: prev[playerId] + 1
        }));
    };

    const getCategoryColor = () => {
        switch (category) {
            case 'spicy': return COLORS.hotPink;
            case 'naughty': return COLORS.electricPurple;
            default: return COLORS.limeGlow;
        }
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow>
                    NEVER HAVE I EVER
                </NeonText>
                <View style={[styles.categoryBadge, { borderColor: getCategoryColor() }]}>
                    <NeonText size={12} color={getCategoryColor()} weight="bold">
                        {category.toUpperCase()}
                    </NeonText>
                </View>
                <NeonText size={14} color="#888" style={styles.roundText}>
                    Round {roundNumber}
                </NeonText>
            </View>

            {/* Current Prompt */}
            <View style={styles.promptContainer}>
                <NeonText size={24} weight="bold" style={styles.promptText} glow>
                    {currentPrompt}
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.neonCyan} style={styles.instruction}>
                Tap players who HAVE done it! 👆
            </NeonText>

            {/* Players */}
            <ScrollView style={styles.playersContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.playersGrid}>
                    {players.map(player => (
                        <TouchableOpacity
                            key={player.id}
                            style={styles.playerCard}
                            onPress={() => handlePlayerDrink(player.id)}
                        >
                            <NeonText size={32}>🍺</NeonText>
                            <NeonText size={16} weight="bold" style={styles.playerName}>
                                {player.name}
                            </NeonText>
                            <NeonText size={14} color={COLORS.hotPink}>
                                {playerScores[player.id]} drinks
                            </NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                <NeonButton
                    title="NEXT PROMPT"
                    onPress={handleNextPrompt}
                />
                <NeonButton
                    title="END GAME"
                    variant="secondary"
                    onPress={() => navigation.navigate('LocalGameSelection', { players })}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 30,
    },
    categoryBadge: {
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 2,
    },
    roundText: {
        marginTop: 10,
    },
    promptContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 25,
        marginBottom: 15,
        minHeight: 120,
        justifyContent: 'center',
    },
    promptText: {
        textAlign: 'center',
        lineHeight: 32,
    },
    instruction: {
        textAlign: 'center',
        marginBottom: 15,
    },
    playersContainer: {
        flex: 1,
        marginBottom: 15,
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    playerCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        padding: 15,
        alignItems: 'center',
        minWidth: 100,
    },
    playerName: {
        marginTop: 5,
        textAlign: 'center',
    },
    actions: {
        gap: 10,
    }
});

export default NeverHaveIEverScreen;
