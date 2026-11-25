// Imposter word pairs - civilians share a secret word while the imposter gets a related decoy.
// Words share a broad theme/context so vague clues overlap, but have distinct traits for deduction.

const IMPOSTER_WORD_PAIRS = [
    // Places
    { normalWord: 'Airport', imposterWord: 'Cruise Ship', category: 'Places' },
    { normalWord: 'Hospital', imposterWord: 'Pharmacy', category: 'Places' },
    { normalWord: 'Library', imposterWord: 'Coffee Shop', category: 'Places' },
    { normalWord: 'Cinema', imposterWord: 'Concert Hall', category: 'Places' },
    { normalWord: 'Prison', imposterWord: 'Police Station', category: 'Places' },
    { normalWord: 'Zoo', imposterWord: 'Aquarium', category: 'Places' },
    { normalWord: 'Gym', imposterWord: 'Spa', category: 'Places' },
    { normalWord: 'Bakery', imposterWord: 'Ice Cream Shop', category: 'Places' },
    { normalWord: 'Casino', imposterWord: 'Arcade', category: 'Places' },
    { normalWord: 'Hotel', imposterWord: 'Campsite', category: 'Places' },
    { normalWord: 'Supermarket', imposterWord: 'Shopping Mall', category: 'Places' },
    { normalWord: 'Beach', imposterWord: 'Water Park', category: 'Places' },

    // Food & Drink
    { normalWord: 'Pizza', imposterWord: 'Tacos', category: 'Food' },
    { normalWord: 'Burger', imposterWord: 'Hot Dog', category: 'Food' },
    { normalWord: 'Pancakes', imposterWord: 'Omelette', category: 'Food' },
    { normalWord: 'Sushi', imposterWord: 'Ramen', category: 'Food' },
    { normalWord: 'Ice Cream', imposterWord: 'Cheesecake', category: 'Food' },
    { normalWord: 'Coffee', imposterWord: 'Energy Drink', category: 'Food' },
    { normalWord: 'Donut', imposterWord: 'Croissant', category: 'Food' },
    { normalWord: 'Popcorn', imposterWord: 'Nachos', category: 'Food' },
    { normalWord: 'Steak', imposterWord: 'Roast Chicken', category: 'Food' },
    { normalWord: 'Soup', imposterWord: 'Salad', category: 'Food' },
    { normalWord: 'Chocolate', imposterWord: 'Gummy Bears', category: 'Food' },
    { normalWord: 'French Fries', imposterWord: 'Onion Rings', category: 'Food' },

    // Animals
    { normalWord: 'Lion', imposterWord: 'Bear', category: 'Animals' },
    { normalWord: 'Dog', imposterWord: 'Cat', category: 'Animals' },
    { normalWord: 'Eagle', imposterWord: 'Owl', category: 'Animals' },
    { normalWord: 'Dolphin', imposterWord: 'Octopus', category: 'Animals' },
    { normalWord: 'Elephant', imposterWord: 'Giraffe', category: 'Animals' },
    { normalWord: 'Penguin', imposterWord: 'Flamingo', category: 'Animals' },
    { normalWord: 'Snake', imposterWord: 'Spider', category: 'Animals' },
    { normalWord: 'Bee', imposterWord: 'Mosquito', category: 'Animals' },
    { normalWord: 'Shark', imposterWord: 'Whale', category: 'Animals' },
    { normalWord: 'Horse', imposterWord: 'Camel', category: 'Animals' },
    { normalWord: 'Monkey', imposterWord: 'Kangaroo', category: 'Animals' },
    { normalWord: 'Turtle', imposterWord: 'Crab', category: 'Animals' },

    // Objects
    { normalWord: 'Guitar', imposterWord: 'Piano', category: 'Objects' },
    { normalWord: 'Laptop', imposterWord: 'Smartphone', category: 'Objects' },
    { normalWord: 'Bicycle', imposterWord: 'Skateboard', category: 'Objects' },
    { normalWord: 'Sofa', imposterWord: 'Hammock', category: 'Objects' },
    { normalWord: 'Umbrella', imposterWord: 'Raincoat', category: 'Objects' },
    { normalWord: 'Sunglasses', imposterWord: 'Baseball Cap', category: 'Objects' },
    { normalWord: 'Backpack', imposterWord: 'Suitcase', category: 'Objects' },
    { normalWord: 'Microwave', imposterWord: 'Toaster', category: 'Objects' },
    { normalWord: 'Candle', imposterWord: 'Flashlight', category: 'Objects' },
    { normalWord: 'Mirror', imposterWord: 'Camera', category: 'Objects' },
    { normalWord: 'Key', imposterWord: 'Password', category: 'Objects' },
    { normalWord: 'Alarm Clock', imposterWord: 'Wristwatch', category: 'Objects' },

    // Activities
    { normalWord: 'Swimming', imposterWord: 'Surfing', category: 'Activities' },
    { normalWord: 'Camping', imposterWord: 'Road Trip', category: 'Activities' },
    { normalWord: 'Cooking', imposterWord: 'Gardening', category: 'Activities' },
    { normalWord: 'Bowling', imposterWord: 'Golf', category: 'Activities' },
    { normalWord: 'Skiing', imposterWord: 'Ice Skating', category: 'Activities' },
    { normalWord: 'Karate', imposterWord: 'Yoga', category: 'Activities' },
    { normalWord: 'Fishing', imposterWord: 'Birdwatching', category: 'Activities' },
    { normalWord: 'Singing', imposterWord: 'Dancing', category: 'Activities' },
    { normalWord: 'Painting', imposterWord: 'Photography', category: 'Activities' },
    { normalWord: 'Chess', imposterWord: 'Poker', category: 'Activities' },

    // Weather & Nature
    { normalWord: 'Thunderstorm', imposterWord: 'Blizzard', category: 'Weather & Nature' },
    { normalWord: 'Rainbow', imposterWord: 'Sunset', category: 'Weather & Nature' },
    { normalWord: 'Volcano', imposterWord: 'Earthquake', category: 'Weather & Nature' },
    { normalWord: 'Waterfall', imposterWord: 'Ocean', category: 'Weather & Nature' },
    { normalWord: 'Desert', imposterWord: 'Tundra', category: 'Weather & Nature' },
    { normalWord: 'Sunrise', imposterWord: 'Full Moon', category: 'Weather & Nature' },
    { normalWord: 'Tornado', imposterWord: 'Tsunami', category: 'Weather & Nature' },
    { normalWord: 'Jungle', imposterWord: 'Swamp', category: 'Weather & Nature' },

    // Entertainment
    { normalWord: 'Horror Movie', imposterWord: 'Comedy Movie', category: 'Entertainment' },
    { normalWord: 'Concert', imposterWord: 'Music Video', category: 'Entertainment' },
    { normalWord: 'Podcast', imposterWord: 'Audiobook', category: 'Entertainment' },
    { normalWord: 'Video Game', imposterWord: 'Board Game', category: 'Entertainment' },
    { normalWord: 'Magic Show', imposterWord: 'Stand-Up Comedy', category: 'Entertainment' },
    { normalWord: 'Cartoon', imposterWord: 'Anime', category: 'Entertainment' },
    { normalWord: 'Karaoke', imposterWord: 'Talent Show', category: 'Entertainment' },
    { normalWord: 'Reality TV', imposterWord: 'Documentary', category: 'Entertainment' },

    // Professions
    { normalWord: 'Doctor', imposterWord: 'Dentist', category: 'Professions' },
    { normalWord: 'Teacher', imposterWord: 'Sports Coach', category: 'Professions' },
    { normalWord: 'Chef', imposterWord: 'Bartender', category: 'Professions' },
    { normalWord: 'Lawyer', imposterWord: 'Detective', category: 'Professions' },
    { normalWord: 'Pilot', imposterWord: 'Astronaut', category: 'Professions' },
    { normalWord: 'Firefighter', imposterWord: 'Lifeguard', category: 'Professions' },
    { normalWord: 'Photographer', imposterWord: 'Fashion Model', category: 'Professions' },
    { normalWord: 'DJ', imposterWord: 'Rockstar', category: 'Professions' },

    // Tech & Social
    { normalWord: 'TikTok', imposterWord: 'YouTube', category: 'Tech & Social' },
    { normalWord: 'WhatsApp', imposterWord: 'Email', category: 'Tech & Social' },
    { normalWord: 'Uber', imposterWord: 'Subway', category: 'Tech & Social' },
    { normalWord: 'iPhone', imposterWord: 'PlayStation', category: 'Tech & Social' },
    { normalWord: 'Spotify', imposterWord: 'Shazam', category: 'Tech & Social' },
    { normalWord: 'Zoom', imposterWord: 'Voice Note', category: 'Tech & Social' },
    { normalWord: 'Wi-Fi', imposterWord: 'Bluetooth', category: 'Tech & Social' },
    { normalWord: 'Google Maps', imposterWord: 'Compass', category: 'Tech & Social' },
    { normalWord: 'Emoji', imposterWord: 'GIF', category: 'Tech & Social' },
    { normalWord: 'VR Headset', imposterWord: 'Drone', category: 'Tech & Social' },

    // Vibes & Party
    { normalWord: 'Nightclub', imposterWord: 'House Party', category: 'Vibes & Party' },
    { normalWord: 'Tequila', imposterWord: 'Champagne', category: 'Vibes & Party' },
    { normalWord: 'VIP Table', imposterWord: 'Dance Floor', category: 'Vibes & Party' },
    { normalWord: 'Spin the Bottle', imposterWord: 'Truth or Dare', category: 'Vibes & Party' },
    { normalWord: 'Fireworks', imposterWord: 'Confetti', category: 'Vibes & Party' },
    { normalWord: 'Beer Pong', imposterWord: 'Darts', category: 'Vibes & Party' },
    { normalWord: 'Wedding', imposterWord: 'Birthday Party', category: 'Vibes & Party' },
    { normalWord: 'Photobooth', imposterWord: 'Selfie Stick', category: 'Vibes & Party' },

    // Afro & Naija
    { normalWord: 'Jollof Rice', imposterWord: 'Fried Rice', category: 'Afro & Naija' },
    { normalWord: 'Suya', imposterWord: 'Puff-Puff', category: 'Afro & Naija' },
    { normalWord: 'Danfo', imposterWord: 'Keke Napep', category: 'Afro & Naija' },
    { normalWord: 'Agbada', imposterWord: 'Senator Wear', category: 'Afro & Naija' },
    { normalWord: 'Amala', imposterWord: 'Pounded Yam', category: 'Afro & Naija' },
    { normalWord: 'Garri', imposterWord: 'Plantain Chips', category: 'Afro & Naija' },
    { normalWord: 'Afrobeats', imposterWord: 'Amapiano', category: 'Afro & Naija' },
    { normalWord: 'Egusi Soup', imposterWord: 'Okro Soup', category: 'Afro & Naija' },
    { normalWord: 'Meat Pie', imposterWord: 'Shawarma', category: 'Afro & Naija' },
    { normalWord: 'Owambe', imposterWord: 'Carnival', category: 'Afro & Naija' },

    // Sports & Fitness
    { normalWord: 'Football', imposterWord: 'Basketball', category: 'Sports' },
    { normalWord: 'Tennis', imposterWord: 'Golf', category: 'Sports' },
    { normalWord: 'Boxing', imposterWord: 'Wrestling', category: 'Sports' },
    { normalWord: 'Marathon', imposterWord: 'Weightlifting', category: 'Sports' },
    { normalWord: 'Surfing', imposterWord: 'Snowboarding', category: 'Sports' },
    { normalWord: 'Treadmill', imposterWord: 'Swimming Pool', category: 'Sports' },
    { normalWord: 'Bowling', imposterWord: 'Billiards', category: 'Sports' },
    { normalWord: 'Fencing', imposterWord: 'Archery', category: 'Sports' },
];

