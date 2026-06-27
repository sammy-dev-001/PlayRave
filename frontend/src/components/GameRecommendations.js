import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList
} from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import RecommendationService from '../services/RecommendationService';
import { useTheme } from '../context/ThemeContext';

// Mood buttons for quick suggestions
const MOODS = [
    { id: 'competitive', emoji: '🔥', label: 'Competitive' },
    { id: 'chill', emoji: '😎', label: 'Chill' },
    { id: 'social', emoji: '🎉', label: 'Social' },
    { id: 'fast', emoji: '⚡', label: 'Fast' },
    { id: 'creative', emoji: '🎨', label: 'Creative' },
];

const GameRecommendations = ({
    playerCount = 4,
    onSelectGame,
    compact = false
}) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [recommendations, setRecommendations] = useState([]);
    const [selectedMood, setSelectedMood] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, [playerCount, selectedMood]);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const context = selectedMood ? { energy: getMoodEnergy(selectedMood) } : {};
            const recs = await RecommendationService.getRecommendations(playerCount, context);
            setRecommendations(recs);
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
        setLoading(false);
    };

    const getMoodEnergy = (mood) => {
        const energyMap = {
            'competitive': 'high',
            'chill': 'low',
            'social': 'medium',
            'fast': 'high',
            'creative': 'medium'
        };
        return energyMap[mood];
    };

    const handleMoodSelect = (mood) => {
        setSelectedMood(selectedMood === mood ? null : mood);
    };

    const getGameEmoji = (category) => {
        const emojiMap = {
            'knowledge': '🧠',
            'social': '👥',
            'action': '⚡',
            'word': '📝',
            'creative': '🎨',
            'strategy': '♟️',
            'memory': '🔮'
        };
        return emojiMap[category] || '🎮';
    };

    const renderMood = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.moodBtn,
                selectedMood === item.id && styles.moodBtnActive
            ]}
            onPress={() => handleMoodSelect(item.id)}
        >
            <NeonText size={20}>{item.emoji}</NeonText>
            {!compact && (
                <NeonText
                    size={10}
                    color={selectedMood === item.id ? COLORS.limeGlow : COLORS.textMuted}
                >
                    {item.label}
                </NeonText>
            )}
        </TouchableOpacity>
    );

    const renderRecommendation = ({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.recCard,
                index === 0 && styles.topRecCard
            ]}
            onPress={() => onSelectGame?.(item.gameId)}
        >
            <View style={styles.recLeft}>
                <View style={styles.recRank}>
                    <NeonText size={12} color={COLORS.neonCyan}>
                        #{index + 1}
                    </NeonText>
                </View>
                <NeonText size={24}>{getGameEmoji(item.category)}</NeonText>
            </View>

            <View style={styles.recInfo}>
                <NeonText size={14} weight="bold">
                    {item.name}
                </NeonText>
                <NeonText size={10} color={COLORS.limeGlow}>
                    {item.reason}
                </NeonText>
                {!compact && (
                    <View style={styles.recMeta}>
                        <NeonText size={10} color={COLORS.textDarkMuted}>
                            {item.duration}min • {item.energy} energy
                        </NeonText>
                    </View>
                )}
            </View>

            <View style={styles.recScore}>
                <NeonText size={16} weight="bold" color={
                    item.score >= 80 ? COLORS.limeGlow :
                        item.score >= 60 ? COLORS.neonCyan :
                            COLORS.textMuted
                }>
                    {item.score}%
                </NeonText>
                <NeonText size={8} color={COLORS.textDarkMuted}>match</NeonText>
            </View>
        </TouchableOpacity>
    );

    if (compact) {
        // Compact mode - just show top 3
        return (
            <View style={styles.compactContainer}>
                <NeonText size={12} color={COLORS.neonCyan} style={styles.sectTitle}>
                    ✨ RECOMMENDED FOR YOU
                </NeonText>
                {recommendations.slice(0, 3).map((rec, index) => (
                    <TouchableOpacity
                        key={rec.gameId}
                        style={styles.compactRec}
                        onPress={() => onSelectGame?.(rec.gameId)}
                    >
                        <NeonText size={20}>{getGameEmoji(rec.category)}</NeonText>
                        <NeonText size={12}>{rec.name}</NeonText>
                        <NeonText size={10} color={COLORS.limeGlow}>{rec.score}%</NeonText>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <NeonText size={16} weight="bold" glow>
                    ✨ RECOMMENDED FOR YOU
                </NeonText>
                <NeonText size={12} color={COLORS.textMuted}>
                    {playerCount} players
                </NeonText>
            </View>

            {/* Mood Selector */}
            <FlatList
                data={MOODS}
                keyExtractor={item => item.id}
                renderItem={renderMood}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moodList}
            />

            {/* Recommendations */}
            {loading ? (
                <View style={styles.loading}>
                    <NeonText size={14} color={COLORS.textMuted}>Loading...</NeonText>
                </View>
            ) : (
                <FlatList
                    data={recommendations}
                    keyExtractor={item => item.gameId}
                    renderItem={renderRecommendation}
                    contentContainerStyle={styles.recList}
                />
            )}
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    compactContainer: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    moodList: {
        paddingBottom: 15,
    },
    moodBtn: {
        alignItems: 'center',
        padding: 10,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        minWidth: 60,
    },
    moodBtnActive: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    loading: {
        padding: 20,
        alignItems: 'center',
    },
    recList: {
        paddingBottom: 10,
    },
    recCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    topRecCard: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.05)',
    },
    recLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    recRank: {
        marginRight: 8,
    },
    recInfo: {
        flex: 1,
    },
    recMeta: {
        marginTop: 3,
    },
    recScore: {
        alignItems: 'center',
    },
    sectTitle: {
        marginBottom: 10,
    },
    compactRec: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    }
});

export default GameRecommendations;
