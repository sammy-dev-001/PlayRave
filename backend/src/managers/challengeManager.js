const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/challenges.json');

// Challenge templates
const DAILY_CHALLENGES = [
    { type: 'play_any', target: 1, xp: 25, description: 'Play any game' },
    { type: 'play_any', target: 3, xp: 50, description: 'Play 3 games' },
    { type: 'win_any', target: 1, xp: 75, description: 'Win a game' },
    { type: 'win_any', target: 2, xp: 100, description: 'Win 2 games' },
    { type: 'play_specific', games: ['trivia'], target: 1, xp: 40, description: 'Play Trivia' },
    { type: 'play_specific', games: ['type-race'], target: 1, xp: 40, description: 'Play Type Race' },
    { type: 'play_specific', games: ['math-blitz'], target: 1, xp: 40, description: 'Play Math Blitz' },
    { type: 'play_specific', games: ['button-mash'], target: 1, xp: 40, description: 'Play Button Mash' },
    { type: 'accuracy', game: 'type-race', threshold: 90, xp: 100, description: 'Get 90%+ accuracy in Type Race' },
    { type: 'score', game: 'button-mash', threshold: 50, xp: 75, description: 'Get 50+ taps in Button Mash' }
];

const WEEKLY_CHALLENGES = [
    { type: 'play_any', target: 10, xp: 300, description: 'Play 10 games this week' },
    { type: 'win_any', target: 5, xp: 400, description: 'Win 5 games this week' },
    { type: 'play_variety', target: 5, xp: 500, description: 'Play 5 different game types' },
    { type: 'streak', target: 3, xp: 350, description: 'Win 3 games in a row' },
    { type: 'social', target: 5, xp: 250, description: 'Play with 5 different players' }
];

// Load data
const loadData = () => {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading challenges:', e);
    }
    return {};
};

const saveData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving challenges:', e);
    }
};

let userData = loadData();

class ChallengeManager {
    // Get user's challenges, generating new ones if needed
    getUserChallenges(userId) {
        if (!userData[userId]) {
            userData[userId] = { daily: [], weekly: [], lastDailyReset: null, lastWeeklyReset: null };
        }

        const user = userData[userId];
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekStart = this.getWeekStart(now);

        // Check if daily reset needed
        if (user.lastDailyReset !== today) {
            user.daily = this.generateDailyChallenges();
            user.lastDailyReset = today;
            saveData(userData);
        }

        // Check if weekly reset needed
        if (user.lastWeeklyReset !== weekStart) {
            user.weekly = this.generateWeeklyChallenges();
            user.lastWeeklyReset = weekStart;
            saveData(userData);
        }

        return {
            daily: user.daily,
            weekly: user.weekly,
            dailyResetIn: this.getTimeUntilMidnight(),
            weeklyResetIn: this.getTimeUntilSunday()
        };
    }

    generateDailyChallenges() {
        // Pick 3 random daily challenges
        const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3).map((c, i) => ({
            id: `daily-${Date.now()}-${i}`,
            ...c,
            progress: 0,
            completed: false,
            claimed: false
        }));
    }

    generateWeeklyChallenges() {
        // Pick 2 random weekly challenges
        const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2).map((c, i) => ({
            id: `weekly-${Date.now()}-${i}`,
            ...c,
            progress: 0,
            completed: false,
            claimed: false
        }));
    }

    // Update progress after a game
    updateProgress(userId, gameData) {
        if (!userData[userId]) return;

        const user = userData[userId];
        const { gameType, won, score, accuracy, players } = gameData;

        // Track unique games and players for variety challenges
        if (!user.gamesPlayed) user.gamesPlayed = new Set();
        if (!user.playersPlayed) user.playersPlayed = new Set();
        user.gamesPlayed.add(gameType);
        if (players) players.forEach(p => user.playersPlayed.add(p));

        // Update daily challenges
        user.daily?.forEach(c => {
            if (c.completed) return;

            if (c.type === 'play_any') {
                c.progress++;
            } else if (c.type === 'win_any' && won) {
                c.progress++;
            } else if (c.type === 'play_specific' && c.games?.includes(gameType)) {
                c.progress++;
            } else if (c.type === 'accuracy' && c.game === gameType && accuracy >= c.threshold) {
                c.progress = 1;
            } else if (c.type === 'score' && c.game === gameType && score >= c.threshold) {
                c.progress = 1;
            }

            if (c.progress >= c.target) c.completed = true;
        });

        // Update weekly challenges
        user.weekly?.forEach(c => {
            if (c.completed) return;

            if (c.type === 'play_any') {
                c.progress++;
            } else if (c.type === 'win_any' && won) {
                c.progress++;
            } else if (c.type === 'play_variety') {
                c.progress = user.gamesPlayed.size;
            } else if (c.type === 'social') {
                c.progress = user.playersPlayed.size;
            } else if (c.type === 'streak' && won) {
                c.progress++;
            } else if (c.type === 'streak' && !won) {
                c.progress = 0; // Reset streak on loss
            }

            if (c.progress >= c.target) c.completed = true;
        });

        saveData(userData);
        return this.getUserChallenges(userId);
    }

    // Claim reward for completed challenge
    claimReward(userId, challengeId) {
        if (!userData[userId]) return { error: 'User not found' };

        const user = userData[userId];
        const allChallenges = [...(user.daily || []), ...(user.weekly || [])];
        const challenge = allChallenges.find(c => c.id === challengeId);

        if (!challenge) return { error: 'Challenge not found' };
        if (!challenge.completed) return { error: 'Challenge not completed' };
        if (challenge.claimed) return { error: 'Already claimed' };

        challenge.claimed = true;
        saveData(userData);

        return { xp: challenge.xp, challenge };
    }

    getWeekStart(date) {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split('T')[0];
    }

    getTimeUntilMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return Math.floor((midnight - now) / 1000);
    }

    getTimeUntilSunday() {
        const now = new Date();
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        const sunday = new Date(now);
        sunday.setDate(sunday.getDate() + daysUntilSunday);
        sunday.setHours(0, 0, 0, 0);
        return Math.floor((sunday - now) / 1000);
    }
}

module.exports = new ChallengeManager();
