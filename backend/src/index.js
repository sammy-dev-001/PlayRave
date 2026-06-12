// ============================================================================
// index.js — The Socket Gateway (Thin Entry Point)
// ============================================================================
// This file handles ONLY:
//   1. Express setup + REST API routes
//   2. Raw socket connection / disconnect / request-sync
//   3. Lobby events (create, join, leave, ready, kick, game-select)
//   4. A catch-all "game-action" event → GameRouter
//   5. Legacy game events → forwarded to gameManager (bridge period)
//
// NO game-specific logic belongs here. That lives in GameRouter + Engines.
// ============================================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 30000,
});

// ── Manager Imports ─────────────────────────────────────────────────────
const sessionManager = require("./managers/SessionManager");
const roomManager    = require("./managers/roomManager");
    const gameRouter     = require("./managers/GameRouter");
    const authManager    = require("./managers/authManager");
    const ScrabbleAIEngine = require('./ai/ScrabbleAIEngine');

// Health check
app.get(["/health", "/api/health"], (req, res) => {
    // console.log("[Health] Ping received at", new Date().toISOString());
    res.json({ status: "ok", mode: "playrave-server", timestamp: Date.now() });
});

// Global Error Handlers (Prevention of Process Crashes)
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    // Keep process alive if possible, but log it
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep process alive
});

// ==================== AUTH REST API ====================
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) return res.status(400).json({ error: "All fields required" });
        if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
        const result = await authManager.register(email, password, username);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (e) { console.error("Register error:", e); res.status(500).json({ error: "Server error" }); }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });
        const result = await authManager.login(email, password);
        if (result.error) return res.status(401).json({ error: result.error });
        res.json(result);
    } catch (e) { console.error("Login error:", e); res.status(500).json({ error: "Server error" }); }
});

app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    const user = await authManager.getUserByToken(token);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    res.json({ user });
});

app.get("/api/users/:id", async (req, res) => {
    const user = await authManager.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
});

app.get("/api/leaderboard", async (req, res) => {
    const leaderboard = await authManager.getLeaderboard(50);
    res.json({ leaderboard });
});

app.post("/api/stats/update", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const { gameType, stats } = req.body;
    const result = await authManager.updateStats(decoded.id, gameType, stats);
    res.json(result);
});

// ==================== CUSTOM PACK API ====================
const customPackManager = require("./managers/customPackManager");

