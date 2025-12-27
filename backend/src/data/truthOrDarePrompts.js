// Truth or Dare prompts organized by category
const truthOrDarePrompts = {
    normal: {
        truths: [
            "What's the most embarrassing thing you've ever done?",
            "Who was your first crush?",
            "What's your biggest fear?",
            "What's the worst date you've ever been on?",
            "What's the most childish thing you still do?",
            "What's your most embarrassing nickname?",
            "What's the worst gift you've ever received?",
            "What's your guilty pleasure?",
            "Have you ever pretended to be sick to skip work/school?",
            "What's the weirdest dream you've ever had?",
            "What's your biggest insecurity?",
            "What's the worst haircut you've ever had?",
            "Have you ever laughed at an inappropriate time?",
            "What's something you're terrible at but pretend to be good at?",
            "What's the longest you've worn the same outfit?",
            "Have you ever cried because of a movie?",
            "What's the worst advice you've ever given?",
            "What's your most irrational fear?",
            "What's the most expensive thing you've broken?",
            "Have you ever regifted something?",
            "What's your most embarrassing childhood memory?",
            "Have you ever talked to yourself in public?",
            "What's the strangest food combination you enjoy?",
            "Have you ever forgotten someone's name right after meeting them?",
            "What's your biggest pet peeve?",
            "Have you ever accidentally sent a message to the wrong person?",
            "What's the most embarrassing thing in your room?",
            "Have you ever pretended to know something you didn't?",
            "What's your worst habit?",
            "Have you ever been caught singing in the shower?"
        ],
        dares: [
            "Do 20 pushups right now",
            "Do your best impression of someone in the room",
            "Dance with no music for 1 minute",
            "Do 10 burpees",
            "Do the worm",
            "Do your best celebrity impression",
            "Plank for 1 minute",
            "Do a cartwheel (or attempt one)",
            "Do 20 jumping jacks",
            "Moonwalk across the room",
            "Do a handstand against the wall for 30 seconds",
            "Do the chicken dance",
            "Yell out the window 'I love pizza!'",
            "Do 15 squats",
            "Do your best runway walk",
            "Sing the alphabet backwards",
            "Do a trust fall",
            "Do the macarena",
            "Do 10 lunges",
            "Do a silly walk across the room",
            "Balance a spoon on your nose for 30 seconds",
            "Do your best robot dance",
            "Hop on one foot for 1 minute",
            "Do 5 cartwheels in a row",
            "Spin around 10 times and walk in a straight line",
            "Do the splits (or attempt)",
            "Act like a monkey for 1 minute",
            "Do your best opera singing",
            "Walk backwards for the next 2 rounds",
            "Do 25 jumping jacks while singing"
        ]
    },
    spicy: {
        truths: [
            "What's the most attractive thing about someone in this room?",
            "Have you ever had a crush on someone here?",
            "What's the sexiest thing someone has done to you?",
            "Have you ever skinny dipped?",
            "What's your biggest turn-off in bed?",
            "Have you ever made out with someone within 24 hours of meeting them?",
            "What's the most risqué photo you've ever taken?",
            "Have you ever had a friends-with-benefits situation?",
            "What's your most embarrassing romantic encounter?",
            "Have you ever been attracted to someone of the same sex?",
            "What's the most public place you've made out with someone?",
            "Have you ever sent a flirty text to the wrong person?",
            "What's your secret romantic desire?",
            "Have you ever hooked up with an ex after breaking up?",
            "What's the most romantic thing you've done for someone?",
            "Have you ever been caught in a compromising position?",
            "What's your ideal type physically?",
            "Have you ever dated two people at once?",
            "What's the most you've done on a first date?",
            "Have you ever had a dream about someone here?",
            "What's the longest you've gone on a date?",
            "Have you ever kissed someone to make someone else jealous?",
            "What's your biggest romantic fantasy?",
            "Have you ever had a crush on a friend's sibling?",
            "What's the most flirtatious thing you've done?",
            "Have you ever been in a love triangle?",
            "What's your favorite physical feature on yourself?",
            "Have you ever had feelings for someone taken?",
            "What's the most intimate thing you've done in public?",
            "Have you ever fantasized about someone in this room?",
            "What's your biggest regret in a relationship?",
            "Have you ever cheated or been cheated on?",
            "What's the craziest thing you've done to impress someone?",
            "Have you ever stalked someone on social media?",
            "What's the longest you've gone without kissing someone?",
            "Have you ever been rejected? How did you handle it?",
            "What's the most awkward date you've been on?",
            "Have you ever ghosted someone?",
            "What's your love language?",
            "Have you ever lied to get out of a date?",
            "What's your guilty pleasure when it comes to romance?",
            "Have you ever fallen for someone you shouldn't have?",
            "What's the most spontaneous romantic thing you've done?",
            "Have you ever written a love letter?",
            "What's the weirdest thing that turns you on?"
        ],
        dares: [
            "Slow dance with someone for 1 minute",
            "Give someone a passionate hug for 10 seconds",
            "Whisper your biggest secret in someone's ear",
            "Let someone feed you a piece of food sensually",
            "Stare into someone's eyes for 30 seconds without laughing",
            "Give someone a shoulder massage while making eye contact",
            "Let the group vote on who you should compliment",
            "Describe your perfect date night in detail",
            "Show everyone your most flirty text conversation",
            "Do 7 minutes in heaven with someone (just talking)",
            "Let someone apply lipstick on you",
            "Recreate your best pickup line on someone",
            "Sit next to someone for the next 2 rounds",
            "Let someone smell your neck and describe your scent",
            "Exchange a piece of clothing with someone",
            "Give someone a compliment that makes them blush",
            "Let the group choose two people to slow dance",
            "Describe your last romantic dream",
            "Let someone trace their finger on your palm for 30 seconds",
            "Tell someone here what you find most attractive about them",
            "Serenade someone with a love song",
            "Give someone a foot massage",
            "Let someone play with your hair for 1 minute",
            "Whisper something romantic in someone's ear",
            "Hold hands with someone for the next 3 rounds",
            "Give someone a piggyback ride around the room",
            "Let someone choose a romantic nickname for you",
            "Describe your ideal kiss",
            "Let someone draw a heart on your cheek",
            "Cuddle with someone for 2 minutes",
            "Do your sexiest walk across the room",
            "Let someone feed you chocolate seductively",
            "Act out how you flirt with someone you like",
            "Let someone give you a back hug for 30 seconds",
            "Bite your lip seductively while looking at someone",
            "Let someone whisper compliments in your ear for 30 seconds",
            "Pose for a romantic photo with someone",
            "Do a romantic scene from a movie with someone",
            "Let someone lead you around blindfolded for 1 minute",
            "Give someone butterfly kisses on their cheek"
        ]
    },
    naughty: {
        truths: [
            "What's your biggest fantasy?",
            "Have you ever had a one-night stand?",
            "What's the wildest place you've ever been intimate?",
            "Have you ever sent intimate photos to someone?",
            "What's your body count?",
            "Have you ever been walked in on during an intimate moment?",
            "What's the kinkiest thing you've ever done?",
            "Have you ever been intimate in public?",
            "What's your favorite position?",
            "What's the longest you've gone without intimacy?",
            "Have you ever had a threesome or would you?",
            "What's your biggest turn-on?",
            "Have you ever role-played?",
            "What's the most embarrassing thing that's happened during intimacy?",
            "Have you ever faked enjoyment?",
            "What's your go-to move?",
            "What's the most adventurous thing you've done intimately?",
            "Have you ever hooked up with someone here?",
            "What's your favorite toy?",
            "Have you ever had phone intimacy?",
            "What's the longest intimate session you've had?",
            "Have you ever tried BDSM?",
            "What's your dirtiest thought right now?",
            "Have you ever been intimate with someone you just met?",
            "What's the most people you've been intimate with in one week?",
            "Have you ever had an intimate experience with the same gender?",
            "What's your favorite place to be touched?",
            "Have you ever recorded yourself being intimate?",
            "What's your most secret kink?",
            "Have you ever been intimate while someone else was in the room?",
            "What's the fastest you've gone from meeting someone to being intimate?",
            "Have you ever been attracted to a friend's partner?",
            "What's the dirtiest thing you've ever said during intimacy?",
            "Have you ever had an intimate dream about a celebrity?",
            "What's something you want to try but haven't?",
            "Have you ever sexted in a public place?",
            "What's the most partners you've had in one day?",
            "Have you ever used food during intimacy?",
            "What's your opinion on friends with benefits?",
            "What's your favorite type of foreplay?",
            "What's the oldest/youngest person you've been with?"
        ],
        dares: [
            "Give someone here a lap dance for 30 seconds",
            "Kiss the person to your left on the cheek",
            "Send a flirty text to your crush right now",
            "Do a sexy dance for 1 minute",
            "Remove one piece of clothing",
            "Whisper something dirty in someone's ear",
            "Demonstrate your best kissing technique on your hand",
            "Describe your ideal one-night stand",
            "Show the group your most attractive photo",
            "Let someone of the group's choice sit next to you for 2 rounds",
            "Make out with your hand for 10 seconds",
            "Tell everyone your dirtiest secret",
            "Let the group go through your dating app messages",
            "Make your most attractive face",
            "Give someone a sensual massage for 1 minute",
            "Dirty talk to an imaginary person for 30 seconds",
            "Let someone give you a neck massage",
            "Grind on a pillow for 30 seconds",
            "Kiss someone's neck for 5 seconds",
            "Let someone run their hands through your hair sensually",
            "Let someone whisper their fantasy in your ear",
            "Let someone blindfold you and touch your face",
            "Remove your socks with your teeth",
            "Let someone give you a hickey anywhere they choose",
            "Moan like you're enjoying yourself",
            "Let someone pour ice down your shirt",
            "Do your best strip tease (keep clothes on)",
            "Let someone draw on your body with their finger",
            "Kiss someone on the cheek for 5 seconds",
            "Let someone take a body shot off you",
            "Demonstrate your favorite position with a pillow",
            "Let someone blindfold you and kiss your hand",
            "Send a flirty message to the last person you texted"
        ]
    }
};

