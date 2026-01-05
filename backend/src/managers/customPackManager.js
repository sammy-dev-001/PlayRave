const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/customPacks.json');

// Ensure data file exists
const ensureDataFile = () => {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
};

// Load packs from file
const loadPacks = () => {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error('Error loading custom packs:', e);
        return {};
    }
};

// Save packs to file
const savePacks = (packs) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(packs, null, 2));
    } catch (e) {
        console.error('Error saving custom packs:', e);
    }
};

let packs = loadPacks();

class CustomPackManager {
    // Create a new custom pack
    createPack(userId, packData) {
        const { name, type, isPublic = false, items = [] } = packData;

        if (!name || !type) {
            return { error: 'Name and type are required' };
        }

        const validTypes = ['truth-or-dare', 'trivia', 'never-have-i-ever', 'would-you-rather'];
        if (!validTypes.includes(type)) {
            return { error: 'Invalid pack type' };
        }

        const pack = {
            id: uuidv4(),
            userId,
            name,
            type,
            isPublic,
            items,
            plays: 0,
            likes: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        packs[pack.id] = pack;
        savePacks(packs);

        return { pack };
    }

    // Get pack by ID
    getPack(packId) {
        return packs[packId] || null;
    }

    // Get all packs by user
    getUserPacks(userId) {
        return Object.values(packs)
            .filter(p => p.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Get public packs (community packs)
    getPublicPacks(type = null, limit = 50) {
        let results = Object.values(packs).filter(p => p.isPublic);
        if (type) results = results.filter(p => p.type === type);
        return results
            .sort((a, b) => b.plays - a.plays)
            .slice(0, limit);
    }

    // Update pack
    updatePack(packId, userId, updates) {
        const pack = packs[packId];
        if (!pack) return { error: 'Pack not found' };
        if (pack.userId !== userId) return { error: 'Unauthorized' };

        const allowedUpdates = ['name', 'isPublic', 'items'];
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) pack[key] = updates[key];
        });
        pack.updatedAt = new Date().toISOString();

        savePacks(packs);
        return { pack };
    }

    // Delete pack
    deletePack(packId, userId) {
        const pack = packs[packId];
        if (!pack) return { error: 'Pack not found' };
        if (pack.userId !== userId) return { error: 'Unauthorized' };

        delete packs[packId];
        savePacks(packs);
        return { success: true };
    }

    // Add item to pack
    addItem(packId, userId, item) {
        const pack = packs[packId];
        if (!pack) return { error: 'Pack not found' };
        if (pack.userId !== userId) return { error: 'Unauthorized' };

        const newItem = {
            id: uuidv4(),
            ...item,
            createdAt: new Date().toISOString()
        };

        pack.items.push(newItem);
        pack.updatedAt = new Date().toISOString();
        savePacks(packs);

        return { item: newItem };
    }

    // Remove item from pack
    removeItem(packId, userId, itemId) {
        const pack = packs[packId];
        if (!pack) return { error: 'Pack not found' };
        if (pack.userId !== userId) return { error: 'Unauthorized' };

        pack.items = pack.items.filter(i => i.id !== itemId);
        pack.updatedAt = new Date().toISOString();
        savePacks(packs);

        return { success: true };
    }

    // Increment play count
    incrementPlays(packId) {
        const pack = packs[packId];
        if (pack) {
            pack.plays++;
            savePacks(packs);
        }
    }

    // Like/unlike pack
    toggleLike(packId, userId) {
        const pack = packs[packId];
        if (!pack) return { error: 'Pack not found' };

        if (!pack.likedBy) pack.likedBy = [];

        const index = pack.likedBy.indexOf(userId);
        if (index === -1) {
            pack.likedBy.push(userId);
            pack.likes++;
        } else {
            pack.likedBy.splice(index, 1);
            pack.likes--;
        }

        savePacks(packs);
        return { likes: pack.likes, liked: index === -1 };
    }

    // Get random items from pack
    getRandomItems(packId, count = 10) {
        const pack = packs[packId];
        if (!pack || !pack.items.length) return [];

        const shuffled = [...pack.items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}

module.exports = new CustomPackManager();
