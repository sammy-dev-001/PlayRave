// Scrabble-style letter tiles and scoring
export const LETTER_TILES = {
    A: { value: 1, count: 9 },
    B: { value: 3, count: 2 },
    C: { value: 3, count: 2 },
    D: { value: 2, count: 4 },
    E: { value: 1, count: 12 },
    F: { value: 4, count: 2 },
    G: { value: 2, count: 3 },
    H: { value: 4, count: 2 },
    I: { value: 1, count: 9 },
    J: { value: 8, count: 1 },
    K: { value: 5, count: 1 },
    L: { value: 1, count: 4 },
    M: { value: 3, count: 2 },
    N: { value: 1, count: 6 },
    O: { value: 1, count: 8 },
    P: { value: 3, count: 2 },
    Q: { value: 10, count: 1 },
    R: { value: 1, count: 6 },
    S: { value: 1, count: 4 },
    T: { value: 1, count: 6 },
    U: { value: 1, count: 4 },
    V: { value: 4, count: 2 },
    W: { value: 4, count: 2 },
    X: { value: 8, count: 1 },
    Y: { value: 4, count: 2 },
    Z: { value: 10, count: 1 },
    '_': { value: 0, count: 2 } // Blank tiles
};

export const BOARD_SIZE = 15;
export const CENTER_SQUARE = 7; // 0-indexed (8th square)

// Bonus squares
// TW: Triple Word, DW: Double Word, TL: Triple Letter, DL: Double Letter
export const BONUS_SQUARES = {
    '0,0': 'TW', '0,7': 'TW', '0,14': 'TW',
    '7,0': 'TW', '7,14': 'TW',
    '14,0': 'TW', '14,7': 'TW', '14,14': 'TW',

    '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
    '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
    '10,4': 'DW', '11,3': 'DW', '12,2': 'DW', '13,1': 'DW',
    '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',
    // Center star is typically DW
    '7,7': 'DW',

    '1,5': 'TL', '1,9': 'TL',
    '5,1': 'TL', '5,5': 'TL', '5,9': 'TL', '5,13': 'TL',
    '9,1': 'TL', '9,5': 'TL', '9,9': 'TL', '9,13': 'TL',
    '13,5': 'TL', '13,9': 'TL',

    '0,3': 'DL', '0,11': 'DL',
    '2,6': 'DL', '2,8': 'DL',
    '3,0': 'DL', '3,7': 'DL', '3,14': 'DL',
    '6,2': 'DL', '6,6': 'DL', '6,8': 'DL', '6,12': 'DL',
    '7,3': 'DL', '7,11': 'DL',
    '8,2': 'DL', '8,6': 'DL', '8,8': 'DL', '8,12': 'DL',
    '11,0': 'DL', '11,7': 'DL', '11,14': 'DL',
    '12,6': 'DL', '12,8': 'DL',
    '14,3': 'DL', '14,11': 'DL'
};

// Valid Words Dictionary - Comprehensive TWL06 Scrabble Dictionary (178,691 words)
import { SCRABBLE_WORDS } from './scrabbleWords';

// Word validation helper
export const isValidWord = (word) => {
    return SCRABBLE_WORDS.has(word.toLowerCase());
};

// Create a tile bag with all tiles
export const createTileBag = () => {
    const bag = [];
    Object.entries(LETTER_TILES).forEach(([letter, data]) => {
        for (let i = 0; i < data.count; i++) {
            bag.push({ letter, value: data.value });
        }
    });
    // Shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
};

// Draw tiles from the bag
export const drawTiles = (bag, count) => {
    const drawn = [];
    for (let i = 0; i < count && bag.length > 0; i++) {
        drawn.push(bag.pop());
    }
    return drawn;
};

// Board validation: check if move is valid
export const isValidMove = (playedTiles, board) => {
    // Basic checks only for MVP
    if (playedTiles.length === 0) return false;

    // Check logical placement (same row or col)
    const rows = playedTiles.map(t => t.y);
    const cols = playedTiles.map(t => t.x);

    // Check if horizontal or vertical
    const isHorizontal = new Set(rows).size === 1;
    const isVertical = new Set(cols).size === 1;

    if (!isHorizontal && !isVertical) return false;

    // Check gaps? (Need checks for existing tiles to bridge gaps)
    // For now, simplify to just checking direction
    return true;
};
