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

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'confession-roulette',
                type: 'confession-roulette',
                gameState: this.getPublicState(gameState),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates: room.settings?.hostParticipates !== false
            }
        }));

        return { action: 'multiple', instructions };

    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'confession-start':
                return this.startConfessionSubmission(roomId);
            case 'confession-submit':
            case 'submit-confession':
                return this.submitConfession(roomId, userId, payload.confession);
            case 'confession-end-submission':
            case 'end-submission':
                return this.endConfessionSubmission(roomId);
            case 'confession-start-voting':
            case 'start-voting':
                return this.startVoting(roomId);
            case 'confession-vote':
            case 'submit-vote':
                return this.submitConfessionVote(roomId, userId, payload.votedFor || payload.votedPlayerId);
            case 'confession-force-results':
                return this.getConfessionResults(roomId);
            case 'confession-next':
            case 'next-confession':
                return this.nextConfession(roomId);
            case 'confession-reveal-author':
            case 'reveal-author':
                return this.revealAuthor(roomId, userId);
            case 'get-state':
                return this.getState(roomId);
            case 'end-game':
                return this.endGame(roomId);

            default:
                return { action: 'error', message: `Unknown event: ${eventName}` };
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

    startConfessionSubmission(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'submission';
        
        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event: 'confession-phase-changed',
                    data: { phase: 'submission', seconds: game.submissionTime }
                },
                {
                    action: 'schedule',
                    eventToTrigger: 'confession-end-submission',
                    delay: game.submissionTime * 1000,
                    data: {}
                }
            ]
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

        if (game.confessions.length === 0) {
            return { action: 'broadcast', event: 'error', data: { message: 'No confessions were submitted!' } };
        }

        game.confessions = game.confessions.sort(() => 0.5 - Math.random());
        game.phase = 'reveal';
        game.currentConfessionIndex = 0;

        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event: 'confession-phase-changed',
                    data: { phase: 'reveal', totalConfessions: game.confessions.length, seconds: 15 }
                },
                this.getRevealInstruction(game)
            ]
        };
    }

    getRevealInstruction(game) {
        const currentConfession = game.confessions[game.currentConfessionIndex];
        return {
            action: 'broadcast',
            event: 'confession-reveal',
            data: {
                confession: currentConfession.confession,
                index: game.currentConfessionIndex,
                total: game.confessions.length,
                seconds: 15
            }
        };
    }

    startVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'voting';
        game.players.forEach(p => p.hasVoted = false);

        return {
            action: 'multiple',
            instructions: [
                {
                    action: 'broadcast',
                    event: 'confession-phase-changed',
                    data: { phase: 'voting', seconds: game.votingTime }
                },
                {
                    action: 'schedule',
                    eventToTrigger: 'confession-force-results',
                    delay: game.votingTime * 1000,
                    data: {}
                }
            ]
        };
    }

    submitConfessionVote(roomId, voterId, votedPlayerName) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'voting' && game.phase !== 'reveal') return { action: 'error', message: 'Not in voting phase' };

        const voter = game.players.find(p => p.userId === voterId || p.name === voterId);
        if (!voter) return { action: 'error', message: 'Voter not found' };
        if (voter.hasVoted) return { action: 'error', message: 'Already voted' };

        const votedPlayer = game.players.find(p => p.name === votedPlayerName || p.userId === votedPlayerName);
        if (!votedPlayer) return { action: 'error', message: 'Invalid vote target' };

        votedPlayer.votes = votedPlayer.votes || [];
        votedPlayer.votes.push(voter.userId);
        voter.hasVoted = true;

        const votedCount = game.players.filter(p => p.hasVoted).length;
        
        if (votedCount >= game.players.length) {
            return this.getConfessionResults(roomId);
        }

        return {
            action: 'broadcast',
            event: 'confession-votes-update',
            data: { votedCount, totalPlayers: game.players.length }
        };
    }

    getConfessionResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        if (game.phase === 'results') return { action: 'none' }; // Prevent double calculation if called by timer and vote completion

        const currentConfession = game.confessions[game.currentConfessionIndex];
        const authorId = currentConfession.authorId;
        const author = game.players.find(p => p.userId === authorId);

        const correctGuessers = (author?.votes || []).filter(voterId => voterId !== authorId);
        const correctGuesserNames = correctGuessers.map(id => {
            const p = game.players.find(pl => pl.userId === id);
            return p ? p.name : 'Unknown';
        });

        const fooledCount = game.players.length - correctGuessers.length - 1;

        correctGuessers.forEach(voterId => {
            const guesser = game.players.find(p => p.userId === voterId);
            if (guesser) guesser.score += 100;
        });

        if (author) {
            author.score += fooledCount * 50;
        }

        const scores = {};
        game.players.forEach(p => { scores[p.name] = p.score; });

        const isAnonymous = correctGuessers.length <= (game.players.length / 2);
        
        game.phase = 'results';

        const instructions = [
            {
                action: 'broadcast',
                event: 'confession-results',
                data: {
                    confession: currentConfession.confession,
                    author: isAnonymous ? 'Unknown' : author.name,
                    authorId: authorId,
                    correctGuessers: correctGuesserNames,
                    fooledCount,
                    scores
                }
            },
            {
                action: 'emit',
                targetId: authorId,
                event: 'confession-you-are-author',
                data: { authorId }
            }
        ];

        return { action: 'multiple', instructions };
    }

    revealAuthor(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        
        const author = game.players.find(p => p.userId === userId);
        if (!author) return { action: 'error', message: 'Author not found' };

        return {
            action: 'broadcast',
            event: 'confession-author-revealed',
            data: { authorName: author.name }
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
