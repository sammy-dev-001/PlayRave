// ============================================================================
// inputValidator.js — Centralised Server-Side Input Validation
// ============================================================================
// All game engines call these before trusting any client-provided value.
// Rejects values that are physically or logically impossible so that cheating
// via forged payloads is blocked at the engine boundary.
// ============================================================================

/**
 * Minimum human reaction time (ms).
 * Studies show ~100ms is a genuine lower bound. We use 80ms to give
 * a small buffer for network latency measurement error.
 */
const MIN_REACTION_TIME_MS = 80;

/**
 * Maximum humanly possible tap rate (taps per second).
 * World-record button mashing is ~14-16 taps/sec. 25 is a generous ceiling.
 */
const MAX_TAP_RATE_PER_SEC = 25;

/**
 * Valid color names in Color Rush (must match engine's color list).
 */
const VALID_COLOR_NAMES = new Set(['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE']);

// ── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate a reaction time reported by a client.
 * @param {*}      clientTime   — The value the client sent
 * @param {number} roundStartMs — Date.now() when the round started (server clock)
 * @returns {{ valid: boolean, reason?: string, value?: number }}
 */
function validateReactionTime(clientTime, roundStartMs) {
    if (typeof clientTime !== 'number' || !isFinite(clientTime)) {
        return { valid: false, reason: 'Reaction time must be a finite number' };
    }
    if (clientTime < MIN_REACTION_TIME_MS) {
        return { valid: false, reason: `Reaction time ${clientTime}ms is below human minimum (${MIN_REACTION_TIME_MS}ms)` };
    }
    if (roundStartMs) {
        const maxPossible = Date.now() - roundStartMs + 1000; // 1s buffer for network
        if (clientTime > maxPossible) {
            return { valid: false, reason: `Reaction time ${clientTime}ms exceeds round duration` };
        }
    }
    return { valid: true, value: clientTime };
}

/**
 * Validate a tap rate is humanly possible.
 * @param {number} tapCount    — Current tap count for the player
 * @param {number} startTimeMs — Server timestamp when the round started
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateTapRate(tapCount, startTimeMs) {
    if (typeof tapCount !== 'number' || tapCount < 0) {
        return { valid: false, reason: 'Invalid tap count' };
    }
    const elapsedSec = (Date.now() - startTimeMs) / 1000;
    if (elapsedSec > 0) {
        const rate = tapCount / elapsedSec;
        if (rate > MAX_TAP_RATE_PER_SEC) {
            return { valid: false, reason: `Tap rate ${rate.toFixed(1)}/sec exceeds human maximum (${MAX_TAP_RATE_PER_SEC}/sec)` };
        }
    }
    return { valid: true };
}

/**
 * Validate a string field.
 * @param {*}      val    — The value to check
 * @param {number} maxLen — Maximum allowed length
 * @returns {{ valid: boolean, reason?: string, value?: string }}
 */
function validateString(val, maxLen = 1000) {
    if (typeof val !== 'string') {
        return { valid: false, reason: 'Expected a string value' };
    }
    if (val.length > maxLen) {
        return { valid: false, reason: `String exceeds maximum length of ${maxLen}` };
    }
    return { valid: true, value: val };
}

/**
 * Validate a numeric value within bounds.
 * @param {*}      val — The value to check
 * @param {number} min — Inclusive minimum
 * @param {number} max — Inclusive maximum
 * @returns {{ valid: boolean, reason?: string, value?: number }}
 */
function validateNumber(val, min, max) {
    const n = Number(val);
    if (!isFinite(n)) {
        return { valid: false, reason: `Expected a finite number, got ${val}` };
    }
    if (n < min || n > max) {
        return { valid: false, reason: `Value ${n} is outside valid range [${min}, ${max}]` };
    }
    return { valid: true, value: n };
}

/**
 * Validate a Color Rush answer.
 * @param {*} colorName — Client-supplied color name
 * @returns {{ valid: boolean, reason?: string, value?: string }}
 */
function validateColorName(colorName) {
    if (typeof colorName !== 'string') {
        return { valid: false, reason: 'Color name must be a string' };
    }
    const upper = colorName.toUpperCase();
    if (!VALID_COLOR_NAMES.has(upper)) {
        return { valid: false, reason: `Unknown color name: ${colorName}` };
    }
    return { valid: true, value: upper };
}

/**
 * Validate a type-race finish submission.
 * @param {*}      typed      — What the player typed
 * @param {*}      timeTaken  — ms the player took to finish
 * @param {number} roundStart — Server timestamp when the round started
 * @param {string} sentence   — The target sentence (used for length sanity check)
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateTypeRaceFinish(typed, timeTaken, roundStart, sentence) {
    const typedCheck = validateString(typed, (sentence?.length || 500) + 100);
    if (!typedCheck.valid) return typedCheck;

    if (typeof timeTaken !== 'number' || !isFinite(timeTaken) || timeTaken < 0) {
        return { valid: false, reason: 'timeTaken must be a non-negative finite number' };
    }

    // Sanity: can't finish faster than ~150ms (human WPM record is ~200 WPM; even 1 word takes >100ms)
    if (timeTaken < 150) {
        return { valid: false, reason: `Finish time ${timeTaken}ms is impossibly fast` };
    }

    if (roundStart) {
        const maxPossible = Date.now() - roundStart + 2000; // 2s buffer
        if (timeTaken > maxPossible) {
            return { valid: false, reason: `Finish time ${timeTaken}ms exceeds round duration` };
        }
    }

    return { valid: true };
}

module.exports = {
    validateReactionTime,
    validateTapRate,
    validateString,
    validateNumber,
    validateColorName,
    validateTypeRaceFinish,
    MIN_REACTION_TIME_MS,
    MAX_TAP_RATE_PER_SEC,
};
