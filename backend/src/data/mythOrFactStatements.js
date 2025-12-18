const mythOrFactStatements = [
    // History
    {
        statement: "The Great Wall of China is visible from space with the naked eye",
        answer: false,
        category: "History",
        explanation: "This is a myth. The Great Wall is not visible from space with the naked eye. Astronauts have confirmed this."
    },
    {
        statement: "Napoleon Bonaparte was actually of average height for his time",
        answer: true,
        category: "History",
        explanation: "This is a fact! Napoleon was about 5'7\", which was average for French men in the 1800s. British propaganda exaggerated his short stature."
    },
    {
        statement: "Vikings wore horned helmets in battle",
        answer: false,
        category: "History",
        explanation: "This is a myth. There's no historical evidence Vikings wore horned helmets. This image came from 19th-century romanticized depictions."
    },
    {
        statement: "Cleopatra was Egyptian",
        answer: false,
        category: "History",
        explanation: "This is a myth. Cleopatra was actually Greek, descended from Ptolemy I, one of Alexander the Great's generals."
    },
    {
        statement: "The first email was sent in 1971",
        answer: true,
        category: "History",
        explanation: "This is a fact! Ray Tomlinson sent the first email in 1971 using the @ symbol to separate user name from computer name."
    },

    // Science
    {
        statement: "Humans only use 10% of their brain",
        answer: false,
        category: "Science",
        explanation: "This is a myth. Brain imaging shows that we use virtually all parts of our brain, and most of the brain is active almost all the time."
    },
    {
        statement: "Lightning never strikes the same place twice",
        answer: false,
        category: "Science",
        explanation: "This is a myth. Lightning can and does strike the same place multiple times. The Empire State Building is struck about 25 times per year."
    },
    {
        statement: "Water conducts electricity",
        answer: false,
        category: "Science",
        explanation: "This is a myth. Pure water is actually a poor conductor. It's the minerals and impurities in water that conduct electricity."
    },
    {
        statement: "Diamonds are formed from compressed coal",
        answer: false,
        category: "Science",
        explanation: "This is a myth. Diamonds form from carbon under extreme pressure deep in Earth's mantle, not from coal."
    },
    {
        statement: "The human body has more bacterial cells than human cells",
        answer: true,
        category: "Science",
        explanation: "This is a fact! The human microbiome contains trillions of bacteria, outnumbering human cells by about 10 to 1."
    },
    {
        statement: "Sound travels faster in water than in air",
        answer: true,
        category: "Science",
        explanation: "This is a fact! Sound travels about 4 times faster in water than in air because water molecules are closer together."
    },

    // Nature
    {
        statement: "Goldfish have a 3-second memory",
        answer: false,
        category: "Nature",
        explanation: "This is a myth. Studies show goldfish can remember things for at least 3 months and can be trained to recognize shapes and colors."
    },
    {
        statement: "Bats are blind",
        answer: false,
        category: "Nature",
        explanation: "This is a myth. All bat species can see, and some have excellent vision. They use echolocation in addition to sight."
    },
    {
        statement: "Sharks must keep swimming or they will die",
        answer: false,
        category: "Nature",
        explanation: "This is a myth for most sharks. While some species need to swim continuously, many can rest on the ocean floor."
    },
    {
        statement: "Honey never spoils",
        answer: true,
        category: "Nature",
        explanation: "This is a fact! Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible. Its low moisture and acidic pH prevent bacterial growth."
    },
    {
        statement: "Chameleons change color primarily for camouflage",
        answer: false,
        category: "Nature",
        explanation: "This is a myth. Chameleons change color mainly to communicate emotions, regulate temperature, and attract mates, not primarily for camouflage."
    },
    {
        statement: "Bananas are berries, but strawberries are not",
        answer: true,
        category: "Nature",
        explanation: "This is a fact! Botanically, bananas are berries because they develop from a single flower with one ovary. Strawberries are not true berries."
    },

    // Technology
    {
        statement: "The first computer mouse was made of wood",
        answer: true,
        category: "Technology",
        explanation: "This is a fact! Douglas Engelbart's first mouse prototype in 1964 had a wooden shell."
    },
    {
        statement: "More people have mobile phones than toilets",
        answer: true,
        category: "Technology",
        explanation: "This is a fact! According to UN data, more people worldwide have access to mobile phones than to proper sanitation facilities."
    },
    {
        statement: "The first webcam was used to monitor a coffee pot",
        answer: true,
        category: "Technology",
        explanation: "This is a fact! In 1991, Cambridge University researchers set up a webcam to check if the coffee pot was full without leaving their desks."
    },
    {
        statement: "Incognito mode makes you completely anonymous online",
        answer: false,
        category: "Technology",
        explanation: "This is a myth. Incognito mode only prevents your browser from saving history. Your ISP, employer, and websites can still track you."
    },

    // General Knowledge
    {
        statement: "Mount Everest is the tallest mountain on Earth",
        answer: false,
        category: "General Knowledge",
        explanation: "This is a myth if measured from base to peak. Mauna Kea in Hawaii is taller (33,500 ft from ocean floor vs Everest's 29,032 ft above sea level)."
    },
    {
        statement: "The Eiffel Tower can be 15 cm taller during summer",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! The iron structure expands in the heat, making the tower grow up to 15 cm taller in summer."
    },
    {
        statement: "Fortune cookies originated in China",
        answer: false,
        category: "General Knowledge",
        explanation: "This is a myth. Fortune cookies were invented in California in the early 1900s, likely by Japanese immigrants."
    },
    {
        statement: "A day on Venus is longer than a year on Venus",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! Venus takes 243 Earth days to rotate once but only 225 Earth days to orbit the Sun."
    },
    {
        statement: "Penguins live at the North Pole",
        answer: false,
        category: "General Knowledge",
        explanation: "This is a myth. Penguins are only found in the Southern Hemisphere, primarily in Antarctica. Polar bears live at the North Pole."
    },
    {
        statement: "The shortest war in history lasted 38 minutes",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! The Anglo-Zanzibar War of 1896 lasted between 38 and 45 minutes, making it the shortest war in recorded history."
    },
    {
        statement: "Coca-Cola was originally green",
        answer: false,
        category: "General Knowledge",
        explanation: "This is a myth. Coca-Cola has always been brown/caramel colored due to its ingredients. It was never green."
    },
    {
        statement: "A group of flamingos is called a 'flamboyance'",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! The collective noun for flamingos is indeed 'flamboyance', though they can also be called a 'stand' or 'colony'."
    },
    {
        statement: "Humans share 50% of their DNA with bananas",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! Humans share about 50% of their DNA with bananas because we share common ancestry and many basic cellular functions."
    },
    {
        statement: "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years",
        answer: true,
        category: "General Knowledge",
        explanation: "This is a fact! Built around 2560 BC at 146.5 meters, it remained the tallest until Lincoln Cathedral in 1311 AD."
    }
];

function getRandomStatements(count = 5) {
    const shuffled = [...mythOrFactStatements].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, mythOrFactStatements.length));
}

module.exports = { mythOrFactStatements, getRandomStatements };
