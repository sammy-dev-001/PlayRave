// ============================================================================
// RoomManager.js — Lobby, Room State & Host Migration (userId-keyed)
// ============================================================================
// ALL player arrays use the PERSISTENT userId as primary key.
// socket.id is stored per-player only so the Gateway can emit to them.
// ============================================================================

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (this.rooms.has(code)) return this.generateRoomCode();
        return code;
    }

    // ── Room CRUD ───────────────────────────────────────────────────────

    createRoom(userId, socketId, playerName, avatar, avatarColor) {
        const roomId = this.generateRoomCode();
        const room = {
            id: roomId,
            hostUserId: userId,
            gameState: 'LOBBY',
            gameType: null,
            customQuestions: null,
            currentRound: 0,
            players: [{
                userId, socketId, name: playerName,
                avatar: avatar || '😎', avatarColor: avatarColor || '#6C63FF',
                score: 0, isHost: true, isReady: true, isAway: false,
            }],
        };
        this.rooms.set(roomId, room);
        console.log(`[RoomManager] Room ${roomId} created by ${playerName} (${userId})`);
        return room;
    }

    createLocalRoom(roomId, userId, socketId, playerName, avatar, avatarColor) {
        const room = {
            id: roomId,
            hostUserId: userId,
            gameState: 'LOBBY',
            gameType: null,
            customQuestions: null,
            currentRound: 0,
            players: [{
                userId, socketId, name: playerName,
                avatar: avatar || '😎', avatarColor: avatarColor || '#6C63FF',
                score: 0, isHost: true, isReady: true, isAway: false,
            }],
        };
        this.rooms.set(roomId, room);
        return room;
    }

    joinRoom(roomId, userId, socketId, playerName, avatar, avatarColor) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };

        const existing = room.players.find(p => p.userId === userId);

        if (existing) {
            const oldSocketId = existing.socketId;
            existing.socketId = socketId;
            existing.isAway = false;
            if (playerName) existing.name = playerName;
            if (avatar) existing.avatar = avatar;
            if (avatarColor) existing.avatarColor = avatarColor;
            return { room, isRejoin: true, oldSocketId };
        }

        if (room.gameState !== 'LOBBY') {
            return { error: 'Game already in progress' };
        }

        room.players.push({
            userId, socketId, name: playerName,
            avatar: avatar || '😎', avatarColor: avatarColor || '#6C63FF',
            score: 0, isHost: false, isReady: false, isAway: false,
        });

        return { room, isRejoin: false, oldSocketId: null };
    }

    removePlayer(userId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const index = room.players.findIndex(p => p.userId === userId);
            if (index === -1) continue;

            const removedPlayer = room.players.splice(index, 1)[0];

            if (room.players.length === 0) {
                this.rooms.delete(roomId);
                return { roomId, roomDeleted: true, removedPlayer };
            }

            if (removedPlayer.isHost) {
                this._migrateHost(room);
            }

            return { roomId, roomDeleted: false, room, removedPlayer };
        }
        return null;
    }

    removePlayerBySocketId(socketId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const index = room.players.findIndex(p => p.socketId === socketId);
            if (index === -1) continue;

            const removedPlayer = room.players.splice(index, 1)[0];

            if (room.players.length === 0) {
                this.rooms.delete(roomId);
                return { roomId, roomDeleted: true, removedPlayer };
            }

            if (removedPlayer.isHost) this._migrateHost(room);
            return { roomId, roomDeleted: false, room, removedPlayer };
        }
        return null;
    }

    // ── Lookups ─────────────────────────────────────────────────────────

    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    getPlayerByUserId(userId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const player = room.players.find(p => p.userId === userId);
            if (player) return { ...player, roomId };
        }
        return null;
    }

    getPlayerBySocketId(socketId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const player = room.players.find(p => p.socketId === socketId);
            if (player) return { ...player, roomId };
        }
        return null;
    }

    // ── Socket Re-binding ───────────────────────────────────────────────

    updatePlayerSocket(roomId, userId, newSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.userId === userId);
        if (!player) return null;

        const oldSocketId = player.socketId;
        player.socketId = newSocketId;
        player.isAway = false;

        if (player.isHost) room.hostUserId = userId;
        return { room, player, oldSocketId };
    }

    setPlayerAway(roomId, userId, isAway) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const player = room.players.find(p => p.userId === userId);
        if (player) player.isAway = isAway;
        return room;
    }

    // ── Host Migration ──────────────────────────────────────────────────

    reassignHost(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        return this._migrateHost(room);
    }

    _migrateHost(room) {
        room.players.forEach(p => { p.isHost = false; });
        const newHost = room.players.find(p => !p.isAway) || room.players[0];
        if (!newHost) return null;

        newHost.isHost = true;
        room.hostUserId = newHost.userId;
        console.log(`[RoomManager] Host migrated to ${newHost.name} (${newHost.userId}) in room ${room.id}`);
        return { room, newHost };
    }

    // ── Game State Helpers ──────────────────────────────────────────────

    setGameType(roomId, gameType) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        room.gameType = gameType;
        return { room };
    }

    setCustomQuestions(roomId, questions) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        room.customQuestions = questions;
        return { room };
    }

    setPlayerReady(roomId, userId, isReady) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        const player = room.players.find(p => p.userId === userId);
        if (!player) return { error: 'Player not found' };
        player.isReady = isReady;
        return { room };
    }

    kickPlayer(roomId, hostUserId, targetUserId) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        if (room.hostUserId !== hostUserId) return { error: 'Only host can kick players' };
        if (hostUserId === targetUserId) return { error: 'Host cannot kick themselves' };

        const index = room.players.findIndex(p => p.userId === targetUserId);
        if (index === -1) return { error: 'Player not found' };

        const kicked = room.players.splice(index, 1)[0];
        return { room, kickedPlayer: kicked };
    }

    setGameState(roomId, state) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        room.gameState = state;
        return room;
    }

    /**
     * Backwards-compatible snapshot for the frontend.
     * Maps internal userId-keyed format → legacy id/uid format.
     */
    getRoomSnapshot(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            id: room.id,
            hostId: room.players.find(p => p.isHost)?.socketId || room.players[0]?.socketId,
            hostUserId: room.hostUserId,
            gameState: room.gameState,
            gameType: room.gameType,
            customQuestions: room.customQuestions,
            currentRound: room.currentRound,
            players: room.players.map(p => ({
                id: p.socketId,
                uid: p.userId,
                name: p.name,
                avatar: p.avatar,
                avatarColor: p.avatarColor,
                score: p.score,
                isHost: p.isHost,
                isReady: p.isReady,
                isDisconnected: p.isAway,
                isAway: p.isAway,
            })),
        };
    }
}

module.exports = new RoomManager();
