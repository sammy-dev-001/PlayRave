// ============================================================================
// NeverHaveIEverEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getNHIEPrompt } = require('../../data/neverHaveIEverPrompts');

class NeverHaveIEverEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'never-have-i-ever-respond':
            case 'respond':
                return this.respond(roomId, userId, payload.hasDoneIt);
            case 'never-have-i-ever-next-round':
            case 'next-round':
                return this.nextRound(roomId);
            case 'never-have-i-ever-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Never Have I Ever event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const category = options.category || 'normal';
        
        const playerOrder = room.players.map(p => p.userId);
        const firstPrompt = getNHIEPrompt(category, []);

        const MAX_ROUNDS = 30;

        const game = {
            type: 'never-have-i-ever',
            roomId,
            status: 'PLAYING',
            category,
            currentPrompt: firstPrompt,
            usedPrompts: [firstPrompt],
            roundNumber: 1,
            maxRounds: MAX_ROUNDS,
            playerOrder,
            playerScores: {}, // { userId: score }
            playerResponses: {} // { userId: boolean|null }
        };

        // Initialize scores and responses
        playerOrder.forEach(userId => {
            game.playerScores[userId] = 0;
            game.playerResponses[userId] = null;
        });

        this.activeGames.set(roomId, game);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'never-have-i-ever',
                gameState: this.getGameState(roomId),
                category
            }
        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'never-have-i-ever') return null;

        return {
            currentPrompt: game.currentPrompt,
            roundNumber: game.roundNumber,
            maxRounds: game.maxRounds,
            category: game.category,
            playerScores: game.playerScores,
            playerResponses: game.playerResponses,
            status: game.status
        };
    }

    respond(roomId, userId, hasDoneIt) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!game.playerOrder.includes(userId)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player is not in game' } };
        }

        if (game.playerResponses[userId] !== null) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Already responded' } };
        }

        game.playerResponses[userId] = hasDoneIt;
        
        if (hasDoneIt) {
            game.playerScores[userId] = (game.playerScores[userId] || 0) + 1;
        }

        const allResponded = game.playerOrder.every(pid => game.playerResponses[pid] !== null);

        const payloadData = {
            success: true,
            playerId: userId,
            hasDoneIt,
            allResponded,
            playerScores: game.playerScores,
            playerResponses: game.playerResponses
        };

        return {
            action: 'broadcast',
            event: 'nhie-response',
            data: payloadData
        };
    }

    nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        if (game.roundNumber >= game.maxRounds) {
            game.status = 'FINISHED';
            return {
                action: 'broadcast',
                event: 'nhie-finished',
                data: {
                    finished: true,
                    playerScores: game.playerScores,
                    roundNumber: game.roundNumber,
                    maxRounds: game.maxRounds
                }
            };
        }

        const newPrompt = getNHIEPrompt(game.category, game.usedPrompts);
        game.currentPrompt = newPrompt;
        game.usedPrompts.push(newPrompt);
        game.roundNumber++;

        // Reset responses
        game.playerOrder.forEach(userId => {
            game.playerResponses[userId] = null;
        });

        return {
            action: 'broadcast',
            event: 'nhie-new-round',
            data: {
                success: true,
                currentPrompt: game.currentPrompt,
                roundNumber: game.roundNumber,
                maxRounds: game.maxRounds,
                playerResponses: game.playerResponses
            }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'nhie-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new NeverHaveIEverEngine();
