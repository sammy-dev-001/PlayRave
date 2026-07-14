// ============================================================================
// GameRouter.js — Strategy-Pattern Traffic Cop & Instruction Executor
// ============================================================================
// This router decouples the network (Socket.io) from game logic.
// It intercepts game events, routes them to the correct stateless engine,
// and acts as the Instruction Executor for returned payloads.
// ============================================================================

const sessionManager = require('./SessionManager');
const roomManager = require('./roomManager');
const gamePersistence = require('./GamePersistenceManager');
const deltaSyncManager = require('./DeltaSyncManager');

// ── Engine Registry ─────────────────────────────────────────────────────
const engineRegistry = {
    // ── Classics ────────────────────────────────────────────────────────
    'scrabble':             require('../games/ScrabbleEngine'),
    'whot':                 require('../games/WhotEngine'),
    'trivia':               require('../games/TriviaEngine'),
    'hot-seat':             require('../games/HotSeatEngine'),
    'hot-seat-mc':          require('../games/HotSeatMCEngine'),
    
    // ── Party Games (Phase 1) ───────────────────────────────────────────
    'myth-or-fact':         require('../games/MythOrFactEngine'),
    'whos-most-likely':     require('../games/WhosMostLikelyEngine'),
    'truth-or-dare':        require('../games/TruthOrDareEngine'),
    'never-have-i-ever':    require('../games/NeverHaveIEverEngine'),
    'real-talk':            require('../games/RealTalkEngine'),

    // ── Speed & Reaction Games (Phase 1) ────────────────────────────────
    'neon-tap':             require('../games/NeonTapEngine'),
    'word-rush':            require('../games/WordRushEngine'),
    'button-mash':          require('../games/ButtonMashEngine'),
    'type-race':            require('../games/TypeRaceEngine'),
    'math-blitz':           require('../games/MathBlitzEngine'),
    'color-rush':           require('../games/ColorRushEngine'),

    // ── Social Deduction & Secrets (Phase 2) ────────────────────────────
    'confession-roulette':  require('../games/ConfessionRouletteEngine'),
    'imposter':             require('../games/ImposterEngine'),
    'unpopular-opinions':   require('../games/UnpopularOpinionsEngine'),
    'spill-the-tea':        require('../games/SpillTheTeaEngine'),

    // ── Final Phase 2 Extractions ───────────────────────────────────────
    'draw-battle':          require('../games/DrawBattleEngine'),
    'tic-tac-toe':          require('../games/TicTacToeEngine'),
    'caption-this':         require('../games/CaptionThisEngine'),
    'auction-bluff':        require('../games/AuctionBluffEngine'),
    'speed-categories':     require('../games/SpeedCategoriesEngine'),
};

class GameRouter {
    constructor() {
        // Monolith successfully eradicated!
    }

    // ── Primary Routing Entry Point ─────────────────────────────────────

    /**
     * Route a game event to the correct engine based on room.gameType.
     *
     * @param {string}   eventName — The socket event name (e.g. 'scrabble-submit-move')
     * @param {Object}   payload   — The event payload from the client
     * @param {string}   userId    — The PERSISTENT userId of the sender
     * @param {string}   roomId    — The room this event belongs to
     * @param {Object}   io        — The Socket.IO server instance
     */
    async handleEvent(eventName, payload, userId, roomId, io) {
        const room = await roomManager.getRoom(roomId);
        if (!room) return;

        const gameType = room.gameType;
        
        // INTERCEPTOR: Special case for starting a new game session
        if (eventName === 'start-game') {
            console.log(`[GameRouter] Intercepted start-game for ${gameType} in room ${roomId}`);
            return this.startGame(gameType, room, payload, io);
        }

        // INTERCEPTOR: Internal WML round-begin (fired by the engine's own schedule)
        // This keeps the server-authoritative timer loop inside the engine itself.
        if (eventName === '_wml-begin-round' && gameType === 'whos-most-likely') {
            const wmlEngine = engineRegistry['whos-most-likely'];
            const instruction = wmlEngine._beginRound(roomId);
            if (instruction) this.executeInstruction(instruction, io, roomId);
            return;
        }

        if (engineRegistry[gameType]) {

            console.log(`[GameRouter] Routing ${eventName} → ${gameType} Engine`);
            const engine = engineRegistry[gameType];
            
            // Pass the event to the appropriate Engine
            const instruction = engine.handleEvent(eventName, payload, userId, roomId);
            
            // Execute the returned payload instruction
            this.executeInstruction(instruction, io, roomId);

            // Auto-persist state after every valid move
            // We skip high-frequency "speed" games to avoid spamming the DB
            const speedGames = ['neon-tap', 'button-mash', 'color-rush', 'type-race', 'math-blitz'];
            if (!speedGames.includes(gameType)) {
                const updatedState = engine.activeGames.get(roomId);
                if (updatedState) {
                    gamePersistence.saveGame(roomId, gameType, updatedState);
                }
            }
            return;
        }

        console.warn(`[GameRouter] Engine not found for ${gameType} on event ${eventName}`);
        return null;
    }