const getRandomTruth = (category = 'normal', usedTruths = []) => {
    // Handle mixed category - randomly pick from all categories
    let effectiveCategory = category;
    if (category === 'mixed') {
        const categories = ['normal', 'spicy', 'naughty'];
        effectiveCategory = categories[Math.floor(Math.random() * categories.length)];
    }

    const categoryTruths = truthOrDarePrompts[effectiveCategory]?.truths || truthOrDarePrompts.normal.truths;
    const availableTruths = categoryTruths.filter(truth => !usedTruths.includes(truth));

    // Reset if all used
    if (availableTruths.length === 0) {
        return categoryTruths[Math.floor(Math.random() * categoryTruths.length)];
    }

    return availableTruths[Math.floor(Math.random() * availableTruths.length)];
};

const getRandomDare = (category = 'normal', usedDares = []) => {
    // Handle mixed category - randomly pick from all categories
    let effectiveCategory = category;
    if (category === 'mixed') {
        const categories = ['normal', 'spicy', 'naughty'];
        effectiveCategory = categories[Math.floor(Math.random() * categories.length)];
    }

    const categoryDares = truthOrDarePrompts[effectiveCategory]?.dares || truthOrDarePrompts.normal.dares;
    const availableDares = categoryDares.filter(dare => !usedDares.includes(dare));

    // Reset if all used
    if (availableDares.length === 0) {
        return categoryDares[Math.floor(Math.random() * categoryDares.length)];
    }

    return availableDares[Math.floor(Math.random() * availableDares.length)];
};

module.exports = {
    truthOrDarePrompts,
    getRandomTruth,
    getRandomDare
};
