// ============================================================================
// WhosMostLikelyEngine.js — Server-Authoritative State Machine
// ============================================================================
// Design Principles:
//   1. SERVER-AUTHORITATIVE: ALL timers live here. Clients are pure renderers.
//   2. EXPLICIT STATE ENUM: Every phase transition is deliberate and logged.
//   3. RACE-CONDITION LOCK: A single advancing flag ensures reveal fires once.
//   4. DISCONNECT-AWARE: Vote threshold recalculates on every disconnect.
//   5. DECOUPLED: Returns instruction payloads — never touches Socket.io directly.
// ============================================================================

const { getRandomPrompts } = require('../data/whosMostLikelyPrompts');

// ── Explicit Game Phase Enum ─────────────────────────────────────────────────
// Changing a state is only allowed through the designated transition functions.
// Never mutate game.phase directly outside of this file.
const PHASE = Object.freeze({
    LOBBY:          'LOBBY',
    ROUND_START:    'ROUND_START',
    VOTING_ACTIVE:  'VOTING_ACTIVE',
    REVEAL_RESULTS: 'REVEAL_RESULTS',
    ROUND_END:      'ROUND_END',
    FINISHED:       'FINISHED',
});

// ── Timing Constants ─────────────────────────────────────────────────────────
const VOTING_DURATION_MS    = 20_000; // 20 s to vote
const RESULTS_DISPLAY_MS    = 6_000;  // 6 s on results screen before next prompt
const ROUND_START_DELAY_MS  = 1_500;  // brief pause before VOTING_ACTIVE opens

class WhosMostLikelyEngine {
    constructor() {
        /**
         * activeGames: Map<roomId, GameRoom>
         *
         * GameRoom = {
         *   roomId:             string,
         *   phase:              PHASE (state enum),
         *   prompts:            Array<{ prompt, category }>,
         *   currentPromptIndex: number,
         *
         *   // ── Player tracking ─────────────────────────────────────────
         *   // All players registered at game start (persistent userId keys).
         *   allPlayers:         Map<userId, Player>,
         *
         *   // Player = { userId, name, avatar, isHost, isConnected, hasVoted }
         *   //   isConnected — mirrors live socket presence (updated on disconnect)
         *   //   hasVoted    — reset every round; prevents duplicate submissions
         *
         *   // ── Vote tracking ────────────────────────────────────────────
         *   // currentVotes: Map<voterUserId, votedForUserId>  (reset each round)
         *   currentVotes:       Map,
         *
         *   // Accumulated totals across all rounds (never reset)
         *   totalVoteTally:     Map<userId, number>,
         *
         *   // Set of promptIndices already tallied (idempotency guard)
         *   talliedPrompts:     Set<number>,
         *
         *   // ── Race condition lock ──────────────────────────────────────
         *   // Flipped to true the instant checkVotingComplete() decides to
         *   // advance. Any duplicate trigger (timer race, late vote) is a no-op.
         *   isAdvancing:        boolean,
         *
         *   // ── Server-side timer refs ───────────────────────────────────
         *   // Stored so they can be cleared on early completion or room teardown.
         *   votingTimer:        NodeJS.Timeout | null,
         *   resultsTimer:       NodeJS.Timeout | null,
         *
         *   hostUserId:         string,
         *   hostParticipates:   boolean,
         *   startedAt:          number,
         * }
         */
        this.activeGames = new Map();

        /**
         * ioRef: stored during startGame so server-side timers can broadcast
         * without passing `io` through every call chain.
         * This is the ONLY place Socket.io is referenced in this engine.
         */
        this.ioRef = null;
    }

    // ── Public Engine Contract (called by GameRouter) ──────────────────────

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            // All three legacy event names accepted for backwards compatibility
            case 'whos-most-likely-submit-vote':
            case 'submit-whos-most-likely-vote':
            case 'submit-vote':
                return this.submitVote(roomId, userId, payload.votedForPlayerId);

            // Host-triggered end (rage-quit / early termination)
            case 'whos-most-likely-end-game':
            case 'end-whos-most-likely':
            case 'end-game':
                return this.endGame(roomId);

            // Legacy client-driven events are now IGNORED with an explanatory log.
            // The server drives all phase transitions internally.
            case 'show-whos-most-likely-results':
            case 'next-whos-most-likely-prompt':
            case 'show-results':
            case 'next-prompt':
                console.log(`[WML] Ignoring legacy client event "${eventName}" — server is authoritative.`);
                return null;

