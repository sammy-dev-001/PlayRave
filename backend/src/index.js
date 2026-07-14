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

const authRoutes = require('./routes/authRoutes');
const packRoutes = require('./routes/packRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const configureSocketGateway = require('./socket/socketGateway');

app.use('/api/auth', authRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/challenges', challengeRoutes);

configureSocketGateway(io);



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
