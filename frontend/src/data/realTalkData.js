export const REAL_TALK_CATEGORIES = [
    {
        id: 'icebreakers',
        title: 'Icebreakers',
        description: 'Light, fun questions to get the conversation started. Perfect for new friends.',
        icon: 'cafe-outline', // Ionicons
        color: '#00E5FF', // neonCyan
        questions: [
            "What's a topic you could give a 30-minute presentation on with zero preparation?",
            "What's the most useless talent you have?",
            "If you could teleport anywhere in the world right now, where would you go?",
            "What's a movie or TV show you quote constantly?",
            "What's the best piece of advice you've ever received?",
            "If you had to eat one meal for the rest of your life, what would it be?",
            "What's the weirdest food combination you actually enjoy?",
            "If your life had a theme song, what would it be?",
            "What's your most controversial food opinion?",
            "What's a weird habit you have that you think nobody else does?",
            "What's the best prank you've ever pulled (or had pulled on you)?",
            "What's the luckiest thing that has ever happened to you?",
            "If you could instantly become an expert in something, what would it be?",
            "What's the most embarrassing thing you've done in public?",
            "What is a hill you are willing to die on?"
            ,
            "If you could have any superpower for a day, what would it be?",
            "What's the most unusual place you've ever fallen asleep?",
            "If you were a flavor of ice cream, which would you be and why?",
            "What's a childhood game you still love to play?",
            "Which fictional world would you love to visit for a weekend?",
        ]
    },
    {
        id: 'deep-dive',
        title: 'Deep Dive',
        description: 'Thought-provoking questions to spark vulnerable and meaningful conversations.',
        icon: 'water-outline', // Ionicons
        color: '#8A2BE2', // Deep purple
        questions: [
            "What is something you've accomplished that you're incredibly proud of, but rarely talk about?",
            "When was the last time you changed your mind about something important?",
            "What's a fear you have that you feel is holding you back?",
            "Who has had the biggest impact on the person you are today?",
            "What is a dream you've let go of, and why?",
            "When do you feel most like your true self?",
            "What is the hardest lesson you've had to learn in life?",
            "What is something you wish you could forgive yourself for?",
            "How do you typically handle feeling overwhelmed?",
            "What is a memory that instantly makes you smile?",
            "What does 'success' mean to you personally?",
            "What is something you struggle to ask for help with?",
            "If you could write a letter to your younger self, what is the main thing you'd say?",
            "What is a boundary you've had to set recently?",
            "What is the most beautiful thing you've experienced recently?",
            "What is a belief you held that changed dramatically over time?",
            "When was a moment you felt truly vulnerable and what did you learn?",
            "What habit would you like to develop that you think would improve your life?",
            "What does love mean to you beyond romance?",
            "What is a mistake that turned into a blessing?",
            "What is an experience that forced you to confront a fear?",
            "If you could ask your future self one question, what would it be?",
            "What is a belief you held strongly that you recently changed your mind about?",
            "If you could watch a highlight reel of your life, what moments would you want to see?",
            "What's the most difficult conversation you've ever had, and what did you learn from it?",
            "What is a memory that you wish you could experience again for the first time?",
            "What part of your life do you feel is currently on autopilot, and how can you change it?",
            "If your life had a theme song right now, what would it be and why?",
            "What is the most courageous thing you have ever done?",
            "When do you feel most misunderstood by others?",
            "What is something you're currently unlearning?",
            "What is the biggest risk you've ever taken, and was it worth it?",
            "How has your definition of happiness changed over the last 5 years?",
            "If you knew you couldn't fail, what is one thing you would attempt right now?",
            "What is a flaw in yourself that you are actively trying to improve?",
            "What is the best compliment you've ever received that wasn't about your appearance?",
            "What is a chapter of your life that you rarely talk about but deeply shaped you?",
            "How do you want to be remembered by the people closest to you?",
            "What is something you suspect is true, but have no proof of?",
            "If you had to describe your inner world as a landscape, what would it look like?",
            "What is the biggest sacrifice you've made for someone else?",
            "When was the last time you felt truly at peace, and what were you doing?",
            "What is a societal norm that you fundamentally disagree with?"
        ]
    },
    {
        id: 'couples',
        title: 'Couples',
        description: 'Questions designed to strengthen relationships and spark romance.',
        icon: 'heart-outline', // Ionicons
        color: '#FF1493', // hotPink
        questions: [
            "What was your first impression of me?",
            "What is your favorite memory of us together?",
            "When do you feel the most loved by me?",
            "What is a small thing I do that makes you smile?",
            "What is something we haven't done together yet that you'd love to do?",
            "What is a quality in me that you admire?",
            "How can I better support you when you're stressed?",
            "What is your favorite non-physical trait of mine?",
            "What is a song that always reminds you of us?",
            "When did you realize you were falling for me?",
            "What is a dream or goal you have for our future?",
            "What is the most romantic thing someone could do for you?",
            "What do you think is our biggest strength as a couple?",
            "What is something I do that always makes you laugh?",
            "What is a challenge we've overcome together that made us stronger?",
            "What is your favorite way to spend a lazy day with me?",
            "What is something you wish we did more often?",
            "How has our relationship changed you for the better?",
            "What is a detail about our first date that you'll never forget?",
            "What do you need most from me right now?",
            "If we could go on any adventure together tomorrow, where would we go and what would we do?"
        ]
    }
];

export const getQuestionsByCategory = (categoryId) => {
    const category = REAL_TALK_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.questions : [];
};
