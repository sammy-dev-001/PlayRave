// ============================================================================
// NeonTapEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class NeonTapEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-neon-tap-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'submit-neon-tap':
            case 'submit-tap':
                return this.submitTap(roomId, userId, payload.reactionTime);
            case 'show-neon-tap-results':
            case 'get-results':
                return this.getResults(roomId);
            case 'next-round':
                return this.nextRound(roomId);
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Neon Tap event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const hostParticipates = options.hostParticipates !== false;
        const roomId = room.id;

        const game = {
            type: 'neon-tap',
            roomId,
            currentRound: 0,
            totalRounds: 10,
            circlePosition: null,
            roundStartTime: null,
            playerTaps: {}, // { userId: { round: time } }
            totalReactionTimes: {}, // { userId: totalTime }
            roundsWon: {}, // { userId: count }
            status: 'WAITING',
            hostParticipates
        };

        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            game.playerTaps[player.userId] = {};
            game.totalReactionTimes[player.userId] = 0;
            game.roundsWon[player.userId] = 0;
        });

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'neon-tap',
                gameState: this.getGameState(roomId),
                hostParticipates
            }
        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;
        return {
            currentRound: game.currentRound,
            totalRounds: game.totalRounds,
            status: game.status
        };
    }

    startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const circlePosition = {
            x: 0.1 + Math.random() * 0.8,
            y: 0.15 + Math.random() * 0.7
        };
        game.circlePosition = circlePosition;
        game.roundStartTime = Date.now();
        game.status = 'PLAYING';

        return {
            action: 'broadcast',
            event: 'neon-tap-round-started',
            data: {
                circlePosition,
                roundStartTime: game.roundStartTime,
                currentRound: game.currentRound,
                totalRounds: game.totalRounds
            }
        };
    }

    submitTap(roomId, userId, reactionTime) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!(userId in game.playerTaps)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player not participating' } };
        }

        const currentRound = game.currentRound;
        if (game.playerTaps[userId][currentRound] === undefined) {
            game.playerTaps[userId][currentRound] = reactionTime;
            game.totalReactionTimes[userId] += reactionTime;
            return { action: 'emit', targetId: userId, event: 'tap-registered', data: { success: true } };
        }

        return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Already tapped' } };
    }

    getResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const currentRound = game.currentRound;
        const roundTaps = [];
        Object.keys(game.playerTaps).forEach(pid => {
            const reactionTime = game.playerTaps[pid][currentRound];
            roundTaps.push({ 
                userId: pid, 
                reactionTime: reactionTime !== undefined ? reactionTime : null, 
                roundsWon: game.roundsWon[pid] 
            });
        });

        roundTaps.sort((a, b) => {
            if (a.reactionTime === null) return 1;
            if (b.reactionTime === null) return -1;
            return a.reactionTime - b.reactionTime;
        });

        const winner = roundTaps.length > 0 && roundTaps[0].reactionTime !== null ? roundTaps[0] : null;
        if (winner) {
            game.roundsWon[winner.userId]++;
        }

        return {
            action: 'broadcast',
            event: 'neon-tap-results',
            data: {
                currentRound,
                totalRounds: game.totalRounds,
                winner: winner ? winner.userId : null,
                roundTaps,
                isLastRound: currentRound === game.totalRounds - 1
            }
        };
    }

    nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.currentRound++;
        if (game.currentRound >= game.totalRounds) {
            game.status = 'FINISHED';
            const finalScores = Object.entries(game.totalReactionTimes).map(([pid, totalTime]) => {
                const tapsCount = Object.keys(game.playerTaps[pid] || {}).length;
                const avgTime = tapsCount > 0 ? Math.round(totalTime / tapsCount) : 999999;
                return { playerId: pid, score: avgTime }; // Use playerId for Scoreboard compatibility
            });
            finalScores.sort((a, b) => a.score - b.score);
            return { 
                action: 'broadcast', 
                event: 'game-finished', 
                data: { finished: true, finalScores } 
            };
        }

        game.status = 'WAITING';
        return { 
            action: 'broadcast', 
            event: 'neon-tap-ready-for-next', 
            data: { finished: false } 
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'game-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new NeonTapEngine();
