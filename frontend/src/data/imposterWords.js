// Imposter word pairs - one player gets imposterWord, others get normalWord
// The words should be similar enough to fool players

export const IMPOSTER_WORD_PAIRS = [
    // Places
    { normalWord: "Beach", imposterWord: "Pool", category: "Places" },
    { normalWord: "Restaurant", imposterWord: "Cafe", category: "Places" },
    { normalWord: "Library", imposterWord: "Bookstore", category: "Places" },
    { normalWord: "Cinema", imposterWord: "Theater", category: "Places" },
    { normalWord: "Hospital", imposterWord: "Clinic", category: "Places" },
    { normalWord: "Hotel", imposterWord: "Motel", category: "Places" },
    { normalWord: "Park", imposterWord: "Garden", category: "Places" },
    { normalWord: "Museum", imposterWord: "Gallery", category: "Places" },
    { normalWord: "Stadium", imposterWord: "Arena", category: "Places" },
    { normalWord: "Airport", imposterWord: "Train Station", category: "Places" },

    // Food & Drink
    { normalWord: "Pizza", imposterWord: "Flatbread", category: "Food" },
    { normalWord: "Burger", imposterWord: "Sandwich", category: "Food" },
    { normalWord: "Pancakes", imposterWord: "Waffles", category: "Food" },
    { normalWord: "Sushi", imposterWord: "Sashimi", category: "Food" },
    { normalWord: "Ice Cream", imposterWord: "Frozen Yogurt", category: "Food" },
    { normalWord: "Coffee", imposterWord: "Tea", category: "Food" },
    { normalWord: "Donut", imposterWord: "Bagel", category: "Food" },
    { normalWord: "Pasta", imposterWord: "Noodles", category: "Food" },
    { normalWord: "Steak", imposterWord: "Pork Chop", category: "Food" },
    { normalWord: "Soup", imposterWord: "Stew", category: "Food" },

    // Animals
    { normalWord: "Lion", imposterWord: "Tiger", category: "Animals" },
    { normalWord: "Dog", imposterWord: "Wolf", category: "Animals" },
    { normalWord: "Rabbit", imposterWord: "Hare", category: "Animals" },
    { normalWord: "Frog", imposterWord: "Toad", category: "Animals" },
    { normalWord: "Dolphin", imposterWord: "Shark", category: "Animals" },
    { normalWord: "Butterfly", imposterWord: "Moth", category: "Animals" },
    { normalWord: "Crow", imposterWord: "Raven", category: "Animals" },
    { normalWord: "Alligator", imposterWord: "Crocodile", category: "Animals" },
    { normalWord: "Monkey", imposterWord: "Ape", category: "Animals" },
    { normalWord: "Turtle", imposterWord: "Tortoise", category: "Animals" },

    // Objects
    { normalWord: "Guitar", imposterWord: "Ukulele", category: "Objects" },
    { normalWord: "Laptop", imposterWord: "Tablet", category: "Objects" },
    { normalWord: "Bicycle", imposterWord: "Motorcycle", category: "Objects" },
    { normalWord: "Couch", imposterWord: "Sofa", category: "Objects" },
    { normalWord: "Pen", imposterWord: "Pencil", category: "Objects" },
    { normalWord: "Watch", imposterWord: "Clock", category: "Objects" },
    { normalWord: "Sunglasses", imposterWord: "Glasses", category: "Objects" },
    { normalWord: "Pillow", imposterWord: "Cushion", category: "Objects" },
    { normalWord: "Blanket", imposterWord: "Comforter", category: "Objects" },
    { normalWord: "Mirror", imposterWord: "Window", category: "Objects" },

    // Activities
    { normalWord: "Swimming", imposterWord: "Diving", category: "Activities" },
    { normalWord: "Running", imposterWord: "Jogging", category: "Activities" },
    { normalWord: "Singing", imposterWord: "Humming", category: "Activities" },
    { normalWord: "Dancing", imposterWord: "Ballet", category: "Activities" },
    { normalWord: "Cooking", imposterWord: "Baking", category: "Activities" },
    { normalWord: "Reading", imposterWord: "Studying", category: "Activities" },
    { normalWord: "Painting", imposterWord: "Drawing", category: "Activities" },
    { normalWord: "Camping", imposterWord: "Hiking", category: "Activities" },
    { normalWord: "Shopping", imposterWord: "Browsing", category: "Activities" },
    { normalWord: "Fishing", imposterWord: "Hunting", category: "Activities" },

    // Weather & Nature
    { normalWord: "Rain", imposterWord: "Drizzle", category: "Weather" },
    { normalWord: "Snow", imposterWord: "Hail", category: "Weather" },
    { normalWord: "Hurricane", imposterWord: "Tornado", category: "Weather" },
    { normalWord: "Mountain", imposterWord: "Hill", category: "Nature" },
    { normalWord: "River", imposterWord: "Stream", category: "Nature" },
    { normalWord: "Ocean", imposterWord: "Sea", category: "Nature" },
    { normalWord: "Forest", imposterWord: "Woods", category: "Nature" },
    { normalWord: "Desert", imposterWord: "Beach", category: "Nature" },

    // Entertainment
    { normalWord: "Movie", imposterWord: "TV Show", category: "Entertainment" },
    { normalWord: "Concert", imposterWord: "Festival", category: "Entertainment" },
    { normalWord: "Comedy", imposterWord: "Satire", category: "Entertainment" },
    { normalWord: "Novel", imposterWord: "Short Story", category: "Entertainment" },
    { normalWord: "Video Game", imposterWord: "Board Game", category: "Entertainment" },
    { normalWord: "Podcast", imposterWord: "Radio Show", category: "Entertainment" },

    // Professions
    { normalWord: "Doctor", imposterWord: "Nurse", category: "Professions" },
    { normalWord: "Teacher", imposterWord: "Professor", category: "Professions" },
    { normalWord: "Chef", imposterWord: "Cook", category: "Professions" },
    { normalWord: "Lawyer", imposterWord: "Judge", category: "Professions" },
    { normalWord: "Pilot", imposterWord: "Flight Attendant", category: "Professions" },
    { normalWord: "Mechanic", imposterWord: "Engineer", category: "Professions" },

    // Tech & Social
    { normalWord: "TikTok", imposterWord: "Instagram Reels", category: "Tech & Social" },
    { normalWord: "WhatsApp", imposterWord: "Telegram", category: "Tech & Social" },
    { normalWord: "Uber", imposterWord: "Bolt", category: "Tech & Social" },
    { normalWord: "iPhone", imposterWord: "Samsung Galaxy", category: "Tech & Social" },
    { normalWord: "Netflix", imposterWord: "YouTube", category: "Tech & Social" },
    { normalWord: "Spotify", imposterWord: "Apple Music", category: "Tech & Social" },
    { normalWord: "PlayStation", imposterWord: "Xbox", category: "Tech & Social" },
    { normalWord: "Twitter", imposterWord: "Threads", category: "Tech & Social" },
    { normalWord: "Wi-Fi", imposterWord: "Mobile Data", category: "Tech & Social" },
    { normalWord: "Headphones", imposterWord: "Earbuds", category: "Tech & Social" },

    // Vibes & Party
    { normalWord: "Nightclub", imposterWord: "Lounge", category: "Vibes & Party" },
    { normalWord: "Tequila", imposterWord: "Vodka", category: "Vibes & Party" },
    { normalWord: "Champagne", imposterWord: "Sparkling Wine", category: "Vibes & Party" },
    { normalWord: "DJ", imposterWord: "Hype Man", category: "Vibes & Party" },
    { normalWord: "House Party", imposterWord: "Block Party", category: "Vibes & Party" },
    { normalWord: "Cocktail", imposterWord: "Mocktail", category: "Vibes & Party" },
    { normalWord: "Karaoke", imposterWord: "Open Mic", category: "Vibes & Party" },
    { normalWord: "Hookah", imposterWord: "Vape", category: "Vibes & Party" },

    // Afro & Naija
    { normalWord: "Jollof Rice", imposterWord: "Fried Rice", category: "Afro & Naija" },
    { normalWord: "Suya", imposterWord: "Asun", category: "Afro & Naija" },
    { normalWord: "Danfo", imposterWord: "Keke Napep", category: "Afro & Naija" },
    { normalWord: "Agbada", imposterWord: "Senator Wear", category: "Afro & Naija" },
    { normalWord: "Amala", imposterWord: "Pounded Yam", category: "Afro & Naija" },
    { normalWord: "Fried Plantain", imposterWord: "Fried Yam", category: "Afro & Naija" },
    { normalWord: "Afrobeats", imposterWord: "Amapiano", category: "Afro & Naija" },
    { normalWord: "Egusi Soup", imposterWord: "Ogbono Soup", category: "Afro & Naija" },
    { normalWord: "Shawarma", imposterWord: "Meat Pie", category: "Afro & Naija" },

    // Sports & Fitness
    { normalWord: "Football", imposterWord: "Rugby", category: "Sports" },
    { normalWord: "Basketball", imposterWord: "Volleyball", category: "Sports" },
    { normalWord: "Tennis", imposterWord: "Badminton", category: "Sports" },
    { normalWord: "Gym", imposterWord: "CrossFit", category: "Sports" },
    { normalWord: "Boxing", imposterWord: "Kickboxing", category: "Sports" },
    { normalWord: "Marathon", imposterWord: "Sprint", category: "Sports" }
];

