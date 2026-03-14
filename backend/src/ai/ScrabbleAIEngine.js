/**
 * ScrabbleAIEngine — Server-side Scrabble move generator.
 *
 * Uses a Trie (DAWG-light) built from SOWPODS for prefix + word lookups,
 * anchor-square detection, cross-check computation, and the classic
 * left-part / extend-right algorithm to enumerate every legal move.
 *
 * All generated moves are returned as tile-placement arrays in the exact
 * format that gameManager.scrabbleSubmitMove() expects, guaranteeing 100%
 * rule parity with the online mode.
 */

const { isValidWord, BONUS_SQUARES, BOARD_SIZE, CENTER_SQUARE, LETTER_TILES } = require('../data/scrabbleData');

// ─── Trie ────────────────────────────────────────────────────────────────────

class TrieNode {
    constructor() {
        this.children = {};   // letter -> TrieNode
        this.isTerminal = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (const ch of word) {
            if (!node.children[ch]) node.children[ch] = new TrieNode();
            node = node.children[ch];
        }
        node.isTerminal = true;
    }

    /** Returns the node reached after following `prefix`, or null. */
    getNode(prefix) {
        let node = this.root;
        for (const ch of prefix) {
            if (!node.children[ch]) return null;
            node = node.children[ch];
        }
        return node;
    }

    isWord(word)   { const n = this.getNode(word); return n !== null && n.isTerminal; }
    isPrefix(prefix) { return this.getNode(prefix) !== null; }
}

// Build once at module load time
let _trie = null;

function getTrie() {
    if (_trie) return _trie;
    const sowpods = require('sowpods');
    _trie = new Trie();
    for (const w of sowpods) _trie.insert(w);          // all uppercase
    console.log(`[ScrabbleAI] Trie built with ${sowpods.length} words`);
    return _trie;
}

// ─── Board helpers ───────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Get the tile at (r,c) from the board map, or null. Note: board is keyed as "x,y" where x=c, y=r */
function getCell(board, r, c) {
    return board[`${c},${r}`] || null;
}

/** True if (r,c) is inside the 15×15 grid. */
function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

// ─── Cross-checks ────────────────────────────────────────────────────────────

/**
 * For a given empty square (r,c), determine which letters can legally be placed
 * there considering the perpendicular (cross) direction.
 *
 * @param {object} board   current board map
 * @param {number} r       row
 * @param {number} c       col
 * @param {boolean} isRow  true = primary direction is across the row (horizontal),
 *                         so cross direction is vertical (column).
 * @returns {Set<string>|null}  Set of allowed letters, or null meaning "any letter OK"
 */
function computeCrossCheck(board, r, c, isRow) {
    const trie = getTrie();
    // Cross direction axis
    const dr = isRow ? 1 : 0;
    const dc = isRow ? 0 : 1;

    // Walk backwards in cross direction to find the start of the adjacent fragment
    let prefix = '';
    let tr = r - dr;
    let tc = c - dc;
    const prefixParts = [];
    while (inBounds(tr, tc) && getCell(board, tr, tc)) {
        prefixParts.push(getCell(board, tr, tc).letter);
        tr -= dr;
        tc -= dc;
    }
    prefixParts.reverse();
    prefix = prefixParts.join('');

    // Walk forwards in cross direction to find the suffix fragment
    let suffix = '';
    tr = r + dr;
    tc = c + dc;
    while (inBounds(tr, tc) && getCell(board, tr, tc)) {
        suffix += getCell(board, tr, tc).letter;
        tr += dr;
        tc += dc;
    }

    // If there are no adjacent tiles in the cross direction, any letter is fine
    if (prefix.length === 0 && suffix.length === 0) return null;

    // Test every letter to see which ones form a valid cross-word
    const allowed = new Set();
    for (const ch of ALPHABET) {
        const candidate = prefix + ch + suffix;
        if (trie.isWord(candidate)) {
            allowed.add(ch);
        }
    }
    return allowed;
}

