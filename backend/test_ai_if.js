const gameManager = require('./src/managers/gameManager');
const roomManager = require('./src/managers/roomManager');
const { warmUp } = require('./src/ai/ScrabbleAIEngine');

warmUp();

async function runGame() {
    const roomId = 'test-room-' + Date.now();
    const room = roomManager.createLocalRoom(roomId, 'p1', 'Player 1');
    const game = gameManager.startScrabbleSinglePlayerGame(roomId, room, 'medium');

    game.players[0].isAI = true; // Make both players AI for fast simulation

    let turn = 1;
    while (game.phase === 'playing') {
        const currentPlayer = game.players[game.currentPlayerIndex];
        const { findBestMove } = require('./src/ai/ScrabbleAIEngine');
        const move = findBestMove(game.board, currentPlayer.hand, game.tileBag, 'medium');

        if (move && move.type === 'move') {
            const rawResult = gameManager.scrabbleSubmitMove(roomId, currentPlayer.id, move.tiles);
            if (rawResult.error) {
                console.error("RAW RESULT:", rawResult);
                require('fs').writeFileSync('result_dump.json', JSON.stringify({
                    error: rawResult.error,
                    invalidWords: rawResult.invalidWords,
                    tilesPlayed: move.tiles
                }, null, 2));
                break;
            }
        }
        
        const result = gameManager.executeScrabbleAITurn(roomId);
        
        if (result.aiAction === 'pass' && result.fallback) {
            console.error(`\n[CRASH] AI Move was rejected! Reason: ${result.rejectedReason}`);
            console.error(`Invalid words found:`, result.invalidWords);
            require('fs').writeFileSync('result_dump.json', JSON.stringify({
                reason: result.rejectedReason,
                invalidWords: result.invalidWords,
                hand: currentPlayer.hand,
                result: result
            }, null, 2));
            break;
        }

        if (turn > 400 || game.passCount >= 4) break;
        turn++;
    }
    console.log(`Game ended on turn ${turn}.`);
}

runGame();
