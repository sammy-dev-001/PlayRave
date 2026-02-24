// Auction Bluff - Nigerian-themed items for bidding with real and fake facts
// Players vote REAL or BLUFF, then bid. Correct guessers get bonus points!

export const AUCTION_ITEMS = [
    // Nigerian Culture & History
    {
        id: 1,
        name: "Fela's Saxophone",
        image: "🎷",
        category: "music",
        realFact: "Fela Kuti's original saxophone was kept at the Kalakuta Museum in Lagos after his death in 1997",
        bluffFact: "Fela once played his saxophone non-stop for 72 hours to protest military rule",
        realValue: 50000000,
    },
    {
        id: 2,
        name: "Benin Bronze",
        image: "🗿",
        category: "art",
        realFact: "Over 900 Benin Bronzes were looted by British soldiers in 1897 and are now being returned to Nigeria",
        bluffFact: "Benin Bronzes were originally painted in gold before being melted and recast by the British",
        realValue: 120000000,
    },
    {
        id: 3,
        name: "Dangote's First Business Card",
        image: "💼",
        category: "business",
        realFact: "Aliko Dangote started his business at age 21 with a ₦500,000 loan from his uncle",
        bluffFact: "Dangote's first business was selling designer shoes imported from Italy",
        realValue: 25000000,
    },
    {
        id: 4,
        name: "Vintage Star Lager",
        image: "🍺",
        category: "collectible",
        realFact: "Star Lager Beer was first brewed in Nigeria in 1949 by Nigerian Breweries",
        bluffFact: "The original Star Lager recipe included palm wine as a secret ingredient",
        realValue: 500000,
    },
    {
        id: 5,
        name: "Wole Soyinka's Nobel Medal",
        image: "🏅",
        category: "literature",
        realFact: "Wole Soyinka became the first African to win the Nobel Prize in Literature in 1986",
        bluffFact: "Soyinka donated his Nobel medal to the University of Ibadan library where anyone can hold it",
        realValue: 200000000,
    },

    // Nigerian Pop Culture
    {
        id: 6,
        name: "Wizkid's Grammy Jacket",
        image: "🧥",
        category: "music",
        realFact: "Wizkid won his first Grammy in 2022 for his collaboration on 'Brown Skin Girl' with Beyoncé",
        bluffFact: "Wizkid wore a jacket made entirely of Ankara fabric to the Grammy Awards ceremony",
        realValue: 30000000,
    },
    {
        id: 7,
        name: "Original Nollywood Script",
        image: "🎬",
        category: "entertainment",
        realFact: "Living in Bondage (1992) is widely regarded as the first Nollywood film and was shot on a budget of about ₦1 million",
        bluffFact: "The original Living in Bondage script was written in Yoruba before being translated to Igbo",
        realValue: 15000000,
    },
    {
        id: 8,
        name: "Burna Boy's Chain",
        image: "⛓️",
        category: "music",
        realFact: "Burna Boy's 'African Giant' album was nominated for a Grammy in 2020 and he won in 2021 with 'Twice As Tall'",
        bluffFact: "Burna Boy's signature gold chain weighs 3kg and contains a piece of meteorite",
        realValue: 45000000,
    },
    {
        id: 9,
        name: "Super Eagles '94 Jersey",
        image: "🦅",
        category: "sports",
        realFact: "Nigeria's Super Eagles qualified for their first FIFA World Cup in 1994 in the USA",
        bluffFact: "The 1994 Super Eagles jersey was designed by a 16-year-old art student from Benin City",
        realValue: 8000000,
    },
    {
        id: 10,
        name: "Agbada of a King",
        image: "👑",
        category: "fashion",
        realFact: "The Ooni of Ife's beaded crown called the Adé is believed to date back centuries to Oduduwa",
        bluffFact: "Royal Agbadas were traditionally sewn using thread made from silkworm farms in Osogbo",
        realValue: 75000000,
    },

    // Nigerian Food & Lifestyle
    {
        id: 11,
        name: "Mama Put's Secret Recipe",
        image: "🍲",
        category: "food",
        realFact: "Jollof rice is a subject of fierce rivalry between Nigeria and Ghana, with both countries claiming the best version",
        bluffFact: "A famous Mama Put in Lagos once served jollof rice to Queen Elizabeth II during her 1956 visit",
        realValue: 2000000,
    },
    {
        id: 12,
        name: "Aso Oke Fabric Roll",
        image: "🧵",
        category: "fashion",
        realFact: "Aso Oke is a hand-loomed cloth woven by the Yoruba people of western Nigeria for centuries",
        bluffFact: "The most expensive Aso Oke ever made was woven with 24-karat gold thread for a senator's wedding",
        realValue: 3000000,
    },
    {
        id: 13,
        name: "Ofada Rice Bag (1970)",
        image: "🌾",
        category: "food",
        realFact: "Ofada rice is a locally grown Nigerian rice variety named after the town of Ofada in Ogun State",
        bluffFact: "During the civil war, a single bag of Ofada rice was traded for a plot of land in Abeokuta",
        realValue: 1500000,
    },
    {
        id: 14,
        name: "Chinua Achebe's Pen",
        image: "🖊️",
        category: "literature",
        realFact: "Chinua Achebe's 'Things Fall Apart' has sold over 20 million copies and been translated into 50+ languages",
        bluffFact: "Achebe wrote the entire first draft of Things Fall Apart in just 12 days using this pen",
        realValue: 35000000,
    },
    {
        id: 15,
        name: "Ijebu Garri Sack (1960)",
        image: "🥣",
        category: "food",
        realFact: "Nigeria is the world's largest producer of cassava, producing about 60 million tonnes annually",
        bluffFact: "Ijebu garri was originally developed as military rations during the Kiriji War of 1877",
        realValue: 500000,
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
