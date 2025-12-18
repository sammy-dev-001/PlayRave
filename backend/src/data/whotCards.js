// Naija Whot Card Deck
// Classic Nigerian Whot game with 54 cards

const createWhotDeck = () => {
    const deck = [];

    // Shape cards with numbers
    const shapes = [
        { name: 'circle', count: 14, color: '#FF3FA4' }, // Hot Pink
        { name: 'triangle', count: 14, color: '#00F0FF' }, // Neon Cyan
        { name: 'cross', count: 14, color: '#C6FF4A' }, // Lime Glow
        { name: 'square', count: 13, color: '#9D4EDD' }, // Electric Purple
        { name: 'star', count: 8, color: '#FFD700' } // Gold
    ];

    // Create numbered cards for each shape
    shapes.forEach(shape => {
        for (let i = 1; i <= shape.count; i++) {
            const card = {
                id: `${shape.name}-${i}`,
                shape: shape.name,
                number: i,
                color: shape.color,
                isSpecial: false,
                action: null
            };

            // Mark special action cards - applies to ALL shapes
            if (i === 2) {
                card.isSpecial = true;
                card.action = 'pick2';
            } else if (i === 1) {
                card.isSpecial = true;
                card.action = 'hold-on';
            } else if (i === 8) {
                card.isSpecial = true;
                card.action = 'suspension';
            } else if (i === 14) {
                card.isSpecial = true;
                card.action = 'general-market';
            } else if (i === 5) {
                card.isSpecial = true;
                card.action = 'pick3';
            }

            deck.push(card);
        }
    });

    // Add 4 Whot cards (wild cards)
    for (let i = 0; i < 4; i++) {
        deck.push({
            id: `whot-${i}`,
            shape: 'whot',
            number: 20,
            color: '#FFFFFF',
            isSpecial: true,
            action: 'whot'
        });
    }

    return deck;
};

const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const getShapeSymbol = (shape) => {
    const symbols = {
        circle: '○',
        triangle: '△',
        cross: '✕',
        square: '□',
        star: '★',
        whot: 'WHOT'
    };
    return symbols[shape] || shape;
};

const getShapeColor = (shape) => {
    const colors = {
        circle: '#FF3FA4',
        triangle: '#00F0FF',
        cross: '#C6FF4A',
        square: '#9D4EDD',
        star: '#FFD700',
        whot: '#FFFFFF'
    };
    return colors[shape] || '#FFFFFF';
};

module.exports = {
    createWhotDeck,
    shuffleDeck,
    getShapeSymbol,
    getShapeColor
};
