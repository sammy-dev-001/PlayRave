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
const roomManager    = require("./managers/RoomManager");
    const gameRouter     = require("./managers/GameRouter");
    const authManager    = require("./managers/authManager");

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", mode: "playrave-server", timestamp: Date.now() });
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
function emitRoomUpdate(roomId) {
    const snapshot = roomManager.getRoomSnapshot(roomId);
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
    socket.on("join-room", ({ roomId, playerName, avatar, avatarColor, userId }) => {
        console.log("[Gateway] join-room:", roomId, playerName, userId);

        const joinResult = roomManager.joinRoom(roomId, userId, socket.id, playerName, avatar, avatarColor);
        if (joinResult.error) {
            socket.emit("error", { message: joinResult.error });
            return;
        }

        // Register/update session
        sessionManager.registerClient(userId, socket.id, { playerName, avatar, avatarColor, roomId });

        socket.join(roomId);

        // Re-bind in legacy game manager if reconnecting mid-game
        if (joinResult.isRejoin && joinResult.oldSocketId) {
            const room = roomManager.getRoom(roomId);
            if (room && (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER')) {
                gameRouter.updatePlayerSocket(roomId, joinResult.oldSocketId, socket.id);
            }
        }

        const snapshot = roomManager.getRoomSnapshot(roomId);
        socket.emit("room-joined", snapshot);
        io.to(roomId).emit("room-updated", snapshot);

        // Send game state if game in progress
        const room = roomManager.getRoom(roomId);
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
    socket.on("request-room-sync", ({ roomId, userId }) => {
        console.log("[Gateway] request-room-sync:", roomId, userId);

        const room = roomManager.getRoom(roomId);
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
        const snapshot = roomManager.getRoomSnapshot(roomId);
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
    socket.on("leave-room", ({ roomId }) => {
        console.log("[Gateway] leave-room:", roomId, socket.id);

        const userId = sessionManager.getUserIdBySocket(socket.id);

        // Cancel any pending disconnect timer
        if (userId) sessionManager.cancelDisconnect(userId);

        // Check game state BEFORE removing
        const game = gameRouter.getGameState(roomId);
        const room = roomManager.getRoom(roomId);
        const isSinglePlayer = game?.isSinglePlayer || (room?.players?.length === 1);

        const result = userId ? roomManager.removePlayer(userId) : roomManager.removePlayerBySocketId(socket.id);

        if (result && !result.roomDeleted) {
            io.to(result.roomId).emit("player-left", {
                playerName: result.removedPlayer?.name || "A player",
                userId: result.removedPlayer?.userId,
                remainingPlayers: result.room.players.length
            });
            emitRoomUpdate(result.roomId);

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
    socket.on("disconnect", () => {
        console.log("[Gateway] Socket disconnected:", socket.id);

        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;

        const session = sessionManager.getClient(userId);
        const roomId = session?.roomId;

        if (!roomId) return;

        // Mark player as away in room
        roomManager.setPlayerAway(roomId, userId, true);

        // Immediate host migration if the disconnected player was host
        const room = roomManager.getRoom(roomId);
        if (room) {
            const player = room.players.find(p => p.userId === userId);
            if (player?.isHost) {
                const migrationResult = roomManager.reassignHost(roomId);
                if (migrationResult) {
                    console.log(`[Gateway] Host disconnected in ${roomId}, migrated to ${migrationResult.newHost.name}`);
                    io.to(roomId).emit("host-changed", {
                        newHostId: migrationResult.newHost.socketId,
                        newHostName: migrationResult.newHost.name,
                        reason: "previous_host_disconnected"
                    });
                }
            }
            emitRoomUpdate(roomId);
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
        sessionManager.handleDisconnect(userId, roomId, (expiredUserId, expiredRoomId) => {
            // ── HARD DROP callback — grace period expired ──
            console.log(`[Gateway] HARD DROP: ${expiredUserId} from room ${expiredRoomId}`);

            // Skip auto-cleanup for local rooms
            if (expiredRoomId?.startsWith('local-')) {
                console.log(`[Gateway] Skipping cleanup for persistent local room: ${expiredRoomId}`);
                return;
            }

            const game = gameRouter.getGameState(expiredRoomId);
            const roomBeforeRemoval = roomManager.getRoom(expiredRoomId);
            const isSingle = game?.isSinglePlayer || (roomBeforeRemoval?.players?.length === 1);

            const result = roomManager.removePlayer(expiredUserId);

            if (result && !result.roomDeleted) {
                io.to(result.roomId).emit("player-left", {
                    playerName: result.removedPlayer?.name || "A player",
                    userId: expiredUserId,
                    remainingPlayers: result.room.players.length
                });
                emitRoomUpdate(result.roomId);

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

    socket.on("game-selected", ({ roomId, gameId }) => {
        const result = roomManager.setGameType(roomId, gameId);
        if (result.error) return socket.emit("error", { message: result.error });
        emitRoomUpdate(roomId);
    });

    socket.on("set-game-type", ({ roomId, gameType }) => {
        const result = roomManager.setGameType(roomId, gameType);
        if (result.error) return socket.emit("error", { message: result.error });
        emitRoomUpdate(roomId);
    });

    socket.on("set-custom-questions", ({ roomId, questions }) => {
        const result = roomManager.setCustomQuestions(roomId, questions);
        if (result.error) return socket.emit("error", { message: result.error });
        emitRoomUpdate(roomId);
    });

    socket.on("get-room", ({ roomId }) => {
        const snapshot = roomManager.getRoomSnapshot(roomId);
        if (snapshot) socket.emit("room-updated", snapshot);
    });

    socket.on("player-ready", ({ roomId, isReady }) => {
        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;
        const result = roomManager.setPlayerReady(roomId, userId, isReady);
        if (result.error) return socket.emit("error", { message: result.error });
        emitRoomUpdate(roomId);
    });

    socket.on("kick-player", ({ roomId, playerIdToKick }) => {
        const hostUserId = sessionManager.getUserIdBySocket(socket.id);
        if (!hostUserId) return;
        // playerIdToKick could be socketId from frontend — resolve to userId
        const targetPlayer = roomManager.getPlayerBySocketId(playerIdToKick);
        const targetUserId = targetPlayer?.userId || playerIdToKick;

        const result = roomManager.kickPlayer(roomId, hostUserId, targetUserId);
        if (result.error) return socket.emit("error", { message: result.error });

        // Notify kicked player via their socket
        if (result.kickedPlayer?.socketId) {
            io.to(result.kickedPlayer.socketId).emit("player-kicked", { roomId });
        }
        emitRoomUpdate(roomId);
    });

    // ── 7. GAME-ACTION (Future unified event) ───────────────────────
    // Eventually all game events will come through this single channel.
    socket.on("game-action", ({ roomId, eventName, payload }) => {
        const userId = sessionManager.getUserIdBySocket(socket.id);
        if (!userId) return;

        const room = roomManager.getRoom(roomId);
        if (!room?.gameType) return;

        gameRouter.handleEvent(eventName, payload, userId, roomId, io);
    });

    // ── 8. LEGACY GAME EVENTS (Bridge Interceptor) ───────────────────────
    // Captures raw legacy frontend socket emissions and forwards them to GameRouter
    socket.onAny((eventName, ...args) => {
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

        const room = roomManager.getRoom(roomId);
        if (!room?.gameType) return;

        // Forward seamlessly to the decoupled Engine
        gameRouter.handleEvent(eventName, payload, userId, roomId, io);
    });
});

// ── Server Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your phone using your computer's IP address`);
});
