// GameRegistry.ts
// Single source of truth for all games in PlayRave.
// When an OTA update brings a new game, simply add its configuration here.

export interface GameModule {
    id: string;
    name: string;
    description: string;
    category: 'party' | 'competitive' | 'trivia' | 'speed';
    minPlayers: number;
    maxPlayers: number;
    vibes: string[];
    color: string;
    icon?: string;
    imageId?: string; // e.g. 'neon-tap', maps to GAME_IMAGES in UI if needed
    routeComponent: string;
    isHub?: boolean; // For online games: true means it has a custom setup hub before lobby
    singlePlayerRouteComponent?: string; // For local games that have AI
    comingSoon?: boolean;
}

export const OnlineGamesRegistry: GameModule[] = [
    { id: 'trivia', name: 'Trivia Hub', description: 'Quick Trivia, Myth or Fact, and more.', color: '#00ffff', category: 'trivia', minPlayers: 1, maxPlayers: 10, vibes: ['brain'], imageId: 'trivia', routeComponent: 'TriviaHub', isHub: true },
    { id: 'whos-most-likely', name: "Who's Most Likely To", description: 'Vote for your friends', color: '#B026FF', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'], imageId: 'whos-most-likely', routeComponent: 'Lobby', isHub: false },
    { id: 'scrabble', name: 'Scrabble', description: 'Classic word game.', color: '#00ffff', category: 'competitive', minPlayers: 2, maxPlayers: 4, vibes: ['brain'], imageId: 'scrabble', routeComponent: 'Lobby', isHub: false },
    { id: 'neon-tap', name: 'Neon Tap', description: 'Fast reflexes only!', color: '#39FF14', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'], imageId: 'neon-tap', routeComponent: 'Lobby', isHub: false },
    { id: 'word-rush', name: 'Word Rush', description: 'Type words fast.', color: '#FF007F', category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['hype'], imageId: 'word-rush', routeComponent: 'Lobby', isHub: false },
    { id: 'whot', name: 'Naija Whot', description: 'Classic card game.', color: '#B026FF', category: 'competitive', minPlayers: 1, maxPlayers: 8, vibes: ['chill'], imageId: 'whot', routeComponent: 'Lobby', isHub: false },
    { id: 'truth-or-dare', name: 'Truth or Dare', description: 'Party classic.', color: '#FF007F', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'], imageId: 'truth-or-dare', routeComponent: 'OnlineTruthOrDareCategory', isHub: true },
    { id: 'real-talk', name: 'Real Talk', description: 'Deep questions.', color: '#00ffff', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['chill'], imageId: 'real-talk', routeComponent: 'OnlineRealTalkCategory', isHub: true },
    { id: 'never-have-i-ever', name: 'Never Have I Ever', description: 'Confess your secrets.', color: '#39FF14', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'], imageId: 'never-have-i-ever', routeComponent: 'OnlineNHIECategory', isHub: true },
    { id: 'whispers', name: 'Spill The Tea', description: 'Anonymous secrets.', color: '#FF007F', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'], imageId: 'whispers', routeComponent: 'WhispersHub', isHub: true },
    { id: 'imposter', name: 'The Imposter', description: 'Find the faker.', color: '#B026FF', category: 'competitive', minPlayers: 3, maxPlayers: 10, vibes: ['brain'], imageId: 'imposter', routeComponent: 'Lobby', isHub: false },
    { id: 'unpopular-opinions', name: 'Hot Takes', description: 'Debate controversial topics.', color: '#00ffff', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'], imageId: 'unpopular-opinions', routeComponent: 'Lobby', isHub: false },
    { id: 'hot-seat', name: 'Hot Seat', description: 'Answer fast or face the music.', color: '#FF007F', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'], imageId: 'hot-seat', routeComponent: 'Lobby', isHub: false },
    { id: 'button-mash', name: 'Button Mash', description: 'Mash buttons for survival!', color: '#39FF14', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'], imageId: 'button-mash', routeComponent: 'Lobby', isHub: false },
    { id: 'type-race', name: 'Type Race', description: 'Type the lyrics!', color: '#B026FF', category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['brain'], imageId: 'type-race', routeComponent: 'Lobby', isHub: false },
    { id: 'math-blitz', name: 'Math Blitz', description: 'Solve equations fast.', color: '#00ffff', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['brain'], imageId: 'math-blitz', routeComponent: 'Lobby', isHub: false },
    { id: 'color-rush', name: 'Color Rush', description: 'Tap the matching color.', color: '#FF007F', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'], imageId: 'color-rush', routeComponent: 'Lobby', isHub: false },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic strategy game.', color: '#39FF14', category: 'competitive', minPlayers: 2, maxPlayers: 2, vibes: ['brain'], imageId: 'tic-tac-toe', routeComponent: 'Lobby', isHub: false },
    { id: 'draw-battle', name: 'Draw Battle', description: 'Draw and guess!', color: '#B026FF', category: 'party', minPlayers: 2, maxPlayers: 8, vibes: ['chill'], imageId: 'draw-battle', routeComponent: 'Lobby', isHub: false },
    { id: 'caption-this', name: 'Caption This', description: 'Caption funny photos.', color: '#00ffff', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'], imageId: 'caption-this', routeComponent: 'Lobby', isHub: false },
    { id: 'auction-bluff', name: 'Auction Bluff', description: 'Bid and bluff your way to win.', color: '#FF007F', category: 'competitive', minPlayers: 3, maxPlayers: 8, vibes: ['brain'], imageId: 'auction-bluff', routeComponent: 'Lobby', isHub: false },
];

export const LocalGamesRegistry: GameModule[] = [
    { id: 'trivia', name: 'Quick Trivia', description: 'Test your knowledge offline!', icon: '🧠', color: '#00ffff', category: 'trivia', minPlayers: 1, maxPlayers: 4, vibes: ['brain'], routeComponent: 'LocalTrivia' },
    { id: 'truth-or-dare', name: 'Truth or Dare', description: 'Classic party game - choose truth or dare!', icon: '🎭', color: '#FF007F', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'], routeComponent: 'TruthOrDareCategorySelection' },
    { id: 'real-talk', name: 'Real Talk', description: 'Deep questions and icebreakers', icon: '💬', color: '#00ffff', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['chill'], routeComponent: 'RealTalkCategory' },
    { id: 'never-have-i-local', name: 'Never Have I Ever', description: 'Put fingers down if you have done it', icon: '🤫', color: '#39FF14', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'], routeComponent: 'NeverHaveIEverCategory' },
    { id: 'kings-cup', name: "King's Cup", description: 'Classic drinking game with cards', icon: '👑', color: '#B026FF', category: 'party', minPlayers: 3, maxPlayers: 10, comingSoon: true, vibes: ['chill'], routeComponent: 'KingsCup' },
    { id: 'would-you-rather', name: 'Would You Rather', description: 'Choose between two impossible choices', icon: '🤔', color: '#FF007F', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['chill'], routeComponent: 'WouldYouRather' },
    { id: 'scrabble', name: 'Scrabble', description: 'Create words from letter tiles!', icon: '📝', color: '#00ffff', category: 'competitive', minPlayers: 2, maxPlayers: 4, vibes: ['brain'], routeComponent: 'Scrabble', singlePlayerRouteComponent: 'ScrabbleDifficulty' },
    { id: 'speed-categories', name: 'Speed Categories', description: 'Name 5 things in 10 seconds!', icon: '🏃', color: '#FF007F', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'], routeComponent: 'SpeedCategories' },
    { id: 'memory-chain', name: 'Memory Chain', description: 'Remember the growing sequence!', icon: '🧠', color: '#39FF14', category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['brain'], routeComponent: 'MemoryChain' },
    { id: 'memory-match', name: 'Memory Match', description: 'Find matching pairs - test your memory!', icon: '🧩', color: '#B026FF', category: 'speed', minPlayers: 1, maxPlayers: 4, vibes: ['brain'], routeComponent: 'MemoryMatch' },
    { id: 'charades', name: 'Charades', description: 'Act it out — no words allowed! Pass the phone.', icon: '🎭', color: '#FF007F', category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'], routeComponent: 'LocalCharades' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic strategy game vs AI', icon: '⭕', color: '#B026FF', category: 'competitive', minPlayers: 1, maxPlayers: 2, vibes: ['brain'], routeComponent: 'TicTacToe', singlePlayerRouteComponent: 'TicTacToeDifficulty' }
];
