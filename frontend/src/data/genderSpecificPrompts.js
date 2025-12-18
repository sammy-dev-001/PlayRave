// Gender-specific prompts for Truth or Dare
// These prompts adapt based on the player's gender

export const getGenderSpecificPrompt = (basePrompt, playerGender) => {
    const genderSwaps = {
        // Naughty dares - gender-specific
        "Give someone here a lap dance for 30 seconds": {
            male: "Choose someone to give you a lap dance for 30 seconds",
            female: "Give someone here a lap dance for 30 seconds",
            other: "Give someone here a lap dance for 30 seconds"
        },
        "Let someone give you a hickey": {
            male: "Give someone a hickey or let them give you one",
            female: "Give someone a hickey or let them give you one",
            other: "Exchange hickeys with someone"
        },
        "Demonstrate your best kissing technique on your hand": {
            male: "Demonstrate your best kissing technique on your hand",
            female: "Demonstrate your best kissing technique on your hand",
            other: "Demonstrate your best kissing technique on your hand"
        },
        "Let someone lick whipped cream off your neck": {
            male: "Lick whipped cream off someone's neck",
            female: "Let someone lick whipped cream off your neck",
            other: "Exchange licking whipped cream off each other's necks"
        },
        "Give someone a sensual massage for 1 minute": {
            male: "Give someone a sensual massage for 1 minute",
            female: "Give someone a sensual massage for 1 minute",
            other: "Give someone a sensual massage for 1 minute"
        },
        "Let someone remove one piece of your clothing": {
            male: "Remove one piece of someone's clothing",
            female: "Let someone remove one piece of your clothing",
            other: "Exchange removing one piece of clothing"
        },

        // Spicy dares - gender-specific
        "Let someone feed you a piece of food sensually": {
            male: "Feed someone a piece of food sensually",
            female: "Let someone feed you a piece of food sensually",
            other: "Feed each other a piece of food sensually"
        },
        "Give someone a shoulder massage while making eye contact": {
            male: "Give someone a shoulder massage while making eye contact",
            female: "Receive a shoulder massage while making eye contact",
            other: "Exchange shoulder massages while making eye contact"
        },
        "Let someone apply lipstick on you": {
            male: "Apply lipstick on someone",
            female: "Let someone apply lipstick on you",
            other: "Apply lipstick on each other"
        },
        "Let someone smell your neck and describe your scent": {
            male: "Smell someone's neck and describe their scent",
            female: "Let someone smell your neck and describe your scent",
            other: "Smell each other's necks and describe the scents"
        },
        "Let someone trace their finger on your palm for 30 seconds": {
            male: "Trace your finger on someone's palm for 30 seconds",
            female: "Let someone trace their finger on your palm for 30 seconds",
            other: "Trace fingers on each other's palms for 30 seconds"
        },

        // New explicit dares - gender-specific
        "Give someone a handjob or receive one ": {
            male: "Receive a handjob",
            female: "Give someone a handjob",
            other: "Give or receive a handjob"
        },
        "Suck on someone's nipples for 10 seconds": {
            male: "Have someone suck your nipples for 10 seconds",
            female: "Suck on someone's nipples for 10 seconds",
            other: "Suck on someone's nipples for 10 seconds"
        },
        "Let someone finger you or finger them ": {
            male: "Finger someone",
            female: "Finger someone or let them finger you",
            other: "Finger each other"
        },
        "Give someone oral sex for 10 seconds ": {
            male: "Receive oral sex for 10 seconds",
            female: "Give someone oral sex for 10 seconds ",
            other: "Give or receive oral sex for 10 seconds "
        },
        "Receive a blowjob or give one ": {
            male: "Receive a blowjob",
            female: "Give someone a blowjob",
            other: "Give or receive a blowjob"
        },
        "Grind on someone's lap until they get turned on": {
            male: "Have someone grind on your lap until you get turned on",
            female: "Grind on someone's lap until they get turned on",
            other: "Grind on someone's lap until they get turned on"
        }
    };

    // Check if this prompt has gender-specific versions
    if (genderSwaps[basePrompt]) {
        return genderSwaps[basePrompt][playerGender] || basePrompt;
    }

    return basePrompt;
};

export default getGenderSpecificPrompt;
