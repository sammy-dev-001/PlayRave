// ============================================================================
// LudoEngine.js — Pure Authoritative 2-4 Player Online Ludo Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to GameRouter.
// Every player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

// ─── Track Geometry Constants ────────────────────────────────────────────────
// 52-cell outer track. Start squares: P0=0, P1=13, P2=26, P3=39
const PLAYER_START = [0, 13, 26, 39];
const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const PLAYER_COLORS = ['#FF007F', '#00FFFF', '#FFD700', '#39FF14']; // P0(Pink), P1(Cyan), P2(Yellow), P3(Green)
const COLOR_NAMES = ['Pink', 'Cyan', 'Yellow', 'Green'];

class LudoEngine {
    constructor() {
        this.activeGames = new Map(); // roomId -> gameState
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'ludo-roll-dice':
            case 'roll-dice':
                return this.rollDice(roomId, userId);
            case 'ludo-move-token':
            case 'move-token':
                return this.moveToken(roomId, userId, payload.tokenId);
            case 'ludo-get-state':
            case 'get-state':
                return this.getState(roomId, userId);
            case 'ludo-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Ludo event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;

        const participatingRoomPlayers = hostParticipates
            ? room.players
            : room.players.filter(p => !p.isHost);

        // Clamp to 2-4 players
        const numPlayers = Math.min(4, Math.max(2, participatingRoomPlayers.length));
        const activeSlice = participatingRoomPlayers.slice(0, numPlayers);

        // Determine player colors & positions:
        // 2 players: P0 (Pink, bottom-left) & P2 (Yellow, top-right) for opposite diagonal balance
        // 3-4 players: P0, P1, P2, (P3)
        let colorAssignments = [0, 1, 2, 3];
        if (numPlayers === 2) {
            colorAssignments = [0, 2];
        } else if (numPlayers === 3) {
            colorAssignments = [0, 1, 2];
        }

        const players = activeSlice.map((p, idx) => {
            const colorIdx = colorAssignments[idx];
            return {
                userId: p.userId,
                name: p.name,
                avatar: p.avatar,
                colorIdx,
                color: PLAYER_COLORS[colorIdx],
                colorName: COLOR_NAMES[colorIdx],
                tokens: [0, 1, 2, 3].map(id => ({
                    id,
                    pos: -1,     // -1: in yard; 0-50: on main track; 51: entering home column
                    homePos: -1, // -1: not in home col; 0-4: home path; 5: finished home
                    finished: false
                })),
                finishedCount: 0
            };
        });

        const gameState = {
            type: 'ludo',
            roomId,
            players,
            currentTurnIndex: 0,
            currentTurnUserId: players[0].userId,
            phase: 'rolling', // 'rolling' | 'moving' | 'finished'
            diceValue: null,
            consecutiveSixes: 0,
            movableTokens: [],
            lastMove: null,
            winner: null,
            rankings: [],
            turnNumber: 1
        };

        this.activeGames.set(roomId, gameState);

        return {
            action: 'broadcast',
            event: 'game-started',
            data: {
                gameType: 'ludo',
                gameState: this.getGameState(roomId, players[0].userId),
                players: room.players.map(pl => ({
                    uid: pl.userId,
                    userId: pl.userId,
                    id: pl.socketId,
                    name: pl.name,
                    avatar: pl.avatar
                })),
                hostParticipates
            }
        };
    }

    // ─── Roll Dice ───────────────────────────────────────────────────────────
    rollDice(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'rolling') return { action: 'error', message: 'Not in rolling phase' };
        if (game.currentTurnUserId !== userId) return { action: 'error', message: 'Not your turn' };

        const diceValue = Math.floor(Math.random() * 6) + 1;
        game.diceValue = diceValue;

        const currentPlayer = game.players[game.currentTurnIndex];

        // Track consecutive sixes
        if (diceValue === 6) {
            game.consecutiveSixes += 1;
        } else {
            game.consecutiveSixes = 0;
        }

        // Rule: 3 consecutive 6s forfeits the turn
        if (game.consecutiveSixes >= 3) {
            game.consecutiveSixes = 0;
            const prevPlayerName = currentPlayer.name;
            this._advanceTurn(game);

            return {
                action: 'broadcast',
                event: 'ludo-state-update',
                data: {
                    gameState: this._publicState(game),
                    message: `${prevPlayerName} rolled three 6s in a row! Turn forfeited.`
                }
            };
        }

        // Calculate legal moves for this player's tokens
        const movable = this._getMovableTokens(currentPlayer, diceValue, game.players);
        game.movableTokens = movable;

