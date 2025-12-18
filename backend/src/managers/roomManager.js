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

    createRoom(hostId, playerName) {
        const roomId = this.generateRoomCode();
        const newRoom = {
            id: roomId,
            hostId: hostId,
            players: [
                { id: hostId, name: playerName, score: 0, isHost: true }
            ],
            gameState: 'LOBBY', // LOBBY, PLAYING, RESULTS
            currentRound: 0,
            gameType: null,
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId, playerId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        if (room.gameState !== 'LOBBY') return { error: "Game already in progress" };

        const playerExists = room.players.find(p => p.id === playerId);
        if (!playerExists) {
            room.players.push({ id: playerId, name: playerName, score: 0, isHost: false });
        }
        return { room };
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
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
}

module.exports = new RoomManager();
