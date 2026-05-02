// ============================================================================
// SessionManager.js — The Single Source of Truth for Player Sessions
// ============================================================================
// Every connected client is mapped by their PERSISTENT userId (never socket.id).
// socket.id is treated as a disposable, temporary transport pipeline.
//
// Lifecycle:
//   1. registerClient()  — binds a userId to a socketId on first connect
//   2. updateSocket()    — re-binds after tab wake / reconnect
//   3. handleDisconnect()— flags isAway, starts 600s grace timer
//   4. cancelDisconnect()— clears grace timer on successful reconnect
//   5. purgeClient()     — hard-removes after grace period expires
// ============================================================================

const GRACE_PERIOD_MS = 600_000; // 10-minute grace period for mobile tab sleep

class SessionManager {
    constructor() {
        /**
         * sessions: Map<userId, SessionEntry>
         *
         * SessionEntry = {
         *   userId:      string,          // Persistent user identity
         *   socketId:    string,          // Current socket.id (volatile)
         *   roomId:      string | null,   // Room they belong to
         *   playerName:  string,
         *   avatar:      string,
         *   avatarColor: string,
         *   isAway:      boolean,         // true while tab is sleeping
         *   connectedAt: number,          // Timestamp of initial connection
         *   lastSeen:    number,          // Timestamp of last activity
         *   disconnectTimer: NodeJS.Timeout | null  // Grace period timeout ref
         * }
         */
        this.sessions = new Map();

        /**
         * Reverse lookup: socketId → userId
         * Needed for disconnect events where we only have socket.id
         */
        this.socketToUser = new Map();
    }

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Register a brand new client session (first join / room creation).
     * If a session already exists for this userId, it is re-bound (reconnect).
     */
    registerClient(userId, socketId, { playerName, avatar, avatarColor, roomId } = {}) {
        // Clean up any stale reverse-lookup for this socketId
        if (this.socketToUser.has(socketId)) {
            const oldUser = this.socketToUser.get(socketId);
            if (oldUser !== userId) {
                // This socket was previously mapped to a different user — clean it
                this.socketToUser.delete(socketId);
            }
        }

        const existing = this.sessions.get(userId);

        if (existing) {
            // Reconnect path — update the volatile socket binding
            console.log(`[SessionManager] Re-binding user ${userId} from socket ${existing.socketId} → ${socketId}`);
            this.socketToUser.delete(existing.socketId);
            existing.socketId = socketId;
            existing.isAway = false;
            existing.lastSeen = Date.now();
            if (roomId) existing.roomId = roomId;
            if (playerName) existing.playerName = playerName;
            if (avatar) existing.avatar = avatar;
            if (avatarColor) existing.avatarColor = avatarColor;
            this.socketToUser.set(socketId, userId);
            this._clearGraceTimer(userId);
            return existing;
        }

        // Fresh registration
        const session = {
            userId,
            socketId,
            roomId: roomId || null,
            playerName: playerName || 'Player',
            avatar: avatar || '😎',
            avatarColor: avatarColor || '#6C63FF',
            isAway: false,
            connectedAt: Date.now(),
            lastSeen: Date.now(),
            disconnectTimer: null,
        };

        this.sessions.set(userId, session);
        this.socketToUser.set(socketId, userId);
        console.log(`[SessionManager] Registered user ${userId} on socket ${socketId}`);
        return session;
    }

    /**
     * Hot-swap the socket binding when a tab wakes up and reconnects.
     * Returns the updated session, or null if userId isn't registered.
     */
    updateSocket(userId, newSocketId) {
        const session = this.sessions.get(userId);
        if (!session) {
            console.warn(`[SessionManager] updateSocket — no session for userId ${userId}`);
            return null;
        }

        const oldSocketId = session.socketId;

        // Remove old reverse lookup
        this.socketToUser.delete(oldSocketId);

        // Bind new socket
        session.socketId = newSocketId;
        session.isAway = false;
        session.lastSeen = Date.now();
        this.socketToUser.set(newSocketId, userId);

        // Cancel any pending grace timer
        this._clearGraceTimer(userId);

        console.log(`[SessionManager] Socket swapped for ${userId}: ${oldSocketId} → ${newSocketId}`);
        return { session, oldSocketId };
    }

