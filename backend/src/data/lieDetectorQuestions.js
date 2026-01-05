// Lie Detector Game Questions
// Categories: personal, experiences, opinions, hypothetical

const lieDetectorQuestions = {
    personal: [
        "What's your real middle name?",
        "What was your childhood nickname?",
        "What's your favorite guilty pleasure TV show?",
        "What's something you've never told anyone here?",
        "What's your biggest fear?",
        "What's the most embarrassing thing in your phone?",
        "What's your hidden talent?",
        "What's your most unpopular opinion?",
        "What's the last lie you told?",
        "What's your secret obsession?",
        "What do you do when no one's watching?",
        "What's your most embarrassing memory?",
        "What's your dream vacation destination?",
        "What was your worst haircut ever?",
        "What's the weirdest food combination you enjoy?"
    ],
    experiences: [
        "Have you ever been in love?",
        "Have you ever ghosted someone?",
        "Have you ever pretended to like a gift?",
        "Have you ever blamed someone else for your mistake?",
        "Have you ever stalked an ex online?",
        "Have you ever faked being sick?",
        "Have you ever read someone's texts without permission?",
        "Have you ever cheated at a game?",
        "Have you ever forgotten someone's name after meeting them?",
        "Have you ever lied on your resume?",
        "Have you ever regifted a present?",
        "Have you ever crashed a party?",
        "Have you ever had a wardrobe malfunction in public?",
        "Have you ever pretended to be on the phone to avoid someone?",
        "Have you ever had a celebrity encounter?"
    ],
    opinions: [
        "Do you believe in love at first sight?",
        "Do you think money can buy happiness?",
        "Do you believe in aliens?",
        "Would you rather be famous or rich?",
        "Do you think social media is good for society?",
        "Would you ever go back to your ex?",
        "Do you judge people by their music taste?",
        "Do you think pineapple belongs on pizza?",
        "Would you sacrifice your career for love?",
        "Do you think it's okay to lie sometimes?",
        "Would you date someone shorter/taller than you?",
        "Do you think age is just a number in relationships?",
        "Would you read your partner's messages?",
        "Do you believe in soulmates?",
        "Would you move to another country for love?"
    ],
    hypothetical: [
        "If you won the lottery, what's the first thing you'd buy?",
        "If you could have dinner with anyone, who would it be?",
        "If you had to delete all social media except one, which would you keep?",
        "If you could live in any movie, which one?",
        "If you could only eat one food forever, what would it be?",
        "If you could swap lives with anyone for a day, who?",
        "If you had to choose a new career, what would it be?",
        "If you could time travel, past or future?",
        "If you could have any superpower, what would it be?",
        "If your life was a movie, what genre would it be?"
    ]
};

// Get random questions shuffled across categories
const getRandomQuestions = (count = 10) => {
    const allQuestions = [
        ...lieDetectorQuestions.personal,
        ...lieDetectorQuestions.experiences,
        ...lieDetectorQuestions.opinions,
        ...lieDetectorQuestions.hypothetical
    ];

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get questions from specific categories
const getQuestionsByCategories = (categories, count = 10) => {
    let questions = [];
    categories.forEach(cat => {
        if (lieDetectorQuestions[cat]) {
            questions = [...questions, ...lieDetectorQuestions[cat]];
        }
    });
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

module.exports = {
    lieDetectorQuestions,
    getRandomQuestions,
    getQuestionsByCategories
};
