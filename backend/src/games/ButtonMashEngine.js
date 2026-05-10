// ============================================================================
// ButtonMashEngine.js — Pure Game Logic Engine
// ============================================================================

class ButtonMashEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'button-mash-start':
            case 'start-round':
                return this.startRound(roomId);
            case 'button-mash-tap':
            case 'submit-tap':
                return this.submitTap(roomId, userId);
            case 'button-mash-finish':
            case 'time-up':
                return this.handleTimeUp(roomId);
            case 'button-mash-end-game':
            case 'end-game':
                return this.endGame(roomId);
            case 'get-state':
                return this.getState(roomId, userId);
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
                socketId: player.socketId,
                name: player.name,
                tapCount: 0,
                finished: false
            });
        });

        const game = {
            type: 'button-mash',
            roomId,
            players,
            duration: 10000,
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
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
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
            players: game.players.map(p => ({ id: p.socketId, userId: p.userId, name: p.name, tapCount: p.tapCount })),
            duration: game.duration
        };
    }

    getState(roomId, userId) {
        const state = this.getGameState(roomId);
        if (!state) return { action: 'error', message: 'Game not found' };
        return {
            action: 'emit',
            targetId: userId,
            event: 'game-state-sync',
            data: {
                gameType: 'button-mash',
                gameState: state
            }
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
                    event: 'button-mash-go', 
                    data: { startTime: game.startTime, duration: game.duration } 
                },
                { 
                    action: 'schedule', 
                    delay: game.duration + 500, // Small buffer
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

        player.tapCount++;

        // Send ack to the player
        const instructions = [
            { 
                action: 'emit', 
                targetId: userId, 
                event: 'button-mash-tap-ack', 
                data: { tapCount: player.tapCount, finished: false } 
            }
        ];

        // Periodically broadcast leaderboard
        if (player.tapCount % 5 === 0) {
            instructions.push({
                action: 'broadcast',
                event: 'button-mash-leaderboard',
                data: {
                    leaderboard: [...game.players].sort((a, b) => b.tapCount - a.tapCount).map(p => ({
                        id: p.socketId,
                        userId: p.userId,
                        name: p.name,
                        tapCount: p.tapCount
                    }))
                }
            });
        }

        return { action: 'multiple', instructions };
    }

    handleTimeUp(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.phase === 'results') return null;

        game.players.forEach(p => p.finished = true);
        game.phase = 'results';
        
        const rankings = [...game.players].sort((a, b) => b.tapCount - a.tapCount).map(p => ({
            id: p.socketId,
            userId: p.userId,
            name: p.name,
            tapCount: p.tapCount
        }));
        
        const finalScores = rankings.map((p, index) => ({
            playerId: p.userId,
            score: p.tapCount,
            rank: index + 1
        }));

        return {
            action: 'broadcast',
            event: 'button-mash-results',
            data: { rankings, winner: rankings[0], finalScores }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'button-mash-game-ended', data: { room: { id: roomId } } };
    }

}

module.exports = new ButtonMashEngine();