// ─── Anchor detection ────────────────────────────────────────────────────────

/**
 * An anchor is an empty square that is adjacent (orthogonally) to at least one
 * occupied square.  On an empty board, the center square is the sole anchor.
 *
 * @returns {Array<{r:number, c:number}>}
 */
function findAnchors(board) {
    const occupied = Object.keys(board);
    if (occupied.length === 0) {
        return [{ r: CENTER_SQUARE, c: CENTER_SQUARE }];
    }

    const anchorSet = new Set();
    for (const key of occupied) {
        const [c, r] = key.split(',').map(Number); // gameManager uses x=c, y=r
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && !getCell(board, nr, nc)) {
                anchorSet.add(`${nr},${nc}`);
            }
        }
    }

    return Array.from(anchorSet).map(k => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
    });
}

// ─── Move generation (Gordon's left-part / extend-right) ─────────────────────

/**
 * Generate all legal word placements on the board.
 *
 * The algorithm works row by row (isRow=true) and then column by column
 * (isRow=false) by transposing the perspective.  For each anchor square it
 * builds left-parts from the rack (or collects an existing left-part from
 * already-placed tiles), then extends rightward through the Trie.
 *
 * @param {object}  board   current board { "r,c": { letter, value, isLocked } }
 * @param {Array}   hand    AI's hand [{ letter, value }, …]
 * @returns {Array}  list of candidate moves, each { tiles: [{x,y,letter,value,isBlank}], score }
 */
function generateAllMoves(board, hand) {
    const trie = getTrie();
    const moves = [];

    // Build a rack frequency map (counts)
    const rackCounts = {};
    for (const t of hand) {
        rackCounts[t.letter] = (rackCounts[t.letter] || 0) + 1;
    }

    // Value lookup for rack tiles
    const rackValueMap = {};
    for (const t of hand) {
        if (!rackValueMap[t.letter]) rackValueMap[t.letter] = t.value;
    }

    // We generate moves in two passes: once across rows, once down columns.
    for (const isRow of [true, false]) {
        // For each "line" (row if isRow, column if !isRow)
        for (let line = 0; line < BOARD_SIZE; line++) {
            // Precompute cross-checks for every empty cell in this line
            const crossChecks = new Array(BOARD_SIZE).fill(null);
            for (let pos = 0; pos < BOARD_SIZE; pos++) {
                const r = isRow ? line : pos;
                const c = isRow ? pos : line;
                if (!getCell(board, r, c)) {
                    crossChecks[pos] = computeCrossCheck(board, r, c, isRow);
                    // crossChecks[pos] = null  means any letter OK
                    // crossChecks[pos] = Set   means only those letters OK
                }
            }

            // Find anchors on this line
            const anchors = [];
            for (let pos = 0; pos < BOARD_SIZE; pos++) {
                const r = isRow ? line : pos;
                const c = isRow ? pos : line;
                if (getCell(board, r, c)) continue; // occupied — not an anchor

                // Is this adjacent to a filled cell?
                const isEmpty = Object.keys(board).length === 0;
                if (isEmpty && r === CENTER_SQUARE && c === CENTER_SQUARE) {
                    anchors.push(pos);
                    continue;
                }
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    if (getCell(board, r + dr, c + dc)) {
                        anchors.push(pos);
                        break;
                    }
                }
            }

            for (const anchorPos of anchors) {
                // --- Determine the left part ---

                // How many empty non-anchor squares are to the left of this anchor?
                // (We can fill them from the rack as a "left part".)
                // An existing tile to the left means we collect a fixed left part instead.

                const leftTilePos = anchorPos - 1;
                const rA = isRow ? line : anchorPos;
                const cA = isRow ? anchorPos : line;

                if (leftTilePos >= 0 && getCell(board, isRow ? line : leftTilePos, isRow ? leftTilePos : line)) {
                    // There's already a tile immediately to the left → collect the fixed prefix
                    let prefixTiles = [];
                    let p = leftTilePos;
                    while (p >= 0) {
                        const pr = isRow ? line : p;
                        const pc = isRow ? p : line;
                        const cell = getCell(board, pr, pc);
                        if (!cell) break;
                        prefixTiles.push({ pos: p, letter: cell.letter, value: cell.value, isBlank: false, fromBoard: true });
                        p--;
                    }
                    prefixTiles.reverse();
                    const prefixStr = prefixTiles.map(t => t.letter).join('');
                    const node = trie.getNode(prefixStr);
                    if (node) {
                        extendRight(
                            node, anchorPos, prefixTiles, prefixStr,
                            { ...rackCounts }, crossChecks, board, trie, rackValueMap,
                            line, isRow, moves, anchorPos
                        );
                    }
                } else {
                    // Count how many empty, non-anchor squares are to the left
                    let maxLeft = 0;
                    let p = anchorPos - 1;
                    while (p >= 0) {
                        const pr = isRow ? line : p;
                        const pc = isRow ? p : line;
                        if (getCell(board, pr, pc)) break; // Hit a tile
                        // Check if this square is itself an anchor (can't use as left-part distance)
                        let isAnchor = false;
                        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                            if (getCell(board, pr + dr, pc + dc)) { isAnchor = true; break; }
                        }
                        if (isAnchor && p !== anchorPos) break;
                        maxLeft++;
                        p--;
                    }

                    // Generate left-parts of length 0..maxLeft from the rack
                    generateLeftParts(
                        trie.root, anchorPos, [], '',
                        { ...rackCounts }, crossChecks, board, trie, rackValueMap,
                        line, isRow, moves, maxLeft, anchorPos
                    );
                }
            }
        }
    }

    return moves;
}

