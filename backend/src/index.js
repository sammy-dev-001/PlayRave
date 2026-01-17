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
const authManager = require("./managers/authManager");

// Health check endpoint for LAN mode
app.get("/health", (req, res) => {
    res.json({ status: "ok", mode: "playrave-server", timestamp: Date.now() });
});

// ==================== AUTH REST API ====================
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: "All fields required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        const result = await authManager.register(email, password, username);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.json(result);
    } catch (e) {
        console.error("Register error:", e);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const result = await authManager.login(email, password);
        if (result.error) {
            return res.status(401).json({ error: result.error });
        }
        res.json(result);
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/auth/me", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    const user = authManager.getUserByToken(token);
    if (!user) {
        return res.status(401).json({ error: "Invalid token" });
    }
    res.json({ user });
});

app.get("/api/users/:id", (req, res) => {
    const user = authManager.getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
});

app.get("/api/leaderboard", (req, res) => {
    const leaderboard = authManager.getLeaderboard(50);
    res.json({ leaderboard });
});

app.post("/api/stats/update", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "No token" });
    }
    const decoded = authManager.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const { gameType, stats } = req.body;
    const result = authManager.updateStats(decoded.id, gameType, stats);
    res.json(result);
});

// ==================== CUSTOM PACK API ====================
const customPackManager = require("./managers/customPackManager");

