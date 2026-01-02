// Confession prompts to help players get started
// These are optional - players can also write their own confessions

export const CONFESSION_STARTERS = [
    "I once...",
    "My secret is...",
    "I've never told anyone that...",
    "The most embarrassing thing I've done is...",
    "I'm guilty of...",
    "Nobody knows that I...",
    "I pretend to...",
    "I secretly...",
    "My hidden talent is...",
    "I'm afraid to admit that..."
];

export const CONFESSION_CATEGORIES = [
    { id: 'mild', name: 'Mild', emoji: '😊', description: 'Keep it light and fun' },
    { id: 'spicy', name: 'Spicy', emoji: '🌶️', description: 'A little more revealing' },
    { id: 'wild', name: 'Wild', emoji: '🔥', description: 'No holds barred' }
];

// Example confessions for AI/bot players or to spark ideas
export const EXAMPLE_CONFESSIONS = {
    mild: [
        "I've eaten food off the floor more times than I'd like to admit",
        "I pretend to know song lyrics but I'm just mumbling",
        "I've blamed a fart on a pet that wasn't even in the room",
        "I still sleep with a stuffed animal",
        "I've rewatched the same show 10+ times instead of trying something new",
        "I talk to myself in different accents when I'm alone",
        "I've pretended my phone was dying to leave a conversation",
        "I've googled how to spell really simple words",
        "I cry at commercials",
        "I've eaten an entire cake by myself in one sitting"
    ],
    spicy: [
        "I've stalked my ex's new partner extensively on social media",
        "I've lied about my body count",
        "I've pretended to be sick to avoid intimacy",
        "I've read my partner's messages without them knowing",
        "I've had a crush on a friend's significant other",
        "I've faked enthusiasm in the bedroom",
        "I've kept dating someone just for the free food",
        "I've told someone I loved them when I didn't mean it",
        "I've ghosted someone I actually liked because I panicked",
        "I've kissed someone else while in a relationship"
    ],
    wild: [
        "I've hooked up with someone in a really inappropriate place",
        "I've done something illegal that nobody knows about",
        "I've catfished someone before",
        "I've stolen something from a friend",
        "I've blackmailed someone (even mildly)",
        "I've sabotaged someone's relationship on purpose",
        "I've pretended to be someone else entirely on a dating app",
        "I've gotten revenge on someone in a way they never found out about",
        "I've been intimate with someone I definitely shouldn't have",
        "I've done something at work that would 100% get me fired"
    ]
};

// Game configuration
export const CONFESSION_CONFIG = {
    submissionTimeSeconds: 60,
    votingTimeSeconds: 30,
    minPlayers: 3,
    maxPlayers: 12,
    pointsForCorrectGuess: 100,
    pointsForFoolingPlayer: 50,
    roundsPerGame: null // null = one confession per player
};

export default {
    CONFESSION_STARTERS,
    CONFESSION_CATEGORIES,
    EXAMPLE_CONFESSIONS,
    CONFESSION_CONFIG
};