app.post("/api/packs", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.createPack(decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

app.get("/api/packs/mine", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json({ packs: customPackManager.getUserPacks(decoded.id) });
});

app.get("/api/packs/public", (req, res) => {
    const { type, limit } = req.query;
    res.json({ packs: customPackManager.getPublicPacks(type, parseInt(limit) || 50) });
});

app.get("/api/packs/:id", (req, res) => {
    const pack = customPackManager.getPack(req.params.id);
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json({ pack });
});

app.put("/api/packs/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.updatePack(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

app.delete("/api/packs/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.deletePack(req.params.id, decoded.id);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

app.post("/api/packs/:id/items", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.addItem(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

app.post("/api/packs/:id/like", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json(customPackManager.toggleLike(req.params.id, decoded.id));
});

// ==================== CHALLENGES API ====================
const challengeManager = require("./managers/challengeManager");

app.get("/api/challenges", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json(challengeManager.getUserChallenges(decoded.id));
});

app.post("/api/challenges/:id/claim", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = challengeManager.claimReward(decoded.id, req.params.id);
    if (result.error) return res.status(400).json({ error: result.error });
    if (result.xp) authManager.updateStats(decoded.id, 'challenge', { xp: result.xp });
    res.json(result);
});

// ============================================================================
// SOCKET GATEWAY — The thin connection layer
// ============================================================================

/**
 * Helper: emit room snapshot to all clients in a room.
 * Uses getRoomSnapshot() for backwards-compatible format.
 */
async function emitRoomUpdate(roomId) {
    const snapshot = await roomManager.getRoomSnapshot(roomId);
    if (snapshot) {
        io.to(roomId).emit("room-updated", snapshot);
    }
}

io.on("connection", (socket) => {
    console.log("[Gateway] Socket connected:", socket.id);

    // ── 1. CREATE ROOM ──────────────────────────────────────────────
    socket.on("create-room", ({ playerName, avatar, avatarColor, userId }) => {
        console.log("[Gateway] create-room:", playerName, userId);

        // Register session
        sessionManager.registerClient(userId, socket.id, { playerName, avatar, avatarColor });

        // Create room
        const room = roomManager.createRoom(userId, socket.id, playerName, avatar, avatarColor);
        sessionManager.setRoom(userId, room.id);

        socket.join(room.id);
        socket.emit("room-created", roomManager.getRoomSnapshot(room.id));
    });

    // ── 2. JOIN ROOM ────────────────────────────────────────────────
    socket.on("join-room", async ({ roomId, playerName, avatar, avatarColor, userId }) => {
        console.log("[Gateway] join-room:", roomId, playerName, userId);

        const joinResult = await roomManager.joinRoom(roomId, userId, socket.id, playerName, avatar, avatarColor);
        if (joinResult.error) {
            socket.emit("error", { message: joinResult.error });
            return;
        }

        // Register/update session
        sessionManager.registerClient(userId, socket.id, { playerName, avatar, avatarColor, roomId });

        socket.join(roomId);

        // Re-bind in legacy game manager if reconnecting mid-game
        if (joinResult.isRejoin && joinResult.oldSocketId) {
            const room = await roomManager.getRoom(roomId);
            if (room && (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER')) {
                gameRouter.updatePlayerSocket(roomId, joinResult.oldSocketId, socket.id);
            }
        }

        const snapshot = await roomManager.getRoomSnapshot(roomId);
        socket.emit("room-joined", snapshot);
        io.to(roomId).emit("room-updated", snapshot);

        // Send game state if game in progress
        const room = await roomManager.getRoom(roomId);
        if (room && (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER')) {
            const gameState = gameRouter.getGameState(roomId);
            if (gameState) {
                socket.emit("game-state-sync", {
                    gameState,
                    gameType: room.gameType,
                    timestamp: Date.now()
                });
            }
        }
    });

    // ── 3. REQUEST-SYNC (Reconnect / Tab Wake) ──────────────────────
    socket.on("request-room-sync", async ({ roomId, userId }) => {
        console.log("[Gateway] request-room-sync:", roomId, userId);

        const room = await roomManager.getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found during sync" });
            return;
        }

        // Update session socket binding
        const sessionResult = sessionManager.updateSocket(userId, socket.id);
        const oldSocketId = sessionResult?.oldSocketId;

        // Update room player socket binding
        const roomResult = roomManager.updatePlayerSocket(roomId, userId, socket.id);
        if (!roomResult) {
            socket.emit("error", { message: "Session expired or player not found" });
            return;
        }

        // Cancel any pending grace timer
        sessionManager.cancelDisconnect(userId);

        socket.join(roomId);

        // Re-bind in legacy game manager
        if (oldSocketId) {
            gameRouter.updatePlayerSocket(roomId, oldSocketId, socket.id);
        }

        // Push room state
        const snapshot = await roomManager.getRoomSnapshot(roomId);
        socket.emit("room-updated", snapshot);
        io.to(roomId).emit("room-updated", snapshot);

        // Push game state if playing
        if (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER') {
            const gameState = gameRouter.getGameState(roomId);
            if (gameState) {
                // Inject active timer for Confession Roulette
                if (room.gameType === 'confession-roulette' && room.confessionTimeLeft !== undefined) {
                    gameState.currentTimer = room.confessionTimeLeft;
                }
                socket.emit("game-state-sync", {
                    gameState,
                    gameType: room.gameType,
                    timestamp: Date.now()
                });
            }
        }

        // Notify room that player returned
        io.to(roomId).emit("player-reconnected", {
            playerName: roomResult.player.name,
            userId
        });

        // Also emit player-returned for UI avatar restoration
        io.to(roomId).emit("player-returned", {
            playerName: roomResult.player.name,
            userId
        });
    });

    // ── 4. LEAVE ROOM ───────────────────────────────────────────────
    socket.on("leave-room", async ({ roomId }) => {
        console.log("[Gateway] leave-room:", roomId, socket.id);

        const userId = sessionManager.getUserIdBySocket(socket.id);

        // Cancel any pending disconnect timer
        if (userId) sessionManager.cancelDisconnect(userId);

        // Check game state BEFORE removing
        const game = await gameRouter.getGameState(roomId);
        const room = await roomManager.getRoom(roomId);
        const isSinglePlayer = game?.isSinglePlayer || (room?.players?.length === 1);

        const result = userId ? await roomManager.removePlayer(userId) : await roomManager.removePlayerBySocketId(socket.id);

        if (result && !result.roomDeleted) {
            // Notify the game engine about the removal
            await gameRouter.removePlayer(result.roomId, userId || result.removedPlayer?.userId, io);

            io.to(result.roomId).emit("player-left", {
                playerName: result.removedPlayer?.name || "A player",
                userId: result.removedPlayer?.userId,
                remainingPlayers: result.room.players.length
            });
            await emitRoomUpdate(result.roomId);

            // End game if not enough players (skip for single-player)
            if (game && !isSinglePlayer) {
                const minPlayers = gameRouter.getMinPlayers(game.type) || 2;
                if (result.room.players.length < minPlayers) {
                    io.to(result.roomId).emit("game-ended-insufficient-players", {
                        message: "Game ended - not enough players remaining",
                        finalScores: game.scores || {}
                    });
                    gameRouter.clearTimer(result.roomId);
                    gameRouter.endGame(result.roomId);
                }
            }
        } else if (result?.roomDeleted) {
            if (game) {
                gameRouter.clearTimer(roomId);
                gameRouter.endGame(roomId);
            }
        }

        // Purge session and leave socket room
        if (userId) sessionManager.purgeClient(userId);
        socket.leave(roomId);
    });

    // ── 5. DISCONNECT (Browser tab sleep / close) ───────────────────
    socket.on("disconnect", async () => {
        console.log("[Gateway] Socket disconnected:", socket.id);

        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;

        const session = sessionManager.getClient(userId);
        const roomId = session?.roomId;

        if (!roomId) return;

        // Mark player as away in room
        await roomManager.setPlayerAway(roomId, userId, true);

        // Immediate host migration if the disconnected player was host
        const room = await roomManager.getRoom(roomId);
        if (room) {
            const player = room.players.find(p => p.userId === userId);
            if (player?.isHost) {
                const migrationResult = await roomManager.reassignHost(roomId);
                if (migrationResult) {
                    console.log(`[Gateway] Host disconnected in ${roomId}, migrated to ${migrationResult.newHost.name}`);
                    io.to(roomId).emit("host-changed", {
                        newHostId: migrationResult.newHost.socketId,
                        newHostName: migrationResult.newHost.name,
                        reason: "previous_host_disconnected"
                    });
                }
            }
            await emitRoomUpdate(roomId);
        }

        // Notify room that player is away
        io.to(roomId).emit("player-connection-lost", {
            playerName: session.playerName,
            userId
        });

        // Also emit player-away for UI greying
        io.to(roomId).emit("player-away", {
            playerName: session.playerName,
            userId
        });

        // Start the 10-minute grace period via SessionManager
        sessionManager.handleDisconnect(userId, roomId, async (expiredUserId, expiredRoomId) => {
            // ── HARD DROP callback — grace period expired ──
            console.log(`[Gateway] HARD DROP: ${expiredUserId} from room ${expiredRoomId}`);

            // Skip auto-cleanup for local rooms
            if (expiredRoomId?.startsWith('local-')) {
                console.log(`[Gateway] Skipping cleanup for persistent local room: ${expiredRoomId}`);
                return;
            }

            const result = await roomManager.removePlayer(expiredUserId);

            if (result?.roomId) {
                const game = await gameRouter.getGameState(result.roomId);
                await gameRouter.removePlayer(result.roomId, expiredUserId, io);
                
                io.to(result.roomId).emit("player-left", {
                    userId: expiredUserId,
                    playerName: result.removedPlayer.name,
                    isHost: result.removedPlayer.isHost,
                    remainingPlayers: result.room.players.length
                });
                await emitRoomUpdate(result.roomId);

                const isSingle = game?.isSinglePlayer || (result.room?.players?.length === 1);

                if (game && !isSingle) {
                    const minPlayers = gameRouter.getMinPlayers(game.type) || 2;
                    if (result.room.players.length < minPlayers) {
                        io.to(result.roomId).emit("game-ended-insufficient-players", {
                            message: "Game ended - not enough players remaining",
                            finalScores: game.scores || {}
                        });
                        gameRouter.clearTimer(result.roomId);
                        gameRouter.endGame(result.roomId);
                    }
                }
            } else if (result?.roomDeleted) {
                if (game) {
                    gameRouter.clearTimer(expiredRoomId);
                    gameRouter.endGame(expiredRoomId);
                }
            }
        });
    });

    // ── 6. LOBBY EVENTS ─────────────────────────────────────────────

    socket.on("game-selected", async ({ roomId, gameId, gameType }) => {
        const idToSet = gameId || gameType;
        const result = await roomManager.setGameType(roomId, idToSet);
        if (result.error) return socket.emit("error", { message: result.error });
        await emitRoomUpdate(roomId);
    });

    socket.on("set-game-type", async ({ roomId, gameType }) => {
        const result = await roomManager.setGameType(roomId, gameType);
        if (result.error) return socket.emit("error", { message: result.error });
        await emitRoomUpdate(roomId);
    });

    socket.on("set-custom-questions", async ({ roomId, questions }) => {
        const result = await roomManager.setCustomQuestions(roomId, questions);
        if (result.error) return socket.emit("error", { message: result.error });
        await emitRoomUpdate(roomId);
    });

    socket.on("get-room", async ({ roomId }) => {
        const snapshot = await roomManager.getRoomSnapshot(roomId);
        if (snapshot) socket.emit("room-updated", snapshot);
    });

    socket.on("player-ready", async ({ roomId, isReady }) => {
        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;
        const result = await roomManager.setPlayerReady(roomId, userId, isReady);
        if (result.error) return socket.emit("error", { message: result.error });
        await emitRoomUpdate(roomId);
    });

    socket.on("kick-player", async ({ roomId, playerIdToKick }) => {
        const hostUserId = sessionManager.getUserIdBySocket(socket.id);
        if (!hostUserId) return;

        // Find the player by the ID provided (could be socketId or userId)
        const targetPlayer = roomManager.getPlayerBySocketId(playerIdToKick) || roomManager.getPlayerByUserId(playerIdToKick);
        const targetUserId = targetPlayer?.userId || playerIdToKick;

        const result = await roomManager.kickPlayer(roomId, hostUserId, targetUserId);
        if (result.error) return socket.emit("error", { message: result.error });

        // 1. Tell the SPECIFIC socket to leave (best effort)
        if (result.kickedPlayer?.socketId) {
            const kickedSocket = io.sockets.sockets.get(result.kickedPlayer.socketId);
            if (kickedSocket) {
                kickedSocket.leave(roomId);
            }
            io.to(result.kickedPlayer.socketId).emit("player-kicked", { roomId, userId: targetUserId });
        }

        // 2. Broadcast to the ROOM that this specific userId was kicked (failsafe)
        // This ensures the frontend on the kicked player's side catches it even if socketId changed.
        io.to(roomId).emit("player-kicked", { roomId, userId: targetUserId });

        await emitRoomUpdate(roomId);
    });

    // ── 6.5 REACTIONS ───────────────────────────────────────────────────
    socket.on("send-reaction", ({ roomId, emoji, playerName }) => {
        io.to(roomId).emit("reaction-received", { emoji, senderId: socket.id, playerName });
    });

    // ── 7. GAME-ACTION (Future unified event) ───────────────────────
    // Eventually all game events will come through this single channel.
    socket.on("game-action", async ({ roomId, eventName, payload }) => {
        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;

        const room = await roomManager.getRoom(roomId);
        if (!room?.gameType) return;

        gameRouter.handleEvent(eventName, payload, userId, roomId, io);
    });

    // ── 8. LEGACY GAME EVENTS (Bridge Interceptor) ───────────────────────
    // Captures raw legacy frontend socket emissions and forwards them to GameRouter
    socket.onAny(async (eventName, ...args) => {
        const coreEvents = [
            "create-room", "join-room", "request-room-sync", "leave-room", "disconnect", 
            "game-selected", "set-game-type", "set-custom-questions", "get-room", 
            "player-ready", "kick-player", "game-action"
        ];
        
        if (coreEvents.includes(eventName)) return; // Don't intercept core networking events
        
        const payload = args[0] || {};
        const roomId = payload.roomId;
        if (!roomId) return;

        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;

        const room = await roomManager.getRoom(roomId);
        if (!room?.gameType) return;

        // Forward seamlessly to the decoupled Engine
        gameRouter.handleEvent(eventName, payload, userId, roomId, io);
    });

    // ── 9. SINGLE PLAYER / AI EVENTS ─────────────────────────────────────
    
    socket.on("scrabble-single-player-start", ({ difficulty, playerName }) => {
        console.log("[Gateway] Starting Scrabble AI Game:", playerName, difficulty);
        
        // Use existing userId or create a temporary one for this session
        const userId = sessionManager.getUserIdBySocket(socket.id) || `local-user-${socket.id}`;
        const roomId = `local-${socket.id}`;

        // Ensure session and room mapping
        sessionManager.registerClient(userId, socket.id, { playerName });
        sessionManager.setRoom(userId, roomId);

        // Create the persistent local room
        const room = roomManager.createLocalRoom(roomId, userId, socket.id, playerName || "Player 1");
        room.gameType = 'scrabble';
        room.gameState = 'PLAYING';

        socket.join(roomId);

        // Delegate to GameRouter to initialize the Engine
        gameRouter.startGame('scrabble', room, { 
            isSinglePlayer: true, 
            difficulty: difficulty || 'medium',
            hostParticipates: true
        }, io);
        
        console.log(`[Gateway] Scrabble AI game initialized in room ${roomId}`);
    });

    socket.on("tic-tac-toe-single-player-start", ({ difficulty, playerName }) => {
        console.log("[Gateway] Starting Tic-Tac-Toe AI Game:", playerName, difficulty);
        
        const userId = sessionManager.getUserIdBySocket(socket.id) || `local-user-${socket.id}`;
        const roomId = `local-${socket.id}`;

        sessionManager.registerClient(userId, socket.id, { playerName });
        sessionManager.setRoom(userId, roomId);

        const room = roomManager.createLocalRoom(roomId, userId, socket.id, playerName || "Player 1");
        room.gameType = 'tic-tac-toe';
        room.gameState = 'PLAYING';

        socket.join(roomId);

        gameRouter.startGame('tic-tac-toe', room, { 
            isSinglePlayer: true, 
            difficulty: difficulty || 'medium',
            hostParticipates: true
        }, io);
        
        console.log(`[Gateway] Tic-Tac-Toe AI game initialized in room ${roomId}`);
    });
});

// ==================== GRACEFUL SHUTDOWN ====================
async function handleShutdown(signal) {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
        console.log('[Server] HTTP server closed.');
    });

    try {
        // Save all active rooms to DB one last time
        if (roomManager && roomManager.rooms) {
            const rooms = roomManager.rooms;
            if (rooms.size > 0) {
                console.log(`[Server] Saving ${rooms.size} rooms before exit...`);
                for (const [id, room] of rooms) {
                    await roomManager._saveToDb(room);
                }
            }
        }
        
        // Save all live game states (cards, board positions, etc.)
        if (gameRouter) {
            await gameRouter.saveAllGames();
        }

        console.log('[Server] Graceful shutdown complete.');
        process.exit(0);
    } catch (err) {
        console.error('[Server] Error during shutdown:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ── Server Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your phone using your computer's IP address`);
    
    // Warm up AI engines (Commented out to save memory on Render Free Tier)
    // ScrabbleAIEngine.warmUp();
});
