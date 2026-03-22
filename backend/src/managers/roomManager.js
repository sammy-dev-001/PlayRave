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

    createRoom(hostId, playerName, avatar, avatarColor, userId) {
        const roomId = this.generateRoomCode();
        const newRoom = {
            id: roomId,
            hostId: hostId,
            players: [
                { 
                    id: hostId, 
                    uid: userId || hostId, // Use hostId as fallback if userId not provided
                    name: playerName, 
                    score: 0, 
                    isHost: true, 
                    avatar, 
                    avatarColor, 
                    isReady: true 
                }
            ],
            gameState: 'LOBBY',
            currentRound: 0,
            gameType: null,
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    createLocalRoom(roomId, hostId, playerName, avatar, avatarColor, userId) {
        const newRoom = {
            id: roomId,
            hostId: hostId,
            players: [
                { 
                    id: hostId, 
                    uid: userId || hostId,
                    name: playerName, 
                    score: 0, 
                    isHost: true, 
                    avatar, 
                    avatarColor, 
                    isReady: true 
                }
            ],
            gameState: 'LOBBY',
            currentRound: 0,
            gameType: null,
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId, playerId, playerName, avatar, avatarColor, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Room not found" };
        
        const playerExists = room.players.find(p => p.uid === userId || p.id === playerId);
        
        if (room.gameState !== 'LOBBY' && !playerExists) {
            return { error: "Game already in progress" };
        }

        let oldSocketId = null;
        if (!playerExists) {
            room.players.push({ 
                id: playerId, 
                uid: userId || playerId, 
                name: playerName, 
                score: 0, 
                isHost: false, 
                avatar, 
                avatarColor, 
                isReady: false 
            });
        } else {
            // Update socket ID if rejoining
            oldSocketId = playerExists.id;
            playerExists.id = playerId;
            
            // If they were host, update hostId
            if (room.hostId === oldSocketId) {
                room.hostId = playerId;
            }
        }
        return { room, oldSocketId };
    }

    // New helper for state recovery: re-bind player to new socket
    updatePlayerSocket(roomId, userId, newSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.uid === userId);
        if (player) {
            const oldSocketId = player.id;
            player.id = newSocketId;
            
            // If they were host, update hostId and ensure isHost flag is set
            if (room.hostId === oldSocketId || player.isHost) {
                room.hostId = newSocketId;
                player.isHost = true;
            }
            
            return { room, player };
        }
        return null;
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
                // If host left, assign new host (MVP: simple reassignment)
                if (room.hostId === socketId && room.players.length > 0) {
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