/**
 * Recursively build left-parts from the rack, then extend right.
 */
function generateLeftParts(
    node, anchorPos, partialTiles, partialWord,
    rack, crossChecks, board, trie, rackValueMap,
    line, isRow, moves, maxLeft, origAnchor
) {
    // Try extending right from this left-part
    extendRight(
        node, anchorPos, [...partialTiles], partialWord,
        { ...rack }, crossChecks, board, trie, rackValueMap,
        line, isRow, moves, origAnchor
    );

    if (maxLeft <= 0) return;

    const pos = anchorPos - partialTiles.filter(t => !t.fromBoard).length - 1;
    // pos would be where the next left-part tile goes
    // But we need to express it differently: left-part tiles go at positions
    // anchorPos - len - 1, anchorPos - len - 2, etc.

    // Actually, let's simplify. Left parts are placed at positions
    // (anchorPos - 1, anchorPos - 2, ...).  We prepend to partialTiles.

    const leftPos = anchorPos - partialTiles.length - 1;
    if (leftPos < 0) return;

    // Check cross-check at leftPos
    const cc = crossChecks[leftPos];

    for (const ch of ALPHABET) {
        if (cc && !cc.has(ch)) continue; // Cross-check rejects this letter
        if (!node.children[ch]) continue; // Trie rejects this prefix

        // Try placing from rack (normal letter)
        if (rack[ch] && rack[ch] > 0) {
            rack[ch]--;
            const tile = { pos: leftPos, letter: ch, value: rackValueMap[ch] || 0, isBlank: false, fromBoard: false };
            partialTiles.unshift(tile);
            const newWord = ch + partialWord;

            generateLeftParts(
                node.children[ch], anchorPos, partialTiles, newWord,
                rack, crossChecks, board, trie, rackValueMap,
                line, isRow, moves, maxLeft - 1, origAnchor
            );

            partialTiles.shift();
            rack[ch]++;
        }

        // Try placing a blank as this letter
        if (rack['_'] && rack['_'] > 0) {
            rack['_']--;
            const tile = { pos: leftPos, letter: ch, value: 0, isBlank: true, fromBoard: false };
            partialTiles.unshift(tile);
            const newWord = ch + partialWord;

            generateLeftParts(
                node.children[ch], anchorPos, partialTiles, newWord,
                rack, crossChecks, board, trie, rackValueMap,
                line, isRow, moves, maxLeft - 1, origAnchor
            );

            partialTiles.shift();
            rack['_']++;
        }
    }
}

