const { getRandomQuestions } = require('../data/triviaQuestions');
const { getRandomStatements } = require('../data/mythOrFactStatements');
const { getRandomPrompts } = require('../data/whosMostLikelyPrompts');
const { getRandomTruth, getRandomDare } = require('../data/truthOrDarePrompts');

class GameManager {
    constructor() {
        this.activeGames = new Map(); // roomId -> gameState
    }

    startTriviaGame(roomId, room, hostParticipates = true, category = 'All') {
        let questions;

        // Use custom questions if available and sufficient
        if (room.customQuestions && room.customQuestions.length >= 5) {
            console.log('Using custom questions for game');
            questions = room.customQuestions.slice(0, 5);
        } else {
            // Use regular questions with category filter
            console.log('Using regular questions with category:', category);
            questions = getRandomQuestions(5, category);
        }

        const gameState = {
            type: 'trivia',
            roomId,
            questions,
            currentQuestionIndex: 0,
            playerAnswers: {}, // { playerId: { questionIndex: answerIndex } }
            scores: {}, // { playerId: score }
            questionStartTime: Date.now(),
            status: 'PLAYING', // PLAYING, RESULTS, FINISHED
            hostParticipates,
            category,
            usingCustomQuestions: room.customQuestions && room.customQuestions.length >= 5
        };

        // Initialize scores only for participating players
        room.players.forEach(player => {
            // If host doesn't participate, skip initializing their score
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.scores[player.id] = 0;
        });

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getCurrentQuestion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const question = game.questions[game.currentQuestionIndex];
        // Don't send the correct answer to clients
        return {
            questionIndex: game.currentQuestionIndex,
            totalQuestions: game.questions.length,
            question: question.question,
            options: question.options,
            category: question.category
        };
    }

    submitAnswer(roomId, playerId, answerIndex) {
        const game = this.activeGames.get(roomId);
        if (!game) return { error: 'Game not found' };

        // Only allow players who are participating (have scores initialized) to submit
        if (!(playerId in game.scores)) {
            console.log('Player', playerId, 'is not participating, ignoring answer');
            return { error: 'Player is not participating' };
        }

        const questionIndex = game.currentQuestionIndex;

        // Store the answer
        if (!game.playerAnswers[playerId]) {
            game.playerAnswers[playerId] = {};
        }
        game.playerAnswers[playerId][questionIndex] = answerIndex;

        // Check if answer is correct and update score
        const correctAnswer = game.questions[questionIndex].correctAnswer;
        if (answerIndex === correctAnswer) {
            game.scores[playerId] += 10;
        }

        return { success: true };
    }

    getQuestionResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const currentQuestion = game.questions[game.currentQuestionIndex];
        const results = {
            questionIndex: game.currentQuestionIndex,
            question: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            correctOption: currentQuestion.options[currentQuestion.correctAnswer],
            isLastQuestion: game.currentQuestionIndex === game.questions.length - 1,
            playerResults: []
        };

        // Get each player's answer for this question
        Object.keys(game.scores).forEach(playerId => {
            const playerAnswer = game.playerAnswers[playerId]?.[game.currentQuestionIndex];
            results.playerResults.push({
                playerId,
                answer: playerAnswer,
                isCorrect: playerAnswer === currentQuestion.correctAnswer,
                currentScore: game.scores[playerId]
            });
        });

