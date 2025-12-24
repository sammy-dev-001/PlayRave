// Animated avatar options for players
// Each avatar has an emoji and a name

export const AVATARS = [
    // Animals
    { id: 'fox', emoji: '🦊', name: 'Foxy' },
    { id: 'unicorn', emoji: '🦄', name: 'Sparkle' },
    { id: 'dragon', emoji: '🐉', name: 'Blaze' },
    { id: 'owl', emoji: '🦉', name: 'Wise' },
    { id: 'lion', emoji: '🦁', name: 'King' },
    { id: 'panda', emoji: '🐼', name: 'Bamboo' },
    { id: 'wolf', emoji: '🐺', name: 'Shadow' },
    { id: 'cat', emoji: '🐱', name: 'Whiskers' },
    { id: 'dog', emoji: '🐶', name: 'Buddy' },
    { id: 'tiger', emoji: '🐯', name: 'Stripes' },

    // People & Characters
    { id: 'alien', emoji: '👽', name: 'Zara' },
    { id: 'robot', emoji: '🤖', name: 'Beep' },
    { id: 'ghost', emoji: '👻', name: 'Boo' },
    { id: 'ninja', emoji: '🥷', name: 'Shadow' },
    { id: 'wizard', emoji: '🧙', name: 'Merlin' },
    { id: 'fairy', emoji: '🧚', name: 'Pixie' },
    { id: 'vampire', emoji: '🧛', name: 'Vlad' },
    { id: 'zombie', emoji: '🧟', name: 'Brainy' },
    { id: 'mermaid', emoji: '🧜', name: 'Coral' },
    { id: 'superhero', emoji: '🦸', name: 'Hero' },

    // Cool Objects
    { id: 'fire', emoji: '🔥', name: 'Flame' },
    { id: 'lightning', emoji: '⚡', name: 'Bolt' },
    { id: 'star', emoji: '⭐', name: 'Twinkle' },
    { id: 'moon', emoji: '🌙', name: 'Luna' },
    { id: 'sun', emoji: '☀️', name: 'Sunny' },
    { id: 'rainbow', emoji: '🌈', name: 'Prisma' },
    { id: 'crown', emoji: '👑', name: 'Royal' },
    { id: 'diamond', emoji: '💎', name: 'Gem' },
    { id: 'rocket', emoji: '🚀', name: 'Zoom' },
    { id: 'dice', emoji: '🎲', name: 'Lucky' },
];

// Get random avatar
export const getRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[randomIndex];
};

// Get avatar by ID
export const getAvatarById = (id) => {
    return AVATARS.find(avatar => avatar.id === id) || AVATARS[0];
};

// Avatar colors for backgrounds
export const AVATAR_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
    '#BB8FCE', // Purple
    '#85C1E9', // Sky Blue
];

export const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
    return AVATAR_COLORS[randomIndex];
};
