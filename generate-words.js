const fs = require('fs');

// Read the TWL06 word list
const words = fs.readFileSync('./frontend/src/data/twl06-words.txt', 'utf8')
    .trim()
    .split('\n')
    .map(w => `'${w.trim().toLowerCase()}'`);

// Create the JavaScript module
const output = `// TWL06 Scrabble Dictionary - ${words.length} valid words
// Generated from Official Scrabble Players Dictionary
export const SCRABBLE_WORDS = new Set([
  ${words.join(',\n  ')}
]);
`;

// Write to file
fs.writeFileSync('./frontend/src/data/scrabbleWords.js', output);
console.log(`Generated scrabbleWords.js with ${words.length} words`);
