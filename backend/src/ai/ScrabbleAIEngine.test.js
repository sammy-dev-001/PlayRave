const ScrabbleAIEngine = require('./ScrabbleAIEngine');
const { createTileBag } = require('../data/scrabbleData');

console.log('--- SCRABBLE AI ENGINE TEST ---');

// Mock a simple Board State
const board = {};
/*
   0 1 2 3 4 5 6 7 8 9 10 11 12 13 14
 0 . . . . . . . . . . . . . . .
 ...
 7 . . . . C A T . . . . . . . .
 ...
*/
board['4,7'] = { letter: 'H', value: 4, isLocked: true };
board['5,7'] = { letter: 'E', value: 1, isLocked: true };
board['6,7'] = { letter: 'L', value: 1, isLocked: true };
board['7,7'] = { letter: 'L', value: 1, isLocked: true };
board['8,7'] = { letter: 'O', value: 1, isLocked: true };

// Mock hand
const myHand = [
    { letter: 'W', value: 4 },
    { letter: 'O', value: 1 },
    { letter: 'R', value: 1 },
    { letter: 'L', value: 1 },
    { letter: 'D', value: 2 },
    { letter: 'S', value: 1 },
    { letter: 'A', value: 1 },
];

const tileBag = createTileBag ? createTileBag() : [];

async function runTests() {
    console.log('1. Waiting for DAWG to warm up...');
    await ScrabbleAIEngine.warmUp();
    console.log('DAWG initialized.');

    console.log('\n2. Testing Hard Difficulty (best score + rack leave)...');
    let bestMove = ScrabbleAIEngine.findBestMove(board, myHand, tileBag, 'hard');
    console.log(bestMove);

    console.log('\n3. Testing Cross-Check Restrictions...');
    // Add vertical word that intersects
    board['7,6'] = { letter: 'A', value: 1, isLocked: true };  // A(7,6) -> L(7,7) == AL
    
    bestMove = ScrabbleAIEngine.findBestMove(board, myHand, tileBag, 'hard');
    console.log('Move after adding A(7,6):');
    console.log(bestMove);

    console.log('\n4. Testing Blank Tiles...');
    const handWithBlank = [
        { letter: 'C', value: 3 },
        { letter: 'A', value: 1 },
        { letter: 'R', value: 1 },
        { letter: '_', value: 0 },
        { letter: 'V', value: 4 },
        { letter: 'E', value: 1 },
        { letter: 'R', value: 1 },
    ];
    bestMove = ScrabbleAIEngine.findBestMove({}, handWithBlank, tileBag, 'hard'); // First turn
    console.log('First turn move with blank:');
    console.log(bestMove);

    console.log('\n✅ Tests finished.');
}

runTests().catch(console.error);
