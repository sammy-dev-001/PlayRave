/**
 * Input validation utilities for PlayRave
 * Provides consistent validation across the app
 */

// Player name constraints
const NAME_CONSTRAINTS = {
    minLength: 1,
    maxLength: 20,
    // Allow letters, numbers, spaces, and some special characters
    allowedPattern: /^[a-zA-Z0-9\s\-_'.]+$/,
};

// Room code constraints
const ROOM_CODE_CONSTRAINTS = {
    length: 6,
    pattern: /^[A-Z0-9]+$/,
};

/**
 * Validate player name
 * @param {string} name - The name to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < NAME_CONSTRAINTS.minLength) {
        return { isValid: false, error: 'Name is too short' };
    }

    if (trimmedName.length > NAME_CONSTRAINTS.maxLength) {
        return { isValid: false, error: `Name must be ${NAME_CONSTRAINTS.maxLength} characters or less` };
    }

    if (!NAME_CONSTRAINTS.allowedPattern.test(trimmedName)) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true, error: null };
}

/**
 * Validate room code
 * @param {string} code - The room code to validate
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateRoomCode(code) {
    if (!code || typeof code !== 'string') {
        return { isValid: false, error: 'Room code is required' };
    }

    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length !== ROOM_CODE_CONSTRAINTS.length) {
        return { isValid: false, error: `Room code must be ${ROOM_CODE_CONSTRAINTS.length} characters` };
    }

    if (!ROOM_CODE_CONSTRAINTS.pattern.test(trimmedCode)) {
        return { isValid: false, error: 'Room code should only contain letters and numbers' };
    }

    return { isValid: true, error: null };
}

/**
 * Sanitize player name (remove extra spaces, trim)
 * @param {string} name - The name to sanitize
 * @returns {string}
 */
export function sanitizePlayerName(name) {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize room code (uppercase, trim)
 * @param {string} code - The room code to sanitize
 * @returns {string}
 */
export function sanitizeRoomCode(code) {
    if (!code || typeof code !== 'string') return '';
    return code.trim().toUpperCase();
}

/**
 * Rate limiter class for preventing spam
 */
export class RateLimiter {
    constructor(maxActions, windowMs) {
        this.maxActions = maxActions;
        this.windowMs = windowMs;
        this.actions = [];
    }

    /**
     * Check if action is allowed
     * @returns {boolean}
     */
    canAction() {
        const now = Date.now();
        // Remove expired actions
        this.actions = this.actions.filter(time => now - time < this.windowMs);
        return this.actions.length < this.maxActions;
    }

    /**
     * Record an action
     */
    recordAction() {
        this.actions.push(Date.now());
    }

    /**
     * Check and record in one call
     * @returns {boolean}
     */
    tryAction() {
        if (this.canAction()) {
            this.recordAction();
            return true;
        }
        return false;
    }

    /**
     * Get time until next action is allowed
     * @returns {number} milliseconds
     */
    getTimeUntilReset() {
        if (this.canAction()) return 0;
        const oldest = Math.min(...this.actions);
        return Math.max(0, this.windowMs - (Date.now() - oldest));
    }

    /**
     * Reset the limiter
     */
    reset() {
        this.actions = [];
    }
}

// Pre-configured rate limiters
export const buttonClickLimiter = new RateLimiter(5, 1000); // 5 clicks per second
export const socketEmitLimiter = new RateLimiter(10, 1000); // 10 emits per second
export const answerSubmitLimiter = new RateLimiter(2, 1000); // 2 answers per second

/**
 * Create a debounced function
 * @param {Function} func - The function to debounce
 * @param {number} waitMs - The debounce delay in milliseconds
 * @returns {Function}
 */
export function debounce(func, waitMs) {
    let timeoutId = null;

    const debouncedFn = (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, waitMs);
    };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

/**
 * Create a throttled function
 * @param {Function} func - The function to throttle
 * @param {number} limitMs - The throttle limit in milliseconds
 * @returns {Function}
 */
export function throttle(func, limitMs) {
    let lastCall = 0;
    let timeoutId = null;

    const throttledFn = (...args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        if (timeSinceLastCall >= limitMs) {
            lastCall = now;
            func.apply(this, args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                func.apply(this, args);
                timeoutId = null;
            }, limitMs - timeSinceLastCall);
        }
    };

    throttledFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return throttledFn;
}

export default {
    validatePlayerName,
    validateRoomCode,
    sanitizePlayerName,
    sanitizeRoomCode,
    RateLimiter,
    buttonClickLimiter,
    socketEmitLimiter,
    answerSubmitLimiter,
    debounce,
    throttle,
};
