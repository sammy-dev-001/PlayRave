// ============================================================================
// WordRushEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

class WordRushEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        switch (eventName) {
            case 'start-word-rush-round':
            case 'start-round':
                return this.startRound(roomId);
            case 'submit-word-rush-word':
            case 'submit-word':
                return this.submitWord(roomId, userId, payload.word);
            case 'show-word-rush-results':
            case 'get-results':
                return this.getResults(roomId);
            case 'next-round':
                return this.nextRound(roomId, payload.eliminated);
            case 'end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Word Rush event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const hostParticipates = options.hostParticipates !== false;
        const roomId = room.id;
        const activePlayers = [];
        
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            activePlayers.push(player.userId);
        });

        const game = {
            type: 'word-rush',
            roomId,
            currentRound: 0,
            currentLetter: null,
            roundStartTime: null,
            playerWords: {}, // { userId: { word, submitTime, isValid } }
            activePlayers,
            eliminatedPlayers: [],
            status: 'WAITING',
            hostParticipates
        };

        this.activeGames.set(roomId, game);
        
        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'word-rush',
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
            currentRound: game.currentRound,
            status: game.status,
            activePlayers: game.activePlayers
        };
    }

    startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y'];
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        
        game.currentLetter = randomLetter;
        game.roundStartTime = Date.now();
        game.playerWords = {};
        game.status = 'PLAYING';

        return {
            action: 'broadcast',
            event: 'word-rush-round-started',
            data: {
                letter: randomLetter,
                roundStartTime: game.roundStartTime,
                currentRound: game.currentRound,
                activePlayers: game.activePlayers
            }
        };
    }

    submitWord(roomId, userId, word) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        if (!game.activePlayers.includes(userId)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player not active' } };
        }

        const isValid = this.validateWord(word, game.currentLetter);
        const submitTime = Date.now();

        game.playerWords[userId] = {
            word: (word || '').toUpperCase(),
            submitTime,
            isValid
        };

        return { 
            action: 'emit', 
            targetId: userId, 
            event: 'word-submitted', 
            data: { success: true, isValid } 
        };
    }

    getResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        const submissions = [];
        game.activePlayers.forEach(pid => {
            const submission = game.playerWords[pid];
            if (submission) {
                submissions.push({
                    userId: pid,
                    word: submission.word,
                    submitTime: submission.submitTime,
                    isValid: submission.isValid,
                    reactionTime: submission.submitTime - game.roundStartTime
                });
            } else {
                submissions.push({ userId: pid, word: null, submitTime: null, isValid: false, reactionTime: null });
            }
        });

        submissions.sort((a, b) => {
            if (a.submitTime === null) return 1;
            if (b.submitTime === null) return -1;
            return a.submitTime - b.submitTime;
        });
        
        const validSubmissions = submissions.filter(s => s.isValid);
        const invalidSubmissions = submissions.filter(s => !s.isValid);
        let eliminated = [];
        
        if (submissions.length === 0) {
            eliminated = [];
        } else if (validSubmissions.length === 0) {
            const submittedButInvalid = submissions.filter(s => s.submitTime !== null);
            if (submittedButInvalid.length > 0) {
                eliminated = [submittedButInvalid[submittedButInvalid.length - 1].userId];
            } else if (game.activePlayers.length > 0) {
                const randomIndex = Math.floor(Math.random() * game.activePlayers.length);
                eliminated = [game.activePlayers[randomIndex]];
            }
        } else if (validSubmissions.length === game.activePlayers.length) {
            eliminated = [validSubmissions[validSubmissions.length - 1].userId];
        } else {
            eliminated = invalidSubmissions.map(s => s.userId);
        }

        return {
            action: 'broadcast',
            event: 'word-rush-results',
            data: {
                currentRound: game.currentRound,
                letter: game.currentLetter,
                submissions,
                eliminated,
                remainingPlayers: game.activePlayers.length - eliminated.length
            }
        };
    }

    nextRound(roomId, eliminatedFromClient = []) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'broadcast', event: 'error', data: { message: 'Game not found' } };

        // Use eliminated list from results calculation
        const eliminated = eliminatedFromClient || [];
        eliminated.forEach(pid => {
            const index = game.activePlayers.indexOf(pid);
            if (index > -1) {
                game.activePlayers.splice(index, 1);
                game.eliminatedPlayers.push(pid);
            }
        });

        game.currentRound++;

        if (game.activePlayers.length <= 1) {
            game.status = 'FINISHED';
            const winnerId = game.activePlayers[0] || null;
            return { 
                action: 'broadcast', 
                event: 'word-rush-winner', 
                data: { finished: true, winner: winnerId } 
            };
        }

        game.status = 'WAITING';
        return { 
            action: 'broadcast', 
            event: 'word-rush-ready-for-next', 
            data: { finished: false } 
        };
    }

    validateWord(word, letter) {
        if (!word || typeof word !== 'string') return false;
        const cleanWord = word.trim().toUpperCase();
        if (cleanWord.length < 3) return false;
        if (!cleanWord.startsWith(letter.toUpperCase())) return false;
        if (!/^[A-Z]+$/.test(cleanWord)) return false;
        return true;
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'broadcast', event: 'game-ended', data: { message: 'Game ended by host' } };
    }
}

module.exports = new WordRushEngine();
