// Speed Categories - quick naming challenges
// Players must name 5 things in a category within 10 seconds

export const SPEED_CATEGORIES = [
    // Easy
    { id: 1, category: "Types of fruit", difficulty: "easy", emoji: "🍎" },
    { id: 2, category: "Colors", difficulty: "easy", emoji: "🌈" },
    { id: 3, category: "Countries", difficulty: "easy", emoji: "🌍" },
    { id: 4, category: "Animals", difficulty: "easy", emoji: "🦁" },
    { id: 5, category: "Sports", difficulty: "easy", emoji: "⚽" },
    { id: 6, category: "Vegetables", difficulty: "easy", emoji: "🥕" },
    { id: 7, category: "Body parts", difficulty: "easy", emoji: "👁️" },
    { id: 8, category: "Drinks", difficulty: "easy", emoji: "🥤" },

    // Medium
    { id: 9, category: "Car brands", difficulty: "medium", emoji: "🚗" },
    { id: 10, category: "Pizza toppings", difficulty: "medium", emoji: "🍕" },
    { id: 11, category: "Things that are cold", difficulty: "medium", emoji: "❄️" },
    { id: 12, category: "Things in a kitchen", difficulty: "medium", emoji: "🍳" },
    { id: 13, category: "Movie genres", difficulty: "medium", emoji: "🎬" },
    { id: 14, category: "Things you wear", difficulty: "medium", emoji: "👕" },
    { id: 15, category: "Musical instruments", difficulty: "medium", emoji: "🎸" },
    { id: 16, category: "Things in a bathroom", difficulty: "medium", emoji: "🚿" },
    { id: 17, category: "Dog breeds", difficulty: "medium", emoji: "🐕" },
    { id: 18, category: "Things at the beach", difficulty: "medium", emoji: "🏖️" },

    // Hard
    { id: 19, category: "Things that start with Z", difficulty: "hard", emoji: "🅰️" },
    { id: 20, category: "World capitals", difficulty: "hard", emoji: "🏛️" },
    { id: 21, category: "Things in space", difficulty: "hard", emoji: "🚀" },
    { id: 22, category: "Olympic sports", difficulty: "hard", emoji: "🏅" },
    { id: 23, category: "Types of dance", difficulty: "hard", emoji: "💃" },
    { id: 24, category: "Things that are round", difficulty: "hard", emoji: "⭕" },
    { id: 25, category: "Mythological creatures", difficulty: "hard", emoji: "🐉" },

    // Party/Fun
    { id: 26, category: "Excuses for being late", difficulty: "party", emoji: "⏰" },
    { id: 27, category: "Bad first date ideas", difficulty: "party", emoji: "💔" },
    { id: 28, category: "Things NOT to say to your boss", difficulty: "party", emoji: "😬" },
    { id: 29, category: "Reasons to leave a party early", difficulty: "party", emoji: "🚪" },
    { id: 30, category: "Things in your search history", difficulty: "party", emoji: "🔍" },
    { id: 31, category: "Lies you've told", difficulty: "party", emoji: "🤥" },
    { id: 32, category: "Embarrassing moments", difficulty: "party", emoji: "😳" },
];

// Get random categories
export const getRandomCategories = (count = 10, difficulty = 'all') => {
    let filtered = SPEED_CATEGORIES;
    if (difficulty !== 'all') {
        filtered = SPEED_CATEGORIES.filter(c => c.difficulty === difficulty);
    }
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get category by ID
export const getCategoryById = (id) => {
    return SPEED_CATEGORIES.find(c => c.id === id);
};