/**
 * Extend the current partial word to the right from `pos`, recording
 * complete words as candidate moves.
 */
function extendRight(
    node, pos, partialTiles, partialWord,
    rack, crossChecks, board, trie, rackValueMap,
    line, isRow, moves, origAnchor
) {
    if (pos >= BOARD_SIZE) {
        // Off the board — if we have a complete word, record it
        if (node.isTerminal && partialTiles.some(t => !t.fromBoard) && pos > origAnchor) {
            recordMove(partialTiles, line, isRow, board, moves);
        }
        return;
    }

    const r = isRow ? line : pos;
    const c = isRow ? pos : line;
    const cell = getCell(board, r, c);

    if (cell) {
        // There's already a tile here — we must follow it in the trie
        const ch = cell.letter;
        if (node.children[ch]) {
            partialTiles.push({ pos, letter: ch, value: cell.value, isBlank: false, fromBoard: true });
            extendRight(
                node.children[ch], pos + 1, partialTiles, partialWord + ch,
                rack, crossChecks, board, trie, rackValueMap,
                line, isRow, moves, origAnchor
            );
            partialTiles.pop();
        }
        // If trie doesn't have this letter, this path is dead
    } else {
        // Empty square — try placing each possible letter from the rack
        if (node.isTerminal && partialTiles.length > 0 && partialTiles.some(t => !t.fromBoard) && pos > origAnchor) {
            recordMove([...partialTiles], line, isRow, board, moves);
        }

        const cc = crossChecks[pos]; // null = any, Set = restricted

        for (const ch of ALPHABET) {
            if (cc && !cc.has(ch)) continue;
            if (!node.children[ch]) continue;

            // Normal tile
            if (rack[ch] && rack[ch] > 0) {
                rack[ch]--;
                partialTiles.push({ pos, letter: ch, value: rackValueMap[ch] || 0, isBlank: false, fromBoard: false });
                extendRight(
                    node.children[ch], pos + 1, partialTiles, partialWord + ch,
                    rack, crossChecks, board, trie, rackValueMap,
                    line, isRow, moves, origAnchor
                );
                partialTiles.pop();
                rack[ch]++;
            }

            // Blank tile as this letter
            if (rack['_'] && rack['_'] > 0) {
                rack['_']--;
                partialTiles.push({ pos, letter: ch, value: 0, isBlank: true, fromBoard: false });
                extendRight(
                    node.children[ch], pos + 1, partialTiles, partialWord + ch,
                    rack, crossChecks, board, trie, rackValueMap,
                    line, isRow, moves, origAnchor
                );
                partialTiles.pop();
                rack['_']++;
            }
        }
    }
}

/**
 * Convert the internal partialTiles representation into the move format
 * expected by scrabbleSubmitMove: [{ x, y, letter, value, isBlank }]
 */
function recordMove(partialTiles, line, isRow, board, moves) {
    const newTiles = [];
    for (const t of partialTiles) {
        if (t.fromBoard) continue; // Only include tiles placed from the rack
        const r = isRow ? line : t.pos;
        const c = isRow ? t.pos : line;
        newTiles.push({
            x: c,
            y: r,
            letter: t.letter,
            value: t.value,
            isBlank: t.isBlank || false
        });
    }

    if (newTiles.length === 0) return;

    // Quick score estimate (used for sorting / selection before official scoring)
    const score = estimateScore(partialTiles, line, isRow);

    moves.push({ tiles: newTiles, score });
}

/**
 * Quick score estimate that accounts for bonus squares.
 * Only newly placed tiles (fromBoard=false) get bonus multipliers.
 */
