const { v4: uuidv4 } = require('uuid');

const BOARD_SIZE = 8;
const P1 = 'p1';
const P2 = 'p2';

// Helper to create initial board
const createInitialBoard = () => {
    const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) {
                if (r < 3) b[r][c] = { owner: P2, isKing: false };
                else if (r > 4) b[r][c] = { owner: P1, isKing: false };
            }
        }
    }
    return b;
};

// ─── Checkers Logic Engine ──────────────────────────────────────────────────
const getValidMovesForPiece = (board, r, c, owner, isKing, requireJump = false) => {
    const moves = [];
    const jumps = [];
    const dirs = [];
    if (isKing || owner === P2) dirs.push([1, -1], [1, 1]); // P2 (AI) moves DOWN
    if (isKing || owner === P1) dirs.push([-1, -1], [-1, 1]); // P1 moves UP

    for (const [dr, dc] of dirs) {
        // Normal move
        if (!requireJump) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                moves.push({ to: { r: nr, c: nc }, jump: null });
            }
        }
        // Jump move
        const jr = r + dr * 2, jc = c + dc * 2;
        const mr = r + dr, mc = c + dc; // middle piece
        if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE) {
            if (!board[jr][jc] && board[mr][mc] && board[mr][mc].owner !== owner) {
                jumps.push({ to: { r: jr, c: jc }, jump: { r: mr, c: mc } });
            }
        }
    }
    return jumps.length > 0 ? jumps : (requireJump ? [] : moves);
};

const getAllValidMoves = (board, player) => {
    const allJumps = [];
    const allMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = board[r][c];
            if (p && p.owner === player) {
                const jumps = getValidMovesForPiece(board, r, c, p.owner, p.isKing, true);
                if (jumps.length > 0) {
                    jumps.forEach(j => allJumps.push({ from: { r, c }, ...j }));
                } else if (allJumps.length === 0) {
                    const moves = getValidMovesForPiece(board, r, c, p.owner, p.isKing, false);
                    moves.forEach(m => allMoves.push({ from: { r, c }, ...m }));
                }
            }
        }
    }
    // Forced jump rule
    return allJumps.length > 0 ? allJumps : allMoves;
};

const applyMove = (board, move) => {
    const newBoard = board.map(row => [...row]);
    const piece = { ...newBoard[move.from.r][move.from.c] };
    newBoard[move.from.r][move.from.c] = null;
    
    let madeKing = false;
    // King promotion
    if (!piece.isKing) {
        if ((piece.owner === P1 && move.to.r === 0) || (piece.owner === P2 && move.to.r === BOARD_SIZE - 1)) {
            piece.isKing = true;
            madeKing = true;
        }
    }
    newBoard[move.to.r][move.to.c] = piece;

    if (move.jump) {
        newBoard[move.jump.r][move.jump.c] = null;
    }
    return { newBoard, madeKing };
};

const checkWinCondition = (board, turnPlayer) => {
    let p1Count = 0;
    let p2Count = 0;
    board.forEach(row => row.forEach(p => {
        if (p?.owner === P1) p1Count++;
        else if (p?.owner === P2) p2Count++;
    }));
    
    if (p1Count === 0) return P2;
    if (p2Count === 0) return P1;
    
    // Check if current player has no valid moves
    const moves = getAllValidMoves(board, turnPlayer);
    if (moves.length === 0) {
        return turnPlayer === P1 ? P2 : P1;
    }
    return null;
};

// ─── Minimax AI ─────────────────────────────────────────────────────────────
const evaluateBoard = (board) => {
    let score = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = board[r][c];
            if (p) {
                const val = p.isKing ? 3 : 1;
                const posBonus = p.isKing ? 0 : (p.owner === P2 ? r * 0.1 : (7 - r) * 0.1);
                score += p.owner === P2 ? (val + posBonus) : -(val + posBonus);
            }
        }
    }
    return score;
};

