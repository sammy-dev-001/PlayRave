// ============================================================================
// HotSeatEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class HotSeatEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'hot-seat-submit-question':
                return this.submitHotSeatQuestion(roomId, userId, payload.question);
            case 'hot-seat-next-question':
                return this.nextHotSeatQuestion(roomId);
            case 'hot-seat-end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Hot Seat event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        
        const playerOrder = [];

        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            playerOrder.push({
                userId: player.userId,
                name: player.name,
                hasBeenHotSeat: false
            });
        });

        if (playerOrder.length < 2) {
            return { action: 'error', message: 'Hot Seat requires at least 2 players' };
        }

        // Shuffle player order
        for (let i = playerOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerOrder[i], playerOrder[j]] = [playerOrder[j], playerOrder[i]];
        }

        const gameState = {
            type: 'hot-seat',
            roomId,
            playerOrder,
            hotSeatPlayerIndex: 0,
            hotSeatPlayerId: playerOrder[0].userId,
            hotSeatPlayerName: playerOrder[0].name,
            submittedQuestions: {}, // { userId: question }
            currentQuestionIndex: 0,
            phase: 'submitting', // submitting, answering, finished
            round: 1,
            hostParticipates
        };

        playerOrder[0].hasBeenHotSeat = true;
        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'hot-seat',
                gameState: this.getGameState(roomId, p.userId),
                players: room.players,
                hostParticipates
            }
        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return null;

        const isHotSeat = userId === game.hotSeatPlayerId;
        const hasSubmitted = !!game.submittedQuestions[userId];
        const totalPlayers = game.playerOrder.length - 1; // Exclude hot seat player
        const submittedCount = Object.keys(game.submittedQuestions).length;

        const questions = Object.entries(game.submittedQuestions).map(([pid, q]) => ({
            fromPlayerId: pid,
            fromPlayerName: game.playerOrder.find(p => p.userId === pid)?.name || 'Anonymous',
            question: q
        }));

        return {
            hotSeatPlayerId: game.hotSeatPlayerId,
            hotSeatPlayerName: game.hotSeatPlayerName,
            isHotSeat,
            hasSubmitted,
            submittedCount,
            totalExpected: totalPlayers,
            phase: game.phase,
            round: game.round,
            questions: game.phase === 'answering' ? questions : [],
            currentQuestionIndex: game.currentQuestionIndex
        };
    }

    submitHotSeatQuestion(roomId, userId, question) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (userId === game.hotSeatPlayerId) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Hot seat player cannot submit questions' } };
        }

        if (game.phase !== 'submitting') {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not in submitting phase' } };
        }

        if (!question || question.trim().length === 0) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Question cannot be empty' } };
        }

        game.submittedQuestions[userId] = question.trim();

        const totalExpected = game.playerOrder.length - 1;
        const submittedCount = Object.keys(game.submittedQuestions).length;
        const allSubmitted = submittedCount >= totalExpected;

        if (allSubmitted) {
            game.phase = 'answering';
            game.currentQuestionIndex = 0;
        }

        const instructions = [];
        
        // Notify the submitter
        instructions.push({
            action: 'emit',
            targetId: userId,
            event: 'hot-seat-question-submitted',
            data: { success: true }
        });

        // Broadcast updated state individually
        game.playerOrder.forEach(p => {
            instructions.push({
                action: 'emit',
                targetId: p.userId,
                event: 'hot-seat-state-update',
                data: this.getGameState(roomId, p.userId)
            });
        });

        if (allSubmitted) {
            instructions.push({
                action: 'broadcast',
                event: 'hot-seat-answering-started',
                data: {}
            });
        }

        return { action: 'multiple', instructions };
    }

    nextHotSeatQuestion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { action: 'error', message: 'Game not found' };

        const questions = Object.keys(game.submittedQuestions);
        game.currentQuestionIndex++;

        if (game.currentQuestionIndex >= questions.length) {
            return this.nextHotSeatPlayer(roomId);
        }

        // Just next question
        const instructions = game.playerOrder.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'hot-seat-state-update',
            data: this.getGameState(roomId, p.userId)
        }));

        return { action: 'multiple', instructions };
    }

    nextHotSeatPlayer(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { action: 'error', message: 'Game not found' };

        const nextPlayer = game.playerOrder.find(p => !p.hasBeenHotSeat);

        if (!nextPlayer) {
            game.phase = 'finished';
            return {
                action: 'broadcast',
                event: 'hot-seat-game-finished',
                data: { message: 'All players have been on the hot seat!' }
            };
        }

        nextPlayer.hasBeenHotSeat = true;
        game.hotSeatPlayerId = nextPlayer.userId;
        game.hotSeatPlayerName = nextPlayer.name;
        game.submittedQuestions = {};
        game.currentQuestionIndex = 0;
        game.phase = 'submitting';
        game.round++;

        const instructions = game.playerOrder.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'hot-seat-new-player',
            data: this.getGameState(roomId, p.userId)
        }));

        return { action: 'multiple', instructions };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return {
            action: 'broadcast',
            event: 'hot-seat-game-finished',
            data: { message: 'Game ended by host' }
        };
    }
}

module.exports = new HotSeatEngine();
