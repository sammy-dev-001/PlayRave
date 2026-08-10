export const SCRABBLE_WORDS = new Set();
export let isDictionaryLoaded = false;

export const loadDictionary = async () => {
    if (isDictionaryLoaded) return;
    try {
        console.log('[Scrabble] Loading dictionary dynamically...');
        
        // Require the JSON file directly (Metro bundler will pack it into the JS bundle)
        // This is 100% offline and very fast
        const words = require('./twl06-words.json');
        
        // Populate the Set
        words.forEach(w => SCRABBLE_WORDS.add(w));
        
        isDictionaryLoaded = true;
        console.log(`[Scrabble] Dictionary loaded successfully: ${SCRABBLE_WORDS.size} words.`);
    } catch (e) {
        console.error("[Scrabble] Failed to load dictionary", e);
    }
};
