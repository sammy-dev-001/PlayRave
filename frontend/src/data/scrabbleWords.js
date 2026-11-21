export const SCRABBLE_WORDS = new Set();
export let isDictionaryLoaded = false;

// SOWPODS + TWL06 (267,751 valid words)
export const loadDictionarySync = () => {
    if (isDictionaryLoaded && SCRABBLE_WORDS.size > 0) return;
    try {
        const words = require('./scrabble-words.json');
        for (let i = 0; i < words.length; i++) {
            SCRABBLE_WORDS.add(words[i]);
        }
        isDictionaryLoaded = true;
    } catch (e) {
        console.error('[Scrabble] Failed to load dictionary synchronously, trying fallback', e);
        try {
            const fallback = require('./twl06-words.json');
            for (let i = 0; i < fallback.length; i++) {
                SCRABBLE_WORDS.add(fallback[i]);
            }
            isDictionaryLoaded = true;
        } catch (err) {
            console.error('[Scrabble] Both dictionaries failed to load', err);
        }
    }
};

export const loadDictionary = async () => {
    loadDictionarySync();
    return Promise.resolve(SCRABBLE_WORDS.size);
};

export const isValidScrabbleWord = (word) => {
    if (!word) return false;
    if (SCRABBLE_WORDS.size === 0) {
        loadDictionarySync();
    }
    return SCRABBLE_WORDS.has(word.trim().toLowerCase());
};
