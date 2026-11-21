// SOWPODS official international Scrabble word list (267,751 words)
// Comprehensive superset of TWL06 and CSW
const sowpods = require('sowpods');
const SCRABBLE_WORDS = new Set(sowpods.map(w => w.toLowerCase()));

module.exports = { SCRABBLE_WORDS };
