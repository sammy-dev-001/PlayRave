// ============================================================================
// TicTacToeEngine.js — Bracket-Style Tournament (1v1 matches, supports AI)
// ============================================================================
// Players are paired into 1v1 Tic-Tac-Toe matches in a tournament bracket.
// Odd player counts are paired with an AI bot using a Minimax algorithm.
// All bracket entries (player1, player2, currentTurn, winner) use userId.
//
// Phase flow: lobby → playing → matchResult → roundComplete → finished
// ============================================================================

class TicTacToeEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId           = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;

        const allPlayers = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({ userId: p.userId, name: p.name, avatar: p.avatar || null, eliminated: false, wins: 0 }));

        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
        const matches  = this._createMatches(shuffled);

        const gameState = {
            type:              'tic-tac-toe',
            roomId,
            players:           allPlayers,
            activePlayers:     shuffled,
            matches,
            currentMatchIndex: 0,
            currentMatch:      matches[0] || null,
            roundNumber:       1,
            phase:             'lobby', // lobby | playing | matchResult | roundComplete | finished
        };

        this.activeGames.set(roomId, gameState);
        return {
            action: 'broadcast',
            event:  'game-started',
            data:   this._publicState(gameState),
        };
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'start-match':    return this._startMatch(roomId);
            case 'make-move':      return this._makeMove(roomId, userId, payload.position);
            case 'ai-move':        return this._makeAIMove(roomId);
            case 'next-match':     return this._nextMatch(roomId);
            case 'get-state':      return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown tic-tac-toe event: ${eventName}` };
        }
    }

    // ── Private Handlers ────────────────────────────────────────────────────

    _getState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };
        return {
            action:   'emit',
            targetId: userId,
            event:    'game-state-sync',
            data:     this._publicState(game),
        };
    }

    _publicState(game) {
        return {
            type:         game.type,
            phase:        game.phase,
            roundNumber:  game.roundNumber,
            currentMatch: game.matches[game.currentMatchIndex]
                ? this._safeMatch(game.matches[game.currentMatchIndex]) : null,
            players:      game.players.map(p => ({
                userId: p.userId, name: p.name, wins: p.wins, eliminated: p.eliminated,
            })),
        };
    }

    _safeMatch(match) {
        return {
            player1:     { userId: match.player1.userId, name: match.player1.name, isAI: match.player1.isAI || false },
            player2:     { userId: match.player2.userId, name: match.player2.name, isAI: match.player2.isAI || false },
            board:       match.board,
            currentTurn: match.currentTurn,
            winner:      match.winner,
            completed:   match.completed,
            isAIMatch:   match.isAIMatch || false,
        };
    }

    _startMatch(roomId) {
        const game  = this.activeGames.get(roomId);
        if (!game)  return { action: 'error', message: 'Game not found' };

        const match = game.matches[game.currentMatchIndex];
        if (!match || match.completed) return { action: 'error', message: 'No active match' };

        game.phase         = 'playing';
        match.board        = Array(9).fill(null);
        match.currentTurn  = match.player1.userId;
        match.winner       = null;
        match.completed    = false;

        return {
            action: 'broadcast',
            event:  'ttt-match-start',
            data: {
                player1:     { userId: match.player1.userId, name: match.player1.name, symbol: 'X', isAI: match.player1.isAI || false },
                player2:     { userId: match.player2.userId, name: match.player2.name, symbol: 'O', isAI: match.player2.isAI || false },
                currentTurn: match.currentTurn,
                board:       match.board,
                matchNumber: game.currentMatchIndex + 1,
                roundNumber: game.roundNumber,
                isAIMatch:   match.isAIMatch || false,
            },
        };
    }

    _makeMove(roomId, userId, position) {
        const game = this.activeGames.get(roomId);
        if (!game)                    return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'playing') return { action: 'error', message: 'Match not active' };

        const match = game.matches[game.currentMatchIndex];
        if (!match || match.completed)     return { action: 'error', message: 'No active match' };
        if (match.currentTurn !== userId)  return { action: 'error', message: 'Not your turn' };
        if (match.board[position] !== null) return { action: 'error', message: 'Position taken' };

        const symbol = userId === match.player1.userId ? 'X' : 'O';
        match.board[position] = symbol;

        const winnerSymbol = this._checkWinner(match.board);
        const isDraw       = !winnerSymbol && match.board.every(c => c !== null);

        if (winnerSymbol || isDraw) {
            match.completed = true;
            match.winner    = winnerSymbol
                ? (winnerSymbol === 'X' ? match.player1 : match.player2)
                : null;
            if (match.winner) match.winner.wins++;
            game.phase = 'matchResult';

            return {
                action: 'broadcast',
                event:  'ttt-move',
                data: {
                    board: match.board, position, symbol, gameOver: true,
                    winner:  match.winner ? { userId: match.winner.userId, name: match.winner.name } : null,
                    isDraw,
                },
            };
        }

        match.currentTurn = userId === match.player1.userId ? match.player2.userId : match.player1.userId;
        const nextPlayer  = match.currentTurn === match.player1.userId ? match.player1 : match.player2;

        return {
            action: 'broadcast',
            event:  'ttt-move',
            data: {
                board: match.board, position, symbol, gameOver: false,
                currentTurn: match.currentTurn,
                isAITurn:    nextPlayer.isAI || false,
            },
        };
    }

    _makeAIMove(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.phase !== 'playing') return { action: 'error', message: 'Match not active' };

        const match = game.matches[game.currentMatchIndex];
        if (!match || match.completed) return { action: 'error', message: 'No active match' };

        const aiPlayer = match.player1.isAI ? match.player1 : (match.player2.isAI ? match.player2 : null);
        if (!aiPlayer)                           return { action: 'error', message: 'No AI in this match' };
        if (match.currentTurn !== aiPlayer.userId) return { action: 'error', message: 'Not AI turn' };

        const aiSymbol    = aiPlayer === match.player1 ? 'X' : 'O';
        const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';
        const position    = this._getAIMove([...match.board], aiSymbol, humanSymbol);

        // Reuse _makeMove by temporarily spoofing turn via the AI userId
        return this._makeMove(roomId, aiPlayer.userId, position);
    }

    _nextMatch(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentMatchIndex++;
        const allComplete = game.matches.every(m => m.completed);

        if (allComplete) {
            const winners = game.matches.filter(m => m.winner).map(m => m.winner);

            if (winners.length === 1) {
                game.phase = 'finished';
                this.activeGames.delete(roomId);
                return {
                    action: 'broadcast',
                    event:  'ttt-tournament-finished',
                    data: {
                        finished:  true,
                        champion:  { userId: winners[0].userId, name: winners[0].name },
                        allPlayers: game.players.sort((a, b) => b.wins - a.wins),
                    },
                };
            }

            // Create next round
            game.roundNumber++;
            game.matches           = this._createMatches(winners);
            game.currentMatchIndex = 0;
            game.phase             = 'roundComplete';

            return {
                action: 'broadcast',
                event:  'ttt-round-complete',
                data: {
                    finished:         false,
                    roundComplete:    true,
                    nextRound:        game.roundNumber,
                    remainingPlayers: winners.length,
                    nextMatches:      game.matches.map(m => ({
                        player1: m.player1.name,
                        player2: m.player2.name,
                    })),
                },
            };
        }

        game.phase        = 'lobby';
        game.currentMatch = game.matches[game.currentMatchIndex];
        return {
            action: 'broadcast',
            event:  'ttt-next-match',
            data: {
                finished:       false,
                roundComplete:  false,
                nextMatchIndex: game.currentMatchIndex,
                nextMatch:      this._safeMatch(game.currentMatch),
            },
        };
    }

    // ── Tournament Helpers ─────────────────────────────────────────────────

    _createMatches(players) {
        const matches = [];
        for (let i = 0; i < players.length; i += 2) {
            if (players[i + 1]) {
                matches.push({
                    player1:     players[i],
                    player2:     players[i + 1],
                    board:       Array(9).fill(null),
                    currentTurn: players[i].userId,
                    winner:      null,
                    completed:   false,
                    isAIMatch:   players[i].isAI || players[i + 1].isAI || false,
                });
            } else {
                // Odd player — AI opponent
                const ai = { userId: `ai-bot-${Date.now()}`, name: '🤖 AI Bot', isAI: true, wins: 0 };
                matches.push({
                    player1:     players[i],
                    player2:     ai,
                    board:       Array(9).fill(null),
                    currentTurn: players[i].userId,
                    winner:      null,
                    completed:   false,
                    isAIMatch:   true,
                });
            }
        }
        return matches;
    }

    _checkWinner(board) {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6],
        ];
        for (const [a,b,c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
        }
        return null;
    }

    _getAIMove(board, aiSym, humanSym) {
        const empties = board.reduce((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);
        if (!empties.length) return null;

        // Medium: 60% optimal, 40% random
        if (Math.random() < 0.6) {
            let bestScore = -Infinity, bestMove = empties[0];
            for (const i of empties) {
                board[i] = aiSym;
                const s  = this._minimax(board, 0, false, aiSym, humanSym);
                board[i] = null;
                if (s > bestScore) { bestScore = s; bestMove = i; }
            }
            return bestMove;
        }
        return empties[Math.floor(Math.random() * empties.length)];
    }

    _minimax(board, depth, isMax, aiSym, humanSym) {
        const w = this._checkWinner(board);
        if (w === aiSym)    return 10 - depth;
        if (w === humanSym) return depth - 10;
        if (board.every(c => c)) return 0;

        const empties = board.reduce((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);
        if (isMax) {
            let best = -Infinity;
            for (const i of empties) {
                board[i] = aiSym;
                best     = Math.max(best, this._minimax(board, depth + 1, false, aiSym, humanSym));
                board[i] = null;
            }
            return best;
        } else {
            let best = Infinity;
            for (const i of empties) {
                board[i] = humanSym;
                best     = Math.min(best, this._minimax(board, depth + 1, true, aiSym, humanSym));
                board[i] = null;
            }
            return best;
        }
    }
}

module.exports = new TicTacToeEngine();
