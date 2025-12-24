// Caption prompts - funny/interesting images described for captioning
// Each prompt has a description and category

export const CAPTION_PROMPTS = [
    // Funny Situations
    {
        id: 1,
        description: "A cat sitting at a desk with reading glasses, looking at a laptop",
        category: "animals",
        emoji: "🐱💻"
    },
    {
        id: 2,
        description: "A dog wearing a business suit at a job interview",
        category: "animals",
        emoji: "🐕👔"
    },
    {
        id: 3,
        description: "Someone sleeping on a keyboard at work",
        category: "work",
        emoji: "😴⌨️"
    },
    {
        id: 4,
        description: "A person trying to parallel park with 10 people watching",
        category: "daily-life",
        emoji: "🚗😰"
    },
    {
        id: 5,
        description: "A seagull stealing someone's lunch at the beach",
        category: "animals",
        emoji: "🐦🍔"
    },
    {
        id: 6,
        description: "Two squirrels arguing over an acorn",
        category: "animals",
        emoji: "🐿️🐿️"
    },
    {
        id: 7,
        description: "A baby making a disgusted face at vegetables",
        category: "food",
        emoji: "👶🥦"
    },
    {
        id: 8,
        description: "Someone stepping in a puddle while wearing nice shoes",
        category: "daily-life",
        emoji: "👞💦"
    },
    {
        id: 9,
        description: "A goat standing on top of a car",
        category: "animals",
        emoji: "🐐🚗"
    },
    {
        id: 10,
        description: "Someone trying to take a selfie with a wild animal",
        category: "travel",
        emoji: "📱🦌"
    },
    // Awkward Moments
    {
        id: 11,
        description: "Waving back at someone who wasn't waving at you",
        category: "social",
        emoji: "👋😳"
    },
    {
        id: 12,
        description: "Pulling a door that says push",
        category: "daily-life",
        emoji: "🚪🤦"
    },
    {
        id: 13,
        description: "Walking into a spider web in the dark",
        category: "weird",
        emoji: "🕸️😱"
    },
    {
        id: 14,
        description: "Sending a text to the wrong person",
        category: "tech",
        emoji: "📱😬"
    },
    {
        id: 15,
        description: "Laughing alone while looking at your phone in public",
        category: "social",
        emoji: "📱😂"
    },
    // Pop Culture/Memes
    {
        id: 16,
        description: "A person dramatically looking at an explosion behind them",
        category: "movies",
        emoji: "💥😎"
    },
    {
        id: 17,
        description: "Two astronauts on the moon, one pointing at Earth",
        category: "space",
        emoji: "🧑‍🚀🌍"
    },
    {
        id: 18,
        description: "A tiny person screaming at a massive cat",
        category: "weird",
        emoji: "🧍😺"
    },
    {
        id: 19,
        description: "Someone offering their hand for a handshake to a confused dog",
        category: "animals",
        emoji: "🤝🐕"
    },
    {
        id: 20,
        description: "A gym membership card sitting untouched next to snacks",
        category: "lifestyle",
        emoji: "💪🍿"
    },
    // Group Dynamics
    {
        id: 21,
        description: "One person in a group photo not ready",
        category: "social",
        emoji: "📸😮"
    },
    {
        id: 22,
        description: "Friends pretending to push the Leaning Tower of Pisa",
        category: "travel",
        emoji: "🗼👐"
    },
    {
        id: 23,
        description: "Everyone at a party gathered around the food table",
        category: "party",
        emoji: "🎉🍕"
    },
    {
        id: 24,
        description: "The one friend who photobombs every picture",
        category: "social",
        emoji: "📷🤪"
    },
    {
        id: 25,
        description: "A huge line outside a popular restaurant while an empty one sits next door",
        category: "food",
        emoji: "🍽️📊"
    }
];

// Get random prompts for a game
export const getRandomCaptionPrompts = (count = 5) => {
    const shuffled = [...CAPTION_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get prompt by ID
export const getPromptById = (id) => {
    return CAPTION_PROMPTS.find(p => p.id === id);
};