            default:
                return {
                    action: 'error',
                    message: `Unknown Who's Most Likely event: ${eventName}`
                };
        }
    }

    // ── Game Lifecycle ─────────────────────────────────────────────────────

    /**
     * startGame — called by GameRouter when host emits 'start-game'.
     *
     * @param {object} room    — RoomManager snapshot (players, id, etc.)
     * @param {object} options — { hostParticipates, promptCount, io }
     */
    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;

        // Capture io reference for server-side timer broadcasts
        if (options.io) this.ioRef = options.io;

        // Tear down any stale game in this room (host restarted)
        this._clearTimers(roomId);

        const promptCount = options.promptCount || 10;
        const prompts = getRandomPrompts(promptCount);

        // ── Build the player registry ──────────────────────────────────
        // We use a Map (not a plain object) so we can call .size cleanly.
        const allPlayers  = new Map();
        const totalVoteTally = new Map();

        room.players.forEach(player => {
            const participates = hostParticipates || !player.isHost;
            if (!participates) return;

            allPlayers.set(player.userId, {
                userId:      player.userId,
                name:        player.name,
                avatar:      player.avatar || '😎',
                isHost:      !!player.isHost,
                isConnected: true,   // assume all connected at start
                hasVoted:    false,
            });
            totalVoteTally.set(player.userId, 0);
        });

        const game = {
            roomId,
            phase:              PHASE.LOBBY,
            prompts,
            currentPromptIndex: 0,
            allPlayers,
            currentVotes:       new Map(),
            totalVoteTally,
            talliedPrompts:     new Set(),
            isAdvancing:        false,
            votingTimer:        null,
            resultsTimer:       null,
            hostUserId:         room.players.find(p => p.isHost)?.userId || null,
            hostParticipates,
            startedAt:          Date.now(),
        };

        this.activeGames.set(roomId, game);

        // Broadcast game-started to all players, then begin round 0
        const playerList = this._buildPlayerList(game);
        const instructions = room.players.map(p => ({
            action:   'emit',
            targetId: p.userId,
            event:    'game-started',
            data: {
                gameType:       'whos-most-likely',
                hostParticipates,
                players:        playerList,
                totalPrompts:   prompts.length,
            }
        }));

        // Kick off the first round after a short delay
        // (gives clients time to mount the question screen)
        instructions.push({
            action:         'schedule',
            eventToTrigger: '_wml-begin-round',
            delay:          ROUND_START_DELAY_MS,
            data:           { roomId },
        });

        return { action: 'multiple', instructions };
    }

    /**
     * _beginRound — internal transition: LOBBY/ROUND_END → ROUND_START → VOTING_ACTIVE
     * Called by the GameRouter's 'schedule' mechanism (not by clients).
     */
    _beginRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        // Guard: only enter a new round from a valid predecessor phase
        if (game.phase === PHASE.FINISHED) return null;

        // ── Reset per-round state ──────────────────────────────────────
        game.phase       = PHASE.ROUND_START;
        game.isAdvancing = false;           // unlock the advancing gate
        game.currentVotes = new Map();      // wipe votes from previous round

        // Reset hasVoted flag on every player (connected or not)
        for (const player of game.allPlayers.values()) {
            player.hasVoted = false;
        }

        const currentPrompt = game.prompts[game.currentPromptIndex];

        console.log(`[WML:${roomId}] ▶ Round ${game.currentPromptIndex + 1}/${game.prompts.length} — ROUND_START`);

        // Immediately transition to VOTING_ACTIVE
        game.phase = PHASE.VOTING_ACTIVE;
        console.log(`[WML:${roomId}] ▶ Phase → VOTING_ACTIVE`);

        // ── Start the authoritative server-side voting timer ───────────
        // When it fires, the server forces a tally regardless of who voted.
        game.votingTimer = setTimeout(() => {
            console.log(`[WML:${roomId}] ⏰ Voting timer expired — forcing reveal`);
            this._triggerReveal(roomId, /* forced= */ true);
        }, VOTING_DURATION_MS);

        return {
            action: 'broadcast',
            event:  'whos-most-likely-round-start',
            data: {
                phase:         PHASE.VOTING_ACTIVE,
                promptIndex:   game.currentPromptIndex,
                totalPrompts:  game.prompts.length,
                prompt:        currentPrompt.prompt,
                category:      currentPrompt.category,
                votingDurationMs: VOTING_DURATION_MS,
                players:       this._buildPlayerList(game),
            }
        };
    }

    /**
     * submitVote — the ONLY way a client can influence the game state.
     *
     * Safety guarantees:
     *   • Rejects votes if the phase is not VOTING_ACTIVE
     *   • player.hasVoted = true after first submission (idempotency guard)
     *   • isAdvancing lock prevents double-reveal on simultaneous last votes
     */
    submitVote(roomId, userId, votedForUserId) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };
        }

        // ── Phase guard ────────────────────────────────────────────────
        if (game.phase !== PHASE.VOTING_ACTIVE) {
            console.log(`[WML:${roomId}] Vote rejected from ${userId} — phase is ${game.phase}`);
            return { action: 'emit', targetId: userId, event: 'vote-rejected', data: { reason: 'Voting is not currently active' } };
        }

        const player = game.allPlayers.get(userId);
        if (!player) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Player not in this game' } };
        }

        // ── Idempotency guard — one vote per player per round ──────────
        if (player.hasVoted) {
            console.log(`[WML:${roomId}] Duplicate vote blocked from ${userId}`);
            return { action: 'emit', targetId: userId, event: 'vote-rejected', data: { reason: 'You have already voted this round' } };
        }

        // ── Record the vote ────────────────────────────────────────────
        player.hasVoted    = true;
        const finalVoteTarget = votedForUserId || null; // null is a valid "pass"
        game.currentVotes.set(userId, finalVoteTarget);

        console.log(`[WML:${roomId}] ✅ Vote from ${userId} → ${finalVoteTarget || 'PASS'} (${game.currentVotes.size} / ${this._activePlayerCount(game)} connected)`);

        // Confirm back to the voter immediately
        const instructions = [
            { action: 'emit', targetId: userId, event: 'vote-submitted', data: { success: true } }
        ];

        // Broadcast vote-count update to ALL players (so "X/N voted" UI stays current)
        instructions.push({
            action: 'broadcast',
            event:  'whos-most-likely-vote-progress',
            data: {
                votedCount: game.currentVotes.size,
                totalNeeded: this._activePlayerCount(game),
            }
        });

        // ── Check if all connected players have now voted ──────────────
        this._checkVotingComplete(game, roomId);

        return { action: 'multiple', instructions };
    }

    /**
     * _checkVotingComplete — evaluates whether to advance to REVEAL_RESULTS.
     *
     * Race condition prevention:
     *   The `isAdvancing` flag is checked AND set atomically (single-threaded
     *   Node.js event loop guarantees this is truly atomic). If two `submitVote`
     *   calls arrive in the same tick, only the first will proceed past the
     *   flag check; the second becomes a no-op.
     */
    _checkVotingComplete(game, roomId) {
        if (game.isAdvancing) return; // lock already held — another path is advancing

        const needed = this._activePlayerCount(game);
        const have   = game.currentVotes.size;

        console.log(`[WML:${roomId}] Vote check: ${have}/${needed}`);

        if (have >= needed && needed > 0) {
            // ── Acquire the advancing lock ─────────────────────────────
            game.isAdvancing = true;
            console.log(`[WML:${roomId}] All ${needed} players voted — triggering reveal`);
            this._triggerReveal(roomId, /* forced= */ false);
        }
    }

    /**
     * _triggerReveal — transitions to REVEAL_RESULTS and broadcasts results.
     *
     * @param {string}  roomId
     * @param {boolean} forced — true when called from the voting timer (timeout)
     *
     * This is the single chokepoint for the VOTING_ACTIVE → REVEAL_RESULTS
     * transition. It can be called from two paths:
     *   1. _checkVotingComplete (all votes received — happy path)
     *   2. votingTimer callback (time's up — forced path)
     *
     * The isAdvancing lock ensures only one path wins.
     */
    _triggerReveal(roomId, forced) {
        const game = this.activeGames.get(roomId);
        if (!game) return;

        // If forced by timer but isAdvancing was already set by vote completion,
        // the transition already happened — skip silently.
        if (forced && game.isAdvancing && game.phase === PHASE.REVEAL_RESULTS) {
            console.log(`[WML:${roomId}] Timer fired but reveal already in progress — no-op`);
            return;
        }

        // Set lock (defensive — in the forced path isAdvancing may not be set yet)
        game.isAdvancing = true;

        // Kill the voting timer to prevent double-fire
        this._clearVotingTimer(game);

        game.phase = PHASE.REVEAL_RESULTS;
        console.log(`[WML:${roomId}] ▶ Phase → REVEAL_RESULTS (forced=${forced})`);

        const results = this._computeResults(game);

        // Broadcast results to all players in the room
        if (this.ioRef) {
            this.ioRef.to(roomId).emit('whos-most-likely-results', results);
        }

        // ── Start the results display timer ───────────────────────────
        // After RESULTS_DISPLAY_MS, the server advances to next round or ends game.
        game.resultsTimer = setTimeout(() => {
            this._advanceToNextRound(roomId);
        }, RESULTS_DISPLAY_MS);
    }

    /**
     * _advanceToNextRound — called automatically by resultsTimer.
     * Transitions: REVEAL_RESULTS → ROUND_END → (next ROUND_START or FINISHED)
     */
    _advanceToNextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return;

        game.phase = PHASE.ROUND_END;
        game.currentPromptIndex++;

        console.log(`[WML:${roomId}] ▶ Phase → ROUND_END — moving to prompt ${game.currentPromptIndex}`);

        // ── End of game check ──────────────────────────────────────────
        if (game.currentPromptIndex >= game.prompts.length) {
            game.phase = PHASE.FINISHED;
            console.log(`[WML:${roomId}] 🏁 All prompts complete — game FINISHED`);

            const finalScores = this._buildFinalScores(game);

            if (this.ioRef) {
                this.ioRef.to(roomId).emit('game-finished', {
                    finished:    true,
                    finalScores,
                });
            }

            // Clean up engine state
            this._clearTimers(roomId);
            this.activeGames.delete(roomId);
            return;
        }

        // ── More rounds to go — start the next one ────────────────────
        console.log(`[WML:${roomId}] ▶ Starting round ${game.currentPromptIndex + 1}/${game.prompts.length}`);

        const beginInstruction = this._beginRound(roomId);
        if (beginInstruction && this.ioRef) {
            // Execute the broadcast directly (we already hold ioRef)
            this.ioRef.to(roomId).emit(beginInstruction.event, beginInstruction.data);
        }
    }

    /**
     * removePlayer — called by GameRouter when a player disconnects.
     *
     * Disconnect handling strategy:
     *   - Mark the player as isConnected = false.
     *   - If we're in VOTING_ACTIVE, recalculate the needed threshold and
     *     immediately re-run _checkVotingComplete in case the disconnecting
     *     player was the only one blocking the reveal.
     *   - If all connected players have already voted (the ghost was the last),
     *     this will advance the round immediately rather than waiting for
     *     a timer that can never resolve.
     */
    removePlayer(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return null;

        const player = game.allPlayers.get(userId);
        if (!player) return null;

        // Mark as disconnected — this shrinks _activePlayerCount()
        player.isConnected = false;
        console.log(`[WML:${roomId}] 🔌 Player ${userId} disconnected — ${this._activePlayerCount(game)} active remaining`);

        // If they hadn't voted yet and we're actively voting,
        // recheck completion with the new (smaller) threshold.
        if (game.phase === PHASE.VOTING_ACTIVE && !player.hasVoted) {
            console.log(`[WML:${roomId}] Recalculating vote threshold after disconnect...`);
            this._checkVotingComplete(game, roomId);
        }

        // Emit a player-left notification so other clients can update their UI
        return {
            action: 'broadcast',
            event:  'whos-most-likely-player-left',
            data: {
                userId,
                playerName:         player.name,
                remainingPlayers:   this._activePlayerCount(game),
            }
        };
    }

    /**
     * endGame — host manually ends the game (rage-quit / early termination).
     */
    endGame(roomId) {
        this._clearTimers(roomId);
        this.activeGames.delete(roomId);
        console.log(`[WML:${roomId}] 🛑 Game ended by host`);
        return {
            action: 'game-ended',
            event:  'whos-most-likely-ended',
            data:   { message: 'Game ended by host' }
        };
    }

    // ── State Sync (for reconnects) ────────────────────────────────────────

    /**
     * getGameState — returns a safe snapshot of the current game state.
     * Called by GameRouter when a player reconnects mid-game.
     */
    getGameState(roomId, userId = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whos-most-likely') return null;

        const currentPrompt = game.prompts[game.currentPromptIndex];
        const player        = userId ? game.allPlayers.get(userId) : null;

        return {
            phase:           game.phase,
            promptIndex:     game.currentPromptIndex,
            totalPrompts:    game.prompts.length,
            prompt:          currentPrompt?.prompt || '',
            category:        currentPrompt?.category || '',
            hasVoted:        player?.hasVoted || false,
            votedCount:      game.currentVotes.size,
            totalNeeded:     this._activePlayerCount(game),
            players:         this._buildPlayerList(game),
        };
    }

    // ── Private Helpers ────────────────────────────────────────────────────

    /**
     * _activePlayerCount — returns the number of players who are CURRENTLY
     * connected. This is the dynamic threshold used for vote completion.
     *
     * This is the KEY function — it is re-evaluated after every disconnect
     * so a ghost player can never block the game indefinitely.
     */
    _activePlayerCount(game) {
        let count = 0;
        for (const p of game.allPlayers.values()) {
            if (p.isConnected) count++;
        }
        return count;
    }

    /**
     * _computeResults — tallies currentVotes and updates totalVoteTally.
     * Idempotency guard (talliedPrompts set) prevents double-counting if
     * called twice for the same round.
     */
    _computeResults(game) {
        const promptIndex   = game.currentPromptIndex;
        const currentPrompt = game.prompts[promptIndex];

        // Per-round vote count (resetted each round, re-derived here)
        const voteCount = new Map();
        for (const uid of game.allPlayers.keys()) {
            voteCount.set(uid, 0);
        }

        for (const [, votedFor] of game.currentVotes) {
            if (votedFor && voteCount.has(votedFor)) {
                voteCount.set(votedFor, voteCount.get(votedFor) + 1);
            }
        }

        // ── Accumulate into season totals (once per prompt) ───────────
        if (!game.talliedPrompts.has(promptIndex)) {
            for (const [uid, count] of voteCount) {
                game.totalVoteTally.set(uid, (game.totalVoteTally.get(uid) || 0) + count);
            }
            game.talliedPrompts.add(promptIndex);
        }

        const maxVotes = Math.max(0, ...voteCount.values());

        const voteResults = [];
        for (const [uid, count] of voteCount) {
            const player = game.allPlayers.get(uid);
            voteResults.push({
                playerId:   uid,
                playerName: player?.name || 'Unknown',
                votes:      count,
                totalVotes: game.totalVoteTally.get(uid) || 0,
                isWinner:   count === maxVotes && maxVotes > 0,
            });
        }

        voteResults.sort((a, b) => b.votes - a.votes);

        return {
            phase:         PHASE.REVEAL_RESULTS,
            promptIndex,
            prompt:        currentPrompt.prompt,
            category:      currentPrompt.category,
            voteResults,
            isLastPrompt:  promptIndex === game.prompts.length - 1,
            nextRoundInMs: RESULTS_DISPLAY_MS,
        };
    }

    /**
     * _buildFinalScores — produces the sorted scoreboard array.
     */
    _buildFinalScores(game) {
        const scores = [];
        for (const [userId, total] of game.totalVoteTally) {
            const player = game.allPlayers.get(userId);
            scores.push({
                playerId:   userId,
                playerName: player?.name || 'Unknown',
                score:      total,
            });
        }
        return scores.sort((a, b) => b.score - a.score);
    }

    /**
     * _buildPlayerList — serialises allPlayers Map for client consumption.
     */
    _buildPlayerList(game) {
        return Array.from(game.allPlayers.values()).map(p => ({
            uid:         p.userId,
            userId:      p.userId,
            name:        p.name,
            avatar:      p.avatar,
            isHost:      p.isHost,
            isConnected: p.isConnected,
        }));
    }

    _clearVotingTimer(game) {
        if (game.votingTimer) {
            clearTimeout(game.votingTimer);
            game.votingTimer = null;
        }
    }

    _clearResultsTimer(game) {
        if (game.resultsTimer) {
            clearTimeout(game.resultsTimer);
            game.resultsTimer = null;
        }
    }

    /**
     * _clearTimers — stops ALL server-side timers for a room.
     * Must be called on endGame and room teardown to prevent timer leaks.
     */
    _clearTimers(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return;
        this._clearVotingTimer(game);
        this._clearResultsTimer(game);
    }
}

module.exports = new WhosMostLikelyEngine();
