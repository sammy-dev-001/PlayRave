// ============================================================================
// TruthOrDareEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getRandomTruth, getRandomDare } = require('../data/truthOrDarePrompts');

class TruthOrDareEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'truth-or-dare-choose':
            case 'choose':
                return this.choose(roomId, userId, payload.choice);
            case 'truth-or-dare-complete-turn':
            case 'complete-turn':
                return this.completeTurn(roomId, userId);
            case 'truth-or-dare-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Truth or Dare event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        const category = options.category || 'normal';
        
        const playerOrder = [];

        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            playerOrder.push(player.userId);
        });

        if (playerOrder.length < 2) {
            return { action: 'error', message: 'Truth or Dare requires at least 2 players' };
        }

        const gameState = {
            type: 'truth-or-dare',
            roomId,
            category,
            playerOrder,
            currentPlayerIndex: 0,
            currentPrompt: null,
            promptType: null, // 'truth' or 'dare'
            usedTruths: [],
            usedDares: [],
            turnCount: 0,
            status: 'WAITING_FOR_CHOICE', // WAITING_FOR_CHOICE, SHOWING_PROMPT
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'truth-or-dare',
                gameState: this.getGameState(roomId, p.userId),
                hostParticipates
            }
        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'truth-or-dare') return null;

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        const isCurrentPlayer = userId === currentPlayerId;

        return {
            currentPlayerId,
            isCurrentPlayer,
            category: game.category,
            promptType: game.promptType,
            currentPrompt: game.currentPrompt,
            turnCount: game.turnCount,
            status: game.status,
            playerOrder: game.playerOrder
        };
    }

    choose(roomId, userId, choice) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (userId !== currentPlayerId) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };
        }

        if (game.status !== 'WAITING_FOR_CHOICE') {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not waiting for choice' } };
        }

        let prompt;
        if (choice === 'truth') {
            prompt = getRandomTruth(game.category, game.usedTruths);
            game.usedTruths.push(prompt);
            game.promptType = 'truth';
        } else if (choice === 'dare') {
            prompt = getRandomDare(game.category, game.usedDares);
            game.usedDares.push(prompt);
            game.promptType = 'dare';
        } else {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Invalid choice. Must be truth or dare' } };
        }

        game.currentPrompt = prompt;
        game.status = 'SHOWING_PROMPT';

        return {
            action: 'broadcast',
            event: 'truth-or-dare-chosen',
            data: {
                success: true,
                prompt,
                promptType: game.promptType,
                gameState: this.getGameState(roomId, null)
            }
        };
    }

    completeTurn(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (userId !== currentPlayerId) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };
        }

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerOrder.length;
        game.currentPrompt = null;
        game.promptType = null;
        game.turnCount++;
        game.status = 'WAITING_FOR_CHOICE';

        return {
            action: 'broadcast',
            event: 'truth-or-dare-turn-complete',
            data: {
                success: true,
                nextPlayerId: game.playerOrder[game.currentPlayerIndex],
                turnCount: game.turnCount,
                gameState: this.getGameState(roomId, null)
            }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'game-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new TruthOrDareEngine();
