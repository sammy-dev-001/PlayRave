// ============================================================================
// ImposterEngine.js — Social Deduction Word Game
// ============================================================================
// One player secretly receives a DIFFERENT word. Everyone discusses, then
// votes on who they think the imposter is.
//
// Phase flow: word_reveal → discussion → voting → results
// ============================================================================

const { getRandomWordPair } = require('../data/imposterWords');

class ImposterEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId = room.id;

        const players = room.players.map(p => ({
            userId: p.id,
            name:   p.name,
            avatar: p.avatar || null,
        }));

        const imposterIndex = Math.floor(Math.random() * players.length);
        const imposter      = players[imposterIndex];
        const wordPair      = getRandomWordPair();

        const gameState = {
            type:         'imposter',
            roomId,
            players,
            imposterId:   imposter.userId,
            imposterName: imposter.name,
            normalWord:   wordPair.normalWord,
            imposterWord: wordPair.imposterWord,
            category:     wordPair.category,
            phase:        'word_reveal',  // word_reveal | discussion | voting | results
            votes:        {},             // { voterUserId: votedForUserId }
            startTime:    Date.now(),
        };

        this.activeGames.set(roomId, gameState);

        // Each player gets their own word — never broadcast the imposter word
        const perPlayerInstructions = players.map(player => ({
            action:   'emit',
            targetId: player.userId,
            event:    'imposter-word-reveal',
            data: {
                myWord:     player.userId === imposter.userId ? wordPair.imposterWord : wordPair.normalWord,
                isImposter: player.userId === imposter.userId,
                category:   wordPair.category,
                phase:      'word_reveal',
                players:    players.map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar })),
            },
        }));

        return { action: 'multiple', instructions: perPlayerInstructions };
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'start-discussion': return this._startDiscussion(roomId);
            case 'start-voting':     return this._startVoting(roomId);
            case 'submit-vote':      return this._submitVote(roomId, userId, payload.votedForUserId);
            case 'reveal-results':   return this._resolveVoting(roomId);
            case 'get-state':        return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown imposter event: ${eventName}` };
        }
    }

    // ── Private Handlers ────────────────────────────────────────────────────

    _getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        const isImposter = game.imposterId === userId;
        return {
            action:   'emit',
            targetId: userId,
            event:    'game-state-sync',
            data: {
                ...this._publicState(game),
                myWord:     isImposter ? game.imposterWord : game.normalWord,
                isImposter,
            },
        };
    }

    _publicState(game) {
        return {
            type:         game.type,
            phase:        game.phase,
            category:     game.category,
            players:      game.players.map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar })),
            voteCount:    Object.keys(game.votes).length,
            totalPlayers: game.players.length,
        };
    }

    _startDiscussion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'discussion';
        return {
            action: 'broadcast',
            event:  'imposter-discussion-started',
            data:   { phase: 'discussion', category: game.category, players: game.players },
        };
    }

    _startVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'voting';
        game.votes = {};
        return {
            action: 'broadcast',
            event:  'imposter-voting-started',
            data: {
                phase:   'voting',
                players: game.players.map(p => ({ userId: p.userId, name: p.name })),
            },
        };
    }

    _submitVote(roomId, voterUserId, votedForUserId) {
        const game = this.activeGames.get(roomId);
        if (!game)                        return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'voting')      return { action: 'error', message: 'Not in voting phase' };
        if (voterUserId === votedForUserId) return { action: 'error', message: 'Cannot vote for yourself' };

        // Allow vote changes — keyed strictly by persistent userId
        game.votes[voterUserId] = votedForUserId;

        const votedCount = Object.keys(game.votes).length;
        if (votedCount >= game.players.length) {
            return this._resolveVoting(roomId);
        }

        return {
            action: 'broadcast',
            event:  'imposter-vote-update',
            data:   { votedCount, totalPlayers: game.players.length },
        };
    }

    _resolveVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';

        // Tally votes by userId
        const voteCounts = {};
        game.players.forEach(p => { voteCounts[p.userId] = 0; });
        Object.values(game.votes).forEach(votedId => {
            if (votedId in voteCounts) voteCounts[votedId]++;
        });

        // Find the most-voted player
        let mostVotedId = null;
        let maxVotes    = -1;
        Object.entries(voteCounts).forEach(([uid, count]) => {
            if (count > maxVotes) { maxVotes = count; mostVotedId = uid; }
        });

        const imposterCaught = mostVotedId === game.imposterId;

        this.activeGames.delete(roomId);
        return {
            action: 'broadcast',
            event:  'imposter-results',
            data: {
                phase:          'results',
                imposterId:     game.imposterId,
                imposterName:   game.imposterName,
                imposterWord:   game.imposterWord,
                normalWord:     game.normalWord,
                category:       game.category,
                imposterCaught,
                mostVotedId,
                voteCounts,
                votes:          game.votes,
            },
        };
    }
}

module.exports = new ImposterEngine();
