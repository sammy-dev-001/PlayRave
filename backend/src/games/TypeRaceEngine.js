// ============================================================================
// TypeRaceEngine.js — Pure Game Logic Engine
// ============================================================================

const { getRandomSentences } = require('../data/typeRaceSentences');

class TypeRaceEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'type-race-start-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'type-race-progress':
            case 'update-progress':
                return this.updateProgress(roomId, userId, payload.progress, payload.accuracy);
            case 'type-race-finish':
            case 'finish-round':
                return this.finishRound(roomId, userId, payload.typed, payload.timeTaken);
            case 'type-race-next-round':
            case 'next-round':
                return this.nextRound(roomId);
            case 'type-race-skip-round':
            case 'skip-round':
                return this.getRoundResults(roomId);
            case 'type-race-end-game':
            case 'end-game':
                return this.endGame(roomId);
            case 'get-state':
                return this.getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown Type Race event: ${eventName}` };
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
                score: 0,
                currentProgress: 0,
                finished: false,
                finishTime: null,
                accuracy: 0,
                roundPoints: 0
            });
        });

        // Fallback sentences if helper fails
        let sentences = [];
        try {
            sentences = getRandomSentences(5);
        } catch (e) {
            sentences = [
                "The quick brown fox jumps over the lazy dog.",
                "Programming is the art of telling a computer what to do.",
                "React Native makes mobile development accessible to web developers.",
                "Type as fast as you can to win the race!",
                "Accuracy is just as important as speed in this challenge."
            ];
        }

        const game = {
            type: 'type-race',
            roomId,
            players,
            sentences,
            currentRound: 0,
            totalRounds: sentences.length,
            currentSentence: sentences[0],
            roundStartTime: null,
            phase: 'waiting',
            hostParticipates
        };

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'type-race',
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
            totalRounds: game.totalRounds,
            currentRound: game.currentRound + 1,
            phase: game.phase,
            currentSentence: game.currentSentence
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
                gameType: 'type-race',
                gameState: state
            }
        };
    }

    startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.players.forEach(p => { 
            p.currentProgress = 0; 
            p.finished = false; 
            p.finishTime = null; 
            p.accuracy = 0;
            p.roundPoints = 0;
        });
        
        game.phase = 'playing';
        game.roundStartTime = Date.now();
        game.currentSentence = game.sentences[game.currentRound];

        return {
            action: 'broadcast',
            event: 'type-race-round-start',
            data: { 
                sentence: game.currentSentence, 
                round: game.currentRound + 1, 
                totalRounds: game.totalRounds 
            }
        };
    }

    updateProgress(roomId, userId, progress, accuracy) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const player = game.players.find(p => p.userId === userId);
        if (!player) return null;

        player.currentProgress = progress;
        player.accuracy = accuracy;

        return { 
            action: 'broadcast', 
            event: 'type-race-progress-update', 
            data: { playerId: userId, playerName: player.name, progress } 
        };
    }

    finishRound(roomId, userId, typed, timeTaken) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const player = game.players.find(p => p.userId === userId);
        if (!player || player.finished) return null;

        player.finished = true;
        player.finishTime = timeTaken;
        
        const target = game.currentSentence;
        let correct = 0;
        for (let i = 0; i < Math.min(typed.length, target.length); i++) {
            if (typed[i] === target[i]) correct++;
        }
        const accuracy = Math.round((correct / target.length) * 100);
        player.accuracy = accuracy;

        // Calculate points
        const finishedPlayers = game.players.filter(p => p.finished);
        const position = finishedPlayers.length;
        const points = position === 1 ? 100 : position === 2 ? 75 : position === 3 ? 50 : 25;
        player.score += points;
        player.roundPoints = points;

        const allFinished = game.players.every(p => p.finished);
        const instructions = [
            {
                action: 'emit',
                targetId: userId,
                event: 'type-race-finish-ack',
                data: { accuracy, timeTaken, points: player.roundPoints, position }
            }
        ];

        if (allFinished) {
            instructions.push(this.getRoundResults(roomId));
        } else if (position === 1) {
            // Auto-end round after 30 seconds once first person finishes
            instructions.push({
                action: 'schedule',
                delay: 30000,
                roomId,
                eventToTrigger: 'type-race-skip-round'
            });
        }

        return { action: 'multiple', instructions };
    }

    getRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.phase === 'results') return null;

        game.phase = 'results';
        const roundResults = game.players
            .map((p, index) => ({
                id: p.userId,
                userId: p.userId,
                name: p.name,
                time: p.finishTime,
                accuracy: p.accuracy,
                points: p.roundPoints,
                finished: p.finished
            }))
            .sort((a, b) => {
                if (a.finished && !b.finished) return -1;
                if (!a.finished && b.finished) return 1;
                return (a.time || 999) - (b.time || 999);
            });

        return { 
            action: 'broadcast', 
            event: 'type-race-round-results', 
            data: { 
                roundResults, 
                currentRound: game.currentRound + 1, 
                totalRounds: game.totalRounds 
            } 
        };
    }

    nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        game.currentRound++;
        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';
            const rankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, index) => ({ 
                    id: p.userId, 
                    userId: p.userId, 
                    name: p.name, 
                    score: p.score, 
                    position: index + 1 
                }));
            
            return { 
                action: 'broadcast', 
                event: 'type-race-game-finished', 
                data: { finished: true, rankings, winner: rankings[0] } 
            };
        }

        game.phase = 'waiting';
        return { 
            action: 'broadcast', 
            event: 'type-race-next-round-ready', 
            data: { finished: false, nextRound: game.currentRound + 1 } 
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'type-race-game-ended', data: { room: { id: roomId } } };
    }

}

module.exports = new TypeRaceEngine();
