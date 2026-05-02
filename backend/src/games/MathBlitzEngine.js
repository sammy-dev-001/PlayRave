class MathBlitzEngine {
    constructor() {
        this.activeGames = new Map();
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
        if (op === '-' && num2 > num1) {
            [num1, num2] = [num2, num1];
        }
        if (op === '*') {
            num1 = Math.floor(Math.random() * 12) + 2;
            num2 = Math.floor(Math.random() * 12) + 2;
        }
        switch (op) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }
        return { display: `${num1} ${op} ${num2}`, answer, num1, num2, operation: op };
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
                answered: false,
                correct: false
            });
        });

        const totalRounds = 10;
        const problems = [];
        for (let i = 0; i < totalRounds; i++) problems.push(this.generateMathProblem('medium'));

        const gameState = {
            type: 'math-blitz',
            roomId: room.roomId,
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

        this.activeGames.set(room.roomId, gameState);
        return { action: 'broadcast', event: 'game-started', payload: gameState };
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-round': {
                game.players.forEach(p => { p.answered = false; p.correct = false; });
                game.phase = 'playing';
                game.roundStartTime = Date.now();
                game.roundWinner = null;
                return { action: 'broadcast', event: 'round-started', payload: { problem: game.currentProblem.display, round: game.currentRound + 1, totalRounds: game.totalRounds } };
            }
            case 'submit-answer': {
                if (game.phase !== 'playing') return { action: 'error', message: 'Round not active' };
                const player = game.players.find(p => p.userId === userId);
                if (!player) return { action: 'error', message: 'Player not found' };
                if (player.answered) return { action: 'error', message: 'Already answered' };
                
                player.answered = true;
                const isCorrect = parseInt(payload.answer) === game.currentProblem.answer;
                player.correct = isCorrect;
                
                if (isCorrect && !game.roundWinner) {
                    game.roundWinner = userId;
                    player.score += 100;
                    return { action: 'broadcast', event: 'answer-result', payload: { correct: true, isWinner: true, answer: game.currentProblem.answer, playerName: player.name, winnerId: userId } };
                }
                return { action: 'emit', event: 'answer-result', payload: { correct: isCorrect, isWinner: false, correctAnswer: game.currentProblem.answer } };
            }
            case 'get-results': {
                const winner = game.players.find(p => p.userId === game.roundWinner);
                const standings = [...game.players].sort((a, b) => b.score - a.score).map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));
                return { action: 'broadcast', event: 'round-results', payload: { correctAnswer: game.currentProblem.answer, problem: game.currentProblem.display, winner: winner ? { userId: winner.userId, name: winner.name } : null, standings, currentRound: game.currentRound + 1, totalRounds: game.totalRounds } };
            }
            case 'next-round': {
                game.currentRound++;
                if (game.currentRound >= game.totalRounds) {
                    game.phase = 'finished';
                    const finalRankings = [...game.players].sort((a, b) => b.score - a.score).map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));
                    return { action: 'broadcast', event: 'game-over', payload: { finished: true, rankings: finalRankings, winner: finalRankings[0] } };
                }
                game.currentProblem = game.problems[game.currentRound];
                game.phase = 'waiting';
                return { action: 'broadcast', event: 'next-round-ready', payload: { finished: false, nextRound: game.currentRound + 1 } };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }
}
module.exports = MathBlitzEngine;
