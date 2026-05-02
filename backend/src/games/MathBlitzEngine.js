// ============================================================================
// MathBlitzEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class MathBlitzEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'math-blitz-start-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'math-blitz-answer':
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.answer);
            case 'math-blitz-next-round':
            case 'next-round':
                return this.nextRound(roomId);
            case 'math-blitz-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Math Blitz event: ${eventName}` };
        }
    }

    generateMathProblem(difficulty = 'medium') {
        const operations = ['+', '-', '*'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        let num1, num2, answer;
        switch (difficulty) {
            case 'easy':
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 10) + 1;
                break;
            case 'hard':
                num1 = Math.floor(Math.random() * 50) + 10;
                num2 = Math.floor(Math.random() * 30) + 5;
                break;
            default:
                num1 = Math.floor(Math.random() * 20) + 5;
                num2 = Math.floor(Math.random() * 15) + 2;
        }
        if (op === '-' && num2 > num1) [num1, num2] = [num2, num1];
        if (op === '*') {
            num1 = Math.floor(Math.random() * 12) + 2;
            num2 = Math.floor(Math.random() * 12) + 2;
        }
        switch (op) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }
        return { display: `${num1} ${op} ${num2}`, answer };
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
                answered: false,
                correct: false
            });
        });

        const totalRounds = 10;
        const problems = [];
        for (let i = 0; i < totalRounds; i++) problems.push(this.generateMathProblem('medium'));

        const game = {
            type: 'math-blitz',
            roomId,
            players,
            problems,
            currentRound: 0,
            totalRounds,
            currentProblem: problems[0],
            roundStartTime: null,
            roundWinner: null,
            phase: 'waiting',
            hostParticipates
        };

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'math-blitz',
                gameState: this.getGameState(roomId),
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
            phase: game.phase
        };
    }

    startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.players.forEach(p => { p.answered = false; p.correct = false; });
        game.phase = 'playing';
        game.roundStartTime = Date.now();
        game.roundWinner = null;
        game.currentProblem = game.problems[game.currentRound];

        return { 
            action: 'broadcast', 
            event: 'math-blitz-round-start', 
            data: { 
                problem: game.currentProblem.display, 
                round: game.currentRound + 1, 
                totalRounds: game.totalRounds 
            } 
        };
    }

    submitAnswer(roomId, userId, answer) {
        const game = this.activeGames.get(roomId);
        if (!game || game.phase !== 'playing') return { action: 'error', message: 'Round not active' };

        const player = game.players.find(p => p.userId === userId);
        if (!player || player.answered) return { action: 'error', message: 'Invalid submission' };

        player.answered = true;
        const isCorrect = parseInt(answer) === game.currentProblem.answer;
        player.correct = isCorrect;

        const instructions = [];

        if (isCorrect && !game.roundWinner) {
            game.roundWinner = userId;
            player.score += 100;
            
            // Broadcast the winner immediately
            instructions.push({
                action: 'broadcast',
                event: 'math-blitz-round-won',
                data: { winnerName: player.name, winnerId: userId, correctAnswer: game.currentProblem.answer }
            });

            // Send specific success to the winner
            instructions.push({
                action: 'emit',
                targetId: userId,
                event: 'math-blitz-answer-result',
                data: { correct: true, isWinner: true }
            });

            // Automatically transition to results after a short delay
            instructions.push({
                action: 'schedule',
                delay: 2000,
                roomId,
                eventToTrigger: 'get-results'
            });
        } else {
            // Send result back to the individual player
            instructions.push({
                action: 'emit',
                targetId: userId,
                event: 'math-blitz-answer-result',
                data: { correct: isCorrect, isWinner: false }
            });
        }

        return { action: 'multiple', instructions };
    }

    handleEvent(eventName, payload, userId, roomId) {
        // Redefining handleEvent to include 'get-results' which is scheduled
        if (eventName === 'get-results') return this.getRoundResults(roomId);
        
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'math-blitz-start-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'math-blitz-answer':
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.answer);
            case 'math-blitz-next-round':
            case 'next-round':
                return this.nextRound(roomId);
            case 'math-blitz-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Math Blitz event: ${eventName}` };
        }
    }

    getRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';
        const standings = [...game.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({ 
                id: p.userId, // Map to id for frontend
                userId: p.userId, 
                name: p.name, 
                score: p.score, 
                position: i + 1 
            }));

        return { 
            action: 'broadcast', 
            event: 'math-blitz-round-results', 
            data: { 
                standings, 
                correctAnswer: game.currentProblem.answer,
                currentRound: game.currentRound + 1, 
                totalRounds: game.totalRounds 
            } 
        };
    }

    nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        game.currentRound++;
        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';
            const rankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ 
                    id: p.userId, 
                    userId: p.userId, 
                    name: p.name, 
                    score: p.score, 
                    position: i + 1 
                }));
            return { 
                action: 'broadcast', 
                event: 'math-blitz-game-finished', 
                data: { finished: true, rankings, winner: rankings[0] } 
            };
        }

        game.phase = 'waiting';
        return { 
            action: 'broadcast', 
            event: 'math-blitz-next-round-ready', 
            data: { finished: false, nextRound: game.currentRound + 1 } 
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'math-blitz-game-ended', data: { message: 'Game ended' } };
    }
}

module.exports = new MathBlitzEngine();
