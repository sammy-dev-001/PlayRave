const triviaQuestions = [
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswer: 2,
        category: "Art"
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the smallest prime number?",
        options: ["0", "1", "2", "3"],
        correctAnswer: 2,
        category: "Math"
    },
    {
        question: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Silver", "Iron"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: 1,
        category: "Literature"
    },
    {
        question: "What is the speed of light?",
        options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
        correctAnswer: 0,
        category: "Science"
    },
    {
        question: "Which country is home to the kangaroo?",
        options: ["New Zealand", "South Africa", "Australia", "Brazil"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "How many continents are there?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the largest mammal in the world?",
        options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "In which city is the Eiffel Tower located?",
        options: ["London", "Rome", "Paris", "Berlin"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is H2O commonly known as?",
        options: ["Oxygen", "Hydrogen", "Water", "Carbon Dioxide"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who was the first person to walk on the moon?",
        options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the capital of Japan?",
        options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "How many sides does a hexagon have?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 1,
        category: "Math"
    },
    {
        question: "Which gas do plants absorb from the atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "What is the largest desert in the world?",
        options: ["Sahara", "Gobi", "Antarctic", "Arabian"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who invented the telephone?",
        options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Benjamin Franklin"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Iron", "Diamond", "Platinum"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "How many players are on a soccer team?",
        options: ["9", "10", "11", "12"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "What is the currency of the United Kingdom?",
        options: ["Euro", "Dollar", "Pound Sterling", "Franc"],
        correctAnswer: 2,
        category: "General Knowledge"
    },
    {
        question: "Which planet is closest to the Sun?",
        options: ["Venus", "Earth", "Mercury", "Mars"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "What year did the Titanic sink?",
        options: ["1910", "1911", "1912", "1913"],
        correctAnswer: 2,
        category: "History"
    },
    // New Science Questions
    {
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the most abundant gas in Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "How many bones are in the adult human body?",
        options: ["186", "206", "226", "246"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "What type of animal is a Komodo dragon?",
        options: ["Snake", "Lizard", "Crocodile", "Dinosaur"],
        correctAnswer: 1,
        category: "Science"
    },
    // New History Questions
    {
        question: "Who was the first President of the United States?",
        options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "In which year did the Berlin Wall fall?",
        options: ["1987", "1988", "1989", "1990"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "Who was the ancient Egyptian queen known for her relationship with Julius Caesar?",
        options: ["Nefertiti", "Cleopatra", "Hatshepsut", "Nefertari"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What was the name of the ship that brought the Pilgrims to America?",
        options: ["Santa Maria", "Mayflower", "Beagle", "Endeavour"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "Which empire built Machu Picchu?",
        options: ["Aztec", "Maya", "Inca", "Olmec"],
        correctAnswer: 2,
        category: "History"
    },
    // New Geography Questions
    {
        question: "What is the longest river in the world?",
        options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Which country has the most natural lakes?",
        options: ["United States", "Russia", "Canada", "Brazil"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Mount Everest is located in which mountain range?",
        options: ["Alps", "Andes", "Rockies", "Himalayas"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "Which African country was formerly known as Abyssinia?",
        options: ["Egypt", "Ethiopia", "Sudan", "Somalia"],
        correctAnswer: 1,
        category: "Geography"
    },
    // New Sports Questions
    {
        question: "How many rings are on the Olympic flag?",
        options: ["4", "5", "6", "7"],
        correctAnswer: 1,
        category: "Sports"
    },
    {
        question: "In which sport would you perform a slam dunk?",
        options: ["Volleyball", "Tennis", "Basketball", "Baseball"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "What is the maximum score in a single frame of bowling?",
        options: ["100", "200", "300", "400"],
        correctAnswer: 2,
        category: "Sports"
    },
    // New Entertainment Questions
    {
        question: "Who directed the movie 'Jurassic Park'?",
        options: ["George Lucas", "Steven Spielberg", "James Cameron", "Ridley Scott"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "Which movie won the Academy Award for Best Picture in 1994?",
        options: ["Pulp Fiction", "The Shawshank Redemption", "Forrest Gump", "The Lion King"],
        correctAnswer: 2,
        category: "Entertainment"
    },
    {
        question: "What is the name of Harry Potter's owl?",
        options: ["Scabbers", "Hedwig", "Crookshanks", "Fawkes"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "Which band released the album 'Abbey Road'?",
        options: ["The Rolling Stones", "The Beatles", "Led Zeppelin", "Pink Floyd"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "In which TV show would you find the character 'Walter White'?",
        options: ["The Sopranos", "Breaking Bad", "The Wire", "Mad Men"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    // New Technology Questions
    {
        question: "Who is the co-founder of Microsoft?",
        options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"],
        correctAnswer: 1,
        category: "Technology"
    },
    {
        question: "What does 'HTTP' stand for?",
        options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Process", "High Tech Transfer Protocol"],
        correctAnswer: 0,
        category: "Technology"
    },
    {
        question: "In what year was the first iPhone released?",
        options: ["2005", "2006", "2007", "2008"],
        correctAnswer: 2,
        category: "Technology"
    },
    // Additional Math Questions
    {
        question: "What is the value of Pi (π) to two decimal places?",
        options: ["3.12", "3.14", "3.16", "3.18"],
        correctAnswer: 1,
        category: "Math"
    },
    {
        question: "What is 15% of 200?",
        options: ["20", "25", "30", "35"],
        correctAnswer: 2,
        category: "Math"
    },
    // Additional Literature Questions
    {
        question: "Who wrote '1984'?",
        options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"],
        correctAnswer: 1,
        category: "Literature"
    },
    {
        question: "What is the first book in the Harry Potter series?",
        options: ["Chamber of Secrets", "Prisoner of Azkaban", "Philosopher's Stone", "Goblet of Fire"],
        correctAnswer: 2,
        category: "Literature"
    },
    // Pop Culture
    {
        question: "What year was YouTube founded?",
        options: ["2003", "2004", "2005", "2006"],
        correctAnswer: 2,
        category: "Technology"
    },
    {
        question: "Which social media platform has the bird logo?",
        options: ["Facebook", "Instagram", "Twitter/X", "TikTok"],
        correctAnswer: 2,
        category: "Technology"
    },
    {
        question: "What is the most subscribed YouTube channel?",
        options: ["PewDiePie", "MrBeast", "T-Series", "Cocomelon"],
        correctAnswer: 1,
        category: "Pop Culture"
    },
    {
        question: "Which Marvel superhero wields a shield?",
        options: ["Iron Man", "Thor", "Captain America", "Hulk"],
        correctAnswer: 2,
        category: "Entertainment"
    },
    {
        question: "What is the name of Batman's butler?",
        options: ["Jarvis", "Alfred", "Watson", "Jeeves"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    // Food & Drink
    {
        question: "What is the main ingredient in guacamole?",
        options: ["Tomato", "Avocado", "Pepper", "Onion"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "Which country is famous for sushi?",
        options: ["China", "Korea", "Japan", "Thailand"],
        correctAnswer: 2,
        category: "Food"
    },
    {
        question: "What type of pasta is shaped like little shells?",
        options: ["Penne", "Conchiglie", "Fusilli", "Rigatoni"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "What fruit is dried to make raisins?",
        options: ["Plums", "Grapes", "Apricots", "Dates"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "What is the most popular pizza topping?",
        options: ["Mushrooms", "Pepperoni", "Sausage", "Olives"],
        correctAnswer: 1,
        category: "Food"
    },
    // Animals
    {
        question: "How many legs does a spider have?",
        options: ["6", "8", "10", "12"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "What is a group of lions called?",
        options: ["Pack", "Herd", "Pride", "Flock"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "Which bird cannot fly?",
        options: ["Eagle", "Penguin", "Hawk", "Sparrow"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "What is the fastest land animal?",
        options: ["Lion", "Gazelle", "Cheetah", "Horse"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "How many hearts does an octopus have?",
        options: ["1", "2", "3", "4"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "What is a baby kangaroo called?",
        options: ["Cub", "Joey", "Pup", "Kit"],
        correctAnswer: 1,
        category: "Nature"
    },
    // Music
    {
        question: "Which artist is known as the 'King of Pop'?",
        options: ["Elvis Presley", "Michael Jackson", "Prince", "Bruno Mars"],
        correctAnswer: 1,
        category: "Music"
    },
    {
        question: "How many strings does a standard guitar have?",
        options: ["4", "5", "6", "7"],
        correctAnswer: 2,
        category: "Music"
    },
    {
        question: "Which instrument has 88 keys?",
        options: ["Organ", "Accordion", "Piano", "Synthesizer"],
        correctAnswer: 2,
        category: "Music"
    },
    {
        question: "Which country does reggae music originate from?",
        options: ["Brazil", "Cuba", "Jamaica", "Haiti"],
        correctAnswer: 2,
        category: "Music"
    },
    // Movies
    {
        question: "Who played Jack in Titanic?",
        options: ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Matt Damon"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "Which movie features the quote 'May the Force be with you'?",
        options: ["Star Trek", "Star Wars", "Avatar", "Guardians of the Galaxy"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "What is the highest-grossing film of all time?",
        options: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "What color is Shrek?",
        options: ["Blue", "Green", "Yellow", "Orange"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    // General Knowledge
    {
        question: "How many days are in a leap year?",
        options: ["364", "365", "366", "367"],
        correctAnswer: 2,
        category: "General Knowledge"
    },
    {
        question: "What is the tallest building in the world?",
        options: ["Empire State Building", "Shanghai Tower", "Burj Khalifa", "One World Trade Center"],
        correctAnswer: 2,
        category: "General Knowledge"
    },
    {
        question: "How many colors are in a rainbow?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 2,
        category: "General Knowledge"
    },
    {
        question: "What language has the most native speakers?",
        options: ["English", "Spanish", "Hindi", "Mandarin Chinese"],
        correctAnswer: 3,
        category: "General Knowledge"
    },
    {
        question: "How many minutes are in a day?",
        options: ["1240", "1340", "1440", "1540"],
        correctAnswer: 2,
        category: "General Knowledge"
    },
    {
        question: "What is the smallest country in the world?",
        options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Which ocean is between Africa and Australia?",
        options: ["Atlantic", "Pacific", "Indian", "Arctic"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the most spoken language in South America?",
        options: ["Spanish", "Portuguese", "English", "French"],
        correctAnswer: 0,
        category: "Geography"
    },
    // More Science
    {
        question: "What planet has the most moons?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the boiling point of water in Celsius?",
        options: ["90°C", "100°C", "110°C", "120°C"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Skin", "Brain"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "How many teeth do adult humans have?",
        options: ["28", "30", "32", "34"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "What blood type is the universal donor?",
        options: ["A", "B", "AB", "O"],
        correctAnswer: 3,
        category: "Science"
    },
    // More History
    {
        question: "Which country gifted the Statue of Liberty to the USA?",
        options: ["England", "France", "Germany", "Italy"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "Who discovered America in 1492?",
        options: ["Vasco da Gama", "Christopher Columbus", "Ferdinand Magellan", "Marco Polo"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What ancient civilization built the pyramids?",
        options: ["Romans", "Greeks", "Egyptians", "Mayans"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "In which city was JFK assassinated?",
        options: ["Washington D.C.", "Los Angeles", "Dallas", "New York"],
        correctAnswer: 2,
        category: "History"
    },
    // More Sports
    {
        question: "What sport is played at Wimbledon?",
        options: ["Golf", "Cricket", "Tennis", "Rugby"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "How long is a marathon in kilometers?",
        options: ["40.2 km", "42.2 km", "44.2 km", "46.2 km"],
        correctAnswer: 1,
        category: "Sports"
    },
    {
        question: "Which country has won the most FIFA World Cups?",
        options: ["Germany", "Argentina", "Brazil", "Italy"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "In which sport would you do a 'slam dunk'?",
        options: ["Volleyball", "Tennis", "Basketball", "Baseball"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "How many points is a touchdown worth in American football?",
        options: ["4", "5", "6", "7"],
        correctAnswer: 2,
        category: "Sports"
    }
];

function getRandomQuestions(count = 5, category = null) {
    let questions = triviaQuestions;

    // Filter by category if specified and not "All"
    if (category && category !== 'All') {
        questions = triviaQuestions.filter(q => q.category === category);
    }

    // Shuffle and return requested count (or all available if less than count)
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, questions.length));
}

// Get list of all unique categories
function getCategories() {
    const categories = ['All', ...new Set(triviaQuestions.map(q => q.category))];
    return categories.sort();
}

module.exports = { triviaQuestions, getRandomQuestions, getCategories };
