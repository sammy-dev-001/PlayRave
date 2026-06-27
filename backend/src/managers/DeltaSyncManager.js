// ============================================================================
// DeltaSyncManager.js — Server-Side Delta State Compressor
// ============================================================================
// Tracks the last broadcast state per room for speed games.
// On each broadcast, computes what changed and emits only the diff when it
// is meaningfully smaller than the full state (< 70% of full serialized size).
//
// Speed games targeted: neon-tap, button-mash, type-race, math-blitz, color-rush
// All other games bypass this and broadcast full state as before.
// ============================================================================

const SPEED_GAMES = new Set([
    'neon-tap',
    'button-mash',
    'type-race',
    'math-blitz',
    'color-rush',
]);

// Threshold: only send delta if it saves at least 30% of payload size.
const DELTA_SIZE_THRESHOLD = 0.70;

// Set DELTA_DEBUG=true in your environment to enable per-broadcast logging.
// Never enable in production — console.log is synchronous and blocks the event loop.
const DELTA_DEBUG = process.env.DELTA_DEBUG === 'true';

class DeltaSyncManager {
    constructor() {
        /**
         * stateCache: Map<roomId, object>
         * Stores the last full state successfully broadcast to clients.
         */
        this.stateCache = new Map();
    }

    /**
     * Determine whether this game type should use delta compression.
     */
    isSpeedGame(gameType) {
        return SPEED_GAMES.has(gameType);
    }

    /**
     * Produce a stable string representation of any value for comparison.
     * Handles the full range of JS types consistently:
     *   - null           → "null"
     *   - undefined      → "__undefined__"
     *   - objects/arrays → JSON.stringify with a replacer that preserves
     *                      undefined array elements as "__undefined__"
     *                      (standard JSON.stringify silently coerces them to null,
     *                      making [1,undefined] look identical to [1,null])
     *   - primitives     → String(value)
     *
     * @param {*} val
     * @returns {string}
     */
    _serialize(val) {
        if (val === undefined) return '__undefined__';
        if (val === null) return 'null';
        if (typeof val === 'object') {
            // Replacer: preserve undefined as a distinguishable sentinel so that
            // an array slot changing from undefined to null (or vice versa) is detected.
            return JSON.stringify(val, (_key, v) =>
                v === undefined ? '__undefined__' : v
            );
        }
        return String(val);
    }

    /**
     * Compute a shallow delta between two state objects.
     * Returns null if there is no meaningful difference.
     *
     * @param {string} roomId
     * @param {object} newState
     * @returns {{ _delta: true, changed: object, removed: string[] } | null}
     */
    computeDelta(roomId, newState) {
        const prev = this.stateCache.get(roomId);

        if (!prev) {
            // No previous state — must send full state first
            return null;
        }

        const changed = {};
        const removed = [];

        // Find changed or new keys
        for (const key of Object.keys(newState)) {
            if (this._serialize(newState[key]) !== this._serialize(prev[key])) {
                changed[key] = newState[key];
            }
        }

        // Find removed keys (present in prev but not in newState)
        for (const key of Object.keys(prev)) {
            if (!(key in newState)) {
                removed.push(key);
            }
        }

        if (Object.keys(changed).length === 0 && removed.length === 0) {
            return null; // Nothing changed — skip broadcast
        }

        return { _delta: true, changed, removed };
    }

    /**
     * Decide whether to send a full state or a delta patch.
     * Updates the cache on every call.
     *
     * @param {string} roomId
     * @param {string} gameType
     * @param {object} fullState
     * @returns {{ payload: object, wasDelta: boolean }}
     */
    getPayload(roomId, gameType, fullState) {
        if (!this.isSpeedGame(gameType)) {
            return { payload: fullState, wasDelta: false };
        }

        const delta = this.computeDelta(roomId, fullState);

        // Update the cache. Use structuredClone (Node 17+) — faster than
        // JSON.parse(JSON.stringify()) and avoids double-serialization.
        this.stateCache.set(roomId, structuredClone(fullState));

        if (!delta) {
            // No previous state, or nothing changed — send full state
            return { payload: fullState, wasDelta: false };
        }

        // Only send delta if it is meaningfully smaller than the full payload.
        const fullSize  = JSON.stringify(fullState).length;
        const deltaSize = JSON.stringify(delta).length;

        if (deltaSize < fullSize * DELTA_SIZE_THRESHOLD) {
            if (DELTA_DEBUG) {
                console.log(`[DeltaSync] Room ${roomId}: delta ${deltaSize}B vs full ${fullSize}B — sending delta`);
            }
            return { payload: delta, wasDelta: true };
        }

        // Delta not worth it — send full state for simplicity
        return { payload: fullState, wasDelta: false };
    }

    /**
     * Clear the cache entry for a room (call when game ends or room is destroyed).
     *
     * @param {string} roomId
     */
    clearRoom(roomId) {
        this.stateCache.delete(roomId);
    }
}

module.exports = new DeltaSyncManager();
