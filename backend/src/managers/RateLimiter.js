// ============================================================================
// RateLimiter.js — Per-Socket Token-Bucket Rate Limiter
// ============================================================================
// Prevents event flooding attacks and accidental DoS from broken clients.
//
// Each socket gets its own bucket per event category. Buckets refill at a
// steady rate. When a bucket is empty the event is blocked and the client
// receives a 'rate-limited' error.
//
// Buckets auto-cleanup when a socket disconnects via RateLimiter.cleanup().
// ============================================================================

/**
 * Bucket configurations: { capacity, refillRate (tokens/sec) }
 *
 * 'game-action' — main game events (generous, but blocks exploit floods)
 * 'chat'        — chat messages (tight to prevent spam)
 * 'lobby'       — room/lobby management (moderate)
 * 'default'     — catch-all for anything not listed above
 */
const BUCKET_CONFIG = {
    'game-action':  { capacity: 30, refillRate: 20 },
    'chat':         { capacity: 8,  refillRate: 4  },
    'lobby':        { capacity: 15, refillRate: 10 },
    'default':      { capacity: 20, refillRate: 15 },
};

/** Maps socket event names → bucket category */
const EVENT_TO_CATEGORY = {
    'game-action':       'game-action',
    'chat-message':      'chat',
    'chat-reaction':     'chat',
    'create-room':       'lobby',
    'join-room':         'lobby',
    'leave-room':        'lobby',
    'player-ready':      'lobby',
    'game-selected':     'lobby',
    'set-game-type':     'lobby',
    'kick-player':       'lobby',
    'request-room-sync': 'lobby',
    'send-reaction':     'default',
};

class RateLimiter {
    constructor() {
        /**
         * buckets: Map<socketId, Map<category, BucketState>>
         * BucketState = { tokens: number, lastRefill: number (ms timestamp) }
         */
        this.buckets = new Map();
    }

    /**
     * Check whether an event from this socket should be allowed.
     * Consumes one token from the appropriate bucket.
     *
     * @param {string} socketId  — The socket making the request
     * @param {string} eventName — The event being checked
     * @returns {{ allowed: boolean, retryAfterMs?: number }}
     */
    check(socketId, eventName) {
        const category = EVENT_TO_CATEGORY[eventName] || 'default';
        const config = BUCKET_CONFIG[category];

        if (!this.buckets.has(socketId)) {
            this.buckets.set(socketId, new Map());
        }

        const socketBuckets = this.buckets.get(socketId);

        if (!socketBuckets.has(category)) {
            socketBuckets.set(category, {
                tokens: config.capacity,
                lastRefill: Date.now(),
            });
        }

        const bucket = socketBuckets.get(category);

        // Refill tokens based on elapsed time
        const now = Date.now();
        const elapsed = (now - bucket.lastRefill) / 1000; // seconds
        const newTokens = elapsed * config.refillRate;

        if (newTokens > 0) {
            bucket.tokens = Math.min(config.capacity, bucket.tokens + newTokens);
            bucket.lastRefill = now;
        }

        // Check and consume a token
        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return { allowed: true };
        }

        // Calculate how long until the next token is available
        const retryAfterMs = Math.ceil((1 - bucket.tokens) / config.refillRate * 1000);
        return { allowed: false, retryAfterMs };
    }

    /**
     * Remove all buckets for a socket (call on disconnect).
     * @param {string} socketId
     */
    cleanup(socketId) {
        this.buckets.delete(socketId);
    }

    /**
     * Get current token counts for a socket (for debugging/monitoring).
     * @param {string} socketId
     * @returns {Object}
     */
    getStatus(socketId) {
        if (!this.buckets.has(socketId)) return {};
        const result = {};
        for (const [cat, bucket] of this.buckets.get(socketId).entries()) {
            result[cat] = { tokens: Math.floor(bucket.tokens) };
        }
        return result;
    }
}

module.exports = new RateLimiter();
