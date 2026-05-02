// ============================================================================
// ButtonMashEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class ButtonMashEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-round':
                return this.startRound(roomId);
            case 'submit-tap':
                return this.submitTap(roomId, userId);
            case 'time-up':
                return this.handleTimeUp(roomId);
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Button Mash event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const hostParticipates = options.hostParticipates !== false;
        const roomId = room.id;
        const players = [];

        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                userId: player.userId,
                name: player.name,
                tapCount: 0,
                finished: false
            });
        });

        const game = {
            type: 'button-mash',
            roomId,
            players,
            duration: 10000, // 10 seconds
            startTime: null,
            phase: 'countdown',
            hostParticipates
        };

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'button-mash',
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
            phase: game.phase,
            players: game.players.map(p => ({ userId: p.userId, name: p.name, tapCount: p.tapCount })),
            duration: game.duration
        };
    }

    startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.phase = 'playing';
        game.startTime = Date.now();
        game.players.forEach(p => { 
            p.tapCount = 0; 
            p.finished = false; 
        });

        return {
            action: 'multiple',
            instructions: [
                { 
                    action: 'broadcast', 
                    event: 'round-started', 
                    data: { startTime: game.startTime, duration: game.duration } 
                },
                { 
                    action: 'schedule', 
                    delay: game.duration, 
                    roomId,
                    eventToTrigger: 'time-up' 
                }
            ]
        };
    }

    submitTap(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const player = game.players.find(p => p.userId === userId);
        if (!player || player.finished) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Invalid tap' } };

        const elapsed = Date.now() - game.startTime;
        if (elapsed >= game.duration) {
            player.finished = true;
            return { 
                action: 'emit', 
                targetId: userId, 
                event: 'tap-registered', 
                data: { tapCount: player.tapCount, finished: true } 
            };
        }

        player.tapCount++;
        return { 
            action: 'emit', 
            targetId: userId, 
            event: 'tap-registered', 
            data: { tapCount: player.tapCount, finished: false } 
        };
    }

    handleTimeUp(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.players.forEach(p => p.finished = true);
        game.phase = 'results';
        
        const rankings = [...game.players].sort((a, b) => b.tapCount - a.tapCount);
        
        // Map to finalScores format for Scoreboard compatibility
        const finalScores = rankings.map((p, index) => ({
            playerId: p.userId,
            score: p.tapCount,
            rank: index + 1
        }));

        return {
            action: 'broadcast',
            event: 'game-over',
            data: { rankings, winner: rankings[0], finalScores }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'game-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new ButtonMashEngine();
