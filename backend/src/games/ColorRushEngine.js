class ColorRushEngine {
    constructor() {
        this.activeGames = new Map();
    }

    generateColorChallenge() {
        const colors = [
            { name: 'RED', hex: '#ff3366' },
            { name: 'BLUE', hex: '#3366ff' },
            { name: 'GREEN', hex: '#33ff66' },
            { name: 'YELLOW', hex: '#ffff33' },
            { name: 'PURPLE', hex: '#9933ff' },
            { name: 'ORANGE', hex: '#ff9933' }
        ];
        const targetColor = colors[Math.floor(Math.random() * colors.length)];
        const displayColor = Math.random() > 0.5 ? colors[Math.floor(Math.random() * colors.length)] : targetColor;
        return { targetColorName: targetColor.name, displayColorHex: displayColor.hex, buttons: colors.map(c => ({ name: c.name, hex: c.hex })) };
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

        const totalRounds = 15;
        const challenges = [];
        for (let i = 0; i < totalRounds; i++) challenges.push(this.generateColorChallenge());

        const gameState = {
            type: 'color-rush',
            roomId: room.roomId,
            players,
            challenges,
            currentRound: 0,
            totalRounds,
            currentChallenge: challenges[0],
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
                return { action: 'broadcast', event: 'round-started', payload: { targetColorName: game.currentChallenge.targetColorName, displayColorHex: game.currentChallenge.displayColorHex, buttons: game.currentChallenge.buttons, round: game.currentRound + 1, totalRounds: game.totalRounds } };
            }
            case 'submit-answer': {
                if (game.phase !== 'playing') return { action: 'error', message: 'Round not active' };
                const player = game.players.find(p => p.userId === userId);
                if (!player) return { action: 'error', message: 'Player not found' };
                if (player.answered) return { action: 'error', message: 'Already answered' };
                
                player.answered = true;
                const isCorrect = payload.colorName === game.currentChallenge.targetColorName;
                player.correct = isCorrect;
                
                if (isCorrect && !game.roundWinner) {
                    game.roundWinner = userId;
                    player.score += 100;
                    return { action: 'broadcast', event: 'answer-result', payload: { correct: true, isWinner: true, playerName: player.name, winnerId: userId } };
                } else if (!isCorrect) {
                    player.score = Math.max(0, player.score - 25);
                }
                return { action: 'emit', event: 'answer-result', payload: { correct: isCorrect, isWinner: false, correctColor: game.currentChallenge.targetColorName } };
            }
            case 'get-results': {
                const winner = game.players.find(p => p.userId === game.roundWinner);
                const standings = [...game.players].sort((a, b) => b.score - a.score).map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));
                return { action: 'broadcast', event: 'round-results', payload: { correctColor: game.currentChallenge.targetColorName, winner: winner ? { userId: winner.userId, name: winner.name } : null, standings, currentRound: game.currentRound + 1, totalRounds: game.totalRounds } };
            }
            case 'next-round': {
                game.currentRound++;
                if (game.currentRound >= game.totalRounds) {
                    game.phase = 'finished';
                    const finalRankings = [...game.players].sort((a, b) => b.score - a.score).map((p, i) => ({ userId: p.userId, name: p.name, score: p.score, position: i + 1 }));
                    return { action: 'broadcast', event: 'game-over', payload: { finished: true, rankings: finalRankings, winner: finalRankings[0] } };
                }
                game.currentChallenge = game.challenges[game.currentRound];
                game.phase = 'waiting';
                return { action: 'broadcast', event: 'next-round-ready', payload: { finished: false, nextRound: game.currentRound + 1 } };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }
}
module.exports = ColorRushEngine;
