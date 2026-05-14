const dbHelper = require('./src/db');

async function testConnection() {
    console.log('Testing MongoDB connection...');
    try {
        const db = await dbHelper.initDB();
        if (db) {
            const collections = await db.listCollections().toArray();
            console.log('Connection SUCCESS!');
            console.log('Available collections:', collections.map(c => c.name));
            
            const rooms = await dbHelper.getCollection('rooms');
            const count = await rooms.countDocuments();
            console.log(`Current room count in DB: ${count}`);
            
            process.exit(0);
        } else {
            console.error('Connection FAILED: db is null');
            process.exit(1);
        }
    } catch (err) {
        console.error('Connection FAILED with error:', err);
        process.exit(1);
    }
}

testConnection();