    // ── The Instruction Executor ──────────────────────────────────────────

    /**
     * Recursively parses and executes instruction payloads from Game Engines.
     * Keeps engines 100% decoupled from Socket.io.
     */
    executeInstruction(instruction, io, roomId) {
        if (!instruction || !instruction.action) return;

        switch (instruction.action) {
            case 'broadcast': {
                // Determine if this is a speed-game broadcast that can be compressed
                const room = roomManager.rooms ? roomManager.rooms.get(roomId) : null;
                const gameType = room?.gameType || null;

                if (gameType && deltaSyncManager.isSpeedGame(gameType) && instruction.data) {
                    const { payload, wasDelta } = deltaSyncManager.getPayload(roomId, gameType, instruction.data);
                    if (wasDelta && process.env.DELTA_DEBUG === 'true') {
                        console.log(`[GameRouter] Room ${roomId}: broadcasting delta for ${gameType}`);
                    }
                    io.to(roomId).emit(instruction.event, payload);
                } else {
                    // Non-speed game or no data — broadcast full state as before
                    io.to(roomId).emit(instruction.event, instruction.data);
                }

                // AUTO-TRANSITION: If the engine data signals the game is finished,
                // move the room back to LOBBY state automatically.
                if (instruction.data && (instruction.data.finished === true || instruction.data.gameOver === true)) {
                    console.log(`[GameRouter] Auto-transitioning room ${roomId} to LOBBY (detected end of game)`);
                    this.endGame(roomId);
                    roomManager.setGameState(roomId, 'LOBBY');
                }
                break;
            }

            case 'emit':
                // Emit strictly to a single player using SessionManager mapping
                const client = sessionManager.getClient(instruction.targetId);
                if (client && client.socketId) {
                    io.to(client.socketId).emit(instruction.event, instruction.data);
                } else {
                    console.warn(`[GameRouter] Could not find active socket for user ${instruction.targetId}`);
                }
                break;

            case 'schedule':
                // Execute engine event after a specified delay without locking up the engine
                console.log(`[GameRouter] Scheduling ${instruction.eventToTrigger} for room ${roomId} in ${instruction.delay}ms`);
                setTimeout(() => {
                    // Route back through handleEvent using a 'system' generic userId
                    this.handleEvent(instruction.eventToTrigger, instruction.data || {}, 'system', roomId, io);
                }, instruction.delay);
                break;

            case 'schedule-ai':
                // Execute AI turn after a specified delay without locking up the engine
                console.log(`[GameRouter] Scheduling AI turn for room ${roomId} in ${instruction.delay}ms`);
                setTimeout(async () => {
                    const room = await roomManager.getRoom(roomId);
                    if (!room) return;
                    const engine = engineRegistry[room.gameType]; 
                    if (!engine || typeof engine.executeAITurn !== 'function') {
                        console.warn(`[GameRouter] Engine ${room.gameType} does not support executeAITurn`);
                        return;
                    }
                    const aiInstructionPayload = engine.executeAITurn(roomId);
                    
                    // Recursively execute the AI's chosen instruction
                    if (aiInstructionPayload) {
                        this.executeInstruction(aiInstructionPayload, io, roomId);
                    }
                }, instruction.delay || 2500);
                break;

            case 'multiple':
                // Execute an array of instructions sequentially
                if (Array.isArray(instruction.instructions)) {
                    instruction.instructions.forEach(inst => this.executeInstruction(inst, io, roomId));
                }
                break;

            case 'error':
                // Graceful error fallback
                if (instruction.targetId) {
                    const errorClient = sessionManager.getClient(instruction.targetId);
                    if (errorClient && errorClient.socketId) {
                        io.to(errorClient.socketId).emit('error', { message: instruction.message });
                    }
                } else {
                    console.error(`[Engine Error]`, instruction.message);
                }
                break;

            case 'game-ended':
                // Special action to transition room back to LOBBY
                this.endGame(roomId);
                roomManager.setGameState(roomId, 'LOBBY');
                const updatedRoom = roomManager.getRoomSnapshot(roomId);
                
                // 1. Emit universal event with full room state
                io.to(roomId).emit('game-ended', { 
                    message: instruction.data?.message || 'Game ended',
                    room: updatedRoom 
                });

                // 2. Emit specific engine event if provided (for legacy compatibility)
                if (instruction.event && instruction.event !== 'game-ended') {
                    io.to(roomId).emit(instruction.event, {
                        ...(instruction.data || { message: 'Game ended' }),
                        room: updatedRoom
                    });
                }
                break;


            default:

                console.warn(`[GameRouter] Unknown instruction action received: ${instruction.action}`);
                break;
        }
    }

