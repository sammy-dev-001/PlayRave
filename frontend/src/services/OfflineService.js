import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for offline storage
const OFFLINE_GAMES_KEY = '@playrave_offline_games';
const OFFLINE_DATA_KEY = '@playrave_offline_data';
const ACTION_QUEUE_KEY = '@playrave_action_queue';

/**
 * Enhanced Offline Service
 * Enables local games to work without internet and queues actions for sync
 */
const OfflineService = {
    isOnline: true,
    listeners: [],
    actionQueue: [],
    isSyncing: false,

    /**
     * Initialize the service
     */
    async init() {
        // Load any queued actions
        await this.loadActionQueue();

        // Check if NetInfo is available (may not be on web)
        try {
            const NetInfo = require('@react-native-community/netinfo').default;
            
            // Subscribe to network state changes
            NetInfo.addEventListener(state => {
                const wasOnline = this.isOnline;
                this.isOnline = state.isConnected && state.isInternetReachable !== false;

                // Notify listeners if status changed
                if (wasOnline !== this.isOnline) {
                    this.notifyListeners();
                    
                    // Auto-sync when coming back online
                    if (this.isOnline && !wasOnline) {
                        this.processActionQueue();
                    }
                }
            });

            // Check initial state
            const state = await NetInfo.fetch();
            this.isOnline = state.isConnected && state.isInternetReachable !== false;
        } catch (error) {
            // NetInfo not available, assume online
            console.log('NetInfo not available, assuming online');
            this.isOnline = true;
        }

        return this.isOnline;
    },

    /**
     * Add listener for connectivity changes
     */
    addListener(callback) {
        this.listeners.push(callback);
        // Immediately call with current state
        callback(this.isOnline);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.isOnline);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    },

    /**
     * Check if currently online
     */
    async checkConnection() {
        try {
            const NetInfo = require('@react-native-community/netinfo').default;
            const state = await NetInfo.fetch();
            this.isOnline = state.isConnected && state.isInternetReachable !== false;
            return this.isOnline;
        } catch (error) {
            // Fallback: try a simple fetch
            try {
                const response = await fetch('https://www.google.com/favicon.ico', {
                    method: 'HEAD',
                    mode: 'no-cors',
                });
                this.isOnline = true;
            } catch {
                this.isOnline = false;
            }
            return this.isOnline;
        }
    },

    // === Action Queue Management ===

    /**
     * Queue an action to be executed when online
     */
    async queueAction(action) {
        const queuedAction = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            action,
            timestamp: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 3,
        };

        this.actionQueue.push(queuedAction);
        await this.saveActionQueue();

        // If online, try to process immediately
        if (this.isOnline) {
            this.processActionQueue();
        }

        return queuedAction.id;
    },

    /**
     * Load action queue from storage
     */
    async loadActionQueue() {
        try {
            const json = await AsyncStorage.getItem(ACTION_QUEUE_KEY);
            this.actionQueue = json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error loading action queue:', error);
            this.actionQueue = [];
        }
    },

    /**
     * Save action queue to storage
     */
    async saveActionQueue() {
        try {
            await AsyncStorage.setItem(ACTION_QUEUE_KEY, JSON.stringify(this.actionQueue));
        } catch (error) {
            console.error('Error saving action queue:', error);
        }
    },

    /**
     * Process queued actions
     */
    async processActionQueue(processor) {
        if (!this.isOnline || this.isSyncing || this.actionQueue.length === 0) {
            return { processed: 0, failed: 0, remaining: this.actionQueue.length };
        }

        this.isSyncing = true;
        let processed = 0;
        let failed = 0;

        const processedIds = [];

        for (const item of this.actionQueue) {
            if (!this.isOnline) break;

            try {
                if (processor) {
                    await processor(item.action);
                }
                processedIds.push(item.id);
                processed++;
            } catch (error) {
                item.attempts++;
                if (item.attempts >= item.maxAttempts) {
                    processedIds.push(item.id); // Remove after max attempts
                    failed++;
                }
                console.error('Action processing failed:', error);
            }
        }

        // Remove processed items
        this.actionQueue = this.actionQueue.filter(
            item => !processedIds.includes(item.id)
        );
        await this.saveActionQueue();

        this.isSyncing = false;

        return {
            processed,
            failed,
            remaining: this.actionQueue.length,
        };
    },

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            count: this.actionQueue.length,
            isSyncing: this.isSyncing,
            isOnline: this.isOnline,
        };
    },

    // === Game Data Caching ===

    /**
     * Save game data for offline use
     */
    async cacheGameData(gameType, data) {
        try {
            const existing = await this.getCachedGameData();
            existing[gameType] = {
                data,
                cachedAt: new Date().toISOString(),
                version: 1,
            };
            await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(existing));
            return true;
        } catch (error) {
            console.error('Error caching game data:', error);
            return false;
        }
    },

    /**
     * Get cached game data
     */
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

    /**
     * Check if game data is cached
     */
    async isGameDataCached(gameType) {
        const data = await this.getCachedGameData(gameType);
        return data !== null;
    },

    // === Offline Games ===

    /**
     * Save an offline game session
     */
    async saveOfflineGame(gameData) {
        try {
            const games = await this.getOfflineGames();
            games.push({
                id: Date.now(),
                ...gameData,
                savedAt: new Date().toISOString(),
                synced: false,
            });
            await AsyncStorage.setItem(OFFLINE_GAMES_KEY, JSON.stringify(games));
            return true;
        } catch (error) {
            console.error('Error saving offline game:', error);
            return false;
        }
    },

    /**
     * Get all offline games
     */
    async getOfflineGames() {
        try {
            const json = await AsyncStorage.getItem(OFFLINE_GAMES_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error getting offline games:', error);
            return [];
        }
    },

    /**
     * Sync offline games when back online
     */
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

            await AsyncStorage.setItem(OFFLINE_GAMES_KEY, JSON.stringify(games));

            return { success: true, synced: syncedCount, total: unsyncedGames.length };
        } catch (error) {
            console.error('Error syncing offline games:', error);
            return { success: false, error };
        }
    },

    /**
     * Clear all offline data
     */
    async clearOfflineData() {
        try {
            await AsyncStorage.multiRemove([
                OFFLINE_GAMES_KEY,
                OFFLINE_DATA_KEY,
                ACTION_QUEUE_KEY,
            ]);
            this.actionQueue = [];
            return true;
        } catch (error) {
            console.error('Error clearing offline data:', error);
            return false;
        }
    },

    /**
     * Pre-cache essential game data for offline play
     */
    async preCacheForOffline() {
        try {
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

            console.log('Pre-cached all game data for offline use');
            return true;
        } catch (error) {
            console.error('Error pre-caching data:', error);
            return false;
        }
    },

    /**
     * Get storage usage info
     */
    async getStorageInfo() {
        try {
            const [gamesJson, dataJson, queueJson] = await Promise.all([
                AsyncStorage.getItem(OFFLINE_GAMES_KEY),
                AsyncStorage.getItem(OFFLINE_DATA_KEY),
                AsyncStorage.getItem(ACTION_QUEUE_KEY),
            ]);

            return {
                gamesSize: gamesJson ? gamesJson.length : 0,
                dataSize: dataJson ? dataJson.length : 0,
                queueSize: queueJson ? queueJson.length : 0,
                totalBytes: (gamesJson?.length || 0) + (dataJson?.length || 0) + (queueJson?.length || 0),
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { gamesSize: 0, dataSize: 0, queueSize: 0, totalBytes: 0 };
        }
    },
};

export default OfflineService;