    /**
     * Retrieve a client session by userId.
     */
    getClient(userId) {
        return this.sessions.get(userId) || null;
    }

    /**
     * Retrieve the userId for a given socketId (reverse lookup).
     */
    getUserIdBySocket(socketId) {
        return this.socketToUser.get(socketId) || null;
    }

    /**
     * Handle a socket disconnect event.
     * Flags the user as "away", starts the grace-period countdown.
     *
     * @param {string} userId
     * @param {string} roomId
     * @param {Function} onHardDrop — Callback invoked if the grace period expires.
     *                                 Receives (userId, roomId) so the caller can
     *                                 trigger RoomManager.removePlayer + host migration.
     */
    handleDisconnect(userId, roomId, onHardDrop) {
        const session = this.sessions.get(userId);
        if (!session) return;

        session.isAway = true;
        session.lastSeen = Date.now();
        console.log(`[SessionManager] User ${userId} marked AWAY — starting ${GRACE_PERIOD_MS / 1000}s grace timer`);

        // Clear any previous timer (defensive)
        this._clearGraceTimer(userId);

        // Start the hard-drop countdown
        session.disconnectTimer = setTimeout(() => {
            console.log(`[SessionManager] Grace period expired for ${userId} — HARD DROP`);
            this.purgeClient(userId);
            if (typeof onHardDrop === 'function') {
                onHardDrop(userId, roomId);
            }
        }, GRACE_PERIOD_MS);
    }

    /**
     * Cancel a pending disconnect (the player came back before the timer expired).
     */
    cancelDisconnect(userId) {
        const session = this.sessions.get(userId);
        if (!session) return false;

        this._clearGraceTimer(userId);
        session.isAway = false;
        session.lastSeen = Date.now();
        console.log(`[SessionManager] Disconnect cancelled for ${userId} — player RETURNED`);
        return true;
    }

    /**
     * Permanently remove a client from the session registry.
     * Called after the grace period expires, or on explicit leave.
     */
    purgeClient(userId) {
        const session = this.sessions.get(userId);
        if (!session) return;

        this._clearGraceTimer(userId);
        this.socketToUser.delete(session.socketId);
        this.sessions.delete(userId);
        console.log(`[SessionManager] Purged session for ${userId}`);
    }

    /**
     * Update which room a user belongs to.
     */
    setRoom(userId, roomId) {
        const session = this.sessions.get(userId);
        if (session) {
            session.roomId = roomId;
        }
    }

    /**
     * Get all active (non-purged) sessions for a room.
     */
    getSessionsForRoom(roomId) {
        const result = [];
        for (const session of this.sessions.values()) {
            if (session.roomId === roomId) {
                result.push(session);
            }
        }
        return result;
    }

    /**
     * Check if a user is currently marked as away.
     */
    isAway(userId) {
        const session = this.sessions.get(userId);
        return session ? session.isAway : false;
    }

    /**
     * Get sanitized session data safe for emitting to clients.
     * Strips internal fields like timers.
     */
    getPublicSession(userId) {
        const session = this.sessions.get(userId);
        if (!session) return null;
        return {
            userId: session.userId,
            socketId: session.socketId,
            roomId: session.roomId,
            playerName: session.playerName,
            avatar: session.avatar,
            avatarColor: session.avatarColor,
            isAway: session.isAway,
            lastSeen: session.lastSeen,
        };
    }

    // ── Internals ───────────────────────────────────────────────────────

    _clearGraceTimer(userId) {
        const session = this.sessions.get(userId);
        if (session?.disconnectTimer) {
            clearTimeout(session.disconnectTimer);
            session.disconnectTimer = null;
        }
    }

    /**
     * Debug helper — dump all sessions to console.
     */
    debugDump() {
        console.log('=== SESSION DUMP ===');
        for (const [userId, s] of this.sessions.entries()) {
            console.log(`  ${userId}: socket=${s.socketId}, room=${s.roomId}, away=${s.isAway}`);
        }
        console.log(`  socketToUser entries: ${this.socketToUser.size}`);
        console.log('====================');
    }
}

module.exports = new SessionManager();