function estimateScore(partialTiles, line, isRow) {
    let wordScore = 0;
    let wordMultiplier = 1;

    for (const t of partialTiles) {
        const r = isRow ? line : t.pos;
        const c = isRow ? t.pos : line;
        const key = `${c},${r}`; // BONUS_SQUARES is keyed by "x,y"
        let letterScore = t.value || 0;

        if (!t.fromBoard) {
            const bonus = BONUS_SQUARES[key];
            if (bonus === 'DL') letterScore *= 2;
            if (bonus === 'TL') letterScore *= 3;
            if (bonus === 'DW') wordMultiplier *= 2;
            if (bonus === 'TW') wordMultiplier *= 3;
        }
        wordScore += letterScore;
    }

    let total = wordScore * wordMultiplier;

    // Bingo bonus
    const placedCount = partialTiles.filter(t => !t.fromBoard).length;
    if (placedCount === 7) total += 50;

    return total;
}

// ─── Difficulty heuristics ───────────────────────────────────────────────────

// Letters that are good to keep in the rack
const GOOD_LEAVES = new Set(['S', 'E', 'R', 'A', 'T', 'N', 'I', '_']);
const BAD_LEAVES  = new Set(['Q', 'V', 'J', 'X', 'Z']);

// Obscure 2-letter words a casual player wouldn't know
const OBSCURE_TWO_LETTER = new Set([
    'ZA', 'QI', 'XI', 'XU', 'JO', 'JA', 'ZO', 'ZE',
    'KA', 'KI', 'KY', 'QUA', 'GI', 'GU', 'DI', 'FE',
    'YU', 'WO', 'YA', 'YE', 'BI', 'BO', 'OB', 'OX',
    'AX', 'EX', 'ZAP'
]);

/**
 * Evaluate rack-leave quality (for Hard mode).
 * Higher = better tiles remaining.
 */
function rackLeaveScore(hand, usedTiles) {
    // Build a set of what's left after playing usedTiles
    const remaining = [...hand];
    for (const t of usedTiles) {
        const searchLetter = t.isBlank ? '_' : t.letter;
        const idx = remaining.findIndex(h => h.letter === searchLetter);
        if (idx !== -1) remaining.splice(idx, 1);
    }

    let score = 0;
    for (const t of remaining) {
        if (GOOD_LEAVES.has(t.letter)) score += 3;
        else if (BAD_LEAVES.has(t.letter)) score -= 5;
        else score += 0;
    }

    // Bonus for vowel-consonant balance in leave
    const vowels = remaining.filter(t => 'AEIOU'.includes(t.letter)).length;
    const consonants = remaining.filter(t => t.letter !== '_' && !'AEIOU'.includes(t.letter)).length;
    if (remaining.length > 0) {
        const ratio = vowels / Math.max(1, remaining.length);
        if (ratio >= 0.3 && ratio <= 0.55) score += 4; // Good balance
    }

    return score;
}

/**
 * Select the best move based on difficulty level.
 *
 * @param {Array}  moves      all generated legal moves
 * @param {string} difficulty 'easy' | 'medium' | 'hard'
 * @param {Array}  hand       AI's current hand
 * @returns {{ type: string, tiles?: Array, tileIndices?: Array } | null}
 */
