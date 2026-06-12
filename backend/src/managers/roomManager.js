// ============================================================================
// RoomManager.js — Lobby, Room State & Host Migration (userId-keyed)
// ============================================================================
// ALL player arrays use the PERSISTENT userId as primary key.
// socket.id is stored per-player only so the Gateway can emit to them.
// ============================================================================

const dbHelper = require('../db');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    async _getCollection() {
        return await dbHelper.getCollection('rooms');
    }

    async _saveToDb(room) {
        try {
            const roomsCollection = await this._getCollection();
            if (!roomsCollection) return;

            // Strip circular or unnecessary socket objects before saving
            const persistableRoom = {
                ...room,
                lastActivity: new Date(),
                // We keep player data but socketIds are transient
            };

            await roomsCollection.updateOne(
                { id: room.id },
                { $set: persistableRoom },
                { upsert: true }
            );
        } catch (e) {
            console.error(`[RoomManager] DB Save Error for room ${room.id}:`, e);
        }
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
        this._saveToDb(room); // Async fire-and-forget
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
        this._saveToDb(room);
        return room;
    }

    async joinRoom(roomId, userId, socketId, playerName, avatar, avatarColor) {
        let room = this.rooms.get(roomId);

        if (!room) {
            // Attempt to restore from DB
            const roomsCollection = await this._getCollection();
            const dbRoom = await roomsCollection.findOne({ id: roomId });
            if (dbRoom) {
                console.log(`[RoomManager] Restored room ${roomId} from MongoDB`);
                room = dbRoom;
                this.rooms.set(roomId, room);
            }
        }

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

        this._saveToDb(room);
        return { room, isRejoin: false, oldSocketId: null };
    }

    removePlayer(userId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const index = room.players.findIndex(p => p.userId === userId);
            if (index === -1) continue;

            const removedPlayer = room.players.splice(index, 1)[0];

            if (room.players.length === 0) {
                this.rooms.delete(roomId);
                this._removeFromDb(roomId);
                return { roomId, roomDeleted: true, removedPlayer };
            }

            if (removedPlayer.isHost) {
                this._migrateHost(room);
            }

            this._saveToDb(room);
            return { roomId, roomDeleted: false, room, removedPlayer };
        }
        return null;
    }

    async _removeFromDb(roomId) {
        try {
            const roomsCollection = await this._getCollection();
            if (roomsCollection) {
                await roomsCollection.deleteOne({ id: roomId });
            }
        } catch (e) {
            console.error(`[RoomManager] DB Delete Error for room ${roomId}:`, e);
        }
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
            this._saveToDb(room);
            return { roomId, roomDeleted: false, room, removedPlayer };
        }
        return null;
    }

    async kickPlayer(roomId, hostUserId, targetUserId) {
        const room = await this.getRoom(roomId);
        if (!room) return { error: 'Room not found' };

        if (room.hostUserId !== hostUserId) {
            return { error: 'Only the host can kick players' };
        }

        const result = this.removePlayer(targetUserId);
        if (!result) return { error: 'Player not found in room' };

        return {
            success: true,
            kickedPlayer: result.removedPlayer,
            room: result.room,
            roomDeleted: result.roomDeleted
        };
    }

    // ── Lookups ─────────────────────────────────────────────────────────

    async getRoom(roomId) {
        let room = this.rooms.get(roomId);
        if (!room) {
            const roomsCollection = await this._getCollection();
            const dbRoom = await roomsCollection.findOne({ id: roomId });
            if (dbRoom) {
                room = dbRoom;
                this.rooms.set(roomId, room);
            }
        }
        return room || null;
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
        this._saveToDb(room);
        return { room, player, oldSocketId };
    }

    setPlayerAway(roomId, userId, isAway) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const player = room.players.find(p => p.userId === userId);
        if (player) player.isAway = isAway;
        this._saveToDb(room);
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
        this._saveToDb(room);
        return { room, newHost };
    }

    // ── Game State Helpers ──────────────────────────────────────────────

    setGameType(roomId, gameType) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        room.gameType = gameType;
        this._saveToDb(room);
        return { room };
    }

    setCustomQuestions(roomId, questions) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        room.customQuestions = questions;
        this._saveToDb(room);
        return { room };
    }

    setPlayerReady(roomId, userId, isReady) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };
        const player = room.players.find(p => p.userId === userId);
        if (!player) return { error: 'Player not found' };
        player.isReady = isReady;
        this._saveToDb(room);
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
        this._saveToDb(room);
        return { room, kickedPlayer: kicked };
    }

    setGameState(roomId, state) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        room.gameState = state;
        this._saveToDb(room);
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