export const IMPOSTER_CATEGORIES = [
    'All',
    'Places',
    'Food',
    'Animals',
    'Objects',
    'Activities',
    'Entertainment',
    'Tech & Social',
    'Vibes & Party',
    'Afro & Naija',
    'Sports'
];

// Game configuration
export const IMPOSTER_CONFIG = {
    minPlayers: 3,
    maxPlayers: 12,
    discussionTimeSeconds: 180, // 3 minutes
    votingTimeSeconds: 30
};

// Get random word pair
export function getRandomWordPair(category = 'All', usedPairs = []) {
    let pool = IMPOSTER_WORD_PAIRS;
    if (category && category !== 'All') {
        pool = pool.filter(p => p.category.toLowerCase() === category.toLowerCase());
        if (pool.length === 0) pool = IMPOSTER_WORD_PAIRS;
    }

    const availablePairs = pool.filter(
        pair => !usedPairs.some(used =>
            used.normalWord === pair.normalWord && used.imposterWord === pair.imposterWord
        )
    );

    if (availablePairs.length === 0) {
        return pool[Math.floor(Math.random() * pool.length)];
    }

    return availablePairs[Math.floor(Math.random() * availablePairs.length)];
}

export default {
    IMPOSTER_WORD_PAIRS,
    IMPOSTER_CATEGORIES,
    IMPOSTER_CONFIG,
    getRandomWordPair
};
