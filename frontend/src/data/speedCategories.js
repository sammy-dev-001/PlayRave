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

    // Expanded Easy
    { id: 33, category: "Fast Food Chains", difficulty: "easy", emoji: "🍔" },
    { id: 34, category: "Colors of the Rainbow", difficulty: "easy", emoji: "🌈" },
    { id: 35, category: "Things in a Classroom", difficulty: "easy", emoji: "🏫" },
    { id: 36, category: "Types of Shoes", difficulty: "easy", emoji: "👟" },
    { id: 37, category: "Ice Cream Flavors", difficulty: "easy", emoji: "🍦" },
    { id: 38, category: "Cartoons", difficulty: "easy", emoji: "📺" },
    { id: 39, category: "Breakfast Foods", difficulty: "easy", emoji: "🥞" },
    { id: 40, category: "Things You Can Fly In", difficulty: "easy", emoji: "✈️" },

    // Expanded Medium
    { id: 41, category: "Board Games", difficulty: "medium", emoji: "🎲" },
    { id: 42, category: "Superheroes", difficulty: "medium", emoji: "🦸" },
    { id: 43, category: "Things That Smell Good", difficulty: "medium", emoji: "🌸" },
    { id: 44, category: "Types of Pasta", difficulty: "medium", emoji: "🍝" },
    { id: 45, category: "Horror Movies", difficulty: "medium", emoji: "🧟" },
    { id: 46, category: "Things You Do On Date Night", difficulty: "medium", emoji: "🍷" },
    { id: 47, category: "Famous Singers", difficulty: "medium", emoji: "🎤" },
    { id: 48, category: "Streaming Services", difficulty: "medium", emoji: "📺" },

    // Expanded Hard
    { id: 49, category: "African Countries", difficulty: "hard", emoji: "🌍" },
    { id: 50, category: "Elements on the Periodic Table", difficulty: "hard", emoji: "🧪" },
    { id: 51, category: "Shakespeare Plays", difficulty: "hard", emoji: "🎭" },
    { id: 52, category: "Presidents/Prime Ministers", difficulty: "hard", emoji: "👔" },
    { id: 53, category: "Types of Cheese", difficulty: "hard", emoji: "🧀" },
    { id: 54, category: "Planets/Moons", difficulty: "hard", emoji: "🪐" },
    { id: 55, category: "Award Wining Movies", difficulty: "hard", emoji: "🏆" },
    { id: 56, category: "Greek Gods/Goddesses", difficulty: "hard", emoji: "⚡" },

    // Expanded Party
    { id: 57, category: "Things You Hide From Your Parents", difficulty: "party", emoji: "🤫" },
    { id: 58, category: "Reasons You Got Detained/Arrested", difficulty: "party", emoji: "🚓" },
    { id: 59, category: "Words You Hate", difficulty: "party", emoji: "🤢" },
    { id: 60, category: "Bad Habits", difficulty: "party", emoji: "👎" },
    { id: 61, category: "Celebrity Crushes", difficulty: "party", emoji: "😍" },
    { id: 62, category: "Things You Do When Drunk", difficulty: "party", emoji: "🍺" },
    { id: 63, category: "Places You Want to Travel", difficulty: "party", emoji: "✈️" },
    { id: 64, category: "Things That Break Easily", difficulty: "party", emoji: "💔" }
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
