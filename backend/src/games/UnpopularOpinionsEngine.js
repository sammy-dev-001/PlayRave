// ============================================================================
// UnpopularOpinionsEngine.js — Social Opinion Voting Game
// ============================================================================
// A spicy opinion is shown each round. Players vote Agree or Disagree.
// Being in the MINORITY earns more points (you held the Unpopular Opinion).
// Being in the MAJORITY earns fewer points.
//
// Phase flow: opinion → results → (next opinion or finished)
// ============================================================================

const UNPOPULAR_OPINIONS = require('../data/unpopularOpinions');

class UnpopularOpinionsEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId        = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar || null, score: 0 }));

        // Shuffle opinions and cap at 10 rounds
        const opinions  = [...UNPOPULAR_OPINIONS].sort(() => 0.5 - Math.random());
        const maxRounds = Math.min(opinions.length, 10);

        const gameState = {
            type:           'unpopular-opinions',
            roomId,
            players,
            opinions,
            currentIndex:   0,
            currentOpinion: opinions[0],
            votes:          {},   // { userId: 'agree' | 'disagree' }
            phase:          'opinion', // opinion | results | finished
            round:          1,
            maxRounds,
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
            case 'submit-vote':   return this._submitVote(roomId, userId, payload.vote);
            case 'end-voting':    return this._endVoting(roomId);
            case 'next-opinion':  return this._nextOpinion(roomId);
            case 'get-state':     return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown unpopular-opinions event: ${eventName}` };
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
            type:           game.type,
            phase:          game.phase,
            currentOpinion: game.currentOpinion,
            round:          game.round,
            maxRounds:      game.maxRounds,
            voteCount:      Object.keys(game.votes).length,
            totalPlayers:   game.players.length,
            scores:         game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
        };
    }

    _submitVote(roomId, userId, vote) {
        const game = this.activeGames.get(roomId);
        if (!game)                   return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'opinion') return { action: 'error', message: 'Not in voting phase' };
        if (vote !== 'agree' && vote !== 'disagree') return { action: 'error', message: 'Invalid vote' };

        // Keyed by persistent userId — reconnecting players keep their vote
        game.votes[userId] = vote;

        const voteCount = Object.keys(game.votes).length;
        if (voteCount >= game.players.length) {
            return this._endVoting(roomId);
        }

        return {
            action: 'broadcast',
            event:  'opinion-vote-update',
            data:   { voteCount, totalPlayers: game.players.length },
        };
    }

    _endVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        const votes = game.votes;
        let agreeCount    = 0;
        let disagreeCount = 0;

        Object.values(votes).forEach(v => {
            if (v === 'agree') agreeCount++;
            else if (v === 'disagree') disagreeCount++;
        });

        // Minority = Unpopular Opinion holder → 10 pts
        // Majority (when there IS a clear minority) → 5 pts
        // Everyone same side → everyone gets 5 pts
        let minorityVote = null;
        let majorityVote = null;

        if (agreeCount < disagreeCount && agreeCount > 0)    { minorityVote = 'agree';    majorityVote = 'disagree'; }
        else if (disagreeCount < agreeCount && disagreeCount > 0) { minorityVote = 'disagree'; majorityVote = 'agree'; }
        else if (agreeCount > 0)    majorityVote = 'agree';
        else if (disagreeCount > 0) majorityVote = 'disagree';

        game.players.forEach(player => {
            const v = votes[player.userId];
            if (!v) return;
            if (minorityVote && v === minorityVote)         player.score += 10;
            else if (!minorityVote && majorityVote && v === majorityVote) player.score += 5;
        });

        game.phase = 'results';

        return {
            action: 'broadcast',
            event:  'opinion-results',
            data: {
                opinion:      game.currentOpinion,
                agreeCount,
                disagreeCount,
                isUnpopular:  !!minorityVote,
                minorityVote,
                votes,
                scores:       game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
                round:        game.round,
                maxRounds:    game.maxRounds,
            },
        };
    }

    _nextOpinion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentIndex++;
        game.round++;

        if (game.currentIndex >= Math.min(game.opinions.length, game.maxRounds)) {
            game.phase = 'finished';
            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event:  'opinions-game-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0] },
            };
        }

        game.currentOpinion = game.opinions[game.currentIndex];
        game.votes = {};
        game.phase = 'opinion';

        return {
            action: 'broadcast',
            event:  'opinion-next',
            data:   this._publicState(game),
        };
    }
}

module.exports = new UnpopularOpinionsEngine();
