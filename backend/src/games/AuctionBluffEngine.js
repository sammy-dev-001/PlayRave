// ============================================================================
// AuctionBluffEngine.js — Bidding & Bluffing Game
// ============================================================================
// Each round an item is shown with either its REAL or FAKE fact.
// If the fact is real, the item has value. If fake, it's worth 0.
// Players bid. The highest bidder wins the item and pays their bid.
// Final score = Remaining Cash + Collection Value.
//
// Phase flow: waiting → bidding → results → (next round or finished)
// ============================================================================

class AuctionBluffEngine {
    constructor() {
        this.activeGames = new Map(); // roomId → gameState
    }

    // ── Standard Interface ──────────────────────────────────────────────────

    startGame(room) {
        const roomId           = room.id;
        const hostParticipates = room.settings?.hostParticipates !== false;
        const { getRandomAuctionItems } = require('../data/auctionBluffItems');

        const players = (hostParticipates ? room.players : room.players.filter(p => !p.isHost))
            .map(p => ({
                userId:          p.id,
                name:            p.name,
                avatar:          p.avatar || null,
                cash:            5000,
                collectionValue: 0,
                itemsBought:     [],
                currentBid:      0,
                hasBid:          false,
            }));

        const STARTING_CASH = 5000;
        const rounds        = Math.min(players.length * 2, 8);
        const items         = getRandomAuctionItems(rounds);

        const gameState = {
            type:         'auction-bluff',
            roomId,
            players,
            items,
            currentRound: 0,
            totalRounds:  rounds,
            currentItem:  null,
            currentFact:  null, // { text, isReal }
            phase:        'waiting', // waiting | bidding | results | finished
            roundTimeSec: 30,
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
            case 'start-round':   return this._startRound(roomId);
            case 'submit-bid':    return this._submitBid(roomId, userId, payload.amount);
            case 'end-bidding':   return this._endBidding(roomId);
            case 'next-round':    return this._nextRound(roomId);
            case 'get-state':     return this._getState(roomId, userId);
            default:
                return { action: 'error', message: `Unknown auction-bluff event: ${eventName}` };
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
            currentRound: game.currentRound + 1,
            totalRounds:  game.totalRounds,
            currentItem:  game.currentItem ? {
                name:        game.currentItem.name,
                description: game.currentItem.description,
                baseValue:   game.currentItem.baseValue,
            } : null,
            currentFact:  game.currentFact ? game.currentFact.text : null,
            players: game.players.map(p => ({
                userId:          p.userId,
                name:            p.name,
                avatar:          p.avatar,
                cash:            p.cash,
                collectionValue: p.collectionValue,
                hasBid:          p.hasBid,
            })),
        };
    }

    _startRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        const item     = game.items[game.currentRound];
        const showReal = Math.random() > 0.5;

        game.currentItem = item;
        game.currentFact = { text: showReal ? item.realFact : item.fakeFact, isReal: showReal };
        game.phase       = 'bidding';

        game.players.forEach(p => { p.currentBid = 0; p.hasBid = false; });

        return {
            action: 'broadcast',
            event:  'auction-round-start',
            data: {
                round:      game.currentRound + 1,
                totalRounds: game.totalRounds,
                item: {
                    name:        item.name,
                    description: item.description,
                    baseValue:   item.baseValue,
                },
                fact:        game.currentFact.text,
                cash:        game.players.reduce((acc, p) => { acc[p.userId] = p.cash; return acc; }, {}),
                roundTimeSec: game.roundTimeSec,
            },
        };
    }

    _submitBid(roomId, userId, amount) {
        const game = this.activeGames.get(roomId);
        if (!game)                    return { action: 'error', message: 'Game not found' };
        if (game.phase !== 'bidding') return { action: 'error', message: 'Not in bidding phase' };

        const player = game.players.find(p => p.userId === userId);
        if (!player)             return { action: 'error', message: 'Player not found' };
        if (amount > player.cash) return { action: 'error', message: 'Insufficient funds' };
        if (amount < 0)          return { action: 'error', message: 'Invalid bid' };

        player.currentBid = amount;
        player.hasBid     = true;

        const bidCount  = game.players.filter(p => p.hasBid).length;
        const allBid    = bidCount >= game.players.length;

        if (allBid) return this._endBidding(roomId);

        return {
            action: 'broadcast',
            event:  'auction-bid-update',
            data:   { bidCount, totalPlayers: game.players.length },
        };
    }

    _endBidding(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.phase = 'results';

        const submitted = game.players.filter(p => p.hasBid);
        let winner = null, winningBid = 0;

        if (submitted.length > 0) {
            submitted.sort((a, b) => b.currentBid - a.currentBid);
            winningBid        = submitted[0].currentBid;
            const topBidders  = submitted.filter(p => p.currentBid === winningBid);
            winner            = topBidders[Math.floor(Math.random() * topBidders.length)];
        }

        const actualValue = game.currentFact.isReal ? game.currentItem.baseValue : 0;

        if (winner && winningBid > 0) {
            winner.cash             -= winningBid;
            winner.collectionValue  += actualValue;
            winner.itemsBought.push({
                name:        game.currentItem.name,
                paid:        winningBid,
                actualValue,
                isAuthentic: game.currentFact.isReal,
            });
        }

        return {
            action: 'broadcast',
            event:  'auction-round-results',
            data: {
                winner:      winner ? { userId: winner.userId, name: winner.name, bid: winningBid } : null,
                item:        game.currentItem,
                isReal:      game.currentFact.isReal,
                actualValue,
                players: game.players.map(p => ({
                    userId: p.userId, name: p.name, cash: p.cash, collectionValue: p.collectionValue,
                })),
            },
        };
    }

    _nextRound(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) return { action: 'error', message: 'Game not found' };

        game.currentRound++;

        if (game.currentRound >= game.totalRounds) {
            game.phase = 'finished';
            const finalRankings = game.players
                .map(p => ({
                    userId:          p.userId,
                    name:            p.name,
                    cash:            p.cash,
                    collectionValue: p.collectionValue,
                    totalScore:      p.cash + p.collectionValue,
                }))
                .sort((a, b) => b.totalScore - a.totalScore);

            this.activeGames.delete(roomId);
            return {
                action: 'broadcast',
                event:  'auction-game-finished',
                data:   { finished: true, rankings: finalRankings, winner: finalRankings[0] },
            };
        }

        game.phase = 'waiting';
        return {
            action: 'broadcast',
            event:  'auction-next-round',
            data:   { finished: false, nextRound: game.currentRound + 1 },
        };
    }
}

module.exports = new AuctionBluffEngine();
