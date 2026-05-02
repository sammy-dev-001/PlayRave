class NeonTapEngine {
    constructor() {
        this.activeGames = new Map();
    }

    startGame(room) {
        const hostParticipates = room.settings?.hostParticipates !== false;
        const gameState = {
            type: 'neon-tap',
            roomId: room.roomId,
            currentRound: 0,
            totalRounds: 10,
            circlePosition: null,
            roundStartTime: null,
            playerTaps: {}, 
            totalReactionTimes: {},
            roundsWon: {},
            status: 'WAITING',
            hostParticipates
        };

        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            gameState.playerTaps[player.userId] = {};
            gameState.totalReactionTimes[player.userId] = 0;
            gameState.roundsWon[player.userId] = 0;
        });

        this.activeGames.set(room.roomId, gameState);
        return { action: 'broadcast', event: 'game-started', payload: gameState };
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-round': {
                const circlePosition = {
                    x: 0.1 + Math.random() * 0.8,
                    y: 0.15 + Math.random() * 0.7
                };
                game.circlePosition = circlePosition;
                game.roundStartTime = Date.now();
                game.status = 'PLAYING';
                return {
                    action: 'broadcast',
                    event: 'round-started',
                    payload: {
                        circlePosition,
                        roundStartTime: game.roundStartTime,
                        currentRound: game.currentRound,
                        totalRounds: game.totalRounds
                    }
                };
            }
            case 'submit-tap': {
                if (!(userId in game.playerTaps)) return { action: 'error', message: 'Player not participating' };
                const currentRound = game.currentRound;
                if (game.playerTaps[userId][currentRound] === undefined) {
                    game.playerTaps[userId][currentRound] = payload.reactionTime;
                    game.totalReactionTimes[userId] += payload.reactionTime;
                    return { action: 'emit', event: 'tap-registered', payload: { success: true } };
                }
                return { action: 'error', message: 'Already tapped' };
            }
            case 'get-results': {
                const currentRound = game.currentRound;
                const roundTaps = [];
                Object.keys(game.playerTaps).forEach(pid => {
                    const reactionTime = game.playerTaps[pid][currentRound];
                    if (reactionTime !== undefined) {
                        roundTaps.push({ userId: pid, reactionTime, roundsWon: game.roundsWon[pid] });
                    } else {
                        roundTaps.push({ userId: pid, reactionTime: null, roundsWon: game.roundsWon[pid] });
                    }
                });
                roundTaps.sort((a, b) => {
                    if (a.reactionTime === null) return 1;
                    if (b.reactionTime === null) return -1;
                    return a.reactionTime - b.reactionTime;
                });
                const winner = roundTaps[0].reactionTime !== null ? roundTaps[0] : null;
                if (winner) game.roundsWon[winner.userId]++;
                return {
                    action: 'broadcast',
                    event: 'round-results',
                    payload: {
                        currentRound,
                        totalRounds: game.totalRounds,
                        winner: winner ? winner.userId : null,
                        roundTaps,
                        isLastRound: currentRound === game.totalRounds - 1
                    }
                };
            }
            case 'next-round': {
                game.currentRound++;
                if (game.currentRound >= game.totalRounds) {
                    game.status = 'FINISHED';
                    const finalScores = Object.entries(game.totalReactionTimes).map(([pid, totalTime]) => {
                        const tapsCount = Object.keys(game.playerTaps[pid] || {}).length;
                        const avgTime = tapsCount > 0 ? Math.round(totalTime / tapsCount) : 999999;
                        return { userId: pid, score: avgTime };
                    });
                    finalScores.sort((a, b) => a.score - b.score);
                    return { action: 'broadcast', event: 'game-over', payload: { finished: true, finalScores } };
                }
                game.status = 'WAITING';
                return { action: 'broadcast', event: 'next-round-ready', payload: { finished: false } };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }
}
module.exports = NeonTapEngine;
