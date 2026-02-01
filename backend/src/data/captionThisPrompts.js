const CAPTION_THIS_PROMPTS = [
    // Funny/Weird Images (Using placeholders or reliable public URLs if needed, but for now descriptions/emojis as placeholders)
    // In a real app, these would be URLs to hosted images.
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Pug dog
        category: 'animals'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Cat with glasses
        category: 'animals'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1537151377170-9c19a791817a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Surprised baby
        category: 'people'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1562095241-8c6714fd4178?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Weird sculpture
        category: 'weird'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1516726817505-f5ed8251b4a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Dancing guy
        category: 'party'
    },
    // Text scenarios
    {
        type: 'text',
        content: 'When you check your bank account after a night out 💸',
        category: 'relatable'
    },
    {
        type: 'text',
        content: 'That face you make when the WiFi disconnects mid-game 😱',
        category: 'gaming'
    },
    {
        type: 'text',
        content: 'Me trying to explain to my mom how I can pause an online game 🗣️',
        category: 'gaming'
    },
    {
        type: 'text',
        content: 'When the code works on the first try and you have no idea why 🧑‍💻',
        category: 'tech'
    },
    {
        type: 'text',
        content: 'The moment you realize you forgot to mute your mic 🎤',
        category: 'oops'
    }
];

const getRandomPrompts = (count = 5) => {
    const shuffled = [...CAPTION_THIS_PROMPTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

module.exports = {
    CAPTION_THIS_PROMPTS,
    getRandomPrompts
};
