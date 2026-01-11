import { isValidWord } from '../data/scrabbleData';

/**
 * ScrabbleAI - AI opponent for single-player Scrabble
 * Supports three difficulty levels: easy, medium, hard
 */
class ScrabbleAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
    }

    /**
     * Find the best move for the AI based on current difficulty
     */
    findBestMove(board, hand, tileBag) {
        const allMoves = this.findAllPossibleMoves(board, hand);

        if (allMoves.length === 0) {
            // No valid moves, decide to pass or exchange
            if (tileBag.length >= 1 && hand.length > 0) {
                return { type: 'exchange', tileIndices: this.selectTilesToExchange(hand) };
            }
            return { type: 'pass' };
        }

        return this.selectMoveByDifficulty(allMoves);
    }

    /**
     * Find all possible valid moves on the board
     */
    findAllPossibleMoves(board, hand) {
        const moves = [];

        // First move - must go through center
        const hasExistingTiles = Object.keys(board).length > 0;

        if (!hasExistingTiles) {
            // First move - try words through center (7,7)
            moves.push(...this.findFirstMoveCandidates(hand));
        } else {
            // Find all anchor points (empty squares adjacent to tiles)
            const anchorPoints = this.findAnchorPoints(board);

            for (const anchor of anchorPoints) {
                moves.push(...this.findMovesAtAnchor(board, hand, anchor));
            }
        }

        return moves.filter(move => move.score > 0);
    }

    /**
     * Find candidates for first move (through center)
     */
    findFirstMoveCandidates(hand) {
        const CENTER = 7;
        const moves = [];

        // Try 2-7 letter words from hand
        for (let wordLen = 2; wordLen <= Math.min(hand.length, 7); wordLen++) {
            const combinations = this.generateCombinations(hand, wordLen);

            for (const combo of combinations) {
                const word = combo.map(t => t.letter).join('');

                if (isValidWord(word)) {
                    // Try horizontal through center
                    const startCol = CENTER - Math.floor(wordLen / 2);
                    const tiles = combo.map((tile, i) => ({
                        x: CENTER,
                        y: startCol + i,
                        letter: tile.letter,
                        value: tile.value
                    }));

                    moves.push({
                        word,
                        tiles,
                        score: this.calculateScore(tiles, {}),
                        direction: 'horizontal'
                    });
                }
            }
        }

        return moves;
    }

    /**
     * Find anchor points (empty squares adjacent to existing tiles)
     */
    findAnchorPoints(board) {
        const anchors = new Set();

        for (const key in board) {
            const [x, y] = key.split(',').map(Number);

            // Check all 4 adjacent squares
            const adjacent = [
                [x - 1, y], [x + 1, y],
                [x, y - 1], [x, y + 1]
            ];

            for (const [ax, ay] of adjacent) {
                if (ax >= 0 && ax < 15 && ay >= 0 && ay < 15) {
                    const anchorKey = `${ax},${ay}`;
                    if (!board[anchorKey]) {
                        anchors.add(anchorKey);
                    }
                }
            }
        }

        return Array.from(anchors).map(key => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Find valid moves at a specific anchor point
     */
    findMovesAtAnchor(board, hand, anchor) {
        const moves = [];

        // Try horizontal
        moves.push(...this.findWordsInDirection(board, hand, anchor, 'horizontal'));

        // Try vertical
        moves.push(...this.findWordsInDirection(board, hand, anchor, 'vertical'));

        return moves;
    }

    /**
     * Find words in a specific direction from anchor
     */
    findWordsInDirection(board, hand, anchor, direction) {
        const moves = [];
        const isHorizontal = direction === 'horizontal';

        // Simple approach: try 2-4 tiles from hand
        for (let len = 2; len <= Math.min(hand.length, 4); len++) {
            const combos = this.generateCombinations(hand, len);

            for (const combo of combos) {
                const word = combo.map(t => t.letter).join('');

                if (isValidWord(word)) {
                    const tiles = combo.map((tile, i) => ({
                        x: isHorizontal ? anchor.x : anchor.x + i,
                        y: isHorizontal ? anchor.y + i : anchor.y,
                        letter: tile.letter,
                        value: tile.value
                    }));

                    // Quick validation: no overlaps
                    const hasOverlap = tiles.some(t => board[`${t.x},${t.y}`]);
                    if (!hasOverlap) {
                        moves.push({
                            word,
                            tiles,
                            score: this.calculateScore(tiles, board),
                            direction
                        });
                    }
                }
            }
        }

        return moves;
    }

    /**
     * Generate all combinations of n tiles from hand
     */
    generateCombinations(hand, n) {
        if (n === 0) return [[]];
        if (n > hand.length) return [];

        const result = [];

        function combine(start, combo) {
            if (combo.length === n) {
                result.push([...combo]);
                return;
            }

            for (let i = start; i < hand.length; i++) {
                combo.push(hand[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }

        combine(0, []);
        return result;
    }

    /**
     * Calculate score for a move (simplified)
     */
    calculateScore(tiles, board) {
        // Basic score calculation
        let score = tiles.reduce((sum, t) => sum + t.value, 0);

        // Bonus for using all 7 tiles
        if (tiles.length === 7) {
            score += 50;
        }

        return score;
    }

    /**
     * Select move based on difficulty level
     */
    selectMoveByDifficulty(moves) {
        if (moves.length === 0) return null;

        // Sort by score
        moves.sort((a, b) => b.score - a.score);

        switch (this.difficulty) {
            case 'easy':
                // Random move
                return {
                    type: 'move',
                    ...moves[Math.floor(Math.random() * moves.length)]
                };

            case 'medium':
                // Top 50% of moves
                const mediumPool = moves.slice(0, Math.max(1, Math.ceil(moves.length * 0.5)));
                return {
                    type: 'move',
                    ...mediumPool[Math.floor(Math.random() * mediumPool.length)]
                };

            case 'hard':
                // Best move
                return {
                    type: 'move',
                    ...moves[0]
                };

            default:
                return {
                    type: 'move',
                    ...moves[0]
                };
        }
    }

    /**
     * Select tiles to exchange (for when no moves available)
     */
    selectTilesToExchange(hand) {
        // Exchange 2-4 low-value tiles
        const sortedByValue = [...hand].sort((a, b) => a.value - b.value);
        const exchangeCount = Math.min(4, Math.max(2, hand.length - 3));

        return sortedByValue.slice(0, exchangeCount).map((tile, index) =>
            hand.findIndex(t => t === tile)
        );
    }
}

export default ScrabbleAI;
