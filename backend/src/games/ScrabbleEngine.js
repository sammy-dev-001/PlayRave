// ============================================================================
// ScrabbleEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Every player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { createTileBag, drawTiles, BONUS_SQUARES, isValidWord, CENTER_SQUARE } = require('../data/scrabbleData');
const { findBestMove } = require('../ai/ScrabbleAIEngine');

class ScrabbleEngine {
    constructor() {
        this.activeGames = new Map(); // roomId -> gameState
    }

    startScrabbleGame(roomId, room, hostParticipates = true) {
        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                userId: player.userId,
                name: player.name,
                score: 0,
                hand: [],
                isActive: true,
                isAI: false
            });
        });

        const tileBag = createTileBag();

        // Deal initial hands
        players.forEach(player => {
            player.hand = drawTiles(tileBag, 7);
        });

        const gameState = {
            type: 'scrabble',
            roomId,
            players,
            tileBag,
            board: {}, // { "x,y": { letter, value, isLocked: true} }
            currentPlayerIndex: 0,
            phase: 'playing',
            placedTiles: {}, // { userId: [{x, y, letter, value}] }
            turnNumber: 1,
            passCount: 0,
            hostParticipates,
            isSinglePlayer: false
        };

        this.activeGames.set(roomId, gameState);

        const instructions = players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'scrabble',
                gameState: this.getGameState(roomId, p.userId),
                players: players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }


        }));

        return { action: 'multiple', instructions };
    }

    startSinglePlayerGame(roomId, room, difficulty = 'medium') {
        const humanPlayer = room.players[0]; // Single-player = 1 human
        const players = [
            {
                userId: humanPlayer.userId,
                name: humanPlayer.name,
                score: 0,
                hand: [],
                isActive: true,
                isAI: false
            },
            {
                userId: 'ai-bot',
                name: 'AI Opponent',
                score: 0,
                hand: [],
                isActive: true,
                isAI: true
            }
        ];

        const tileBag = createTileBag();
        players.forEach(p => {
            p.hand = drawTiles(tileBag, 7);
        });

        const gameState = {
            type: 'scrabble',
            roomId,
            players,
            tileBag,
            board: {},
            currentPlayerIndex: 0,
            phase: 'playing',
            placedTiles: {},
            turnNumber: 1,
            passCount: 0,
            hostParticipates: true,
            isSinglePlayer: true,
            difficulty
        };

        this.activeGames.set(roomId, gameState);

        return {
            action: 'emit',
            targetId: humanPlayer.userId,
            event: 'game-started',
            data: {
                gameType: 'scrabble',
                gameState: this.getGameState(roomId, humanPlayer.userId),
                players: players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates: true,
                isSinglePlayer: true
            }


        };
    }

    getGameState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return null;

        const player = game.players.find(p => p.userId === userId);
        const currentPlayer = game.players[game.currentPlayerIndex];

        return {
            board: game.board,
            myHand: player ? player.hand : [],
            players: game.players.map(p => ({
                userId: p.userId,
                name: p.name,
                score: p.score,
                handSize: p.hand.length,
                isActive: p.isActive,
                isAI: p.isAI
            })),
            currentPlayerId: currentPlayer.userId,
            currentPlayerName: currentPlayer.name,
            isMyTurn: userId === currentPlayer.userId,
            turnNumber: game.turnNumber,
            tilesInBag: game.tileBag.length,
            phase: game.phase
        };
    }

    placeTiles(roomId, userId, tiles) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };

        game.placedTiles[userId] = tiles;

        return {
            action: 'broadcast',
            event: 'scrabble-tiles-placed',
            data: {
                playerId: userId,
                tiles
            }
        };
    }

    recallTiles(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };

        game.placedTiles[userId] = [];
        return {
            action: 'broadcast',
            event: 'scrabble-tiles-recalled',
            data: { playerId: userId }
        };
    }

    submitMove(roomId, userId, tiles) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };
        if (!tiles || tiles.length === 0) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'No tiles placed' } };

        // Validation 1: Must be in a straight line
        const xs = tiles.map(t => t.x);
        const ys = tiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1;
        const isVertical = new Set(xs).size === 1;

        if (!isHorizontal && !isVertical) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Tiles must be placed in a straight line' } };
        }

        // Validation 2: First turn must touch center
        const isFirstTurn = Object.keys(game.board).length === 0;
        if (isFirstTurn) {
            const touchesCenter = tiles.some(t => t.x === CENTER_SQUARE && t.y === CENTER_SQUARE);
            if (!touchesCenter) {
                return { action: 'emit', targetId: userId, event: 'error', data: { message: 'First word must cover the center square' } };
            }
        } else {
            // Validation 3: Must connect to existing words
            const connects = tiles.some(t => {
                const neighbors = [
                    `${t.x + 1},${t.y}`, `${t.x - 1},${t.y}`,
                    `${t.x},${t.y + 1}`, `${t.x},${t.y - 1}`
                ];
                return neighbors.some(nKey => game.board[nKey] && game.board[nKey].isLocked);
            });
            if (!connects) {
                return { action: 'emit', targetId: userId, event: 'error', data: { message: 'New tiles must connect to existing words' } };
            }
        }

        // Create temporary board with placed tiles
        const tempBoard = { ...game.board };
        tiles.forEach(t => {
            tempBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: false };
        });

        // Extract and validate all formed words
        const formedWords = this.extractScrabbleWords(tempBoard, tiles);

        if (formedWords.length === 0) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'You must form at least one valid word' } };
        }

        const invalidWords = formedWords.filter(w => !isValidWord(w.word));
        if (invalidWords.length > 0) {
            return {
                action: 'emit',
                targetId: userId,
                event: 'error',
                data: {
                    message: 'Invalid words',
                    invalidWords: invalidWords.map(w => w.word)
                }
            };
        }

        // Calculate Score
        const newTilesSet = new Set(tiles.map(t => `${t.x},${t.y}`));
        let score = this.calculateScrabbleScore(formedWords, newTilesSet, BONUS_SQUARES);

        // Bingo bonus
        if (tiles.length === 7) score += 50;

        // Commit tiles to board
        tiles.forEach(t => {
            game.board[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
        });

        // Update player score
        currentPlayer.score += score;

        // Refill hand from bag
        const newTiles = drawTiles(game.tileBag, tiles.length);

        let remainingHand = [...currentPlayer.hand];
        tiles.forEach(playedTile => {
            const searchLetter = playedTile.isBlank ? '_' : playedTile.letter;
            const idx = remainingHand.findIndex(t => t.letter === searchLetter);
            if (idx !== -1) remainingHand.splice(idx, 1);
        });
        currentPlayer.hand = [...remainingHand, ...newTiles].slice(0, 7);

        // Clear placed tiles
        game.placedTiles[userId] = [];
        game.passCount = 0;

        // Next turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        // Check if game should end
        let isGameEnded = false;
        let finalScores = null;

        if (game.tileBag.length === 0 && currentPlayer.hand.length === 0) {
            game.phase = 'finished';
            isGameEnded = true;
            finalScores = this.getScrabbleFinalScores(game);
        }

        const instructions = game.players.map(p => {
            if (p.isAI) return null;
            return {
                action: 'emit',
                targetId: p.userId,
                event: 'scrabble-move-submitted',
                data: {
                    success: true,
                    score,
                    formedWords: formedWords.map(w => w.word),
                    gameState: this.getGameState(roomId, p.userId),
                    gameEnded: isGameEnded,
                    finalScores
                }
            };
        }).filter(Boolean);

        // If the game ended naturally, also broadcast the dedicated end event
        if (isGameEnded) {
            instructions.push({
                action: 'broadcast',
                event: 'scrabble-game-ended',
                data: {
                    finished: true,
                    finalScores,
                    winner: finalScores[0]
                }
            });
        }

        // Trigger AI Turn if it's AI's turn
        if (!isGameEnded && game.players[game.currentPlayerIndex].isAI) {
            instructions.push({ action: 'schedule-ai', delay: 2500, roomId });
        }

        return { action: 'multiple', instructions };
    }

    passTurn(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };

        game.passCount++;

        // Next turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        let isGameEnded = false;
        let finalScores = null;

        if (game.passCount >= game.players.length * 2) {
            game.phase = 'finished';
            isGameEnded = true;
            finalScores = this.getScrabbleFinalScores(game);
        }

        const instructions = game.players.map(p => {
            if (p.isAI) return null;
            return {
                action: 'emit',
                targetId: p.userId,
                event: 'scrabble-turn-passed',
                data: {
                    gameState: this.getGameState(roomId, p.userId),
                    gameEnded: isGameEnded,
                    finalScores
                }
            };
        }).filter(Boolean);

        // If the game ended naturally via passes, also broadcast the dedicated end event
        if (isGameEnded) {
            instructions.push({
                action: 'broadcast',
                event: 'scrabble-game-ended',
                data: {
                    finished: true,
                    finalScores,
                    winner: finalScores[0]
                }
            });
        }

        // Trigger AI Turn if it's AI's turn
        if (!isGameEnded && game.players[game.currentPlayerIndex].isAI) {
            instructions.push({ action: 'schedule-ai', delay: 2500, roomId });
        }

        return { action: 'multiple', instructions };
    }

    exchangeTiles(roomId, userId, tileIndices) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };

        if (!tileIndices || tileIndices.length === 0) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'No tiles selected for exchange' } };
        }

        if (game.tileBag.length < tileIndices.length) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not enough tiles in bag to exchange' } };
        }

        const tilesToReturn = tileIndices.map(idx => currentPlayer.hand[idx]).filter(Boolean);

        if (tilesToReturn.length !== tileIndices.length) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Invalid tile indices' } };
        }

        // Remove exchanged tiles from hand
        const newHand = currentPlayer.hand.filter((_, idx) => !tileIndices.includes(idx));

        // Return tiles to bag and shuffle
        game.tileBag.push(...tilesToReturn);
        for (let i = game.tileBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.tileBag[i], game.tileBag[j]] = [game.tileBag[j], game.tileBag[i]];
        }

        // Draw new tiles
        const newTiles = drawTiles(game.tileBag, tileIndices.length);
        currentPlayer.hand = [...newHand, ...newTiles];

        game.passCount = 0;

        // Advance turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        const instructions = [];

        // Notify exchanger
        instructions.push({
            action: 'emit',
            targetId: userId,
            event: 'scrabble-tiles-exchanged',
            data: {
                success: true,
                gameState: this.getGameState(roomId, userId)
            }
        });

        // Notify others it was a pass
        game.players.forEach(p => {
            if (p.userId !== userId && !p.isAI) {
                instructions.push({
                    action: 'emit',
                    targetId: p.userId,
                    event: 'scrabble-turn-passed',
                    data: {
                        gameState: this.getGameState(roomId, p.userId),
                        gameEnded: false,
                        finalScores: null
                    }
                });
            }
        });

        // Trigger AI Turn if it's AI's turn
        if (game.players[game.currentPlayerIndex].isAI) {
            instructions.push({ action: 'schedule-ai', delay: 2500, roomId });
        }

        return { action: 'multiple', instructions };
    }

    endGame(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'finished';
        const finalScores = this.getScrabbleFinalScores(game);

        return {
            action: 'broadcast',
            event: 'scrabble-game-ended',
            data: {
                finished: true,
                finalScores,
                winner: finalScores[0]
            }
        };
    }

    executeAITurn(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer.isAI) return null;

        const aiHand = currentPlayer.hand;
        const move = findBestMove(game.board, aiHand, game.tileBag, game.difficulty || 'medium');

        let resultInstruction;
        let aiAction;

        if (!move || move.type === 'pass') {
            resultInstruction = this.passTurn(roomId, currentPlayer.userId);
            aiAction = 'pass';
        } else if (move.type === 'exchange' && move.tileIndices) {
            resultInstruction = this.exchangeTiles(roomId, currentPlayer.userId, move.tileIndices);
            aiAction = 'exchange';
        } else if (move.type === 'move' && move.tiles) {
            resultInstruction = this.submitMove(roomId, currentPlayer.userId, move.tiles);
            if (resultInstruction.action === 'emit' && resultInstruction.data && resultInstruction.data.message) {
                // Rejected move, fallback to pass
                resultInstruction = this.passTurn(roomId, currentPlayer.userId);
                aiAction = 'pass';
            } else {
                aiAction = 'move';
            }
        } else {
            resultInstruction = this.passTurn(roomId, currentPlayer.userId);
            aiAction = 'pass';
        }

        // Add the 'isAITurn' flag so the frontend knows who triggered this update
        if (resultInstruction.action === 'multiple') {
            resultInstruction.instructions.forEach(inst => {
                if (inst.data) {
                    inst.data.isAITurn = true;
                    if (aiAction === 'exchange' && inst.event === 'scrabble-turn-passed') {
                        inst.data.aiExchanged = true;
                    }
                }
            });
        }

        return resultInstruction;
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'scrabble-place-tiles':
                return this.placeTiles(roomId, userId, payload.tiles);
            case 'scrabble-recall-tiles':
                return this.recallTiles(roomId, userId);
            case 'scrabble-submit-move':
                return this.submitMove(roomId, userId, payload.tiles);
            case 'scrabble-pass-turn':
                return this.passTurn(roomId, userId);
            case 'scrabble-exchange-tiles':
                return this.exchangeTiles(roomId, userId, payload.tileIndices);
            case 'scrabble-end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Scrabble event: ${eventName}` };
        }
    }

    // --- Helpers ---

    extractScrabbleWords(tempBoard, newlyPlacedTiles) {
        const words = []; // Array to store all unique words formed
        const wordKeys = new Set(); // To prevent duplicates: "WORD-StartX,StartY-Orientation"

        const getTile = (x, y) => tempBoard[`${x},${y}`];

        const extractFullWord = (startX, startY, dx, dy) => {
            let x = startX;
            let y = startY;

            while (getTile(x - dx, y - dy)) {
                x -= dx;
                y -= dy;
            }

            let word = '';
            let tiles = [];
            let currentX = x;
            let currentY = y;

            while (getTile(currentX, currentY)) {
                const tile = getTile(currentX, currentY);
                word += tile.letter;
                tiles.push({ x: currentX, y: currentY, ...tile });
                currentX += dx;
                currentY += dy;
            }

            return { word, tiles, startX: x, startY: y };
        };

        const xs = newlyPlacedTiles.map(t => t.x);
        const ys = newlyPlacedTiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1 && newlyPlacedTiles.length > 0;
        const isVertical = new Set(xs).size === 1 && newlyPlacedTiles.length > 0;
        const isSingleTile = newlyPlacedTiles.length === 1;

        const orientation = isHorizontal ? 'H' : (isVertical ? 'V' : (isSingleTile ? 'BOTH' : 'INVALID'));

        if (orientation === 'INVALID') return [];

        if (orientation === 'H' || (isSingleTile && (getTile(newlyPlacedTiles[0].x - 1, newlyPlacedTiles[0].y) || getTile(newlyPlacedTiles[0].x + 1, newlyPlacedTiles[0].y)))) {
            const t = newlyPlacedTiles[0];
            const hWord = extractFullWord(t.x, t.y, 1, 0);
            if (hWord.word.length > 1) {
                const key = `H-${hWord.startX},${hWord.startY}`;
                if (!wordKeys.has(key)) {
                    wordKeys.add(key);
                    words.push(hWord);
                }
            }
        }

        if (orientation === 'V' || (isSingleTile && (getTile(newlyPlacedTiles[0].x, newlyPlacedTiles[0].y - 1) || getTile(newlyPlacedTiles[0].x, newlyPlacedTiles[0].y + 1)))) {
            const t = newlyPlacedTiles[0];
            const vWord = extractFullWord(t.x, t.y, 0, 1);
            if (vWord.word.length > 1) {
                const key = `V-${vWord.startX},${vWord.startY}`;
                if (!wordKeys.has(key)) {
                    wordKeys.add(key);
                    words.push(vWord);
                }
            }
        }

        newlyPlacedTiles.forEach(tile => {
            if (orientation === 'H' || isSingleTile) {
                const vWord = extractFullWord(tile.x, tile.y, 0, 1);
                if (vWord.word.length > 1) {
                    const key = `V-${vWord.startX},${vWord.startY}`;
                    if (!wordKeys.has(key)) {
                        wordKeys.add(key);
                        words.push(vWord);
                    }
                }
            }

            if (orientation === 'V' || isSingleTile) {
                const hWord = extractFullWord(tile.x, tile.y, 1, 0);
                if (hWord.word.length > 1) {
                    const key = `H-${hWord.startX},${hWord.startY}`;
                    if (!wordKeys.has(key)) {
                        wordKeys.add(key);
                        words.push(hWord);
                    }
                }
            }
        });

        return words;
    }

    calculateScrabbleScore(formedWords, newTilesSet, BONUS_SQUARES) {
        let totalScore = 0;

        formedWords.forEach(wordObj => {
            let wordScore = 0;
            let wordMultiplier = 1;

            wordObj.tiles.forEach(tile => {
                const key = `${tile.x},${tile.y}`;
                const isNew = newTilesSet.has(key);
                let letterScore = tile.value || 0;

                if (isNew) {
                    const bonus = BONUS_SQUARES[key];
                    if (bonus === 'DL') letterScore *= 2;
                    if (bonus === 'TL') letterScore *= 3;
                    if (bonus === 'DW') wordMultiplier *= 2;
                    if (bonus === 'TW') wordMultiplier *= 3;
                }

                wordScore += letterScore;
            });

            totalScore += wordScore * wordMultiplier;
        });

        return totalScore;
    }

    getScrabbleFinalScores(game) {
        const finalScores = game.players.map(p => {
            const unplayedTileScore = p.hand.reduce((sum, tile) => sum + (tile.value || 0), 0);
            return {
                playerId: p.userId, // Maintain backwards compatibility name 'playerId' if frontend relies on it, but populate with userId
                playerName: p.name,
                score: p.score - unplayedTileScore
            };
        });

        const playerWithEmptyHand = game.players.find(p => p.hand.length === 0);
        if (playerWithEmptyHand) {
            const totalUnplayedTilesScore = game.players.reduce((sum, p) => {
                if (p.userId !== playerWithEmptyHand.userId) {
                    return sum + p.hand.reduce((tileSum, tile) => tileSum + (tile.value || 0), 0);
                }
                return sum;
            }, 0);

            const playerWithEmptyHandScoreEntry = finalScores.find(fs => fs.playerId === playerWithEmptyHand.userId);
            if (playerWithEmptyHandScoreEntry) {
                playerWithEmptyHandScoreEntry.score += totalUnplayedTilesScore;
            }
        }

        return finalScores.sort((a, b) => b.score - a.score);
    }
}

module.exports = new ScrabbleEngine();
