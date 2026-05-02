// ============================================================================
// WhotEngine.js — Pure Game Logic Engine
// ============================================================================
// Decoupled from Socket.io. Returns instruction payloads to the GameRouter.
// Player identity uses persistent 'userId' rather than 'socketId'.
// ============================================================================

const { createWhotDeck, shuffleDeck } = require('../data/whotCards');

class WhotEngine {
    constructor() {
        this.activeGames = new Map();
    }

    handleEvent(eventName, payload, userId, roomId) {
        switch (eventName) {
            case 'whot-play-card':
                return this.playWhotCard(roomId, userId, payload.cardId, payload.calledShape);
            case 'whot-draw-cards':
                return this.drawWhotCards(roomId, userId, payload.count);
            case 'whot-end-game':
                return this.endGame(roomId);
            default:
                return { action: 'error', message: `Unknown Whot event: ${eventName}` };
        }
    }

    startGame(room, options = {}) {
        const roomId = room.id;
        const hostParticipates = options.hostParticipates !== false;
        console.log(`[WhotEngine] Starting game in room ${roomId}. hostParticipates: ${hostParticipates}. Total players in room: ${room.players.length}`);

        const participatingPlayers = room.players.filter(p => hostParticipates || !p.isHost);
        console.log(`[WhotEngine] Participating players count: ${participatingPlayers.length}`);

        if (participatingPlayers.length < 2) {
            return { action: 'error', message: 'Whot requires at least 2 players' };
        }
        if (participatingPlayers.length > 8) {
            return { action: 'error', message: 'Whot supports maximum 8 players' };
        }

        const deck = shuffleDeck(createWhotDeck());
        const playerHands = {};
        const playerOrder = [];

        participatingPlayers.forEach(player => {
            playerHands[player.userId] = deck.splice(0, 6);
            playerOrder.push(player.userId);
        });

        const discardPile = [deck.pop()];

        const gameState = {
            type: 'whot',
            roomId,
            deck,
            discardPile,
            playerHands,
            playerOrder,
            currentPlayerIndex: 0,
            direction: 1,
            topCard: discardPile[0],
            calledShape: null,
            attackStack: 0,
            status: 'PLAYING',
            hostParticipates,
            winner: null
        };

        this.activeGames.set(roomId, gameState);

        const instructions = room.players.map(p => ({
            action: 'emit',
            targetId: p.userId,
            event: 'game-started',
            data: {
                gameType: 'whot',
                gameState: this.getWhotGameState(roomId, p.userId),
                players: room.players.map(pl => ({ uid: pl.userId, userId: pl.userId, id: pl.socketId, name: pl.name, avatar: pl.avatar })),
                hostParticipates
            }
        }));


        return { action: 'multiple', instructions };
    }

    getWhotGameState(roomId, userId) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return null;

