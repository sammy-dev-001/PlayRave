// Imposter word pairs - one player gets imposterWord, others get normalWord
// The words should be similar enough to fool players

const IMPOSTER_WORD_PAIRS = [
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
    { normalWord: "Mechanic", imposterWord: "Engineer", category: "Professions" }
];

// Game configuration
const IMPOSTER_CONFIG = {
    minPlayers: 3, // Lowered for testing
    maxPlayers: 12,
    discussionTimeSeconds: 180, // 3 minutes
    votingTimeSeconds: 30
};

// Get random word pair
function getRandomWordPair(usedPairs = []) {
    const availablePairs = IMPOSTER_WORD_PAIRS.filter(
        pair => !usedPairs.some(used =>
            used.normalWord === pair.normalWord && used.imposterWord === pair.imposterWord
        )
    );

    if (availablePairs.length === 0) {
        return IMPOSTER_WORD_PAIRS[Math.floor(Math.random() * IMPOSTER_WORD_PAIRS.length)];
    }

    return availablePairs[Math.floor(Math.random() * availablePairs.length)];
}

module.exports = {
    IMPOSTER_WORD_PAIRS,
    IMPOSTER_CONFIG,
    getRandomWordPair
};
