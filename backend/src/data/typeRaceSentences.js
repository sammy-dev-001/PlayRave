// Type Race sentences for players to type
// Mix of fun, silly, and challenging sentences

const TYPE_RACE_SENTENCES = [
    // Easy (short)
    "The quick brown fox jumps over the lazy dog.",
    "Party time is the best time!",
    "Who let the dogs out?",
    "I love pizza more than sleep.",
    "The music is too loud!",
    "Dancing all night long.",
    "Best friends forever!",
    "Let's get this party started!",
    "Life is better with friends.",
    "Neon lights are so cool.",

    // Medium
    "If you can read this, you're typing too slow!",
    "The only limit is your imagination and maybe your typing speed.",
    "Winners never quit and quitters never win this game!",
    "Keep calm and type faster than everyone else here!",
    "Practice makes perfect, but nobody is perfect so why practice?",
    "I tried to be normal once. Worst two minutes of my life.",
    "Behind every great person is a great cat sleeping on the keyboard.",
    "Coffee and good music make everything better instantly.",
    "The weekend is calling and I must answer immediately!",
    "Friday is my second favorite F word. Food is my first!",

    // Hard (long/complex)
    "The spectacular neon glow illuminated the entire dance floor magnificently!",
    "Approximately seventy-six trombones led the big parade last Thursday evening.",
    "My friend's quirky jacuzzi has exactly five dozen luminous bubbles floating around!",
    "She sells seashells by the seashore and the shells she sells are seashells for sure.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "The mysterious wizard quickly jinxed the gnomes before they vaporized!",
    "Pack my box with five dozen liquor jugs said the bartender enthusiastically.",
    "Crazy Frederick bought many very exquisite opal jewels at the auction yesterday!",
    "The five boxing wizards jump quickly while eating delicious tacos together!",
    "Jackdaws love my big sphinx of quartz, and the sphinx loves them back!",

    // Party themed
    "This party is absolutely legendary and will be talked about forever!",
    "Turn up the volume and let's dance until sunrise together!",
    "The DJ is dropping some seriously fire beats right now!",
    "Let's take a group selfie and make everyone jealous of us!",
    "Never trust someone who doesn't like music or pizza!",
    "Dance like nobody is watching because they're all too busy dancing too!",
    "The best memories come from the craziest nights with amazing friends!",
    "Life is short, eat the cake and dance on the table!",
    "Good vibes only, no drama allowed at this epic party!",
    "Warning: excessive fun may cause sore muscles from dancing!"
];

// Get random sentences for a game round
const getRandomSentences = (count = 5) => {
    const shuffled = [...TYPE_RACE_SENTENCES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get a single random sentence
const getRandomSentence = () => {
    return TYPE_RACE_SENTENCES[Math.floor(Math.random() * TYPE_RACE_SENTENCES.length)];
};

module.exports = {
    TYPE_RACE_SENTENCES,
    getRandomSentences,
    getRandomSentence
};
