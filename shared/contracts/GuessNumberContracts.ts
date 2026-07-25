/**
 * GuessNumberContracts.ts
 * 
 * Shared TypeScript definitions for the "Guess the Number" module network layer.
 * This file acts as the source of truth for both the backend (Node.js) and frontend (React Native)
 * ensuring strict type safety across socket boundaries.
 */

// ── Socket Events ─────────────────────────────────────────────────────────────

export const GUESS_NUMBER_EVENTS = {
    // Client -> Server
    SET_SECRET: 'guess-number-set-secret',
    SUBMIT_GUESS: 'guess-number-guess',
    
    // Server -> Client
    STATE_UPDATE: 'game-state-sync',
    GUESS_RESULT: 'guess-number-guess-result',
    GAME_OVER: 'guess-number-game-over',
    ERROR: 'guess-number-error',
} as const;

export type GuessNumberEvent = typeof GUESS_NUMBER_EVENTS[keyof typeof GUESS_NUMBER_EVENTS];

// ── Client Incoming Payloads ──────────────────────────────────────────────────

export interface SetSecretPayload {
    roomId: string;
    secret: number;
}

export interface SubmitGuessPayload {
    roomId: string;
    guess: number;
}

// ── Shared Entities ───────────────────────────────────────────────────────────

export type GamePhase = 'AWAITING_SECRET' | 'PLAYING' | 'GAME_OVER';
export type GuessHint = 'TOO_LOW' | 'TOO_HIGH' | 'CORRECT';

export interface PlayerGuess {
    value: number;
    hint: GuessHint;
}

export interface GuessNumberPlayer {
    userId: string;
    name: string;
    avatar?: string;
    guesses: PlayerGuess[];
    guessCount: number;
    eliminated: boolean;
    isWinner: boolean;
}

// ── Backend Broadcast States ──────────────────────────────────────────────────

/**
 * Base properties shared across all phases of the Guess the Number game.
 */
interface BaseGameState {
    type: 'guess-number';
    gamePhase: GamePhase;
    rangeMin: number;
    rangeMax: number;
    roundNumber: number;
    currentTurnId: string | null;
    maxGuesses: number;
    secretsSetBy: string[];
    players: GuessNumberPlayer[];
}

/**
 * State emitted during active gameplay or while waiting for the secret.
 * CRITICAL: The `secretNumber` MUST NOT be present to prevent client-side inspection cheating.
 */
export interface ActiveGameState extends BaseGameState {
    gamePhase: 'AWAITING_SECRET' | 'PLAYING';
    targets?: never; // Explicitly prevents the property from being assigned
}

/**
 * State emitted when the game concludes.
 * The `secretNumber` is now fully revealed.
 */
export interface GameOverGameState extends BaseGameState {
    gamePhase: 'GAME_OVER';
    targets: Record<string, number>;
}

/**
 * The unified sanitized state payload safely broadcast to clients.
 * Through Discriminated Unions, TypeScript will force you to check `gamePhase === 'GAME_OVER'`
 * before allowing access to `secretNumber`.
 */
export type SanitizedGuessNumberState = ActiveGameState | GameOverGameState;
