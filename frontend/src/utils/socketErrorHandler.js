/**
 * Centralized Socket Error Handler
 * Provides consistent error handling and logging for socket events
 */

// Error types for categorization
export const SocketErrorType = {
    CONNECTION: 'connection',
    ROOM: 'room',
    GAME: 'game',
    NETWORK: 'network',
    UNKNOWN: 'unknown',
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

/**
 * Format error for logging
 */
function formatError(error) {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
        };
    }
    return { message: String(error) };
}

/**
 * Categorize error based on message or type
 */
function categorizeError(error) {
    const message = (error.message || String(error)).toLowerCase();

    if (message.includes('connection') || message.includes('connect')) {
        return SocketErrorType.CONNECTION;
    }
    if (message.includes('room') || message.includes('join') || message.includes('leave')) {
        return SocketErrorType.ROOM;
    }
    if (message.includes('game') || message.includes('answer') || message.includes('vote')) {
        return SocketErrorType.GAME;
    }
    if (message.includes('network') || message.includes('timeout')) {
        return SocketErrorType.NETWORK;
    }
    return SocketErrorType.UNKNOWN;
}

/**
 * Error log entry
 */
class ErrorLogEntry {
    constructor(event, error, context = {}) {
        this.timestamp = new Date().toISOString();
        this.event = event;
        this.error = formatError(error);
        this.context = context;
        this.type = categorizeError(error);
    }
}

/**
 * SocketErrorHandler class
 * Manages error handling, logging, and reporting for socket events
 */
class SocketErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.errorListeners = [];
        this.retryQueue = [];
    }

    /**
     * Create a safe event handler wrapper
     * @param {string} event - The event name
     * @param {Function} handler - The event handler
     * @param {Object} options - Handler options
     * @returns {Function} Wrapped handler
     */
    createSafeHandler(event, handler, options = {}) {
        const {
            onError = null,
            retryOnError = false,
            maxRetries = 3,
            retryDelay = 1000,
        } = options;

        return async (data) => {
            let attempts = 0;

            const attemptHandler = async () => {
                try {
                    await handler(data);
                } catch (error) {
                    attempts++;

                    // Log the error
                    this.logError(event, error, { data, attempts });

                    // Call custom error handler if provided
                    if (onError) {
                        try {
                            onError(error, data, event);
                        } catch (e) {
                            console.error('Error in custom error handler:', e);
                        }
                    }

                    // Retry if enabled and attempts remaining
                    if (retryOnError && attempts < maxRetries) {
                        console.log(`Retrying ${event} handler, attempt ${attempts + 1}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
                        return attemptHandler();
                    }

                    // Notify error listeners
                    this.notifyListeners(event, error, data);
                }
            };

            return attemptHandler();
        };
    }

    /**
     * Log an error
     * @param {string} event - The event name
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     */
    logError(event, error, context = {}) {
        const entry = new ErrorLogEntry(event, error, context);

        // Add to log, maintaining max size
        this.errorLog.push(entry);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Console log in development
        if (__DEV__) {
            console.error(`[SocketError] ${event}:`, error);
            console.log('Context:', context);
        }
    }

    /**
     * Subscribe to error events
     * @param {Function} listener - Error listener callback
     * @returns {Function} Unsubscribe function
     */
    onError(listener) {
        this.errorListeners.push(listener);
        return () => {
            this.errorListeners = this.errorListeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all error listeners
     */
    notifyListeners(event, error, data) {
        this.errorListeners.forEach(listener => {
            try {
                listener({ event, error, data, timestamp: Date.now() });
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }

    /**
     * Get recent errors
     * @param {number} count - Number of errors to retrieve
     * @returns {Array}
     */
    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    }

    /**
     * Get errors by type
     * @param {string} type - Error type
     * @returns {Array}
     */
    getErrorsByType(type) {
        return this.errorLog.filter(entry => entry.type === type);
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
    }

    /**
     * Get error statistics
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            byEvent: {},
        };

        this.errorLog.forEach(entry => {
            stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
            stats.byEvent[entry.event] = (stats.byEvent[entry.event] || 0) + 1;
        });

        return stats;
    }
}

// Create singleton instance
const socketErrorHandler = new SocketErrorHandler();

/**
 * Convenience function to wrap a socket event handler
 * @param {string} event - Event name
 * @param {Function} handler - Handler function
 * @param {Object} options - Options
 * @returns {Function} Wrapped handler
 */
export function safeSocketHandler(event, handler, options = {}) {
    return socketErrorHandler.createSafeHandler(event, handler, options);
}

/**
 * Hook to integrate socket error handling in React components
 */
export function useSocketErrorHandler() {
    return {
        logError: socketErrorHandler.logError.bind(socketErrorHandler),
        onError: socketErrorHandler.onError.bind(socketErrorHandler),
        getRecentErrors: socketErrorHandler.getRecentErrors.bind(socketErrorHandler),
        getStats: socketErrorHandler.getStats.bind(socketErrorHandler),
        clearLog: socketErrorHandler.clearLog.bind(socketErrorHandler),
    };
}

export default socketErrorHandler;
