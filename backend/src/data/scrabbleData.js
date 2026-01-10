const { SCRABBLE_WORDS } = require('./scrabbleWords');

// Scrabble-style letter tiles and scoring
const LETTER_TILES = {
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

const BOARD_SIZE = 15;
const CENTER_SQUARE = 7; // 0-indexed (8th square)

// Bonus squares
const BONUS_SQUARES = {
    '0,0': 'TW', '0,7': 'TW', '0,14': 'TW',
    '7,0': 'TW', '7,14': 'TW',
    '14,0': 'TW', '14,7': 'TW', '14,14': 'TW',

    '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
    '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
    '10,4': 'DW', '11,3': 'DW', '12,2': 'DW', '13,1': 'DW',
    '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',
    '7,7': 'DW', // Center star

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

// Create a tile bag with all tiles
const createTileBag = () => {
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
const drawTiles = (bag, count) => {
    const drawn = [];
    for (let i = 0; i < count && bag.length > 0; i++) {
        drawn.push(bag.pop());
    }
    return drawn;
};

// Word validation
const isValidWord = (word) => {
    return SCRABBLE_WORDS.has(word.toLowerCase());
};

module.exports = {
    LETTER_TILES,
    BOARD_SIZE,
    CENTER_SQUARE,
    BONUS_SQUARES,
    createTileBag,
    drawTiles,
    isValidWord
};
