// ============================================================================
// CaptionThisEngine.js — Anonymous Caption Writing & Voting Game
// ============================================================================
// A prompt is shown each round. Players write funny captions anonymously.
// Captions are shuffled and voted on. 100 pts per vote received.
//
// Phase flow: captioning → voting → results → (next round or finished)
// ============================================================================

class CaptionThisEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room, options = {}) {
        const roomId           = room.id;
        const hostParticipates = options.hostParticipates !== false;
        const { getRandomPrompts } = require('../data/captionThisPrompts');

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({
                userId:       p.userId,
                name:         p.name,
                avatar:       p.avatar || null,
                score:        0,
                caption:      null,
                hasSubmitted: false,
                hasVoted:     false,
                votes:        0,
            }));

        const rounds  = Math.min(players.length * 2, 8);
        const prompts = getRandomPrompts(rounds);

        const gameState = {
            type:          'caption-this',
            roomId,
            players,
            prompts,
            currentRound:  0,
            totalRounds:   rounds,
            currentPrompt: prompts[0],
            phase:         'captioning', // captioning | voting | results | finished
            roundTimeSec:  45,
        };

        this.activeGames.set(roomId, gameState);
        return {
            action: 'broadcast',
            event:  'game-started',
            data:   {
                gameType: 'caption-this',
                gameState: this._publicState(gameState),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }
        };

    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'submit-caption': return this._submitCaption(roomId, userId, payload.caption);
            case 'start-voting':   return this._startVoting(roomId);
            case 'submit-vote':    return this._submitVote(roomId, userId, payload.votedForUserId);
            case 'get-results':    return this._getRoundResults(roomId);
            case 'next-round':     return this._nextRound(roomId);
            case 'get-state':      return this._getState(roomId, userId);
            case 'end-game':       return this._endGame(roomId);

            default:
                return { action: 'error', message: `Unknown caption-this event: ${eventName}` };
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
            roundTimeSec:  game.roundTimeSec,
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

    _submitCaption(roomId, userId, caption) {
        const game = this.activeGames.get(roomId);
        if (!game)                       return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'captioning') return { action: 'error', message: 'Not in captioning phase' };
        if (!caption || !caption.trim()) return { action: 'error', message: 'Caption cannot be empty' };

        const player = game.players.find(p => p.userId === userId);
        if (!player) return { action: 'error', message: 'Player not found' };

        player.caption      = caption.trim().slice(0, 200);
        player.hasSubmitted = true;

        const submittedCount = game.players.filter(p => p.hasSubmitted).length;
        const allSubmitted   = submittedCount >= game.players.length;

        if (allSubmitted) return this._startVoting(roomId);

        return {
            action: 'broadcast',
            event:  'caption-submitted',
            data:   { submittedCount, totalPlayers: game.players.length },
        };
    }

    _startVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'voting';

        // Shuffle captions for anonymity before sending
        const captions = game.players
            .filter(p => p.hasSubmitted)
            .map(p => ({ userId: p.userId, caption: p.caption }))
            .sort(() => 0.5 - Math.random());

        return {
            action: 'broadcast',
            event:  'caption-voting-start',
            data:   { captions, prompt: game.currentPrompt },
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
            event:  'caption-vote-update',
            data:   { votedCount, totalPlayers: game.players.length },
        };
    }

    _getRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';
        game.players.forEach(p => { p.score += p.votes * 100; });

        const results = [...game.players]
            .filter(p => p.hasSubmitted)
            .sort((a, b) => b.votes - a.votes)
            .map(p => ({ userId: p.userId, name: p.name, caption: p.caption, votes: p.votes, score: p.score, points: p.votes * 100 }));

        return {
            action: 'broadcast',
            event:  'caption-round-results',
            data: {
                results,
                winner:      results[0] ? { userId: results[0].userId, name: results[0].name } : null,
                prompt:      game.currentPrompt,
                currentRound: game.currentRound + 1,
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
                event:  'caption-game-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0] },
            };
        }

        game.currentPrompt = game.prompts[game.currentRound];
        game.phase = 'captioning';
        game.players.forEach(p => {
            p.caption = null; p.hasSubmitted = false; p.hasVoted = false; p.votes = 0;
        });

        return {
            action: 'broadcast',
            event:  'caption-next-round',
            data: {
                finished:      false,
                nextRound:     game.currentRound + 1,
                currentPrompt: game.currentPrompt,
            },
        };
    }

    _endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'caption-this-ended', data: { message: 'Game ended by host' } };
    }
}


module.exports = new CaptionThisEngine();
