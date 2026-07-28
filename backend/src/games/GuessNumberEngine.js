// ============================================================================
// GuessNumberEngine.js — Hybrid Number Guessing Game (2-player duel & Multiplayer)
// ============================================================================
//
// GAME PHASE FLOW
// ───────────────
//  2-Player Mode  :  AWAITING_SECRET → PLAYING → GAME_OVER
//  Multiplayer    :                    PLAYING  → GAME_OVER
//
// MODES (determined by player count at startGame)
// ────────────────────────────────────────────────
//  players.length === 2 (Duel)
//    • Phase starts at 'AWAITING_SECRET'.
//    • Both players must call setSecretNumber() to set the target for their opponent.
//    • Once both secrets are set, phase flips to 'PLAYING'.
//    • Players take turns guessing the secret set for them.
//
//  players.length > 2  (Multiplayer)
//    • A single target is auto-generated on startGame and assigned to everyone.
//    • Phase begins at 'PLAYING' immediately; all players guess simultaneously.
//    • First player to guess correctly wins the round.
//
// CHEAT PREVENTION
// ────────────────
//  The internal `targets` mapping is NEVER included in any broadcast payload.
//  Only the _publicState() helper is used for all outgoing data.
//  `targets` is ONLY revealed in the GAME_OVER event payload.
// ============================================================================

const SECRET_MIN = 1;
const SECRET_MAX = 100;
const MAX_GUESSES = 10;
const TURN_TIMEOUT_MS = 30_000; // 30 seconds per turn (2-player mode only)
const MAX_ROUNDS    = 3;        // Best of 3
const ROUNDS_TO_WIN = 2;        // First to 2 round wins = overall winner

class GuessNumberEngine {
    constructor() {
        /** @type {Map<string, Object>} roomId → internal game state */
        this.activeGames = new Map();
    }

