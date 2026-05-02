// ============================================================================
// SpillTheTeaEngine.js — Anonymous Secret Sharing & Reaction Game
// ============================================================================
// Players anonymously submit their "tea" (a secret, confession, or hot take).
// Each tea is revealed one at a time. Players react with emoji:
//   🔥 fire  = 2 pts to author
//   ☕ sip   = 1 pt to author
//   😬 cringe = 0 pts (but tracked)
// Authors are revealed only at the end. Author identity is ALWAYS keyed by
// persistent userId so reconnects never leak ownership or lose the submission.
//
// Phase flow: submission → reaction (per-tea) → finished
// ============================================================================

class SpillTheTeaEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId           = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar || null, score: 0 }));

        const gameState = {
            type:                  'spill-the-tea',
            roomId,
            players,
            // CRITICAL: authorMap is NEVER sent to clients during submission/reaction
            // Keys are persistent userId — safe across reconnects
            authorMap:             new Map(), // userId → teaText (hidden until reveal)
            shuffledTeas:          [],        // [{tea, authorId}] — populated after submission closes
            currentTeaIndex:       -1,
            currentReactions:      {},        // userId → 'fire' | 'sip' | 'cringe'
            phase:                 'submission',  // submission | reaction | finished
            submittedCount:        0,
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
            case 'submit-tea':      return this._submitTea(roomId, userId, payload.tea);
            case 'end-submission':  return this._endSubmission(roomId);
            case 'submit-reaction': return this._submitReaction(roomId, userId, payload.reaction);
            case 'next-tea':        return this._nextTea(roomId);
            case 'get-state':       return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown spill-the-tea event: ${eventName}` };
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
        const state = {
            type:           game.type,
            phase:          game.phase,
            totalPlayers:   game.players.length,
            submittedCount: game.submittedCount,
            scores:         game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
        };

        if (game.phase === 'reaction' && game.currentTeaIndex >= 0) {
            const current = game.shuffledTeas[game.currentTeaIndex];
            state.currentTea         = current ? current.tea : null;
            state.currentTeaIndex    = game.currentTeaIndex;
            state.totalTeas          = game.shuffledTeas.length;
            state.reactionCount      = Object.keys(game.currentReactions).length;
            // Author identity hidden during reaction phase
            state.currentAuthor      = null;
        }

        return state;
    }

    _submitTea(roomId, userId, tea) {
        const game = this.activeGames.get(roomId);
        if (!game)                       return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'submission') return { action: 'error', message: 'Not in submission phase' };
        if (!tea || typeof tea !== 'string' || !tea.trim())
            return { action: 'error', message: 'Tea cannot be empty' };

        const player = game.players.find(p => p.userId === userId);
        if (!player) return { action: 'error', message: 'Player not found' };

        // Overwrite allowed — reconnecting player can re-submit their own tea
        const isNew = !game.authorMap.has(userId);
        game.authorMap.set(userId, tea.trim().slice(0, 300));
        if (isNew) game.submittedCount++;

        if (game.submittedCount >= game.players.length) {
            return this._endSubmission(roomId);
        }

        return {
            action: 'broadcast',
            event:  'tea-submitted',
            data:   { submittedCount: game.submittedCount, totalPlayers: game.players.length },
        };
    }

    _endSubmission(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        // Build shuffled tea list — Fisher-Yates
        const entries = [];
        game.authorMap.forEach((tea, authorId) => entries.push({ tea, authorId }));
        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]];
        }

        game.shuffledTeas    = entries;
        game.currentTeaIndex = 0;
        game.currentReactions = {};
        game.phase = 'reaction';

        return {
            action: 'broadcast',
            event:  'tea-reaction-start',
            data: {
                phase:        'reaction',
                currentTea:   entries[0]?.tea ?? null,
                currentTeaIndex: 0,
                totalTeas:    entries.length,
                reactionCount: 0,
                totalPlayers: game.players.length,
            },
        };
    }

    _submitReaction(roomId, userId, reaction) {
        const game = this.activeGames.get(roomId);
        if (!game)                      return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'reaction')  return { action: 'error', message: 'Not in reaction phase' };

        const validReactions = ['fire', 'sip', 'cringe'];
        if (!validReactions.includes(reaction)) return { action: 'error', message: 'Invalid reaction' };

        const current = game.shuffledTeas[game.currentTeaIndex];
        // Author cannot react to their own tea
        if (current && current.authorId === userId)
            return { action: 'error', message: 'Cannot react to your own tea' };

        // Overwrite-safe — userId key handles reconnects
        game.currentReactions[userId] = reaction;

        const reactionCount  = Object.keys(game.currentReactions).length;
        const eligibleVoters = game.players.filter(
            p => !current || p.userId !== current.authorId
        ).length;

        if (reactionCount >= eligibleVoters) {
            return this._tallyAndReveal(roomId);
        }

        return {
            action: 'broadcast',
            event:  'tea-reaction-update',
            data:   { reactionCount, totalPlayers: eligibleVoters },
        };
    }

    _tallyAndReveal(roomId) {
        const game    = this.activeGames.get(roomId);
        const current = game.shuffledTeas[game.currentTeaIndex];
        const author  = game.players.find(p => p.userId === current.authorId);

        // Award points: fire=2, sip=1, cringe=0
        const pointMap  = { fire: 2, sip: 1, cringe: 0 };
        const breakdown = { fire: 0, sip: 0, cringe: 0 };
        let   earned    = 0;

        Object.values(game.currentReactions).forEach(r => {
            breakdown[r] = (breakdown[r] || 0) + 1;
            earned       += (pointMap[r] || 0);
        });

        if (author) author.score += earned;

        const isLast = game.currentTeaIndex >= game.shuffledTeas.length - 1;

        return {
            action: 'broadcast',
            event:  'tea-reveal',
            data: {
                tea:           current.tea,
                authorId:      current.authorId,
                authorName:    author?.name ?? 'Unknown',
                reactions:     game.currentReactions,
                breakdown,
                pointsEarned:  earned,
                scores:        game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
                currentTeaIndex: game.currentTeaIndex,
                totalTeas:     game.shuffledTeas.length,
                isLast,
            },
        };
    }

    _nextTea(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentTeaIndex++;

        if (game.currentTeaIndex >= game.shuffledTeas.length) {
            game.phase = 'finished';
            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));

            // Full reveal: build authorMap to name lookup
            const allTeas = game.shuffledTeas.map(entry => {
                const authorPlayer = game.players.find(p => p.userId === entry.authorId);
                return { tea: entry.tea, authorId: entry.authorId, authorName: authorPlayer?.name ?? 'Unknown' };
            });

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event:  'spill-the-tea-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0], allTeas },
            };
        }

        const next = game.shuffledTeas[game.currentTeaIndex];
        game.currentReactions = {};

        return {
            action: 'broadcast',
            event:  'tea-next',
            data: {
                currentTea:      next.tea,
                currentTeaIndex: game.currentTeaIndex,
                totalTeas:       game.shuffledTeas.length,
                reactionCount:   0,
                totalPlayers:    game.players.length,
                scores:          game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
            },
        };
    }
}

module.exports = new SpillTheTeaEngine();