        if (movable.length === 0) {
            // No moves possible -> turn ends (unless player has bonus roll, but without move, turn ends)
            game.phase = 'rolling';
            const prevPlayerName = currentPlayer.name;
            const rolledNum = diceValue;
            this._advanceTurn(game);

            return {
                action: 'broadcast',
                event: 'ludo-state-update',
                data: {
                    gameState: this._publicState(game),
                    diceValue: rolledNum,
                    message: `${prevPlayerName} rolled a ${rolledNum} with no legal moves.`
                }
            };
        }

        // Player must pick a token to move
        game.phase = 'moving';

        return {
            action: 'broadcast',
            event: 'ludo-state-update',
            data: {
                gameState: this._publicState(game),
                diceValue,
                movableTokens: movable
            }
        };
    }

    // ─── Move Token ──────────────────────────────────────────────────────────
    moveToken(roomId, userId, tokenId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'moving') return { action: 'error', message: 'Not in moving phase' };
        if (game.currentTurnUserId !== userId) return { action: 'error', message: 'Not your turn' };

        const currentPlayer = game.players[game.currentTurnIndex];
        const token = currentPlayer.tokens.find(t => t.id === tokenId);
        if (!token) return { action: 'error', message: 'Token not found' };

        if (!game.movableTokens.includes(tokenId)) {
            return { action: 'error', message: 'Illegal token move' };
        }

        const dv = game.diceValue;
        let capturedToken = null;
        let tokenMadeItHome = false;

        // Apply Move
        if (token.pos === -1) {
            // Exiting yard to start square
            token.pos = 0;
            token.homePos = -1;
        } else if (token.homePos >= 0) {
            // Advancing in home column
            token.homePos += dv;
            if (token.homePos === 5) {
                token.finished = true;
                tokenMadeItHome = true;
                currentPlayer.finishedCount += 1;
            }
        } else {
            // Advancing on main track
            const nextPos = token.pos + dv;
            if (nextPos > 50) {
                // Entering home column
                token.pos = 51;
                token.homePos = nextPos - 51;
                if (token.homePos === 5) {
                    token.finished = true;
                    tokenMadeItHome = true;
                    currentPlayer.finishedCount += 1;
                }
            } else {
                token.pos = nextPos;
            }
        }

        // Check for capture if on main track
        if (token.pos >= 0 && token.pos <= 50) {
            const absIdx = (PLAYER_START[currentPlayer.colorIdx] + token.pos) % 52;
            const isSafe = SAFE_INDICES.has(absIdx);

            if (!isSafe) {
                // Find any opposing token at the exact same absIdx
                for (const otherPlayer of game.players) {
                    if (otherPlayer.userId === currentPlayer.userId) continue;

                    for (const oppToken of otherPlayer.tokens) {
                        if (oppToken.pos >= 0 && oppToken.pos <= 50) {
                            const oppAbsIdx = (PLAYER_START[otherPlayer.colorIdx] + oppToken.pos) % 52;
                            if (oppAbsIdx === absIdx) {
                                // Captured!
                                oppToken.pos = -1;
                                oppToken.homePos = -1;
                                capturedToken = {
                                    victimUserId: otherPlayer.userId,
                                    victimName: otherPlayer.name,
                                    victimTokenId: oppToken.id
                                };
                                break;
                            }
                        }
                    }
                    if (capturedToken) break;
                }
            }
        }

        // Check Win Condition
        if (currentPlayer.finishedCount === 4) {
            if (!game.rankings.includes(currentPlayer.userId)) {
                game.rankings.push(currentPlayer.userId);
            }
            if (!game.winner) {
                game.winner = currentPlayer.userId;
            }

            // If only 1 player remaining with unfinished tokens, finish game
            const unfinished = game.players.filter(p => p.finishedCount < 4);
            if (unfinished.length <= 1) {
                if (unfinished.length === 1 && !game.rankings.includes(unfinished[0].userId)) {
                    game.rankings.push(unfinished[0].userId);
                }
                game.phase = 'finished';

                return {
                    action: 'broadcast',
                    event: 'ludo-game-over',
                    data: {
                        gameState: this._publicState(game),
                        winner: currentPlayer,
                        rankings: game.rankings
                    }
                };
            }
        }

        // Bonus Turn determination:
        // Rolling a 6 OR Capturing an opponent OR Reaching home gives a BONUS ROLL!
        const getsBonusRoll = (dv === 6) || Boolean(capturedToken) || tokenMadeItHome;

        game.lastMove = {
            userId: currentPlayer.userId,
            tokenId,
            diceValue: dv,
            captured: capturedToken,
            reachedHome: tokenMadeItHome,
            bonusRoll: getsBonusRoll
        };

        if (getsBonusRoll && currentPlayer.finishedCount < 4) {
            // Stay with same player for bonus roll
            game.phase = 'rolling';
            game.diceValue = null;
            game.movableTokens = [];
        } else {
            // Advance turn to next player
            this._advanceTurn(game);
        }

        return {
            action: 'broadcast',
            event: 'ludo-state-update',
            data: {
                gameState: this._publicState(game),
                lastMove: game.lastMove
            }
        };
    }

    // ─── Turn Management ─────────────────────────────────────────────────────
    _advanceTurn(game) {
        let attempts = 0;
        let nextIndex = game.currentTurnIndex;

        do {
            nextIndex = (nextIndex + 1) % game.players.length;
            attempts += 1;
        } while (game.players[nextIndex].finishedCount === 4 && attempts < game.players.length);

        game.currentTurnIndex = nextIndex;
        game.currentTurnUserId = game.players[nextIndex].userId;
        game.phase = 'rolling';
        game.diceValue = null;
        game.consecutiveSixes = 0;
        game.movableTokens = [];
        game.turnNumber += 1;
    }

    // ─── Legal Moves Calculation ─────────────────────────────────────────────
    _getMovableTokens(player, dv, allPlayers) {
        const movable = [];
        const bdSet = this._buildBlockadeMap(allPlayers);

        for (const token of player.tokens) {
            if (token.finished) continue;

            if (token.pos === -1) {
                // Must roll 6 to exit yard
                if (dv === 6) {
                    const startAbs = PLAYER_START[player.colorIdx];
                    // Check if entry square is blockaded by opposing blockade
                    if (!this._isBlockadedByOpponents(startAbs, player.userId, bdSet)) {
                        movable.push(token.id);
                    }
                }
                continue;
            }

            if (token.homePos >= 0) {
                // In home column: exact or partial advance
                if (token.homePos + dv <= 5) {
                    movable.push(token.id);
                }
                continue;
            }

            // On main track
            const nextPos = token.pos + dv;
            if (nextPos > 55) {
                // Overshot home (max is 50 track + 5 home = 55)
                continue;
            }

            // Check if path is blocked by opponent blockades
            if (this._isPathClear(token, dv, player, bdSet)) {
                movable.push(token.id);
            }
        }

        return movable;
    }

    _buildBlockadeMap(allPlayers) {
        // Map: `${absIdx}_${userId}` -> count
        const counts = {};
        for (const p of allPlayers) {
            for (const t of p.tokens) {
                if (t.pos >= 0 && t.pos <= 50) {
                    const absIdx = (PLAYER_START[p.colorIdx] + t.pos) % 52;
                    const key = `${absIdx}_${p.userId}`;
                    counts[key] = (counts[key] || 0) + 1;
                }
            }
        }
        return counts;
    }

    _isBlockadedByOpponents(absIdx, myUserId, bdMap) {
        // Safe squares don't form blockades in standard rules, but if 2+ opponents stand together on non-safe
        if (SAFE_INDICES.has(absIdx)) return false;

        for (const [key, count] of Object.entries(bdMap)) {
            if (count >= 2) {
                const [idxStr, ownerId] = key.split('_');
                if (parseInt(idxStr, 10) === absIdx && ownerId !== myUserId) {
                    return true;
                }
            }
        }
        return false;
    }

    _isPathClear(token, steps, player, bdMap) {
        for (let s = 1; s <= steps; s++) {
            const stepPos = token.pos + s;
            if (stepPos > 50) break; // entering home column, safe from blockades
            const absIdx = (PLAYER_START[player.colorIdx] + stepPos) % 52;
            if (this._isBlockadedByOpponents(absIdx, player.userId, bdMap)) {
                return false;
            }
        }
        return true;
    }

    // ─── State Helpers ───────────────────────────────────────────────────────
    getGameState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;
        return this._publicState(game);
    }

    _publicState(game) {
        return {
            type: 'ludo',
            roomId: game.roomId,
            players: game.players,
            currentTurnIndex: game.currentTurnIndex,
            currentTurnUserId: game.currentTurnUserId,
            phase: game.phase,
            diceValue: game.diceValue,
            movableTokens: game.movableTokens,
            lastMove: game.lastMove,
            winner: game.winner,
            rankings: game.rankings,
            turnNumber: game.turnNumber
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return {
            action: 'broadcast',
            event: 'ludo-ended',
            data: { message: 'Ludo match ended.' }
        };
    }
}

module.exports = new LudoEngine();

