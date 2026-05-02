// ============================================================================
// TriviaEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getRandomQuestions } = require('../data/triviaQuestions');

class TriviaEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.answerIndex);
            case 'show-results':
            case 'force-results':
                return this.getQuestionResults(roomId);
            case 'next-question':
                return this.nextQuestion(roomId);
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Trivia event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        const category = options.category || 'All';
        
        let questions;

        if (room.customQuestions && room.customQuestions.length >= 5) {
            questions = room.customQuestions.slice(0, 5);
        } else {
            questions = getRandomQuestions(5, category);
        }

        const gameState = {
            type: 'trivia',
            roomId,
            questions,
            currentQuestionIndex: 0,
            playerAnswers: {}, // { userId: { questionIndex: answerIndex } }
            scores: {}, // { userId: score }
            questionStartTime: Date.now(),
            status: 'PLAYING',
            hostParticipates,
            category,
            usingCustomQuestions: room.customQuestions && room.customQuestions.length >= 5
        };

        // Initialize scores
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.scores[player.userId] = 0;
        });

        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'trivia',
                gameState: this.getGameState(roomId, p.userId),
                players: room.players.map(pl => ({ userId: pl.userId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }

        }));

        // Trivia timers are physical actions. We can schedule 'show-results' to force advance.
        // Assuming 10-second timer per question for trivia.
        instructions.push({
            action: 'schedule',
            delay: 15000,
            eventToTrigger: 'force-results',
            roomId
        });

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'trivia') return null;

        const question = game.questions[game.currentQuestionIndex];
        return {
            status: game.status,
            currentQuestionIndex: game.currentQuestionIndex,
            totalQuestions: game.questions.length,
            question: question.question,
            options: question.options,
            category: question.category,
            scores: game.scores,
            hasAnswered: userId ? !!(game.playerAnswers[userId] && game.playerAnswers[userId][game.currentQuestionIndex] !== undefined) : false
        };
    }

    submitAnswer(roomId, userId, answerIndex) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!(userId in game.scores)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player is not participating' } };
        }

        const questionIndex = game.currentQuestionIndex;

        if (!game.playerAnswers[userId]) {
            game.playerAnswers[userId] = {};
        }
        
        // Prevent double answering
        if (game.playerAnswers[userId][questionIndex] !== undefined) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Already answered' } };
        }

        game.playerAnswers[userId][questionIndex] = answerIndex;

        const correctAnswer = game.questions[questionIndex].correctAnswer;
        if (answerIndex === correctAnswer) {
            // Give points. Maybe add time-based points here if needed.
            game.scores[userId] += 10;
        }

        // Notify the player their vote was submitted successfully
        const instructions = [
            { action: 'emit', targetId: userId, event: 'vote-submitted', data: { success: true } }
        ];
        
        // Check if all participating players have answered
        const expectedAnswers = Object.keys(game.scores).length;
        const currentAnswers = Object.keys(game.playerAnswers).filter(id => game.playerAnswers[id][questionIndex] !== undefined).length;
        
        if (currentAnswers >= expectedAnswers) {
            // Auto-trigger show results
            instructions.push(this.getQuestionResults(roomId));
        }

        return { action: 'multiple', instructions };
    }

    getQuestionResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const currentQuestion = game.questions[game.currentQuestionIndex];
        const results = {
            questionIndex: game.currentQuestionIndex,
            question: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            correctOption: currentQuestion.options[currentQuestion.correctAnswer],
            isLastQuestion: game.currentQuestionIndex === game.questions.length - 1,
            playerResults: []
        };

        Object.keys(game.scores).forEach(userId => {
            const playerAnswer = game.playerAnswers[userId]?.[game.currentQuestionIndex];
            results.playerResults.push({
                playerId: userId,
                answer: playerAnswer,
                isCorrect: playerAnswer === currentQuestion.correctAnswer,
                currentScore: game.scores[userId]
            });
        });

        game.status = 'RESULTS';

        return {
            action: 'broadcast',
            event: 'question-results',
            data: results
        };
    }

    nextQuestion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.currentQuestionIndex++;
        game.questionStartTime = Date.now();
        game.status = 'PLAYING';

        if (game.currentQuestionIndex >= game.questions.length) {
            game.status = 'FINISHED';
            return {
                action: 'broadcast',
                event: 'game-finished',
                data: {
                    finished: true,
                    finalScores: this.getFinalScores(roomId)
                }
            };
        }

        const instructions = [
            {
                action: 'broadcast',
                event: 'next-question-started',
                data: this.getGameState(roomId)
            },
            {
                action: 'schedule',
                delay: 15000,
                eventToTrigger: 'force-results',
                roomId
            }
        ];

        return { action: 'multiple', instructions };
    }

    getFinalScores(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const scores = Object.entries(game.scores).map(([userId, score]) => ({
            playerId: userId,
            score
        }));

        scores.sort((a, b) => b.score - a.score);
        return scores;
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'game-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new TriviaEngine();
