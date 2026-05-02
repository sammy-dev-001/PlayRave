class ConfessionRouletteEngine {
    constructor() {
        this.activeGames = new Map();
    }

    startGame(room) {
        const roomId = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;

        const players = hostParticipates
            ? room.players
            : room.players.filter(p => !p.isHost);

        const gameState = {
            type: 'confession-roulette',
            roomId,
            players: players.map(p => ({
                userId: p.userId,
                name: p.name,
                avatar: p.avatar,
                score: 0,
                confession: null,
                hasSubmitted: false,
                hasVoted: false,
                votes: [] // userIds of players who voted for this person
            })),
            confessions: [], // Array of { confession: string, authorId: string }
            currentConfessionIndex: 0,
            phase: 'submission', // submission, reveal, results, finished
            submissionTime: 120,
            votingTime: 30
        };

        this.activeGames.set(roomId, gameState);

        return {
            action: 'broadcast',
            event: 'game-started',
            data: {
                gameType: 'confession-roulette',
                gameState: this.getPublicState(gameState),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates: room.settings?.hostParticipates !== false
            }
        };

    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'submit-confession':
                return this.submitConfession(roomId, userId, payload.confession);
            case 'end-submission':
                return this.endConfessionSubmission(roomId);
            case 'submit-vote':
                return this.submitConfessionVote(roomId, userId, payload.votedPlayerId);
            case 'next-confession':
                return this.nextConfession(roomId);
            case 'get-state':
                return this.getState(roomId);
            case 'end-game':
                return this.endGame(roomId);

            default:
                return { action: 'error', message: 'Unknown event' };
        }
    }

    getState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        return {
            action: 'emit',
            event: 'game-state-sync',
            data: this.getPublicState(game)
        };
    }

    getPublicState(game) {
        return {
            type: game.type,
            phase: game.phase,
            players: game.players.map(p => ({
                userId: p.userId,
                name: p.name,
                avatar: p.avatar,
                score: p.score,
                hasSubmitted: p.hasSubmitted,
                hasVoted: p.hasVoted
            })),
            currentConfessionIndex: game.currentConfessionIndex,
            totalConfessions: game.confessions.length,
            currentConfession: game.phase !== 'submission' && game.confessions[game.currentConfessionIndex] 
                ? game.confessions[game.currentConfessionIndex].confession 
                : null
        };
    }

    submitConfession(roomId, userId, confession) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'submission') return { action: 'error', message: 'Not in submission phase' };

        const player = game.players.find(p => p.userId === userId);
        if (!player) return { action: 'error', message: 'Player not found' };
        if (player.hasSubmitted) return { action: 'error', message: 'Already submitted' };

        player.confession = confession;
        player.hasSubmitted = true;

        game.confessions.push({
            confession,
            authorId: userId
        });

        const submittedCount = game.players.filter(p => p.hasSubmitted).length;

        if (submittedCount >= game.players.length) {
            return this.endConfessionSubmission(roomId);
        }

        return {
            action: 'broadcast',
            event: 'confession-submitted',
            data: { submittedCount, totalPlayers: game.players.length }
        };
    }

    endConfessionSubmission(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.confessions = game.confessions.sort(() => 0.5 - Math.random());
        game.phase = 'reveal';
        game.currentConfessionIndex = 0;

        return {
            action: 'broadcast',
            event: 'confession-submission-ended',
            data: this.getPublicState(game)
        };
    }

    submitConfessionVote(roomId, voterId, votedPlayerId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'reveal') return { action: 'error', message: 'Not in reveal/voting phase' };

        const voter = game.players.find(p => p.userId === voterId);
        if (!voter) return { action: 'error', message: 'Voter not found' };
        if (voter.hasVoted) return { action: 'error', message: 'Already voted' };

        const votedPlayer = game.players.find(p => p.userId === votedPlayerId);
        if (!votedPlayer) return { action: 'error', message: 'Invalid vote target' };

        votedPlayer.votes.push(voterId);
        voter.hasVoted = true;

        const votedCount = game.players.filter(p => p.hasVoted).length;
        
        if (votedCount >= game.players.length) {
            return this.getConfessionResults(roomId);
        }

        return {
            action: 'broadcast',
            event: 'confession-vote-update',
            data: { votedCount, totalPlayers: game.players.length }
        };
    }

    getConfessionResults(roomId) {
        const game = this.activeGames.get(roomId);
        const currentConfession = game.confessions[game.currentConfessionIndex];
        const authorId = currentConfession.authorId;
        const author = game.players.find(p => p.userId === authorId);

        const correctGuessers = (author.votes || []).filter(voterId => voterId !== authorId);
        const fooledCount = game.players.length - correctGuessers.length - 1;

        correctGuessers.forEach(voterId => {
            const guesser = game.players.find(p => p.userId === voterId);
            if (guesser) guesser.score += 100;
        });

        if (author) {
            author.score += fooledCount * 50;
        }

        const scores = {};
        game.players.forEach(p => { scores[p.userId] = p.score; });

        const isAnonymous = correctGuessers.length <= (game.players.length / 2);
        
        game.phase = 'results';

        return {
            action: 'broadcast',
            event: 'confession-results',
            data: {
                confession: currentConfession.confession,
                author: isAnonymous ? null : authorId,
                authorId: authorId,
                correctGuessers,
                fooledCount,
                scores
            }
        };
    }

    nextConfession(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.players.forEach(p => {
            p.hasVoted = false;
            p.votes = [];
        });

        game.currentConfessionIndex++;

        if (game.currentConfessionIndex >= game.confessions.length) {
            game.phase = 'finished';
            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map(p => ({
                    userId: p.userId,
                    name: p.name,
                    score: p.score
                }));

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event: 'confession-game-finished',
                data: { finished: true, rankings: finalRankings, winner: finalRankings[0] }
            };
        }

        game.phase = 'reveal';
        return {
            action: 'broadcast',
            event: 'confession-next',
            data: this.getPublicState(game)
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return { action: 'game-ended', event: 'confession-ended', data: { message: 'Game ended by host' } };
    }
}


module.exports = new ConfessionRouletteEngine();