        return {
            topCard: game.topCard,
            calledShape: game.calledShape,
            attackStack: game.attackStack || 0,
            currentPlayerId: game.playerOrder[game.currentPlayerIndex],
            playerHand: game.playerHands[userId] || [],
            otherPlayers: game.playerOrder.map(pid => ({
                id: pid,
                cardCount: game.playerHands[pid].length,
                isCurrentPlayer: pid === game.playerOrder[game.currentPlayerIndex]
            })),
            deckCount: game.deck.length,
            status: game.status,
            winner: game.winner
        };
    }

    canPlayCard(game, card) {
        const topCard = game.topCard;

        if (game.attackStack > 0) {
            const attackCardNumber = topCard.number;
            if (attackCardNumber === 14) return false;
            if (card.number === attackCardNumber) return true;
            return false;
        }

        if (card.shape === 'whot') return true;

        if (game.calledShape) {
            return card.shape === game.calledShape;
        }

        return card.shape === topCard.shape || card.number === topCard.number;
    }

    playWhotCard(roomId, userId, cardId, calledShape = null) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return { action: 'error', targetId: userId, message: 'Game not found' };

        const currentPlayerId = game.playerOrder[game.currentPlayerIndex];
        if (currentPlayerId !== userId) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Not your turn' } };
        }

        const playerHand = game.playerHands[userId];
        const cardIndex = playerHand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Card not in hand' } };
        }

        const card = playerHand[cardIndex];

        if (!this.canPlayCard(game, card)) {
            return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Invalid move' } };
        }

        playerHand.splice(cardIndex, 1);
        game.discardPile.push(card);
        game.topCard = card;

        if (card.shape === 'whot') {
            if (!calledShape) {
                return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Must call a shape for Whot card' } };
            }
            game.calledShape = calledShape;
        } else {
            game.calledShape = null;
        }

        if (playerHand.length === 0) {
            game.status = 'FINISHED';
            game.winner = userId;
            return {
                action: 'broadcast',
                event: 'whot-game-ended',
                data: { winner: userId, gameState: this.getWhotGameState(roomId, null) }
            };
        }

        const actionTaken = this.handleWhotSpecialCard(game, card);
        if (actionTaken !== 'skip') {
            this.moveToNextPlayer(game);
        }

        const instructions = game.playerOrder.map(pid => ({
            action: 'emit',
            targetId: pid,
            event: 'whot-state-update',
            data: {
                actionTaken,
                topCard: game.topCard,
                calledShape: game.calledShape,
                gameState: this.getWhotGameState(roomId, pid)
            }
        }));

        return { action: 'multiple', instructions };
    }

    handleWhotSpecialCard(game, card) {
        if (!card.isSpecial) return null;

        switch (card.action) {
            case 'pick2':
                game.attackStack = (game.attackStack || 0) + 2;
                return 'pick2';

            case 'pick3':
                game.attackStack = (game.attackStack || 0) + 3;
                return 'pick3';

            case 'general-market':
                const currentGMPlayer = game.playerOrder[game.currentPlayerIndex];
                game.playerOrder.forEach(pid => {
                    if (pid !== currentGMPlayer) {
                        const playerHand = game.playerHands[pid];
                        if (game.deck.length === 0) {
                            const topCard = game.discardPile.pop();
                            game.deck = shuffleDeck(game.discardPile);
                            game.discardPile = [topCard];
                        }
                        if (game.deck.length > 0) {
                            playerHand.push(game.deck.pop());
                        }
                    }
                });
                return 'general-market';

            case 'hold-on':
                return 'skip';

            case 'suspension':
                this.moveToNextPlayer(game);
                this.moveToNextPlayer(game);
                return 'skip';

            default:
                return null;
        }
    }

    drawWhotCards(roomId, userId, count = 1) {
        const game = this.activeGames.get(roomId);
        if (!game || game.type !== 'whot') return { action: 'emit', targetId: userId, event: 'error', data: { message: 'Game not found' } };

        const playerHand = game.playerHands[userId];
        const cardsToDraw = game.attackStack > 0 ? game.attackStack : count;

        for (let i = 0; i < cardsToDraw; i++) {
            if (game.deck.length === 0) {
                const topCard = game.discardPile.pop();
                game.deck = shuffleDeck(game.discardPile);
                game.discardPile = [topCard];
            }

            if (game.deck.length > 0) {
                playerHand.push(game.deck.pop());
            }
        }

        if (game.attackStack > 0) {
            game.attackStack = 0;
        }

        this.moveToNextPlayer(game);

        const instructions = game.playerOrder.map(pid => ({
            action: 'emit',
            targetId: pid,
            event: 'whot-state-update',
            data: {
                gameState: this.getWhotGameState(roomId, pid)
            }
        }));

        return { action: 'multiple', instructions };
    }

    moveToNextPlayer(game) {
        game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.playerOrder.length) % game.playerOrder.length;
    }

    endGame(roomId) {
        this.activeGames.delete(roomId);
        return {
            action: 'broadcast',
            event: 'whot-game-ended',
            data: { message: 'Game ended by host' }
        };
    }
}

module.exports = new WhotEngine();