const IMPOSTER_CATEGORIES = [
    'All',
    'Places',
    'Food',
    'Animals',
    'Objects',
    'Activities',
    'Weather & Nature',
    'Entertainment',
    'Professions',
    'Tech & Social',
    'Vibes & Party',
    'Afro & Naija',
    'Sports',
];

// Game configuration
const IMPOSTER_CONFIG = {
    minPlayers: 3,
    maxPlayers: 12,
    discussionTimeSeconds: 180, // 3 minutes
    votingTimeSeconds: 30,
};

const isSamePair = (a, b) =>
    (a.normalWord === b.normalWord && a.imposterWord === b.imposterWord) ||
    (a.normalWord === b.imposterWord && a.imposterWord === b.normalWord);

// Get random word pair (supports getRandomWordPair(usedPairs) or getRandomWordPair(category, usedPairs))
function getRandomWordPair(categoryOrUsed = 'All', usedPairs = []) {
    let category = 'All';
    let usedList = usedPairs;

    if (Array.isArray(categoryOrUsed)) {
        usedList = categoryOrUsed;
    } else if (typeof categoryOrUsed === 'string') {
        category = categoryOrUsed;
    }

    let pool = IMPOSTER_WORD_PAIRS;
    if (category && category !== 'All') {
        pool = pool.filter(p => p.category.toLowerCase() === category.toLowerCase());
        if (pool.length === 0) pool = IMPOSTER_WORD_PAIRS;
    }

    const availablePairs = pool.filter(
        pair => !usedList.some(used => isSamePair(used, pair))
    );

    const chosen = availablePairs.length > 0
        ? availablePairs[Math.floor(Math.random() * availablePairs.length)]
        : pool[Math.floor(Math.random() * pool.length)];

    if (Math.random() < 0.5) {
        return {
            ...chosen,
            normalWord: chosen.imposterWord,
            imposterWord: chosen.normalWord,
        };
    }

    return chosen;
}

module.exports = {
    IMPOSTER_WORD_PAIRS,
    IMPOSTER_CATEGORIES,
    IMPOSTER_CONFIG,
    getRandomWordPair,
};
