// ─── Word Data ────────────────────────────────────────────────────────────────
export const getCategories = (COLORS) => {
    const cats = {
        Movies: {
            label: 'Movies & TV',
            iconName: 'film-outline',
            color: COLORS.hotPink,
            words: {
                easy: [
                    'Titanic', 'Frozen', 'Shrek', 'Up', 'Cars', 'Toy Story',
                    'Mulan', 'Aladdin', 'Moana', 'Coco', 'Brave', 'Ratatouille',
                    'The Lion King', 'Home Alone', 'Elf', 'Grease',
                ],
                medium: [
                    'Inception', 'The Matrix', 'Avengers', 'Interstellar',
                    'Jurassic Park', 'Avatar', 'Mean Girls', 'Clueless',
                    'The Dark Knight', 'Fast & Furious', 'Black Panther',
                    'Crazy Rich Asians', 'Get Out', 'Us', 'Knives Out',
                    'The Wolf of Wall Street', 'Parasite', 'A Quiet Place',
                ],
                hard: [
                    'No Country for Old Men', 'Eternal Sunshine of the Spotless Mind',
                    'There Will Be Blood', 'Mulholland Drive', 'Pan\'s Labyrinth',
                    'Synecdoche New York', 'Requiem for a Dream', '12 Angry Men',
                    'The Seventh Seal', 'Rashomon', 'Amores Perros',
                    '2001: A Space Odyssey', 'Apocalypse Now', 'Blade Runner 2049',
                ],
            },
        },
        Animals: {
            label: 'Animals',
            iconName: 'paw-outline',
            color: COLORS.limeGlow,
            words: {
                easy: [
                    'Dog', 'Cat', 'Fish', 'Bird', 'Horse', 'Cow', 'Pig', 'Duck',
                    'Rabbit', 'Frog', 'Snake', 'Bee', 'Butterfly', 'Monkey',
                    'Elephant', 'Lion', 'Tiger', 'Bear',
                ],
                medium: [
                    'Flamingo', 'Kangaroo', 'Crocodile', 'Dolphin', 'Peacock',
                    'Porcupine', 'Meerkat', 'Chameleon', 'Octopus', 'Hummingbird',
                    'Sloth', 'Platypus', 'Walrus', 'Axolotl', 'Mantis',
                    'Pangolin', 'Narwhal', 'Capybara', 'Komodo Dragon',
                ],
                hard: [
                    'Okapi', 'Proboscis Monkey', 'Shoebill', 'Aye-aye',
                    'Fossa', 'Quokka', 'Babirusa', 'Saiga Antelope',
                    'Tarsier', 'Star-nosed Mole', 'Blobfish', 'Anglerfish',
                    'Mantis Shrimp', 'Hagfish', 'Goblin Shark',
                ],
            },
        },
        Actions: {
            label: 'Actions',
            iconName: 'flash-outline',
            color: COLORS.neonCyan,
            words: {
                easy: [
                    'Running', 'Dancing', 'Sleeping', 'Eating', 'Swimming',
                    'Jumping', 'Crying', 'Laughing', 'Singing', 'Clapping',
                    'Waving', 'Cooking', 'Reading', 'Writing', 'Driving',
                    'Flying', 'Falling', 'Fighting',
                ],
                medium: [
                    'Surfing', 'Skydiving', 'Brushing teeth', 'Eating spaghetti',
                    'Sneezing', 'Playing guitar', 'Riding a horse', 'Rock climbing',
                    'Taking a selfie', 'Juggling', 'Painting a wall', 'Baking a cake',
                    'Tightrope walking', 'Boxing', 'Skateboarding', 'Yoga',
                    'Fencing', 'Archery', 'Ice skating',
                ],
                hard: [
                    'Getting pulled over by police', 'Proposing in public',
                    'Delivering a baby', 'Parallel parking badly',
                    'Being electrocuted', 'Sitting on a cactus',
                    'Walking on hot coals', 'Mime trapped in a box',
                    'Speed eating a watermelon', 'Chasing a chicken',
                    'Trying to open a stubborn jar', 'Stepping on LEGO',
                    'Explaining a dream', 'Acting on a soap opera',
                    'Being a statue that comes to life',
                ],
            },
        },
        Celebrities: {
            label: 'Celebrities',
            iconName: 'star-outline',
            color: COLORS.electricPurple,
            words: {
                easy: [
                    'Beyoncé', 'Drake', 'Rihanna', 'Jay-Z', 'Cardi B',
                    'Will Smith', 'Michael Jackson', 'Madonna', 'Oprah',
                    'Cristiano Ronaldo', 'Lionel Messi', 'LeBron James',
                    'Serena Williams', 'Elon Musk', 'Taylor Swift',
                    'Dwayne Johnson', 'Kevin Hart', 'Kanye West',
                ],
                medium: [
                    'Davido', 'Burna Boy', 'Wizkid', 'Tiwa Savage',
                    'Tems', 'Asake', 'Fela Kuti', 'Asa', 'Yemi Alade',
                    'Nicki Minaj', 'Bad Bunny', 'BTS', 'Adele',
                    'Ed Sheeran', 'Billie Eilish', 'Post Malone',
                    'Lil Wayne', 'Tupac', 'Eminem', 'Lady Gaga',
                ],
                hard: [
                    'Zlatan Ibrahimović', 'Pedro Pascal', 'Florence Pugh',
                    'Awkwafina', 'Cillian Murphy', 'Zendaya',
                    'Ke Huy Quan', 'Michelle Yeoh', 'Jeremy Allen White',
                    'Anya Taylor-Joy', 'Austin Butler', 'Barry Keoghan',
                    'Andrew Garfield', 'Dev Patel', 'Timothée Chalamet',
                ],
            },
        },
        FoodDrink: {
            label: 'Food & Drink',
            iconName: 'fast-food-outline',
            color: '#FF8C42',
            words: {
                easy: [
                    'Pizza', 'Burger', 'Sushi', 'Taco', 'Ice cream', 'Cake',
                    'Popcorn', 'Sandwich', 'Salad', 'Pasta', 'Soup',
                    'Coffee', 'Juice', 'Beer', 'Smoothie', 'Pancakes',
                    'Fried chicken', 'Hotdog',
                ],
                medium: [
                    'Jollof rice', 'Suya', 'Egusi soup', 'Pounded yam',
                    'Pepper soup', 'Boli', 'Chin chin', 'Puff puff',
                    'Moi moi', 'Akara', 'Eba', 'Ogbono soup',
                    'Naan bread', 'Dim sum', 'Ramen', 'Pad thai',
                    'Churros', 'Empanada', 'Baklava', 'Pierogi',
                ],
                hard: [
                    'Crêpes Suzette', 'Beef Bourguignon', 'Coq au Vin',
                    'Tournedos Rossini', 'Escalivada', 'Boeuf en Croûte',
                    'Shakshuka', 'Berbere', 'Injera', 'Rendang',
                    'Massaman curry', 'Ceviche', 'Chimichurri',
                    'Molecular gastronomy foam', 'Deconstructed cheesecake',
                ],
            },
        },
        Sports: {
            label: 'Sports',
            iconName: 'trophy-outline',
            color: '#FFD700',
            words: {
                easy: [
                    'Football', 'Basketball', 'Tennis', 'Swimming', 'Running',
                    'Boxing', 'Golf', 'Baseball', 'Volleyball', 'Cricket',
                    'Cycling', 'Skiing', 'Surfing', 'Karate', 'Gymnastics',
                    'Table tennis', 'Badminton', 'Archery',
                ],
                medium: [
                    'Weightlifting', 'Pole vault', 'High jump', 'Hurdles',
                    'Synchronized swimming', 'Equestrian', 'Fencing',
                    'Rhythmic gymnastics', 'Biathlon', 'Triathlon',
                    'Water polo', 'Handball', 'Lacrosse', 'Rugby',
                    'American football', 'Ice hockey', 'Curling',
                    'Skateboarding', 'BMX', 'Rock climbing',
                ],
                hard: [
                    'Kabaddi', 'Sepak takraw', 'Bandy', 'Korfball',
                    'Pesäpallo', 'Bossaball', 'Underwater hockey',
                    'Cheese rolling', 'Bog snorkelling', 'Toe wrestling',
                    'Ferret legging', 'Extreme ironing', 'Chess boxing',
                    'Quidditch (real-life)', 'Wife carrying',
                ],
            },
        },
        NaijaVibes: {
            label: 'Naija Vibes',
            iconName: 'globe-outline',
            color: '#00A86B',
            words: {
                easy: [
                    'NEPA took light', 'Danfo bus', 'Area boys',
                    'Mama put', 'Garri soaking', 'Okada ride',
                    'Sunday jollof', 'Church drama', 'Market bargaining',
                    'Bata shoe', 'Going to the stream', 'Molue bus',
                    'Suya spot', 'Pepper seller argument', 'Go-slow traffic',
                    'Generator noise', 'Fetch water', 'Chasing goat',
                ],
                medium: [
                    'SARS checkpoint nervousness', 'Agbero collecting money',
                    'PVC card not scanning', 'Generator fuel running out',
                    'Aso Rock press conference', 'Owanbe party owambe',
                    'Agbada spinning', 'Gele tying', 'Children at Christmas',
                    'Selling pure water', 'Keke napep weaving',
                    'Abuja traffic jam', 'Lagos third mainland bridge',
                    'Returning from abroad for first time',
                    'CBT exam centre chaos', 'Secondary school assembly',
                ],
                hard: [
                    'Explaining Naija to a foreigner', 'NYSC parade marching',
                    'Bricklayer on scaffold whistling', 'Agbero vs conductor fight',
                    'Pastor catching Holy Ghost fire', 'Magun juju activating',
                    'Bank queue in the sun all day', 'Custom officer shaking head',
                    'Akara seller running from LAWMA', 'Politician sharing rice',
                    'Owambe aunty greeting everyone she knows',
                    'Driver doing one-way in traffic', 'Mechanic under car',
                    'Customer at oga boutique haggling for hours',
                    'Sapa hitting during end of month',
                ],
            },
        },
        PartyMayhem: {
            label: 'Party & Mayhem',
            iconName: 'sparkles-outline',
            color: '#FF4DFF',
            words: {
                easy: [
                    'Getting drunk', 'Twerking badly', 'Karaoke disaster',
                    'Falling off chair', 'Spilling drink', 'Crying in the club',
                    'Photobombing', 'Taking too many selfies', 'DJ confusion',
                    'Wrong venue', 'Birthday cake in face', 'Limbo dancing',
                    'Table dancing', 'Security throwing you out',
                    'First time on a dance floor', 'Losing your phone',
                ],
                medium: [
                    'Body roll gone wrong', 'Proposing at someone else\'s wedding',
                    'Finding your ex at the party', 'Drunk texting your boss',
                    'Waking up on a stranger\'s couch', 'Group photo nobody looks good in',
                    'Argument over aux cord', 'Sneaking out of a boring event',
                    'Setting off the fire alarm cooking',
                    'Mixing drinks and regretting it', 'Losing your friends in the club',
                    'Heels breaking mid-dance', 'Flirting in sign language',
                    'First time doing shots', 'Embarrassing parent at party',
                ],
                hard: [
                    'Being the sober one at a drunk party',
                    'Trying to sober up before getting home',
                    'Explaining to security why you\'re there',
                    'Two people showing up in same outfit',
                    'Accidentally insulting the birthday person',
                    'Getting stuck doing the electric slide alone',
                    'Running out of data at the venue',
                    'Trying Afrobeats when you don\'t know the moves',
                    'WhatsApp group for party that never agrees',
                    'The DJ playing wrong song at the wrong time',
                    'Trying to vibe when you\'re the oldest person there',
                    'Over-sharing on the microphone',
                    'Someone crying for unknown reasons',
                    'Party host panicking because food is not enough',
                ],
            },
        },
    };

    // Add a Mixed category that pulls words from all other categories
    cats.Mixed = {
        label: 'Mixed Bag',
        iconName: 'shuffle-outline',
        color: '#00E676', // Bright green
        words: {
            easy: Object.values(cats).flatMap(c => c.words.easy),
            medium: Object.values(cats).flatMap(c => c.words.medium),
            hard: Object.values(cats).flatMap(c => c.words.hard),
        }
    };

    return cats;
};