    startGame(room, options = {}) {
        const roomId           = room.id;
        const hostParticipates = options.hostParticipates !== false;

        const allPlayers = room.players
            .filter(p => hostParticipates || !p.isHost)
            .map(p => ({
                userId:     p.userId,
                name:       p.name,
                avatar:     p.avatar || null,
                guesses:    [],
                guessCount: 0,
                eliminated: false,
                isWinner:   false,
            }));

        const rangeMin = options.minNumber ?? SECRET_MIN;
        const rangeMax = options.maxNumber ?? SECRET_MAX;

        let gamePhase;
        let targets = {};
        let secretsSetBy = [];
        let currentTurnId = null;

        if (allPlayers.length === 2) {
            gamePhase = 'AWAITING_SECRET';
            // Wait for both to set secrets
        } else {
            gamePhase = 'PLAYING';
            const sharedSecret = this._randomInt(rangeMin, rangeMax);
            allPlayers.forEach(p => {
                targets[p.userId] = sharedSecret;
            });
            // No strict turns in multiplayer
        }

        const gameState = {
            type:           'guess-number',
            roomId,
            players:        allPlayers,
            targets,                 // ⚠ INTERNAL ONLY — NEVER broadcast
            secretsSetBy,
            gamePhase,
            currentTurnId,
            rangeMin,
            rangeMax,
            roundNumber:    1,
            maxRounds:      options.maxRounds ?? MAX_ROUNDS,
            roundScores:    Object.fromEntries(allPlayers.map(p => [p.userId, 0])),
            firstPlayerId:  allPlayers[0]?.userId ?? null, // who goes first in each round
            hostParticipates,
            turnSeq:        0,       // Increments each turn; lets timeout callbacks self-invalidate
        };

        this.activeGames.set(roomId, gameState);

        return {
            action: 'broadcast',
            event:  'game-started',
            data: {
                gameType:    'guess-number',
                gameState:   this._publicState(gameState),
                players:     room.players.map(pl => ({
                    uid:    pl.userId,
                    userId: pl.userId,
                    id:     pl.socketId,
                    name:   pl.name,
                    avatar: pl.avatar,
                })),
                hostParticipates,
            },
        };
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'guess-number-set-secret':
            case 'set-secret':
                return this._setSecretNumber(roomId, userId, payload.number);
            case 'guess-number-make-guess':
            case 'make-guess':
                return this._makeGuess(roomId, userId, payload.number);
            case 'guess-number-get-state':
            case 'get-state':
                return this._getState(roomId, userId);
            case 'guess-number-end-game':
            case 'end-game':
                return this._endGame(roomId);
            case 'guess-number-turn-timeout':
                return this._timeoutTurn(roomId, payload.turnSeq);
            case 'guess-number-begin-next-round':
                return this._beginNextRound(roomId, payload.roundWinnerId ?? null);
            default:
                return { action: 'error', message: `Unknown guess-number event: ${eventName}` };
        }
    }

    _setSecretNumber(roomId, playerId, number) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found.' };

        if (game.gamePhase !== 'AWAITING_SECRET') {
            return { action: 'error', message: 'The game is already in progress.' };
        }

        if (game.secretsSetBy.includes(playerId)) {
            return { action: 'error', message: 'You have already set a secret number.' };
        }

        const parsed = parseInt(number, 10);
        if (isNaN(parsed) || parsed < game.rangeMin || parsed > game.rangeMax) {
            return { action: 'error', message: `Secret number must be between ${game.rangeMin} and ${game.rangeMax}.` };
        }

        game.secretsSetBy.push(playerId);
        
        // Set the opponent's target
        const opponent = game.players.find(p => p.userId !== playerId);
        if (opponent) {
            game.targets[opponent.userId] = parsed;
        }

        let message = '';
        const setterName = game.players.find(p => p.userId === playerId)?.name ?? 'A player';

        if (game.secretsSetBy.length === 2) {
            game.gamePhase = 'PLAYING';
            game.currentTurnId = game.players[0].userId; // Player 1 starts
            game.turnSeq = (game.turnSeq || 0) + 1;
            message = 'Both players have locked in their secrets. Let the guessing begin!';
        } else {
            message = `${setterName} has set their secret number.`;
        }

        const instructions = [{
            action: 'broadcast',
            event:  'guess-number-secret-set',
            data: { gameState: this._publicState(game), message },
        }];

        // Kick off the turn timer once both secrets are set (2-player only)
        if (game.secretsSetBy.length === 2) {
            instructions.push({
                action: 'schedule',
                eventToTrigger: 'guess-number-turn-timeout',
                delay: TURN_TIMEOUT_MS,
                data: { turnSeq: game.turnSeq },
            });
        }

        return instructions.length === 1
            ? instructions[0]
            : { action: 'multiple', instructions };
    }

    _makeGuess(roomId, playerId, number) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found.' };

        if (game.gamePhase !== 'PLAYING') {
            return { action: 'error', message: 'Game is not in PLAYING phase.' };
        }

        const player = game.players.find(p => p.userId === playerId);
        if (!player) return { action: 'error', message: 'Player not found.' };
        if (player.eliminated) return { action: 'error', message: 'You are eliminated.' };
        if (player.isWinner) return { action: 'error', message: 'You already won.' };

        if (game.players.length === 2 && game.currentTurnId !== playerId) {
            return { action: 'error', message: 'It is not your turn.' };
        }

        const parsed = parseInt(number, 10);
        if (isNaN(parsed) || parsed < game.rangeMin || parsed > game.rangeMax) {
            return { action: 'error', message: `Guess must be between ${game.rangeMin} and ${game.rangeMax}.` };
        }

        const myTarget = game.targets[playerId];
        let hint;
        if (parsed < myTarget) hint = 'TOO_LOW';
        else if (parsed > myTarget) hint = 'TOO_HIGH';
        else hint = 'CORRECT';

        const proximity = hint !== 'CORRECT' ? this._getProximity(Math.abs(parsed - myTarget), game.rangeMax - game.rangeMin) : null;

        player.guesses.push({ value: parsed, hint, proximity });
        player.guessCount++;

        if (hint === 'CORRECT') {
            player.isWinner = true;

            // ── Multi-round check: is there a next round? ────────────────
            const roundOver = this._checkRoundOver(game, player.userId);
            if (roundOver) return roundOver;
            // Fall through to final GAME_OVER

            game.gamePhase = 'GAME_OVER';
            return {
                action: 'multiple',
                instructions: [
                    {
                        action: 'broadcast',
                        event:  'guess-number-guess-result',
                        data: {
                            playerId,
                            playerName: player.name,
                            guess: parsed,
                            hint: 'CORRECT',
                            proximity: null,
                            guessCount: player.guessCount,
                        },
                    },
                    {
                        action: 'broadcast',
                        event:  'guess-number-game-over',
                        data: {
                            gameState: this._publicState(game),
                            winner: { userId: player.userId, name: player.name },
                            targets: game.targets, // REVEAL TARGETS
                            totalGuesses: player.guessCount,
                            allPlayers: game.players.map(p => ({
                                userId: p.userId,
                                name: p.name,
                                guessCount: p.guessCount,
                                isWinner: p.isWinner,
                                eliminated: p.eliminated,
                            })),
                        },
                    },
                ],
            };
        }

        if (player.guessCount >= MAX_GUESSES) {
            player.eliminated = true;

            const activePlayers = game.players.filter(p => !p.eliminated && !p.isWinner);
            if (activePlayers.length === 0) {
                // All players have run out of guesses — check multi-round
                const roundOver = this._checkRoundOver(game, null); // null = no winner this round
                if (roundOver) return roundOver;

                game.gamePhase = 'GAME_OVER';
                return {
                    action: 'multiple',
                    instructions: [
                        {
                            action: 'broadcast',
                            event:  'guess-number-guess-result',
                            data: {
                                playerId,
                                playerName: player.name,
                                guess: parsed,
                                hint,
                                guessCount: player.guessCount,
                                eliminated: true,
                            },
                        },
                        {
                            action: 'broadcast',
                            event:  'guess-number-game-over',
                            data: {
                                gameState: this._publicState(game),
                                winner: null,
                                targets: game.targets,
                                message: 'All players eliminated. No winner!',
                                allPlayers: game.players.map(p => ({
                                    userId: p.userId,
                                    name: p.name,
                                    guessCount: p.guessCount,
                                    isWinner: p.isWinner,
                                    eliminated: p.eliminated,
                                })),
                            },
                        },
                    ],
                };
            }
        }

        this._advanceTurn(game, playerId);

        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event:  'guess-number-guess-result',
                    data: {
                        playerId,
                        playerName: player.name,
                        guess: parsed,
                        hint,
                        proximity,
                        guessCount: player.guessCount,
                        maxGuesses: MAX_GUESSES,
                        eliminated: player.eliminated,
                        currentTurnId: game.currentTurnId,
                        // So the next player can briefly see what their opponent just guessed
                        opponentLastGuess: { playerId, playerName: player.name, guess: parsed, hint, proximity },
                        gameState: this._publicState(game),
                    },
                },
                // Re-arm the turn timer for the next player (2-player mode only)
                ...(game.players.length === 2 && game.currentTurnId ? [{
                    action: 'schedule',
                    eventToTrigger: 'guess-number-turn-timeout',
                    delay: TURN_TIMEOUT_MS,
                    data: { turnSeq: game.turnSeq },
                }] : []),
            ],
        };
    }

    _getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found.' };

        return {
            action: 'emit',
            targetId: userId,
            event: 'game-state-sync',
            data: this._publicState(game),
        };
    }

    _endGame(roomId) {
        this.activeGames.delete(roomId);
        return {
            action: 'game-ended',
            event: 'guess-number-ended',
            data: { message: 'Game ended by host.' },
        };
    }

    _publicState(game) {
        return {
            type:           game.type,
            gamePhase:      game.gamePhase,
            rangeMin:       game.rangeMin,
            rangeMax:       game.rangeMax,
            roundNumber:    game.roundNumber,
            maxRounds:      game.maxRounds,
            roundScores:    game.roundScores,
            currentTurnId:  game.currentTurnId,
            maxGuesses:     MAX_GUESSES,
            secretsSetBy:   game.secretsSetBy,
            players: game.players.map(p => ({
                userId:     p.userId,
                name:       p.name,
                avatar:     p.avatar,
                guesses:    p.guesses,
                guessCount: p.guessCount,
                eliminated: p.eliminated,
                isWinner:   p.isWinner,
            })),
        };
    }

    // ── Multi-Round Helpers ───────────────────────────────────────────────────────────

    /**
     * Called when a round ends (either by CORRECT guess or all eliminated).
     * Returns the appropriate instruction:
     *   - If there are more rounds: award point, broadcast round-over, schedule next round
     *   - If this was the final round: return null (caller handles GAME_OVER)
     *
     * @param {Object}      game          Internal game state
     * @param {string|null} roundWinnerId UserId of this round's winner, or null for a tie
     * @returns {Object|null} Instruction or null
     */
    _checkRoundOver(game, roundWinnerId) {
        // Multi-round only applies to 2-player duel
        if (game.players.length !== 2) return null;

        // Award round point
        if (roundWinnerId && game.roundScores[roundWinnerId] !== undefined) {
            game.roundScores[roundWinnerId]++;
        }

        // Has someone crossed the win threshold?
        const overallWinnerId = Object.entries(game.roundScores)
            .find(([, score]) => score >= ROUNDS_TO_WIN)?.[0] ?? null;

        // Has the max round count been reached?
        const isLastRound = game.roundNumber >= game.maxRounds;

        if (overallWinnerId || isLastRound) {
            // Final game over — let caller handle GAME_OVER
            return null;
        }

        // More rounds remain — broadcast round-over and schedule the transition
        game.gamePhase = 'BETWEEN_ROUNDS';
        game.roundNumber++;

        const roundWinner = roundWinnerId
            ? game.players.find(p => p.userId === roundWinnerId)
            : null;

        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event:  'guess-number-round-over',
                    data: {
                        roundWinner: roundWinner
                            ? { userId: roundWinner.userId, name: roundWinner.name }
                            : null,
                        roundScores:  game.roundScores,
                        nextRound:    game.roundNumber,
                        maxRounds:    game.maxRounds,
                        gameState:    this._publicState(game),
                    },
                },
                // Start next round after 4 seconds (lets players read the result)
                {
                    action: 'schedule',
                    eventToTrigger: 'guess-number-begin-next-round',
                    delay: 4000,
                    data: { roundWinnerId: roundWinnerId ?? null },
                },
            ],
        };
    }

    /**
     * Resets per-round state and transitions back to AWAITING_SECRET.
     * The round loser goes first in the next round.
     */
    _beginNextRound(roomId, roundWinnerId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;
        if (game.gamePhase !== 'BETWEEN_ROUNDS') return null;

        // Reset per-round fields for all players
        game.players.forEach(p => {
            p.guesses    = [];
            p.guessCount = 0;
            p.eliminated = false;
            p.isWinner   = false;
        });

        game.targets      = {};
        game.secretsSetBy = [];
        game.currentTurnId = null;
        game.gamePhase    = 'AWAITING_SECRET';
        game.turnSeq      = (game.turnSeq || 0) + 1; // Invalidate any in-flight timers

        // Loser goes first in next round
        if (roundWinnerId) {
            const loser = game.players.find(p => p.userId !== roundWinnerId);
            game.firstPlayerId = loser ? loser.userId : game.firstPlayerId;
        }

        return {
            action: 'broadcast',
            event:  'game-state-sync',
            data: {
                gameState: this._publicState(game),
                gameType:  'guess-number',
                timestamp: Date.now(),
            },
        };
    }

    _advanceTurn(game, currentPlayerId) {
        if (game.players.length === 2) {
            const next = game.players.find(p => p.userId !== currentPlayerId && !p.eliminated && !p.isWinner);
            game.currentTurnId = next ? next.userId : null;
            game.turnSeq = (game.turnSeq || 0) + 1; // Invalidates any in-flight timeout for the previous turn
        }
    }

    // ── Turn Timeout Handler ─────────────────────────────────────────────────
    // Called by GameRouter's 'schedule' mechanism after TURN_TIMEOUT_MS.
    // Uses turnSeq to self-invalidate: if the turn has already advanced
    // (because the player guessed in time), the seq won't match and we bail.

    _timeoutTurn(roomId, expectedSeq) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;
        if (game.gamePhase !== 'PLAYING') return null;
        if (game.players.length !== 2) return null; // Timer only applies to 2-player mode
        if (game.turnSeq !== expectedSeq) return null; // Stale callback — turn already advanced

        const timedOutPlayer = game.players.find(p => p.userId === game.currentTurnId);
        if (!timedOutPlayer || timedOutPlayer.eliminated || timedOutPlayer.isWinner) return null;

        // Count as a skipped guess (does NOT eliminate the player)
        timedOutPlayer.guessCount++;
        timedOutPlayer.guesses.push({ value: null, hint: 'TIMEOUT', proximity: null });

        this._advanceTurn(game, timedOutPlayer.userId);

        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event:  'guess-number-turn-timeout',
                    data: {
                        timedOutPlayerId: timedOutPlayer.userId,
                        timedOutPlayerName: timedOutPlayer.name,
                        currentTurnId: game.currentTurnId,
                        gameState: this._publicState(game),
                    },
                },
                // Re-arm the timer for the next player
                ...(game.currentTurnId ? [{
                    action: 'schedule',
                    eventToTrigger: 'guess-number-turn-timeout',
                    delay: TURN_TIMEOUT_MS,
                    data: { turnSeq: game.turnSeq },
                }] : []),
            ],
        };
    }

    _getProximity(distance, range) {
        // Normalise distance as a % of total range for universal scaling
        const pct = range > 0 ? (distance / range) * 100 : 50;
        if (pct <= 4)  return { tier: 'HOT',      emoji: '🌋', label: 'SO HOT!' };
        if (pct <= 14) return { tier: 'WARM',     emoji: '🔥', label: 'WARM'   };
        if (pct <= 30) return { tier: 'COLD',     emoji: '❄️', label: 'COLD'   };
        return          { tier: 'FREEZING', emoji: '🧊', label: 'FREEZING' };
    }

    _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

module.exports = new GuessNumberEngine();
