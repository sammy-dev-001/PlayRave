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
    },
    // New Questions Batch 1
    {
        question: "What is the capital of Canada?",
        options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the chemical symbol for Silver?",
        options: ["Si", "Sv", "Ag", "Au"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who painted 'Starry Night'?",
        options: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dali"],
        correctAnswer: 1,
        category: "Art"
    },
    {
        question: "In which year did the Titanic sink?",
        options: ["1910", "1911", "1912", "1913"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the largest bone in the human body?",
        options: ["Humerus", "Femur", "Tibia", "Fibula"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which country has the largest population?",
        options: ["India", "China", "USA", "Indonesia"],
        correctAnswer: 0,
        category: "Geography"
    },
    {
        question: "Who is the author of 'To Kill a Mockingbird'?",
        options: ["Harper Lee", "Mark Twain", "Ernest Hemingway", "F. Scott Fitzgerald"],
        correctAnswer: 0,
        category: "Literature"
    },
    {
        question: "What is the rarest blood type?",
        options: ["O Negative", "AB Negative", "B Negative", "A Negative"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which planet rotates on its side?",
        options: ["Mars", "Jupiter", "Uranus", "Neptune"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who is known as the 'Father of Computers'?",
        options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"],
        correctAnswer: 1,
        category: "Technology"
    },
    {
        question: "What is the hardest rock?",
        options: ["Granite", "Marble", "Diamond", "Quartz"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Which country invented tea?",
        options: ["India", "China", "Japan", "England"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the capital of Egypt?",
        options: ["Alexandria", "Giza", "Cairo", "Luxor"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who directed 'The Godfather'?",
        options: ["Martin Scorsese", "Francis Ford Coppola", "Steven Spielberg", "Quentin Tarantino"],
        correctAnswer: 1,
        category: "Entertainment"
    },
    {
        question: "What is the smallest bird in the world?",
        options: ["Hummingbird", "Sparrow", "Robin", "Finch"],
        correctAnswer: 0,
        category: "Nature"
    },
    {
        question: "Which organ produces insulin?",
        options: ["Liver", "Pancreas", "Kidney", "Stomach"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the main ingredient in hummus?",
        options: ["Lentils", "Chickpeas", "Beans", "Peas"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "Who was the first woman to win a Nobel Prize?",
        options: ["Marie Curie", "Mother Teresa", "Rosa Parks", "Jane Austen"],
        correctAnswer: 0,
        category: "History"
    },
    {
        question: "What is the fastest aquatic animal?",
        options: ["Shark", "Dolphin", "Sailfish", "Tuna"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "Which country has the most islands?",
        options: ["Philippines", "Indonesia", "Sweden", "Canada"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the most consumed drink in the world?",
        options: ["Coffee", "Tea", "Water", "Soda"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "Who painted the Sistine Chapel ceiling?",
        options: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Donatello"],
        correctAnswer: 2,
        category: "Art"
    },
    {
        question: "What is the currency of Japan?",
        options: ["Won", "Yen", "Yuan", "Ringgit"],
        correctAnswer: 1,
        category: "General Knowledge"
    },
    {
        question: "Which planet is the hottest in the solar system?",
        options: ["Mercury", "Venus", "Mars", "Jupiter"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the largest country by land area?",
        options: ["USA", "China", "Canada", "Russia"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "Who wrote the play 'Hamlet'?",
        options: ["William Shakespeare", "Christopher Marlowe", "Ben Jonson", "Oscar Wilde"],
        correctAnswer: 0,
        category: "Literature"
    },
    {
        question: "What is the speed of sound?",
        options: ["343 m/s", "300,000 km/s", "1000 km/h", "500 m/s"],
        correctAnswer: 0,
        category: "Science"
    },
    {
        question: "Which animal sleep standing up?",
        options: ["Dog", "Cat", "Horse", "Pig"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "What is the capital of Italy?",
        options: ["Milan", "Venice", "Rome", "Florence"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who invented the light bulb?",
        options: ["Nikola Tesla", "Thomas Edison", "Alexander Graham Bell", "Benjamin Franklin"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the deepest part of the ocean?",
        options: ["Mariana Trench", "Puerto Rico Trench", "Java Trench", "Tonga Trench"],
        correctAnswer: 0,
        category: "Geography"
    },
    {
        question: "Which element is needed for strong bones?",
        options: ["Iron", "Calcium", "Potassium", "Zinc"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the national animal of Scotland?",
        options: ["Lion", "Unicorn", "Dragon", "Eagle"],
        correctAnswer: 1,
        category: "General Knowledge"
    },
    {
        question: "Who sang 'Bohemian Rhapsody'?",
        options: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"],
        correctAnswer: 2,
        category: "Music"
    },
    {
        question: "What is the largest internal organ?",
        options: ["Heart", "Lungs", "Liver", "Stomach"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Which country is the largest producer of coffee?",
        options: ["Colombia", "Vietnam", "Brazil", "Ethiopia"],
        correctAnswer: 2,
        category: "Food"
    },
    {
        question: "What is the main gas found in the air we breathe?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who discovered Penicillin?",
        options: ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Isaac Newton"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the smallest continent?",
        options: ["Europe", "Antarctica", "Australia", "South America"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Which fast food restaurant has the most locations?",
        options: ["McDonald's", "KFC", "Subway", "Starbucks"],
        correctAnswer: 2,
        category: "Food"
    },
    {
        question: "What is the closest star to Earth?",
        options: ["Proxima Centauri", "Alpha Centauri", "The Sun", "Betelgeuse"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who painted 'The Last Supper'?",
        options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
        correctAnswer: 2,
        category: "Art"
    },
    {
        question: "What is the capital of Germany?",
        options: ["Munich", "Frankfurt", "Hamburg", "Berlin"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "Which bird is the symbol of peace?",
        options: ["Eagle", "Dove", "Swan", "Owl"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "What is the most popular sport in the world?",
        options: ["Basketball", "Cricket", "Soccer (Football)", "Tennis"],
        correctAnswer: 2,
        category: "Sports"
    },
    {
        question: "Who wrote 'Harry Potter'?",
        options: ["J.R.R. Tolkien", "C.S. Lewis", "J.K. Rowling", "Roald Dahl"],
        correctAnswer: 2,
        category: "Literature"
    },
    {
        question: "What is the largest planet in our solar system?",
        options: ["Saturn", "Jupiter", "Uranus", "Neptune"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Who is the Greek god of the sea?",
        options: ["Zeus", "Hades", "Poseidon", "Apollo"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the chemical formula for table salt?",
        options: ["H2O", "CO2", "NaCl", "KCl"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Which country is known as the Land of the Rising Sun?",
        options: ["China", "Korea", "Japan", "Thailand"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who was the first man in space?",
        options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the longest bone in the human body?",
        options: ["Femur", "Tibia", "Humerus", "Radius"],
        correctAnswer: 0,
        category: "Science"
    },
    {
        question: "Which city is known as the Big Apple?",
        options: ["Los Angeles", "Chicago", "New York", "Miami"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who invented the World Wide Web?",
        options: ["Bill Gates", "Tim Berners-Lee", "Steve Jobs", "Mark Zuckerberg"],
        correctAnswer: 1,
        category: "Technology"
    },
    {
        question: "What is the primary ingredient in chocolate?",
        options: ["Sugar", "Cocoa beans", "Milk", "Butter"],
        correctAnswer: 1,
        category: "Food"
    },
    {
        question: "Which animal is the largest primate?",
        options: ["Chimpanzee", "Orangutan", "Gorilla", "Baboon"],
        correctAnswer: 2,
        category: "Nature"
    },
    {
        question: "What is the capital of Spain?",
        options: ["Barcelona", "Valencia", "Seville", "Madrid"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "Who wrote 'The Great Gatsby'?",
        options: ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"],
        correctAnswer: 1,
        category: "Literature"
    },
    {
        question: "What is the hardest mineral?",
        options: ["Quartz", "Topaz", "Diamond", "Corundum"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Which country has the most volcanoes?",
        options: ["Japan", "Indonesia", "USA", "Iceland"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "What is the main language spoken in Brazil?",
        options: ["Spanish", "Portuguese", "French", "English"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Who discovered gravity?",
        options: ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "What is the largest flower in the world?",
        options: ["Sunflower", "Rafflesia", "Lotus", "Rose"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "Which planet is known as the Blue Planet?",
        options: ["Neptune", "Uranus", "Earth", "Saturn"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "Who was the first US President to resign?",
        options: ["Andrew Johnson", "Richard Nixon", "Bill Clinton", "Donald Trump"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the symbol for Iron on the periodic table?",
        options: ["Ir", "Fe", "In", "Au"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which ocean is the largest?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correctAnswer: 3,
        category: "Geography"
    },
    {
        question: "What is the most popular board game in the world?",
        options: ["Monopoly", "Chess", "Scrabble", "Risk"],
        correctAnswer: 1,
        category: "General Knowledge"
    },
    {
        question: "Which mammal has no vocal cords?",
        options: ["Giraffe", "Elephant", "Whale", "Bat"],
        correctAnswer: 0,
        category: "Nature"
    },
    {
        question: "What is the capital of Russia?",
        options: ["St. Petersburg", "Moscow", "Kazan", "Sochi"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Who painted 'The Scream'?",
        options: ["Vincent van Gogh", "Edvard Munch", "Pablo Picasso", "Claude Monet"],
        correctAnswer: 1,
        category: "Art"
    },
    {
        question: "What is the strongest muscle in the human body?",
        options: ["Biceps", "Quadriceps", "Tongue", "Masseter (Jaw Muscle)"],
        correctAnswer: 3,
        category: "Science"
    },
    {
        question: "Which country is the largest in Africa?",
        options: ["Nigeria", "Egypt", "Algeria", "Sudan"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the most commonly used letter in English?",
        options: ["A", "E", "I", "O"],
        correctAnswer: 1,
        category: "General Knowledge"
    },
    {
        question: "Who is the god of thunder in Norse mythology?",
        options: ["Odin", "Loki", "Thor", "Baldur"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the freezing point of water in Fahrenheit?",
        options: ["0°F", "32°F", "100°F", "212°F"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which planet is known as the Ringed Planet?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Who wrote 'The Odyssey'?",
        options: ["Homer", "Virgil", "Sophocles", "Plato"],
        correctAnswer: 0,
        category: "Literature"
    },
    {
        question: "What is the largest living lizard?",
        options: ["Iguana", "Komodo Dragon", "Monitor Lizard", "Gecko"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "Which country has the most lakes?",
        options: ["USA", "Russia", "Canada", "Finland"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the currency of India?",
        options: ["Rupee", "Rupiah", "Ringgit", "Yuan"],
        correctAnswer: 0,
        category: "General Knowledge"
    },
    {
        question: "Who discovered the Americas before Columbus?",
        options: ["Vikings", "Romans", "Chinese", "Egyptians"],
        correctAnswer: 0,
        category: "History"
    },
    {
        question: "What is the lightest element?",
        options: ["Helium", "Hydrogen", "Lithium", "Oxygen"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which city is the capital of China?",
        options: ["Shanghai", "Beijing", "Hong Kong", "Shenzhen"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Who founded Apple Inc.?",
        options: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Jeff Bezos"],
        correctAnswer: 1,
        category: "Technology"
    },
    {
        question: "What is the national bird of the USA?",
        options: ["Bald Eagle", "Hawk", "Falcon", "Owl"],
        correctAnswer: 0,
        category: "General Knowledge"
    },
    {
        question: "Which planet has the 'Great Red Spot'?",
        options: ["Mars", "Jupiter", "Saturn", "Venus"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Who wrote the Declaration of Independence?",
        options: ["George Washington", "John Adams", "Thomas Jefferson", "Benjamin Franklin"],
        correctAnswer: 2,
        category: "History"
    },
    {
        question: "What is the largest cat species?",
        options: ["Lion", "Tiger", "Leopard", "Jaguar"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "Which country is home to the Taj Mahal?",
        options: ["India", "Pakistan", "Bangladesh", "Nepal"],
        correctAnswer: 0,
        category: "Geography"
    },
    {
        question: "What is the capital of Thailand?",
        options: ["Phuket", "Chiang Mai", "Bangkok", "Pattaya"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who painted 'The Girl with a Pearl Earring'?",
        options: ["Rembrandt", "Vermeer", "Van Gogh", "Picasso"],
        correctAnswer: 1,
        category: "Art"
    },
    {
        question: "What is the only flying mammal?",
        options: ["Flying Squirrel", "Bat", "Sugar Glider", "Lemur"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "Which gas is used in balloons to make them float?",
        options: ["Oxygen", "Hydrogen", "Helium", "Nitrogen"],
        correctAnswer: 2,
        category: "Science"
    },
    {
        question: "What is the longest river in Asia?",
        options: ["Mekong", "Ganges", "Yangtze", "Yellow River"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "Who is the author of 'Pride and Prejudice'?",
        options: ["Charlotte Bronte", "Jane Austen", "Emily Bronte", "Virginia Woolf"],
        correctAnswer: 1,
        category: "Literature"
    },
    {
        question: "What is the hardest substance in the human body?",
        options: ["Bone", "Tooth Enamel", "Cartilage", "Nail"],
        correctAnswer: 1,
        category: "Science"
    },
    {
        question: "Which country has the most time zones?",
        options: ["Russia", "USA", "France", "China"],
        correctAnswer: 2,
        category: "Geography"
    },
    {
        question: "What is the currency of Canada?",
        options: ["Dollar", "Euro", "Pound", "Franc"],
        correctAnswer: 0,
        category: "General Knowledge"
    },
    {
        question: "Who was the first woman in space?",
        options: ["Valentina Tereshkova", "Sally Ride", "Mae Jemison", "Peggy Whitson"],
        correctAnswer: 0,
        category: "History"
    },
    {
        question: "What is the largest type of penguin?",
        options: ["King Penguin", "Emperor Penguin", "Gentoo Penguin", "Adelie Penguin"],
        correctAnswer: 1,
        category: "Nature"
    },
    {
        question: "Which element has the atomic number 1?",
        options: ["Helium", "Oxygen", "Carbon", "Hydrogen"],
        correctAnswer: 3,
        category: "Science"
    },
    {
        question: "What is the capital of Turkey?",
        options: ["Istanbul", "Ankara", "Izmir", "Antalya"],
        correctAnswer: 1,
        category: "Geography"
    },
    {
        question: "Who invented the telephone?",
        options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"],
        correctAnswer: 1,
        category: "History"
    },
    {
        question: "What is the fastest bird in the world?",
        options: ["Eagle", "Falcon", "Hawk", "Swift"],
        correctAnswer: 1,
        category: "Nature"
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