    // ── Start Game Routing ──────────────────────────────────────────────

    startGame(gameType, room, options = {}, io = null) {
        if (engineRegistry[gameType]) {
            console.log(`[GameRouter] Starting ${gameType} via Dedicated Engine`);
            const engine = engineRegistry[gameType];
            let instruction;
            
            if (gameType === 'scrabble') {
                if (options.isSinglePlayer || room.isSinglePlayer) {
                    instruction = engine.startSinglePlayerGame(room.id, room, options.difficulty || 'medium');
                } else {
                    instruction = engine.startGame(room, options);
                }
            } else if (gameType === 'whos-most-likely') {
                // WML is server-authoritative — it needs the io reference to
                // fire its own timers without going through GameRouter callbacks.
                instruction = engine.startGame(room, { ...options, io });
            } else {
                instruction = engine.startGame(room, options);
            }
            
            // If io is provided, immediately execute the start broadcasts
            if (instruction) {
                this.executeInstruction(instruction, io, room.id);
            }

            // Set room state globally
            roomManager.setGameState(room.id, 'PLAYING');
            roomManager.setGameType(room.id, gameType);

            // Persist initial game state
            const initialState = engine.activeGames.get(room.id);
            if (initialState) {
                gamePersistence.saveGame(room.id, gameType, initialState);
            }

            return instruction;
        }

        console.error(`[GameRouter] Cannot start game. Engine not found for: ${gameType}`);
        return { error: `Unknown game type: ${gameType}` };
    }

    // ── Utility Methods ──────────────────────────────────────────────────

    async getGameState(roomId, gameType = null) {
        if (!gameType) {
            const room = await roomManager.getRoom(roomId);
            if (room) gameType = room.gameType;
        }

        if (gameType && engineRegistry[gameType]) {
            const engine = engineRegistry[gameType];
            let state = engine.activeGames.get(roomId);

            if (!state) {
                // Attempt to restore from DB
                const record = await gamePersistence.loadGame(roomId);
                if (record && record.gameType === gameType) {
                    console.log(`[GameRouter] Restoring game state for room ${roomId} from MongoDB`);
                    state = record.state;
                    engine.activeGames.set(roomId, state);
                }
            }
            return state || null;
        }
        return null;
    }

    getMinPlayers(gameType) {
        const minimums = {
            'scrabble':            1,
            'whot':                2,
            'trivia':              2,
            'hot-seat':            2,
            'myth-or-fact':        2,
            'whos-most-likely':    3,
            'truth-or-dare':       2,
            'never-have-i-ever':   2,
            'real-talk':           2,
            'rapid-fire':          2,
            'neon-tap':            2,
            'word-rush':           2,
            'button-mash':         2,
            'type-race':           2,
            'math-blitz':          2,
            'color-rush':          2,
            'lie-detector':        3,
            'confession-roulette': 3,
            'imposter':            3,
            'unpopular-opinions':  3,
            'spill-the-tea':       3,
            'draw-battle':         3,
            'tic-tac-toe':         2,
            'caption-this':        3,
            'auction-bluff':       3,
            'speed-categories':    2,
        };
        if (gameType in minimums) return minimums[gameType];
        return 2; // Default fallback
    }

    clearTimer(roomId) {
        // No-op for now. Specific engines can handle their own timers if needed.
    }

    async endGame(roomId) {
        const room = await roomManager.getRoom(roomId);
        const gameType = room?.gameType;

        if (gameType && engineRegistry[gameType] && engineRegistry[gameType].activeGames.has(roomId)) {
            engineRegistry[gameType].activeGames.delete(roomId);
            gamePersistence.deleteGame(roomId);
        }

        // Clear delta cache for this room
        deltaSyncManager.clearRoom(roomId);
    }

    async removePlayer(roomId, userId, io) {
        const room = await roomManager.getRoom(roomId);
        const gameType = room?.gameType;

        if (gameType && engineRegistry[gameType]) {
            const engine = engineRegistry[gameType];
            if (typeof engine.removePlayer === 'function') {
                const instruction = engine.removePlayer(roomId, userId);
                if (instruction && io) {
                    this.executeInstruction(instruction, io, roomId);
                }
            }
        }
    }

    async saveAllGames() {
        console.log('[GameRouter] Saving all active games to DB...');
        for (const gameType in engineRegistry) {
            const engine = engineRegistry[gameType];
            for (const [roomId, state] of engine.activeGames) {
                await gamePersistence.saveGame(roomId, gameType, state);
            }
        }
    }

    updatePlayerSocket(roomId, oldSocketId, newSocketId) {
        // 100% of games now use persistent 'userId' natively.
        // We no longer need to execute deep dictionary key rebinding algorithms!
    }
}

module.exports = new GameRouter();
