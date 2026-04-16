/**
 * Hot Seat MC — "How Well Do You Know Me?" Questions
 * Each question has a category, prompt, and exactly 4 options.
 */

const HOT_SEAT_MC_QUESTIONS = {
    Icebreaker: [
        {
            question: "What's my go-to comfort food?",
            options: ["Pizza", "Ice Cream", "Mac & Cheese", "Fried Chicken"]
        },
        {
            question: "What would I do with a free Saturday?",
            options: ["Sleep all day", "Go out with friends", "Binge a TV show", "Hit the gym"]
        },
        {
            question: "What's my dream vacation destination?",
            options: ["Paris", "Bali", "Tokyo", "New York"]
        },
        {
            question: "What's my morning drink?",
            options: ["Coffee", "Tea", "Water", "Juice"]
        },
        {
            question: "What pet would I adopt right now?",
            options: ["Dog", "Cat", "Fish", "No pets, thanks"]
        },
        {
            question: "What genre of music do I vibe with most?",
            options: ["Hip-Hop / Rap", "Pop", "R&B / Soul", "Afrobeats"]
        },
        {
            question: "What superpower would I pick?",
            options: ["Invisibility", "Flying", "Time Travel", "Mind Reading"]
        },
        {
            question: "What's my biggest guilty pleasure?",
            options: ["Reality TV", "Junk food at 2 AM", "Napping way too long", "Online shopping"]
        },
        {
            question: "What social media do I spend the most time on?",
            options: ["Instagram", "TikTok", "X (Twitter)", "YouTube"]
        },
        {
            question: "If I won the lottery, what's the FIRST thing I'd buy?",
            options: ["A house", "A car", "A vacation", "Invest it all"]
        },
        {
            question: "What's my favourite season?",
            options: ["Summer", "Winter", "Autumn", "Spring"]
        },
        {
            question: "What movie genre is my favourite?",
            options: ["Action", "Comedy", "Horror", "Romance"]
        },
        {
            question: "What's my ideal Friday night?",
            options: ["Party / Club", "Dinner with friends", "Couch and chill", "Gaming all night"]
        },
        {
            question: "What am I most likely to be late because of?",
            options: ["Outfit changes", "Sleeping in", "Scrolling my phone", "I'm actually always early"]
        },
        {
            question: "What's my go-to karaoke song?",
            options: ["A power ballad", "A rap song", "A throwback classic", "I'd never do karaoke"]
        }
    ],

    Spicy: [
        {
            question: "What's the biggest lie I've ever told?",
            options: ["About my age", "About where I was", "About my feelings", "I never lie 😇"]
        },
        {
            question: "What's my biggest ick in a partner?",
            options: ["Bad hygiene", "Being rude to staff", "No sense of humour", "Being too clingy"]
        },
        {
            question: "How many people have I kissed?",
            options: ["0-2", "3-5", "6-10", "11+"]
        },
        {
            question: "What would I do if I caught my friend's partner cheating?",
            options: ["Tell my friend immediately", "Confront the partner first", "Mind my business", "Gather evidence first"]
        },
        {
            question: "What's my most embarrassing moment?",
            options: ["Tripping in public", "Sending the wrong text to the wrong person", "Getting caught lying", "A wardrobe malfunction"]
        },
        {
            question: "What's my biggest red flag?",
            options: ["I overthink everything", "I ghost people", "I'm too stubborn", "I fall in love too fast"]
        },
        {
            question: "What would I never do for money?",
            options: ["Eat a bug", "Shave my head", "Post something embarrassing online", "I'd do anything for the right price"]
        },
        {
            question: "How petty am I on a scale?",
            options: ["Not petty at all", "Slightly petty", "Very petty when provoked", "Professional-level petty"]
        },
        {
            question: "What's the longest I've gone without replying to a text?",
            options: ["A few hours", "A day", "Multiple days", "I'm still leaving people on read right now"]
        },
        {
            question: "What's the most toxic trait I'd admit to?",
            options: ["Jealousy", "Being too competitive", "Giving the silent treatment", "Stalking social media"]
        },
        {
            question: "How often do I check my ex's profile?",
            options: ["Never", "Occasionally", "More often than I'd admit", "I have a burner account for this"]
        },
        {
            question: "What would I pick: truth or dare?",
            options: ["Truth — always", "Dare — no fear", "Depends on who's asking", "Neither, I'd skip my turn"]
        },
        {
            question: "What secret have I kept the longest?",
            options: ["A crush", "Something I did wrong", "Someone else's secret", "I'm an open book"]
        },
        {
            question: "Would I ever get back with an ex?",
            options: ["Absolutely not", "Maybe, if they changed", "Already have, tbh", "Depends which one"]
        },
        {
            question: "What's the most suspicious thing on my phone?",
            options: ["My search history", "My DMs", "My photo gallery", "Nothing, I'm clean"]
        }
    ],

    "Deep Dive": [
        {
            question: "What am I most afraid of in life?",
            options: ["Failure", "Loneliness", "Losing loved ones", "Not finding my purpose"]
        },
        {
            question: "What's the one thing I'd change about myself?",
            options: ["My confidence", "My appearance", "My habits", "Nothing—I'm working on self love"]
        },
        {
            question: "What keeps me up at night?",
            options: ["Anxiety about the future", "Overthinking the past", "Random creative ideas", "Nothing, I sleep like a baby"]
        },
        {
            question: "How do I handle conflict?",
            options: ["Confront it head on", "Avoid it completely", "Talk it out calmly later", "Let it build up and explode"]
        },
        {
            question: "What makes me feel most loved?",
            options: ["Words of affirmation", "Quality time", "Physical touch", "Acts of service / Gifts"]
        },
        {
            question: "What do I value most in a friendship?",
            options: ["Loyalty", "Honesty", "Fun and vibes", "Emotional support"]
        },
        {
            question: "If I could have dinner with anyone (alive or dead), who?",
            options: ["A family member who passed", "A celebrity I admire", "A historical figure", "My future self"]
        },
        {
            question: "What do I think happens after we die?",
            options: ["Heaven / an afterlife", "Reincarnation", "Nothing, it's just over", "I try not to think about it"]
        },
        {
            question: "What's my love language?",
            options: ["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service"]
        },
        {
            question: "What would I sacrifice for my dreams?",
            options: ["Relationships", "Financial stability", "My comfort zone", "Nothing — balance is key"]
        },
        {
            question: "What's the hardest life lesson I've learned?",
            options: ["Not everyone is your friend", "You can't control everything", "Failure is part of growth", "You have to put yourself first sometimes"]
        },
        {
            question: "What emotion do I struggle with the most?",
            options: ["Anger", "Sadness", "Jealousy", "Anxiety"]
        },
        {
            question: "Where do I see myself in 5 years?",
            options: ["Thriving in my career", "Travelling the world", "Settled with a family", "Honestly, I have no clue"]
        },
        {
            question: "What's my biggest regret?",
            options: ["Not speaking up when I should have", "A missed opportunity", "A relationship I lost", "I don't believe in regrets"]
        },
        {
            question: "What motivates me the most?",
            options: ["Money and success", "Making my family proud", "Personal growth", "Proving people wrong"]
        }
    ]
};

