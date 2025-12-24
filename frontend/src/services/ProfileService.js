import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@playrave_profile';
const STATS_KEY = '@playrave_stats';

// Default profile
const defaultProfile = {
    name: '',
    avatarId: 'fox',
    avatarColor: '#FF6B6B',
    createdAt: null,
};

// Default stats
const defaultStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalPoints: 0,
    favoriteGame: null,
    gameStats: {}, // Per-game stats
    achievements: [],
    lastPlayed: null,
};

// Profile Service - handles player profile and stats persistence
const ProfileService = {
    // Initialize profile
    async init() {
        try {
            const profile = await this.getProfile();
            if (!profile.createdAt) {
                await this.saveProfile({
                    ...profile,
                    createdAt: new Date().toISOString()
                });
            }
            return profile;
        } catch (error) {
            console.error('Error initializing profile:', error);
            return defaultProfile;
        }
    },

    // Get player profile
    async getProfile() {
        try {
            const json = await AsyncStorage.getItem(PROFILE_KEY);
            return json ? { ...defaultProfile, ...JSON.parse(json) } : defaultProfile;
        } catch (error) {
            console.error('Error getting profile:', error);
            return defaultProfile;
        }
    },

    // Save player profile
    async saveProfile(profile) {
        try {
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    },

    // Update profile fields
    async updateProfile(updates) {
        try {
            const current = await this.getProfile();
            const updated = { ...current, ...updates };
            await this.saveProfile(updated);
            return updated;
        } catch (error) {
            console.error('Error updating profile:', error);
            return null;
        }
    },

    // Get player stats
    async getStats() {
        try {
            const json = await AsyncStorage.getItem(STATS_KEY);
            return json ? { ...defaultStats, ...JSON.parse(json) } : defaultStats;
        } catch (error) {
            console.error('Error getting stats:', error);
            return defaultStats;
        }
    },

    // Save stats
    async saveStats(stats) {
        try {
            await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.error('Error saving stats:', error);
            return false;
        }
    },

    // Record a game played
    async recordGame(gameType, won, points) {
        try {
            const stats = await this.getStats();

            // Update general stats
            stats.gamesPlayed += 1;
            if (won) stats.gamesWon += 1;
            stats.totalPoints += points;
            stats.lastPlayed = new Date().toISOString();

            // Update per-game stats
            if (!stats.gameStats[gameType]) {
                stats.gameStats[gameType] = {
                    played: 0,
                    won: 0,
                    totalPoints: 0,
                    highScore: 0,
                };
            }
            stats.gameStats[gameType].played += 1;
            if (won) stats.gameStats[gameType].won += 1;
            stats.gameStats[gameType].totalPoints += points;
            if (points > stats.gameStats[gameType].highScore) {
                stats.gameStats[gameType].highScore = points;
            }

            // Update favorite game
            const mostPlayed = Object.entries(stats.gameStats)
                .sort(([, a], [, b]) => b.played - a.played)[0];
            if (mostPlayed) {
                stats.favoriteGame = mostPlayed[0];
            }

            // Check for achievements
            await this.checkAchievements(stats);

            await this.saveStats(stats);
            return stats;
        } catch (error) {
            console.error('Error recording game:', error);
            return null;
        }
    },

    // Check and award achievements
    async checkAchievements(stats) {
        const newAchievements = [];

        // First game
        if (stats.gamesPlayed === 1 && !stats.achievements.includes('first_game')) {
            newAchievements.push({
                id: 'first_game',
                name: 'First Game!',
                emoji: '🎮',
                date: new Date().toISOString()
            });
        }

        // 10 games
        if (stats.gamesPlayed >= 10 && !stats.achievements.includes('10_games')) {
            newAchievements.push({
                id: '10_games',
                name: 'Veteran',
                emoji: '🎖️',
                date: new Date().toISOString()
            });
        }

        // 50 games
        if (stats.gamesPlayed >= 50 && !stats.achievements.includes('50_games')) {
            newAchievements.push({
                id: '50_games',
                name: 'Party Legend',
                emoji: '🏆',
                date: new Date().toISOString()
            });
        }

        // First win
        if (stats.gamesWon === 1 && !stats.achievements.includes('first_win')) {
            newAchievements.push({
                id: 'first_win',
                name: 'First Victory!',
                emoji: '🥇',
                date: new Date().toISOString()
            });
        }

        // 10 wins
        if (stats.gamesWon >= 10 && !stats.achievements.includes('10_wins')) {
            newAchievements.push({
                id: '10_wins',
                name: 'Champion',
                emoji: '👑',
                date: new Date().toISOString()
            });
        }

        // 1000 points
        if (stats.totalPoints >= 1000 && !stats.achievements.includes('1000_points')) {
            newAchievements.push({
                id: '1000_points',
                name: 'Point Collector',
                emoji: '💎',
                date: new Date().toISOString()
            });
        }

        // 5 different games
        if (Object.keys(stats.gameStats).length >= 5 && !stats.achievements.includes('5_games_played')) {
            newAchievements.push({
                id: '5_games_played',
                name: 'Variety Lover',
                emoji: '🎲',
                date: new Date().toISOString()
            });
        }

        // Add new achievements
        if (newAchievements.length > 0) {
            stats.achievements = [
                ...stats.achievements,
                ...newAchievements.map(a => a.id)
            ];
        }

        return newAchievements;
    },

    // Get win rate
    getWinRate(stats) {
        if (stats.gamesPlayed === 0) return 0;
        return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
    },

    // Get average points per game
    getAveragePoints(stats) {
        if (stats.gamesPlayed === 0) return 0;
        return Math.round(stats.totalPoints / stats.gamesPlayed);
    },

    // Clear all data
    async clearAllData() {
        try {
            await AsyncStorage.multiRemove([PROFILE_KEY, STATS_KEY]);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
};

export default ProfileService;
