const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'playrave-secret-key-change-in-production';

// MongoDB connection string - password is URL encoded (& = %26, % = %25)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://samueldaniyan564_db_user:sammy123%26%25@cluster0.0ykmcom.mongodb.net/playrave?retryWrites=true&w=majority&appName=Cluster0';

let db = null;
let usersCollection = null;

// Initialize MongoDB connection
const initDB = async () => {
    if (db) return db;

    try {
        console.log('Connecting to MongoDB...');
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('playrave');
        usersCollection = db.collection('users');

        // Create index on email for faster lookups
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ username: 1 });

        console.log('MongoDB connected successfully!');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Initialize on module load
initDB().catch(console.error);

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
        await initDB();

        email = email.toLowerCase().trim();

        // Check if email already exists
        const existingEmail = await usersCollection.findOne({ email });
        if (existingEmail) {
            return { error: 'Email already registered' };
        }

        // Check if username already exists (case-insensitive)
        const existingUsername = await usersCollection.findOne({
            username: { $regex: new RegExp(`^${username}$`, 'i') }
        });
        if (existingUsername) {
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

        await usersCollection.insertOne(user);

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    // Login user
    async login(email, password) {
        await initDB();

        email = email.toLowerCase().trim();

        const user = await usersCollection.findOne({ email });
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
    async getUserByToken(token) {
        const decoded = this.verifyToken(token);
        if (!decoded) return null;

        await initDB();
        const user = await usersCollection.findOne({ id: decoded.id });
        return user ? this.sanitizeUser(user) : null;
    }

    // Get user by ID
    async getUserById(id) {
        await initDB();
        const user = await usersCollection.findOne({ id });
        return user ? this.sanitizeUser(user) : null;
    }

    // Update user stats after game
    async updateStats(userId, gameType, stats) {
        await initDB();

        const user = await usersCollection.findOne({ id: userId });
        if (!user) return null;

        user.gamesPlayed++;
        if (stats.won) user.gamesWon++;

        // Add XP
        const xpGained = this.calculateXP(gameType, stats);
        user.xp += xpGained;
        user.totalXp += xpGained;

        // Level up check
        let xpForNextLevel = this.getXPForLevel(user.level);
        while (user.xp >= xpForNextLevel) {
            user.xp -= xpForNextLevel;
            user.level++;
            xpForNextLevel = this.getXPForLevel(user.level);
        }

        // Update game-specific stats
        if (user.stats && user.stats[gameType]) {
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

        // Save updated user to MongoDB
        await usersCollection.updateOne(
            { id: userId },
            {
                $set: {
                    gamesPlayed: user.gamesPlayed,
                    gamesWon: user.gamesWon,
                    xp: user.xp,
                    totalXp: user.totalXp,
                    level: user.level,
                    stats: user.stats
                }
            }
        );

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
        const { password, _id, ...safeUser } = user;
        return safeUser;
    }

    // Get leaderboard
    async getLeaderboard(limit = 50) {
        await initDB();

        const users = await usersCollection
            .find({})
            .project({
                id: 1,
                username: 1,
                avatar: 1,
                level: 1,
                totalXp: 1,
                gamesWon: 1
            })
            .sort({ totalXp: -1 })
            .limit(limit)
            .toArray();

        return users;
    }
}

module.exports = new AuthManager();