/**
 * Get a random question from a specific category (or any category).
 * @param {string} [category] - 'Icebreaker', 'Spicy', or 'Deep Dive'. Omit for random.
 * @param {string[]} [usedQuestions] - Array of already-used question strings to avoid repeats.
 * @returns {{ category: string, question: string, options: string[] }}
 */
function getRandomHotSeatMCQuestion(category, usedQuestions = []) {
    let pool;

    if (category && HOT_SEAT_MC_QUESTIONS[category]) {
        pool = HOT_SEAT_MC_QUESTIONS[category].map(q => ({ ...q, category }));
    } else {
        // Pool from all categories
        pool = [];
        for (const [cat, questions] of Object.entries(HOT_SEAT_MC_QUESTIONS)) {
            questions.forEach(q => pool.push({ ...q, category: cat }));
        }
    }

    // Filter out used questions
    const available = pool.filter(q => !usedQuestions.includes(q.question));

    // If all used, reset and pick from full pool
    const finalPool = available.length > 0 ? available : pool;

    const selected = finalPool[Math.floor(Math.random() * finalPool.length)];
    return selected;
}

/**
 * Get all available categories.
 * @returns {string[]}
 */
function getHotSeatMCCategories() {
    return Object.keys(HOT_SEAT_MC_QUESTIONS);
}

module.exports = {
    HOT_SEAT_MC_QUESTIONS,
    getRandomHotSeatMCQuestion,
    getHotSeatMCCategories
};
