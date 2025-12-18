const whosMostLikelyPrompts = [
    // Future
    { prompt: "Who's most likely to become famous?", category: "Future" },
    { prompt: "Who's most likely to become a millionaire?", category: "Future" },
    { prompt: "Who's most likely to travel the world?", category: "Future" },
    { prompt: "Who's most likely to write a book?", category: "Future" },
    { prompt: "Who's most likely to start their own business?", category: "Future" },
    { prompt: "Who's most likely to win a Nobel Prize?", category: "Future" },
    { prompt: "Who's most likely to retire early?", category: "Future" },
    { prompt: "Who's most likely to live to 100?", category: "Future" },
    { prompt: "Who's most likely to move to another country?", category: "Future" },
    { prompt: "Who's most likely to become a politician?", category: "Future" },

    // Personality
    { prompt: "Who's most likely to make everyone laugh?", category: "Personality" },
    { prompt: "Who's most likely to cry during a movie?", category: "Personality" },
    { prompt: "Who's most likely to be the life of the party?", category: "Personality" },
    { prompt: "Who's most likely to give the best advice?", category: "Personality" },
    { prompt: "Who's most likely to be brutally honest?", category: "Personality" },
    { prompt: "Who's most likely to overthink everything?", category: "Personality" },
    { prompt: "Who's most likely to stay calm in a crisis?", category: "Personality" },
    { prompt: "Who's most likely to start drama?", category: "Personality" },
    { prompt: "Who's most likely to forgive too easily?", category: "Personality" },
    { prompt: "Who's most likely to hold a grudge forever?", category: "Personality" },
    { prompt: "Who's most likely to be secretly rich?", category: "Personality" },
    { prompt: "Who's most likely to trust strangers too easily?", category: "Personality" },

    // Habits
    { prompt: "Who's most likely to sleep through their alarm?", category: "Habits" },
    { prompt: "Who's most likely to forget someone's birthday?", category: "Habits" },
    { prompt: "Who's most likely to lose their phone?", category: "Habits" },
    { prompt: "Who's most likely to binge-watch an entire series in one day?", category: "Habits" },
    { prompt: "Who's most likely to order takeout instead of cooking?", category: "Habits" },
    { prompt: "Who's most likely to check their phone first thing in the morning?", category: "Habits" },
    { prompt: "Who's most likely to stay up all night gaming?", category: "Habits" },
    { prompt: "Who's most likely to hit snooze 10 times?", category: "Habits" },
    { prompt: "Who's most likely to be late to their own wedding?", category: "Habits" },
    { prompt: "Who's most likely to forget where they parked?", category: "Habits" },
    { prompt: "Who's most likely to leave read receipts on?", category: "Habits" },
    { prompt: "Who's most likely to ghost someone?", category: "Habits" },

    // Skills
    { prompt: "Who's most likely to win a dance competition?", category: "Skills" },
    { prompt: "Who's most likely to survive a zombie apocalypse?", category: "Skills" },
    { prompt: "Who's most likely to win a cooking show?", category: "Skills" },
    { prompt: "Who's most likely to win an argument?", category: "Skills" },
    { prompt: "Who's most likely to fix anything that's broken?", category: "Skills" },
    { prompt: "Who's most likely to learn a new language quickly?", category: "Skills" },
    { prompt: "Who's most likely to win at trivia?", category: "Skills" },
    { prompt: "Who's most likely to rap battle and win?", category: "Skills" },
    { prompt: "Who's most likely to beat everyone at video games?", category: "Skills" },
    { prompt: "Who's most likely to negotiate anything?", category: "Skills" },

    // Random/Fun
    { prompt: "Who's most likely to talk to animals?", category: "Random" },
    { prompt: "Who's most likely to get lost in their own neighborhood?", category: "Random" },
    { prompt: "Who's most likely to accidentally set something on fire?", category: "Random" },
    { prompt: "Who's most likely to become a superhero?", category: "Random" },
    { prompt: "Who's most likely to win a reality TV show?", category: "Random" },
    { prompt: "Who's most likely to adopt 10 cats?", category: "Random" },
    { prompt: "Who's most likely to go viral on social media?", category: "Random" },
    { prompt: "Who's most likely to invent something useful?", category: "Random" },
    { prompt: "Who's most likely to meet a celebrity?", category: "Random" },
    { prompt: "Who's most likely to pull an all-nighter?", category: "Random" },
    { prompt: "Who's most likely to laugh at their own jokes?", category: "Random" },
    { prompt: "Who's most likely to get arrested for something silly?", category: "Random" },
    { prompt: "Who's most likely to join a cult by accident?", category: "Random" },
    { prompt: "Who's most likely to survive alone on a deserted island?", category: "Random" },

    // Relationships
    { prompt: "Who's most likely to get married first?", category: "Relationships" },
    { prompt: "Who's most likely to stay single forever by choice?", category: "Relationships" },
    { prompt: "Who's most likely to date a celebrity?", category: "Relationships" },
    { prompt: "Who's most likely to have the cutest couple photos?", category: "Relationships" },
    { prompt: "Who's most likely to be the best wingman/wingwoman?", category: "Relationships" },
    { prompt: "Who's most likely to slide into DMs?", category: "Relationships" },
    { prompt: "Who's most likely to text their ex at 2am?", category: "Relationships" },
    { prompt: "Who's most likely to have the longest relationship?", category: "Relationships" },

    // Technology
    { prompt: "Who's most likely to break their phone screen?", category: "Technology" },
    { prompt: "Who's most likely to fall for a scam?", category: "Technology" },
    { prompt: "Who's most likely to become a TikTok star?", category: "Technology" },
    { prompt: "Who's most likely to invent the next big app?", category: "Technology" },
    { prompt: "Who's most likely to still use a flip phone?", category: "Technology" },
    { prompt: "Who's most likely to have the worst WiFi password?", category: "Technology" },

    // Food
    { prompt: "Who's most likely to eat the last slice of pizza?", category: "Food" },
    { prompt: "Who's most likely to become a food blogger?", category: "Food" },
    { prompt: "Who's most likely to try any food once?", category: "Food" },
    { prompt: "Who's most likely to burn water?", category: "Food" },
    { prompt: "Who's most likely to eat dessert before dinner?", category: "Food" },
    { prompt: "Who's most likely to become vegetarian?", category: "Food" },

    // Travel
    { prompt: "Who's most likely to miss their flight?", category: "Travel" },
    { prompt: "Who's most likely to overpack for a weekend trip?", category: "Travel" },
    { prompt: "Who's most likely to befriend locals abroad?", category: "Travel" },
    { prompt: "Who's most likely to get lost without GPS?", category: "Travel" },

    // Party
    { prompt: "Who's most likely to be the DJ?", category: "Party" },
    { prompt: "Who's most likely to dance on the table?", category: "Party" },
    { prompt: "Who's most likely to be the first one drunk?", category: "Party" },
    { prompt: "Who's most likely to start a conga line?", category: "Party" },
    { prompt: "Who's most likely to take the most selfies?", category: "Party" },
    { prompt: "Who's most likely to remember everyone's names?", category: "Party" }
];


function getRandomPrompts(count = 10) {
    const shuffled = [...whosMostLikelyPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, whosMostLikelyPrompts.length));
}

module.exports = { whosMostLikelyPrompts, getRandomPrompts };
