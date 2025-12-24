import ProfileService from './ProfileService';

// Game recommendation service - provides personalized game suggestions
const RecommendationService = {
    // All available games with metadata
    games: {
        'trivia': {
            name: 'Quick Trivia',
            category: 'knowledge',
            energy: 'medium',
            players: { min: 2, ideal: 4 },
            duration: 10
        },
        'myth-or-fact': {
            name: 'Myth or Fact',
            category: 'knowledge',
            energy: 'low',
            players: { min: 2, ideal: 3 },
            duration: 8
        },
        'whos-most-likely': {
            name: "Who's Most Likely",
            category: 'social',
            energy: 'medium',
            players: { min: 3, ideal: 6 },
            duration: 15
        },
        'neon-tap': {
            name: 'Neon Tap Frenzy',
            category: 'action',
            energy: 'high',
            players: { min: 1, ideal: 2 },
            duration: 5
        },
        'word-rush': {
            name: 'Word Rush',
            category: 'word',
            energy: 'high',
            players: { min: 2, ideal: 4 },
            duration: 5
        },
        'truth-or-dare': {
            name: 'Truth or Dare',
            category: 'social',
            energy: 'medium',
            players: { min: 2, ideal: 5 },
            duration: 20
        },
        'never-have-i': {
            name: 'Never Have I Ever',
            category: 'social',
            energy: 'low',
            players: { min: 3, ideal: 6 },
            duration: 15
        },
        'rapid-fire': {
            name: 'Rapid Fire',
            category: 'knowledge',
            energy: 'high',
            players: { min: 2, ideal: 4 },
            duration: 10
        },
        'caption-this': {
            name: 'Caption This',
            category: 'creative',
            energy: 'medium',
            players: { min: 3, ideal: 5 },
            duration: 15
        },
        'speed-categories': {
            name: 'Speed Categories',
            category: 'knowledge',
            energy: 'high',
            players: { min: 2, ideal: 4 },
            duration: 10
        },
        'auction-bluff': {
            name: 'Auction Bluff',
            category: 'strategy',
            energy: 'medium',
            players: { min: 2, ideal: 4 },
            duration: 15
        },
        'memory-chain': {
            name: 'Memory Chain',
            category: 'memory',
            energy: 'medium',
            players: { min: 2, ideal: 4 },
            duration: 10
        },
    },

    // Get personalized game recommendations
    async getRecommendations(playerCount = 4, context = {}) {
        const stats = await ProfileService.getStats();
        const recommendations = [];

        // Calculate scores for each game
        for (const [gameId, game] of Object.entries(this.games)) {
            let score = 50; // Base score

            // Factor 1: Player count suitability (0-30 points)
            const playerScore = this.calculatePlayerScore(playerCount, game.players);
            score += playerScore;

            // Factor 2: Play history preference (0-20 points)
            const historyScore = this.calculateHistoryScore(gameId, stats);
            score += historyScore;

            // Factor 3: Context matching (0-20 points)
            if (context.energy && context.energy === game.energy) {
                score += 15;
            }
            if (context.category && context.category === game.category) {
                score += 15;
            }

            // Factor 4: Variety bonus - prefer games not recently played
            if (!stats.gameStats?.[gameId]) {
                score += 10; // Haven't tried this game yet
            }

            // Factor 5: Win rate consideration - recommend games they're good at
            const gameStat = stats.gameStats?.[gameId];
            if (gameStat && gameStat.played >= 3) {
                const winRate = gameStat.won / gameStat.played;
                score += winRate * 10;
            }

            recommendations.push({
                gameId,
                ...game,
                score: Math.min(100, Math.round(score)),
                reason: this.generateReason(gameId, playerCount, stats, game)
            });
        }

        // Sort by score and return top recommendations
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    },

    // Calculate how well the game fits the player count
    calculatePlayerScore(playerCount, playerReq) {
        if (playerCount === playerReq.ideal) return 30;
        if (playerCount >= playerReq.min && playerCount <= playerReq.ideal + 2) return 20;
        if (playerCount >= playerReq.min) return 10;
        return 0;
    },

    // Calculate score based on play history
    calculateHistoryScore(gameId, stats) {
        const gameStat = stats.gameStats?.[gameId];
        if (!gameStat) return 5; // Small bonus for trying new games

        // Games they play often and win are preferred
        const playFrequency = Math.min(gameStat.played / 10, 1) * 10;
        const winBonus = gameStat.won > 0 ? 5 : 0;
        return playFrequency + winBonus;
    },

    // Generate a human-readable reason for the recommendation
    generateReason(gameId, playerCount, stats, game) {
        const gameStat = stats.gameStats?.[gameId];

        // Check various conditions
        if (!gameStat) {
            return "Try something new!";
        }
        if (gameStat.won > 0 && gameStat.won / gameStat.played > 0.5) {
            return "You're great at this one!";
        }
        if (playerCount === game.players.ideal) {
            return `Perfect for ${playerCount} players`;
        }
        if (gameId === stats.favoriteGame) {
            return "Your favorite!";
        }
        if (gameStat.played >= 5) {
            return "A fan favorite";
        }
        return "Popular choice";
    },

    // Get quick game suggestion based on mood
    getQuickSuggestion(mood) {
        const moodMap = {
            'competitive': ['neon-tap', 'word-rush', 'trivia', 'speed-categories'],
            'chill': ['myth-or-fact', 'never-have-i', 'caption-this'],
            'social': ['truth-or-dare', 'whos-most-likely', 'never-have-i'],
            'creative': ['caption-this', 'auction-bluff'],
            'fast': ['neon-tap', 'word-rush', 'rapid-fire', 'speed-categories'],
            'strategic': ['auction-bluff', 'memory-chain', 'trivia']
        };

        const suggestions = moodMap[mood] || Object.keys(this.games);
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        const gameId = suggestions[randomIndex];

        return {
            gameId,
            ...this.games[gameId]
        };
    },

    // Get games suitable for a specific player count
    getGamesForPlayerCount(count) {
        return Object.entries(this.games)
            .filter(([, game]) => count >= game.players.min)
            .map(([gameId, game]) => ({
                gameId,
                ...game,
                isIdeal: count === game.players.ideal
            }))
            .sort((a, b) => b.isIdeal - a.isIdeal);
    }
};

export default RecommendationService;
