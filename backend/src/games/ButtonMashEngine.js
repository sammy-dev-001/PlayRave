class ButtonMashEngine {
    constructor() {
        this.activeGames = new Map();
    }

    startGame(room) {
        const hostParticipates = room.settings?.hostParticipates !== false;
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

        const gameState = {
            type: 'button-mash',
            roomId: room.roomId,
            players,
            duration: 10000, // 10 seconds
            startTime: null,
            phase: 'countdown',
            hostParticipates
        };

        this.activeGames.set(room.roomId, gameState);
        return { action: 'broadcast', event: 'game-started', payload: gameState };
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-round': {
                game.phase = 'playing';
                game.startTime = Date.now();
                game.players.forEach(p => { p.tapCount = 0; p.finished = false; });
                return {
                    action: 'multiple',
                    instructions: [
                        { action: 'broadcast', event: 'round-started', payload: { startTime: game.startTime } },
                        { action: 'schedule', delay: game.duration, eventToTrigger: 'time-up' }
                    ]
                };
            }
            case 'submit-tap': {
                const player = game.players.find(p => p.userId === userId);
                if (!player || player.finished) return { action: 'error', message: 'Invalid tap' };
                const elapsed = Date.now() - game.startTime;
                if (elapsed >= game.duration) {
                    player.finished = true;
                    return { action: 'emit', event: 'tap-registered', payload: { tapCount: player.tapCount, finished: true } };
                }
                player.tapCount++;
                return { action: 'emit', event: 'tap-registered', payload: { tapCount: player.tapCount, finished: false } };
            }
            case 'time-up': {
                game.players.forEach(p => p.finished = true);
                game.phase = 'results';
                const rankings = [...game.players].sort((a, b) => b.tapCount - a.tapCount);
                return {
                    action: 'broadcast',
                    event: 'game-over',
                    payload: { rankings, winner: rankings[0] }
                };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }
}
module.exports = ButtonMashEngine;
