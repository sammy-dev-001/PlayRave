/**
 * storage.js — Shared AsyncStorage key constants
 *
 * All AsyncStorage keys must be defined here.
 * Never hardcode a key string anywhere else — if a key changes,
 * it must only change in one place.
 */

export const STORAGE_KEYS = {
    /** Last active game session — used for CoD-style rejoin modal */
    LAST_SESSION: 'playrave_last_session',

    /** User profile preference cache */
    USER_PROFILE: 'playrave_user_profile',

    /** Sound / mute preference */
    SOUND_ENABLED: 'playrave_sound_enabled',

    /** Theme preference */
    THEME: 'playrave_theme',
};
