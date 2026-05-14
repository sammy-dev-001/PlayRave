const { MongoClient } = require('mongodb');

// MongoDB connection string - password is URL encoded (& = %26, % = %25)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://samueldaniyan564_db_user:sammy123%26%25@cluster0.0ykmcom.mongodb.net/playrave?retryWrites=true&w=majority&appName=Cluster0';

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
        await roomsCollection.createIndex({ id: 1 }, { unique: true });
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
