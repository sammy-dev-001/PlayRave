const sessionManager = require("../managers/SessionManager");
const roomManager    = require("../managers/roomManager");
const gameRouter     = require("../managers/GameRouter");

module.exports = function configureSocketGateway(io) {
    async function emitRoomUpdate(roomId) {
        const snapshot = await roomManager.getRoomSnapshot(roomId);
        if (snapshot) {
            io.to(roomId).emit("room-updated", snapshot);
        }
    }

    io.on("connection", (socket) => {
        console.log("[Gateway] Socket connected:", socket.id);

        socket.on("create-room", ({ playerName, avatar, avatarColor, userId }) => {
            console.log("[Gateway] create-room:", playerName, userId);
            sessionManager.registerClient(userId, socket.id, { playerName, avatar, avatarColor });
            const room = roomManager.createRoom(userId, socket.id, playerName, avatar, avatarColor);
            sessionManager.setRoom(userId, room.id);
            socket.join(room.id);
            socket.emit("room-created", roomManager.getRoomSnapshot(room.id));
        });

        socket.on("join-room", async ({ roomId, playerName, avatar, avatarColor, userId }) => {
            console.log("[Gateway] join-room:", roomId, playerName, userId);
            const joinResult = await roomManager.joinRoom(roomId, userId, socket.id, playerName, avatar, avatarColor);
            if (joinResult.error) {
                socket.emit("error", { message: joinResult.error });
                return;
            }
            sessionManager.registerClient(userId, socket.id, { playerName, avatar, avatarColor, roomId });
            socket.join(roomId);

            if (joinResult.isRejoin && joinResult.oldSocketId) {
                const room = await roomManager.getRoom(roomId);
                if (room && (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER')) {
                    gameRouter.updatePlayerSocket(roomId, joinResult.oldSocketId, socket.id);
                }
            }

            const snapshot = await roomManager.getRoomSnapshot(roomId);
            socket.emit("room-joined", snapshot);
            io.to(roomId).emit("room-updated", snapshot);

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

        socket.on("check-room", ({ roomId }) => {
            const exists = !!(roomId && roomManager.rooms && roomManager.rooms.has(roomId));
            socket.emit("check-room-result", { roomId, exists });
        });

        socket.on("request-room-sync", async ({ roomId, userId }) => {
            console.log("[Gateway] request-room-sync:", roomId, userId);
            const room = await roomManager.getRoom(roomId);
            if (!room) {
                socket.emit("error", { message: "Room not found during sync" });
                return;
            }
            const sessionResult = sessionManager.updateSocket(userId, socket.id);
            const oldSocketId = sessionResult?.oldSocketId;
            const roomResult = roomManager.updatePlayerSocket(roomId, userId, socket.id);
            if (!roomResult) {
                socket.emit("error", { message: "Session expired or player not found" });
                return;
            }
            sessionManager.cancelDisconnect(userId);
            socket.join(roomId);

            if (oldSocketId) {
                gameRouter.updatePlayerSocket(roomId, oldSocketId, socket.id);
            }

            const snapshot = await roomManager.getRoomSnapshot(roomId);
            socket.emit("room-updated", snapshot);
            io.to(roomId).emit("room-updated", snapshot);

            if (room.gameState === 'PLAYING' || room.gameState === 'GAMEOVER') {
                const gameState = gameRouter.getGameState(roomId);
                if (gameState) {
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

            io.to(roomId).emit("player-reconnected", { playerName: roomResult.player.name, userId });
            io.to(roomId).emit("player-returned", { playerName: roomResult.player.name, userId });
        });

        socket.on("leave-room", async ({ roomId }) => {
            console.log("[Gateway] leave-room:", roomId, socket.id);
            const userId = sessionManager.getUserIdBySocket(socket.id);
            if (userId) sessionManager.cancelDisconnect(userId);

            const game = await gameRouter.getGameState(roomId);
            const room = await roomManager.getRoom(roomId);
            const isSinglePlayer = game?.isSinglePlayer || (room?.players?.length === 1);

            const result = userId ? await roomManager.removePlayer(userId) : await roomManager.removePlayerBySocketId(socket.id);

            if (result && !result.roomDeleted) {
                await gameRouter.removePlayer(result.roomId, userId || result.removedPlayer?.userId, io);
                io.to(result.roomId).emit("player-left", {
                    playerName: result.removedPlayer?.name || "A player",
                    userId: result.removedPlayer?.userId,
                    remainingPlayers: result.room.players.length
                });
                await emitRoomUpdate(result.roomId);

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
            if (userId) sessionManager.purgeClient(userId);
            socket.leave(roomId);
        });

        socket.on("disconnect", async () => {
            console.log("[Gateway] Socket disconnected:", socket.id);
            const userId = sessionManager.getUserIdBySocket(socket.id);
            if (!userId) return;

            const session = sessionManager.getClient(userId);
            const roomId = session?.roomId;
            if (!roomId) return;

            await roomManager.setPlayerAway(roomId, userId, true);
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

            io.to(roomId).emit("player-connection-lost", { playerName: session.playerName, userId });
            io.to(roomId).emit("player-away", { playerName: session.playerName, userId });

            sessionManager.handleDisconnect(userId, roomId, async (expiredUserId, expiredRoomId) => {
                console.log(`[Gateway] HARD DROP: ${expiredUserId} from room ${expiredRoomId}`);
                if (expiredRoomId?.startsWith('local-')) return;

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
                    const game = await gameRouter.getGameState(expiredRoomId);
                    if (game) {
                        gameRouter.clearTimer(expiredRoomId);
                        gameRouter.endGame(expiredRoomId);
                    }
                }
            });
        });

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
            const targetPlayer = roomManager.getPlayerBySocketId(playerIdToKick) || roomManager.getPlayerByUserId(playerIdToKick);
            const targetUserId = targetPlayer?.userId || playerIdToKick;

            const result = await roomManager.kickPlayer(roomId, hostUserId, targetUserId);
            if (result.error) return socket.emit("error", { message: result.error });

            if (result.kickedPlayer?.socketId) {
                const kickedSocket = io.sockets.sockets.get(result.kickedPlayer.socketId);
                if (kickedSocket) kickedSocket.leave(roomId);
                io.to(result.kickedPlayer.socketId).emit("player-kicked", { roomId, userId: targetUserId });
            }
            io.to(roomId).emit("player-kicked", { roomId, userId: targetUserId });
            await emitRoomUpdate(roomId);
        });

        socket.on("send-reaction", ({ roomId, emoji, playerName }) => {
            io.to(roomId).emit("reaction-received", { emoji, senderId: socket.id, playerName });
        });

        socket.on("game-action", async ({ roomId, eventName, payload }) => {
            const userId = sessionManager.getUserIdBySocket(socket.id);
            if (!userId) return;
            const room = await roomManager.getRoom(roomId);
            if (!room?.gameType) return;
            gameRouter.handleEvent(eventName, payload, userId, roomId, io);
        });

        socket.onAny(async (eventName, ...args) => {
            const coreEvents = [
                "create-room", "join-room", "request-room-sync", "leave-room", "disconnect", 
                "game-selected", "set-game-type", "set-custom-questions", "get-room", 
                "player-ready", "kick-player", "game-action"
            ];
            if (coreEvents.includes(eventName)) return;
            
            const payload = args[0] || {};
            const roomId = payload.roomId;
            if (!roomId) return;

            const userId = sessionManager.getUserIdBySocket(socket.id);
            if (!userId) return;

            const room = await roomManager.getRoom(roomId);
            if (!room?.gameType) return;

            gameRouter.handleEvent(eventName, payload, userId, roomId, io);
        });

        socket.on("scrabble-single-player-start", ({ difficulty, playerName }) => {
            console.log("[Gateway] Starting Scrabble AI Game:", playerName, difficulty);
            const userId = sessionManager.getUserIdBySocket(socket.id) || `local-user-${socket.id}`;
            const roomId = `local-${userId}`;

            sessionManager.registerClient(userId, socket.id, { playerName });
            sessionManager.setRoom(userId, roomId);

            const room = roomManager.createLocalRoom(roomId, userId, socket.id, playerName || "Player 1");
            room.gameType = 'scrabble';
            roomManager.setGameState(roomId, 'PLAYING');

            socket.join(roomId);
            gameRouter.startGame('scrabble', room, { isSinglePlayer: true, difficulty: difficulty || 'medium', hostParticipates: true }, io);
        });

        socket.on('chat-message', ({ roomId, text }) => {
            const userId = sessionManager.getUserIdBySocket(socket.id);
            const user = sessionManager.getClient(userId);
            if (!userId || !roomId) return;

            const message = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                userId, userName: user?.playerName || 'Player', text, type: 'text', timestamp: Date.now()
            };
            io.to(roomId).emit('chat-message-received', message);
        });

        socket.on('chat-reaction', ({ roomId, emoji }) => {
            const userId = sessionManager.getUserIdBySocket(socket.id);
            const user = sessionManager.getClient(userId);
            if (!userId || !roomId) return;

            const message = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                userId, userName: user?.playerName || 'Player', emoji, type: 'reaction', timestamp: Date.now()
            };
            io.to(roomId).emit('chat-message-received', message);
        });

        socket.on("tic-tac-toe-single-player-start", ({ difficulty, playerName }) => {
            console.log("[Gateway] Starting Tic-Tac-Toe AI Game:", playerName, difficulty);
            const userId = sessionManager.getUserIdBySocket(socket.id) || `local-user-${socket.id}`;
            const roomId = `local-${userId}`;

            sessionManager.registerClient(userId, socket.id, { playerName });
            sessionManager.setRoom(userId, roomId);

            const room = roomManager.createLocalRoom(roomId, userId, socket.id, playerName || "Player 1");
            room.gameType = 'tic-tac-toe';
            roomManager.setGameState(roomId, 'PLAYING');

            socket.join(roomId);
            gameRouter.startGame('tic-tac-toe', room, { isSinglePlayer: true, difficulty: difficulty || 'medium', hostParticipates: true }, io);
        });
    });
};
