import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import NeonText from './NeonText';
import GameIcon from './GameIcon';
import { COLORS } from '../constants/theme';

// Game metadata for recommendations
const GAME_DATA = {
    'trivia': {
        minPlayers: 2,
        maxPlayers: 20,
        vibe: 'competitive',
        energy: 'medium',
        duration: 10,
        tags: ['knowledge', 'quiz']
    },
    'would-you-rather': {
        minPlayers: 2,
        maxPlayers: 30,
        vibe: 'social',
        energy: 'chill',
        duration: 15,
        tags: ['discussion', 'social']
    },
    'whos-most-likely': {
        minPlayers: 3,
        maxPlayers: 20,
        vibe: 'social',
        energy: 'medium',
        duration: 10,
        tags: ['social', 'friends']
    },
    'imposter': {
        minPlayers: 4,
        maxPlayers: 12,
        vibe: 'deduction',
        energy: 'high',
        duration: 15,
        tags: ['deception', 'social']
    },
    'lie-detector': {
        minPlayers: 3,
        maxPlayers: 10,
        vibe: 'social',
        energy: 'medium',
        duration: 15,
        tags: ['deception', 'fun']
    },
    'confession-roulette': {
        minPlayers: 3,
        maxPlayers: 15,
        vibe: 'party',
        energy: 'high',
        duration: 20,
        tags: ['spicy', 'confessions']
    },
    'rapid-fire': {
        minPlayers: 2,
        maxPlayers: 10,
        vibe: 'competitive',
        energy: 'high',
        duration: 5,
        tags: ['speed', 'quick']
    },
    'type-race': {
        minPlayers: 2,
        maxPlayers: 8,
        vibe: 'competitive',
        energy: 'high',
        duration: 3,
        tags: ['typing', 'speed']
    },
    'memory-chain': {
        minPlayers: 2,
        maxPlayers: 10,
        vibe: 'competitive',
        energy: 'medium',
        duration: 10,
        tags: ['memory', 'brain']
    },
    'math-blitz': {
        minPlayers: 2,
        maxPlayers: 10,
        vibe: 'competitive',
        energy: 'high',
        duration: 5,
        tags: ['math', 'speed']
    },
    'never-have-i-ever': {
        minPlayers: 3,
        maxPlayers: 20,
        vibe: 'party',
        energy: 'chill',
        duration: 15,
        tags: ['social', 'spicy']
    },
    'truth-or-dare': {
        minPlayers: 2,
        maxPlayers: 15,
        vibe: 'party',
        energy: 'high',
        duration: 20,
        tags: ['spicy', 'dares']
    },
    'spin-the-bottle': {
        minPlayers: 4,
        maxPlayers: 12,
        vibe: 'party',
        energy: 'high',
        duration: 15,
        tags: ['party', 'fun']
    },
    'tic-tac-toe': {
        minPlayers: 2,
        maxPlayers: 16,
        vibe: 'competitive',
        energy: 'chill',
        duration: 5,
        tags: ['classic', 'tournament']
    },
};

// Get recommendations based on context
const getRecommendations = (playerCount = 4, timeOfDay = null, previousGames = []) => {
    const hour = timeOfDay || new Date().getHours();
    const isLateNight = hour >= 22 || hour < 5;
    const isEvening = hour >= 18 || hour < 22;

    let recommendations = [];

    Object.entries(GAME_DATA).forEach(([gameId, data]) => {
        // Filter by player count
        if (playerCount < data.minPlayers || playerCount > data.maxPlayers) return;

        let score = 50; // Base score

        // Boost based on time
        if (isLateNight && data.vibe === 'party') score += 30;
        if (isLateNight && data.tags.includes('spicy')) score += 20;
        if (isEvening && data.energy === 'high') score += 15;

        // Boost for player count fit
        const idealPlayers = (data.minPlayers + data.maxPlayers) / 2;
        const fitScore = 100 - Math.abs(playerCount - idealPlayers) * 5;
        score += fitScore / 5;

        // Reduce if recently played
        if (previousGames.includes(gameId)) score -= 40;

        // Add some randomness
        score += Math.random() * 10;

        recommendations.push({
            gameId,
            score,
            reason: getRecommendationReason(gameId, data, playerCount, isLateNight)
        });
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
};

const getRecommendationReason = (gameId, data, playerCount, isLateNight) => {
    if (isLateNight && data.tags.includes('spicy')) {
        return '🌙 Perfect for late night vibes!';
    }
    if (data.minPlayers <= playerCount && playerCount <= 5 && data.vibe === 'social') {
        return '👥 Great for your group size!';
    }
    if (playerCount >= 6 && data.maxPlayers >= 10) {
        return '🎉 Handles large groups well!';
    }
    if (data.energy === 'high') {
        return '⚡ High energy fun!';
    }
    if (data.duration <= 5) {
        return '⏱️ Quick rounds!';
    }
    return '✨ Fan favorite!';
};

// Smart Recommendations Component
const SmartGameRecommendations = ({
    playerCount = 4,
    previousGames = [],
    onSelectGame,
    visible = true
}) => {
    const recommendations = useMemo(() => {
        return getRecommendations(playerCount, null, previousGames);
    }, [playerCount, previousGames]);

    if (!visible || recommendations.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText size={14} weight="bold" color={COLORS.electricPurple}>
                    🧠 RECOMMENDED FOR YOU
                </NeonText>
                <NeonText size={10} color="#888">
                    Based on {playerCount} players & time
                </NeonText>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {recommendations.map(({ gameId, reason }, idx) => (
                    <TouchableOpacity
                        key={gameId}
                        style={[styles.card, idx === 0 && styles.topPick]}
                        onPress={() => onSelectGame?.(gameId)}
                    >
                        {idx === 0 && (
                            <View style={styles.topBadge}>
                                <NeonText size={8} color="#000" weight="bold">TOP PICK</NeonText>
                            </View>
                        )}
                        <GameIcon gameId={gameId} size={40} />
                        <NeonText size={12} weight="bold" numberOfLines={1}>
                            {gameId.replace(/-/g, ' ')}
                        </NeonText>
                        <NeonText size={9} color="#888" numberOfLines={2} style={styles.reason}>
                            {reason}
                        </NeonText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
        paddingVertical: 15,
        backgroundColor: 'rgba(167, 139, 250, 0.08)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    header: {
        paddingHorizontal: 15,
        marginBottom: 12,
    },
    scrollContent: {
        paddingHorizontal: 15,
        gap: 12,
    },
    card: {
        width: 110,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    topPick: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    topBadge: {
        position: 'absolute',
        top: -8,
        backgroundColor: COLORS.limeGlow,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    reason: {
        textAlign: 'center',
        marginTop: 5,
    },
});

export { SmartGameRecommendations, getRecommendations, GAME_DATA };
export default SmartGameRecommendations;