// Create pack
app.post("/api/packs", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = customPackManager.createPack(decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

// Get user's packs
app.get("/api/packs/mine", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const packs = customPackManager.getUserPacks(decoded.id);
    res.json({ packs });
});

// Get public packs
app.get("/api/packs/public", (req, res) => {
    const { type, limit } = req.query;
    const packs = customPackManager.getPublicPacks(type, parseInt(limit) || 50);
    res.json({ packs });
});

// Get single pack
app.get("/api/packs/:id", (req, res) => {
    const pack = customPackManager.getPack(req.params.id);
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json({ pack });
});

// Update pack
app.put("/api/packs/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = customPackManager.updatePack(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

// Delete pack
app.delete("/api/packs/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = customPackManager.deletePack(req.params.id, decoded.id);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

// Add item to pack
app.post("/api/packs/:id/items", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = customPackManager.addItem(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

// Like/unlike pack
app.post("/api/packs/:id/like", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = customPackManager.toggleLike(req.params.id, decoded.id);
    res.json(result);
});

// ==================== CHALLENGES API ====================
const challengeManager = require("./managers/challengeManager");

// Get user's challenges
app.get("/api/challenges", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const challenges = challengeManager.getUserChallenges(decoded.id);
    res.json(challenges);
});

// Claim challenge reward
app.post("/api/challenges/:id/claim", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const result = challengeManager.claimReward(decoded.id, req.params.id);
    if (result.error) return res.status(400).json({ error: result.error });

    // Add XP to user
    if (result.xp) {
        authManager.updateStats(decoded.id, 'challenge', { xp: result.xp });
    }
    res.json(result);
});

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

    // Handle game selection from GameSelectionScreen
    socket.on("game-selected", ({ roomId, gameId, gameName }) => {
        console.log("game-selected event received, roomId:", roomId, "gameId:", gameId);
        const result = roomManager.setGameType(roomId, gameId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        console.log("Game selected, emitting room-updated to room:", roomId, "with gameType:", result.room.gameType);
        io.to(roomId).emit("room-updated", result.room);
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
        } else if (gameType === "hot-seat") {
            console.log("Starting Hot Seat game for room:", roomId);
            const gameState = gameManager.startHotSeatGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            // Send game state to each player
            room.players.forEach(player => {
                const playerState = gameManager.getHotSeatGameState(roomId, player.id);
                io.to(player.id).emit("game-started", {
                    gameType: "hot-seat",
                    gameState: playerState,
                    players: room.players,
                    hostParticipates: hostParticipates || false
                });
            });
            console.log("Hot Seat game started successfully");
        } else if (gameType === "button-mash") {
            console.log("Starting Button Mash game for room:", roomId);
            const gameState = gameManager.startButtonMashGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "button-mash",
                gameState: {
                    duration: gameState.duration,
                    players: gameState.players.map(p => ({ id: p.id, name: p.name }))
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Button Mash game started successfully");
        } else if (gameType === "type-race") {
            console.log("Starting Type Race game for room:", roomId);
            const gameState = gameManager.startTypeRaceGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "type-race",
                gameState: {
                    totalRounds: gameState.totalRounds,
                    players: gameState.players.map(p => ({ id: p.id, name: p.name, score: 0 }))
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Type Race game started successfully");
        } else if (gameType === "math-blitz") {
            console.log("Starting Math Blitz game for room:", roomId);
            const gameState = gameManager.startMathBlitzGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "math-blitz",
                gameState: {
                    totalRounds: gameState.totalRounds,
                    players: gameState.players.map(p => ({ id: p.id, name: p.name, score: 0 }))
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Math Blitz game started successfully");
        } else if (gameType === "color-rush") {
            console.log("Starting Color Rush game for room:", roomId);
            const gameState = gameManager.startColorRushGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "color-rush",
                gameState: {
                    totalRounds: gameState.totalRounds,
                    players: gameState.players.map(p => ({ id: p.id, name: p.name, score: 0 }))
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Color Rush game started successfully");
        } else if (gameType === "tic-tac-toe") {
            console.log("Starting Tic-Tac-Toe Tournament for room:", roomId);
            const gameState = gameManager.startTicTacToeTournament(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "tic-tac-toe",
                gameState: {
                    players: gameState.players,
                    matches: gameState.matches.map(m => ({
                        player1: m.player1.name,
                        player2: m.player2?.name || 'BYE',
                        isBye: m.isBye
                    })),
                    roundNumber: gameState.roundNumber
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Tic-Tac-Toe Tournament started successfully");
        } else if (gameType === "draw-battle") {
            console.log("Starting Draw Battle game for room:", roomId);
            const gameState = gameManager.startDrawBattleGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "draw-battle",
                gameState: {
                    totalRounds: gameState.totalRounds,
                    players: gameState.players.map(p => ({ id: p.id, name: p.name, score: 0 }))
                },
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Draw Battle game started successfully");
        } else if (gameType === "lie-detector") {
            console.log("Starting Lie Detector game for room:", roomId);
            const result = gameManager.startLieDetectorGame(roomId, room, hostParticipates);

            if (result.error) {
                socket.emit("error", { message: result.error });
                return;
            }

            io.to(roomId).emit("game-started", {
                gameType: "lie-detector",
                gameState: result.gameState,
                currentPlayer: result.currentPlayer,
                question: result.question,
                players: room.players,
                hostParticipates: hostParticipates || false
            });
            console.log("Lie Detector game started successfully");
        } else if (gameType === "scrabble") {
            console.log("Starting Scrabble game for room:", roomId);
            const gameState = gameManager.startScrabbleGame(roomId, room, hostParticipates);

            if (gameState.error) {
                socket.emit("error", { message: gameState.error });
                return;
            }

            // Send game state to each player with their own hand
            room.players.forEach(player => {
                const playerState = gameManager.getScrabbleGameState(roomId, player.id);
                io.to(player.id).emit("game-started", {
                    gameType: "scrabble",
                    gameState: playerState,
                    hostParticipates: hostParticipates || false
                });
            });
            console.log("Scrabble game started successfully");
        }
    });

    // ==================== SCRABBLE GAME EVENTS ====================

    socket.on("scrabble-place-tiles", ({ roomId, tiles }) => {
        console.log("scrabble-place-tiles event received, roomId:", roomId, "tiles:", tiles?.length);
        const result = gameManager.scrabblePlaceTiles(roomId, socket.id, tiles);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Broadcast to all players that tiles were placed (for real-time updates)
        io.to(roomId).emit("scrabble-tiles-placed", {
            playerId: socket.id,
            tiles: result.tiles
        });
    });

    socket.on("scrabble-recall-tiles", ({ roomId }) => {
        console.log("scrabble-recall-tiles event received, roomId:", roomId);
        const result = gameManager.scrabbleRecallTiles(roomId, socket.id);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Notify all players
        io.to(roomId).emit("scrabble-tiles-recalled", {
            playerId: socket.id
        });
    });

    socket.on("scrabble-submit-move", ({ roomId, tiles }) => {
        console.log("scrabble-submit-move event received, roomId:", roomId, "tiles:", tiles?.length);
        const result = gameManager.scrabbleSubmitMove(roomId, socket.id, tiles);

        if (result.error) {
            socket.emit("error", { message: result.error, invalidWords: result.invalidWords });
            return;
        }

        // Get updated game state for all players
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerState = gameManager.getScrabbleGameState(roomId, player.id);
            io.to(player.id).emit("scrabble-move-submitted", {
                success: true,
                score: result.score,
                formedWords: result.formedWords,
                gameState: playerState,
                gameEnded: result.gameEnded,
                finalScores: result.finalScores
            });
        });

        console.log("Scrabble move submitted successfully, score:", result.score, "words:", result.formedWords);
    });

    socket.on("scrabble-pass-turn", ({ roomId }) => {
        console.log("scrabble-pass-turn event received, roomId:", roomId);
        const result = gameManager.scrabblePassTurn(roomId, socket.id);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Get updated game state for all players
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            const playerState = gameManager.getScrabbleGameState(roomId, player.id);
            io.to(player.id).emit("scrabble-turn-passed", {
                gameState: playerState,
                gameEnded: result.gameEnded,
                finalScores: result.finalScores
            });
        });
    });

    socket.on("scrabble-exchange-tiles", ({ roomId, tileIndices }) => {
        console.log("scrabble-exchange-tiles event received, roomId:", roomId, "tiles:", tileIndices?.length);
        const result = gameManager.scrabbleExchangeTiles(roomId, socket.id, tileIndices);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        // Get updated game state for the player who exchanged tiles
        const playerState = gameManager.getScrabbleGameState(roomId, socket.id);
        socket.emit("scrabble-tiles-exchanged", {
            success: true,
            gameState: playerState
        });

        // Notify other players that tiles were exchanged (turn passed)
        const room = roomManager.getRoom(roomId);
        room.players.forEach(player => {
            if (player.id !== socket.id) {
                const otherPlayerState = gameManager.getScrabbleGameState(roomId, player.id);
                io.to(player.id).emit("scrabble-turn-passed", {
                    gameState: otherPlayerState,
                    gameEnded: result.gameEnded,
                    finalScores: result.finalScores
                });
            }
        });
        console.log("Scrabble tiles exchanged successfully.");
    });

    socket.on("scrabble-end-game", ({ roomId }) => {
        console.log("scrabble-end-game event received, roomId:", roomId);
        const result = gameManager.endScrabbleGame(roomId);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("scrabble-game-ended", {
            finished: true,
            finalScores: result.finalScores,
            winner: result.winner
        });
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
        const gameState = gameManager.getRapidFireState(roomId);
        const playerScores = gameState?.playerScores || {};
        gameManager.endGame(roomId);
        io.to(roomId).emit("rapid-fire-ended", { playerScores });
    });

    // ==================== CONFESSION ROULETTE EVENTS ====================

    socket.on("confession-start", ({ roomId }) => {
        console.log("confession-start event received, roomId:", roomId);
        const room = roomManager.getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        const gameState = gameManager.startConfessionRouletteGame(roomId, room);
        io.to(roomId).emit("confession-phase-changed", {
            phase: "submission",
            data: { totalPlayers: room.players.length }
        });

        // Start submission timer
        let timeLeft = 60;
        const timerInterval = setInterval(() => {
            timeLeft--;
            io.to(roomId).emit("confession-timer-update", { seconds: timeLeft });

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // End submission phase
                const result = gameManager.endConfessionSubmission(roomId);
                if (result.totalConfessions > 0) {
                    io.to(roomId).emit("confession-reveal", {
                        confession: result.firstConfession,
                        index: 0,
                        total: result.totalConfessions
                    });
                    io.to(roomId).emit("confession-phase-changed", {
                        phase: "voting",
                        data: { totalConfessions: result.totalConfessions }
                    });

                    // Start voting timer
                    let voteTime = 30;
                    const voteInterval = setInterval(() => {
                        voteTime--;
                        io.to(roomId).emit("confession-timer-update", { seconds: voteTime });
                        if (voteTime <= 0) {
                            clearInterval(voteInterval);
                        }
                    }, 1000);
                } else {
                    io.to(roomId).emit("confession-phase-changed", {
                        phase: "final_scores",
                        data: {}
                    });
                }
            }
        }, 1000);
    });

    socket.on("confession-submit", ({ roomId, playerName, confession }) => {
        console.log("confession-submit event received, roomId:", roomId, "player:", playerName);
        const result = gameManager.submitConfession(roomId, socket.id, confession);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("confession-submission-count", {
            count: result.submittedCount,
            total: result.totalPlayers
        });

        // If everyone submitted, end submission early
        if (result.submittedCount >= result.totalPlayers) {
            const endResult = gameManager.endConfessionSubmission(roomId);
            if (endResult.totalConfessions > 0) {
                io.to(roomId).emit("confession-reveal", {
                    confession: endResult.firstConfession,
                    index: 0,
                    total: endResult.totalConfessions
                });
                io.to(roomId).emit("confession-phase-changed", {
                    phase: "voting",
                    data: { totalConfessions: endResult.totalConfessions }
                });
            }
        }
    });

    socket.on("confession-vote", ({ roomId, playerName, votedFor }) => {
        console.log("confession-vote event received, roomId:", roomId, "voter:", playerName, "votedFor:", votedFor);

        // Find the player ID by name
        const room = roomManager.getRoom(roomId);
        const votedPlayer = room?.players.find(p => p.name === votedFor);

        if (!votedPlayer) {
            socket.emit("error", { message: "Voted player not found" });
            return;
        }

        const result = gameManager.submitConfessionVote(roomId, socket.id, votedPlayer.id);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("confession-votes-update", { votedCount: result.votedCount });
    });

    socket.on("confession-next", ({ roomId }) => {
        console.log("confession-next event received, roomId:", roomId);

        // Get results for current confession
        const results = gameManager.getConfessionResults(roomId);
        const room = roomManager.getRoom(roomId);

        // Convert author ID to name
        const authorPlayer = room?.players.find(p => p.id === results?.author);
        const correctGuessersNames = results?.correctGuessers.map(id => {
            const p = room?.players.find(pl => pl.id === id);
            return p?.name || id;
        }) || [];

        // Convert scores from IDs to names
        const namedScores = {};
        if (results?.scores) {
            Object.entries(results.scores).forEach(([playerId, score]) => {
                const player = room?.players.find(p => p.id === playerId);
                namedScores[player?.name || playerId] = score;
            });
        }

        io.to(roomId).emit("confession-round-results", {
            confession: results?.confession,
            author: authorPlayer?.name || 'Unknown',
            correctGuessers: correctGuessersNames,
            fooledCount: results?.fooledCount || 0,
            scores: namedScores
        });

        // Brief delay then move to next
        setTimeout(() => {
            const nextResult = gameManager.nextConfession(roomId);

            if (nextResult.finished) {
                io.to(roomId).emit("confession-phase-changed", {
                    phase: "final_scores",
                    data: {}
                });
                io.to(roomId).emit("confession-final-scores", namedScores);
            } else {
                io.to(roomId).emit("confession-reveal", {
                    confession: nextResult.nextConfession?.confession,
                    index: nextResult.nextConfession?.index,
                    total: nextResult.nextConfession?.total
                });
                io.to(roomId).emit("confession-phase-changed", {
                    phase: "voting",
                    data: {}
                });
            }
        }, 3000);
    });

    // ==================== IMPOSTER EVENTS ====================

    socket.on("imposter-start", ({ roomId }) => {
        console.log("imposter-start event received, roomId:", roomId);
        const room = roomManager.getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        const gameState = gameManager.startImposterGame(roomId, room);

        // Notify players individually of their words
        room.players.forEach(player => {
            const playerState = gameManager.getImposterState(roomId, player.id);
            if (playerState) {
                io.to(player.socketId).emit("imposter-phase-changed", {
                    phase: 'word_reveal'
                });
                io.to(player.socketId).emit("imposter-word-assigned", {
                    word: playerState.myWord,
                    isImposter: playerState.isImposter
                });
            }
        });
    });

    socket.on("imposter-start-discussion", ({ roomId }) => {
        console.log("imposter-start-discussion event received, roomId:", roomId);
        gameManager.startImposterDiscussion(roomId);

        io.to(roomId).emit("imposter-phase-changed", {
            phase: "discussion"
        });

        // Start discussion timer
        let timeLeft = 180; // 3 minutes
        const timerInterval = setInterval(() => {
            timeLeft--;
            io.to(roomId).emit("imposter-timer-update", { seconds: timeLeft });

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // Auto move to voting? Or let host decide?
                // For now just stop timer
            }
        }, 1000);

        // Save interval to clear later if needed (simple implementation for now)
    });

    socket.on("imposter-start-voting", ({ roomId }) => {
        console.log("imposter-start-voting event received, roomId:", roomId);
        gameManager.startImposterVoting(roomId);

        io.to(roomId).emit("imposter-phase-changed", {
            phase: "voting"
        });

        // Start voting timer
        let timeLeft = 30;
        const timerInterval = setInterval(() => {
            timeLeft--;
            io.to(roomId).emit("imposter-timer-update", { seconds: timeLeft });

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // End voting
                const results = gameManager.getImposterResults(roomId);
                io.to(roomId).emit("imposter-phase-changed", {
                    phase: "results"
                });
                io.to(roomId).emit("imposter-round-results", results);
            }
        }, 1000);
    });

    socket.on("imposter-vote", ({ roomId, playerName, votedFor }) => {
        console.log("imposter-vote event received, roomId:", roomId);
        const result = gameManager.submitImposterVote(roomId, socket.id, votedFor);

        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        io.to(roomId).emit("imposter-votes-update", {
            votedCount: result.votedCount,
            totalPlayers: room.players.length
        });

        // Check if everyone voted
        if (result.votedCount >= room.players.length) {
            // End voting early
            const results = gameManager.getImposterResults(roomId); // This calculates results
            io.to(roomId).emit("imposter-phase-changed", {
                phase: "results"
            });
            io.to(roomId).emit("imposter-round-results", results);
        }
    });

    // ==================== UNPOPULAR OPINIONS EVENTS ====================

    socket.on("opinion-start", ({ roomId }) => {
        console.log("opinion-start event received, roomId:", roomId);
        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const gameState = gameManager.startUnpopularOpinionsGame(roomId, room);

        io.to(roomId).emit("opinion-phase-changed", { phase: 'waiting' });

        // Start first round immediately after a short delay
        setTimeout(() => {
            const opinion = gameManager.startOpinionRound(roomId);
            io.to(roomId).emit("opinion-phase-changed", { phase: 'opinion' });
            io.to(roomId).emit("opinion-new-round", { opinion });

            // Start timer
            let timeLeft = 15;
            const timerInterval = setInterval(() => {
                timeLeft--;
                io.to(roomId).emit("opinion-timer-update", { seconds: timeLeft });

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);

                    // Force results if time up
                    const roomNow = roomManager.getRoom(roomId);
                    const results = gameManager.updateOpinionScores(roomId, roomNow);

                    io.to(roomId).emit("opinion-phase-changed", { phase: 'results' });
                    io.to(roomId).emit("opinion-round-results", results);
                }
            }, 1000);
        }, 3000);
    });

    socket.on("opinion-vote", ({ roomId, vote }) => {
        console.log("opinion-vote event received, roomId:", roomId);

        const result = gameManager.submitOpinionVote(roomId, socket.id, vote);
        if (result.error) return;

        const room = roomManager.getRoom(roomId);

        // If everyone voted
        if (result.voteCount >= room.players.length) {
            // End round early (need to stop timer actually, but for now we just push results and frontend ignores extra timer updates or we move phases)
            // Ideally we need to store interval ID to clear it. For simple prototypes we just let it run out or rely on phase check.

            const results = gameManager.updateOpinionScores(roomId, room);
            io.to(roomId).emit("opinion-phase-changed", { phase: 'results' });
            io.to(roomId).emit("opinion-round-results", results);
        }
    });

    socket.on("opinion-next", ({ roomId }) => {
        console.log("opinion-next event received, roomId:", roomId);

        const result = gameManager.nextOpinion(roomId);

        if (result.finished) {
            io.to(roomId).emit("opinion-phase-changed", { phase: 'final' });
            io.to(roomId).emit("opinion-final-scores", result.finalScores);
        } else {
            io.to(roomId).emit("opinion-phase-changed", { phase: 'waiting' });

            setTimeout(() => {
                const opinion = gameManager.startOpinionRound(roomId);
                io.to(roomId).emit("opinion-phase-changed", { phase: 'opinion' });
                io.to(roomId).emit("opinion-new-round", { opinion });

                // Start timer again (dup logic, should refactor but this works for now)
                let timeLeft = 15;
                const timerInterval = setInterval(() => {
                    timeLeft--;
                    io.to(roomId).emit("opinion-timer-update", { seconds: timeLeft });

                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        const roomNow = roomManager.getRoom(roomId);
                        const results = gameManager.updateOpinionScores(roomId, roomNow);
                        io.to(roomId).emit("opinion-phase-changed", { phase: 'results' });
                        io.to(roomId).emit("opinion-round-results", results);
                    }
                }, 1000);
            }, 2000);
        }
    });

    // Hot Seat game events
    socket.on("hot-seat-submit-question", ({ roomId, question }) => {
        console.log("hot-seat-submit-question event received, roomId:", roomId);

        const result = gameManager.submitHotSeatQuestion(roomId, socket.id, question);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("hot-seat-question-submitted", { success: true });

        const room = roomManager.getRoom(roomId);

        // Broadcast updated state to all players
        room.players.forEach(player => {
            const playerState = gameManager.getHotSeatGameState(roomId, player.id);
            io.to(player.id).emit("hot-seat-state-update", playerState);
        });

        // If all submitted, notify everyone that answering phase has begun
        if (result.allSubmitted) {
            io.to(roomId).emit("hot-seat-answering-started");
        }
    });

    socket.on("hot-seat-next-question", ({ roomId }) => {
        console.log("hot-seat-next-question event received, roomId:", roomId);

        const result = gameManager.nextHotSeatQuestion(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        const room = roomManager.getRoom(roomId);

        if (result.finished) {
            io.to(roomId).emit("hot-seat-game-finished", { message: result.message });
        } else if (result.hotSeatPlayerId) {
            // New hot seat player
            room.players.forEach(player => {
                const playerState = gameManager.getHotSeatGameState(roomId, player.id);
                io.to(player.id).emit("hot-seat-new-player", playerState);
            });
        } else {
            // Just next question
            room.players.forEach(player => {
                const playerState = gameManager.getHotSeatGameState(roomId, player.id);
                io.to(player.id).emit("hot-seat-state-update", playerState);
            });
        }
    });

    socket.on("hot-seat-end-game", ({ roomId }) => {
        console.log("hot-seat-end-game event received, roomId:", roomId);
        gameManager.endGame(roomId);
        io.to(roomId).emit("hot-seat-game-finished", { message: "Game ended by host" });
    });

    // ==================== BUTTON MASH EVENTS ====================
    socket.on("button-mash-start", ({ roomId }) => {
        console.log("button-mash-start event received, roomId:", roomId);

        const result = gameManager.startButtonMashRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("button-mash-go", { startTime: result.startTime });
    });

    socket.on("button-mash-tap", ({ roomId }) => {
        const result = gameManager.submitButtonMashTap(roomId, socket.id);
        if (result.error) return;

        // Send back tap count to the player
        socket.emit("button-mash-tap-ack", { tapCount: result.tapCount });

        // Broadcast leaderboard update to all players
        const leaderboard = gameManager.getButtonMashLeaderboard(roomId);
        io.to(roomId).emit("button-mash-leaderboard", { leaderboard });
    });

    socket.on("button-mash-finish", ({ roomId, finalCount }) => {
        console.log("button-mash-finish event received, roomId:", roomId, "finalCount:", finalCount);

        const result = gameManager.finishButtonMashPlayer(roomId, socket.id, finalCount);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.allFinished) {
            const results = gameManager.getButtonMashResults(roomId);
            io.to(roomId).emit("button-mash-results", results);
        }
    });

    socket.on("button-mash-end-game", ({ roomId }) => {
        console.log("button-mash-end-game event received, roomId:", roomId);
        gameManager.endGame(roomId);

        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("button-mash-game-ended", { room });
    });

    // ==================== TYPE RACE EVENTS ====================
    socket.on("type-race-start-round", ({ roomId }) => {
        console.log("type-race-start-round event received, roomId:", roomId);

        const result = gameManager.startTypeRaceRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("type-race-round-start", result);
    });

    socket.on("type-race-progress", ({ roomId, progress, accuracy }) => {
        const result = gameManager.updateTypeRaceProgress(roomId, socket.id, progress, accuracy);
        if (result.error) return;

        io.to(roomId).emit("type-race-progress-update", result);
    });

    socket.on("type-race-finish", ({ roomId, typed, timeTaken }) => {
        console.log("type-race-finish event received, roomId:", roomId);

        const result = gameManager.finishTypeRaceRound(roomId, socket.id, typed, timeTaken);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("type-race-finish-ack", result);

        if (result.allFinished) {
            const roundResults = gameManager.getTypeRaceRoundResults(roomId);
            io.to(roomId).emit("type-race-round-results", roundResults);
        }
    });

    socket.on("type-race-next-round", ({ roomId }) => {
        console.log("type-race-next-round event received, roomId:", roomId);

        const result = gameManager.nextTypeRaceRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.finished) {
            io.to(roomId).emit("type-race-game-finished", result);
        } else {
            io.to(roomId).emit("type-race-next-round-ready", result);
        }
    });

    socket.on("type-race-end-game", ({ roomId }) => {
        console.log("type-race-end-game event received, roomId:", roomId);
        gameManager.endGame(roomId);

        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("type-race-game-ended", { room });
    });

    // ==================== MATH BLITZ EVENTS ====================
    socket.on("math-blitz-start-round", ({ roomId }) => {
        console.log("math-blitz-start-round event received, roomId:", roomId);

        const result = gameManager.startMathBlitzRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("math-blitz-round-start", result);
    });

    socket.on("math-blitz-answer", ({ roomId, answer }) => {
        console.log("math-blitz-answer event received, roomId:", roomId, "answer:", answer);

        const result = gameManager.submitMathBlitzAnswer(roomId, socket.id, answer);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("math-blitz-answer-result", result);

        // If someone won, notify everyone
        if (result.isWinner) {
            io.to(roomId).emit("math-blitz-round-won", {
                winnerId: socket.id,
                winnerName: result.playerName,
                correctAnswer: result.answer
            });

            // Auto-advance to results after a short delay
            setTimeout(() => {
                const roundResults = gameManager.getMathBlitzRoundResults(roomId);
                io.to(roomId).emit("math-blitz-round-results", roundResults);
            }, 1500);
        }
    });

    socket.on("math-blitz-next-round", ({ roomId }) => {
        console.log("math-blitz-next-round event received, roomId:", roomId);

        const result = gameManager.nextMathBlitzRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.finished) {
            io.to(roomId).emit("math-blitz-game-finished", result);
        } else {
            io.to(roomId).emit("math-blitz-next-round-ready", result);
        }
    });

    socket.on("math-blitz-end-game", ({ roomId }) => {
        console.log("math-blitz-end-game event received, roomId:", roomId);
        gameManager.endGame(roomId);

        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("math-blitz-game-ended", { room });
    });

    // ==================== COLOR RUSH EVENTS ====================
    socket.on("color-rush-start-round", ({ roomId }) => {
        console.log("color-rush-start-round event received, roomId:", roomId);

        const result = gameManager.startColorRushRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("color-rush-round-start", result);
    });

    socket.on("color-rush-answer", ({ roomId, colorName }) => {
        const result = gameManager.submitColorRushAnswer(roomId, socket.id, colorName);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("color-rush-answer-result", result);

        if (result.isWinner) {
            io.to(roomId).emit("color-rush-round-won", {
                winnerId: socket.id,
                winnerName: result.playerName
            });

            setTimeout(() => {
                const roundResults = gameManager.getColorRushRoundResults(roomId);
                io.to(roomId).emit("color-rush-round-results", roundResults);
            }, 1000);
        }
    });

    socket.on("color-rush-next-round", ({ roomId }) => {
        const result = gameManager.nextColorRushRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.finished) {
            io.to(roomId).emit("color-rush-game-finished", result);
        } else {
            io.to(roomId).emit("color-rush-next-round-ready", result);
        }
    });

    socket.on("color-rush-end-game", ({ roomId }) => {
        gameManager.endGame(roomId);
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("color-rush-game-ended", { room });
    });

    // ==================== TIC-TAC-TOE TOURNAMENT EVENTS ====================
    socket.on("ttt-start-match", ({ roomId }) => {
        console.log("ttt-start-match event received, roomId:", roomId);

        const result = gameManager.startTicTacToeMatch(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("ttt-match-started", result);
    });

    socket.on("ttt-make-move", ({ roomId, position }) => {
        const result = gameManager.makeTicTacToeMove(roomId, socket.id, position);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("ttt-move-made", result);

        if (result.gameOver) {
            // Auto-emit match result after a delay
            setTimeout(() => {
                io.to(roomId).emit("ttt-match-ended", {
                    winner: result.winner,
                    isDraw: result.isDraw,
                    board: result.board
                });
            }, 1500);
        } else if (result.isAITurn) {
            // AI's turn - make AI move after realistic "thinking" delay (1-2 seconds)
            const thinkingTime = 1000 + Math.random() * 1000;
            io.to(roomId).emit("ttt-ai-thinking", { thinking: true });

            setTimeout(() => {
                const aiResult = gameManager.makeAITicTacToeMove(roomId);
                if (!aiResult.error) {
                    io.to(roomId).emit("ttt-move-made", aiResult);

                    if (aiResult.gameOver) {
                        setTimeout(() => {
                            io.to(roomId).emit("ttt-match-ended", {
                                winner: aiResult.winner,
                                isDraw: aiResult.isDraw,
                                board: aiResult.board
                            });
                        }, 1500);
                    }
                }
            }, thinkingTime);
        }
    });

    socket.on("ttt-next-match", ({ roomId }) => {
        const result = gameManager.nextTicTacToeMatch(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.finished) {
            io.to(roomId).emit("ttt-tournament-finished", result);
        } else if (result.roundComplete) {
            io.to(roomId).emit("ttt-round-complete", result);
        } else {
            io.to(roomId).emit("ttt-next-match-ready", result);
        }
    });

    socket.on("ttt-end-game", ({ roomId }) => {
        gameManager.endGame(roomId);
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("ttt-game-ended", { room });
    });

    // ==================== DRAW BATTLE EVENTS ====================
    socket.on("draw-battle-start-round", ({ roomId }) => {
        console.log("draw-battle-start-round event received, roomId:", roomId);

        const result = gameManager.startDrawBattleRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        io.to(roomId).emit("draw-battle-round-started", result);
    });

    socket.on("draw-battle-submit-drawing", ({ roomId, drawingData }) => {
        const result = gameManager.submitDrawing(roomId, socket.id, drawingData);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("draw-battle-drawing-submitted", result);
        io.to(roomId).emit("draw-battle-submission-update", {
            submittedCount: result.submittedCount,
            totalPlayers: result.totalPlayers
        });

        if (result.allSubmitted) {
            const votingData = gameManager.startVotingPhase(roomId);
            io.to(roomId).emit("draw-battle-voting-started", votingData);
        }
    });

    socket.on("draw-battle-start-voting", ({ roomId }) => {
        const result = gameManager.startVotingPhase(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }
        io.to(roomId).emit("draw-battle-voting-started", result);
    });

    socket.on("draw-battle-vote", ({ roomId, votedPlayerId }) => {
        const result = gameManager.submitVote(roomId, socket.id, votedPlayerId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        socket.emit("draw-battle-vote-submitted", result);

        if (result.allVoted) {
            const roundResults = gameManager.getDrawBattleRoundResults(roomId);
            io.to(roomId).emit("draw-battle-round-results", roundResults);
        }
    });

    socket.on("draw-battle-next-round", ({ roomId }) => {
        const result = gameManager.nextDrawBattleRound(roomId);
        if (result.error) {
            socket.emit("error", { message: result.error });
            return;
        }

        if (result.finished) {
            io.to(roomId).emit("draw-battle-game-finished", result);
        } else {
            io.to(roomId).emit("draw-battle-next-round-ready", result);
        }
    });

    socket.on("draw-battle-end-game", ({ roomId }) => {
        gameManager.endGame(roomId);
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("draw-battle-game-ended", { room });
    });

    // ==================== LIE DETECTOR GAME EVENTS ====================
    socket.on("lie-detector-submit-answer", ({ roomId, answer, isLie }) => {
        console.log("lie-detector-submit-answer:", roomId, "isLie:", isLie);
        const result = gameManager.submitLieDetectorAnswer(roomId, socket.id, answer, isLie);
        if (result) {
            io.to(roomId).emit("lie-detector-voting-started", {
                gameState: result,
                answer
            });
        }
    });

    socket.on("lie-detector-submit-vote", ({ roomId, vote }) => {
        console.log("lie-detector-submit-vote:", roomId, "vote:", vote);
        const result = gameManager.submitLieDetectorVote(roomId, socket.id, vote);
        if (!result) return;

        if (result.waiting) {
            io.to(roomId).emit("lie-detector-vote-received", { voteCount: result.voteCount });
        } else {
            io.to(roomId).emit("lie-detector-reveal", result);
        }
    });

    socket.on("lie-detector-next-round", ({ roomId }) => {
        console.log("lie-detector-next-round:", roomId);
        const result = gameManager.nextLieDetectorRound(roomId);
        if (!result) return;

        if (result.finished) {
            io.to(roomId).emit("lie-detector-game-finished", result);
        } else {
            io.to(roomId).emit("lie-detector-next-round-ready", result);
        }
    });

    socket.on("lie-detector-end-game", ({ roomId }) => {
        gameManager.endGame(roomId);
        const room = roomManager.getRoom(roomId);
        io.to(roomId).emit("lie-detector-game-ended", { room });
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your phone using your computer's IP address`);
});
