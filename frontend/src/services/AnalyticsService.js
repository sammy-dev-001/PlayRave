import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AnalyticsService - Track user engagement and app performance
 * Local-first analytics that can be synced to a server later
 */

// Storage keys
const ANALYTICS_KEY = '@playrave_analytics';
const SESSION_KEY = '@playrave_session';

// Event types
export const AnalyticsEvent = {
    // App lifecycle
    APP_OPEN: 'app_open',
    APP_CLOSE: 'app_close',

    // Game events
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    GAME_WIN: 'game_win',
    ROUND_COMPLETE: 'round_complete',

    // Room events
    ROOM_CREATE: 'room_create',
    ROOM_JOIN: 'room_join',
    ROOM_LEAVE: 'room_leave',

    // User actions
    BUTTON_CLICK: 'button_click',
    SCREEN_VIEW: 'screen_view',
    FEATURE_USE: 'feature_use',

    // Errors
    ERROR: 'error',
    SOCKET_ERROR: 'socket_error',

    // Performance
    LOAD_TIME: 'load_time',
};

class AnalyticsService {
    isInitialized = false;
    sessionId = null;
    sessionStart = null;
    events = [];
    gameStats = {};
    maxEventsInMemory = 100;

    // Feature flags
    isEnabled = true;
    debugMode = __DEV__;

    async init() {
        if (this.isInitialized) return;

        try {
            // Start a new session
            this.sessionId = this.generateSessionId();
            this.sessionStart = Date.now();

            // Load existing analytics data
            await this.loadAnalytics();

            // Track app open
            this.track(AnalyticsEvent.APP_OPEN);

            this.isInitialized = true;
            console.log('AnalyticsService initialized, session:', this.sessionId);
        } catch (error) {
            console.error('AnalyticsService init error:', error);
        }
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Enable or disable analytics
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * Track an event
     * @param {string} eventName - Event name from AnalyticsEvent
     * @param {Object} properties - Additional event properties
     */
    track(eventName, properties = {}) {
        if (!this.isEnabled) return;

        const event = {
            name: eventName,
            properties,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
        };

        this.events.push(event);

        // Trim events if too many in memory
        if (this.events.length > this.maxEventsInMemory) {
            this.events = this.events.slice(-this.maxEventsInMemory);
        }

        if (this.debugMode) {
            console.log('[Analytics]', eventName, properties);
        }

        // Auto-save periodically
        if (this.events.length % 10 === 0) {
            this.saveAnalytics();
        }
    }

    /**
     * Track screen view
     */
    trackScreen(screenName, params = {}) {
        this.track(AnalyticsEvent.SCREEN_VIEW, {
            screen: screenName,
            ...params,
        });
    }

    /**
     * Track game start
     */
    trackGameStart(gameType, playerCount, isOnline = true) {
        this.track(AnalyticsEvent.GAME_START, {
            gameType,
            playerCount,
            isOnline,
        });

        // Update game stats
        if (!this.gameStats[gameType]) {
            this.gameStats[gameType] = { played: 0, won: 0, totalTime: 0 };
        }
        this.gameStats[gameType].played++;
    }

    /**
     * Track game end
     */
    trackGameEnd(gameType, duration, didWin = false, score = 0) {
        this.track(AnalyticsEvent.GAME_END, {
            gameType,
            duration,
            didWin,
            score,
        });

        if (this.gameStats[gameType]) {
            this.gameStats[gameType].totalTime += duration;
            if (didWin) {
                this.gameStats[gameType].won++;
            }
        }
    }

    /**
     * Track error
     */
    trackError(errorType, message, context = {}) {
        this.track(AnalyticsEvent.ERROR, {
            errorType,
            message,
            ...context,
        });
    }

    /**
     * Track load time
     */
    trackLoadTime(screen, duration) {
        this.track(AnalyticsEvent.LOAD_TIME, {
            screen,
            duration,
        });
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        if (!this.sessionStart) return 0;
        return Date.now() - this.sessionStart;
    }

    /**
     * Get game statistics
     */
    getGameStats() {
        return { ...this.gameStats };
    }

    /**
     * Get most played games
     */
    getMostPlayedGames(limit = 5) {
        return Object.entries(this.gameStats)
            .map(([game, stats]) => ({ game, ...stats }))
            .sort((a, b) => b.played - a.played)
            .slice(0, limit);
    }

    /**
     * Get event count by type
     */
    getEventCounts() {
        const counts = {};
        this.events.forEach(event => {
            counts[event.name] = (counts[event.name] || 0) + 1;
        });
        return counts;
    }

    /**
     * Load analytics from storage
     */
    async loadAnalytics() {
        try {
            const json = await AsyncStorage.getItem(ANALYTICS_KEY);
            if (json) {
                const data = JSON.parse(json);
                this.gameStats = data.gameStats || {};
                // Don't load old events, start fresh each session
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    /**
     * Save analytics to storage
     */
    async saveAnalytics() {
        try {
            const data = {
                gameStats: this.gameStats,
                lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    }

    /**
     * Export analytics data for sync
     */
    async exportForSync() {
        return {
            sessionId: this.sessionId,
            sessionDuration: this.getSessionDuration(),
            events: [...this.events],
            gameStats: { ...this.gameStats },
            exportedAt: new Date().toISOString(),
        };
    }

    /**
     * Clear all analytics data
     */
    async clearAnalytics() {
        this.events = [];
        this.gameStats = {};
        try {
            await AsyncStorage.removeItem(ANALYTICS_KEY);
            console.log('Analytics cleared');
        } catch (error) {
            console.error('Error clearing analytics:', error);
        }
    }

    /**
     * End session (call on app close)
     */
    async endSession() {
        this.track(AnalyticsEvent.APP_CLOSE, {
            sessionDuration: this.getSessionDuration(),
        });
        await this.saveAnalytics();
    }
}

// Create and export singleton
const analyticsService = new AnalyticsService();
export default analyticsService;
