// ============================================================================
// SpeedCategoriesEngine.js — Timed Category Answering Game
// ============================================================================
// Each round a letter and 5 categories are revealed. Players have 60 seconds
// to type one answer per category starting with the letter.
// 10 pts per valid answer (starts with the correct letter, length >= 2).
//
// Phase flow: waiting → playing → results → (next round or finished)
// ============================================================================

const { getRandomCategories, getRandomLetter } = require('../data/speedCategoriesData');

class SpeedCategoriesEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room, options = {}) {
        const roomId           = room.id;
        const hostParticipates = options.hostParticipates !== false;

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({
                userId:       p.userId,
                name:         p.name,
                avatar:       p.avatar || null,
                score:        0,
                hasSubmitted: false,
                answers:      {}, // { catIndex: answerText }
            }));

        const gameState = {
            type:               'speed-categories',
            roomId,
            players,
            currentRound:       0,
            totalRounds:        3,
            currentLetter:      null,
            currentCategories:  [],
            phase:              'waiting', // waiting | playing | results | finished
            roundTimeSec:       60,
        };

        this.activeGames.set(roomId, gameState);
        return {
            action: 'broadcast',
            event:  'game-started',
            data:   {
                gameType: 'speed-categories',
                gameState: this._publicState(gameState),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }
        };

    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'start-round':      return this._startRound(roomId);
            case 'submit-answers':   return this._submitAnswers(roomId, userId, payload.answers);
            case 'end-round':        return this._calculateScores(roomId);
            case 'next-round':       return this._nextRound(roomId);
            case 'get-state':        return this._getState(roomId, userId);
            case 'end-game':         return this._endGame(roomId);

            default:
                return { action: 'error', message: `Unknown speed-categories event: ${eventName}` };
        }
    }

    // ── Private Handlers ────────────────────────────────────────────────────

    _getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        return {
            action:   'emit',
            targetId: userId,
            event:    'game-state-sync',
            data:     this._publicState(game),
        };
    }

    _publicState(game) {
        return {
            type:               game.type,
            phase:              game.phase,
            currentRound:       game.currentRound + 1,
            totalRounds:        game.totalRounds,
            currentLetter:      game.currentLetter,
            currentCategories:  game.currentCategories,
            roundTimeSec:       game.roundTimeSec,
            submittedCount:     game.players.filter(p => p.hasSubmitted).length,
            totalPlayers:       game.players.length,
            scores:             game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
        };
    }

    _startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentLetter     = getRandomLetter();
        game.currentCategories = getRandomCategories(5);
        game.phase             = 'playing';

        game.players.forEach(p => {
            p.hasSubmitted = false;
            p.answers      = {};
        });

        return {
            action: 'broadcast',
            event:  'speed-categories-round-start',
            data: {
                round:       game.currentRound + 1,
                totalRounds: game.totalRounds,
                letter:      game.currentLetter,
                categories:  game.currentCategories,
                roundTimeSec: game.roundTimeSec,
            },
        };
    }

    _submitAnswers(roomId, userId, answers) {
        const game = this.activeGames.get(roomId);
        if (!game)                    return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'playing') return { action: 'error', message: 'Not in playing phase' };

        const player = game.players.find(p => p.userId === userId);
        if (!player) return { action: 'error', message: 'Player not found' };

        // Overwrite-safe — userId key persists across reconnects
        player.answers      = answers || {};
        player.hasSubmitted = true;

        const submittedCount = game.players.filter(p => p.hasSubmitted).length;
        const allSubmitted   = submittedCount >= game.players.length;

        if (allSubmitted) return this._calculateScores(roomId);

        return {
            action: 'broadcast',
            event:  'speed-categories-submission-update',
            data:   { submittedCount, totalPlayers: game.players.length },
        };
    }

    _calculateScores(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';
        const letter = game.currentLetter.toLowerCase();

        const roundResults = game.players.map(player => {
            let roundScore   = 0;
            const validity   = {};

            Object.entries(player.answers).forEach(([catIdx, word]) => {
                const clean   = (word || '').trim().toLowerCase();
                const isValid = clean.length >= 2 && clean.startsWith(letter);
                validity[catIdx] = isValid;
                if (isValid) roundScore += 10;
            });

            player.score += roundScore;

            return {
                userId:     player.userId,
                playerName: player.name,
                score:      player.score,
                roundScore,
                answers:    player.answers,
                validity,
            };
        });

        return {
            action: 'broadcast',
            event:  'speed-categories-results',
            data: {
                results:    roundResults,
                letter:     game.currentLetter,
                categories: game.currentCategories,
                round:      game.currentRound + 1,
                totalRounds: game.totalRounds,
            },
        };
    }

    _nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';
            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event:  'speed-categories-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0] },
            };
        }

        game.phase = 'waiting';
        return {
            action: 'broadcast',
            event:  'speed-categories-next-round',
            data:   { finished: false, nextRound: game.currentRound + 1 },
        };
    }

    _endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'speed-categories-ended', data: { message: 'Game ended by host' } };
    }
}


module.exports = new SpeedCategoriesEngine();
