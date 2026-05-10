// ============================================================================
// HotSeatMCEngine.js — "How Well Do You Know Me?" (Multiple Choice)
// ============================================================================
// One player is in the "Hot Seat". They answer a MC question privately.
// All other players guess what the Hot Seat player picked.
//
// Scoring:
// - Correct Guess: +100 pts
// - Hot Seat Bonus: +50 pts per correct guesser
// ============================================================================

const { getRandomHotSeatMCQuestion } = require('../data/hotSeatMCQuestions');

class HotSeatMCEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    startGame(room) {
        const roomId = room.id;
        const players = room.players.map(p => ({
            userId: p.userId,
            name: p.name,
            score: 0,
            hasBeenHotSeat: false
        }));

        const hostParticipates = room.settings?.hostParticipates !== false;
        const participants = hostParticipates ? players : players.filter(p => p.userId !== room.hostId);

        // Randomly pick the first Hot Seat player
        const targetIndex = Math.floor(Math.random() * participants.length);
        const target = participants[targetIndex];
        target.hasBeenHotSeat = true;

        const question = getRandomHotSeatMCQuestion();

        const gameState = {
            type: 'hot-seat-mc',
            roomId,
            players,
            participants,
            targetUserId: target.userId,
            targetUserName: target.name,
            currentQuestion: question.question,
            options: question.options,
            correctAnswerIndex: null, // Set when target answers
            playerGuesses: {}, // userId → index
            gamePhase: 'waiting-for-target', // waiting-for-target | guessing-phase | reveal-phase
            round: 1,
            totalRounds: Math.min(participants.length * 2, 10), // Each person gets ~2 turns
            usedQuestions: [question.question],
        };

        this.activeGames.set(roomId, gameState);

