import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Keys for offline storage
const OFFLINE_GAMES_KEY = '@playrave_offline_games';
const OFFLINE_DATA_KEY = '@playrave_offline_data';

// Offline Mode Service - enables local games to work without internet
const OfflineService = {
    isOnline: true,
    listeners: [],

    // Initialize the service
    async init() {
        // Subscribe to network state changes
        NetInfo.addEventListener(state => {
            const wasOnline = this.isOnline;
            this.isOnline = state.isConnected && state.isInternetReachable;

            // Notify listeners if status changed
            if (wasOnline !== this.isOnline) {
                this.notifyListeners();
            }
        });

        // Check initial state
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected && state.isInternetReachable;

        return this.isOnline;
    },

    // Add listener for connectivity changes
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.isOnline);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    },

    // Check if currently online
    async checkConnection() {
        try {
            const state = await NetInfo.fetch();
            this.isOnline = state.isConnected && state.isInternetReachable;
            return this.isOnline;
        } catch (error) {
            return false;
        }
    },

    // Save game data for offline use
    async cacheGameData(gameType, data) {
        try {
            const existing = await this.getCachedGameData();
            existing[gameType] = {
                data,
                cachedAt: new Date().toISOString()
            };
            await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(existing));
            return true;
        } catch (error) {
            console.error('Error caching game data:', error);
            return false;
        }
    },

    // Get cached game data
    async getCachedGameData(gameType = null) {
        try {
            const json = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
            const data = json ? JSON.parse(json) : {};

            if (gameType) {
                return data[gameType]?.data || null;
            }
            return data;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return gameType ? null : {};
        }
    },

    // Save an offline game session
    async saveOfflineGame(gameData) {
        try {
            const games = await this.getOfflineGames();
            games.push({
                id: Date.now(),
                ...gameData,
                savedAt: new Date().toISOString(),
                synced: false
            });
            await AsyncStorage.setItem(OFFLINE_GAMES_KEY, JSON.stringify(games));
            return true;
        } catch (error) {
            console.error('Error saving offline game:', error);
            return false;
        }
    },

    // Get all offline games
    async getOfflineGames() {
        try {
            const json = await AsyncStorage.getItem(OFFLINE_GAMES_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error getting offline games:', error);
            return [];
        }
    },

    // Sync offline games when back online
    async syncOfflineGames(uploadFunction) {
        if (!this.isOnline) return { success: false, reason: 'offline' };

        try {
            const games = await this.getOfflineGames();
            const unsyncedGames = games.filter(g => !g.synced);

            if (unsyncedGames.length === 0) {
                return { success: true, synced: 0 };
            }

            let syncedCount = 0;
            for (const game of unsyncedGames) {
                try {
                    await uploadFunction(game);
                    game.synced = true;
                    syncedCount++;
                } catch (e) {
                    console.error('Failed to sync game:', game.id, e);
                }
            }

            // Save updated games list
            await AsyncStorage.setItem(OFFLINE_GAMES_KEY, JSON.stringify(games));

            return { success: true, synced: syncedCount, total: unsyncedGames.length };
        } catch (error) {
            console.error('Error syncing offline games:', error);
            return { success: false, error };
        }
    },

    // Clear all offline data
    async clearOfflineData() {
        try {
            await AsyncStorage.multiRemove([OFFLINE_GAMES_KEY, OFFLINE_DATA_KEY]);
            return true;
        } catch (error) {
            console.error('Error clearing offline data:', error);
            return false;
        }
    },

    // Pre-cache essential game data for offline play
    async preCacheForOffline() {
        // Import data files dynamically
        const dataSets = {
            'truth-or-dare': require('../data/truthOrDarePrompts').default,
            'rapid-fire': require('../data/rapidFirePrompts'),
            'never-have-i': require('../data/neverHaveIEverPrompts'),
            'caption-this': require('../data/captionPrompts'),
            'speed-categories': require('../data/speedCategories'),
            'avatars': require('../data/avatars'),
        };

        for (const [key, data] of Object.entries(dataSets)) {
            await this.cacheGameData(key, data);
        }

        return true;
    }
};

export default OfflineService;
