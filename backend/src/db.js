require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI environment variable is not defined!');
}

let client = null;
let db = null;

const initDB = async () => {
    if (db) return db;

    try {
        console.log('[DB] Connecting to MongoDB...');
        if (!client) {
            client = new MongoClient(MONGODB_URI);
        }
        await client.connect();
        db = client.db('playrave');
        
        // Setup collections and indexes
        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ id: 1 }, { unique: true });
        
        const roomsCollection = db.collection('rooms');
        await roomsCollection.createIndex({ "updatedAt": 1 }, { expireAfterSeconds: 86400 }); // 24h
        
        const gamesCollection = db.collection('active_games');
        await gamesCollection.createIndex({ "updatedAt": 1 }, { expireAfterSeconds: 86400 }); // 24h
        await roomsCollection.createIndex({ lastActivity: 1 }, { expireAfterSeconds: 86400 }); // Auto-expire after 24h

        console.log('[DB] MongoDB connected successfully!');
        return db;
    } catch (error) {
        console.error('[DB] MongoDB connection error:', error);
        // Throw error to prevent the app from starting without a DB if critical
        // throw error; 
        return null;
    }
};

const getDB = () => db;

const getCollection = async (name) => {
    const database = await initDB();
    if (!database) return null;
    return database.collection(name);
};

module.exports = {
    initDB,
    getDB,
    getCollection
};
