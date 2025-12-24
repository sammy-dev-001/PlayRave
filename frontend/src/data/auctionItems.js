// Auction Bluff - Items for bidding with real and fake facts
// Players bid on items, but some "facts" are bluffs!

export const AUCTION_ITEMS = [
    // Historical Items
    {
        id: 1,
        name: "Napoleon's Hat",
        image: "🎩",
        category: "historical",
        realFact: "One of Napoleon's bicorne hats sold for $2.4 million at auction in 2023",
        bluffFact: "Napoleon wore his hat sideways to look more intimidating",
        realValue: 2400000,
    },
    {
        id: 2,
        name: "Einstein's Letter",
        image: "✉️",
        category: "historical",
        realFact: "Einstein's 'God Letter' sold for $2.9 million in 2018",
        bluffFact: "Einstein wrote this letter while riding a unicycle",
        realValue: 2900000,
    },
    {
        id: 3,
        name: "Moon Rock",
        image: "🌙",
        category: "space",
        realFact: "Lunar samples are valued at around $50,000 per gram",
        bluffFact: "Moon rocks taste like blue cheese according to astronauts",
        realValue: 50000,
    },
    {
        id: 4,
        name: "T-Rex Tooth",
        image: "🦖",
        category: "fossils",
        realFact: "A complete T-Rex skeleton named Sue sold for $8.4 million",
        bluffFact: "T-Rex teeth regrow every 20 days like shark teeth",
        realValue: 15000,
    },
    {
        id: 5,
        name: "Original iPhone",
        image: "📱",
        category: "tech",
        realFact: "Sealed original iPhones have sold for over $63,000",
        bluffFact: "Steve Jobs personally signed every 1000th iPhone",
        realValue: 63000,
    },

    // Art & Collectibles
    {
        id: 6,
        name: "Pokemon Card",
        image: "🎴",
        category: "gaming",
        realFact: "A Pikachu Illustrator card sold for $5.3 million",
        bluffFact: "Only 3 of these cards exist and one is owned by a cat",
        realValue: 5300000,
    },
    {
        id: 7,
        name: "Banksy Artwork",
        image: "🎨",
        category: "art",
        realFact: "Banksy's 'Love is in the Bin' sold for $25 million after shredding itself",
        bluffFact: "Banksy is actually a group of 47 artists",
        realValue: 25000000,
    },
    {
        id: 8,
        name: "Vintage Wine",
        image: "🍷",
        category: "food",
        realFact: "A bottle of 1945 Romanée-Conti sold for $558,000",
        bluffFact: "This wine was aged inside a volcano",
        realValue: 558000,
    },
    {
        id: 9,
        name: "Rolex Watch",
        image: "⌚",
        category: "luxury",
        realFact: "Paul Newman's Rolex Daytona sold for $17.8 million",
        bluffFact: "This Rolex was worn during 17 moon missions",
        realValue: 17800000,
    },
    {
        id: 10,
        name: "Sneakers",
        image: "👟",
        category: "fashion",
        realFact: "Nike Air Yeezy 1s sold for $1.8 million",
        bluffFact: "These sneakers are made from recycled airplane tires",
        realValue: 1800000,
    },

    // Weird & Unusual
    {
        id: 11,
        name: "Cheese Wheel",
        image: "🧀",
        category: "food",
        realFact: "A wheel of high-quality Parmigiano can sell for $2,500+",
        bluffFact: "This cheese was aged in a bank vault for security",
        realValue: 2500,
    },
    {
        id: 12,
        name: "Haunted Doll",
        image: "👻",
        category: "weird",
        realFact: "The 'haunted' doll Annabelle is kept in a special case at the Warrens' museum",
        bluffFact: "This doll blinks twice when someone lies nearby",
        realValue: 10000,
    },
    {
        id: 13,
        name: "Celebrity Hair",
        image: "💇",
        category: "celebrity",
        realFact: "A lock of Elvis Presley's hair sold for $115,000",
        bluffFact: "This hair sample contains traces of moonlight",
        realValue: 115000,
    },
    {
        id: 14,
        name: "Message in Bottle",
        image: "🍾",
        category: "historical",
        realFact: "The oldest message in a bottle was found after 132 years",
        bluffFact: "This message was written by a time traveler",
        realValue: 5000,
    },
    {
        id: 15,
        name: "Meteorite",
        image: "☄️",
        category: "space",
        realFact: "The Fukang meteorite sold for around $2 million",
        bluffFact: "This meteorite contains extraterrestrial DNA",
        realValue: 2000000,
    },
];

// Get random auction items
export const getRandomAuctionItems = (count = 5) => {
    const shuffled = [...AUCTION_ITEMS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get item by ID
export const getItemById = (id) => {
    return AUCTION_ITEMS.find(item => item.id === id);
};
