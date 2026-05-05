const { getRandomQuestions } = require('../data/lieDetectorQuestions');

class LieDetectorEngine {
    constructor() {
        this.activeGames = new Map();
    }

    startGame(room) {
        const roomId = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;

        const players = hostParticipates
            ? room.players
            : room.players.filter(p => !p.isHost);

        const questions = getRandomQuestions(players.length * 2);

        const gameState = {
            type: 'lie-detector',
            roomId,
            questions,
            players: players.map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar })),
            currentPlayerIndex: 0,
            currentQuestionIndex: 0,
            phase: 'answering', // answering, voting, reveal
            currentAnswer: null,
            isLie: null, 
            votes: {}, // { voterId: 'truth' | 'lie' }
            scores: {},
            roundsPlayed: 0,
            totalRounds: Math.min(players.length * 2, 10)
        };

        players.forEach(p => { gameState.scores[p.userId] = 0; });
        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'lie-detector',
                type: 'lie-detector',
                gameState: this.getLieDetectorPublicState(gameState),
                currentPlayer: gameState.players[0],
                question: questions[0],
                players: gameState.players.map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar, uid: p.userId })),
                hostParticipates
            }
        }));

        return { action: 'multiple', instructions };

    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'submit-answer':
                return this.submitLieDetectorAnswer(roomId, userId, payload.answer, payload.isLie);
            case 'submit-vote':
                return this.submitLieDetectorVote(roomId, userId, payload.vote);
            case 'next-round':
                return this.nextLieDetectorRound(roomId);
            case 'get-state':
                return this.getState(roomId);
            case 'end-game':
                return this.endGame(roomId);

            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }

    getState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        return {
            action: 'emit',
            event: 'game-state-sync',
            data: this.getLieDetectorPublicState(game)
        };
    }

    getLieDetectorPublicState(game) {
        return {
            type: game.type,
            phase: game.phase,
            currentPlayer: game.players[game.currentPlayerIndex],
            question: game.questions[game.currentQuestionIndex],
            roundsPlayed: game.roundsPlayed,
            totalRounds: game.totalRounds,
            scores: game.scores,
            voteCount: Object.keys(game.votes).length,
            totalVoters: game.players.length - 1
        };
    }

    submitLieDetectorAnswer(roomId, userId, answer, isLie) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== userId) return { action: 'error', message: 'Not your turn' };

        game.currentAnswer = answer;
        game.isLie = isLie;
        game.phase = 'voting';
        game.votes = {};

        return {
            action: 'broadcast',
            event: 'lie-detector-answer-submitted',
            data: this.getLieDetectorPublicState(game)
        };
    }

    submitLieDetectorVote(roomId, userId, vote) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId === userId) return { action: 'error', message: 'Subject cannot vote' };

        game.votes[userId] = vote;

        const expectedVotes = game.players.length - 1;
        if (Object.keys(game.votes).length >= expectedVotes) {
            return this.revealLieDetectorResult(roomId);
        }

        return {
            action: 'broadcast',
            event: 'lie-detector-vote-update',
            data: { waiting: true, voteCount: Object.keys(game.votes).length }
        };
    }

    revealLieDetectorResult(roomId) {
        const game = this.activeGames.get(roomId);
        game.phase = 'reveal';
        const currentPlayer = game.players[game.currentPlayerIndex];
        const actualAnswer = game.isLie ? 'lie' : 'truth';

        let fooledCount = 0;
        Object.entries(game.votes).forEach(([voterId, vote]) => {
            if (vote === actualAnswer) {
                game.scores[voterId] = (game.scores[voterId] || 0) + 100;
            } else {
                fooledCount++;
            }
        });

        if (fooledCount > 0) {
            game.scores[currentPlayer.userId] = (game.scores[currentPlayer.userId] || 0) + (fooledCount * 50);
        }
        if (fooledCount === game.players.length - 1) {
            game.scores[currentPlayer.userId] = (game.scores[currentPlayer.userId] || 0) + 100;
        }

        return {
            action: 'broadcast',
            event: 'lie-detector-reveal',
            data: {
                phase: 'reveal',
                currentPlayer,
                answer: game.currentAnswer,
                wasLie: game.isLie,
                votes: game.votes,
                fooledCount,
                scores: game.scores
            }
        };
    }

    nextLieDetectorRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.roundsPlayed++;
        game.currentQuestionIndex++;
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        if (game.roundsPlayed >= game.totalRounds) {
            const rankings = Object.entries(game.scores)
                .map(([id, score]) => {
                    const player = game.players.find(p => p.userId === id);
                    return { ...player, score };
                })
                .sort((a, b) => b.score - a.score);

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event: 'lie-detector-finished',
                data: { finished: true, rankings, winner: rankings[0] }
            };
        }

        game.phase = 'answering';
        game.currentAnswer = null;
        game.isLie = null;
        game.votes = {};

        return {
            action: 'broadcast',
            event: 'lie-detector-next-round',
            data: {
                finished: false,
                gameState: this.getLieDetectorPublicState(game)
            }
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'lie-detector-ended', data: { message: 'Game ended by host' } };
    }
}


module.exports = new LieDetectorEngine();