const minimax = (board, depth, alpha, beta, isMaximizing, player) => {
    const moves = getAllValidMoves(board, player);
    if (depth === 0 || moves.length === 0) {
        return { score: evaluateBoard(board) };
    }

    let bestMove = null;
    if (isMaximizing) { // P2 AI
        let maxEval = -Infinity;
        for (const move of moves) {
            const { newBoard } = applyMove(board, move);
            const evalResult = minimax(newBoard, depth - 1, alpha, beta, false, P1);
            if (evalResult.score > maxEval) {
                maxEval = evalResult.score;
                bestMove = move;
            }
            alpha = Math.max(alpha, evalResult.score);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const { newBoard } = applyMove(board, move);
            const evalResult = minimax(newBoard, depth - 1, alpha, beta, true, P2);
            if (evalResult.score < minEval) {
                minEval = evalResult.score;
                bestMove = move;
            }
            beta = Math.min(beta, evalResult.score);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
};

class CheckersEngine {
    constructor() {
        this.activeGames = new Map();
        this.intercepts = ['checkers-ai-turn'];
    }

    createPairs(players) {
        // Shuffle players
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        const matches = [];
        
        while (shuffled.length >= 2) {
            const p1 = shuffled.pop();
            const p2 = shuffled.pop();
            matches.push({
                matchId: uuidv4(),
                p1, // userId
                p2, // userId
                board: createInitialBoard(),
                turn: P1,
                winner: null,
                isMultiJump: false,
                currentJumpingPiece: null
            });
        }
        
        // Odd player gets AI
        if (shuffled.length === 1) {
            matches.push({
                matchId: uuidv4(),
                p1: shuffled.pop(),
                p2: 'ai',
                board: createInitialBoard(),
                turn: P1,
                winner: null,
                isMultiJump: false,
                currentJumpingPiece: null
            });
        }
        return matches;
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        
        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => p.userId);
            
        const gameState = {
            phase: 'playing', // playing | finished
            round: 1,
            matches: this.createPairs(players),
            tournamentWinner: null
        };
        
        this.activeGames.set(roomId, gameState);
        
        const progression = this.checkRoundProgression(roomId, gameState);
        
        const gameStartedInstruction = {
            action: 'broadcast',
            event: 'game-started',
            data: {
                gameType: 'checkers',
                gameState: gameState,
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }
        };
        
        return [gameStartedInstruction, ...progression];
    }

    handleIntercept(eventName, payload, roomId, userId) {
        if (eventName === 'checkers-ai-turn') {
            const gameState = this.activeGames.get(roomId);
            if (!gameState) return null;
            
            const { matchId } = payload;
            const matchIndex = gameState.matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) return null;
            
            const match = gameState.matches[matchIndex];
            if (match.winner || match.turn !== P2 || match.p2 !== 'ai') return null;
            
            // Execute AI move
            const depth = 4; // Medium difficulty
            let moves = getAllValidMoves(match.board, P2);
            let chosenMove = null;
            
            if (match.isMultiJump && match.currentJumpingPiece) {
                // Must continue jump
                const furtherJumps = getValidMovesForPiece(match.board, match.currentJumpingPiece.r, match.currentJumpingPiece.c, P2, match.board[match.currentJumpingPiece.r][match.currentJumpingPiece.c].isKing, true);
                if (furtherJumps.length > 0) {
                    chosenMove = { from: match.currentJumpingPiece, ...furtherJumps[0] };
                }
            } else {
                const aiResult = minimax(match.board, depth, -Infinity, Infinity, true, P2);
                chosenMove = aiResult.move;
            }
            
            if (chosenMove) {
                const { newBoard, madeKing } = applyMove(match.board, chosenMove);
                match.board = newBoard;
                
                if (chosenMove.jump && !madeKing) {
                    const furtherJumps = getValidMovesForPiece(newBoard, chosenMove.to.r, chosenMove.to.c, P2, newBoard[chosenMove.to.r][chosenMove.to.c].isKing, true);
                    if (furtherJumps.length > 0) {
                        match.isMultiJump = true;
                        match.currentJumpingPiece = chosenMove.to;
                    } else {
                        match.isMultiJump = false;
                        match.currentJumpingPiece = null;
                        match.turn = P1;
                    }
                } else {
                    match.isMultiJump = false;
                    match.currentJumpingPiece = null;
                    match.turn = P1;
                }
            } else {
                // No valid moves for AI, human wins
                match.winner = P1;
            }
            
            // Check win
            const winner = checkWinCondition(match.board, match.turn);
            if (winner) match.winner = winner;
            
            return this.checkRoundProgression(roomId, gameState);
        }
    }

    handleEvent(eventName, payload, userId, roomId) {
        const gameState = this.activeGames.get(roomId);
        if (!gameState || gameState.phase !== 'playing') return null;

        if (eventName === 'checkers-move') {
            const { matchId, move } = payload;
            const matchIndex = gameState.matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) return null;
            
            const match = gameState.matches[matchIndex];
            if (match.winner) return null; // match over
            
            // Validate turn
            const expectedOwner = match.p1 === userId ? P1 : (match.p2 === userId ? P2 : null);
            if (!expectedOwner || match.turn !== expectedOwner) return null;
            
            const { newBoard, madeKing } = applyMove(match.board, move);
            match.board = newBoard;
            
            // Handle multi-jump
            if (move.jump && !madeKing) {
                const furtherJumps = getValidMovesForPiece(newBoard, move.to.r, move.to.c, expectedOwner, newBoard[move.to.r][move.to.c].isKing, true);
                if (furtherJumps.length > 0) {
                    match.isMultiJump = true;
                    match.currentJumpingPiece = move.to;
                } else {
                    match.isMultiJump = false;
                    match.currentJumpingPiece = null;
                    match.turn = expectedOwner === P1 ? P2 : P1;
                }
            } else {
                match.isMultiJump = false;
                match.currentJumpingPiece = null;
                match.turn = expectedOwner === P1 ? P2 : P1;
            }
            
            // Check win
            const winner = checkWinCondition(match.board, match.turn);
            if (winner) match.winner = winner;
            
            return this.checkRoundProgression(roomId, gameState);
        }

        return null;
    }

    checkRoundProgression(roomId, gameState) {
        const allFinished = gameState.matches.every(m => m.winner !== null);
        let aiSchedule = null;
        
        if (!allFinished) {
            const aiMatch = gameState.matches.find(m => m.p2 === 'ai' && m.turn === P2 && !m.winner);
            if (aiMatch) {
                aiSchedule = {
                    action: 'schedule',
                    eventToTrigger: 'checkers-ai-turn',
                    delay: 1000,
                    data: { matchId: aiMatch.matchId }
                };
            }
        }
        
        if (allFinished) {
            const winners = [];
            gameState.matches.forEach(m => {
                if (m.winner === P1) winners.push(m.p1);
                else if (m.winner === P2 && m.p2 !== 'ai') winners.push(m.p2);
            });
            
            if (winners.length <= 1) {
                gameState.phase = 'finished';
                gameState.tournamentWinner = winners[0] || null;
            } else {
                gameState.round += 1;
                gameState.matches = this.createPairs(winners);
                // After creating pairs, if an AI is paired and it's their turn (not possible since P1 goes first), 
                // but if we had random start, we would need to check ai schedule here too.
            }
        }
        
        const broadcastInstruction = {
            action: 'broadcast',
            event: 'game-state',
            data: gameState
        };
        
        return [broadcastInstruction, aiSchedule].filter(Boolean);
    }
}

module.exports = new CheckersEngine();
