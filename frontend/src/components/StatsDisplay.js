import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';
import PlayerStatsService from '../services/PlayerStatsService';
import { responsive } from '../utils/responsive';

const StatsDisplay = ({ refreshKey = 0 }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [refreshKey]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const formattedStats = await PlayerStatsService.getFormattedStats();
            setStats(formattedStats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
        setLoading(false);
    };

    if (loading || !stats) {
        return (
            <View style={styles.container}>
                <NeonText color="#888">Loading stats...</NeonText>
            </View>
        );
    }

    const gameNames = {
        scrabble: 'Word Builder',
        trivia: 'Trivia',
        'truth-or-dare': 'Truth or Dare',
        'would-you-rather': 'Would You Rather',
        'rapid-fire': 'Rapid Fire',
        'memory-match': 'Memory Match',
        'memory-chain': 'Memory Chain',
    };

    return (
        <View style={styles.container}>
            {/* Overview Stats */}
            <View style={styles.overviewRow}>
                <View style={styles.statBox}>
                    <NeonText size={28} weight="bold" color={COLORS.neonCyan} glow>
                        {stats.gamesPlayed}
                    </NeonText>
                    <NeonText size={12} color="#888">Games</NeonText>
                </View>
                <View style={styles.statBox}>
                    <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow>
                        {stats.wins}
                    </NeonText>
                    <NeonText size={12} color="#888">Wins</NeonText>
                </View>
                <View style={styles.statBox}>
                    <NeonText size={28} weight="bold" color={COLORS.hotPink} glow>
                        {stats.winRate}%
                    </NeonText>
                    <NeonText size={12} color="#888">Win Rate</NeonText>
                </View>
            </View>

            {/* Streak & Score */}
            <View style={styles.secondaryRow}>
                <View style={styles.statBoxSmall}>
                    <NeonText size={20} weight="bold" color={COLORS.electricPurple}>
                        🔥 {stats.streakDays}
                    </NeonText>
                    <NeonText size={11} color="#888">Day Streak</NeonText>
                </View>
                <View style={styles.statBoxSmall}>
                    <NeonText size={20} weight="bold" color={COLORS.neonCyan}>
                        ⭐ {stats.totalScore.toLocaleString()}
                    </NeonText>
                    <NeonText size={11} color="#888">Total Score</NeonText>
                </View>
            </View>

            {/* Game-specific stats */}
            {stats.gameStats.length > 0 && (
                <View style={styles.gameStatsSection}>
                    <NeonText size={16} weight="bold" style={styles.sectionTitle}>
                        Game Stats
                    </NeonText>
                    {stats.gameStats.slice(0, 4).map(game => (
                        <View key={game.type} style={styles.gameRow}>
                            <NeonText size={14} color={COLORS.white}>
                                {gameNames[game.type] || game.type}
                            </NeonText>
                            <View style={styles.gameRowStats}>
                                <NeonText size={12} color="#888">
                                    {game.played} played
                                </NeonText>
                                <NeonText size={12} color={COLORS.limeGlow}>
                                    {game.winRate}% win
                                </NeonText>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Achievements */}
            {stats.achievements.length > 0 && (
                <View style={styles.achievementsSection}>
                    <NeonText size={16} weight="bold" style={styles.sectionTitle}>
                        🏆 Achievements ({stats.achievements.length})
                    </NeonText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {stats.achievements.map(achievement => (
                            <View key={achievement.id} style={styles.achievementBadge}>
                                <NeonText size={12} weight="bold" color={COLORS.limeGlow}>
                                    {achievement.name}
                                </NeonText>
                                <NeonText size={10} color="#888">
                                    {achievement.description}
                                </NeonText>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: responsive(12, 16, 20),
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    overviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
    },
    statBoxSmall: {
        alignItems: 'center',
        flex: 1,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    gameStatsSection: {
        marginBottom: 16,
    },
    gameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    gameRowStats: {
        flexDirection: 'row',
        gap: 12,
    },
    achievementsSection: {
        marginTop: 8,
    },
    achievementBadge: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        minWidth: 100,
        alignItems: 'center',
    },
});

export default StatsDisplay;
