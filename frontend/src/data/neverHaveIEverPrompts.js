// Never Have I Ever prompts organized by category
const neverHaveIEverPrompts = {
    normal: [
        "Never have I ever forgotten someone's name right after meeting them",
        "Never have I ever pretended to laugh at a joke I didn't understand",
        "Never have I ever stayed up all night binge-watching a TV show",
        "Never have I ever eaten food off the floor",
        "Never have I ever pretended to be sick to skip work or school",
        "Never have I ever cried during a movie",
        "Never have I ever talked to myself out loud",
        "Never have I ever sung in the shower",
        "Never have I ever danced when no one was watching",
        "Never have I ever worn the same clothes two days in a row",
        "Never have I ever laughed at an inappropriate moment",
        "Never have I ever waved back at someone who wasn't waving at me",
        "Never have I ever walked into a glass door",
        "Never have I ever fallen asleep during a meeting or class",
        "Never have I ever sent a text to the wrong person",
        "Never have I ever regifted a present",
        "Never have I ever blamed a fart on someone else",
        "Never have I ever picked my nose in public",
        "Never have I ever lied about my age",
        "Never have I ever had a celebrity obsession",
        "Never have I ever eaten an entire pizza by myself",
        "Never have I ever been scared of the dark",
        "Never have I ever been lost in a place I should know well",
        "Never have I ever forgotten someone's birthday",
        "Never have I ever pretended not to see someone to avoid talking to them",
        "Never have I ever tripped and pretended I was fine",
        "Never have I ever used someone else's toothbrush",
        "Never have I ever eaten breakfast for dinner",
        "Never have I ever stayed in my pajamas all day",
        "Never have I ever talked to an animal like it was a person"
    ],
    spicy: [
        "Never have I ever had a crush on my friend's sibling",
        "Never have I ever kissed more than one person in the same day",
        "Never have I ever gone skinny dipping",
        "Never have I ever had a secret relationship",
        "Never have I ever stalked an ex on social media",
        "Never have I ever slid into someone's DMs",
        "Never have I ever had a one-night stand",
        "Never have I ever been on a blind date",
        "Never have I ever been caught checking someone out",
        "Never have I ever made the first move",
        "Never have I ever kissed someone I just met",
        "Never have I ever had a friends-with-benefits situation",
        "Never have I ever been ghosted",
        "Never have I ever ghosted someone",
        "Never have I ever dated someone my friends didn't like",
        "Never have I ever had a crush on a coworker",
        "Never have I ever gone on a date just for free food",
        "Never have I ever kissed someone to make someone else jealous",
        "Never have I ever been in love with two people at once",
        "Never have I ever had a dream about someone in this room",
        "Never have I ever faked interest in someone's hobby to impress them",
        "Never have I ever pretended to like someone's cooking",
        "Never have I ever broken up with someone via text",
        "Never have I ever been caught flirting",
        "Never have I ever had an awkward first date",
        "Never have I ever been set up on a date by friends",
        "Never have I ever lied on a dating app",
        "Never have I ever gotten back with an ex",
        "Never have I ever had a vacation fling",
        "Never have I ever been in a long-distance relationship"
    ],
    naughty: [
        "Never have I ever sent a dirty text",
        "Never have I ever had a threesome",
        "Never have I ever watched adult content with someone",
        "Never have I ever been caught in a compromising position",
        "Never have I ever used a dating app for hookups",
        "Never have I ever had an intimate moment in public",
        "Never have I ever been intimate in a car",
        "Never have I ever role-played with a partner",
        "Never have I ever tried BDSM",
        "Never have I ever had an intimate moment with a stranger",
        "Never have I ever been intimate at work",
        "Never have I ever sent intimate photos",
        "Never have I ever received intimate photos",
        "Never have I ever had phone intimacy",
        "Never have I ever been intimate in water",
        "Never have I ever been walked in on",
        "Never have I ever walked in on someone else",
        "Never have I ever used toys with a partner",
        "Never have I ever been intimate outdoors",
        "Never have I ever had an intimate experience I regret",
        "Never have I ever been intimate on a first date",
        "Never have I ever been intimate in a hotel",
        "Never have I ever tried something new in the bedroom",
        "Never have I ever watched intimate content at work",
        "Never have I ever been caught watching intimate content",
        "Never have I ever hooked up with an ex",
        "Never have I ever been intimate with a friend's ex",
        "Never have I ever been intimate in a parent's house",
        "Never have I ever had an affair",
        "Never have I ever been intimate in an airplane"
    ]
};

const getRandomPrompt = (category = 'normal', usedPrompts = []) => {
    const categoryPrompts = neverHaveIEverPrompts[category] || neverHaveIEverPrompts.normal;
    const availablePrompts = categoryPrompts.filter(prompt => !usedPrompts.includes(prompt));

    if (availablePrompts.length === 0) {
        return categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    }

    return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
};

export { neverHaveIEverPrompts, getRandomPrompt };
