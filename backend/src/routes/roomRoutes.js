// ============================================================================
// roomRoutes.js — Hybrid HTTP Snapshot & Fallback Safety Net (The BGA Pattern)
// ============================================================================
// Provides authenticated / guest-verified REST endpoints for:
//   1. GET /api/rooms/:roomId/state?sinceVersion=N
//      Returns 204 if already converged; returns full state if drifted/behind.
//   2. POST /api/rooms/:roomId/actions
//      Idempotent HTTP fallback if WebSocket move submission encounters an ACK timeout.
// ============================================================================

const express = require('express');
const router = express.Router();
const roomManager = require('../managers/roomManager');
const gameRouter = require('../managers/GameRouter');
const authManager = require('../managers/authManager');

// Helper to resolve userId from Authorization header or guest header/query
function resolveUserId(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = authManager.verifyToken(token);
        if (decoded?.id) return decoded.id;
    }
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && typeof headerUserId === 'string') return headerUserId;
    const queryUserId = req.query.userId;
    if (queryUserId && typeof queryUserId === 'string') return queryUserId;
    return null;
}

/**
 * GET /api/rooms/:roomId/state?sinceVersion=N
 * Serves authoritative room snapshot for instant catch-up.
 */
router.get('/:roomId/state', async (req, res) => {
    try {
        const { roomId } = req.params;
        const sinceVersion = Number(req.query.sinceVersion ?? -1);
        const userId = resolveUserId(req);

        const cleanRoomId = String(roomId).trim().toUpperCase();
        console.log(`[RoomRoutes] Serving state snapshot for room ${cleanRoomId} sinceVersion=${sinceVersion} [Telemetry:http_fallback_sync_hits]`);
        const room = await roomManager.getRoom(cleanRoomId);

        if (!room) {
            return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
        }

        const stateVersion = room.stateVersion || 1;

        // If client's state version is already up-to-date, return 204 No Content
        if (sinceVersion >= 0 && stateVersion <= sinceVersion) {
            return res.status(204).end();
        }

        // Fetch authoritative public game state
        const gameState = await gameRouter.getPublicGameState(cleanRoomId, userId);
        const roomSnapshot = roomManager.getRoomSnapshot(cleanRoomId);

        return res.json({
            roomId: cleanRoomId,
            stateVersion,
            gameState,
            publicState: gameState,
            gameType: room.gameType,
            room: roomSnapshot,
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('[RoomRoutes] Error getting room state:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

/**
 * POST /api/rooms/:roomId/actions
 * Idempotent HTTP fallback for submitting game actions when WebSocket experiences ACK timeout.
 */
router.post('/:roomId/actions', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { actionId, eventName, payload } = req.body || {};
        const userId = resolveUserId(req) || req.body?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing user credentials' });
        }

        const cleanRoomId = String(roomId).trim().toUpperCase();
        console.log(`[RoomRoutes] Executing HTTP action fallback: ${eventName} in ${cleanRoomId} [Telemetry:http_fallback_sync_hits] actionId=${actionId}`);
        const room = await roomManager.getRoom(cleanRoomId);

        if (!room) {
            return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
        }

        const io = req.app.get('io');
        const result = await gameRouter.handleEvent(eventName, payload || {}, userId, cleanRoomId, io, actionId);

        return res.json({
            success: true,
            stateVersion: room.stateVersion || 1,
            result: result || null
        });
    } catch (err) {
        console.error('[RoomRoutes] Error submitting game action via HTTP:', err);
        return res.status(500).json({ error: 'ACTION_FAILED', message: err.message });
    }
});

module.exports = router;
