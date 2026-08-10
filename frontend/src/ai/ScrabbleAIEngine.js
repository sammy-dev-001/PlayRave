/**
 * ScrabbleAIEngine — Client-side Scrabble move generator.
 */

import { BONUS_SQUARES, BOARD_SIZE, CENTER_SQUARE, LETTER_TILES } from '../data/scrabbleData';
import { SCRABBLE_WORDS, isDictionaryLoaded } from '../data/scrabbleWords';

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

export function getTrie() {
    if (_trie) return _trie;
    if (!isDictionaryLoaded) {
        console.warn("[ScrabbleAI] Dictionary not fully loaded, Trie might be incomplete");
    }
    _trie = new Trie();
    // SCRABBLE_WORDS contains lowercase words
    for (const w of SCRABBLE_WORDS) {
        _trie.insert(w.toUpperCase());
    }
    console.log(`[ScrabbleAI] Trie built with ${SCRABBLE_WORDS.size} words`);
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
        for (let line = 0; line < BOARD_SIZE; line++) {
            const crossChecks = new Array(BOARD_SIZE).fill(null);
            for (let pos = 0; pos < BOARD_SIZE; pos++) {
                const r = isRow ? line : pos;
                const c = isRow ? pos : line;
                if (!getCell(board, r, c)) {
                    crossChecks[pos] = computeCrossCheck(board, r, c, isRow);
                }
            }

            const anchors = [];
            for (let pos = 0; pos < BOARD_SIZE; pos++) {
                const r = isRow ? line : pos;
                const c = isRow ? pos : line;
                if (getCell(board, r, c)) continue;

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
                const leftTilePos = anchorPos - 1;
                const rA = isRow ? line : anchorPos;
                const cA = isRow ? anchorPos : line;

                if (leftTilePos >= 0 && getCell(board, isRow ? line : leftTilePos, isRow ? leftTilePos : line)) {
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
                    let maxLeft = 0;
                    let p = anchorPos - 1;
                    while (p >= 0) {
                        const pr = isRow ? line : p;
                        const pc = isRow ? p : line;
                        if (getCell(board, pr, pc)) break;
                        let isAnchor = false;
                        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                            if (getCell(board, pr + dr, pc + dc)) { isAnchor = true; break; }
                        }
                        if (isAnchor && p !== anchorPos) break;
                        maxLeft++;
                        p--;
                    }

                    for (let len = 0; len <= maxLeft; len++) {
                        const startPos = anchorPos - len;
                        buildLeftPartForwards(
                            trie.root, startPos, anchorPos, [], '',
                            { ...rackCounts }, crossChecks, board, trie, rackValueMap,
                            line, isRow, moves, anchorPos
                        );
                    }
                }
            }
        }
    }

    return moves;
}

function buildLeftPartForwards(
    node, currentPos, anchorPos, partialTiles, partialWord,
    rack, crossChecks, board, trie, rackValueMap,
    line, isRow, moves, origAnchor
) {
    if (currentPos === anchorPos) {
        extendRight(
            node, anchorPos, [...partialTiles], partialWord,
            { ...rack }, crossChecks, board, trie, rackValueMap,
            line, isRow, moves, origAnchor
        );
        return;
    }

    const cc = crossChecks[currentPos];
    for (const ch of ALPHABET) {
        if (cc && !cc.has(ch)) continue;
        if (!node.children[ch]) continue;

        if (rack[ch] && rack[ch] > 0) {
            rack[ch]--;
            partialTiles.push({ pos: currentPos, letter: ch, value: rackValueMap[ch] || 0, isBlank: false, fromBoard: false });
            buildLeftPartForwards(
                node.children[ch], currentPos + 1, anchorPos, partialTiles, partialWord + ch,
                rack, crossChecks, board, trie, rackValueMap,
                line, isRow, moves, origAnchor
            );
            partialTiles.pop();
            rack[ch]++;
        }

        if (rack['_'] && rack['_'] > 0) {
            rack['_']--;
            partialTiles.push({ pos: currentPos, letter: ch, value: 0, isBlank: true, fromBoard: false });
            buildLeftPartForwards(
                node.children[ch], currentPos + 1, anchorPos, partialTiles, partialWord + ch,
                rack, crossChecks, board, trie, rackValueMap,
                line, isRow, moves, origAnchor
            );
            partialTiles.pop();
            rack['_']++;
        }
    }
}

