const SPEED_CATEGORIES = [
    'Animals',
    'Countries',
    'Capital Cities',
    'Fruits',
    'Vegetables',
    'A Boy\'s Name',
    'A Girl\'s Name',
    'Colors',
    'Movies',
    'TV Shows',
    'Car Brands',
    'Sports',
    'Musical Instruments',
    'Historical Figures',
    'Things found in a Kitchen',
    'Things found in a Bathroom',
    'Things that are Cold',
    'Things that are Hot',
    'Clothing Brands',
    'Video Games',
    'Chemical Elements',
    'Body Parts',
    'Occupations',
    'Languages',
    'Planets'
];

const getRandomCategories = (count = 5) => {
    const shuffled = [...SPEED_CATEGORIES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const getRandomLetter = () => {
    const alphabet = "ABCDEFGHIJKLMNOPRSTW"; // Common letters, avoiding Q, X, Z, etc.
    return alphabet[Math.floor(Math.random() * alphabet.length)];
};

module.exports = {
    SPEED_CATEGORIES,
    getRandomCategories,
    getRandomLetter
};
