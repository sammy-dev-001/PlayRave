// ============================================================================
// ColorRushEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class ColorRushEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        if (eventName === 'get-results') return this.getRoundResults(roomId);

        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'color-rush-start-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'color-rush-answer':
            case 'submit-answer':
                return this.submitAnswer(roomId, userId, payload.colorName);
            case 'color-rush-next-round':
            case 'next-round':
                return this.nextRound(roomId);
            case 'color-rush-end-game':
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Color Rush event: ${eventName}` };
        }
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
        // displayColor is the color of the text (might not match the word)
        const displayColor = Math.random() > 0.5 ? colors[Math.floor(Math.random() * colors.length)] : targetColor;
        
        return { 
            targetColorName: targetColor.name, 
            displayColorHex: displayColor.hex, 
            buttons: [...colors].sort(() => Math.random() - 0.5) // Shuffle buttons
        };
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

        const totalRounds = 15;
        const challenges = [];
        for (let i = 0; i < totalRounds; i++) challenges.push(this.generateColorChallenge());

        const game = {
            type: 'color-rush',
            roomId,
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

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'color-rush',
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
        game.currentChallenge = game.challenges[game.currentRound];

        return { 
            action: 'broadcast', 
            event: 'color-rush-round-start', 
            data: { 
                targetColorName: game.currentChallenge.targetColorName, 
                displayColorHex: game.currentChallenge.displayColorHex, 
                buttons: game.currentChallenge.buttons, 
                round: game.currentRound + 1, 
                totalRounds: game.totalRounds 
            } 
        };
    }

    submitAnswer(roomId, userId, colorName) {
        const game = this.activeGames.get(roomId);
        if (!game || game.phase !== 'playing') return { action: 'error', message: 'Round not active' };

        const player = game.players.find(p => p.userId === userId);
        if (!player || player.answered) return { action: 'error', message: 'Invalid submission' };

        player.answered = true;
        const isCorrect = colorName === game.currentChallenge.targetColorName;
        player.correct = isCorrect;

        const instructions = [];

        if (isCorrect && !game.roundWinner) {
            game.roundWinner = userId;
            player.score += 100;
            
            instructions.push({
                action: 'broadcast',
                event: 'color-rush-round-won',
                data: { winnerName: player.name, winnerId: userId }
            });

            instructions.push({
                action: 'emit',
                targetId: userId,
                event: 'color-rush-answer-result',
                data: { correct: true, isWinner: true }
            });

            instructions.push({
                action: 'schedule',
                delay: 1500,
                roomId,
                eventToTrigger: 'get-results'
            });
        } else {
            if (!isCorrect) {
                player.score = Math.max(0, player.score - 25);
            }
            instructions.push({
                action: 'emit',
                targetId: userId,
                event: 'color-rush-answer-result',
                data: { correct: isCorrect, isWinner: false }
            });
        }

        return { action: 'multiple', instructions };
    }

    getRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';
        const standings = [...game.players]
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
            event: 'color-rush-round-results', 
            data: { 
                standings, 
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
                event: 'color-rush-game-finished', 
                data: { finished: true, rankings, winner: rankings[0] } 
            };
        }

        game.phase = 'waiting';
        return { 
            action: 'broadcast', 
            event: 'color-rush-next-round-ready', 
            data: { finished: false, nextRound: game.currentRound + 1 } 
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'color-rush-game-ended', data: { message: 'Game ended' } };
    }
}

module.exports = new ColorRushEngine();
