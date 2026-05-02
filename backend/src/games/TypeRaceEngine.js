const { getRandomSentences } = require('../data/typeRaceSentences');

class TypeRaceEngine {
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
                score: 0,
                currentProgress: 0,
                finished: false,
                finishTime: null
            });
        });

        const sentences = getRandomSentences ? getRandomSentences(5) : ["Sample sentence one.", "Sample sentence two.", "Sample sentence three.", "Sample sentence four.", "Sample sentence five."];

        const gameState = {
            type: 'type-race',
            roomId: room.roomId,
            players,
            sentences,
            currentRound: 0,
            totalRounds: sentences.length,
            currentSentence: sentences[0],
            roundStartTime: null,
            phase: 'waiting',
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
                game.players.forEach(p => { p.currentProgress = 0; p.finished = false; p.finishTime = null; });
                game.phase = 'playing';
                game.roundStartTime = Date.now();
                return {
                    action: 'broadcast',
                    event: 'round-started',
                    payload: { sentence: game.currentSentence, round: game.currentRound + 1, totalRounds: game.totalRounds }
                };
            }
            case 'update-progress': {
                const player = game.players.find(p => p.userId === userId);
                if (!player) return { action: 'error', message: 'Player not found' };
                player.currentProgress = payload.progress;
                player.accuracy = payload.accuracy;
                return { action: 'broadcast', event: 'progress-updated', payload: { progress: payload.progress, userId, playerName: player.name } };
            }
            case 'finish-round': {
                const player = game.players.find(p => p.userId === userId);
                if (!player || player.finished) return { action: 'error', message: 'Player not found or already finished' };
                player.finished = true;
                player.finishTime = payload.timeTaken;
                
                const targetSentence = game.currentSentence;
                const typed = payload.typed || '';
                let correctChars = 0;
                for (let i = 0; i < Math.min(typed.length, targetSentence.length); i++) {
                    if (typed[i] === targetSentence[i]) correctChars++;
                }
                const accuracy = Math.round((correctChars / targetSentence.length) * 100);
                player.accuracy = accuracy;
                
                if (accuracy >= 80) {
                    const finishedPlayers = game.players.filter(p => p.finished && p.accuracy >= 80);
                    const position = finishedPlayers.length;
                    const points = position === 1 ? 100 : position === 2 ? 75 : position === 3 ? 50 : 25;
                    player.score += points;
                    player.roundPoints = points;
                } else {
                    player.roundPoints = 0;
                }
                
                const allFinished = game.players.every(p => p.finished);
                return {
                    action: 'emit',
                    event: 'round-finished',
                    payload: { finished: true, accuracy, timeTaken: payload.timeTaken, points: player.roundPoints, allFinished, position: game.players.filter(p => p.finished).length }
                };
            }
            case 'get-results': {
                const roundResults = game.players
                    .filter(p => p.finished)
                    .sort((a, b) => (a.finishTime || 99999) - (b.finishTime || 99999))
                    .map((p, index) => ({
                        userId: p.userId,
                        name: p.name,
                        time: p.finishTime,
                        accuracy: p.accuracy,
                        points: p.roundPoints,
                        position: index + 1
                    }));
                return { action: 'broadcast', event: 'round-results', payload: { roundResults, currentRound: game.currentRound + 1, totalRounds: game.totalRounds } };
            }
            case 'next-round': {
                game.currentRound++;
                if (game.currentRound >= game.totalRounds) {
                    game.phase = 'finished';
                    const finalRankings = [...game.players]
                        .sort((a, b) => b.score - a.score)
                        .map((p, index) => ({ userId: p.userId, name: p.name, score: p.score, position: index + 1 }));
                    return { action: 'broadcast', event: 'game-over', payload: { finished: true, rankings: finalRankings, winner: finalRankings[0] } };
                }
                game.currentSentence = game.sentences[game.currentRound];
                game.phase = 'waiting';
                return { action: 'broadcast', event: 'next-round-ready', payload: { finished: false, nextRound: game.currentRound + 1 } };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }
}
module.exports = TypeRaceEngine;
