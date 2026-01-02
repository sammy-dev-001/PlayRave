// Draw Battle - drawing prompts for players to draw
// Players draw based on a prompt, others vote on best drawing

const DRAW_PROMPTS = [
    // Easy
    "A happy sun",
    "A cute cat",
    "A pizza slice",
    "A house",
    "A flower",
    "A smiley face",
    "A star",
    "An ice cream cone",
    "A balloon",
    "A rainbow",

    // Medium
    "A dancing robot",
    "A pirate ship",
    "A unicorn",
    "A dragon breathing fire",
    "An alien spaceship",
    "A haunted house",
    "A mermaid",
    "A superhero",
    "A wizard casting a spell",
    "A dinosaur playing basketball",

    // Funny/Creative
    "A cat wearing sunglasses",
    "A fish riding a bicycle",
    "An angry taco",
    "A penguin at the beach",
    "A banana with muscles",
    "A sleepy moon",
    "Your best friend as a cartoon",
    "The host's face",
    "A pizza that's alive",
    "A dog driving a car",

    // Party themed
    "The best party ever",
    "A DJ dropping beats",
    "Someone dancing badly",
    "The dance floor chaos",
    "A party animal (literally)"
];

// Get random prompts for a game
const getRandomDrawPrompts = (count = 5) => {
    const shuffled = [...DRAW_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get a single random prompt
const getRandomDrawPrompt = () => {
    return DRAW_PROMPTS[Math.floor(Math.random() * DRAW_PROMPTS.length)];
};

module.exports = {
    DRAW_PROMPTS,
    getRandomDrawPrompts,
    getRandomDrawPrompt
};
