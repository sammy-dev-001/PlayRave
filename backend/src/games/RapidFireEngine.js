// ============================================================================
// RapidFireEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getRapidFireQ } = require('../data/rapidFirePrompts');

class RapidFireEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'rapid-fire-answer':
            case 'answer':
                return this.answer(roomId, userId, payload.answered);
            case 'rapid-fire-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Rapid Fire event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const category = options.category || 'normal';
        
        const playerOrder = room.players.map(p => p.userId);
        const firstQuestion = getRapidFireQ(category, []);

        const game = {
            type: 'rapid-fire',
            roomId,
            status: 'PLAYING',
            category,
            currentQuestion: firstQuestion,
            usedQuestions: [firstQuestion],
            currentPlayerIndex: 0,
            roundNumber: 1,
            playerOrder,
            playerScores: {}, // { userId: score }
            timePerQuestion: 5
        };

        playerOrder.forEach(userId => {
            game.playerScores[userId] = 0;
        });

        this.activeGames.set(roomId, game);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'rapid-fire',
                gameState: this.getGameState(roomId),
                players: room.players.map(pl => ({ userId: pl.userId, name: pl.name, avatar: pl.avatar })),
                category
            }

        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'rapid-fire') return null;

        return {
            currentQuestion: game.currentQuestion,
            currentPlayerId: game.playerOrder[game.currentPlayerIndex],
            roundNumber: game.roundNumber,
            category: game.category,
            playerScores: game.playerScores,
            timePerQuestion: game.timePerQuestion,
            status: game.status
        };
    }

    answer(roomId, userId, answered) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (userId !== currentPlayerId) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };
        }

        if (answered) {
            game.playerScores[userId] = (game.playerScores[userId] || 0) + 1;
        }

        // Move to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerOrder.length;
        if (game.currentPlayerIndex === 0) {
            game.roundNumber++;
        }

        const newQuestion = getRapidFireQ(game.category, game.usedQuestions);
        game.currentQuestion = newQuestion;
        game.usedQuestions.push(newQuestion);

        return {
            action: 'broadcast',
            event: 'rapid-fire-update',
            data: {
                success: true,
                answered,
                newQuestion,
                currentPlayerId: game.playerOrder[game.currentPlayerIndex],
                playerScores: game.playerScores,
                roundNumber: game.roundNumber,
                gameState: this.getGameState(roomId)
            }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'rapid-fire-ended', data: { message: 'Game ended by host', playerScores: game.playerScores } };
    }
}

module.exports = new RapidFireEngine();
