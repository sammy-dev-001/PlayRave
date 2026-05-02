// ============================================================================
// MythOrFactEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { getRandomStatements } = require('../data/mythOrFactStatements');

class MythOrFactEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'myth-or-fact-submit-answer':
            case 'submit-myth-or-fact-answer':
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.answer);
            case 'myth-or-fact-show-results':
            case 'show-myth-or-fact-results':
            case 'show-results':
                return this.getResults(roomId);
            case 'myth-or-fact-next-statement':
            case 'next-myth-or-fact-statement':
            case 'next-statement':
                return this.nextStatement(roomId);
            case 'myth-or-fact-end-game':
            case 'end-myth-or-fact':
            case 'end-game':
                return this.endGame(roomId);

            default:
                return { action: 'error', message: `Unknown Myth or Fact event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        
        const statements = getRandomStatements(5);

        const gameState = {
            type: 'myth-or-fact',
            roomId,
            statements,
            currentStatementIndex: 0,
            playerAnswers: {}, // { userId: { statementIndex: boolean } }
            scores: {}, // { userId: score }
            statementStartTime: Date.now(),
            status: 'PLAYING',
            hostParticipates
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
                gameType: 'myth-or-fact',
                gameState: this.getGameState(roomId, p.userId),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }


        }));

        return { action: 'multiple', instructions };
    }

    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'myth-or-fact') return null;

        const statement = game.statements[game.currentStatementIndex];
        return {
            status: game.status,
            statementIndex: game.currentStatementIndex,
            totalStatements: game.statements.length,
            statement: statement.statement,
            category: statement.category,
            scores: game.scores,
            hasAnswered: userId ? !!(game.playerAnswers[userId] && game.playerAnswers[userId][game.currentStatementIndex] !== undefined) : false
        };
    }

    submitAnswer(roomId, userId, answer) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!(userId in game.scores)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player is not participating' } };
        }

        const statementIndex = game.currentStatementIndex;

        if (!game.playerAnswers[userId]) {
            game.playerAnswers[userId] = {};
        }
        
        if (game.playerAnswers[userId][statementIndex] !== undefined) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Already answered' } };
        }

        game.playerAnswers[userId][statementIndex] = answer;

        const correctAnswer = game.statements[statementIndex].answer;
        if (answer === correctAnswer) {
            game.scores[userId] += 10;
        }

        const instructions = [
            { action: 'emit', targetId: userId, event: 'vote-submitted', data: { success: true } }
        ];
        
        // Check if all players answered
        const expectedAnswers = Object.keys(game.scores).length;
        const currentAnswers = Object.keys(game.playerAnswers).filter(id => game.playerAnswers[id][statementIndex] !== undefined).length;
        
        if (currentAnswers >= expectedAnswers) {
            instructions.push(this.getResults(roomId));
        }

        return { action: 'multiple', instructions };
    }

    getResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const currentStatement = game.statements[game.currentStatementIndex];
        const results = {
            statementIndex: game.currentStatementIndex,
            statement: currentStatement.statement,
            correctAnswer: currentStatement.answer,
            answerText: currentStatement.answer ? 'FACT ✓' : 'MYTH 🚫',
            explanation: currentStatement.explanation,
            isLastStatement: game.currentStatementIndex === game.statements.length - 1,
            playerResults: []
        };

        Object.keys(game.scores).forEach(userId => {
            const playerAnswer = game.playerAnswers[userId]?.[game.currentStatementIndex];
            results.playerResults.push({
                playerId: userId, // Keep as playerId for frontend compatibility, but populated with userId
                answer: playerAnswer,
                isCorrect: playerAnswer === currentStatement.answer,
                currentScore: game.scores[userId]
            });
        });

        game.status = 'RESULTS';

        return {
            action: 'broadcast',
            event: 'myth-or-fact-results',
            data: results
        };
    }

    nextStatement(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.currentStatementIndex++;
        game.statementStartTime = Date.now();
        game.status = 'PLAYING';

        if (game.currentStatementIndex >= game.statements.length) {
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

        return {
            action: 'broadcast',
            event: 'next-myth-or-fact-statement-ready',
            data: { statement: this.getGameState(roomId) }
        };
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
        return { action: 'game-ended', event: 'myth-or-fact-ended', data: { message: 'Game ended by host' } };
    }

}

module.exports = new MythOrFactEngine();
