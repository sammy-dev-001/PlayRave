const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'playrave-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load users from file
const loadUsers = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading users:', e);
    }
    return {};
};

// Save users to file
const saveUsers = (users) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users:', e);
    }
};

let users = loadUsers();

class AuthManager {
    // Generate JWT token
    generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return null;
        }
    }

    // Register new user
    async register(email, password, username) {
        email = email.toLowerCase().trim();

        if (Object.values(users).find(u => u.email === email)) {
            return { error: 'Email already registered' };
        }

        if (Object.values(users).find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { error: 'Username already taken' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            id: uuidv4(),
            email,
            username,
            password: hashedPassword,
            avatar: this.getRandomAvatar(),
            level: 1,
            xp: 0,
            totalXp: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            achievements: [],
            stats: {
                buttonMash: { played: 0, won: 0, bestTaps: 0 },
                typeRace: { played: 0, won: 0, bestAccuracy: 0 },
                mathBlitz: { played: 0, won: 0, bestStreak: 0 },
                colorRush: { played: 0, won: 0, bestScore: 0 },
                ticTacToe: { played: 0, won: 0 },
                drawBattle: { played: 0, won: 0, mostVotes: 0 },
                trivia: { played: 0, won: 0, correctAnswers: 0 }
            },
            dailyChallenges: [],
            weeklyChallenges: [],
            lastDailyReset: null,
            lastWeeklyReset: null,
            createdAt: new Date().toISOString()
        };

        users[user.id] = user;
        saveUsers(users);

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    // Login user
    async login(email, password) {
        email = email.toLowerCase().trim();

        const user = Object.values(users).find(u => u.email === email);
        if (!user) {
            return { error: 'Invalid email or password' };
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return { error: 'Invalid email or password' };
        }

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    // Get user by token
    getUserByToken(token) {
        const decoded = this.verifyToken(token);
        if (!decoded) return null;

        const user = users[decoded.id];
        return user ? this.sanitizeUser(user) : null;
    }

    // Get user by ID
    getUserById(id) {
        const user = users[id];
        return user ? this.sanitizeUser(user) : null;
    }

    // Update user stats after game
    updateStats(userId, gameType, stats) {
        const user = users[userId];
        if (!user) return null;

        user.gamesPlayed++;
        if (stats.won) user.gamesWon++;

        // Add XP
        const xpGained = this.calculateXP(gameType, stats);
        user.xp += xpGained;
        user.totalXp += xpGained;

        // Level up check
        const xpForNextLevel = this.getXPForLevel(user.level);
        while (user.xp >= xpForNextLevel) {
            user.xp -= xpForNextLevel;
            user.level++;
        }

        // Update game-specific stats
        if (user.stats[gameType]) {
            user.stats[gameType].played++;
            if (stats.won) user.stats[gameType].won++;

            // Update best scores
            if (stats.taps && stats.taps > (user.stats[gameType].bestTaps || 0)) {
                user.stats[gameType].bestTaps = stats.taps;
            }
            if (stats.accuracy && stats.accuracy > (user.stats[gameType].bestAccuracy || 0)) {
                user.stats[gameType].bestAccuracy = stats.accuracy;
            }
        }

        saveUsers(users);
        return { xpGained, newLevel: user.level, newXp: user.xp };
    }

    calculateXP(gameType, stats) {
        let xp = 25; // Base participation XP
        if (stats.won) xp += 100;
        if (stats.position === 2) xp += 50;
        if (stats.position === 3) xp += 25;
        return xp;
    }

    getXPForLevel(level) {
        if (level <= 5) return 100;
        if (level <= 10) return 200;
        if (level <= 20) return 300;
        return 500;
    }

    getRandomAvatar() {
        const avatars = ['😎', '🎮', '🎯', '🔥', '⚡', '🌟', '🎪', '🎭', '👾', '🤖', '🦄', '🐉'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    // Remove sensitive data
    sanitizeUser(user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }

    // Get leaderboard
    getLeaderboard(limit = 50) {
        return Object.values(users)
            .map(u => ({
                id: u.id,
                username: u.username,
                avatar: u.avatar,
                level: u.level,
                totalXp: u.totalXp,
                gamesWon: u.gamesWon
            }))
            .sort((a, b) => b.totalXp - a.totalXp)
            .slice(0, limit);
    }
}

module.exports = new AuthManager();
