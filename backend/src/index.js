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

// Allowed origins: Vercel production deploy + local development
const ALLOWED_ORIGINS = [
    'https://playrave.vercel.app',
    'https://www.playrave.vercel.app',
    /\.vercel\.app$/,          // any Vercel preview deploy
    /\.playrave\./,            // any playrave subdomain
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:19006',   // Expo web
    'http://localhost:8081',    // Metro bundler
    'http://localhost:8082',
];

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server requests (no origin header) and matching origins
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) return callback(null, true);
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowed = ALLOWED_ORIGINS.some(o =>
                typeof o === 'string' ? o === origin : o.test(origin)
            );
            if (allowed || process.env.NODE_ENV !== 'production') return callback(null, true);
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        },
        credentials: true,
    },
    pingTimeout: 10000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2-minute packet & room replay window
        skipMiddlewares: false,
    },
});
app.set('io', io);

// ── Manager Imports ─────────────────────────────────────────────────────
const sessionManager = require("./managers/sessionManager");
const roomManager    = require("./managers/roomManager");
    const gameRouter     = require("./managers/GameRouter");
    const authManager    = require("./managers/authManager");
    const ScrabbleAIEngine = require('./ai/ScrabbleAIEngine');

// Health check
app.get(["/", "/health", "/api/health"], (req, res) => {
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
const agoraRoutes = require('./routes/agoraRoutes');
const roomRoutes = require('./routes/roomRoutes');
const configureSocketGateway = require('./socket/socketGateway');

app.use('/api/auth', authRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/rooms', roomRoutes);

configureSocketGateway(io);



// ==================== GRACEFUL SHUTDOWN ====================
async function handleShutdown(signal) {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
    
    // Force exit before Render's 30s default SIGKILL deadline
    setTimeout(() => {
        console.error('[Server] Graceful shutdown deadline reached. Forcing exit.');
        process.exit(1);
    }, 25000).unref();

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
    } catch (err) {
        console.error('[Server] Error saving state during shutdown:', err);
    }

    // io.close() closes both Socket.IO and the underlying HTTP server,
    // sending a clean transport close to all connected clients so they immediately reconnect
    io.close(() => {
        console.log('[Server] Socket.IO and HTTP server cleanly closed.');
        process.exit(0);
    });
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
