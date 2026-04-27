import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { getRandomPrompt } from '../data/neverHaveIEverPrompts';
import { COLORS } from '../constants/theme';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';

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
    const [clickedThisRound, setClickedThisRound] = useState({});
    const [isMuted, setIsMuted] = useState(SoundService.getMuted());
    const [isHapticsEnabled, setIsHapticsEnabled] = useState(HapticService.isEnabled);

    const handleNextPrompt = () => {
        HapticService.impact('light');
        const newPrompt = getRandomPrompt(category, usedPrompts);
        setCurrentPrompt(newPrompt);
        setUsedPrompts([...usedPrompts, newPrompt]);
        setRoundNumber(roundNumber + 1);
        setClickedThisRound({}); // Reset for new round
    };

    const handlePlayerDrink = (playerId) => {
        HapticService.selection();
        const isSelected = !!clickedThisRound[playerId];
        
        setPlayerScores(prev => ({
            ...prev,
            [playerId]: isSelected ? Math.max(0, prev[playerId] - 1) : prev[playerId] + 1
        }));

        setClickedThisRound(prev => ({
            ...prev,
            [playerId]: !isSelected
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
                <View style={styles.headerControls}>
                    <TouchableOpacity 
                        onPress={() => {
                            const muted = SoundService.toggleMute();
                            setIsMuted(muted);
                            HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isMuted ? "volume-mute" : "volume-high"} 
                            size={18} 
                            color={isMuted ? COLORS.hotPink : COLORS.neonCyan} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            HapticService.setEnabled(!isHapticsEnabled);
                            setIsHapticsEnabled(!isHapticsEnabled);
                            if (!isHapticsEnabled) HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isHapticsEnabled ? "notifications" : "notifications-off"} 
                            size={18} 
                            color={isHapticsEnabled ? COLORS.neonCyan : COLORS.hotPink} 
                        />
                    </TouchableOpacity>
                </View>
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
                    {players.map(player => {
                        const isSelected = !!clickedThisRound[player.id];
                        return (
                            <TouchableOpacity
                                key={player.id}
                                style={[
                                    styles.playerCard,
                                    isSelected && { borderColor: COLORS.limeGlow, backgroundColor: 'rgba(198, 255, 74, 0.1)' }
                                ]}
                                onPress={() => handlePlayerDrink(player.id)}
                            >
                                <NeonText size={32}>{isSelected ? '🍻' : '🍺'}</NeonText>
                                <NeonText size={16} weight="bold" style={styles.playerName}>
                                    {player.name}
                                </NeonText>
                                <NeonText size={14} color={isSelected ? COLORS.limeGlow : COLORS.hotPink}>
                                    {playerScores[player.id]} drinks
                                </NeonText>
                                {isSelected && (
                                    <View style={styles.addedBadge}>
                                        <NeonText size={8} weight="bold" color="#000">+1</NeonText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
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
        position: 'relative',
    },
    headerControls: {
        position: 'absolute',
        top: -10,
        right: 0,
        flexDirection: 'row',
        gap: 8,
    },
    controlIcon: {
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
    },
    addedBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.limeGlow,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default NeverHaveIEverScreen;
