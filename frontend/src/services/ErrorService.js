/**
 * Centralized Error Handling Service
 * Manages error logging, categorization, and user-friendly messages
 */

// Error categories
export const ErrorCategory = {
    NETWORK: 'network',
    AUTH: 'auth',
    GAME: 'game',
    STORAGE: 'storage',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown',
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',       // Can be ignored, logged only
    MEDIUM: 'medium', // Show toast/notification
    HIGH: 'high',     // Show modal, may need action
    CRITICAL: 'critical', // App may not function
};

// User-friendly messages for common errors
const ERROR_MESSAGES = {
    // Network errors
    'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
    'TIMEOUT': 'Request timed out. Please try again.',
    'SERVER_ERROR': 'Server is temporarily unavailable. Please try again later.',

    // Auth errors
    'AUTH_EXPIRED': 'Your session has expired. Please log in again.',
    'AUTH_INVALID': 'Invalid credentials. Please check and try again.',
    'AUTH_REQUIRED': 'Please log in to continue.',

    // Game errors
    'GAME_NOT_FOUND': 'Game not found. It may have ended.',
    'ROOM_FULL': 'This room is full. Try another room.',
    'INVALID_MOVE': 'Invalid move. Please try again.',
    'TURN_ERROR': 'It\'s not your turn.',

    // Storage errors
    'STORAGE_FULL': 'Storage is full. Please clear some data.',
    'STORAGE_READ': 'Failed to load data. Please restart the app.',
    'STORAGE_WRITE': 'Failed to save data. Please try again.',

    // Validation errors
    'INVALID_INPUT': 'Please check your input and try again.',
    'REQUIRED_FIELD': 'Please fill in all required fields.',

    // Generic
    'UNKNOWN': 'Something went wrong. Please try again.',
};

class ErrorService {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.listeners = [];
    }

    /**
     * Categorize an error based on its properties
     */
    categorizeError(error) {
        const message = error.message?.toLowerCase() || '';
        const code = error.code?.toLowerCase() || '';

        if (message.includes('network') || message.includes('fetch') || code === 'network_error') {
            return ErrorCategory.NETWORK;
        }
        if (message.includes('auth') || message.includes('unauthorized') || code === 'auth_error') {
            return ErrorCategory.AUTH;
        }
        if (message.includes('game') || message.includes('room') || message.includes('move')) {
            return ErrorCategory.GAME;
        }
        if (message.includes('storage') || message.includes('asyncstorage')) {
            return ErrorCategory.STORAGE;
        }
        if (message.includes('valid') || message.includes('required')) {
            return ErrorCategory.VALIDATION;
        }
        return ErrorCategory.UNKNOWN;
    }

    /**
     * Get user-friendly message for an error
     */
    getUserMessage(error) {
        // Check for specific error code
        if (error.code && ERROR_MESSAGES[error.code]) {
            return ERROR_MESSAGES[error.code];
        }

        // Check category
        const category = this.categorizeError(error);
        switch (category) {
            case ErrorCategory.NETWORK:
                return ERROR_MESSAGES.NETWORK_ERROR;
            case ErrorCategory.AUTH:
                return ERROR_MESSAGES.AUTH_REQUIRED;
            case ErrorCategory.GAME:
                return error.message || ERROR_MESSAGES.UNKNOWN;
            case ErrorCategory.STORAGE:
                return ERROR_MESSAGES.STORAGE_READ;
            case ErrorCategory.VALIDATION:
                return ERROR_MESSAGES.INVALID_INPUT;
            default:
                return ERROR_MESSAGES.UNKNOWN;
        }
    }

    /**
     * Log an error
     */
    logError(error, context = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack,
            code: error.code,
            category: this.categorizeError(error),
            severity: context.severity || ErrorSeverity.MEDIUM,
            context,
        };

        // Add to log
        this.errorLog.unshift(logEntry);

        // Trim log if too large
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Console log for development
        console.error('[ErrorService]', logEntry);

        // Notify listeners
        this.notifyListeners(logEntry);

        return logEntry;
    }

    /**
     * Handle an error with appropriate response
     */
    handleError(error, options = {}) {
        const {
            showAlert = false,
            context = {},
            onRetry = null,
            severity = ErrorSeverity.MEDIUM,
        } = options;

        // Log the error
        const logEntry = this.logError(error, { ...context, severity });

        // Get user message
        const userMessage = this.getUserMessage(error);

        // Return error info for UI handling
        return {
            message: userMessage,
            category: logEntry.category,
            severity: logEntry.severity,
            canRetry: !!onRetry,
            retry: onRetry,
            originalError: error,
        };
    }

    /**
     * Add error listener
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(logEntry) {
        this.listeners.forEach(listener => {
            try {
                listener(logEntry);
            } catch (e) {
                console.warn('[ErrorService] Listener error:', e);
            }
        });
    }

    /**
     * Get recent errors
     */
    getRecentErrors(count = 10) {
        return this.errorLog.slice(0, count);
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
    }

    /**
     * Create wrapped async function with error handling
     */
    wrapAsync(fn, options = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                return this.handleError(error, options);
            }
        };
    }
}

// Export singleton instance
export default new ErrorService();
