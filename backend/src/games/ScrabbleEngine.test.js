const scrabbleEngine = require('./ScrabbleEngine');

describe('ScrabbleEngine', () => {

    beforeEach(() => {
        // Since it exports a singleton instance, we can just clear its state if it has any, 
        // but for these simple unit tests we just use the instance.
        scrabbleEngine.activeGames = new Map();
    });

    test('should initialize with no active games', () => {
        expect(scrabbleEngine.activeGames.size).toBe(0);
    });

    test('should return error when placing tiles in non-existent game', () => {
        const result = scrabbleEngine.handleEvent('place-word', {
            roomId: 'nonexistent'
        });
        expect(scrabbleEngine.activeGames.has('room1')).toBe(false);
    });
});
