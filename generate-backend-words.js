const fs = require('fs');

// Read the TWL06 word list (same source as frontend)
const words = fs.readFileSync('./frontend/src/data/twl06-words.txt', 'utf8')
    .trim()
    .split('\n')
    .map(w => `'${w.trim().toLowerCase()}'`);

// Create the JavaScript module for backend (CommonJS format)
const output = `// TWL06 Scrabble Dictionary - ${words.length} valid words
// Generated from Official Scrabble Players Dictionary
const SCRABBLE_WORDS = new Set([
  ${words.join(',\n  ')}
]);

module.exports = { SCRABBLE_WORDS };
`;

// Write to file
fs.writeFileSync('./backend/src/data/scrabbleWords.js', output);
console.log(`Generated backend scrabbleWords.js with ${words.length} words`);
