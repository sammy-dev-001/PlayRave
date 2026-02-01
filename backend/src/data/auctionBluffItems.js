const AUCTION_BLUFF_ITEMS = [
    {
        id: 'ab_001',
        name: 'The Eiffel Tower',
        description: 'Original iron structure from Paris.',
        realFact: 'It was originally intended to be a temporary structure for the 1889 World Fair.',
        fakeFact: 'It was designed to be easily disassembled and moved to Berlin.',
        baseValue: 1000
    },
    {
        id: 'ab_002',
        name: 'First Light Bulb',
        description: 'Thomas Edison\'s prototype.',
        realFact: 'It used a carbonized bamboo filament.',
        fakeFact: 'It burned for 48 hours straight before exploding.',
        baseValue: 500
    },
    {
        id: 'ab_003',
        name: 'Mona Lisa',
        description: 'Famous portrait by Da Vinci.',
        realFact: 'It was stolen in 1911 by an Italian handyman who wanted to return it to Italy.',
        fakeFact: 'It was originally painted with a frown, but Da Vinci changed it last minute.',
        baseValue: 5000
    },
    {
        id: 'ab_004',
        name: 'Moon Rock',
        description: 'Collected during Apollo 11 mission.',
        realFact: 'It is illegal for private citizens to own valid Apollo moon rocks.',
        fakeFact: 'It glows faintly in total darkness due to radiation.',
        baseValue: 3000
    },
    {
        id: 'ab_005',
        name: 'Titanic Violin',
        description: 'played as the ship sank.',
        realFact: 'It sold at auction for $1.7 million in 2013.',
        fakeFact: 'It was found perfectly preserved inside a watertight suitcase.',
        baseValue: 2000
    },
    {
        id: 'ab_006',
        name: 'Einstein\'s Brain',
        description: 'Preserved sample.',
        realFact: 'It was stolen by the pathologist who performed his autopsy.',
        fakeFact: 'It weighed 20% more than the average human brain.',
        baseValue: 4000
    },
    {
        id: 'ab_007',
        name: 'The Hope Diamond',
        description: 'Cursed blue diamond.',
        realFact: 'It glows red under ultraviolet light.',
        fakeFact: 'It was once owned by Napoleon Bonaparte.',
        baseValue: 6000
    },
    {
        id: 'ab_008',
        name: 'First Apple Computer',
        description: 'Apple-1 built by Wozniak.',
        realFact: 'It sold for $666.66.',
        fakeFact: 'It came with a wooden keyboard.',
        baseValue: 1500
    }
];

const getRandomAuctionItems = (count = 5) => {
    const shuffled = [...AUCTION_BLUFF_ITEMS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

module.exports = {
    AUCTION_BLUFF_ITEMS,
    getRandomAuctionItems
};
