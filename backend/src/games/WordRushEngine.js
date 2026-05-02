class WordRushEngine {
    constructor() {
        this.activeGames = new Map();
    }

    startGame(room) {
        const hostParticipates = room.settings?.hostParticipates !== false;
        const activePlayers = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            activePlayers.push(player.userId);
        });

        const gameState = {
            type: 'word-rush',
            roomId: room.roomId,
            currentRound: 0,
            currentLetter: null,
            roundStartTime: null,
            playerWords: {},
            activePlayers,
            eliminatedPlayers: [],
            status: 'WAITING',
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
                const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y'];
                const randomLetter = letters[Math.floor(Math.random() * letters.length)];
                game.currentLetter = randomLetter;
                game.roundStartTime = Date.now();
                game.playerWords = {};
                game.status = 'PLAYING';
                return {
                    action: 'broadcast',
                    event: 'round-started',
                    payload: {
                        letter: randomLetter,
                        roundStartTime: game.roundStartTime,
                        currentRound: game.currentRound,
                        activePlayers: game.activePlayers
                    }
                };
            }
            case 'submit-word': {
                if (!game.activePlayers.includes(userId)) return { action: 'error', message: 'Player not active' };
                const isValid = this.validateWord(payload.word, game.currentLetter);
                game.playerWords[userId] = {
                    word: payload.word.toUpperCase(),
                    submitTime: payload.submitTime,
                    isValid
                };
                return { action: 'emit', event: 'word-submitted', payload: { success: true, isValid } };
            }
            case 'get-results': {
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
                    } else if (submissions.length > 0) {
                        const randomIndex = Math.floor(Math.random() * submissions.length);
                        eliminated = [submissions[randomIndex].userId];
                    }
                } else if (validSubmissions.length === game.activePlayers.length) {
                    eliminated = [validSubmissions[validSubmissions.length - 1].userId];
                } else {
                    eliminated = invalidSubmissions.map(s => s.userId);
                }

                return {
                    action: 'broadcast',
                    event: 'round-results',
                    payload: {
                        currentRound: game.currentRound,
                        letter: game.currentLetter,
                        submissions,
                        eliminated,
                        remainingPlayers: game.activePlayers.length - eliminated.length
                    }
                };
            }
            case 'next-round': {
                const eliminated = payload.eliminated || [];
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
                    return { action: 'broadcast', event: 'game-over', payload: { finished: true, winner: game.activePlayers[0] || null } };
                }
                game.status = 'WAITING';
                return { action: 'broadcast', event: 'next-round-ready', payload: { finished: false } };
            }
            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }

    validateWord(word, letter) {
        if (!word || typeof word !== 'string') return false;
        const cleanWord = word.trim().toUpperCase();
        if (cleanWord.length < 3) return false;
        if (!cleanWord.startsWith(letter.toUpperCase())) return false;
        if (!/^[A-Z]+$/.test(cleanWord)) return false;
        return true;
    }
}
module.exports = WordRushEngine;
