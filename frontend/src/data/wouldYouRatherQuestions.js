// Would You Rather questions for local party mode
const wouldYouRatherQuestions = [
    {
        id: 1,
        optionA: "Have the ability to fly",
        optionB: "Have the ability to be invisible"
    },
    {
        id: 2,
        optionA: "Live without music",
        optionB: "Live without movies"
    },
    {
        id: 3,
        optionA: "Always be 10 minutes late",
        optionB: "Always be 20 minutes early"
    },
    {
        id: 4,
        optionA: "Have unlimited money",
        optionB: "Have unlimited free time"
    },
    {
        id: 5,
        optionA: "Know how you die",
        optionB: "Know when you die"
    },
    {
        id: 6,
        optionA: "Be able to read minds",
        optionB: "Be able to see the future"
    },
    {
        id: 7,
        optionA: "Live in the past",
        optionB: "Live in the future"
    },
    {
        id: 8,
        optionA: "Never use social media again",
        optionB: "Never watch TV/movies again"
    },
    {
        id: 9,
        optionA: "Have a rewind button for life",
        optionB: "Have a pause button for life"
    },
    {
        id: 10,
        optionA: "Be famous but poor",
        optionB: "Be rich but unknown"
    },
    {
        id: 11,
        optionA: "Fight 100 duck-sized horses",
        optionB: "Fight 1 horse-sized duck"
    },
    {
        id: 12,
        optionA: "Never eat your favorite food again",
        optionB: "Only eat your favorite food"
    },
    {
        id: 13,
        optionA: "Lose all your memories",
        optionB: "Never make new memories"
    },
    {
        id: 14,
        optionA: "Be stuck on a broken ski lift",
        optionB: "Be stuck in a broken elevator"
    },
    {
        id: 15,
        optionA: "Have no internet",
        optionB: "Have no phone"
    },
    {
        id: 16,
        optionA: "Always say what you think",
        optionB: "Never speak again"
    },
    {
        id: 17,
        optionA: "Live without heating",
        optionB: "Live without AC"
    },
    {
        id: 18,
        optionA: "Be the funniest person",
        optionB: "Be the smartest person"
    },
    {
        id: 19,
        optionA: "Have a personal chef",
        optionB: "Have a personal driver"
    },
    {
        id: 20,
        optionA: "Never be able to lie",
        optionB: "Never be able to tell the truth"
    },
    {
        id: 21,
        optionA: "Live in a world with no problems",
        optionB: "Live in a world with no rules"
    },
    {
        id: 22,
        optionA: "Have a photographic memory",
        optionB: "Have perfect intuition"
    },
    {
        id: 23,
        optionA: "Be able to talk to animals",
        optionB: "Be able to speak all languages"
    },
    {
        id: 24,
        optionA: "Never have to sleep",
        optionB: "Never have to eat"
    },
    {
        id: 25,
        optionA: "Live in a treehouse",
        optionB: "Live on a boat"
    },
    {
        id: 26,
        optionA: "Have a third arm",
        optionB: "Have a third eye"
    },
    {
        id: 27,
        optionA: "Be allergic to chocolate",
        optionB: "Be allergic to pizza"
    },
    {
        id: 28,
        optionA: "Have a time machine",
        optionB: "Have a teleporter"
    },
    {
        id: 29,
        optionA: "Never age physically",
        optionB: "Never age mentally"
    },
    {
        id: 30,
        optionA: "Be trapped in a romantic comedy",
        optionB: "Be trapped in a horror movie"
    },
    {
        id: 31,
        optionA: "Have everyone you know read your thoughts for a day",
        optionB: "Have everyone you know read your diary"
    },
    {
        id: 32,
        optionA: "Be able to control fire",
        optionB: "Be able to control water"
    },
    {
        id: 33,
        optionA: "Live without coffee",
        optionB: "Live without alcohol"
    },
    {
        id: 34,
        optionA: "Have a pet dragon",
        optionB: "Have a pet unicorn"
    },
    {
        id: 35,
        optionA: "Be the best player on a losing team",
        optionB: "Be the worst player on a winning team"
    },
    {
        id: 36,
        optionA: "Have unlimited battery life on all devices",
        optionB: "Have free WiFi everywhere"
    },
    {
        id: 37,
        optionA: "Be able to change the past",
        optionB: "Be able to see the future"
    },
    {
        id: 38,
        optionA: "Live in a world without music",
        optionB: "Live in a world without color"
    },
    {
        id: 39,
        optionA: "Have a personal masseuse",
        optionB: "Have a personal trainer"
    },
    {
        id: 40,
        optionA: "Be able to breathe underwater",
        optionB: "Be able to fly"
    },
    {
        id: 41,
        optionA: "Have a horrible job but make millions",
        optionB: "Have your dream job but barely make ends meet"
    },
    {
        id: 42,
        optionA: "Be stuck in traffic for 2 hours",
        optionB: "Be stuck in a waiting room for 2 hours"
    },
    {
        id: 43,
        optionA: "Have a photographic memory of everything you read",
        optionB: "Have a photographic memory of everything you see"
    },
    {
        id: 44,
        optionA: "Be able to eat anything without gaining weight",
        optionB: "Need only 2 hours of sleep per night"
    },
    {
        id: 45,
        optionA: "Have a mansion in the middle of nowhere",
        optionB: "Have a small apartment in the city center"
    },
    {
        id: 46,
        optionA: "Be famous on TikTok",
        optionB: "Be famous on Instagram"
    },
    {
        id: 47,
        optionA: "Have a pause button for your life",
        optionB: "Have a fast-forward button for your life"
    },
    {
        id: 48,
        optionA: "Be able to control technology with your mind",
        optionB: "Be able to control people with your mind"
    },
    {
        id: 49,
        optionA: "Live in a world where everyone tells the truth",
        optionB: "Live in a world where everyone lies"
    },
    {
        id: 50,
        optionA: "Have a clone of yourself",
        optionB: "Have a robot assistant"
    },
    {
        id: 51,
        optionA: "Be able to control the weather",
        optionB: "Be able to control traffic"
    },
    {
        id: 52,
        optionA: "Never have to do laundry again",
        optionB: "Never have to do dishes again"
    },
    {
        id: 53,
        optionA: "Have a pause button in your life",
        optionB: "Have a rewind button in your life"
    },
    {
        id: 54,
        optionA: "Lose your keys every day",
        optionB: "Lose your phone every day"
    },
    {
        id: 55,
        optionA: "Live in a house made of candy",
        optionB: "Live in a house made of clouds"
    },
    {
        id: 56,
        optionA: "Be able to change your appearance at will",
        optionB: "Be able to change your personality at will"
    },
    {
        id: 57,
        optionA: "Have the power of flight",
        optionB: "Have the power of teleportation"
    },
    {
        id: 58,
        optionA: "Always be dressed for winter in summer",
        optionB: "Always be dressed for summer in winter"
    },
    {
        id: 59,
        optionA: "Be a famous rock star",
        optionB: "Be a famous scientist"
    },
    {
        id: 60,
        optionA: "Have unlimited free travel",
        optionB: "Have unlimited free food"
    },
    {
        id: 61,
        optionA: "Be able to breathe underwater",
        optionB: "Be able to survive in space"
    },
    {
        id: 62,
        optionA: "Have a tail",
        optionB: "Have wings"
    },
    {
        id: 63,
        optionA: "Always feel like you have to sneeze",
        optionB: "Always have a hidden itch"
    },
    {
        id: 64,
        optionA: "Live in a world without internet",
        optionB: "Live in a world without music"
    },
    {
        id: 65,
        optionA: "Be the smartest person in the room",
        optionB: "Be the funniest person in the room"
    },
    {
        id: 66,
        optionA: "Never get stuck in traffic",
        optionB: "Never get a cold"
    },
    {
        id: 67,
        optionA: "Have to sing everything you say",
        optionB: "Have to dance every time you walk"
    },
    {
        id: 68,
        optionA: "Be able to see ghosts",
        optionB: "Be able to see aliens"
    },
    {
        id: 69,
        optionA: "Always know when someone is lying",
        optionB: "Always get away with lying"
    },
    {
        id: 70,
        optionA: "Be a master of every musical instrument",
        optionB: "Be fluent in every language"
    }
];

export const getRandomQuestion = (usedQuestions = []) => {
    const availableQuestions = wouldYouRatherQuestions.filter(
        q => !usedQuestions.includes(q.id)
    );

    if (availableQuestions.length === 0) {
        return wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)];
    }

    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

export default wouldYouRatherQuestions;