function extendRight(
    node, pos, partialTiles, partialWord,
    rack, crossChecks, board, trie, rackValueMap,
    line, isRow, moves, origAnchor
) {
    if (pos >= BOARD_SIZE) {
        if (node.isTerminal && partialTiles.some(t => !t.fromBoard) && pos > origAnchor) {
            recordMove(partialTiles, line, isRow, board, moves);
        }
        return;
    }

    const r = isRow ? line : pos;
    const c = isRow ? pos : line;
    const cell = getCell(board, r, c);

    if (cell) {
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
    } else {
        if (node.isTerminal && partialTiles.length > 0 && partialTiles.some(t => !t.fromBoard) && pos > origAnchor) {
            recordMove([...partialTiles], line, isRow, board, moves);
        }

        const cc = crossChecks[pos];

        for (const ch of ALPHABET) {
            if (cc && !cc.has(ch)) continue;
            if (!node.children[ch]) continue;

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

function recordMove(partialTiles, line, isRow, board, moves) {
    const newTiles = [];
    for (const t of partialTiles) {
        if (t.fromBoard) continue;
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

    const score = estimateScore(partialTiles, line, isRow);
    moves.push({ tiles: newTiles, score });
}

function estimateScore(partialTiles, line, isRow) {
    let wordScore = 0;
    let wordMultiplier = 1;

    for (const t of partialTiles) {
        const r = isRow ? line : t.pos;
        const c = isRow ? t.pos : line;
        const key = `${c},${r}`;
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

    const placedCount = partialTiles.filter(t => !t.fromBoard).length;
    if (placedCount === 7) total += 50;

    return total;
}

const GOOD_LEAVES = new Set(['S', 'E', 'R', 'A', 'T', 'N', 'I', '_']);
const BAD_LEAVES  = new Set(['Q', 'V', 'J', 'X', 'Z']);
const OBSCURE_TWO_LETTER = new Set([
    'ZA', 'QI', 'XI', 'XU', 'JO', 'JA', 'ZO', 'ZE',
    'KA', 'KI', 'KY', 'QUA', 'GI', 'GU', 'DI', 'FE',
    'YU', 'WO', 'YA', 'YE', 'BI', 'BO', 'OB', 'OX',
    'AX', 'EX', 'ZAP'
]);

function rackLeaveScore(hand, usedTiles) {
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

    const vowels = remaining.filter(t => 'AEIOU'.includes(t.letter)).length;
    if (remaining.length > 0) {
        const ratio = vowels / Math.max(1, remaining.length);
        if (ratio >= 0.3 && ratio <= 0.55) score += 4;
    }

    return score;
}

function selectMoveByDifficulty(moves, difficulty, hand) {
    if (!moves || moves.length === 0) return null;

    switch (difficulty) {
        case 'hard': {
            const scored = moves.map(m => ({
                ...m,
                combinedScore: m.score + rackLeaveScore(hand, m.tiles) * 2
            }));
            scored.sort((a, b) => b.combinedScore - a.combinedScore);
            return { type: 'move', ...scored[0] };
        }
        case 'medium': {
            let filtered = moves.filter(m => {
                const word = m.tiles.map(t => t.letter).join('');
                return !OBSCURE_TWO_LETTER.has(word);
            });
            if (filtered.length === 0) filtered = moves;
            filtered.sort((a, b) => b.score - a.score);
            const maxScore = filtered[0].score;
            const capped = filtered.filter(m => m.score <= maxScore * 0.85);
            const pool = capped.length > 0
                ? capped.slice(0, Math.max(1, Math.ceil(capped.length * 0.5)))
                : filtered.slice(0, Math.max(1, Math.ceil(filtered.length * 0.5)));
            return { type: 'move', ...pool[Math.floor(Math.random() * pool.length)] };
        }
        case 'easy':
        default: {
            let filtered = moves.filter(m => {
                const word = m.tiles.map(t => t.letter).join('');
                return !OBSCURE_TWO_LETTER.has(word);
            });
            if (filtered.length === 0) filtered = moves;
            filtered.sort((a, b) => b.score - a.score);
            const maxScore = filtered[0].score;
            const capped = filtered.filter(m => m.score <= maxScore * 0.55);
            const pool = capped.length > 0 ? capped : filtered.slice(-Math.max(1, Math.ceil(filtered.length * 0.5)));
            if (pool.length > 0 && pool[0].score < 8 && Math.random() < 0.1) {
                return null;
            }
            return { type: 'move', ...pool[Math.floor(Math.random() * pool.length)] };
        }
    }
}

function selectTilesToExchange(hand) {
    const sorted = hand
        .map((t, i) => ({ ...t, idx: i }))
        .sort((a, b) => {
            if (BAD_LEAVES.has(a.letter) && !BAD_LEAVES.has(b.letter)) return -1;
            if (!BAD_LEAVES.has(a.letter) && BAD_LEAVES.has(b.letter)) return 1;
            return b.value - a.value;
        });

    const count = Math.min(4, Math.max(2, hand.length - 3));
    return sorted.slice(0, count).map(t => t.idx);
}

export function findBestMove(board, hand, tileBag, difficulty = 'medium') {
    const allMoves = generateAllMoves(board, hand);

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

    if (tileBag.length >= 1 && hand.length > 0) {
        return { type: 'exchange', tileIndices: selectTilesToExchange(hand) };
    }

    return { type: 'pass' };
}

export function warmUp() {
    getTrie();
}
