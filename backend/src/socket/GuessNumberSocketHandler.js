/**
 * GuessNumberSocketHandler.js
 * 
 * Server-side socket event handlers for the Guess the Number game.
 * Decouples the socket transport from the pure game logic in GuessNumberEngine.
 */

const guessNumberEngine = require('../games/GuessNumberEngine');
const roomManager = require('../managers/roomManager');

// Matches shared contract event names
const EVENTS = {
    SET_SECRET: 'guess-number-set-secret',
    SUBMIT_GUESS: 'guess-number-guess',
    STATE_UPDATE: 'game-state-sync',
    ERROR: 'guess-number-error',
};

/**
 * Utility to sanitize the game state before broadcasting.
 * Ensures the target secret number is stripped out to prevent cheating via network inspection.
 *
 * @param {Object} engineState - The raw state from GuessNumberEngine
 * @param {string} recipientPlayerId - The targeted player (optional, for player-specific views)
 * @returns {Object} Sanitized state payload
 */
function sanitizeState(engineState, recipientPlayerId = null) {
    // We leverage the engine's built-in cheat-proofing public formatter
    // and manually ensure no secret leaks through.
    const sanitized = guessNumberEngine._publicState(engineState);
    
    // Explicit safety strip (though _publicState already excludes it)
    if (sanitized.gamePhase !== 'GAME_OVER') {
        delete sanitized.secretNumber;
    }

    // Optional: could filter out other players' private data if needed based on recipientPlayerId
    
    return sanitized;
}

/**
 * Registers all Guess the Number socket listeners to the provided socket.
 * 
 * @param {import("socket.io").Socket} socket 
 * @param {import("socket.io").Server} io
 */
module.exports = function registerGuessNumberHandlers(socket, io) {

    // ── Handle Setting the Secret ─────────────────────────────────────────────
    socket.on(EVENTS.SET_SECRET, async (payload) => {
        const { roomId, secret } = payload;
        
        try {
            // Retrieve the active room and validate it's the correct game type
            const room = await roomManager.getRoom(roomId);
            if (!room || room.gameType !== 'guess-number') {
                return socket.emit(EVENTS.ERROR, { message: 'Invalid room or game type.' });
            }

            // Get the persistent userId associated with this socket
            // (Assuming sessionManager or roomManager provides a way to get it, or it's on the socket)
            // Note: If using sessionManager, you'd inject it here. For modularity, we look up via room.
            const player = roomManager.getPlayerBySocketId ? roomManager.getPlayerBySocketId(socket.id) : room.players.find(p => p.socketId === socket.id);
            const userId = player ? player.userId : null;

            if (!userId) {
                return socket.emit(EVENTS.ERROR, { message: 'User session not found.' });
            }

            // Pass to engine
            const instruction = guessNumberEngine._setSecretNumber(roomId, userId, secret);

            // Handle engine responses
            if (instruction.action === 'error') {
                return socket.emit(EVENTS.ERROR, { message: instruction.message });
            }

            if (instruction.action === 'broadcast') {
                const engineState = guessNumberEngine.activeGames.get(roomId);
                const safeState = sanitizeState(engineState);
                
                io.to(roomId).emit(EVENTS.STATE_UPDATE, {
                    gameState: safeState,
                    gameType: 'guess-number',
                    timestamp: Date.now()
                });
            }

        } catch (err) {
            console.error(`[GuessNumberSocket] Error in SET_SECRET:`, err);
            socket.emit(EVENTS.ERROR, { message: 'Internal server error while setting secret.' });
        }
    });

    // ── Handle Submitting a Guess ─────────────────────────────────────────────
    socket.on(EVENTS.SUBMIT_GUESS, async (payload) => {
        const { roomId, guess } = payload;

        try {
            const room = await roomManager.getRoom(roomId);
            if (!room || room.gameType !== 'guess-number') {
                return socket.emit(EVENTS.ERROR, { message: 'Invalid room or game type.' });
            }

            const player = roomManager.getPlayerBySocketId ? roomManager.getPlayerBySocketId(socket.id) : room.players.find(p => p.socketId === socket.id);
            const userId = player ? player.userId : null;

            if (!userId) {
                return socket.emit(EVENTS.ERROR, { message: 'User session not found.' });
            }

            // Pass to engine
            const instruction = guessNumberEngine._makeGuess(roomId, userId, guess);

            // Handle engine responses
            if (instruction.action === 'error') {
                return socket.emit(EVENTS.ERROR, { message: instruction.message });
            }

            if (instruction.action === 'broadcast' && instruction.event) {
                const engineState = guessNumberEngine.activeGames.get(roomId);
                
                // If it's GAME_OVER, the engine returns the payload that can include the secret
                if (engineState.gamePhase === 'GAME_OVER') {
                    // Send the game over specific payload
                    io.to(roomId).emit(instruction.event, instruction.data);
                }
                
                // Always sync the general state back to players
                const safeState = sanitizeState(engineState);
                io.to(roomId).emit(EVENTS.STATE_UPDATE, {
                    gameState: safeState,
                    gameType: 'guess-number',
                    timestamp: Date.now()
                });
            }

        } catch (err) {
            console.error(`[GuessNumberSocket] Error in SUBMIT_GUESS:`, err);
            socket.emit(EVENTS.ERROR, { message: 'Internal server error while submitting guess.' });
        }
    });

};
