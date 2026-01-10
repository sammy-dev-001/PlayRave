const { getRandomQuestions } = require('../data/triviaQuestions');
const { getRandomStatements } = require('../data/mythOrFactStatements');
const { getRandomPrompts } = require('../data/whosMostLikelyPrompts');
const { getRandomTruth, getRandomDare } = require('../data/truthOrDarePrompts');
const { getRandomPrompt: getNHIEPrompt } = require('../data/neverHaveIEverPrompts');
const { getRandomQuestion: getRapidFireQ } = require('../data/rapidFirePrompts');
const { getRandomWordPair } = require('../data/imposterWords');
const UNPOPULAR_OPINIONS = require('../data/unpopularOpinions');
const { getRandomSentences } = require('../data/typeRaceSentences');


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

        // Guard against empty submissions array
        if (submissions.length === 0) {
            return {
                currentRound: game.currentRound,
                letter: game.currentLetter,
                submissions,
                eliminated: [],
                remainingPlayers: 0
            };
        }

        if (validSubmissions.length === 0) {
            // Everyone invalid or didn't submit - only eliminate ONE player
            // Choose the one who submitted last, or if no one submitted, pick randomly
            const submittedButInvalid = submissions.filter(s => s.submitTime !== null);
            if (submittedButInvalid.length > 0) {
                // Eliminate the last person to submit an invalid word
                const lastSubmitter = submittedButInvalid[submittedButInvalid.length - 1];
                eliminated = [lastSubmitter.playerId];
            } else if (submissions.length > 0) {
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

    // ==================== NEVER HAVE I EVER ====================
    startNeverHaveIEverGame(roomId, room, category = 'normal') {
        const playerOrder = room.players.map(p => p.id);
        const firstPrompt = getNHIEPrompt(category, []);

        const MAX_ROUNDS = 30; // Stop at 30 questions

        const game = {
            type: 'never-have-i-ever',
            roomId,
            status: 'PLAYING',
            category,
            currentPrompt: firstPrompt,
            usedPrompts: [firstPrompt],
            roundNumber: 1,
            maxRounds: MAX_ROUNDS,
            playerOrder,
            playerScores: {},
            playerResponses: {} // Track who responded this round
        };

        // Initialize scores
        playerOrder.forEach(pid => {
            game.playerScores[pid] = 0;
            game.playerResponses[pid] = null; // null = not responded, true = has done it, false = hasn't
        });

        this.activeGames.set(roomId, game);
        return game;
    }

    respondNeverHaveIEver(roomId, playerId, hasDoneIt) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'never-have-i-ever') return { error: 'Game not found' };

        game.playerResponses[playerId] = hasDoneIt;
        if (hasDoneIt) {
            game.playerScores[playerId] = (game.playerScores[playerId] || 0) + 1;
        }

        // Check if all players responded
        const allResponded = game.playerOrder.every(pid => game.playerResponses[pid] !== null);

        return {
            success: true,
            playerId,
            hasDoneIt,
            allResponded,
            playerScores: game.playerScores,
            playerResponses: game.playerResponses
        };
    }

    nextNeverHaveIEverRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'never-have-i-ever') return { error: 'Game not found' };

        // Check if we've reached max rounds
        if (game.roundNumber >= game.maxRounds) {
            game.status = 'FINISHED';
            return {
                finished: true,
                playerScores: game.playerScores,
                roundNumber: game.roundNumber,
                maxRounds: game.maxRounds
            };
        }

        const newPrompt = getNHIEPrompt(game.category, game.usedPrompts);
        game.currentPrompt = newPrompt;
        game.usedPrompts.push(newPrompt);
        game.roundNumber++;

        // Reset responses for new round
        game.playerOrder.forEach(pid => {
            game.playerResponses[pid] = null;
        });

        return {
            success: true,
            currentPrompt: game.currentPrompt,
            roundNumber: game.roundNumber,
            maxRounds: game.maxRounds,
            playerResponses: game.playerResponses
        };
    }

    getNeverHaveIEverState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'never-have-i-ever') return null;

        return {
            currentPrompt: game.currentPrompt,
            roundNumber: game.roundNumber,
            maxRounds: game.maxRounds,
            category: game.category,
            playerScores: game.playerScores,
            playerResponses: game.playerResponses,
            status: game.status
        };
    }

    // ==================== RAPID FIRE ====================
    startRapidFireGame(roomId, room, category = 'normal') {
        const playerOrder = room.players.map(p => p.id);
        const firstQuestion = getRapidFireQ(category, []);

        const game = {
            type: 'rapid-fire',
            roomId,
            status: 'PLAYING',
            category,
            currentQuestion: firstQuestion,
            usedQuestions: [firstQuestion],
            currentPlayerIndex: 0,
            roundNumber: 1,
            playerOrder,
            playerScores: {},
            timePerQuestion: 5
        };

        playerOrder.forEach(pid => {
            game.playerScores[pid] = 0;
        });

        this.activeGames.set(roomId, game);
        return game;
    }

    answerRapidFire(roomId, playerId, answered) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'rapid-fire') return { error: 'Game not found' };

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (playerId !== currentPlayerId) return { error: 'Not your turn' };

        if (answered) {
            game.playerScores[playerId] = (game.playerScores[playerId] || 0) + 1;
        }

        // Move to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerOrder.length;
        if (game.currentPlayerIndex === 0) {
            game.roundNumber++;
        }

        // Get next question
        const newQuestion = getRapidFireQ(game.category, game.usedQuestions);
        game.currentQuestion = newQuestion;
        game.usedQuestions.push(newQuestion);

        return {
            success: true,
            answered,
            newQuestion,
            currentPlayerId: game.playerOrder[game.currentPlayerIndex],
            playerScores: game.playerScores,
            roundNumber: game.roundNumber
        };
    }

    getRapidFireState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'rapid-fire') return null;

        return {
            currentQuestion: game.currentQuestion,
            currentPlayerId: game.playerOrder[game.currentPlayerIndex],
            roundNumber: game.roundNumber,
            category: game.category,
            playerScores: game.playerScores,
            timePerQuestion: game.timePerQuestion,
            status: game.status
        };
    }

    // ==================== CONFESSION ROULETTE ====================

    startConfessionRouletteGame(roomId, room) {
        const playerOrder = room.players.map(p => p.id);

        const gameState = {
            type: 'confession-roulette',
            roomId,
            confessions: {}, // { playerId: confession }
            shuffledConfessions: [], // Array of { confession, authorId }
            currentConfessionIndex: 0,
            votes: {}, // { confessionIndex: { voterId: votedForPlayerId } }
            scores: {}, // { playerId: score }
            playerOrder,
            phase: 'submission', // submission, voting, results, final
            submissionTimer: 60,
            votingTimer: 30,
            status: 'PLAYING'
        };

        // Initialize scores
        playerOrder.forEach(pid => {
            gameState.scores[pid] = 0;
        });

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    submitConfession(roomId, playerId, confession) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return { error: 'Game not found' };
        if (game.phase !== 'submission') return { error: 'Not in submission phase' };

        game.confessions[playerId] = confession;

        return {
            success: true,
            submittedCount: Object.keys(game.confessions).length,
            totalPlayers: game.playerOrder.length
        };
    }

    endConfessionSubmission(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return { error: 'Game not found' };

        // Shuffle confessions
        const confessionEntries = Object.entries(game.confessions).map(([authorId, confession]) => ({
            confession,
            authorId
        }));

        // Fisher-Yates shuffle
        for (let i = confessionEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [confessionEntries[i], confessionEntries[j]] = [confessionEntries[j], confessionEntries[i]];
        }

        game.shuffledConfessions = confessionEntries;
        game.currentConfessionIndex = 0;
        game.phase = 'voting';

        return {
            success: true,
            totalConfessions: confessionEntries.length,
            firstConfession: confessionEntries.length > 0 ? confessionEntries[0].confession : null
        };
    }

    getCurrentConfession(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return null;

        const current = game.shuffledConfessions[game.currentConfessionIndex];
        if (!current) return null;

        return {
            confession: current.confession,
            index: game.currentConfessionIndex,
            total: game.shuffledConfessions.length
        };
    }

    submitConfessionVote(roomId, voterId, votedForPlayerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return { error: 'Game not found' };
        if (game.phase !== 'voting') return { error: 'Not in voting phase' };

        const confessionIndex = game.currentConfessionIndex;

        if (!game.votes[confessionIndex]) {
            game.votes[confessionIndex] = {};
        }

        game.votes[confessionIndex][voterId] = votedForPlayerId;

        return {
            success: true,
            votedCount: Object.keys(game.votes[confessionIndex]).length
        };
    }

    getConfessionResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return null;

        const confessionIndex = game.currentConfessionIndex;
        const currentConfession = game.shuffledConfessions[confessionIndex];
        if (!currentConfession) return null;

        const votes = game.votes[confessionIndex] || {};
        const correctGuessers = [];

        // Calculate points
        Object.entries(votes).forEach(([voterId, votedFor]) => {
            if (votedFor === currentConfession.authorId) {
                correctGuessers.push(voterId);
                game.scores[voterId] = (game.scores[voterId] || 0) + 100; // Points for correct guess
            }
        });

        // Points for fooling others
        const fooledCount = Object.keys(votes).length - correctGuessers.length;
        game.scores[currentConfession.authorId] = (game.scores[currentConfession.authorId] || 0) + (fooledCount * 50);

        return {
            confession: currentConfession.confession,
            author: currentConfession.authorId,
            correctGuessers,
            fooledCount,
            scores: game.scores,
            isLastConfession: confessionIndex >= game.shuffledConfessions.length - 1
        };
    }

    nextConfession(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return { error: 'Game not found' };

        game.currentConfessionIndex++;

        if (game.currentConfessionIndex >= game.shuffledConfessions.length) {
            game.phase = 'final';
            game.status = 'FINISHED';
            return { finished: true, finalScores: game.scores };
        }

        game.phase = 'voting';
        return {
            finished: false,
            nextConfession: this.getCurrentConfession(roomId)
        };
    }

    getConfessionScores(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'confession-roulette') return null;
        return game.scores;
    }

    // Imposter Game Methods

    startImposterGame(roomId, room) {
        // Assign imposter randomly
        const imposterIndex = Math.floor(Math.random() * room.players.length);
        const imposter = room.players[imposterIndex];

        // Get word pair
        const wordPair = getRandomWordPair();

        const gameState = {
            type: 'imposter',
            phase: 'waiting', // waiting, word_reveal, discussion, voting, results
            round: 1,
            imposterId: imposter.id,
            imposterName: imposter.name,
            normalWord: wordPair.normalWord,
            imposterWord: wordPair.imposterWord,
            category: wordPair.category,
            votes: {}, // voterId -> votedForPlayerName
            startTime: Date.now()
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getImposterState(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'imposter') return null;

        const isImposter = game.imposterId === playerId;

        return {
            phase: game.phase,
            myWord: isImposter ? game.imposterWord : game.normalWord,
            isImposter,
            category: game.category,
            timer: game.timer
        };
    }

    startImposterDiscussion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'imposter') return null;

        game.phase = 'discussion';
        return game;
    }

    startImposterVoting(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'imposter') return null;

        game.phase = 'voting';
        game.votes = {};
        return game;
    }

    submitImposterVote(roomId, voterId, votedForName) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'imposter') return { error: 'Game not found' };
        if (game.phase !== 'voting') return { error: 'Not in voting phase' };

        // Prevent multiple votes if you want, but allow changing vote for now
        game.votes[voterId] = votedForName;

        return {
            votedCount: Object.keys(game.votes).length
        };
    }

    getImposterResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'imposter') return null;

        const votes = game.votes;
        const voteCounts = {};
        let totalVotes = 0;

        Object.values(votes).forEach(votedName => {
            voteCounts[votedName] = (voteCounts[votedName] || 0) + 1;
            totalVotes++;
        });

        // Find who got most votes
        let mostVotedName = null;
        let maxVotes = -1;

        Object.entries(voteCounts).forEach(([name, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedName = name;
            }
        });

        // Check if imposter was caught
        const imposterCaught = mostVotedName === game.imposterName;

        game.phase = 'results';

        return {
            imposterName: game.imposterName,
            imposterWord: game.imposterWord,
            normalWord: game.normalWord,
            imposterCaught,
            mostVotedName,
            voteCounts
        };
    }

    // Unpopular Opinions Game Methods

    startUnpopularOpinionsGame(roomId, room) {
        // Shuffle opinions
        const shuffled = [...UNPOPULAR_OPINIONS].sort(() => 0.5 - Math.random());

        // Initialize scores
        const scores = {};
        room.players.forEach(p => scores[p.name] = 0);

        const gameState = {
            type: 'unpopular-opinions',
            phase: 'waiting', // waiting, opinion, results, final
            opinions: shuffled,
            currentIndex: 0,
            currentOpinion: shuffled[0],
            votes: {}, // playerId -> 'agree'/'disagree'
            scores: scores,
            round: 1,
            maxRounds: 10
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getOpinionState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return null;

        return {
            phase: game.phase,
            currentOpinion: game.currentOpinion,
            round: game.round,
            scores: game.scores
        };
    }

    startOpinionRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return null;

        game.phase = 'opinion';
        game.votes = {};

        return game.currentOpinion;
    }

    submitOpinionVote(roomId, playerId, vote) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return { error: 'Game not found' };

        game.votes[playerId] = vote;

        return {
            voteCount: Object.keys(game.votes).length
        };
    }

    getOpinionResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return null;

        const votes = game.votes;
        let agreeCount = 0;
        let disagreeCount = 0;

        Object.values(votes).forEach(vote => {
            if (vote === 'agree') agreeCount++;
            else if (vote === 'disagree') disagreeCount++;
        });

        // Determine if unpopular opinion (minority wins points)
        // If it's a tie, no one gets points or everyone does? Let's say tie = popular (majority rule applies broadly)
        // Actually, "Unpopular Opinions" game usually means you get points for predicting, OR 
        // the standard party game version is: You get points for being in the minority? Or just seeing stats?
        // Let's go with: Points for being in the MINORITY (Unpopular Opinion).

        const isUnpopular = agreeCount !== disagreeCount; // Just to see if there is a minority
        let minorityVote = null;

        if (agreeCount < disagreeCount && agreeCount > 0) minorityVote = 'agree';
        else if (disagreeCount < agreeCount && disagreeCount > 0) minorityVote = 'disagree';

        // Update scores
        if (minorityVote) {
            Object.entries(votes).forEach(([playerId, vote]) => {
                if (vote === minorityVote) {
                    // Find player name from room logic or just store IDs in scores? 
                    // Previously we stored names in scores. Let's fix that inconsistency.
                    // Ideally we map ID to name.
                    // For now, let's assume we can get name or just modify how we stored scores.
                    // In start: room.players.forEach(p => scores[p.name] = 0);
                    // So we need player name here.
                }
            });
        }

        // Wait, GameManager doesn't easily have player mapping here unless passed or stored.
        // Let's return the raw voting data and let the frontend/controller handle score calculation?
        // Or better, let's just make sure we can access players.
        // For simplicity, let's just return the counts and calc scores in a separate method or here if we had room context.
        // To keep it simple, I'll calculate scores here if (game.activeGames has it? No).

        // REFACTOR: Store player map in gameState for easy score updates
        // Since I can't easily access room.players without passing it, I will skip detailed score update here 
        // OR better: I will just use IDs in scores, then map to names at the end/frontend.

        // Let's rely on IDs for internal logic.
        // Re-init scores as IDs in startUnpopularOpinionsGame

        return {
            agreeCount,
            disagreeCount,
            isUnpopular: !!minorityVote,
            minorityVote
        };
    }

    updateOpinionScores(roomId, room) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return null;

        const results = this.getOpinionResults(roomId);
        const minorityVote = results.minorityVote;

        if (minorityVote) {
            Object.entries(game.votes).forEach(([playerId, vote]) => {
                const player = room.players.find(p => p.id === playerId);
                if (player && vote === minorityVote) {
                    game.scores[player.name] = (game.scores[player.name] || 0) + 10;
                }
            });
        } else {
            // Majority wins? Or Tie?
            // If tie, maybe everyone gets points? Or no one.
            // Let's say if it's a popular opinion (Majority wins), majority gets points?
            // The game is called "Unpopular Opinions", implying being unique is good?
            // OR "Do you agree with this unpopular opinion?".
            // Let's stick to: MINORITY gets points (Unpopular).
            // If tie or everyone agrees, no points for "Unpopular".
            // Actually, let's award MAJORITY points if no minority exists (everyone agreed).

            if (!minorityVote) {
                // Determine majority
                let majorityVote = null;
                if (results.agreeCount > results.disagreeCount) majorityVote = 'agree';
                else if (results.disagreeCount > results.agreeCount) majorityVote = 'disagree';

                if (majorityVote) {
                    Object.entries(game.votes).forEach(([playerId, vote]) => {
                        const player = room.players.find(p => p.id === playerId);
                        if (player && vote === majorityVote) {
                            game.scores[player.name] = (game.scores[player.name] || 0) + 5;
                        }
                    });
                }
            }
        }

        game.phase = 'results';
        return { ...results, scores: game.scores };
    }

    nextOpinion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'unpopular-opinions') return { error: 'Game not found' };

        game.currentIndex++;

        if (game.currentIndex >= Math.min(game.opinions.length, game.maxRounds)) {
            game.phase = 'final';
            return { finished: true, finalScores: game.scores };
        }

        game.currentOpinion = game.opinions[game.currentIndex];
        game.round++;
        game.phase = 'waiting'; // Set to waiting, trigger 'opinion' start separately or auto

        return {
            finished: false,
            opinion: game.currentOpinion
        };
    }

    // Hot Seat Game Methods
    startHotSeatGame(roomId, room, hostParticipates = true) {
        const playerOrder = [];

        // Add participating players
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) {
                return;
            }
            playerOrder.push({
                id: player.id,
                name: player.name,
                hasBeenHotSeat: false
            });
        });

        if (playerOrder.length < 2) {
            return { error: 'Hot Seat requires at least 2 players' };
        }

        // Shuffle player order
        for (let i = playerOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerOrder[i], playerOrder[j]] = [playerOrder[j], playerOrder[i]];
        }

        const gameState = {
            type: 'hot-seat',
            roomId,
            playerOrder,
            hotSeatPlayerIndex: 0,
            hotSeatPlayerId: playerOrder[0].id,
            hotSeatPlayerName: playerOrder[0].name,
            submittedQuestions: {}, // { playerId: question }
            currentQuestionIndex: 0,
            phase: 'submitting', // submitting, answering, finished
            round: 1,
            hostParticipates
        };

        playerOrder[0].hasBeenHotSeat = true;
        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getHotSeatGameState(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return null;

        const isHotSeat = playerId === game.hotSeatPlayerId;
        const hasSubmitted = !!game.submittedQuestions[playerId];
        const totalPlayers = game.playerOrder.length - 1; // Exclude hot seat player
        const submittedCount = Object.keys(game.submittedQuestions).length;

        // Get questions as array for answering phase
        const questions = Object.entries(game.submittedQuestions).map(([pid, q]) => ({
            fromPlayerId: pid,
            fromPlayerName: game.playerOrder.find(p => p.id === pid)?.name || 'Anonymous',
            question: q
        }));

        return {
            hotSeatPlayerId: game.hotSeatPlayerId,
            hotSeatPlayerName: game.hotSeatPlayerName,
            isHotSeat,
            hasSubmitted,
            submittedCount,
            totalExpected: totalPlayers,
            phase: game.phase,
            round: game.round,
            questions: game.phase === 'answering' ? questions : [],
            currentQuestionIndex: game.currentQuestionIndex
        };
    }

    submitHotSeatQuestion(roomId, playerId, question) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { error: 'Game not found' };

        if (playerId === game.hotSeatPlayerId) {
            return { error: 'Hot seat player cannot submit questions' };
        }

        if (game.phase !== 'submitting') {
            return { error: 'Not in submitting phase' };
        }

        if (!question || question.trim().length === 0) {
            return { error: 'Question cannot be empty' };
        }

        game.submittedQuestions[playerId] = question.trim();

        const totalExpected = game.playerOrder.length - 1;
        const submittedCount = Object.keys(game.submittedQuestions).length;

        // Check if all players submitted
        if (submittedCount >= totalExpected) {
            game.phase = 'answering';
            game.currentQuestionIndex = 0;
        }

        return {
            success: true,
            submittedCount,
            totalExpected,
            allSubmitted: submittedCount >= totalExpected
        };
    }

    nextHotSeatQuestion(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { error: 'Game not found' };

        const questions = Object.keys(game.submittedQuestions);
        game.currentQuestionIndex++;

        if (game.currentQuestionIndex >= questions.length) {
            // Move to next hot seat player
            return this.nextHotSeatPlayer(roomId);
        }

        return {
            success: true,
            currentQuestionIndex: game.currentQuestionIndex
        };
    }

    nextHotSeatPlayer(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'hot-seat') return { error: 'Game not found' };

        // Find next player who hasn't been on hot seat
        const nextPlayer = game.playerOrder.find(p => !p.hasBeenHotSeat);

        if (!nextPlayer) {
            // Everyone has been on hot seat - game over
            game.phase = 'finished';
            return {
                finished: true,
                message: 'All players have been on the hot seat!'
            };
        }

        // Set up next round
        nextPlayer.hasBeenHotSeat = true;
        game.hotSeatPlayerId = nextPlayer.id;
        game.hotSeatPlayerName = nextPlayer.name;
        game.submittedQuestions = {};
        game.currentQuestionIndex = 0;
        game.phase = 'submitting';
        game.round++;

        return {
            finished: false,
            hotSeatPlayerId: game.hotSeatPlayerId,
            hotSeatPlayerName: game.hotSeatPlayerName,
            round: game.round
        };
    }

    // ==================== BUTTON MASH GAME ====================
    // Players tap as fast as possible for 10 seconds. Highest count wins.

    startButtonMashGame(roomId, room, hostParticipates = true) {
        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                tapCount: 0,
                finished: false
            });
        });

        const gameState = {
            type: 'button-mash',
            roomId,
            players,
            duration: 10000, // 10 seconds
            startTime: null,
            phase: 'countdown', // countdown, playing, results
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startButtonMashRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'button-mash') return { error: 'Game not found' };

        game.phase = 'playing';
        game.startTime = Date.now();

        // Reset tap counts
        game.players.forEach(p => {
            p.tapCount = 0;
            p.finished = false;
        });

        return { startTime: game.startTime };
    }

    submitButtonMashTap(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'button-mash') return { error: 'Game not found' };
        if (game.phase !== 'playing') return { error: 'Game not in playing phase' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };
        if (player.finished) return { error: 'Player already finished' };

        // Check if time is up
        const elapsed = Date.now() - game.startTime;
        if (elapsed >= game.duration) {
            player.finished = true;
            return { tapCount: player.tapCount, finished: true };
        }

        player.tapCount++;
        return { tapCount: player.tapCount, finished: false };
    }

    finishButtonMashPlayer(roomId, playerId, finalCount) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'button-mash') return { error: 'Game not found' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };

        player.tapCount = finalCount;
        player.finished = true;

        // Check if all players finished
        const allFinished = game.players.every(p => p.finished);

        return {
            allFinished,
            playerCount: player.tapCount
        };
    }

    getButtonMashResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'button-mash') return { error: 'Game not found' };

        game.phase = 'results';

        // Sort by tap count descending
        const rankings = [...game.players].sort((a, b) => b.tapCount - a.tapCount);

        return {
            rankings,
            winner: rankings[0]
        };
    }

    getButtonMashLeaderboard(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'button-mash') return [];

        return game.players
            .map(p => ({ id: p.id, name: p.name, tapCount: p.tapCount }))
            .sort((a, b) => b.tapCount - a.tapCount);
    }

    // ==================== TYPE RACE GAME ====================
    // Players race to type sentences correctly. Fastest accurate typist wins.

    startTypeRaceGame(roomId, room, hostParticipates = true) {
        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                score: 0,
                currentProgress: 0,
                finished: false,
                finishTime: null
            });
        });

        const sentences = getRandomSentences(5); // 5 rounds

        const gameState = {
            type: 'type-race',
            roomId,
            players,
            sentences,
            currentRound: 0,
            totalRounds: sentences.length,
            currentSentence: sentences[0],
            roundStartTime: null,
            phase: 'waiting', // waiting, playing, results
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startTypeRaceRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return { error: 'Game not found' };

        // Reset player states for new round
        game.players.forEach(p => {
            p.currentProgress = 0;
            p.finished = false;
            p.finishTime = null;
        });

        game.phase = 'playing';
        game.roundStartTime = Date.now();

        return {
            sentence: game.currentSentence,
            round: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    updateTypeRaceProgress(roomId, playerId, progress, accuracy) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return { error: 'Game not found' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };

        player.currentProgress = progress;
        player.accuracy = accuracy;

        return {
            progress,
            playerId,
            playerName: player.name
        };
    }

    finishTypeRaceRound(roomId, playerId, typed, timeTaken) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return { error: 'Game not found' };

        const player = game.players.find(p => p.id === playerId);
        if (!player || player.finished) return { error: 'Player not found or already finished' };

        player.finished = true;
        player.finishTime = timeTaken;

        // Calculate accuracy
        const targetSentence = game.currentSentence;
        let correctChars = 0;
        for (let i = 0; i < Math.min(typed.length, targetSentence.length); i++) {
            if (typed[i] === targetSentence[i]) correctChars++;
        }
        const accuracy = Math.round((correctChars / targetSentence.length) * 100);
        player.accuracy = accuracy;

        // Award points based on speed and accuracy
        // Must have at least 80% accuracy to score
        if (accuracy >= 80) {
            const finishedPlayers = game.players.filter(p => p.finished && p.accuracy >= 80);
            const position = finishedPlayers.length;

            // Points: 1st = 100, 2nd = 75, 3rd = 50, others = 25
            const points = position === 1 ? 100 : position === 2 ? 75 : position === 3 ? 50 : 25;
            player.score += points;
            player.roundPoints = points;
        } else {
            player.roundPoints = 0;
        }

        // Check if all players finished
        const allFinished = game.players.every(p => p.finished);

        return {
            finished: true,
            accuracy,
            timeTaken,
            points: player.roundPoints,
            allFinished,
            position: game.players.filter(p => p.finished).length
        };
    }

    getTypeRaceRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return { error: 'Game not found' };

        const roundResults = game.players
            .filter(p => p.finished)
            .sort((a, b) => (a.finishTime || 99999) - (b.finishTime || 99999))
            .map((p, index) => ({
                id: p.id,
                name: p.name,
                time: p.finishTime,
                accuracy: p.accuracy,
                points: p.roundPoints,
                position: index + 1
            }));

        return {
            roundResults,
            currentRound: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    nextTypeRaceRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return { error: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            // Game over
            game.phase = 'finished';

            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, index) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    position: index + 1
                }));

            return {
                finished: true,
                rankings: finalRankings,
                winner: finalRankings[0]
            };
        }

        // Set up next round
        game.currentSentence = game.sentences[game.currentRound];
        game.phase = 'waiting';

        return {
            finished: false,
            nextRound: game.currentRound + 1
        };
    }

    getTypeRaceState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'type-race') return null;

        return {
            currentRound: game.currentRound + 1,
            totalRounds: game.totalRounds,
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                progress: p.currentProgress
            }))
        };
    }

    // ==================== MATH BLITZ GAME ====================
    // Fast math problems. First to answer correctly wins the round.

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
            default: // medium
                num1 = Math.floor(Math.random() * 20) + 5;
                num2 = Math.floor(Math.random() * 15) + 2;
        }

        // For subtraction, make sure result is positive
        if (op === '-' && num2 > num1) {
            [num1, num2] = [num2, num1];
        }

        // For multiplication, use smaller numbers
        if (op === '*') {
            num1 = Math.floor(Math.random() * 12) + 2;
            num2 = Math.floor(Math.random() * 12) + 2;
        }

        switch (op) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }

        return {
            display: `${num1} ${op} ${num2}`,
            answer,
            num1,
            num2,
            operation: op
        };
    }

    startMathBlitzGame(roomId, room, hostParticipates = true) {
        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                score: 0,
                answered: false,
                correct: false
            });
        });

        const totalRounds = 10;
        const problems = [];
        for (let i = 0; i < totalRounds; i++) {
            problems.push(this.generateMathProblem('medium'));
        }

        const gameState = {
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

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startMathBlitzRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'math-blitz') return { error: 'Game not found' };

        // Reset player states
        game.players.forEach(p => {
            p.answered = false;
            p.correct = false;
        });

        game.phase = 'playing';
        game.roundStartTime = Date.now();
        game.roundWinner = null;

        return {
            problem: game.currentProblem.display,
            round: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    submitMathBlitzAnswer(roomId, playerId, answer) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'math-blitz') return { error: 'Game not found' };
        if (game.phase !== 'playing') return { error: 'Round not active' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };
        if (player.answered) return { error: 'Already answered' };

        player.answered = true;
        const isCorrect = parseInt(answer) === game.currentProblem.answer;
        player.correct = isCorrect;

        if (isCorrect && !game.roundWinner) {
            // First correct answer wins!
            game.roundWinner = playerId;
            player.score += 100;

            return {
                correct: true,
                isWinner: true,
                answer: game.currentProblem.answer,
                playerName: player.name
            };
        }

        return {
            correct: isCorrect,
            isWinner: false,
            correctAnswer: game.currentProblem.answer
        };
    }

    getMathBlitzRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'math-blitz') return { error: 'Game not found' };

        const winner = game.players.find(p => p.id === game.roundWinner);

        return {
            correctAnswer: game.currentProblem.answer,
            problem: game.currentProblem.display,
            winner: winner ? { id: winner.id, name: winner.name } : null,
            standings: [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    position: i + 1
                })),
            currentRound: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    nextMathBlitzRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'math-blitz') return { error: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';

            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    position: i + 1
                }));

            return {
                finished: true,
                rankings: finalRankings,
                winner: finalRankings[0]
            };
        }

        game.currentProblem = game.problems[game.currentRound];
        game.phase = 'waiting';

        return {
            finished: false,
            nextRound: game.currentRound + 1
        };
    }

    // ==================== COLOR RUSH GAME ====================
    // A color name appears (possibly in a different color - Stroop effect)
    // Players race to tap the button matching the color NAME

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
        // Display color might be different (Stroop effect) - 50% chance
        const displayColor = Math.random() > 0.5
            ? colors[Math.floor(Math.random() * colors.length)]
            : targetColor;

        return {
            targetColorName: targetColor.name,
            displayColorHex: displayColor.hex,
            buttons: colors.map(c => ({ name: c.name, hex: c.hex }))
        };
    }

    startColorRushGame(roomId, room, hostParticipates = true) {
        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                score: 0,
                answered: false,
                correct: false
            });
        });

        const totalRounds = 15;
        const challenges = [];
        for (let i = 0; i < totalRounds; i++) {
            challenges.push(this.generateColorChallenge());
        }

        const gameState = {
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

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startColorRushRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'color-rush') return { error: 'Game not found' };

        game.players.forEach(p => {
            p.answered = false;
            p.correct = false;
        });

        game.phase = 'playing';
        game.roundStartTime = Date.now();
        game.roundWinner = null;

        return {
            targetColorName: game.currentChallenge.targetColorName,
            displayColorHex: game.currentChallenge.displayColorHex,
            buttons: game.currentChallenge.buttons,
            round: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    submitColorRushAnswer(roomId, playerId, colorName) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'color-rush') return { error: 'Game not found' };
        if (game.phase !== 'playing') return { error: 'Round not active' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };
        if (player.answered) return { error: 'Already answered' };

        player.answered = true;
        const isCorrect = colorName === game.currentChallenge.targetColorName;
        player.correct = isCorrect;

        if (isCorrect && !game.roundWinner) {
            game.roundWinner = playerId;
            player.score += 100;

            return {
                correct: true,
                isWinner: true,
                playerName: player.name
            };
        } else if (!isCorrect) {
            // Wrong answer penalty
            player.score = Math.max(0, player.score - 25);
        }

        return {
            correct: isCorrect,
            isWinner: false,
            correctColor: game.currentChallenge.targetColorName
        };
    }

    getColorRushRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'color-rush') return { error: 'Game not found' };

        const winner = game.players.find(p => p.id === game.roundWinner);

        return {
            correctColor: game.currentChallenge.targetColorName,
            winner: winner ? { id: winner.id, name: winner.name } : null,
            standings: [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    position: i + 1
                })),
            currentRound: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    nextColorRushRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'color-rush') return { error: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';

            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                    position: i + 1
                }));

            return {
                finished: true,
                rankings: finalRankings,
                winner: finalRankings[0]
            };
        }

        game.currentChallenge = game.challenges[game.currentRound];
        game.phase = 'waiting';

        return {
            finished: false,
            nextRound: game.currentRound + 1
        };
    }

    // ==================== TIC-TAC-TOE TOURNAMENT ====================
    // Bracket-style tournament with 1v1 matches

    startTicTacToeTournament(roomId, room, hostParticipates = true) {
        const allPlayers = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            allPlayers.push({
                id: player.id,
                name: player.name,
                eliminated: false,
                wins: 0
            });
        });

        // Shuffle players for random bracket
        const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

        // Create initial matches (pair up players)
        const matches = this.createTournamentMatches(shuffledPlayers);

        const gameState = {
            type: 'tic-tac-toe',
            roomId,
            players: allPlayers,
            activePlayers: shuffledPlayers,
            matches,
            currentMatchIndex: 0,
            currentMatch: matches[0] || null,
            board: Array(9).fill(null),
            currentTurn: null,
            roundNumber: 1,
            phase: 'lobby', // lobby, playing, matchResult, roundComplete, finished
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    createTournamentMatches(players) {
        const matches = [];
        for (let i = 0; i < players.length; i += 2) {
            if (players[i + 1]) {
                matches.push({
                    player1: players[i],
                    player2: players[i + 1],
                    board: Array(9).fill(null),
                    currentTurn: players[i].id, // Player 1 starts
                    winner: null,
                    completed: false
                });
            } else {
                // Bye - auto-advance
                players[i].wins++;
                matches.push({
                    player1: players[i],
                    player2: null,
                    board: null,
                    winner: players[i],
                    completed: true,
                    isBye: true
                });
            }
        }
        return matches;
    }

    startTicTacToeMatch(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'tic-tac-toe') return { error: 'Game not found' };

        const match = game.matches[game.currentMatchIndex];
        if (!match || match.completed) return { error: 'No active match' };

        game.phase = 'playing';
        game.board = Array(9).fill(null);
        game.currentTurn = match.player1.id;
        match.board = Array(9).fill(null);
        match.currentTurn = match.player1.id;

        return {
            player1: { id: match.player1.id, name: match.player1.name, symbol: 'X' },
            player2: { id: match.player2.id, name: match.player2.name, symbol: 'O' },
            currentTurn: match.currentTurn,
            board: match.board,
            matchNumber: game.currentMatchIndex + 1,
            totalMatches: game.matches.filter(m => !m.isBye).length,
            roundNumber: game.roundNumber
        };
    }

    makeTicTacToeMove(roomId, playerId, position) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'tic-tac-toe') return { error: 'Game not found' };
        if (game.phase !== 'playing') return { error: 'Match not in progress' };

        const match = game.matches[game.currentMatchIndex];
        if (!match || match.completed) return { error: 'No active match' };
        if (match.currentTurn !== playerId) return { error: 'Not your turn' };
        if (match.board[position] !== null) return { error: 'Position taken' };

        // Make the move
        const symbol = playerId === match.player1.id ? 'X' : 'O';
        match.board[position] = symbol;

        // Check for winner
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        let winner = null;
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (match.board[a] && match.board[a] === match.board[b] && match.board[a] === match.board[c]) {
                winner = match.board[a] === 'X' ? match.player1 : match.player2;
                break;
            }
        }

        // Check for draw
        const isDraw = !winner && match.board.every(cell => cell !== null);

        if (winner || isDraw) {
            match.completed = true;
            match.winner = winner;
            if (winner) {
                winner.wins++;
            }
            game.phase = 'matchResult';

            return {
                board: match.board,
                position,
                symbol,
                gameOver: true,
                winner: winner ? { id: winner.id, name: winner.name } : null,
                isDraw
            };
        }

        // Switch turn
        match.currentTurn = playerId === match.player1.id ? match.player2.id : match.player1.id;

        return {
            board: match.board,
            position,
            symbol,
            gameOver: false,
            currentTurn: match.currentTurn
        };
    }

    nextTicTacToeMatch(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'tic-tac-toe') return { error: 'Game not found' };

        game.currentMatchIndex++;

        // Check if all matches in this round are complete
        const allMatchesComplete = game.matches.every(m => m.completed);

        if (allMatchesComplete) {
            // Get winners for next round
            const winners = game.matches
                .filter(m => m.winner)
                .map(m => m.winner);

            if (winners.length === 1) {
                // Tournament over!
                game.phase = 'finished';
                return {
                    finished: true,
                    champion: winners[0],
                    allPlayers: game.players.sort((a, b) => b.wins - a.wins)
                };
            }

            // Create next round
            game.roundNumber++;
            game.matches = this.createTournamentMatches(winners);
            game.currentMatchIndex = 0;
            game.phase = 'roundComplete';

            return {
                finished: false,
                roundComplete: true,
                nextRound: game.roundNumber,
                remainingPlayers: winners.length,
                nextMatches: game.matches.map(m => ({
                    player1: m.player1.name,
                    player2: m.player2?.name || 'BYE'
                }))
            };
        }

        // More matches in current round
        game.currentMatch = game.matches[game.currentMatchIndex];
        game.phase = 'lobby';

        return {
            finished: false,
            roundComplete: false,
            nextMatchIndex: game.currentMatchIndex,
            hasNextMatch: game.currentMatchIndex < game.matches.length
        };
    }

    getTicTacToeTournamentState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'tic-tac-toe') return null;

        return {
            phase: game.phase,
            roundNumber: game.roundNumber,
            currentMatch: game.matches[game.currentMatchIndex],
            matches: game.matches,
            players: game.players
        };
    }

    // ==================== DRAW BATTLE GAME ====================
    // Players draw based on prompts, others vote on best drawing

    startDrawBattleGame(roomId, room, hostParticipates = true) {
        const { getRandomDrawPrompts } = require('../data/drawBattlePrompts');

        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                score: 0,
                drawing: null,
                hasSubmitted: false,
                votes: 0
            });
        });

        const prompts = getRandomDrawPrompts(5);

        const gameState = {
            type: 'draw-battle',
            roomId,
            players,
            prompts,
            currentRound: 0,
            totalRounds: prompts.length,
            currentPrompt: prompts[0],
            drawingTimeSeconds: 60,
            phase: 'waiting', // waiting, drawing, voting, results, finished
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    startDrawBattleRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };

        // Reset player states
        game.players.forEach(p => {
            p.drawing = null;
            p.hasSubmitted = false;
            p.votes = 0;
            p.hasVoted = false;
        });

        game.phase = 'drawing';

        return {
            prompt: game.currentPrompt,
            drawingTime: game.drawingTimeSeconds,
            round: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    submitDrawing(roomId, playerId, drawingData) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };
        if (game.phase !== 'drawing') return { error: 'Not in drawing phase' };

        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found' };

        player.drawing = drawingData; // Base64 or path data
        player.hasSubmitted = true;

        const allSubmitted = game.players.every(p => p.hasSubmitted);

        return {
            submitted: true,
            allSubmitted,
            submittedCount: game.players.filter(p => p.hasSubmitted).length,
            totalPlayers: game.players.length
        };
    }

    startVotingPhase(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };

        game.phase = 'voting';

        // Return all drawings (anonymized for voting)
        const drawings = game.players
            .filter(p => p.drawing)
            .map(p => ({
                playerId: p.id,
                drawing: p.drawing
            }));

        return {
            drawings,
            prompt: game.currentPrompt
        };
    }

    submitVote(roomId, voterId, votedPlayerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };
        if (game.phase !== 'voting') return { error: 'Not in voting phase' };

        const voter = game.players.find(p => p.id === voterId);
        if (!voter) return { error: 'Voter not found' };
        if (voter.hasVoted) return { error: 'Already voted' };
        if (voterId === votedPlayerId) return { error: 'Cannot vote for yourself' };

        const votedPlayer = game.players.find(p => p.id === votedPlayerId);
        if (!votedPlayer) return { error: 'Invalid vote target' };

        voter.hasVoted = true;
        votedPlayer.votes++;

        const allVoted = game.players.every(p => p.hasVoted);

        return {
            voted: true,
            allVoted,
            votedCount: game.players.filter(p => p.hasVoted).length,
            totalPlayers: game.players.length
        };
    }

    getDrawBattleRoundResults(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };

        game.phase = 'results';

        // Award points based on votes
        game.players.forEach(p => {
            p.score += p.votes * 50; // 50 points per vote
        });

        const roundWinner = [...game.players]
            .filter(p => p.drawing)
            .sort((a, b) => b.votes - a.votes)[0];

        return {
            prompt: game.currentPrompt,
            results: game.players
                .filter(p => p.drawing)
                .sort((a, b) => b.votes - a.votes)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    drawing: p.drawing,
                    votes: p.votes,
                    points: p.votes * 50
                })),
            winner: roundWinner ? { id: roundWinner.id, name: roundWinner.name } : null,
            standings: [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ id: p.id, name: p.name, score: p.score, position: i + 1 })),
            currentRound: game.currentRound + 1,
            totalRounds: game.totalRounds
        };
    }

    nextDrawBattleRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'draw-battle') return { error: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';

            const finalRankings = [...game.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({ id: p.id, name: p.name, score: p.score, position: i + 1 }));

            return {
                finished: true,
                rankings: finalRankings,
                winner: finalRankings[0]
            };
        }

        game.currentPrompt = game.prompts[game.currentRound];
        game.phase = 'waiting';

        return {
            finished: false,
            nextRound: game.currentRound + 1
        };
    }

    // ==================== LIE DETECTOR GAME ====================
    // One player answers, others guess if it's truth or lie

    startLieDetectorGame(roomId, room, hostParticipates = true) {
        const { getRandomQuestions } = require('../data/lieDetectorQuestions');

        const players = hostParticipates
            ? room.players
            : room.players.filter(p => !p.isHost);

        const questions = getRandomQuestions(players.length * 2);

        const gameState = {
            type: 'lie-detector',
            roomId,
            questions,
            players: players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
            currentPlayerIndex: 0,
            currentQuestionIndex: 0,
            phase: 'answering', // answering, voting, reveal
            currentAnswer: null,
            isLie: null, // true if current player chose to lie
            votes: {}, // { voterId: 'truth' | 'lie' }
            scores: {},
            roundsPlayed: 0,
            totalRounds: Math.min(players.length * 2, 10)
        };

        players.forEach(p => { gameState.scores[p.id] = 0; });
        this.activeGames.set(roomId, gameState);

        return {
            gameState: this.getLieDetectorPublicState(gameState),
            currentPlayer: gameState.players[0],
            question: questions[0]
        };
    }

    getLieDetectorPublicState(game) {
        return {
            type: game.type,
            phase: game.phase,
            currentPlayer: game.players[game.currentPlayerIndex],
            question: game.questions[game.currentQuestionIndex],
            roundsPlayed: game.roundsPlayed,
            totalRounds: game.totalRounds,
            scores: game.scores,
            voteCount: Object.keys(game.votes).length,
            totalVoters: game.players.length - 1
        };
    }

    submitLieDetectorAnswer(roomId, playerId, answer, isLie) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'lie-detector') return null;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return null;

        game.currentAnswer = answer;
        game.isLie = isLie;
        game.phase = 'voting';
        game.votes = {};

        return this.getLieDetectorPublicState(game);
    }

    submitLieDetectorVote(roomId, voterId, vote) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'lie-detector') return null;

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id === voterId) return null; // Can't vote for yourself

        game.votes[voterId] = vote; // 'truth' or 'lie'

        // Check if all votes are in
        const expectedVotes = game.players.length - 1;
        if (Object.keys(game.votes).length >= expectedVotes) {
            return this.revealLieDetectorResult(roomId);
        }

        return { waiting: true, voteCount: Object.keys(game.votes).length };
    }

    revealLieDetectorResult(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        game.phase = 'reveal';
        const currentPlayer = game.players[game.currentPlayerIndex];
        const actualAnswer = game.isLie ? 'lie' : 'truth';

        // Calculate scores
        let fooledCount = 0;
        Object.entries(game.votes).forEach(([voterId, vote]) => {
            if (vote === actualAnswer) {
                // Correct guess - voter gets 100 points
                game.scores[voterId] = (game.scores[voterId] || 0) + 100;
            } else {
                // Wrong guess - subject fooled them
                fooledCount++;
            }
        });

        // Subject gets points for fooling players (50 per player fooled)
        if (fooledCount > 0) {
            game.scores[currentPlayer.id] = (game.scores[currentPlayer.id] || 0) + (fooledCount * 50);
        }
        // Bonus for fooling everyone
        if (fooledCount === game.players.length - 1) {
            game.scores[currentPlayer.id] = (game.scores[currentPlayer.id] || 0) + 100;
        }

        return {
            phase: 'reveal',
            currentPlayer,
            answer: game.currentAnswer,
            wasLie: game.isLie,
            votes: game.votes,
            fooledCount,
            scores: game.scores
        };
    }

    nextLieDetectorRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        game.roundsPlayed++;
        game.currentQuestionIndex++;
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        if (game.roundsPlayed >= game.totalRounds) {
            // Game finished
            const rankings = Object.entries(game.scores)
                .map(([id, score]) => {
                    const player = game.players.find(p => p.id === id);
                    return { ...player, score };
                })
                .sort((a, b) => b.score - a.score);

            this.activeGames.delete(roomId);
            return { finished: true, rankings, winner: rankings[0] };
        }

        game.phase = 'answering';
        game.currentAnswer = null;
        game.isLie = null;
        game.votes = {};

        return {
            finished: false,
            gameState: this.getLieDetectorPublicState(game)
        };
    }

    // ==================== SCRABBLE GAME ====================
    // Turn-based word game with board, tiles, and dictionary validation

    startScrabbleGame(roomId, room, hostParticipates = true) {
        const { createTileBag, drawTiles, BOARD_SIZE, CENTER_SQUARE } = require('../data/scrabbleData');

        const players = [];
        room.players.forEach(player => {
            if (!hostParticipates && player.isHost) return;
            players.push({
                id: player.id,
                name: player.name,
                score: 0,
                hand: [],
                isActive: true
            });
        });

        const tileBag = createTileBag();

        // Deal initial hands
        players.forEach(player => {
            player.hand = drawTiles(tileBag, 7);
        });

        const gameState = {
            type: 'scrabble',
            roomId,
            players,
            tileBag,
            board: {}, // { "x,y": { letter, value, isLocked: true} }
            currentPlayerIndex: 0,
            phase: 'playing',
            placedTiles: {}, // Temporary placements before submission: { playerId: [{x, y, letter, value}] }
            turnNumber: 1,
            passCount: 0,
            hostParticipates
        };

        this.activeGames.set(roomId, gameState);
        return gameState;
    }

    getScrabbleGameState(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return null;

        const player = game.players.find(p => p.id === playerId);
        const currentPlayer = game.players[game.currentPlayerIndex];

        return {
            board: game.board,
            myHand: player ? player.hand : [],
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                handSize: p.hand.length,
                isActive: p.isActive
            })),
            currentPlayerId: currentPlayer.id,
            currentPlayerName: currentPlayer.name,
            isMyTurn: playerId === currentPlayer.id,
            turnNumber: game.turnNumber,
            tilesInBag: game.tileBag.length,
            phase: game.phase
        };
    }

    scrabblePlaceTiles(roomId, playerId, tiles) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { error: 'Not your turn' };

        // Store temporarily placed tiles
        game.placedTiles[playerId] = tiles;

        return { success: true, tiles };
    }

    scrabbleRecallTiles(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { error: 'Not your turn' };

        game.placedTiles[playerId] = [];
        return { success: true };
    }

    scrabbleSubmitMove(roomId, playerId, tiles) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { error: 'Not your turn' };
        if (!tiles || tiles.length === 0) return { error: 'No tiles placed' };

        const { isValidWord, BONUS_SQUARES, BOARD_SIZE, CENTER_SQUARE } = require('../data/scrabbleData');

        // Validation 1: Must be in a straight line
        const xs = tiles.map(t => t.x);
        const ys = tiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1;
        const isVertical = new Set(xs).size === 1;

        if (!isHorizontal && !isVertical) {
            return { error: 'Tiles must be placed in a straight line' };
        }

        // Validation 2: First turn must touch center
        const isFirstTurn = Object.keys(game.board).length === 0;
        if (isFirstTurn) {
            const touchesCenter = tiles.some(t => t.x === CENTER_SQUARE && t.y === CENTER_SQUARE);
            if (!touchesCenter) {
                return { error: 'First word must cover the center square' };
            }
        } else {
            // Validation 3: Must connect to existing words
            const connects = tiles.some(t => {
                const neighbors = [
                    `${t.x + 1},${t.y}`, `${t.x - 1},${t.y}`,
                    `${t.x},${t.y + 1}`, `${t.x},${t.y - 1}`
                ];
                return neighbors.some(nKey => game.board[nKey] && game.board[nKey].isLocked);
            });
            if (!connects) {
                return { error: 'New tiles must connect to existing words' };
            }
        }

        // Create temporary board with placed tiles
        const tempBoard = { ...game.board };
        tiles.forEach(t => {
            tempBoard[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: false };
        });

        // Extract and validate all formed words
        const formedWords = this.extractScrabbleWords(tempBoard, tiles);

        if (formedWords.length === 0) {
            return { error: 'You must form at least one valid word' };
        }

        const invalidWords = formedWords.filter(w => !isValidWord(w.word));
        if (invalidWords.length > 0) {
            return {
                error: 'Invalid words',
                invalidWords: invalidWords.map(w => w.word)
            };
        }

        // Calculate score
        let score = 0;
        let wordMultiplier = 1;
        tiles.forEach(t => {
            let letterScore = t.value;
            const key = `${t.x},${t.y}`;
            const bonus = BONUS_SQUARES[key];

            if (bonus === 'DL') letterScore *= 2;
            if (bonus === 'TL') letterScore *= 3;
            if (bonus === 'DW') wordMultiplier *= 2;
            if (bonus === 'TW') wordMultiplier *= 3;

            score += letterScore;
        });
        score *= wordMultiplier;

        // Bonus for using all 7 tiles
        if (tiles.length === 7) score += 50;

        // Commit tiles to board
        tiles.forEach(t => {
            game.board[`${t.x},${t.y}`] = { letter: t.letter, value: t.value, isLocked: true };
        });

        // Update player score
        currentPlayer.score += score;

        // Refill hand
        const { drawTiles } = require('../data/scrabbleData');
        const newTiles = drawTiles(game.tileBag, tiles.length);

        // Remove used tiles from hand and add new ones
        const tileLetters = tiles.map(t => t.letter);
        let remainingHand = [...currentPlayer.hand];
        tileLetters.forEach(letter => {
            const idx = remainingHand.findIndex(t => t.letter === letter);
            if (idx !== -1) remainingHand.splice(idx, 1);
        });
        currentPlayer.hand = [...remainingHand, ...newTiles];

        // Clear placed tiles
        game.placedTiles[playerId] = [];
        game.passCount = 0;

        // Next turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        // Check if game should end
        if (game.tileBag.length === 0 && currentPlayer.hand.length === 0) {
            game.phase = 'finished';
            return {
                success: true,
                score,
                formedWords: formedWords.map(w => w.word),
                gameEnded: true,
                finalScores: this.getScrabbleFinalScores(game)
            };
        }

        return {
            success: true,
            score,
            formedWords: formedWords.map(w => w.word),
            nextPlayerId: game.players[game.currentPlayerIndex].id
        };
    }

    extractScrabbleWords(tempBoard, newlyPlacedTiles) {
        const { BOARD_SIZE } = require('../data/scrabbleData');
        const words = [];
        const wordSet = new Set();

        const extractWord = (x, y, isHorizontal) => {
            let word = '';
            let tiles = [];

            if (isHorizontal) {
                let startX = x;
                while (startX > 0 && tempBoard[`${startX - 1},${y}`]) startX--;
                let currentX = startX;
                while (currentX < BOARD_SIZE && tempBoard[`${currentX},${y}`]) {
                    const tile = tempBoard[`${currentX},${y}`];
                    word += tile.letter;
                    tiles.push({ x: currentX, y });
                    currentX++;
                }
            } else {
                let startY = y;
                while (startY > 0 && tempBoard[`${x},${startY - 1}`]) startY--;
                let currentY = startY;
                while (currentY < BOARD_SIZE && tempBoard[`${x},${currentY}`]) {
                    const tile = tempBoard[`${x},${currentY}`];
                    word += tile.letter;
                    tiles.push({ x, y: currentY });
                    currentY++;
                }
            }

            return { word, tiles };
        };

        const xs = newlyPlacedTiles.map(t => t.x);
        const ys = newlyPlacedTiles.map(t => t.y);
        const isHorizontal = new Set(ys).size === 1;
        const isVertical = new Set(xs).size === 1;

        if (isHorizontal) {
            const y = ys[0];
            const minX = Math.min(...xs);
            const mainWord = extractWord(minX, y, true);
            if (mainWord.word.length > 1) {
                const key = `${mainWord.word}-H-${mainWord.tiles[0].x},${mainWord.tiles[0].y}`;
                if (!wordSet.has(key)) {
                    wordSet.add(key);
                    words.push(mainWord);
                }
            }

            newlyPlacedTiles.forEach(tile => {
                const crossWord = extractWord(tile.x, tile.y, false);
                if (crossWord.word.length > 1) {
                    const key = `${crossWord.word}-V-${crossWord.tiles[0].x},${crossWord.tiles[0].y}`;
                    if (!wordSet.has(key)) {
                        wordSet.add(key);
                        words.push(crossWord);
                    }
                }
            });
        } else if (isVertical) {
            const x = xs[0];
            const minY = Math.min(...ys);
            const mainWord = extractWord(x, minY, false);
            if (mainWord.word.length > 1) {
                const key = `${mainWord.word}-V-${mainWord.tiles[0].x},${mainWord.tiles[0].y}`;
                if (!wordSet.has(key)) {
                    wordSet.add(key);
                    words.push(mainWord);
                }
            }

            newlyPlacedTiles.forEach(tile => {
                const crossWord = extractWord(tile.x, tile.y, true);
                if (crossWord.word.length > 1) {
                    const key = `${crossWord.word}-H-${crossWord.tiles[0].x},${crossWord.tiles[0].y}`;
                    if (!wordSet.has(key)) {
                        wordSet.add(key);
                        words.push(crossWord);
                    }
                }
            });
        }

        if (newlyPlacedTiles.length === 1 && words.length === 0) {
            const tile = newlyPlacedTiles[0];
            const hWord = extractWord(tile.x, tile.y, true);
            const vWord = extractWord(tile.x, tile.y, false);

            if (hWord.word.length > 1) words.push(hWord);
            if (vWord.word.length > 1) words.push(vWord);
        }

        return words;
    }

    scrabblePassTurn(roomId, playerId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { error: 'Not your turn' };

        game.passCount++;

        // Next turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        // If all players pass consecutively, end game
        if (game.passCount >= game.players.length) {
            game.phase = 'finished';
            return {
                success: true,
                gameEnded: true,
                finalScores: this.getScrabbleFinalScores(game)
            };
        }

        return { success: true, gameEnded: false };
    }

    scrabbleExchangeTiles(roomId, playerId, tileIndices) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerId) return { error: 'Not your turn' };

        if (!tileIndices || tileIndices.length === 0) {
            return { error: 'No tiles selected for exchange' };
        }

        if (game.tileBag.length < tileIndices.length) {
            return { error: 'Not enough tiles in bag to exchange' };
        }

        const { drawTiles } = require('../data/scrabbleData');

        // Get tiles to return from hand
        const tilesToReturn = tileIndices.map(idx => currentPlayer.hand[idx]).filter(Boolean);

        if (tilesToReturn.length !== tileIndices.length) {
            return { error: 'Invalid tile indices' };
        }

        // Remove exchanged tiles from hand
        const newHand = currentPlayer.hand.filter((_, idx) => !tileIndices.includes(idx));

        // Return tiles to bag and shuffle
        game.tileBag.push(...tilesToReturn);
        for (let i = game.tileBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.tileBag[i], game.tileBag[j]] = [game.tileBag[j], game.tileBag[i]];
        }

        // Draw new tiles
        const newTiles = drawTiles(game.tileBag, tileIndices.length);
        currentPlayer.hand = [...newHand, ...newTiles];

        // Reset pass count on exchange
        game.passCount = 0;

        // Advance turn
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        if (game.currentPlayerIndex === 0) game.turnNumber++;

        return {
            success: true,
            exchangedCount: tileIndices.length,
            nextPlayerId: game.players[game.currentPlayerIndex].id
        };
    }

    getScrabbleFinalScores(game) {
        return game.players
            .map(p => ({
                playerId: p.id,
                playerName: p.name,
                score: p.score
            }))
            .sort((a, b) => b.score - a.score);
    }

    endScrabbleGame(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'scrabble') return { error: 'Game not found' };

        game.phase = 'finished';
        const finalScores = this.getScrabbleFinalScores(game);

        return {
            finished: true,
            finalScores,
            winner: finalScores[0]
        };
    }
}
}

module.exports = new GameManager();
