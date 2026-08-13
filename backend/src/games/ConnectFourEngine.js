const { v4: uuidv4 } = require('uuid');

const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const P1 = 'p1';
const P2 = 'p2'; // AI is always P2

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

const getLowestEmpty = (board, col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (!board[row][col]) return row;
    }
    return -1;
};

const dropPiece = (board, col, piece) => {
    const row = getLowestEmpty(board, col);
    if (row === -1) return board;
    const next = board.map(r => [...r]);
    next[row][col] = piece;
    return next;
};

const getValidCols = (board) =>
    Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === EMPTY);

const isBoardFull = (board) => board[0].every(c => c !== EMPTY);

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // H, V, D↘, D↗

const checkWinner = (board) => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = board[r][c];
            if (!p) continue;
            for (const [dr, dc] of DIRECTIONS) {
                let count = 1;
                while (
                    count < 4 &&
                    r + dr * count >= 0 && r + dr * count < ROWS &&
                    c + dc * count >= 0 && c + dc * count < COLS &&
                    board[r + dr * count][c + dc * count] === p
                ) count++;
                if (count >= 4) return p;
            }
        }
    }
    return null;
};

const scoreWindow = (window, piece) => {
    const opp = piece === P2 ? P1 : P2;
    const pCount = window.filter(c => c === piece).length;
    const eCount = window.filter(c => c === EMPTY).length;
    const oCount = window.filter(c => c === opp).length;
    if (oCount > 0 && pCount > 0) return 0;
    if (pCount === 4) return 100;
    if (pCount === 3 && eCount === 1) return 5;
    if (pCount === 2 && eCount === 2) return 2;
    if (oCount === 3 && eCount === 1) return -4;
    return 0;
};

const scoreBoard = (board) => {
    let score = 0;
    const centerCol = board.map(row => row[3]);
    score += centerCol.filter(c => c === P2).length * 3;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], P2);
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - 4; r++) {
            score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], P2);
        }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], P2);
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], P2);
        }
    }
    return score;
};

const minimax = (board, depth, alpha, beta, isMaximizing) => {
    const winner = checkWinner(board);
    if (winner === P2)     return 100000 + depth;
    if (winner === P1) return -100000 - depth;
    if (isBoardFull(board) || depth === 0) return scoreBoard(board);

    const cols = getValidCols(board);
    if (isMaximizing) {
        let value = -Infinity;
        for (const col of cols) {
            value = Math.max(value, minimax(dropPiece(board, col, P2), depth - 1, alpha, beta, false));
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return value;
    } else {
        let value = Infinity;
        for (const col of cols) {
            value = Math.min(value, minimax(dropPiece(board, col, P1), depth - 1, alpha, beta, true));
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return value;
    }
};

const getAIMove = (board) => {
    const validCols = getValidCols(board);
    if (!validCols.length) return null;

    // Medium difficulty Logic
    for (const col of validCols) {
        if (checkWinner(dropPiece(board, col, P2)) === P2) return col;
    }
    for (const col of validCols) {
        if (checkWinner(dropPiece(board, col, P1)) === P1) return col;
    }
    // Minimax search
    let bestScore = -Infinity;
    let bestCol = validCols[0];
    for (const col of validCols) {
        const score = minimax(dropPiece(board, col, P2), 3, -Infinity, Infinity, false);
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }
    return bestCol;
};

class ConnectFourEngine {
    constructor() {
        this.activeGames = new Map();
        this.intercepts = ['connect-four-ai-turn'];
    }

    createPairs(players) {
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        const matches = [];
        
        while (shuffled.length >= 2) {
            const p1 = shuffled.pop();
            const p2 = shuffled.pop();
            matches.push({
                matchId: uuidv4(),
                p1,
                p2,
                board: emptyBoard(),
                turn: P1,
                winner: null,
                isDraw: false
            });
        }
        
        if (shuffled.length === 1) {
            matches.push({
                matchId: uuidv4(),
                p1: shuffled.pop(),
                p2: 'ai',
                board: emptyBoard(),
                turn: P1,
                winner: null,
                isDraw: false
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
                gameType: 'connect-four',
                gameState: gameState,
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }
        };
        
        return [gameStartedInstruction, ...progression];
    }

    handleIntercept(eventName, payload, roomId, userId) {
        if (eventName === 'connect-four-ai-turn') {
            const gameState = this.activeGames.get(roomId);
            if (!gameState) return null;
            
            const { matchId } = payload;
            const matchIndex = gameState.matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) return null;
            
            const match = gameState.matches[matchIndex];
            if (match.winner || match.isDraw || match.turn !== P2 || match.p2 !== 'ai') return null;
            
            const chosenCol = getAIMove(match.board);
            if (chosenCol !== null) {
                match.board = dropPiece(match.board, chosenCol, P2);
                match.turn = P1;
                
                const winner = checkWinner(match.board);
                if (winner) match.winner = winner;
                else if (isBoardFull(match.board)) match.isDraw = true;
            } else {
                match.isDraw = true;
            }
            
            return this.checkRoundProgression(roomId, gameState);
        }
    }

    handleEvent(eventName, payload, userId, roomId) {
        const gameState = this.activeGames.get(roomId);
        if (!gameState || gameState.phase !== 'playing') return null;

        if (eventName === 'connect-four-move') {
            const { matchId, col } = payload;
            const matchIndex = gameState.matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) return null;
            
            const match = gameState.matches[matchIndex];
            if (match.winner || match.isDraw) return null;
            
            const expectedOwner = match.p1 === userId ? P1 : (match.p2 === userId ? P2 : null);
            if (!expectedOwner || match.turn !== expectedOwner) return null;
            
            const validCols = getValidCols(match.board);
            if (!validCols.includes(col)) return null;
            
            match.board = dropPiece(match.board, col, expectedOwner);
            match.turn = expectedOwner === P1 ? P2 : P1;
            
            const winner = checkWinner(match.board);
            if (winner) match.winner = winner;
            else if (isBoardFull(match.board)) match.isDraw = true;
            
            return this.checkRoundProgression(roomId, gameState);
        }

        return null;
    }

    checkRoundProgression(roomId, gameState) {
        const allFinished = gameState.matches.every(m => m.winner !== null || m.isDraw);
        let aiSchedule = null;
        
        if (!allFinished) {
            const aiMatch = gameState.matches.find(m => m.p2 === 'ai' && m.turn === P2 && !m.winner && !m.isDraw);
            if (aiMatch) {
                aiSchedule = {
                    action: 'schedule',
                    eventToTrigger: 'connect-four-ai-turn',
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
                // In case of a draw, randomly advance one player (or p1 for simplicity since this is a casual party game).
                // Or maybe no one advances? We'll randomly pick to keep the tournament moving.
                else if (m.isDraw) {
                    winners.push(Math.random() < 0.5 ? m.p1 : m.p2);
                }
            });
            
            // Remove 'ai' from winners if somehow they got in through draw logic
            const humanWinners = winners.filter(w => w !== 'ai');
            
            if (humanWinners.length <= 1) {
                gameState.phase = 'finished';
                gameState.tournamentWinner = humanWinners[0] || null;
            } else {
                gameState.round += 1;
                gameState.matches = this.createPairs(humanWinners);
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

module.exports = new ConnectFourEngine();
