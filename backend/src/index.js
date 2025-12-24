const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// basic socket flow
const roomManager = require("./managers/roomManager");
const gameManager = require("./managers/gameManager");

io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("create-room", ({ playerName, avatar, avatarColor }) => {
        console.log("create-room event received, playerName:", playerName);
        const room = roomManager.createRoom(socket.id, playerName, avatar, avatarColor);
        console.log("Room created:", room);
        socket.join(room.id);
        console.log("Emitting room-created event to socket", socket.id);
        socket.emit("room-created", room);
    });

    socket.on("join-room", ({ roomId, playerName, avatar, avatarColor }) => {
        console.log("join-room event received, roomId:", roomId, "playerName:", playerName, "socketId:", socket.id);
        const result = roomManager.joinRoom(roomId, socket.id, playerName, avatar, avatarColor);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        socket.join(roomId);
        console.log("Player", playerName, "joined socket room:", roomId);
        socket.emit("room-joined", result.room);
        io.to(roomId).emit("room-updated", result.room);
        console.log("Emitted room-joined and room-updated for player join");
    });

    socket.on("leave-room", ({ roomId }) => {
        console.log("leave-room event received, roomId:", roomId, "socketId:", socket.id);
        const result = roomManager.removePlayer(socket.id);
        if (result && !result.roomDeleted) {
            console.log("Player left, emitting room-updated to remaining players");
            io.to(result.roomId).emit("room-updated", result.room);
        } else if (result && result.roomDeleted) {
            console.log("Room deleted as last player left");
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);

        // Add a grace period before removing player (helps with mobile reconnects)
        const DISCONNECT_GRACE_PERIOD = 10000; // 10 seconds

        setTimeout(() => {
            // Check if this socket has reconnected (same player might have new socket)
            // For now, just remove after the grace period
            const result = roomManager.removePlayer(socket.id);
            if (result && !result.roomDeleted) {
                console.log("Player removed after grace period:", socket.id);
                io.to(result.roomId).emit("room-updated", result.room);
            }
        }, DISCONNECT_GRACE_PERIOD);
    });

    socket.on("set-game-type", ({ roomId, gameType }) => {
        console.log("set-game-type event received, roomId:", roomId, "gameType:", gameType);
        const result = roomManager.setGameType(roomId, gameType);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        console.log("Emitting room-updated to room:", roomId, "with gameType:", result.room.gameType);
        console.log("Room has", result.room.players.length, "players");
        io.to(roomId).emit("room-updated", result.room);
    });

    socket.on("set-custom-questions", ({ roomId, questions }) => {
        console.log("set-custom-questions event received, roomId:", roomId, "questions count:", questions.length);
        const result = roomManager.setCustomQuestions(roomId, questions);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        console.log("Custom questions saved, emitting room-updated");
        io.to(roomId).emit("room-updated", result.room);
    });

    socket.on("get-room", ({ roomId }) => {
        console.log("get-room event received, roomId:", roomId, "from socket:", socket.id);
        const room = roomManager.getRoom(roomId);
        if (room) {
            console.log("Sending room-updated to socket:", socket.id, "gameType:", room.gameType);
            socket.emit("room-updated", room);
        } else {
            console.log("Room not found:", roomId);
        }
    });

    socket.on("player-ready", ({ roomId, isReady }) => {
        console.log("player-ready event received, roomId:", roomId, "isReady:", isReady);
        const result = roomManager.setPlayerReady(roomId, socket.id, isReady);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        io.to(roomId).emit("room-updated", result.room);
    });

    socket.on("kick-player", ({ roomId, playerIdToKick }) => {
        console.log("kick-player event received, roomId:", roomId, "playerToKick:", playerIdToKick);
        const result = roomManager.kickPlayer(roomId, socket.id, playerIdToKick);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        // Notify the kicked player
        io.to(playerIdToKick).emit("player-kicked", { roomId });
        // Update all other players
        io.to(roomId).emit("room-updated", result.room);
    });

    // Game events
    socket.on("start-game", ({ roomId, gameType, hostParticipates, category }) => {
        console.log("start-game event received, roomId:", roomId, "gameType:", gameType, "hostParticipates:", hostParticipates, "category:", category);
        const room = roomManager.getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        if (gameType === "trivia") {
            const gameState = gameManager.startTriviaGame(roomId, room, hostParticipates, category);
            const question = gameManager.getCurrentQuestion(roomId);
            io.to(roomId).emit("game-started", {
                gameType: "trivia",
                question,
                hostParticipates: hostParticipates || false
            });
        } else if (gameType === "myth-or-fact") {
            const gameState = gameManager.startMythOrFactGame(roomId, room, hostParticipates);
            const statement = gameManager.getCurrentStatement(roomId);
            io.to(roomId).emit("game-started", {
                gameType: "myth-or-fact",
                statement,
                hostParticipates: hostParticipates || false
            });
        } else if (gameType === "whos-most-likely") {
            const gameState = gameManager.startWhosMostLikelyGame(roomId, room, hostParticipates);
            const prompt = gameManager.getCurrentPrompt(roomId);
            io.to(roomId).emit("game-started", {
                gameType: "whos-most-likely",
                prompt,
                players: room.players, // Send player list for voting options
                hostParticipates: hostParticipates || false
            });
        } else if (gameType === "neon-tap") {
            const gameState = gameManager.startNeonTapGame(roomId, room, hostParticipates);
            io.to(roomId).emit("game-started", {
                gameType: "neon-tap",
                hostParticipates: hostParticipates || false
            });
        } else if (gameType === "word-rush") {
            const gameState = gameManager.startWordRushGame(roomId, room, hostParticipates);
            io.to(roomId).emit("game-started", {
                gameType: "word-rush",
                hostParticipates: hostParticipates || false
            });
        } else if (gameType === "whot") {
            console.log("Starting Whot game for room:", roomId);
            const gameState = gameManager.startWhotGame(roomId, room, hostParticipates);
            console.log("Whot game state created:", gameState);

            if (gameState.error) {
                console.log("Error starting Whot game:", gameState.error);
                socket.emit("error", { message: gameState.error });
                return;
            }

            // Send game state to ALL players (including spectators)
            console.log("Sending game state to all", room.players.length, "players");
            room.players.forEach(player => {
                const playerGameState = gameManager.getWhotGameState(roomId, player.id);
                console.log("Sending to player", player.name, "(", player.id, "):", playerGameState);
                io.to(player.id).emit("game-started", {
                    gameType: "whot",
                    gameState: playerGameState,
                    hostParticipates: hostParticipates || false
                });
            });
            console.log("Whot game started successfully");
        } else if (gameType === "truth-or-dare") {
            console.log("Starting Truth or Dare game for room:", roomId, "category:", category);
            const gameState = gameManager.startTruthOrDareGame(roomId, room, hostParticipates, category || 'normal');

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            // Send game state to ALL players with their personalized view
            room.players.forEach(player => {
                const playerGameState = gameManager.getTruthOrDareGameState(roomId, player.id);
                io.to(player.id).emit("game-started", {
                    gameType: "truth-or-dare",
                    gameState: playerGameState,
                    players: room.players,
                    hostParticipates: hostParticipates || false
                });
            });
            console.log("Truth or Dare game started successfully");
        } else if (gameType === "never-have-i-ever") {
            console.log("Starting Never Have I Ever game for room:", roomId, "category:", category);
            const gameState = gameManager.startNeverHaveIEverGame(roomId, room, category || 'normal');

            // Send game state to all players
            io.to(roomId).emit("game-started", {
                gameType: "never-have-i-ever",
                gameState: gameManager.getNeverHaveIEverState(roomId),
                players: room.players
            });
            console.log("Never Have I Ever game started successfully");
        } else if (gameType === "rapid-fire") {
            console.log("Starting Rapid Fire game for room:", roomId, "category:", category);
            const gameState = gameManager.startRapidFireGame(roomId, room, category || 'normal');

            // Send game state to all players
            io.to(roomId).emit("game-started", {
                gameType: "rapid-fire",
                gameState: gameManager.getRapidFireState(roomId),
                players: room.players
            });
            console.log("Rapid Fire game started successfully");
        }
    });

    socket.on("submit-answer", ({ roomId, answerIndex }) => {
        console.log("submit-answer event received, roomId:", roomId, "answer:", answerIndex);
        const result = gameManager.submitAnswer(roomId, socket.id, answerIndex);
        if (result.error) {
            socket.emit("error", { message: result.error });
        } else {
            socket.emit("vote-submitted", { success: true });
        }
    });

    socket.on("show-results", ({ roomId }) => {
        console.log("show-results event received, roomId:", roomId);
        const results = gameManager.getQuestionResults(roomId);
        if (results) {
            io.to(roomId).emit("question-results", results);
        } else {
            socket.emit("error", { message: "Results not found" });
        }
    });

    socket.on("next-question", ({ roomId }) => {
        console.log("next-question event received, roomId:", roomId);
        const result = gameManager.nextQuestion(roomId);

        if (result.error) {
            socket.emit("error", { message: result.error });
        } else if (result.finished) {
            const finalScores = gameManager.getFinalScores(roomId);
            io.to(roomId).emit("game-finished", { finalScores });
        } else {
            io.to(roomId).emit("next-question-ready", { question: result.nextQuestion });
        }
    });

    // Myth or Fact game events
    socket.on("submit-myth-or-fact-answer", ({ roomId, answer }) => {
        console.log("submit-myth-or-fact-answer event received, roomId:", roomId, "answer:", answer);
        const result = gameManager.submitMythOrFactAnswer(roomId, socket.id, answer);
        if (result.error) {
            socket.emit("error", { message: result.error });
        } else {
            socket.emit("vote-submitted", { success: true });
        }
    });

    socket.on("show-myth-or-fact-results", ({ roomId }) => {
        console.log("show-myth-or-fact-results event received, roomId:", roomId);
        const results = gameManager.getMythOrFactResults(roomId);
        if (results) {
            io.to(roomId).emit("myth-or-fact-results", results);
        } else {
            socket.emit("error", { message: "Results not found" });
        }
    });

    socket.on("next-myth-or-fact-statement", ({ roomId }) => {
        console.log("next-myth-or-fact-statement event received, roomId:", roomId);
        const result = gameManager.nextMythOrFactStatement(roomId);

        if (result.error) {
            socket.emit("error", { message: result.error });
        } else if (result.finished) {
            const finalScores = gameManager.getFinalScores(roomId);
            io.to(roomId).emit("game-finished", { finalScores });
        } else {
            io.to(roomId).emit("next-myth-or-fact-statement-ready", { statement: result.statement });
        }
    });

    // Who's Most Likely game events
    socket.on("submit-whos-most-likely-vote", ({ roomId, votedForPlayerId }) => {
        console.log("submit-whos-most-likely-vote event received, roomId:", roomId, "votedFor:", votedForPlayerId);
        const result = gameManager.submitWhosMostLikelyVote(roomId, socket.id, votedForPlayerId);
        if (result.error) {
            socket.emit("error", { message: result.error });
        } else {
            socket.emit("vote-submitted", { success: true });
        }
    });

    socket.on("show-whos-most-likely-results", ({ roomId }) => {
        console.log("show-whos-most-likely-results event received, roomId:", roomId);
        const results = gameManager.getWhosMostLikelyResults(roomId);
        io.to(roomId).emit("whos-most-likely-results", results);
    });

    socket.on("next-whos-most-likely-prompt", ({ roomId }) => {
        console.log("next-whos-most-likely-prompt event received, roomId:", roomId);
        const result = gameManager.nextWhosMostLikelyPrompt(roomId);

        if (result.finished) {
            const finalScores = gameManager.getFinalScores(roomId);
            io.to(roomId).emit("game-finished", { finalScores });
        } else {
            io.to(roomId).emit("next-whos-most-likely-prompt-ready", { prompt: result.prompt });
        }
    });

    // Neon Tap Frenzy game events
    socket.on("start-neon-tap-round", ({ roomId }) => {
        console.log("start-neon-tap-round event received, roomId:", roomId);
        const roundData = gameManager.startNewRound(roomId);
        if (roundData) {
            io.to(roomId).emit("neon-tap-round-started", roundData);
        }
    });

    socket.on("submit-neon-tap", ({ roomId, reactionTime }) => {
        console.log("submit-neon-tap event received, roomId:", roomId, "reactionTime:", reactionTime);
        const result = gameManager.submitTap(roomId, socket.id, reactionTime);
        if (result.error) {
            socket.emit("error", { message: result.error });
        } else {
            socket.emit("tap-submitted", { success: true });
        }
    });

    socket.on("show-neon-tap-results", ({ roomId }) => {
        console.log("show-neon-tap-results event received, roomId:", roomId);
        const results = gameManager.getNeonTapResults(roomId);
        io.to(roomId).emit("neon-tap-results", results);
    });

    socket.on("next-neon-tap-round", ({ roomId }) => {
        console.log("next-neon-tap-round event received, roomId:", roomId);
        const result = gameManager.nextNeonTapRound(roomId);

        if (result.finished) {
            const finalScores = gameManager.getFinalScores(roomId);
            io.to(roomId).emit("game-finished", { finalScores });
        } else {
            io.to(roomId).emit("neon-tap-ready-for-next");
        }
    });

    // Word Rush game events
    socket.on("start-word-rush-round", ({ roomId }) => {
        console.log("start-word-rush-round event received, roomId:", roomId);
        const roundData = gameManager.startWordRushRound(roomId);
        console.log("Word Rush round data:", roundData);
        if (roundData && roundData.letter) {
            io.to(roomId).emit("word-rush-round-started", roundData);
            console.log("Emitted word-rush-round-started with letter:", roundData.letter);
        } else {
            console.error("ERROR: Round data missing or no letter!", roundData);
        }
    });

    socket.on("submit-word-rush-word", ({ roomId, word }) => {
        console.log("submit-word-rush-word event received, roomId:", roomId, "word:", word);
        const submitTime = Date.now();
        const result = gameManager.submitWord(roomId, socket.id, word, submitTime);
        if (result.error) {
            socket.emit("error", { message: result.error });
        } else {
            socket.emit("word-submitted", { success: true, isValid: result.isValid });
        }
    });

    socket.on("show-word-rush-results", ({ roomId }) => {
        console.log("show-word-rush-results event received, roomId:", roomId);
        const results = gameManager.getWordRushResults(roomId);
        io.to(roomId).emit("word-rush-results", results);
    });

    socket.on("next-word-rush-round", ({ roomId, eliminated }) => {
        console.log("next-word-rush-round event received, roomId:", roomId, "eliminated:", eliminated);
        const result = gameManager.nextWordRushRound(roomId, eliminated);

        if (result.finished) {
            // Send winner announcement
            io.to(roomId).emit("word-rush-winner", { winner: result.winner });
        } else {
            io.to(roomId).emit("word-rush-ready-for-next");
        }
    });

    // Whot card game events
    socket.on("play-whot-card", ({ roomId, cardId, calledShape }) => {
        console.log("play-whot-card event received, roomId:", roomId, "cardId:", cardId);
        const result = gameManager.playWhotCard(roomId, socket.id, cardId, calledShape);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Log winner detection
        if (result.winner) {
            console.log("*** WINNER DETECTED ***:", result.winner);
        }

        // Broadcast updated game state to all players
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerGameState = gameManager.getWhotGameState(roomId, player.id);
            console.log("Sending whot state to", player.name, "winner in state:", playerGameState?.winner, "result.winner:", result.winner);
            io.to(player.id).emit("whot-card-played", {
                gameState: playerGameState,
                action: result.action,
                winner: result.winner
            });
        });
    });

    socket.on("draw-whot-card", ({ roomId }) => {
        console.log("draw-whot-card event received, roomId:", roomId);
        const result = gameManager.drawWhotCards(roomId, socket.id, 1);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Broadcast updated game state to ALL players
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerGameState = gameManager.getWhotGameState(roomId, player.id);
            io.to(player.id).emit("whot-card-drawn", {
                gameState: playerGameState,
                cardsDrawn: result.cardsDrawn
            });
        });
    });

    // Truth or Dare events
    socket.on("choose-truth-or-dare", ({ roomId, choice }) => {
        console.log("choose-truth-or-dare event received, roomId:", roomId, "choice:", choice);
        const result = gameManager.chooseTruthOrDare(roomId, socket.id, choice);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Send prompt only to current player, status update to everyone
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerGameState = gameManager.getTruthOrDareGameState(roomId, player.id);
            io.to(player.id).emit("truth-or-dare-chosen", {
                gameState: playerGameState
            });
        });
    });

    socket.on("complete-truth-or-dare-turn", ({ roomId }) => {
        console.log("complete-truth-or-dare-turn event received, roomId:", roomId);
        const result = gameManager.completeTruthOrDareTurn(roomId, socket.id);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Notify all players of the turn change
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerGameState = gameManager.getTruthOrDareGameState(roomId, player.id);
            io.to(player.id).emit("truth-or-dare-turn-complete", {
                gameState: playerGameState,
                turnCount: result.turnCount
            });
        });
    });

    socket.on("end-truth-or-dare", ({ roomId }) => {
        console.log("end-truth-or-dare event received, roomId:", roomId);
        gameManager.endGame(roomId);
        io.to(roomId).emit("truth-or-dare-ended");
    });

    // Never Have I Ever events
    socket.on("nhie-respond", ({ roomId, hasDoneIt }) => {
        console.log("nhie-respond event received, roomId:", roomId, "hasDoneIt:", hasDoneIt);
        const result = gameManager.respondNeverHaveIEver(roomId, socket.id, hasDoneIt);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Broadcast updated state to all players
        io.to(roomId).emit("nhie-response", {
            playerId: socket.id,
            hasDoneIt,
            playerScores: result.playerScores,
            playerResponses: result.playerResponses,
            allResponded: result.allResponded
        });
    });

    socket.on("nhie-next-round", ({ roomId }) => {
        console.log("nhie-next-round event received, roomId:", roomId);
        const result = gameManager.nextNeverHaveIEverRound(roomId);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Check if game is finished (30 rounds reached)
        if (result.finished) {
            io.to(roomId).emit("nhie-finished", {
                playerScores: result.playerScores,
                roundNumber: result.roundNumber,
                maxRounds: result.maxRounds
            });
            return;
        }

        io.to(roomId).emit("nhie-new-round", {
            currentPrompt: result.currentPrompt,
            roundNumber: result.roundNumber,
            maxRounds: result.maxRounds,
            playerResponses: result.playerResponses
        });
    });

    socket.on("end-nhie", ({ roomId }) => {
        console.log("end-nhie event received, roomId:", roomId);
        gameManager.endGame(roomId);
        io.to(roomId).emit("nhie-ended");
    });

    // Rapid Fire events
    socket.on("rapid-fire-answer", ({ roomId, answered }) => {
        console.log("rapid-fire-answer event received, roomId:", roomId, "answered:", answered);
        const result = gameManager.answerRapidFire(roomId, socket.id, answered);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Broadcast updated state to all players
        io.to(roomId).emit("rapid-fire-update", {
            newQuestion: result.newQuestion,
            currentPlayerId: result.currentPlayerId,
            playerScores: result.playerScores,
            roundNumber: result.roundNumber
        });
    });

    socket.on("end-rapid-fire", ({ roomId }) => {
        console.log("end-rapid-fire event received, roomId:", roomId);
        gameManager.endGame(roomId);
        io.to(roomId).emit("rapid-fire-ended");
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your phone using your computer's IP address`);
});
