import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = '@playrave_player_stats';

/**
 * Player Statistics Service
 * Tracks games played, wins, scores, and achievements
 */
class PlayerStatsService {
    constructor() {
        this.stats = null;
        this.initialized = false;
    }

    /**
     * Initialize stats from storage
     */
    async init() {
        if (this.initialized) return this.stats;

        try {
            const stored = await AsyncStorage.getItem(STATS_KEY);
            this.stats = stored ? JSON.parse(stored) : this.getDefaultStats();
            this.initialized = true;
            return this.stats;
        } catch (error) {
            console.error('[Stats] Failed to load stats:', error);
            this.stats = this.getDefaultStats();
            this.initialized = true;
            return this.stats;
        }
    }

    /**
     * Get default stats structure
     */
    getDefaultStats() {
        return {
            totalGamesPlayed: 0,
            totalWins: 0,
            totalScore: 0,
            gamesPlayedByType: {},
            winsByType: {},
            highScoresByType: {},
            achievements: [],
            lastPlayed: null,
            streakDays: 0,
            lastStreakDate: null,
        };
    }

    /**
     * Get current stats
     */
    async getStats() {
        if (!this.initialized) await this.init();
        return this.stats;
    }

    /**
     * Save stats to storage
     */
    async saveStats() {
        try {
            await AsyncStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
        } catch (error) {
            console.error('[Stats] Failed to save stats:', error);
        }
    }

    /**
     * Record a game result
     */
    async recordGame(gameType, { won = false, score = 0, players = [] }) {
        if (!this.initialized) await this.init();

        // Update totals
        this.stats.totalGamesPlayed++;
        if (won) this.stats.totalWins++;
        this.stats.totalScore += score;

        // Update by game type
        if (!this.stats.gamesPlayedByType[gameType]) {
            this.stats.gamesPlayedByType[gameType] = 0;
            this.stats.winsByType[gameType] = 0;
            this.stats.highScoresByType[gameType] = 0;
        }
        this.stats.gamesPlayedByType[gameType]++;
        if (won) this.stats.winsByType[gameType]++;
        if (score > (this.stats.highScoresByType[gameType] || 0)) {
            this.stats.highScoresByType[gameType] = score;
        }

        // Update streak
        this.updateStreak();

        // Check achievements
        this.checkAchievements(gameType, won, score);

        // Update last played
        this.stats.lastPlayed = new Date().toISOString();

        await this.saveStats();
        return this.stats;
    }

    /**
     * Update daily streak
     */
    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.stats.lastStreakDate;

        if (!lastDate) {
            this.stats.streakDays = 1;
            this.stats.lastStreakDate = today;
        } else if (lastDate === today) {
            // Same day, no change
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate === yesterday.toDateString()) {
                this.stats.streakDays++;
                this.stats.lastStreakDate = today;
            } else {
                // Streak broken
                this.stats.streakDays = 1;
                this.stats.lastStreakDate = today;
            }
        }
    }

    /**
     * Check and award achievements
     */
    checkAchievements(gameType, won, score) {
        const achievements = this.stats.achievements;
        const addAchievement = (id, name, description) => {
            if (!achievements.find(a => a.id === id)) {
                achievements.push({
                    id,
                    name,
                    description,
                    unlockedAt: new Date().toISOString()
                });
            }
        };

        // First game
        if (this.stats.totalGamesPlayed === 1) {
            addAchievement('first_game', 'First Steps', 'Play your first game');
        }

        // First win
        if (this.stats.totalWins === 1) {
            addAchievement('first_win', 'Winner!', 'Win your first game');
        }

        // 10 games
        if (this.stats.totalGamesPlayed === 10) {
            addAchievement('games_10', 'Regular Player', 'Play 10 games');
        }

        // 50 games
        if (this.stats.totalGamesPlayed === 50) {
            addAchievement('games_50', 'Dedicated', 'Play 50 games');
        }

        // 10 wins
        if (this.stats.totalWins === 10) {
            addAchievement('wins_10', 'Champion', 'Win 10 games');
        }

        // 7-day streak
        if (this.stats.streakDays >= 7) {
            addAchievement('streak_7', 'On Fire!', 'Play for 7 days in a row');
        }

        // High scorer (100+ in a game)
        if (score >= 100) {
            addAchievement('high_scorer', 'High Scorer', 'Score 100+ in a single game');
        }

        // Word Builder master (500+ in Scrabble)
        if (gameType === 'scrabble' && score >= 500) {
            addAchievement('word_master', 'Word Master', 'Score 500+ in Word Builder');
        }
    }

    /**
     * Get win rate percentage
     */
    getWinRate() {
        if (this.stats.totalGamesPlayed === 0) return 0;
        return Math.round((this.stats.totalWins / this.stats.totalGamesPlayed) * 100);
    }

    /**
     * Get win rate for specific game type
     */
    getWinRateByType(gameType) {
        const games = this.stats.gamesPlayedByType[gameType] || 0;
        const wins = this.stats.winsByType[gameType] || 0;
        if (games === 0) return 0;
        return Math.round((wins / games) * 100);
    }

    /**
     * Get formatted stats for display
     */
    async getFormattedStats() {
        if (!this.initialized) await this.init();

        return {
            gamesPlayed: this.stats.totalGamesPlayed,
            wins: this.stats.totalWins,
            winRate: this.getWinRate(),
            totalScore: this.stats.totalScore,
            streakDays: this.stats.streakDays,
            achievements: this.stats.achievements,
            favoriteGame: this.getFavoriteGame(),
            gameStats: Object.keys(this.stats.gamesPlayedByType).map(type => ({
                type,
                played: this.stats.gamesPlayedByType[type],
                wins: this.stats.winsByType[type] || 0,
                highScore: this.stats.highScoresByType[type] || 0,
                winRate: this.getWinRateByType(type)
            }))
        };
    }

    /**
     * Get favorite (most played) game
     */
    getFavoriteGame() {
        const games = this.stats.gamesPlayedByType;
        let favorite = null;
        let maxPlayed = 0;

        for (const [type, count] of Object.entries(games)) {
            if (count > maxPlayed) {
                maxPlayed = count;
                favorite = type;
            }
        }

        return favorite;
    }

    /**
     * Reset all stats
     */
    async resetStats() {
        this.stats = this.getDefaultStats();
        await this.saveStats();
        return this.stats;
    }
}

// Export singleton instance
export default new PlayerStatsService();
