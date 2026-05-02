// ============================================================================
// DrawBattleEngine.js — Multiplayer Drawing & Voting Game
// ============================================================================
// Players draw based on a prompt, then vote anonymously for the best drawing.
// Votes are tallied and points awarded (50 pts per vote received).
//
// Phase flow: waiting → drawing → voting → results → (next round or finished)
// ============================================================================

class DrawBattleEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId           = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;
        const { getRandomDrawPrompts } = require('../data/drawBattlePrompts');

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({
                userId:       p.id,
                name:         p.name,
                avatar:       p.avatar || null,
                score:        0,
                drawing:      null,   // Base64 drawingData — stored by userId
                hasSubmitted: false,
                hasVoted:     false,
                votes:        0,
            }));

        const prompts = getRandomDrawPrompts(5);

        const gameState = {
            type:           'draw-battle',
            roomId,
            players,
            prompts,
            currentRound:   0,
            totalRounds:    prompts.length,
            currentPrompt:  prompts[0],
            drawingTimeSec: 60,
            phase:          'waiting', // waiting | drawing | voting | results | finished
        };

        this.activeGames.set(roomId, gameState);
        return {
            action: 'broadcast',
            event:  'game-started',
            data:   this._publicState(gameState),
        };
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'start-round':     return this._startRound(roomId);
            case 'submit-drawing':  return this._submitDrawing(roomId, userId, payload.drawingData);
            case 'start-voting':    return this._startVoting(roomId);
            case 'submit-vote':     return this._submitVote(roomId, userId, payload.votedForUserId);
            case 'get-results':     return this._getRoundResults(roomId);
            case 'next-round':      return this._nextRound(roomId);
            case 'get-state':       return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown draw-battle event: ${eventName}` };
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
            type:          game.type,
            phase:         game.phase,
            currentRound:  game.currentRound + 1,
            totalRounds:   game.totalRounds,
            currentPrompt: game.currentPrompt,
            drawingTimeSec: game.drawingTimeSec,
            players: game.players.map(p => ({
                userId:       p.userId,
                name:         p.name,
                avatar:       p.avatar,
                score:        p.score,
                hasSubmitted: p.hasSubmitted,
                hasVoted:     p.hasVoted,
            })),
        };
    }

    _startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        // Reset per-round state
        game.players.forEach(p => {
            p.drawing      = null;
            p.hasSubmitted = false;
            p.hasVoted     = false;
            p.votes        = 0;
        });
        game.phase = 'drawing';

        return {
            action: 'broadcast',
            event:  'draw-battle-round-start',
            data: {
                prompt:      game.currentPrompt,
                drawingTime: game.drawingTimeSec,
                round:       game.currentRound + 1,
                totalRounds: game.totalRounds,
            },
        };
    }

    _submitDrawing(roomId, userId, drawingData) {
        const game = this.activeGames.get(roomId);
        if (!game)                    return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'drawing') return { action: 'error', message: 'Not in drawing phase' };

        const player = game.players.find(p => p.userId === userId);
        if (!player) return { action: 'error', message: 'Player not found' };

        // Safe to overwrite — userId key guarantees reconnecting player keeps their drawing
        player.drawing      = drawingData;
        player.hasSubmitted = true;

        const submittedCount = game.players.filter(p => p.hasSubmitted).length;
        const allSubmitted   = submittedCount >= game.players.length;

        if (allSubmitted) return this._startVoting(roomId);

        return {
            action: 'broadcast',
            event:  'draw-battle-submission-update',
            data:   { submittedCount, totalPlayers: game.players.length },
        };
    }

    _startVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'voting';

        // Send all drawings anonymised — reveal only userId (not name) so front-end can label
        const drawings = game.players
            .filter(p => p.drawing)
            .map(p => ({ userId: p.userId, drawing: p.drawing }))
            .sort(() => 0.5 - Math.random()); // shuffle for anonymity

        return {
            action: 'broadcast',
            event:  'draw-battle-voting-start',
            data:   { drawings, prompt: game.currentPrompt },
        };
    }

    _submitVote(roomId, voterId, votedForUserId) {
        const game = this.activeGames.get(roomId);
        if (!game)                   return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'voting') return { action: 'error', message: 'Not in voting phase' };
        if (voterId === votedForUserId) return { action: 'error', message: 'Cannot vote for yourself' };

        const voter      = game.players.find(p => p.userId === voterId);
        const votedPlayer = game.players.find(p => p.userId === votedForUserId);
        if (!voter)       return { action: 'error', message: 'Voter not found' };
        if (!votedPlayer) return { action: 'error', message: 'Invalid vote target' };
        if (voter.hasVoted) return { action: 'error', message: 'Already voted' };

        voter.hasVoted = true;
        votedPlayer.votes++;

        const votedCount = game.players.filter(p => p.hasVoted).length;
        if (votedCount >= game.players.length) return this._getRoundResults(roomId);

        return {
            action: 'broadcast',
            event:  'draw-battle-vote-update',
            data:   { votedCount, totalPlayers: game.players.length },
        };
    }

    _getRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';

        // Award 50 pts per vote
        game.players.forEach(p => { p.score += p.votes * 50; });

        const roundWinner = [...game.players]
            .filter(p => p.drawing)
            .sort((a, b) => b.votes - a.votes)[0];

        return {
            action: 'broadcast',
            event:  'draw-battle-round-results',
            data: {
                prompt:      game.currentPrompt,
                results: game.players
                    .filter(p => p.drawing)
                    .sort((a, b) => b.votes - a.votes)
                    .map(p => ({
                        userId: p.userId, name: p.name,
                        drawing: p.drawing, votes: p.votes, score: p.score,
                        points: p.votes * 50,
                    })),
                winner:      roundWinner ? { userId: roundWinner.userId, name: roundWinner.name } : null,
                standings:   [...game.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 })),
                currentRound: game.currentRound + 1,
                totalRounds:  game.totalRounds,
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
                event:  'draw-battle-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0] },
            };
        }

        game.currentPrompt = game.prompts[game.currentRound];
        game.phase = 'waiting';

        return {
            action: 'broadcast',
            event:  'draw-battle-next-round',
            data:   { finished: false, nextRound: game.currentRound + 1, nextPrompt: game.currentPrompt },
        };
    }
}

module.exports = new DrawBattleEngine();
