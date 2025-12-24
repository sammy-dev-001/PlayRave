import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import AvatarPicker, { AvatarDisplay } from '../components/AvatarPicker';
import ProfileService from '../services/ProfileService';
import { COLORS, SHADOWS } from '../constants/theme';
import { getAvatarById } from '../data/avatars';

// Achievement definitions
const ACHIEVEMENTS = {
    first_game: { name: 'First Game!', emoji: '🎮', desc: 'Play your first game' },
    '10_games': { name: 'Veteran', emoji: '🎖️', desc: 'Play 10 games' },
    '50_games': { name: 'Party Legend', emoji: '🏆', desc: 'Play 50 games' },
    first_win: { name: 'First Victory!', emoji: '🥇', desc: 'Win your first game' },
    '10_wins': { name: 'Champion', emoji: '👑', desc: 'Win 10 games' },
    '1000_points': { name: 'Point Collector', emoji: '💎', desc: 'Earn 1000 total points' },
    '5_games_played': { name: 'Variety Lover', emoji: '🎲', desc: 'Play 5 different game types' },
};

const GAME_NAMES = {
    'trivia': 'Quick Trivia',
    'myth-or-fact': 'Myth or Fact',
    'whos-most-likely': "Who's Most Likely",
    'neon-tap': 'Neon Tap Frenzy',
    'word-rush': 'Word Rush',
    'truth-or-dare': 'Truth or Dare',
    'never-have-i': 'Never Have I Ever',
    'rapid-fire': 'Rapid Fire',
    'caption-this': 'Caption This',
    'speed-categories': 'Speed Categories',
    'auction-bluff': 'Auction Bluff',
    'memory-chain': 'Memory Chain',
};

const ProfileScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileAndStats();
    }, []);

    const loadProfileAndStats = async () => {
        setLoading(true);
        const loadedProfile = await ProfileService.getProfile();
        const loadedStats = await ProfileService.getStats();
        setProfile(loadedProfile);
        setStats(loadedStats);
        setLoading(false);
    };

    const handleAvatarSelect = async ({ avatar, color }) => {
        const updated = await ProfileService.updateProfile({
            avatarId: avatar.id,
            avatarColor: color
        });
        if (updated) setProfile(updated);
    };

    const handleResetStats = () => {
        Alert.alert(
            'Reset Stats',
            'Are you sure you want to reset all your stats and achievements? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await ProfileService.clearAllData();
                        await loadProfileAndStats();
                    }
                }
            ]
        );
    };

    if (loading || !profile || !stats) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.loadingContainer}>
                    <NeonText size={24}>Loading...</NeonText>
                </View>
            </NeonContainer>
        );
    }

    const avatar = getAvatarById(profile.avatarId);
    const winRate = ProfileService.getWinRate(stats);
    const avgPoints = ProfileService.getAveragePoints(stats);

    // Sort games by most played
    const sortedGameStats = Object.entries(stats.gameStats || {})
        .sort(([, a], [, b]) => b.played - a.played);

    return (
        <NeonContainer showBackButton>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowAvatarPicker(true)}>
                        <AvatarDisplay
                            avatar={avatar}
                            color={profile.avatarColor}
                            size={100}
                        />
                        <View style={styles.editBadge}>
                            <NeonText size={12}>✏️</NeonText>
                        </View>
                    </TouchableOpacity>
                    <NeonText size={28} weight="bold" style={styles.playerName}>
                        {profile.name || 'Player'}
                    </NeonText>
                    {stats.favoriteGame && (
                        <NeonText size={12} color={COLORS.neonCyan}>
                            Favorite: {GAME_NAMES[stats.favoriteGame] || stats.favoriteGame}
                        </NeonText>
                    )}
                </View>

                {/* Quick Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <NeonText size={32} weight="bold" color={COLORS.limeGlow}>
                            {stats.gamesPlayed}
                        </NeonText>
                        <NeonText size={12} color="#888">Games</NeonText>
                    </View>
                    <View style={styles.statCard}>
                        <NeonText size={32} weight="bold" color={COLORS.neonCyan}>
                            {stats.gamesWon}
                        </NeonText>
                        <NeonText size={12} color="#888">Wins</NeonText>
                    </View>
                    <View style={styles.statCard}>
                        <NeonText size={32} weight="bold" color={COLORS.hotPink}>
                            {winRate}%
                        </NeonText>
                        <NeonText size={12} color="#888">Win Rate</NeonText>
                    </View>
                    <View style={styles.statCard}>
                        <NeonText size={32} weight="bold" color={COLORS.electricPurple}>
                            {stats.totalPoints}
                        </NeonText>
                        <NeonText size={12} color="#888">Total Points</NeonText>
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                        🏆 ACHIEVEMENTS
                    </NeonText>
                    <View style={styles.achievementsGrid}>
                        {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
                            const earned = stats.achievements?.includes(id);
                            return (
                                <View
                                    key={id}
                                    style={[
                                        styles.achievementCard,
                                        earned && styles.achievementEarned
                                    ]}
                                >
                                    <NeonText size={28} style={earned ? {} : styles.locked}>
                                        {ach.emoji}
                                    </NeonText>
                                    <NeonText
                                        size={10}
                                        color={earned ? COLORS.limeGlow : '#555'}
                                        style={styles.achName}
                                    >
                                        {ach.name}
                                    </NeonText>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Game Stats */}
                {sortedGameStats.length > 0 && (
                    <View style={styles.section}>
                        <NeonText size={18} weight="bold" style={styles.sectionTitle}>
                            📊 GAME STATS
                        </NeonText>
                        {sortedGameStats.map(([gameType, gameStat]) => (
                            <View key={gameType} style={styles.gameStatRow}>
                                <View style={styles.gameStatLeft}>
                                    <NeonText size={14}>
                                        {GAME_NAMES[gameType] || gameType}
                                    </NeonText>
                                    <NeonText size={10} color="#888">
                                        {gameStat.played} played • {gameStat.won} won
                                    </NeonText>
                                </View>
                                <View style={styles.gameStatRight}>
                                    <NeonText size={14} color={COLORS.neonCyan}>
                                        🏆 {gameStat.highScore}
                                    </NeonText>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Reset Button */}
                <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleResetStats}
                >
                    <NeonText size={12} color={COLORS.hotPink}>
                        Reset All Stats
                    </NeonText>
                </TouchableOpacity>
            </ScrollView>

            {/* Avatar Picker Modal */}
            <AvatarPicker
                visible={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={handleAvatarSelect}
                currentAvatar={avatar}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    editBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.electricPurple,
        borderRadius: 12,
        padding: 5,
    },
    playerName: {
        marginTop: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        marginBottom: 15,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    achievementCard: {
        width: 75,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    achievementEarned: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    locked: {
        opacity: 0.3,
    },
    achName: {
        marginTop: 5,
        textAlign: 'center',
    },
    gameStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginBottom: 8,
    },
    gameStatLeft: {
        flex: 1,
    },
    gameStatRight: {
        alignItems: 'flex-end',
    },
    resetBtn: {
        alignItems: 'center',
        padding: 15,
        marginBottom: 30,
    }
});

export default ProfileScreen;
