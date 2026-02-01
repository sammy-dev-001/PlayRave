class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    generateRoomCode() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let code = "";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Simple collision check (for MVP recursion is fine, for prod use better algo)
        if (this.rooms.has(code)) return this.generateRoomCode();
        return code;
    }

    createRoom(hostId, playerName, avatar, avatarColor) {
        const roomId = this.generateRoomCode();
        const newRoom = {
            id: roomId,
            hostId: hostId,
            players: [
                { id: hostId, name: playerName, score: 0, isHost: true, avatar, avatarColor, isReady: true }
            ],
            gameState: 'LOBBY', // LOBBY, PLAYING, RESULTS
            currentRound: 0,
            gameType: null,
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId, playerId, playerName, avatar, avatarColor) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        if (room.gameState !== 'LOBBY') return { error: "Game already in progress" };

        const playerExists = room.players.find(p => p.id === playerId);
        if (!playerExists) {
            room.players.push({ id: playerId, name: playerName, score: 0, isHost: false, avatar, avatarColor, isReady: false });
        }
        return { room };
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    // Get player info by socket ID (for disconnect handling)
    getPlayerBySocketId(socketId) {
        for (const [roomId, room] of this.rooms.entries()) {
            const player = room.players.find(p => p.id === socketId);
            if (player) {
                return { ...player, roomId };
            }
        }
        return null;
    }

    setGameType(roomId, gameType) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        room.gameType = gameType;
        return { room };
    }

    setCustomQuestions(roomId, questions) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        room.customQuestions = questions;
        return { room };
    }

    setPlayerReady(roomId, playerId, isReady) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };

        const player = room.players.find(p => p.id === playerId);
        if (!player) return { error: "Player not found" };

        player.isReady = isReady;
        return { room };
    }

    kickPlayer(roomId, hostId, playerIdToKick) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        if (room.hostId !== hostId) return { error: "Only host can kick players" };
        if (hostId === playerIdToKick) return { error: "Host cannot kick themselves" };

        const index = room.players.findIndex(p => p.id === playerIdToKick);
        if (index === -1) return { error: "Player not found" };

        room.players.splice(index, 1);
        return { room, kickedPlayerId: playerIdToKick };
    }

    removePlayer(socketId) {
        // Find room with this player
        for (const [roomId, room] of this.rooms.entries()) {
            const index = room.players.findIndex(p => p.id === socketId);
            if (index !== -1) {
                room.players.splice(index, 1);
                // If room empty, delete
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                    return { roomId, roomDeleted: true };
                }
                // If host left, assign new host (MVP: simple reassignment)
                if (room.hostId === socketId) {
                    room.hostId = room.players[0].id;
                    room.players[0].isHost = true;
                }
                return { roomId, roomDeleted: false, room };
            }
        }
        return null;
    }

    // Restore host status when original host reconnects
    restoreHost(roomId, newSocketId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };

        // Remove old player entry if exists (from same name)
        const oldIndex = room.players.findIndex(p => p.name === playerName);
        let oldPlayerData = null;
        if (oldIndex !== -1) {
            oldPlayerData = room.players.splice(oldIndex, 1)[0];
        }

        // Remove current host status from whoever has it
        room.players.forEach(p => {
            p.isHost = false;
        });

        // Add restored host player at the beginning
        room.players.unshift({
            id: newSocketId,
            name: playerName,
            score: oldPlayerData?.score || 0,
            isHost: true,
            avatar: oldPlayerData?.avatar,
            avatarColor: oldPlayerData?.avatarColor,
            isReady: true
        });

        room.hostId = newSocketId;

        return { room };
    }
}

module.exports = new RoomManager();
