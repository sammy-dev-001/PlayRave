/**
 * WhotAIEngine — Strategic AI for Naija Whot.
 * 
 * Logic:
 * 1. Defend against attacks (Pick 2 / Pick 3).
 * 2. Prioritize playing special cards if they help (e.g., Hold On to skip, Suspension).
 * 3. Choose the best shape to call when playing a Whot (20) card.
 * 4. Pick a card that matches the current top card or called shape.
 */

class WhotAIEngine {
    /**
     * Determines the best move for the AI.
     * @param {Object} gameState - The current full state of the Whot game.
     * @param {String} botUserId - The ID of the bot player.
     * @returns {Object|null} - The move to play { cardId, calledShape } or null to draw.
     */
    pickMove(gameState, botUserId) {
        const hand = gameState.playerHands[botUserId];
        const topCard = gameState.topCard;
        const calledShape = gameState.calledShape;
        const attackStack = gameState.attackStack || 0;

        if (!hand || hand.length === 0) return null;

        // 0. COMPULSORY DRAW: General Market active
        if (gameState.generalMarketTurns > 0) {
            return null; // Must draw
        }

        // 1. DEFENSE: If being attacked (Pick 2 / Pick 3)
        if (attackStack > 0) {
            // Must play a card of the same number to defend/counter-attack
            const defensiveCards = hand.filter(c => c.number === topCard.number);
            if (defensiveCards.length > 0) {
                // Prioritize special cards (counter-attack)
                const specialDefensive = defensiveCards.find(c => c.isSpecial);
                return { cardId: (specialDefensive || defensiveCards[0]).id };
            }
            return null; // Must draw
        }

        // 2. FILTER LEGAL MOVES
        const legalMoves = hand.filter(card => {
            if (card.shape === 'whot') return true;
            if (calledShape) return card.shape === calledShape;
            return card.shape === topCard.shape || card.number === topCard.number;
        });

        if (legalMoves.length === 0) return null; // Must draw

        // 3. STRATEGY: Prioritize cards
        
        // A. If we have a 'Whot' (20) card, check if we should save it
        const whotCard = legalMoves.find(c => c.shape === 'whot');
        if (whotCard && (hand.length === 1 || Math.random() > 0.7)) {
            return { 
                cardId: whotCard.id, 
                calledShape: this.pickBestShapeToCall(hand) 
            };
        }

        // B. Prioritize Special Cards (Pick 2, Pick 3, Suspension, etc.)
        const specials = legalMoves.filter(c => c.isSpecial && c.shape !== 'whot');
        if (specials.length > 0) {
            // Sort by "meanest" first (Pick 3 > Pick 2 > others)
            specials.sort((a, b) => {
                if (a.action === 'pick3') return -1;
                if (b.action === 'pick3') return 1;
                if (a.action === 'pick2') return -1;
                return 0;
            });
            return { cardId: specials[0].id };
        }

        // C. Just play a regular card (prefer the shape we have most of)
        const counts = this.getShapeCounts(hand);
        legalMoves.sort((a, b) => (counts[b.shape] || 0) - (counts[a.shape] || 0));

        return { cardId: legalMoves[0].id };
    }

    /**
     * AI logic to decide which shape to call after playing a Whot card.
     */
    pickBestShapeToCall(hand) {
        const counts = this.getShapeCounts(hand.filter(c => c.shape !== 'whot'));
        let bestShape = 'circle';
        let max = -1;

        for (const shape in counts) {
            if (counts[shape] > max) {
                max = counts[shape];
                bestShape = shape;
            }
        }
        return bestShape;
    }

    getShapeCounts(hand) {
        return hand.reduce((acc, card) => {
            acc[card.shape] = (acc[card.shape] || 0) + 1;
            return acc;
        }, {});
    }
}

module.exports = new WhotAIEngine();