        return results;
    }

    nextQuestion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { error: 'Game not found' };

        game.currentQuestionIndex++;
        game.questionStartTime = Date.now();

        if (game.currentQuestionIndex >= game.questions.length) {
            game.status = 'FINISHED';
            return { finished: true, finalScores: this.getFinalScores(roomId) };
        }

        return { finished: false, nextQuestion: this.getCurrentQuestion(roomId) };
    }

    getFinalScores(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        let scores;

        // For Who's Most Likely To, use total votes instead of scores
        if (game.type === 'whos-most-likely') {
            scores = Object.entries(game.totalVotes || {}).map(([playerId, votes]) => ({
                playerId,
                score: votes // Use votes as score for consistency
            }));
        } else if (game.type === 'neon-tap') {
            // For Neon Tap, calculate average reaction time
            scores = Object.entries(game.totalReactionTimes || {}).map(([playerId, totalTime]) => {
                const tapsCount = Object.keys(game.playerTaps[playerId] || {}).length;
                const avgTime = tapsCount > 0 ? Math.round(totalTime / tapsCount) : 999999;
                return {
                    playerId,
                    score: avgTime // Lower is better
                };
            });
            // Sort by score ascending (fastest first) for neon-tap
            scores.sort((a, b) => a.score - b.score);
            return scores;
        } else {
            scores = Object.entries(game.scores).map(([playerId, score]) => ({
                playerId,
                score
            }));
        }

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        return scores;
    }

    // Myth or Fact Game Methods
    startMythOrFactGame(roomId, room, hostParticipates = true) {
        const statements = getRandomStatements(5);

        const gameState = {
            type: 'myth-or-fact',
            roomId,
            statements,
            currentStatementIndex: 0,
            playerAnswers: {}, // { playerId: { statementIndex: boolean } }
            scores: {}, // { playerId: score }
            statementStartTime: Date.now(),
            status: 'PLAYING',
            hostParticipates
        };

        // Initialize scores only for participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.scores[player.id] = 0;
        });

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getCurrentStatement(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'myth-or-fact') return null;

        const statement = game.statements[game.currentStatementIndex];
        return {
            statement: statement.statement,
            category: statement.category,
            statementIndex: game.currentStatementIndex,
            totalStatements: game.statements.length
        };
    }

    submitMythOrFactAnswer(roomId, playerId, answer) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'myth-or-fact') return { error: 'Game not found' };

        // Only allow players with initialized scores to submit
        if (!(playerId in game.scores)) {
            console.log('Player', playerId, 'is not participating, ignoring answer');
            return { error: 'Player is not participating' };
        }

        const statementIndex = game.currentStatementIndex;

        // Store the answer
        if (!game.playerAnswers[playerId]) {
            game.playerAnswers[playerId] = {};
        }
        game.playerAnswers[playerId][statementIndex] = answer;

        // Check if answer is correct and update score
        const correctAnswer = game.statements[statementIndex].answer;
        if (answer === correctAnswer) {
            game.scores[playerId] += 10;
        }

        return { success: true };
    }

    getMythOrFactResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'myth-or-fact') return null;

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

        // Get each player's answer for this statement
        Object.keys(game.scores).forEach(playerId => {
            const playerAnswer = game.playerAnswers[playerId]?.[game.currentStatementIndex];
            results.playerResults.push({
                playerId,
                answer: playerAnswer,
                isCorrect: playerAnswer === currentStatement.answer,
                currentScore: game.scores[playerId]
            });
        });

        return results;
    }

    nextMythOrFactStatement(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'myth-or-fact') return null;

        game.currentStatementIndex++;

        if (game.currentStatementIndex >= game.statements.length) {
            game.status = 'FINISHED';
            return { finished: true };
        }

        game.statementStartTime = Date.now();
        return {
            finished: false,
            statement: this.getCurrentStatement(roomId)
        };
    }

    // Who's Most Likely To Game Methods
    startWhosMostLikelyGame(roomId, room, hostParticipates = true) {
        const prompts = getRandomPrompts(10);

        const gameState = {
            type: 'whos-most-likely',
            roomId,
            prompts,
            currentPromptIndex: 0,
            playerVotes: {}, // { playerId: { promptIndex: votedForPlayerId } }
            totalVotes: {}, // { playerId: totalVoteCount }
            promptStartTime: Date.now(),
            status: 'PLAYING',
            hostParticipates
        };

        // Initialize total votes for all participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.totalVotes[player.id] = 0;
        });

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getCurrentPrompt(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return null;

        const prompt = game.prompts[game.currentPromptIndex];
        return {
            prompt: prompt.prompt,
            category: prompt.category,
            promptIndex: game.currentPromptIndex,
            totalPrompts: game.prompts.length
        };
    }

    submitWhosMostLikelyVote(roomId, playerId, votedForPlayerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return { error: 'Game not found' };

        // Only allow players with initialized votes to submit
        if (!(playerId in game.totalVotes)) {
            console.log('Player', playerId, 'is not participating, ignoring vote');
            return { error: 'Player is not participating' };
        }

        const promptIndex = game.currentPromptIndex;

        // Store the vote
        if (!game.playerVotes[playerId]) {
            game.playerVotes[playerId] = {};
        }
        game.playerVotes[playerId][promptIndex] = votedForPlayerId;

        return { success: true };
    }

    getWhosMostLikelyResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return null;

        const currentPrompt = game.prompts[game.currentPromptIndex];

        // Count votes for this prompt
        const voteCount = {};
        Object.keys(game.totalVotes).forEach(playerId => {
            voteCount[playerId] = 0;
        });

        // Tally votes for current prompt
        Object.keys(game.playerVotes).forEach(voterId => {
            const votedFor = game.playerVotes[voterId]?.[game.currentPromptIndex];
            if (votedFor && votedFor in voteCount) {
                voteCount[votedFor]++;
            }
        });

        // Update total votes ONLY if this prompt hasn't been tallied yet
        if (!game.talliedPrompts) {
            game.talliedPrompts = new Set();
        }

        if (!game.talliedPrompts.has(game.currentPromptIndex)) {
            Object.keys(voteCount).forEach(playerId => {
                game.totalVotes[playerId] += voteCount[playerId];
            });
            game.talliedPrompts.add(game.currentPromptIndex);
        }

        // Find max votes for this prompt
        const maxVotes = Math.max(...Object.values(voteCount));

        const results = {
            promptIndex: game.currentPromptIndex,
            prompt: currentPrompt.prompt,
            voteResults: Object.keys(voteCount).map(playerId => ({
                playerId,
                votes: voteCount[playerId],
                totalVotes: game.totalVotes[playerId],
                isWinner: voteCount[playerId] === maxVotes && maxVotes > 0
            })).sort((a, b) => b.votes - a.votes), // Sort by votes descending
            isLastPrompt: game.currentPromptIndex === game.prompts.length - 1
        };

        return results;
    }

    nextWhosMostLikelyPrompt(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return null;

        game.currentPromptIndex++;

        if (game.currentPromptIndex >= game.prompts.length) {
            game.status = 'FINISHED';
            return { finished: true };
        }

        game.promptStartTime = Date.now();
        return {
            finished: false,
            prompt: this.getCurrentPrompt(roomId)
        };
    }

    // Neon Tap Frenzy Game Methods
    startNeonTapGame(roomId, room, hostParticipates = true) {
        const gameState = {
            type: 'neon-tap',
            roomId,
            currentRound: 0,
            totalRounds: 10,
            circlePosition: null,
            roundStartTime: null,
            playerTaps: {}, // { playerId: { round: reactionTime } }
            totalReactionTimes: {}, // { playerId: totalMs }
            roundsWon: {}, // { playerId: winsCount }
            status: 'WAITING',
            hostParticipates
        };

        // Initialize tracking for participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            gameState.playerTaps[player.id] = {};
            gameState.totalReactionTimes[player.id] = 0;
            gameState.roundsWon[player.id] = 0;
        });

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startNewRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'neon-tap') return null;

        // Generate random position (avoid edges - 10% margin)
        const circlePosition = {
            x: 0.1 + Math.random() * 0.8, // 10% to 90%
            y: 0.15 + Math.random() * 0.7  // 15% to 85% (accounting for UI)
        };

        game.circlePosition = circlePosition;
        game.roundStartTime = Date.now();
        game.status = 'PLAYING';

        return {
            circlePosition,
            roundStartTime: game.roundStartTime,
            currentRound: game.currentRound,
            totalRounds: game.totalRounds
        };
    }

    submitTap(roomId, playerId, reactionTime) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'neon-tap') return { error: 'Game not found' };

        // Only allow participating players
        if (!(playerId in game.playerTaps)) {
            return { error: 'Player is not participating' };
        }

        const currentRound = game.currentRound;

        // Record tap if not already tapped this round
        if (game.playerTaps[playerId][currentRound] === undefined) {
            game.playerTaps[playerId][currentRound] = reactionTime;
            game.totalReactionTimes[playerId] += reactionTime;
        }

        return { success: true };
    }

    getNeonTapResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'neon-tap') return null;

        const currentRound = game.currentRound;

        // Get all taps for this round
        const roundTaps = [];
        Object.keys(game.playerTaps).forEach(playerId => {
            const reactionTime = game.playerTaps[playerId][currentRound];
            if (reactionTime !== undefined) {
                roundTaps.push({
                    playerId,
                    reactionTime,
                    roundsWon: game.roundsWon[playerId]
                });
            } else {
                roundTaps.push({
                    playerId,
                    reactionTime: null, // Didn't tap
                    roundsWon: game.roundsWon[playerId]
                });
            }
        });

        // Sort by reaction time (fastest first, nulls last)
        roundTaps.sort((a, b) => {
            if (a.reactionTime === null) return 1;
            if (b.reactionTime === null) return -1;
            return a.reactionTime - b.reactionTime;
        });

        // Winner is fastest tap
        const winner = roundTaps[0].reactionTime !== null ? roundTaps[0] : null;
        if (winner) {
            game.roundsWon[winner.playerId]++;
        }

        return {
            currentRound,
            totalRounds: game.totalRounds,
            winner: winner ? winner.playerId : null,
            roundTaps,
            isLastRound: currentRound === game.totalRounds - 1
        };
    }

    nextNeonTapRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'neon-tap') return null;

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.status = 'FINISHED';
            return { finished: true };
        }

        game.status = 'WAITING';
        return { finished: false };
    }

    // Word Rush Game Methods
    startWordRushGame(roomId, room, hostParticipates = true) {
        const activePlayers = [];

        // Add participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            activePlayers.push(player.id);
        });

        const gameState = {
            type: 'word-rush',
            roomId,
            currentRound: 0,
            currentLetter: null,
            roundStartTime: null,
            playerWords: {}, // { playerId: { word, submitTime, isValid } }
            activePlayers, // Players still in game
            eliminatedPlayers: [], // Players eliminated
            status: 'WAITING',
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startWordRushRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'word-rush') return null;

        // Common letters (excluding Q, X, Z)
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y'];
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];

        game.currentLetter = randomLetter;
        game.roundStartTime = Date.now();
        game.playerWords = {};
        game.status = 'PLAYING';

        return {
            letter: randomLetter,
            roundStartTime: game.roundStartTime,
            currentRound: game.currentRound,
            activePlayers: game.activePlayers
        };
    }

    submitWord(roomId, playerId, word, submitTime) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'word-rush') return { error: 'Game not found' };

        // Only allow active players
        if (!game.activePlayers.includes(playerId)) {
            return { error: 'Player is not active' };
        }

        // Validate word
        const isValid = this.validateWord(word, game.currentLetter);

        game.playerWords[playerId] = {
            word: word.toUpperCase(),
            submitTime,
            isValid
        };

        return { success: true, isValid };
    }

    validateWord(word, letter) {
        if (!word || typeof word !== 'string') return false;

        const cleanWord = word.trim().toUpperCase();

        // Check minimum length
        if (cleanWord.length < 3) return false;

        // Check starts with correct letter
        if (!cleanWord.startsWith(letter.toUpperCase())) return false;

        // Check only letters
        if (!/^[A-Z]+$/.test(cleanWord)) return false;

        return true;
    }

    getWordRushResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'word-rush') return null;

        const submissions = [];

        // Collect all active players' submissions
        game.activePlayers.forEach(playerId => {
            const submission = game.playerWords[playerId];
            if (submission) {
                submissions.push({
                    playerId,
                    word: submission.word,
                    submitTime: submission.submitTime,
                    isValid: submission.isValid,
                    reactionTime: submission.submitTime - game.roundStartTime
                });
            } else {
                submissions.push({
                    playerId,
                    word: null,
                    submitTime: null,
                    isValid: false,
                    reactionTime: null
                });
            }
        });

        // Sort by submission time (fastest first)
        submissions.sort((a, b) => {
            if (a.submitTime === null) return 1;
            if (b.submitTime === null) return -1;
            return a.submitTime - b.submitTime;
        });

        // Determine who gets eliminated
        const validSubmissions = submissions.filter(s => s.isValid);
        const invalidSubmissions = submissions.filter(s => !s.isValid);

        let eliminated = [];

        if (validSubmissions.length === 0) {
            // Everyone invalid or didn't submit - only eliminate ONE player
            // Choose the one who submitted last, or if no one submitted, pick randomly
            const submittedButInvalid = submissions.filter(s => s.submitTime !== null);
            if (submittedButInvalid.length > 0) {
                // Eliminate the last person to submit an invalid word
                const lastSubmitter = submittedButInvalid[submittedButInvalid.length - 1];
                eliminated = [lastSubmitter.playerId];
            } else {
                // No one submitted - pick a random player to eliminate
                const randomIndex = Math.floor(Math.random() * submissions.length);
                eliminated = [submissions[randomIndex].playerId];
            }
        } else if (validSubmissions.length === game.activePlayers.length) {
            // Everyone submitted valid - eliminate slowest
            eliminated = [validSubmissions[validSubmissions.length - 1].playerId];
        } else {
            // Eliminate all invalid submissions
            eliminated = invalidSubmissions.map(s => s.playerId);
        }

        return {
            currentRound: game.currentRound,
            letter: game.currentLetter,
            submissions,
            eliminated,
            remainingPlayers: game.activePlayers.length - eliminated.length
        };
    }

    nextWordRushRound(roomId, eliminated) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'word-rush') return null;

        // Remove eliminated players
        eliminated.forEach(playerId => {
            const index = game.activePlayers.indexOf(playerId);
            if (index > -1) {
                game.activePlayers.splice(index, 1);
                game.eliminatedPlayers.push(playerId);
            }
        });

        game.currentRound++;

        // Check if we have a winner
        if (game.activePlayers.length <= 1) {
            game.status = 'FINISHED';
            return {
                finished: true,
                winner: game.activePlayers[0] || null
            };
        }

        game.status = 'WAITING';
        return { finished: false };
    }

    // Whot Card Game Methods
    startWhotGame(roomId, room, hostParticipates = true) {
        const { createWhotDeck, shuffleDeck } = require('../data/whotCards');

        // Check player count (2-8 players supported)
        const participatingPlayers = room.players.filter(p => hostParticipates || !p.isHost);
        if (participatingPlayers.length < 2) {
            return { error: 'Whot requires at least 2 players' };
        }
        if (participatingPlayers.length > 8) {
            return { error: 'Whot supports maximum 8 players' };
        }

        const deck = shuffleDeck(createWhotDeck());
        const playerHands = {};
        const playerOrder = [];

        // Deal 6 cards to each player
        participatingPlayers.forEach(player => {
            playerHands[player.id] = deck.splice(0, 6);
            playerOrder.push(player.id);
        });

        // Flip one card to start discard pile
        const discardPile = [deck.pop()];

        const gameState = {
            type: 'whot',
            roomId,
            deck,
            discardPile,
            playerHands,
            playerOrder,
            currentPlayerIndex: 0,
            direction: 1,
            topCard: discardPile[0],
            calledShape: null,
            attackStack: 0, // Track accumulated attack cards (Pick 2/Pick 3)
            status: 'PLAYING',
            hostParticipates,
            winner: null
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    canPlayCard(game, card) {
        const topCard = game.topCard;

        // Whot card can always be played
        if (card.shape === 'whot') return true;

        // If a shape was called after Whot, must match that shape
        if (game.calledShape) {
            return card.shape === game.calledShape;
        }

        // Match shape or number
        return card.shape === topCard.shape || card.number === topCard.number;
    }

    playWhotCard(roomId, playerId, cardId, calledShape = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return { error: 'Game not found' };

        // Check if it's player's turn
        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (currentPlayerId !== playerId) {
            return { error: 'Not your turn' };
        }

        // Find card in player's hand
        const playerHand = game.playerHands[playerId];
        const cardIndex = playerHand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { error: 'Card not in hand' };
        }

        const card = playerHand[cardIndex];

        // Validate move
        if (!this.canPlayCard(game, card)) {
            return { error: 'Invalid move' };
        }

        // Remove card from hand and add to discard pile
        playerHand.splice(cardIndex, 1);
        game.discardPile.push(card);
        game.topCard = card;

        // Handle Whot card
        if (card.shape === 'whot') {
            if (!calledShape) {
                return { error: 'Must call a shape for Whot card' };
            }
            game.calledShape = calledShape;
        } else {
            game.calledShape = null;
        }

        // Check for winner
        if (playerHand.length === 0) {
            game.status = 'FINISHED';
            game.winner = playerId;
            return { success: true, winner: playerId, action: null };
        }

        // Handle special cards
        const action = this.handleWhotSpecialCard(game, card);

        // Move to next player (unless Hold On/Suspension)
        if (action !== 'skip') {
            this.moveToNextPlayer(game);
        }

        return { success: true, action, topCard: game.topCard, calledShape: game.calledShape };
    }

    handleWhotSpecialCard(game, card) {
        if (!card.isSpecial) return null;

        switch (card.action) {
            case 'pick2':
                // Add to attack stack (turn will be moved by playWhotCard)
                game.attackStack = (game.attackStack || 0) + 2;
                return 'pick2';

            case 'pick3':
                // Add to attack stack (turn will be moved by playWhotCard)
                game.attackStack = (game.attackStack || 0) + 3;
                return 'pick3';

            case 'general-market':
                // All players draw 1 card
                game.playerOrder.forEach(playerId => {
                    this.drawWhotCards(game.roomId, playerId, 1);
                });
                return 'general-market';

            case 'hold-on':
            case 'suspension':
                // Skip next player - move twice (current player already moved in playWhotCard)
                this.moveToNextPlayer(game);
                return 'skip';

            default:
                return null;
        }
    }

    drawWhotCards(roomId, playerId, count = 1) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return { error: 'Game not found' };

        const playerHand = game.playerHands[playerId];

        // If there's an attack stack and player is drawing, they must draw all attack cards
        const cardsToDraw = game.attackStack > 0 ? game.attackStack : count;

        for (let i = 0; i < cardsToDraw; i++) {
            if (game.deck.length === 0) {
                // Reshuffle discard pile if deck is empty
                const { shuffleDeck } = require('../data/whotCards');
                const topCard = game.discardPile.pop();
                game.deck = shuffleDeck(game.discardPile);
                game.discardPile = [topCard];
            }

            if (game.deck.length > 0) {
                playerHand.push(game.deck.pop());
            }
        }

        // Clear attack stack after drawing
        if (game.attackStack > 0) {
            game.attackStack = 0;
        }

        // Automatically move to next player after drawing
        this.moveToNextPlayer(game);

        return { success: true, cardsDrawn: cardsToDraw };
    }

    moveToNextPlayer(game) {
        game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.playerOrder.length) % game.playerOrder.length;
    }

    getWhotGameState(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return null;

        return {
            topCard: game.topCard,
            calledShape: game.calledShape,
            attackStack: game.attackStack || 0,
            currentPlayerId: game.playerOrder[game.currentPlayerIndex],
            playerHand: game.playerHands[playerId],
            otherPlayers: game.playerOrder.map(pid => ({
                id: pid,
                cardCount: game.playerHands[pid].length,
                isCurrentPlayer: pid === game.playerOrder[game.currentPlayerIndex]
            })),
            deckCount: game.deck.length,
            status: game.status,
            winner: game.winner
        };
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
    }

    getGameState(roomId) {
        return this.activeGames.get(roomId);
    }

    // Truth or Dare Game Methods
    startTruthOrDareGame(roomId, room, hostParticipates = true, category = 'normal') {
        const playerOrder = [];

        // Add participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            playerOrder.push(player.id);
        });

        if (playerOrder.length < 2) {
            return { error: 'Truth or Dare requires at least 2 players' };
        }

        const gameState = {
            type: 'truth-or-dare',
            roomId,
            category,
            playerOrder,
            currentPlayerIndex: 0,
            currentPrompt: null,
            promptType: null, // 'truth' or 'dare'
            usedTruths: [],
            usedDares: [],
            turnCount: 0,
            status: 'WAITING_FOR_CHOICE', // WAITING_FOR_CHOICE, SHOWING_PROMPT
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getTruthOrDareGameState(roomId, playerId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'truth-or-dare') return null;

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        const isCurrentPlayer = playerId === currentPlayerId;

        return {
            currentPlayerId,
            isCurrentPlayer,
            category: game.category,
            promptType: game.promptType,
            // Only show prompt to current player
            currentPrompt: isCurrentPlayer ? game.currentPrompt : null,
            turnCount: game.turnCount,
            status: game.status,
            playerOrder: game.playerOrder
        };
    }

    chooseTruthOrDare(roomId, playerId, choice) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'truth-or-dare') return { error: 'Game not found' };

        // Verify it's the player's turn
        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (playerId !== currentPlayerId) {
            return { error: 'Not your turn' };
        }

        if (game.status !== 'WAITING_FOR_CHOICE') {
            return { error: 'Not waiting for choice' };
        }

        let prompt;
        if (choice === 'truth') {
            prompt = getRandomTruth(game.category, game.usedTruths);
            game.usedTruths.push(prompt);
            game.promptType = 'truth';
        } else if (choice === 'dare') {
            prompt = getRandomDare(game.category, game.usedDares);
            game.usedDares.push(prompt);
            game.promptType = 'dare';
        } else {
            return { error: 'Invalid choice. Must be "truth" or "dare"' };
        }

        game.currentPrompt = prompt;
        game.status = 'SHOWING_PROMPT';

        return {
            success: true,
            prompt,
            promptType: game.promptType
        };
    }

    completeTruthOrDareTurn(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'truth-or-dare') return { error: 'Game not found' };

        // Verify it's the player's turn
        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (playerId !== currentPlayerId) {
            return { error: 'Not your turn' };
        }

        // Move to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerOrder.length;
        game.currentPrompt = null;
        game.promptType = null;
        game.turnCount++;
        game.status = 'WAITING_FOR_CHOICE';

        return {
            success: true,
            nextPlayerId: game.playerOrder[game.currentPlayerIndex],
            turnCount: game.turnCount
        };
    }
}

module.exports = new GameManager();