        return {
            action: 'broadcast',
            event: 'game-started',
            data: {
                gameType: 'hot-seat-mc',
                type: 'hot-seat-mc',
                gameState: this._publicState(gameState, null),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
            }
        };
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'lock-target-answer':
                return this._lockTargetAnswer(roomId, userId, payload.answerIndex);
            case 'lock-player-guess':
                return this._lockPlayerGuess(roomId, userId, payload.guessIndex);
            case 'hot-seat-mc-next-round':
            case 'next-round':
                return this._nextRound(roomId);
            case 'hot-seat-mc-get-state':
            case 'get-state':
                return this._getState(roomId, userId);
            case 'hot-seat-mc-end-game':
            case 'end-game':
                return this._endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Hot Seat MC event: ${eventName}` };
        }
    }

    _getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        return {
            action: 'emit',
            targetId: userId,
            event: 'hot-seat-mc-state-update',
            data: this._publicState(game, userId),
        };
    }

    _publicState(game, userId) {
        const isTarget = userId === game.targetUserId;
        const hasGuessed = !!game.playerGuesses[userId];
        const guessCount = Object.keys(game.playerGuesses).length;
        const expectedGuessers = game.participants.length - 1;

        return {
            type: game.type,
            round: game.round,
            totalRounds: game.totalRounds,
            gamePhase: game.gamePhase,
            targetUserId: game.targetUserId,
            targetUserName: game.targetUserName,
            currentQuestion: game.currentQuestion,
            options: game.options,
            isTarget,
            hasGuessed,
            guessCount,
            expectedGuessers,
            playerGuesses: game.gamePhase === 'reveal-phase' ? game.playerGuesses : null,
            scores: game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {}),
        };
    }

    _lockTargetAnswer(roomId, userId, answerIndex) {
        const game = this.activeGames.get(roomId);
        if (!game || userId !== game.targetUserId) return { action: 'error', message: 'Unauthorized' };
        if (game.gamePhase !== 'waiting-for-target') return { action: 'error', message: 'Wrong phase' };

        game.correctAnswerIndex = answerIndex;
        game.gamePhase = 'guessing-phase';
        game.playerGuesses = {};

        return {
            action: 'broadcast',
            event: 'hot-seat-mc-state-update',
            data: {
                gamePhase: 'guessing-phase',
                currentQuestion: game.currentQuestion,
                options: game.options,
                guessCount: 0,
                expectedGuessers: game.participants.length - 1
            }
        };
    }

    _lockPlayerGuess(roomId, userId, guessIndex) {
        const game = this.activeGames.get(roomId);
        if (!game || userId === game.targetUserId) return { action: 'error', message: 'Unauthorized' };
        if (game.gamePhase !== 'guessing-phase') return { action: 'error', message: 'Wrong phase' };

        game.playerGuesses[userId] = guessIndex;

        const guessCount = Object.keys(game.playerGuesses).length;
        const expectedGuessers = game.participants.length - 1;

        if (guessCount >= expectedGuessers) {
            return this._revealRound(roomId);
        }

        return {
            action: 'broadcast',
            event: 'hot-seat-mc-state-update',
            data: {
                guessCount,
                expectedGuessers
            }
        };
    }

    _revealRound(roomId) {
        const game = this.activeGames.get(roomId);
        game.gamePhase = 'reveal-phase';

        const guessResults = [];
        let correctGuessCount = 0;

        game.participants.forEach(p => {
            if (p.userId === game.targetUserId) return;

            const guessIndex = game.playerGuesses[p.userId];
            const isCorrect = guessIndex === game.correctAnswerIndex;

            if (isCorrect) {
                p.score += 100;
                correctGuessCount++;
            }

            guessResults.push({
                playerId: p.userId,
                playerName: p.name,
                guessIndex,
                guessText: game.options[guessIndex],
                isCorrect
            });
        });

        // Target bonus
        const targetBonus = correctGuessCount * 50;
        const target = game.players.find(p => p.userId === game.targetUserId);
        if (target) target.score += targetBonus;

        const results = {
            correctAnswerIndex: game.correctAnswerIndex,
            correctAnswerText: game.options[game.correctAnswerIndex],
            guessResults,
            correctGuessCount,
            targetBonus,
            scores: game.players.reduce((acc, p) => { acc[p.userId] = p.score; return acc; }, {})
        };

        return {
            action: 'broadcast',
            event: 'hot-seat-mc-reveal',
            data: {
                results,
                gameState: this._publicState(game, null)
            }
        };
    }

    _nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.round++;
        if (game.round > game.totalRounds) {
            return this._finishGame(roomId);
        }

        // Pick next target (someone who hasn't been hot seat yet, or random if everyone has)
        let availableTargets = game.participants.filter(p => !p.hasBeenHotSeat);
        if (availableTargets.length === 0) {
            // Reset and pick someone else
            game.participants.forEach(p => p.hasBeenHotSeat = false);
            availableTargets = game.participants.filter(p => p.userId !== game.targetUserId);
        }

        const nextTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
        nextTarget.hasBeenHotSeat = true;

        const question = getRandomHotSeatMCQuestion(null, game.usedQuestions);
        game.usedQuestions.push(question.question);

        game.targetUserId = nextTarget.userId;
        game.targetUserName = nextTarget.name;
        game.currentQuestion = question.question;
        game.options = question.options;
        game.correctAnswerIndex = null;
        game.playerGuesses = {};
        game.gamePhase = 'waiting-for-target';

        return {
            action: 'broadcast',
            event: 'hot-seat-mc-state-update',
            data: this._publicState(game, null)
        };
    }

    _finishGame(roomId) {
        const game = this.activeGames.get(roomId);
        const rankings = [...game.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({ id: p.userId, name: p.name, score: p.score, position: i + 1 }));

        this.activeGames.delete(roomId);
        return {
            action: 'broadcast',
            event: 'hot-seat-mc-game-finished',
            data: { rankings, winner: rankings[0] }
        };
    }

    _endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'hot-seat-mc-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new HotSeatMCEngine();
