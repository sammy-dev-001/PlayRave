// Would You Rather questions for local party mode
const wouldYouRatherQuestions = [
    {
        "id": 1,
        "optionA": "Have the ability to fly",
        "optionB": "Have the ability to be invisible"
    },
    {
        "id": 2,
        "optionA": "Live without music",
        "optionB": "Live without movies"
    },
    {
        "id": 3,
        "optionA": "Always be 10 minutes late",
        "optionB": "Always be 20 minutes early"
    },
    {
        "id": 4,
        "optionA": "Have unlimited money",
        "optionB": "Have unlimited free time"
    },
    {
        "id": 5,
        "optionA": "Know how you die",
        "optionB": "Know when you die"
    },
    {
        "id": 6,
        "optionA": "Be able to read minds",
        "optionB": "Be able to see the future"
    },
    {
        "id": 7,
        "optionA": "Live in the past",
        "optionB": "Live in the future"
    },
    {
        "id": 8,
        "optionA": "Never use social media again",
        "optionB": "Never watch TV/movies again"
    },
    {
        "id": 9,
        "optionA": "Have a rewind button for life",
        "optionB": "Have a pause button for life"
    },
    {
        "id": 10,
        "optionA": "Be famous but poor",
        "optionB": "Be rich but unknown"
    },
    {
        "id": 11,
        "optionA": "Fight 100 duck-sized horses",
        "optionB": "Fight 1 horse-sized duck"
    },
    {
        "id": 12,
        "optionA": "Never eat your favorite food again",
        "optionB": "Only eat your favorite food"
    },
    {
        "id": 13,
        "optionA": "Lose all your memories",
        "optionB": "Never make new memories"
    },
    {
        "id": 14,
        "optionA": "Be stuck on a broken ski lift",
        "optionB": "Be stuck in a broken elevator"
    },
    {
        "id": 15,
        "optionA": "Have no internet",
        "optionB": "Have no phone"
    },
    {
        "id": 16,
        "optionA": "Always say what you think",
        "optionB": "Never speak again"
    },
    {
        "id": 17,
        "optionA": "Live without heating",
        "optionB": "Live without AC"
    },
    {
        "id": 18,
        "optionA": "Be the funniest person",
        "optionB": "Be the smartest person"
    },
    {
        "id": 19,
        "optionA": "Have a personal chef",
        "optionB": "Have a personal driver"
    },
    {
        "id": 20,
        "optionA": "Never be able to lie",
        "optionB": "Never be able to tell the truth"
    },
    {
        "id": 21,
        "optionA": "Live in a world with no problems",
        "optionB": "Live in a world with no rules"
    },
    {
        "id": 22,
        "optionA": "Have a photographic memory",
        "optionB": "Have perfect intuition"
    },
    {
        "id": 23,
        "optionA": "Be able to talk to animals",
        "optionB": "Be able to speak all languages"
    },
    {
        "id": 24,
        "optionA": "Never have to sleep",
        "optionB": "Never have to eat"
    },
    {
        "id": 25,
        "optionA": "Live in a treehouse",
        "optionB": "Live on a boat"
    },
    {
        "id": 26,
        "optionA": "Have a third arm",
        "optionB": "Have a third eye"
    },
    {
        "id": 27,
        "optionA": "Be allergic to chocolate",
        "optionB": "Be allergic to pizza"
    },
    {
        "id": 28,
        "optionA": "Have a time machine",
        "optionB": "Have a teleporter"
    },
    {
        "id": 29,
        "optionA": "Never age physically",
        "optionB": "Never age mentally"
    },
    {
        "id": 30,
        "optionA": "Be trapped in a romantic comedy",
        "optionB": "Be trapped in a horror movie"
    },
    {
        "id": 31,
        "optionA": "Have everyone you know read your thoughts for a day",
        "optionB": "Have everyone you know read your diary"
    },
    {
        "id": 32,
        "optionA": "Be able to control fire",
        "optionB": "Be able to control water"
    },
    {
        "id": 33,
        "optionA": "Live without coffee",
        "optionB": "Live without alcohol"
    },
    {
        "id": 34,
        "optionA": "Have a pet dragon",
        "optionB": "Have a pet unicorn"
    },
    {
        "id": 35,
        "optionA": "Be the best player on a losing team",
        "optionB": "Be the worst player on a winning team"
    },
    {
        "id": 36,
        "optionA": "Have unlimited battery life on all devices",
        "optionB": "Have free WiFi everywhere"
    },
    {
        "id": 37,
        "optionA": "Be able to change the past",
        "optionB": "Be able to see the future"
    },
    {
        "id": 38,
        "optionA": "Live in a world without music",
        "optionB": "Live in a world without color"
    },
    {
        "id": 39,
        "optionA": "Have a personal masseuse",
        "optionB": "Have a personal trainer"
    },
    {
        "id": 40,
        "optionA": "Be able to breathe underwater",
        "optionB": "Be able to fly"
    },
    {
        "id": 41,
        "optionA": "Have a horrible job but make millions",
        "optionB": "Have your dream job but barely make ends meet"
    },
    {
        "id": 42,
        "optionA": "Be stuck in traffic for 2 hours",
        "optionB": "Be stuck in a waiting room for 2 hours"
    },
    {
        "id": 43,
        "optionA": "Have a photographic memory of everything you read",
        "optionB": "Have a photographic memory of everything you see"
    },
    {
        "id": 44,
        "optionA": "Be able to eat anything without gaining weight",
        "optionB": "Need only 2 hours of sleep per night"
    },
    {
        "id": 45,
        "optionA": "Have a mansion in the middle of nowhere",
        "optionB": "Have a small apartment in the city center"
    },
    {
        "id": 46,
        "optionA": "Be famous on TikTok",
        "optionB": "Be famous on Instagram"
    },
    {
        "id": 47,
        "optionA": "Have a pause button for your life",
        "optionB": "Have a fast-forward button for your life"
    },
    {
        "id": 48,
        "optionA": "Be able to control technology with your mind",
        "optionB": "Be able to control people with your mind"
    },
    {
        "id": 49,
        "optionA": "Live in a world where everyone tells the truth",
        "optionB": "Live in a world where everyone lies"
    },
    {
        "id": 50,
        "optionA": "Have a clone of yourself",
        "optionB": "Have a robot assistant"
    },
    {
        "id": 51,
        "optionA": "Be able to control the weather",
        "optionB": "Be able to control traffic"
    },
    {
        "id": 52,
        "optionA": "Never have to do laundry again",
        "optionB": "Never have to do dishes again"
    },
    {
        "id": 53,
        "optionA": "Have a pause button in your life",
        "optionB": "Have a rewind button in your life"
    },
    {
        "id": 54,
        "optionA": "Lose your keys every day",
        "optionB": "Lose your phone every day"
    },
    {
        "id": 55,
        "optionA": "Live in a house made of candy",
        "optionB": "Live in a house made of clouds"
    },
    {
        "id": 56,
        "optionA": "Be able to change your appearance at will",
        "optionB": "Be able to change your personality at will"
    },
    {
        "id": 57,
        "optionA": "Have the power of flight",
        "optionB": "Have the power of teleportation"
    },
    {
        "id": 58,
        "optionA": "Always be dressed for winter in summer",
        "optionB": "Always be dressed for summer in winter"
    },
    {
        "id": 59,
        "optionA": "Be a famous rock star",
        "optionB": "Be a famous scientist"
    },
    {
        "id": 60,
        "optionA": "Have unlimited free travel",
        "optionB": "Have unlimited free food"
    },
    {
        "id": 61,
        "optionA": "Be able to breathe underwater",
        "optionB": "Be able to survive in space"
    },
    {
        "id": 62,
        "optionA": "Have a tail",
        "optionB": "Have wings"
    },
    {
        "id": 63,
        "optionA": "Always feel like you have to sneeze",
        "optionB": "Always have a hidden itch"
    },
    {
        "id": 64,
        "optionA": "Live in a world without internet",
        "optionB": "Live in a world without music"
    },
    {
        "id": 65,
        "optionA": "Be the smartest person in the room",
        "optionB": "Be the funniest person in the room"
    },
    {
        "id": 66,
        "optionA": "Never get stuck in traffic",
        "optionB": "Never get a cold"
    },
    {
        "id": 67,
        "optionA": "Have to sing everything you say",
        "optionB": "Have to dance every time you walk"
    },
    {
        "id": 68,
        "optionA": "Be able to see ghosts",
        "optionB": "Be able to see aliens"
    },
    {
        "id": 69,
        "optionA": "Always know when someone is lying",
        "optionB": "Always get away with lying"
    },
    {
        "id": 70,
        "optionA": "Be a master of every musical instrument",
        "optionB": "Be fluent in every language"
    },
    {
        "id": 71,
        "optionA": "Have everyone hear your thoughts",
        "optionB": "Have everyone see your search history"
    },
    {
        "id": 72,
        "optionA": "Always have to say everything on your mind out loud",
        "optionB": "Never be able to speak again"
    },
    {
        "id": 73,
        "optionA": "Have a personal chef for life",
        "optionB": "Have a personal masseuse for life"
    },
    {
        "id": 74,
        "optionA": "Never have to sleep again with zero fatigue",
        "optionB": "Never have to work again with unlimited income"
    },
    {
        "id": 75,
        "optionA": "Be able to talk to animals",
        "optionB": "Speak every human language fluently"
    },
    {
        "id": 76,
        "optionA": "Live in a treehouse in the rainforest",
        "optionB": "Live in an underwater penthouse in the ocean"
    },
    {
        "id": 77,
        "optionA": "Always feel like you need to sneeze but never can",
        "optionB": "Always have an annoying itch you can't reach"
    },
    {
        "id": 78,
        "optionA": "Lose all your past memories",
        "optionB": "Never be able to make new memories"
    },
    {
        "id": 79,
        "optionA": "Be the smartest person in the world",
        "optionB": "Be the most attractive person in the world"
    },
    {
        "id": 80,
        "optionA": "Have a pause button for your life",
        "optionB": "Have a fast-forward button for boring moments"
    },
    {
        "id": 81,
        "optionA": "Always smell like fresh baked cookies",
        "optionB": "Always smell like a tropical ocean breeze"
    },
    {
        "id": 82,
        "optionA": "Be stranded on a luxury deserted island alone",
        "optionB": "Be stranded in a crowded haunted mansion with friends"
    },
    {
        "id": 83,
        "optionA": "Never be able to wear shoes again",
        "optionB": "Never be able to wear pants again"
    },
    {
        "id": 84,
        "optionA": "Find true love today",
        "optionB": "Win $50 million today"
    },
    {
        "id": 85,
        "optionA": "Have fingers as long as your legs",
        "optionB": "Have legs as short as your fingers"
    },
    {
        "id": 86,
        "optionA": "Eat only spicy food for the rest of your life",
        "optionB": "Eat only sweet food for the rest of your life"
    },
    {
        "id": 87,
        "optionA": "Be covered in fur like a bear",
        "optionB": "Be covered in scales like a lizard"
    },
    {
        "id": 88,
        "optionA": "Have your dream job with minimum wage",
        "optionB": "Have a horrible boring job with a $500,000 salary"
    },
    {
        "id": 89,
        "optionA": "Know the date of your death",
        "optionB": "Know the cause of your death"
    },
    {
        "id": 90,
        "optionA": "Always have bad Wi-Fi that cuts out every 2 minutes",
        "optionB": "Always have a phone battery stuck at 3%"
    },
    {
        "id": 91,
        "optionA": "Fight 1 horse-sized duck",
        "optionB": "Fight 100 duck-sized horses"
    },
    {
        "id": 92,
        "optionA": "Have a permanent clown nose that honks when squeezed",
        "optionB": "Have permanent clown shoes that squeak with every step"
    },
    {
        "id": 93,
        "optionA": "Travel 100 years into the past with today's knowledge",
        "optionB": "Travel 100 years into the future with nothing"
    },
    {
        "id": 94,
        "optionA": "Be forced to sing everything you say like a musical",
        "optionB": "Be forced to dance everywhere you walk like a backup dancer"
    },
    {
        "id": 95,
        "optionA": "Live without air conditioning in summer",
        "optionB": "Live without heating in winter"
    },
    {
        "id": 96,
        "optionA": "Never be able to use a smartphone again",
        "optionB": "Never be able to drive or ride in a car again"
    },
    {
        "id": 97,
        "optionA": "Have an awkward handshake with everyone you meet",
        "optionB": "Have an awkward hug with everyone you meet"
    },
    {
        "id": 98,
        "optionA": "Always be 1 hour early to everything",
        "optionB": "Always be 15 minutes late to everything"
    },
    {
        "id": 99,
        "optionA": "Be trapped in an elevator with your ex",
        "optionB": "Be trapped in an elevator with your boss"
    },
    {
        "id": 100,
        "optionA": "Have taste buds on your fingers",
        "optionB": "Have eyes in the back of your head"
    },
    {
        "id": 101,
        "optionA": "Be able to teleport anywhere on Earth instantly",
        "optionB": "Be able to fly at 60 mph"
    },
    {
        "id": 102,
        "optionA": "Eat a live beetle for $10,000",
        "optionB": "Walk through a grocery store in your underwear for $10,000"
    },
    {
        "id": 103,
        "optionA": "Never have to brush your teeth again with perfect dental health",
        "optionB": "Never have to shower again with perfect cleanliness and scent"
    },
    {
        "id": 104,
        "optionA": "Be world-famous for doing something embarrassing",
        "optionB": "Live a completely anonymous but wildly successful life"
    },
    {
        "id": 105,
        "optionA": "Have permanent hiccups for the rest of your life",
        "optionB": "Feel like you have an eyelash in your eye forever"
    },
    {
        "id": 106,
        "optionA": "Only be able to whisper",
        "optionB": "Only be able to shout"
    },
    {
        "id": 107,
        "optionA": "Have the power to heal any injury or illness",
        "optionB": "Have the power to resurrect one person"
    },
    {
        "id": 108,
        "optionA": "Live in a world without music",
        "optionB": "Live in a world without visual art and color"
    },
    {
        "id": 109,
        "optionA": "Be able to breathe underwater",
        "optionB": "Be immune to fire and extreme heat"
    },
    {
        "id": 110,
        "optionA": "Always have wet socks on",
        "optionB": "Always have a tiny pebble in your shoe"
    },
    {
        "id": 111,
        "optionA": "Be feared by everyone",
        "optionB": "Be loved by everyone but never taken seriously"
    },
    {
        "id": 112,
        "optionA": "Accidentally text your boss a romantic message",
        "optionB": "Accidentally text your crush an embarrassing family photo"
    },
    {
        "id": 113,
        "optionA": "Live in a perpetual state of winter",
        "optionB": "Live in a perpetual state of scorching summer"
    },
    {
        "id": 114,
        "optionA": "Have a third arm that you can control",
        "optionB": "Have a third eye that can see through walls"
    },
    {
        "id": 115,
        "optionA": "Win an Olympic gold medal",
        "optionB": "Win an Academy Award for Best Actor"
    },
    {
        "id": 116,
        "optionA": "Never get stuck in traffic ever again",
        "optionB": "Never get sick ever again"
    },
    {
        "id": 117,
        "optionA": "Drink sour milk",
        "optionB": "Eat moldy bread"
    },
    {
        "id": 118,
        "optionA": "Be forced to tell the absolute truth 100% of the time",
        "optionB": "Believe every single lie anyone tells you"
    },
    {
        "id": 119,
        "optionA": "Have unlimited first-class flights anywhere forever",
        "optionB": "Never have to pay for food or drinks anywhere forever"
    },
    {
        "id": 120,
        "optionA": "Be reincarnated as a beloved house cat",
        "optionB": "Be reincarnated as a majestic wild eagle"
    },
    {
        "id": 121,
        "optionA": "Have your dream body with no effort",
        "optionB": "Have your dream intelligence with no effort"
    },
    {
        "id": 122,
        "optionA": "Eat a ghost pepper right now",
        "optionB": "Take a bath in ice-cold water for 5 minutes"
    },
    {
        "id": 123,
        "optionA": "Have all your clothes fit perfectly tailored",
        "optionB": "Never have a bad hair day again"
    },
    {
        "id": 124,
        "optionA": "Know what happens after death",
        "optionB": "Know whether extraterrestrial aliens exist"
    },
    {
        "id": 125,
        "optionA": "Be able to freeze time for 1 hour every day",
        "optionB": "Be able to travel back 1 hour in time once a day"
    },
    {
        "id": 126,
        "optionA": "Always have sticky fingers",
        "optionB": "Always have sand in your clothes"
    },
    {
        "id": 127,
        "optionA": "Spend a year alone on an isolated luxury yacht",
        "optionB": "Spend a year backpacking through 50 countries with a stranger"
    },
    {
        "id": 128,
        "optionA": "Have your search history published on the front page of a newspaper",
        "optionB": "Have your text messages read aloud on national television"
    },
    {
        "id": 129,
        "optionA": "Never be able to drink coffee or tea again",
        "optionB": "Never be able to eat chocolate or dessert again"
    },
    {
        "id": 130,
        "optionA": "Be fluent in animal communication",
        "optionB": "Be able to speak with spirits of deceased historical figures"
    },
    {
        "id": 131,
        "optionA": "Always have a terrible haircut",
        "optionB": "Always have terrible fashion sense"
    },
    {
        "id": 132,
        "optionA": "Have a theme song play out loud every time you enter a room",
        "optionB": "Have a laugh track play out loud whenever you tell a joke"
    },
    {
        "id": 133,
        "optionA": "Only be able to eat pizza for every meal for a year",
        "optionB": "Only be able to eat burgers for every meal for a year"
    },
    {
        "id": 134,
        "optionA": "Be the villain who wins",
        "optionB": "Be the hero who loses everything"
    },
    {
        "id": 135,
        "optionA": "Never get caught doing something mischievous",
        "optionB": "Always know when someone is trying to prank you"
    },
    {
        "id": 136,
        "optionA": "Have a tail like a monkey that can grab things",
        "optionB": "Have wings like an owl that allow short glides"
    },
    {
        "id": 137,
        "optionA": "Sleep on a bed of nails",
        "optionB": "Sleep in a room full of harmless buzzing flies"
    },
    {
        "id": 138,
        "optionA": "Have 5 terrible best friends",
        "optionB": "Have 1 loyal enemy who respects you"
    },
    {
        "id": 139,
        "optionA": "Give up your favorite food forever",
        "optionB": "Give up your favorite hobby forever"
    },
    {
        "id": 140,
        "optionA": "Always sweat profusely whenever you lie",
        "optionB": "Turn bright beet-red whenever someone compliments you"
    },
    {
        "id": 141,
        "optionA": "Never have to do laundry again",
        "optionB": "Never have to wash dishes again"
    },
    {
        "id": 142,
        "optionA": "Live in a world where everyone knows your salary",
        "optionB": "Live in a world where everyone knows your romantic history"
    },
    {
        "id": 143,
        "optionA": "Be an extraordinary chef who can't taste anything",
        "optionB": "Be an extraordinary artist who is colorblind"
    },
    {
        "id": 144,
        "optionA": "Wear winter boots in the hot summer",
        "optionB": "Wear flip-flops in the snowy winter"
    },
    {
        "id": 145,
        "optionA": "Have unlimited battery on all your devices forever",
        "optionB": "Have unlimited high-speed Wi-Fi everywhere in the universe"
    },
    {
        "id": 146,
        "optionA": "Be an undercover secret agent",
        "optionB": "Be an astronaut exploring Mars"
    },
    {
        "id": 147,
        "optionA": "Never be able to eat cooked food again",
        "optionB": "Never be able to eat raw or fresh food again"
    },
    {
        "id": 148,
        "optionA": "Have a photographic memory for everything you see",
        "optionB": "Have a perfect ear for every sound and music"
    },
    {
        "id": 149,
        "optionA": "Have your dream partner who is constantly broke",
        "optionB": "Have a wealthy partner you feel zero chemistry with"
    },
    {
        "id": 150,
        "optionA": "Always feel slightly cold",
        "optionB": "Always feel slightly overheated"
    },
    {
        "id": 151,
        "optionA": "Be able to change the color of anything with a touch",
        "optionB": "Be able to mend anything broken with a touch"
    },
    {
        "id": 152,
        "optionA": "Live without a bed and sleep on the floor",
        "optionB": "Live without a sofa and sit on hard stools"
    },
    {
        "id": 153,
        "optionA": "Never have a hangover again",
        "optionB": "Never get jet lag again"
    },
    {
        "id": 154,
        "optionA": "Have a pet baby dinosaur",
        "optionB": "Have a pet baby dragon"
    },
    {
        "id": 155,
        "optionA": "Know every conspiracy theory that is actually true",
        "optionB": "Know the outcome of every future sporting event"
    },
    {
        "id": 156,
        "optionA": "Always be overdressed for every occasion",
        "optionB": "Always be underdressed for every occasion"
    },
    {
        "id": 157,
        "optionA": "Lose your sense of smell",
        "optionB": "Lose your sense of taste"
    },
    {
        "id": 158,
        "optionA": "Have everyone agree with everything you say",
        "optionB": "Always be surprised by what people say"
    },
    {
        "id": 159,
        "optionA": "Never be stuck in an awkward conversation again",
        "optionB": "Never forget anyone's name again"
    },
    {
        "id": 160,
        "optionA": "Be a legendary pirate captain in the 1700s",
        "optionB": "Be a cyberpunk hacker in the year 2150"
    },
    {
        "id": 161,
        "optionA": "Have your internal monologue spoken aloud by Morgan Freeman",
        "optionB": "Have your internal monologue spoken aloud by Snoop Dogg"
    },
    {
        "id": 162,
        "optionA": "Always have cold pizza for breakfast",
        "optionB": "Always have cereal for dinner"
    },
    {
        "id": 163,
        "optionA": "Accidentally call your boss 'honey'",
        "optionB": "Accidentally call your date by your ex's name"
    },
    {
        "id": 164,
        "optionA": "Have to wear a wedding dress or tuxedo everywhere for a month",
        "optionB": "Have to wear a dinosaur costume everywhere for a month"
    },
    {
        "id": 165,
        "optionA": "Wake up fully refreshed after only 2 hours of sleep",
        "optionB": "Be able to eat whatever you want without gaining weight"
    },
    {
        "id": 166,
        "optionA": "Live in a castle alone",
        "optionB": "Live in a cozy apartment with your best friends"
    },
    {
        "id": 167,
        "optionA": "Have every lie you tell appear as text on your forehead",
        "optionB": "Have every secret you keep announced on a megaphone once a year"
    },
    {
        "id": 168,
        "optionA": "Never have to clean the bathroom again",
        "optionB": "Never have to take out the garbage again"
    },
    {
        "id": 169,
        "optionA": "Be the funniest person in any room",
        "optionB": "Be the most charming person in any room"
    },
    {
        "id": 170,
        "optionA": "Have a magic fridge that restocks your favorite snacks automatically",
        "optionB": "Have a magic closet that cleans and irons all your clothes automatically"
    },
    {
        "id": 171,
        "optionA": "Live without cheese",
        "optionB": "Live without garlic"
    },
    {
        "id": 172,
        "optionA": "Have a pet lion that is as friendly as a golden retriever",
        "optionB": "Have a pet golden retriever that is as big as a lion"
    },
    {
        "id": 173,
        "optionA": "Win $100,000 right now",
        "optionB": "Have a 50% chance to win $10,000,000 right now"
    },
    {
        "id": 174,
        "optionA": "Always have a catchy song stuck in your head",
        "optionB": "Always have a random movie quote stuck in your head"
    },
    {
        "id": 175,
        "optionA": "Be able to breathe in space without a suit",
        "optionB": "Be able to explore the deepest trench in the ocean with no submarine"
    },
    {
        "id": 176,
        "optionA": "Have an unlimited coffee subscription forever",
        "optionB": "Have an unlimited pizza subscription forever"
    },
    {
        "id": 177,
        "optionA": "Know all the mysteries of the universe",
        "optionB": "Live peacefully without a single worry"
    },
    {
        "id": 178,
        "optionA": "Never get stuck waiting in line anywhere again",
        "optionB": "Never get stuck on red lights again"
    },
    {
        "id": 179,
        "optionA": "Be able to erase one mistake from your past",
        "optionB": "Be able to preview one choice from your future"
    }
];

export const getRandomQuestion = (usedQuestions = []) => {
    const safeUsed = Array.isArray(usedQuestions) ? usedQuestions : [];
    const availableQuestions = wouldYouRatherQuestions.filter(
        q => !safeUsed.includes(q.id)
    );

    if (availableQuestions.length === 0) {
        return wouldYouRatherQuestions[Math.floor(Math.random() * wouldYouRatherQuestions.length)];
    }

    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

export default wouldYouRatherQuestions;
