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
            hostParticipates,
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
            message = 'Both players have locked in their secrets. Let the guessing begin!';
        } else {
            message = `${setterName} has set their secret number.`;
        }

        return {
            action: 'broadcast',
            event:  'guess-number-secret-set',
            data: {
                gameState: this._publicState(game),
                message,
            },
        };
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

        player.guesses.push({ value: parsed, hint });
        player.guessCount++;

        if (hint === 'CORRECT') {
            player.isWinner = true;
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
            action: 'broadcast',
            event:  'guess-number-guess-result',
            data: {
                playerId,
                playerName: player.name,
                guess: parsed,
                hint,
                guessCount: player.guessCount,
                maxGuesses: MAX_GUESSES,
                eliminated: player.eliminated,
                currentTurnId: game.currentTurnId,
                gameState: this._publicState(game),
            },
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

    _advanceTurn(game, currentPlayerId) {
        if (game.players.length === 2) {
            const next = game.players.find(p => p.userId !== currentPlayerId && !p.eliminated && !p.isWinner);
            game.currentTurnId = next ? next.userId : null;
        }
    }

    _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

module.exports = new GuessNumberEngine();
