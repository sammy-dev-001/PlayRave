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
            case 'trivia-submit-answer':
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.answerIndex);
            case 'trivia-show-results':
            case 'show-results':
            case 'force-results':
                return this.getQuestionResults(roomId, payload?.expectedQuestionIndex);
            case 'trivia-next-question':
            case 'next-question':
                return this.nextQuestion(roomId, payload?.expectedQuestionIndex);
            case 'trivia-get-state':
            case 'get-state':
                return this.getState(roomId, userId);
            case 'trivia-end-game':
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
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }


        }));

        // Trivia timers are physical actions. We can schedule 'show-results' to force advance.
        const isSolo = Object.keys(gameState.scores).length === 1;
        instructions.push({
            action: 'schedule',
            delay: isSolo ? 10000 : 15000, // Faster timer for solo
            eventToTrigger: 'force-results',
            roomId,
            data: { expectedQuestionIndex: gameState.currentQuestionIndex }
        });

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'trivia') return null;

        const currentQuestion = game.questions[game.currentQuestionIndex];
        return {
            status: game.status,
            currentQuestionIndex: game.currentQuestionIndex,
            totalQuestions: game.questions.length,
            question: {
                question: currentQuestion.question,
                options: currentQuestion.options,
                category: currentQuestion.category,
                totalQuestions: game.questions.length,
                questionIndex: game.currentQuestionIndex
            },
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
            // Auto-trigger show results with a small 'dramatic pause'
            instructions.push({
                action: 'schedule',
                delay: 1500, // 1.5s delay so users can see their own 'Correct/Wrong' feedback
                eventToTrigger: 'force-results',
                roomId,
                data: { expectedQuestionIndex: questionIndex }
            });

            // If Solo Mode: Auto-advance to next question after 4.5 seconds (delay + 3s)
            if (expectedAnswers === 1) {
                instructions.push({
                    action: 'schedule',
                    delay: 4500,
                    eventToTrigger: 'next-question',
                    roomId,
                    data: { expectedQuestionIndex: questionIndex }
                });
            }
        }

        return { action: 'multiple', instructions };
    }

    getQuestionResults(roomId, expectedQuestionIndex) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        if (expectedQuestionIndex !== undefined && game.currentQuestionIndex !== expectedQuestionIndex) {
            return { action: 'none' }; // Stale timer from previous round
        }

        if (game.status === 'RESULTS' || game.status === 'FINISHED') {
            return { action: 'none' }; // Prevent double-triggering
        }

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

        const broadcastInst = {
            action: 'broadcast',
            event: 'question-results',
            data: results
        };

        // If Solo: Always auto-advance after 3 seconds, even if they didn't answer
        if (Object.keys(game.scores).length === 1) {
            return {
                action: 'multiple',
                instructions: [
                    broadcastInst,
                    {
                        action: 'schedule',
                        delay: 4000, // 4s for forced results to give more reading time
                        eventToTrigger: 'next-question',
                        roomId,
                        data: { expectedQuestionIndex: game.currentQuestionIndex }
                    }
                ]
            };
        }

        return broadcastInst;
    }

    nextQuestion(roomId, expectedQuestionIndex) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        if (expectedQuestionIndex !== undefined && game.currentQuestionIndex !== expectedQuestionIndex) {
            return { action: 'none' }; // Stale timer from previous round
        }

        if (game.status === 'PLAYING') {
            return { action: 'none' }; // Already advanced
        }

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
                event: 'next-question-ready',
                data: this.getGameState(roomId)
            },
            {
                action: 'schedule',
                delay: Object.keys(game.scores).length === 1 ? 10000 : 15000,
                eventToTrigger: 'force-results',
                roomId,
                data: { expectedQuestionIndex: game.currentQuestionIndex }
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

    getState(roomId, userId) {
        const state = this.getGameState(roomId, userId);
        if (!state) return { action: 'error', message: 'Game not found' };
        return {
            action: 'emit',
            targetId: userId,
            event: 'game-state-sync',
            data: {
                gameType: 'trivia',
                gameState: state
            }
        };
    }

    removePlayer(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        // Stop tracking their score if they leave
        delete game.scores[userId];

        // Check if we should now auto-advance because they were the last one we were waiting for
        const questionIndex = game.currentQuestionIndex;
        const expectedAnswers = Object.keys(game.scores).length;
        const currentAnswers = Object.keys(game.playerAnswers).filter(id => game.playerAnswers[id] && game.playerAnswers[id][questionIndex] !== undefined).length;

        if (expectedAnswers > 0 && currentAnswers >= expectedAnswers && game.status === 'PLAYING') {
            return {
                action: 'schedule',
                delay: 1000,
                eventToTrigger: 'force-results',
                roomId,
                data: { expectedQuestionIndex: game.currentQuestionIndex }
            };
        }
        return null;
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'trivia-ended', data: { message: 'Game ended by host' } };
    }

}

module.exports = new TriviaEngine();
