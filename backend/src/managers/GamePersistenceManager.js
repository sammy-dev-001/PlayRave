const dbHelper = require('../db');

class GamePersistenceManager {
    async _getCollection() {
        return await dbHelper.getCollection('active_games');
    }

    async saveGame(roomId, gameType, state) {
        try {
            const collection = await this._getCollection();
            if (!collection) return;

            // Strip circular references if any
            const persistableState = JSON.parse(JSON.stringify(state));

            await collection.updateOne(
                { roomId },
                { 
                    $set: { 
                        gameType, 
                        state: persistableState, 
                        updatedAt: new Date() 
                    } 
                },
                { upsert: true }
            );
        } catch (e) {
            console.error(`[GamePersistence] Save error for room ${roomId}:`, e);
        }
    }

    async loadGame(roomId) {
        try {
            const collection = await this._getCollection();
            if (!collection) return null;

            const record = await collection.findOne({ roomId });
            return record ? record : null;
        } catch (e) {
            console.error(`[GamePersistence] Load error for room ${roomId}:`, e);
            return null;
        }
    }

    async deleteGame(roomId) {
        try {
            const collection = await this._getCollection();
            if (collection) {
                await collection.deleteOne({ roomId });
            }
        } catch (e) {
            console.error(`[GamePersistence] Delete error for room ${roomId}:`, e);
        }
    }
}

module.exports = new GamePersistenceManager();
