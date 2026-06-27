/**
 * deltaSync.js — Client-Side Delta State Merger
 * ============================================================================
 * Merges server-sent delta patches into the current local game state.
 * Used by speed games (NeonTap, ButtonMash, TypeRace, MathBlitz, ColorRush)
 * to apply lightweight incremental updates without replacing the full state.
 *
 * Delta packet shape (sent by DeltaSyncManager on the backend):
 * {
 *   _delta: true,          // marker so the screen can branch
 *   changed: { key: val }, // top-level keys that changed
 *   removed: ['key'],      // top-level keys that were deleted (rare)
 * }
 * ============================================================================
 */

/**
 * Merge a delta patch from the server into the current local state.
 *
 * @param {object} current  — The current local game state object
 * @param {object} patch    — The delta packet received from the server
 * @returns {object}        — New merged state (pure, does not mutate current)
 */
export function mergeGameState(current, patch) {
    if (!patch || !patch._delta) {
        // Not a delta — return the patch as-is (full state replacement)
        return patch;
    }

    const merged = { ...current };

    // Apply changed fields
    if (patch.changed && typeof patch.changed === 'object') {
        Object.assign(merged, patch.changed);
    }

    // Remove deleted fields
    if (Array.isArray(patch.removed)) {
        patch.removed.forEach((key) => {
            delete merged[key];
        });
    }

    return merged;
}

/**
 * Check whether a received game-state packet is a delta or a full state.
 *
 * @param {object} data — The packet from the socket event
 * @returns {boolean}
 */
export function isDelta(data) {
    return !!(data && data._delta === true);
}
