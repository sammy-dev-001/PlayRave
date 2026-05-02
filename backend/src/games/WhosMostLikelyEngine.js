// ============================================================================
// WhosMostLikelyEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getRandomPrompts } = require('../data/whosMostLikelyPrompts');

class WhosMostLikelyEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'whos-most-likely-submit-vote':
            case 'submit-whos-most-likely-vote':
            case 'submit-vote':
                return this.submitVote(roomId, userId, payload.votedForPlayerId);
            case 'whos-most-likely-show-results':
            case 'show-whos-most-likely-results':
            case 'show-results':
                return this.getResults(roomId);
            case 'whos-most-likely-next-prompt':
            case 'next-whos-most-likely-prompt':
            case 'next-prompt':
                return this.nextPrompt(roomId);
            case 'whos-most-likely-end-game':
            case 'end-whos-most-likely':
            case 'end-game':
                return this.endGame(roomId);

            default:
                return { action: 'error', message: `Unknown Who's Most Likely event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        
        const prompts = getRandomPrompts(10);

        const gameState = {
            type: 'whos-most-likely',
            roomId,
            prompts,
            currentPromptIndex: 0,
            playerVotes: {}, // { userId: { promptIndex: votedForUserId } }
            totalVotes: {}, // { userId: totalVoteCount }
            promptStartTime: Date.now(),
            status: 'PLAYING',
            hostParticipates
        };

        // Initialize total votes for all participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.totalVotes[player.userId] = 0;
        });

        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'whos-most-likely',
                gameState: this.getGameState(roomId, p.userId),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }


        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return null;

        const prompt = game.prompts[game.currentPromptIndex];
        return {
            status: game.status,
            promptIndex: game.currentPromptIndex,
            totalPrompts: game.prompts.length,
            prompt: prompt.prompt,
            category: prompt.category,
            hasVoted: userId ? !!(game.playerVotes[userId] && game.playerVotes[userId][game.currentPromptIndex] !== undefined) : false
        };
    }

    submitVote(roomId, userId, votedForPlayerId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!(userId in game.totalVotes)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player is not participating' } };
        }

        const promptIndex = game.currentPromptIndex;

        if (!game.playerVotes[userId]) {
            game.playerVotes[userId] = {};
        }
        
        if (game.playerVotes[userId][promptIndex] !== undefined) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Already voted' } };
        }

        game.playerVotes[userId][promptIndex] = votedForPlayerId;

        const instructions = [
            { action: 'emit', targetId: userId, event: 'vote-submitted', data: { success: true } }
        ];

        // Check if all players voted
        const expectedVotes = Object.keys(game.totalVotes).length;
        const currentVotes = Object.keys(game.playerVotes).filter(id => game.playerVotes[id][promptIndex] !== undefined).length;
        
        if (currentVotes >= expectedVotes) {
            instructions.push(this.getResults(roomId));
        }

        return { action: 'multiple', instructions };
    }

    getResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const currentPrompt = game.prompts[game.currentPromptIndex];
        const voteCount = {};
        
        Object.keys(game.totalVotes).forEach(userId => {
            voteCount[userId] = 0;
        });

        // Tally votes for current prompt
        Object.keys(game.playerVotes).forEach(voterId => {
            const votedFor = game.playerVotes[voterId]?.[game.currentPromptIndex];
            if (votedFor && votedFor in voteCount) {
                voteCount[votedFor]++;
            }
        });

        // Update total votes
        if (!game.talliedPrompts) {
            game.talliedPrompts = new Set();
        }

        if (!game.talliedPrompts.has(game.currentPromptIndex)) {
            Object.keys(voteCount).forEach(userId => {
                game.totalVotes[userId] += voteCount[userId];
            });
            game.talliedPrompts.add(game.currentPromptIndex);
        }

        const maxVotes = Math.max(...Object.values(voteCount));

        const results = {
            promptIndex: game.currentPromptIndex,
            prompt: currentPrompt.prompt,
            voteResults: Object.keys(voteCount).map(userId => ({
                playerId: userId,
                votes: voteCount[userId],
                totalVotes: game.totalVotes[userId],
                isWinner: voteCount[userId] === maxVotes && maxVotes > 0
            })).sort((a, b) => b.votes - a.votes),
            isLastPrompt: game.currentPromptIndex === game.prompts.length - 1
        };

        game.status = 'RESULTS';

        return {
            action: 'broadcast',
            event: 'whos-most-likely-results',
            data: results
        };
    }

    nextPrompt(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.currentPromptIndex++;
        game.promptStartTime = Date.now();
        game.status = 'PLAYING';

        if (game.currentPromptIndex >= game.prompts.length) {
            game.status = 'FINISHED';
            return {
                action: 'broadcast',
                event: 'game-finished',
                data: {
                    finished: true,
                    finalScores: this.getFinalScores(roomId)
                }
            };
        }

        return {
            action: 'broadcast',
            event: 'whos-most-likely-next-prompt',
            data: this.getGameState(roomId)
        };
    }

    getFinalScores(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const scores = Object.entries(game.totalVotes).map(([userId, votes]) => ({
            playerId: userId,
            score: votes // map to standard score property
        }));

        scores.sort((a, b) => b.score - a.score);
        return scores;
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'whos-most-likely-ended', data: { message: 'Game ended by host' } };
    }

}

module.exports = new WhosMostLikelyEngine();
