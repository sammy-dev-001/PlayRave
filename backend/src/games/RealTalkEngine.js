const { getQuestionsByCategory } = require('../../frontend/src/data/realTalkData');

class RealTalkEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'real-talk-next-question':
                return this.nextQuestion(roomId, userId);
            case 'real-talk-get-state':
                return this.getState(roomId, userId);
            case 'real-talk-end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Real Talk event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const categoryId = options.categoryId || 'icebreakers';
        const questions = [...getQuestionsByCategory(categoryId)];
        
        // Shuffle questions
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        const players = room.players.map(player => ({
            userId: player.userId,
            name: player.name,
            isActive: true
        }));

        const gameState = {
            type: 'real-talk',
            roomId,
            categoryId,
            players,
            questions,
            currentQuestionIndex: 0,
            currentPlayerIndex: 0,
            phase: 'playing'
        };

        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'real-talk',
                gameState: this.getGameState(roomId, p.userId),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
            }
        }));

        return { action: 'multiple', instructions };
    }

    nextQuestion(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        // Ensure the person advancing is actually in the game (any player can click next)
        const playerExists = game.players.some(p => p.userId === userId);
        if (!playerExists) return { action: 'error', message: 'Player not in game' };

        // Advance to next question and player
        game.currentQuestionIndex = (game.currentQuestionIndex + 1) % game.questions.length;
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        return {
            action: 'broadcast',
            event: 'real-talk-state-update',
            data: {
                success: true,
                gameState: this.getGameState(roomId, null)
            }
        };
    }

    getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        return {
            action: 'emit',
            targetId: userId,
            event: 'game-state-sync',
            data: {
                type: 'real-talk',
                gameState: this.getGameState(roomId, userId)
            }
        };
    }

    getGameState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'real-talk') return null;

        const currentQuestion = game.questions[game.currentQuestionIndex];
        const currentPlayer = game.players[game.currentPlayerIndex];

        return {
            roomId: game.roomId,
            categoryId: game.categoryId,
            currentQuestion: currentQuestion,
            currentPlayer: currentPlayer ? { userId: currentPlayer.userId, name: currentPlayer.name } : null,
            players: game.players,
            isMyTurn: currentPlayer && currentPlayer.userId === userId
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return {
            action: 'game-ended',
            event: 'real-talk-game-ended',
            data: { message: 'Game finished' }
        };
    }

    removePlayer(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const playerIndex = game.players.findIndex(p => p.userId === userId);
        if (playerIndex !== -1) {
            game.players.splice(playerIndex, 1);
            if (game.players.length === 0) {
                this.activeGames.delete(roomId);
                return { action: 'game-ended', data: { message: 'All players left' } };
            }
            if (game.currentPlayerIndex >= game.players.length) {
                game.currentPlayerIndex = 0;
            }
        }
        return {
            action: 'broadcast',
            event: 'game-state-sync',
            data: { type: 'real-talk', gameState: this.getGameState(roomId, null) }
        };
    }
}

module.exports = new RealTalkEngine();