function selectMoveByDifficulty(moves, difficulty, hand) {
    if (!moves || moves.length === 0) return null;

    switch (difficulty) {
        case 'hard': {
            // Combine score with rack-leave evaluation
            const scored = moves.map(m => ({
                ...m,
                combinedScore: m.score + rackLeaveScore(hand, m.tiles) * 2
            }));
            scored.sort((a, b) => b.combinedScore - a.combinedScore);
            return { type: 'move', ...scored[0] };
        }

        case 'medium': {
            // Filter out obscure 2-letter words
            let filtered = moves.filter(m => {
                const word = m.tiles.map(t => t.letter).join('');
                return !OBSCURE_TWO_LETTER.has(word);
            });
            if (filtered.length === 0) filtered = moves;

            // Sort by score
            filtered.sort((a, b) => b.score - a.score);

            // Cap at 80% of best score, pick randomly from top half
            const maxScore = filtered[0].score;
            const capped = filtered.filter(m => m.score <= maxScore * 0.85);
            const pool = capped.length > 0
                ? capped.slice(0, Math.max(1, Math.ceil(capped.length * 0.5)))
                : filtered.slice(0, Math.max(1, Math.ceil(filtered.length * 0.5)));

            return { type: 'move', ...pool[Math.floor(Math.random() * pool.length)] };
        }

        case 'easy':
        default: {
            // Filter out obscure words
            let filtered = moves.filter(m => {
                const word = m.tiles.map(t => t.letter).join('');
                return !OBSCURE_TWO_LETTER.has(word);
            });
            if (filtered.length === 0) filtered = moves;

            // Sort and cap at 50% of best score
            filtered.sort((a, b) => b.score - a.score);
            const maxScore = filtered[0].score;
            const capped = filtered.filter(m => m.score <= maxScore * 0.55);
            const pool = capped.length > 0 ? capped : filtered.slice(-Math.max(1, Math.ceil(filtered.length * 0.5)));

            // Occasional deliberate pass (10% chance if pool is weak)
            if (pool.length > 0 && pool[0].score < 8 && Math.random() < 0.1) {
                return null; // Will result in a pass
            }

            return { type: 'move', ...pool[Math.floor(Math.random() * pool.length)] };
        }
    }
}

/**
 * Select tiles to exchange when no playable moves exist.
 * Drops high-value consonants and duplicate vowels first.
 */
function selectTilesToExchange(hand) {
    const sorted = hand
        .map((t, i) => ({ ...t, idx: i }))
        .sort((a, b) => {
            // Prioritise exchanging bad tiles
            if (BAD_LEAVES.has(a.letter) && !BAD_LEAVES.has(b.letter)) return -1;
            if (!BAD_LEAVES.has(a.letter) && BAD_LEAVES.has(b.letter)) return 1;
            return b.value - a.value; // Highest value tiles go first
        });

    const count = Math.min(4, Math.max(2, hand.length - 3));
    return sorted.slice(0, count).map(t => t.idx);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Find the best move for the AI.
 *
 * @param {object} board       current board state { "r,c": { letter, value, isLocked } }
 * @param {Array}  hand        AI's hand [{ letter, value }, …]
 * @param {Array}  tileBag     remaining tile bag (used to decide exchange vs pass)
 * @param {string} difficulty  'easy' | 'medium' | 'hard'
 * @returns {{ type: string, tiles?: Array, tileIndices?: Array, score?: number }}
 */
function findBestMove(board, hand, tileBag, difficulty = 'medium') {
    const allMoves = generateAllMoves(board, hand);

    // De-duplicate moves (same set of tiles at same positions)
    const seen = new Set();
    const unique = [];
    for (const m of allMoves) {
        const key = m.tiles.map(t => `${t.x},${t.y}:${t.letter}${t.isBlank?'*':''}`).sort().join('|');
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(m);
        }
    }

    const selected = selectMoveByDifficulty(unique, difficulty, hand);

    if (selected) return selected;

    // No valid word-play move — exchange or pass
    if (tileBag.length >= 1 && hand.length > 0) {
        return { type: 'exchange', tileIndices: selectTilesToExchange(hand) };
    }

    return { type: 'pass' };
}

/**
 * Pre-warm the Trie so the first AI turn doesn't have a cold-start delay.
 * Call this once when the server boots.
 */
function warmUp() {
    getTrie();
}

module.exports = {
    findBestMove,
    warmUp,
    // Exposed for testing
    _generateAllMoves: generateAllMoves,
    _computeCrossCheck: computeCrossCheck,
    _findAnchors: findAnchors,
    _getTrie: getTrie,
};
