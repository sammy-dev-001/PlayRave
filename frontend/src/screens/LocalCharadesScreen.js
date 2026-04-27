import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import HapticService from '../services/HapticService';
import SoundService from '../services/SoundService';

// ─── Word Data ────────────────────────────────────────────────────────────────
const CATEGORIES = {
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
CATEGORIES.Mixed = {
    label: 'Mixed Bag',
    iconName: 'shuffle-outline',
    color: '#00E676', // Bright green
    words: {
        easy: Object.values(CATEGORIES).flatMap(c => c.words.easy),
        medium: Object.values(CATEGORIES).flatMap(c => c.words.medium),
        hard: Object.values(CATEGORIES).flatMap(c => c.words.hard),
    }
};

const DIFFICULTY_OPTIONS = [
    { key: 'easy', label: 'Easy', iconName: 'happy-outline', color: COLORS.limeGlow, desc: 'Simple & fun for everyone' },
    { key: 'medium', label: 'Medium', iconName: 'flame-outline', color: '#FF8C42', desc: 'Mix of familiar & tricky' },
    { key: 'hard', label: 'Hard', iconName: 'skull-outline', color: COLORS.hotPink, desc: 'Only the bold survive' },
];

const ROUND_DURATION = 60; // seconds per turn

// ─── Helpers ─────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const getRank = (score, total) => {
    const pct = total > 0 ? score / total : 0;
    if (pct >= 0.8) return { label: 'LEGEND', iconName: 'trophy-outline', color: '#FFD700' };
    if (pct >= 0.6) return { label: 'PRO', iconName: 'flame-outline', color: COLORS.hotPink };
    if (pct >= 0.4) return { label: 'DECENT', iconName: 'flash-outline', color: COLORS.neonCyan };
    if (pct >= 0.2) return { label: 'TRYING', iconName: 'sad-outline', color: COLORS.limeGlow };
    return { label: 'SAPA', iconName: 'skull-outline', color: '#888' };
};

// ─── Component ───────────────────────────────────────────────────────────────
const LocalCharadesScreen = ({ route, navigation }) => {
    const routePlayers = route?.params?.players || null;

    // ── State ──
    const [gameState, setGameState] = useState('category-select'); // category-select | difficulty-select | player-setup | get-ready | playing | round-end | game-over
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);

    // Players
    const [players, setPlayers] = useState(
        routePlayers
            ? routePlayers.map(p => ({ ...p, totalScore: 0 }))
            : null
    );
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);
    const totalRounds = players ? players.length : 1; // each player gets 1 turn

    // Round state
    const [score, setScore] = useState(0); // current round score
    const [skips, setSkips] = useState(0); // skips used this round
    const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
    const [currentWord, setCurrentWord] = useState('');
    const [wordsList, setWordsList] = useState([]);
    const [countdown, setCountdown] = useState(3);

    // Streak / combo
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [isMuted, setIsMuted] = useState(SoundService.getMuted());
    const [isHapticsEnabled, setIsHapticsEnabled] = useState(HapticService.isEnabled);

    // Flash feedback
    const [feedback, setFeedback] = useState(null); // 'correct' | 'pass' | null

    // Animations
    const wordAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const streakAnim = useRef(new Animated.Value(1)).current;

    // Refs
    const timerRef = useRef(null);
    const countdownRef = useRef(null);
    const feedbackTimeout = useRef(null);

    const MAX_SKIPS = 3;
    const STREAK_BONUS_THRESHOLD = 3; // bonus points kick in at 3+ streak

    // ── Animate word swap ──
    const animateWordIn = useCallback(() => {
        wordAnim.setValue(0);
        Animated.spring(wordAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 140,
            friction: 7,
        }).start();
    }, [wordAnim]);

    // ── Flash feedback ──
    const showFeedback = useCallback((type) => {
        setFeedback(type);
        
        if (type === 'correct') {
            HapticService.correctAnswer();
            SoundService.playCorrect();
        } else if (type === 'pass') {
            HapticService.selection();
            SoundService.playTick();
        }

        clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
        }, 600);
    }, []);

    // ── Streak animation ──
    const animateStreak = useCallback(() => {
        streakAnim.setValue(1.6);
        Animated.spring(streakAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 6,
        }).start();
    }, []);

    // ── Pulse timer or high streak when active ──
    useEffect(() => {
        if (gameState !== 'playing') return;

        let interval;
        if (timeLeft <= 10 || streak >= STREAK_BONUS_THRESHOLD) {
            const intensity = streak >= STREAK_BONUS_THRESHOLD ? 1.25 : 1.18;
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { 
                        toValue: intensity, 
                        duration: streak >= STREAK_BONUS_THRESHOLD ? 400 : 280, 
                        useNativeDriver: true 
                    }),
                    Animated.timing(pulseAnim, { 
                        toValue: 1, 
                        duration: streak >= STREAK_BONUS_THRESHOLD ? 400 : 280, 
                        useNativeDriver: true 
                    }),
                ])
            ).start();

            if (timeLeft <= 10 && timeLeft > 0) {
                HapticService.timerTick();
            }
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [timeLeft, gameState, streak]);

    // ── Build word pool for current difficulty ──
    const buildWordPool = useCallback((catKey, diff) => {
        const cat = CATEGORIES[catKey];
        let pool = [];
        if (diff === 'easy') pool = [...cat.words.easy];
        else if (diff === 'medium') pool = [...cat.words.easy, ...cat.words.medium];
        else pool = [...cat.words.easy, ...cat.words.medium, ...cat.words.hard];
        return shuffle(pool);
    }, []);

    // ── Reset per-round counters ──
    const resetRoundState = useCallback(() => {
        setScore(0);
        setSkips(0);
        setStreak(0);
        setMaxStreak(0);
        setTimeLeft(ROUND_DURATION);
        setCountdown(3);
    }, []);

    // ── Category selected ──
    const handleSelectCategory = (key) => {
        setSelectedCategory(key);
        setGameState('difficulty-select');
    };

    // ── Difficulty selected ──
    // NOTE: We pass `diff` and `selectedCategory` directly here — React state
    // updates are async so selectedDifficulty would be stale if used instead.
    const handleSelectDifficulty = (diff) => {
        setSelectedDifficulty(diff);
        if (!players) {
            // Solo: go to player-setup confirmation screen first
            setGameState('player-setup');
        } else {
            // Multiplayer: initialize word pool immediately using fresh values
            const pool = buildWordPool(selectedCategory, diff);
            setWordsList(pool.slice(1));
            setCurrentWord(pool[0]);
            resetRoundState();
            setGameState('get-ready');
        }
    };

    // ── Kick off solo round (called from player-setup screen button) ──
    // By this point selectedCategory & selectedDifficulty are both committed state.
    const beginRound = () => {
        const pool = buildWordPool(selectedCategory, selectedDifficulty);
        setWordsList(pool.slice(1));
        setCurrentWord(pool[0]);
        resetRoundState();
        setGameState('get-ready');
    };

    // ── Get-ready countdown ──
    useEffect(() => {
        if (gameState !== 'get-ready') return;
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    setGameState('playing');
                    animateWordIn();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, [gameState]);

    // ── Playing timer ──
    useEffect(() => {
        if (gameState !== 'playing') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setGameState('round-end');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    // ── Pull next word ──
    const nextWord = (isCorrect) => {
        if (isCorrect) {
            const newStreak = streak + 1;
            const bonus = newStreak >= STREAK_BONUS_THRESHOLD ? 1 : 0;
            setScore(prev => prev + 1 + bonus);
            setStreak(newStreak);
            setMaxStreak(prev => Math.max(prev, newStreak));
            if (newStreak > 1) animateStreak();
            showFeedback('correct');
        } else {
            if (skips >= MAX_SKIPS) return; // blocked
            setSkips(prev => prev + 1);
            setStreak(0);
            showFeedback('pass');
        }

        let remaining = [...wordsList];
        if (remaining.length === 0) {
            remaining = buildWordPool(selectedCategory, selectedDifficulty);
        }
        
        setCurrentWord(remaining[0]);
        setWordsList(remaining.slice(1));
        animateWordIn();
    };

    // ── Save round score and advance player ──
    const handleNextPlayer = () => {
        if (players) {
            // Commit this round's score to current player immediately
            const updatedPlayers = players.map((p, i) =>
                i === currentPlayerIndex ? { ...p, totalScore: (p.totalScore || 0) + score } : p
            );
            setPlayers(updatedPlayers);

            const nextIndex = currentPlayerIndex + 1;
            if (nextIndex >= updatedPlayers.length) {
                setGameState('game-over');
            } else {
                setCurrentPlayerIndex(nextIndex);
                setRoundNumber(r => r + 1);
                // selectedCategory and selectedDifficulty are stable committed state here
                const pool = buildWordPool(selectedCategory, selectedDifficulty);
                setWordsList(pool.slice(1));
                setCurrentWord(pool[0]);
                resetRoundState();
                setGameState('get-ready');
            }
        } else {
            // Solo mode — just show game-over
            setGameState('game-over');
        }
    };

    // ── Full reset ──
    const handlePlayAgain = () => {
        clearInterval(timerRef.current);
        clearInterval(countdownRef.current);
        setGameState('category-select');
        setSelectedCategory(null);
        setSelectedDifficulty(null);
        setScore(0);
        setSkips(0);
        setStreak(0);
        setMaxStreak(0);
        setTimeLeft(ROUND_DURATION);
        setWordsList([]);
        setCurrentWord('');
        setCountdown(3);
        setCurrentPlayerIndex(0);
        setRoundNumber(1);
        if (players) {
            setPlayers(prev => prev.map(p => ({ ...p, totalScore: 0 })));
        }
    };

    const category = selectedCategory ? CATEGORIES[selectedCategory] : null;
    const difficulty = selectedDifficulty ? DIFFICULTY_OPTIONS.find(d => d.key === selectedDifficulty) : null;
    const timerColor = timeLeft <= 10 ? COLORS.hotPink : timeLeft <= 20 ? '#FF8C42' : COLORS.neonCyan;
    const timerPercent = timeLeft / ROUND_DURATION;
    const currentPlayer = players ? players[currentPlayerIndex] : null;

    // ─────────────────────────────────────────
    // RENDER: category-select
    // ─────────────────────────────────────────
    const renderCategorySelect = () => (
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <NeonText size={34} weight="bold" glow style={styles.title}>
                    CHARADES
                </NeonText>
                <NeonText size={13} color="#777" style={styles.subtitle}>
                    Pick a category. Act it out. No words!
                </NeonText>
            </View>

            <View style={styles.categoryGrid}>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.categoryCard, { borderColor: cat.color, shadowColor: cat.color }]}
                        onPress={() => handleSelectCategory(key)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.categoryIconBg, { backgroundColor: `${cat.color}22` }]}>
                            <Ionicons name={cat.iconName} size={30} color={cat.color} />
                        </View>
                        <View style={styles.categoryInfo}>
                            <NeonText size={18} weight="bold" color={cat.color} style={styles.categoryLabel}>
                                {cat.label}
                            </NeonText>
                            <NeonText size={11} color="#555">
                                {cat.words.easy.length + cat.words.medium.length + cat.words.hard.length}+ words
                            </NeonText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={cat.color} />
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={18} color="#555" />
                <NeonText size={14} color="#555">Back</NeonText>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
        </ScrollView>
    );

    // ─────────────────────────────────────────
    // RENDER: difficulty-select
    // ─────────────────────────────────────────
    const renderDifficultySelect = () => (
        <View style={styles.centeredFlex}>
            {/* Category pill */}
            <View style={[styles.catPill, { borderColor: category.color }]}>
                <Ionicons name={category.iconName} size={24} color={category.color} />
                <NeonText size={18} weight="bold" color={category.color}>{category.label}</NeonText>
            </View>

            <NeonText size={22} weight="bold" color={COLORS.white} style={{ marginBottom: 8 }}>
                Choose Difficulty
            </NeonText>
            <NeonText size={13} color="#666" style={{ marginBottom: 32, textAlign: 'center' }}>
                Harder = rarer words + more chaos
            </NeonText>

            <View style={{ width: '100%', gap: 14 }}>
                {DIFFICULTY_OPTIONS.map(d => (
                    <TouchableOpacity
                        key={d.key}
                        style={[styles.diffCard, { borderColor: d.color, shadowColor: d.color }]}
                        onPress={() => handleSelectDifficulty(d.key)}
                        activeOpacity={0.75}
                    >
                        <Ionicons name={d.iconName} size={30} color={d.color} />
                        <View style={styles.diffInfo}>
                            <NeonText size={20} weight="bold" color={d.color}>{d.label}</NeonText>
                            <NeonText size={12} color="#666">{d.desc}</NeonText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={d.color} />
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.backRow} onPress={() => setGameState('category-select')}>
                <Ionicons name="chevron-back" size={18} color="#555" />
                <NeonText size={14} color="#555">Change Category</NeonText>
            </TouchableOpacity>
        </View>
    );

    // ─────────────────────────────────────────
    // RENDER: player-setup (solo — no route players)
    // ─────────────────────────────────────────
    const renderPlayerSetup = () => (
        <View style={styles.centeredFlex}>
            <Ionicons name="game-controller-outline" size={50} color={COLORS.neonCyan} />
            <NeonText size={24} weight="bold" color={COLORS.neonCyan} style={{ marginTop: 12, marginBottom: 8 }}>
                Solo Mode
            </NeonText>
            <NeonText size={14} color="#777" style={{ textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
                No players detected.{'\n'}Play solo — beat your own best score!
            </NeonText>
            <NeonButton
                title="START GAME"
                icon="play"
                onPress={beginRound}
                style={{ width: '90%' }}
            />
            <TouchableOpacity style={styles.backRow} onPress={() => setGameState('difficulty-select')}>
                <Ionicons name="chevron-back" size={18} color="#555" />
                <NeonText size={14} color="#555">Back</NeonText>
            </TouchableOpacity>
        </View>
    );

    // ─────────────────────────────────────────
    // RENDER: get-ready
    // ─────────────────────────────────────────
    const renderGetReady = () => (
        <View style={styles.centeredFlex}>
            {players && (
                <View style={[styles.playerTurnBadge, { borderColor: category.color }]}>
                    <NeonText size={13} color="#888">ACTING NOW</NeonText>
                    <NeonText size={28} weight="bold" color={category.color}>
                        {currentPlayer?.name}
                    </NeonText>
                    <NeonText size={12} color="#666">
                        Round {roundNumber} of {totalRounds}
                    </NeonText>
                </View>
            )}

            {!players && (
                <View style={[styles.catPill, { borderColor: category.color, marginBottom: 24 }]}>
                    <Ionicons name={category.iconName} size={24} color={category.color} />
                    <NeonText size={18} weight="bold" color={category.color}>{category.label}</NeonText>
                </View>
            )}

            <View style={[styles.diffBadge, { backgroundColor: `${difficulty.color}22`, borderColor: difficulty.color }]}>
                <NeonText size={14} weight="bold" color={difficulty.color}>
                    <Ionicons name={difficulty.iconName} size={14} color={difficulty.color} /> {difficulty.label.toUpperCase()} MODE
                </NeonText>
            </View>

            <View style={styles.countdownCircle}>
                <NeonText size={80} weight="bold" glow color={COLORS.neonCyan}>
                    {countdown > 0 ? countdown : <Ionicons name="videocam" size={70} color={COLORS.neonCyan} />}
                </NeonText>
            </View>

            <NeonText size={15} color="#555" style={{ textAlign: 'center' }}>
                {players ? `Pass the phone to ${currentPlayer?.name}!` : 'Get ready to act!'}
            </NeonText>
        </View>
    );

    // ─────────────────────────────────────────
    // RENDER: playing
    // ─────────────────────────────────────────
    const renderPlaying = () => (
        <View style={styles.playingContainer}>
            {/* Feedback flash overlay */}
            {feedback && (
                <View style={[
                    styles.feedbackFlash,
                    { backgroundColor: feedback === 'correct' ? 'rgba(0,230,118,0.15)' : 'rgba(255,68,68,0.12)' }
                ]} pointerEvents="none" />
            )}

            {/* Top bar */}
            <View style={styles.topBar}>
                {/* Header Controls */}
                <View style={styles.headerControls}>
                    <TouchableOpacity 
                        onPress={() => {
                            const muted = SoundService.toggleMute();
                            setIsMuted(muted);
                            HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isMuted ? "volume-mute" : "volume-high"} 
                            size={18} 
                            color={isMuted ? COLORS.hotPink : COLORS.neonCyan} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            HapticService.setEnabled(!isHapticsEnabled);
                            setIsHapticsEnabled(!isHapticsEnabled);
                            if (!isHapticsEnabled) HapticService.selection();
                        }}
                        style={styles.controlIcon}
                    >
                        <Ionicons 
                            name={isHapticsEnabled ? "notifications" : "notifications-off"} 
                            size={18} 
                            color={isHapticsEnabled ? COLORS.neonCyan : COLORS.hotPink} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <NeonText size={44} weight="bold" color={timerColor} glow>
                            {timeLeft}
                        </NeonText>
                    </Animated.View>
                    <NeonText size={11} color="#555">sec</NeonText>
                    <View style={styles.timerBar}>
                        <View
                            style={[
                                styles.timerFill,
                                {
                                    width: `${timerPercent * 100}%`,
                                    backgroundColor: timerColor,
                                    shadowColor: timerColor,
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Score + streak */}
                <View style={styles.rightStats}>
                    <View style={styles.scoreBox}>
                        <NeonText size={38} weight="bold" color={COLORS.limeGlow} glow>
                            {score}
                        </NeonText>
                        <NeonText size={11} color="#555">pts</NeonText>
                    </View>

                    {streak >= 2 && (
                        <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakAnim }] }]}>
                            <NeonText size={11} weight="bold" color="#FF8C42">
                                <Ionicons name="flame" size={12} color="#FF8C42" /> ×{streak}
                            </NeonText>
                        </Animated.View>
                    )}
                </View>
            </View>

            {/* Player name + skips row */}
            <View style={styles.midRow}>
                {players && (
                    <NeonText size={13} weight="bold" color={category.color}>
                        {currentPlayer?.name}
                    </NeonText>
                )}
                <View style={styles.skipsRow}>
                    {Array.from({ length: MAX_SKIPS }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.skipDot,
                                { backgroundColor: i < skips ? '#444' : COLORS.hotPink }
                            ]}
                        />
                    ))}
                    <NeonText size={11} color="#555"> skips</NeonText>
                </View>
            </View>

            {/* Word card */}
            <Animated.View
                style={[
                    styles.wordCard,
                    {
                        borderColor: streak >= STREAK_BONUS_THRESHOLD ? '#FF8C42' : category.color,
                        shadowColor: streak >= STREAK_BONUS_THRESHOLD ? '#FF8C42' : category.color,
                        opacity: wordAnim,
                        transform: [
                            { scale: Animated.multiply(wordAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }), pulseAnim) },
                        ],
                    },
                ]}
            >
                <NeonText size={12} color="#555" style={{ marginBottom: 10, letterSpacing: 2 }}>
                    ACT THIS OUT:
                </NeonText>
                <NeonText
                    size={currentWord.length > 16 ? 26 : currentWord.length > 10 ? 34 : 44}
                    weight="bold"
                    color={category.color}
                    glow
                    style={styles.wordText}
                >
                    {currentWord}
                </NeonText>

                {streak >= STREAK_BONUS_THRESHOLD && (
                    <View style={styles.bonusBadge}>
                        <NeonText size={11} weight="bold" color="#FF8C42">
                            BONUS ACTIVE <Ionicons name="flame" size={12} color="#FF8C42" />
                        </NeonText>
                    </View>
                )}
            </Animated.View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[
                        styles.actionBtn,
                        styles.passBtn,
                        skips >= MAX_SKIPS && styles.actionBtnDisabled,
                    ]}
                    onPress={() => skips < MAX_SKIPS && nextWord(false)}
                    activeOpacity={skips < MAX_SKIPS ? 0.7 : 1}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                    <NeonText size={16} weight="bold" color="#fff">
                        PASS{skips >= MAX_SKIPS ? ' (MAX)' : ` (${MAX_SKIPS - skips})`}
                    </NeonText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.correctBtn]}
                    onPress={() => nextWord(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="checkmark" size={28} color={COLORS.deepNightBlack} />
                    <NeonText size={16} weight="bold" color={COLORS.deepNightBlack}>
                        GOT IT!
                    </NeonText>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ─────────────────────────────────────────
    // RENDER: round-end
    // ─────────────────────────────────────────
    const renderRoundEnd = () => {
        const isLast = !players || currentPlayerIndex >= players.length - 1;
        const rank = getRank(score, score + skips + 1);

        return (
            <View style={styles.centeredFlex}>
                <Ionicons name="alarm-outline" size={60} color={COLORS.hotPink} style={{ marginBottom: 10 }} />
                <NeonText size={36} weight="bold" glow color={COLORS.hotPink} style={{ marginBottom: 4 }}>
                    TIME'S UP!
                </NeonText>

                {players && (
                    <NeonText size={18} color="#888" style={{ marginBottom: 24 }}>
                        {currentPlayer?.name}'s round is done
                    </NeonText>
                )}

                {/* Score card */}
                <View style={styles.roundResultCard}>
                    <View style={styles.roundResultRow}>
                        <View style={styles.roundStat}>
                            <NeonText size={11} color="#888">SCORE</NeonText>
                            <NeonText size={52} weight="bold" color={COLORS.limeGlow} glow>{score}</NeonText>
                            <NeonText size={12} color="#666">{score === 1 ? 'word' : 'words'}</NeonText>
                        </View>
                        <View style={styles.roundStatDivider} />
                        <View style={styles.roundStat}>
                            <NeonText size={11} color="#888">BEST STREAK</NeonText>
                            <NeonText size={52} weight="bold" color="#FF8C42" glow>{maxStreak}</NeonText>
                            <NeonText size={12} color="#666">
                                <Ionicons name="flame-outline" size={12} color="#666" /> in a row
                            </NeonText>
                        </View>
                    </View>

                    <View style={[styles.rankBadge, { backgroundColor: `${rank.color}22`, borderColor: rank.color }]}>
                        <Ionicons name={rank.iconName} size={24} color={rank.color} />
                        <NeonText size={16} weight="bold" color={rank.color}>{rank.label}</NeonText>
                    </View>
                </View>

                {/* Leaderboard if multiplayer */}
                {players && players.some(p => p.totalScore > 0 || currentPlayerIndex > 0) && (
                    <View style={styles.miniLeaderboard}>
                        <NeonText size={12} color="#666" style={{ marginBottom: 10, letterSpacing: 2 }}>
                            CURRENT STANDINGS
                        </NeonText>
                        {[...players]
                            .map((p, i) => ({
                                ...p,
                                displayScore: i === currentPlayerIndex ? (p.totalScore || 0) + score : (p.totalScore || 0),
                            }))
                            .sort((a, b) => b.displayScore - a.displayScore)
                            .map((p, rank) => (
                                <View key={p.id} style={styles.leaderRow}>
                                    <NeonText size={14} color={rank === 0 ? '#FFD700' : '#555'}>
                                        {rank === 0 ? <Ionicons name="trophy" size={14} color="#FFD700" /> : `#${rank + 1}`}
                                    </NeonText>
                                    <NeonText size={15} weight="bold" color={COLORS.white} style={{ flex: 1, marginLeft: 10 }}>
                                        {p.name}
                                    </NeonText>
                                    <NeonText size={16} weight="bold" color={rank === 0 ? '#FFD700' : COLORS.limeGlow}>
                                        {p.displayScore}
                                    </NeonText>
                                </View>
                            ))}
                    </View>
                )}

                <NeonButton
                    title={isLast ? '🏆  See Final Results' : `▶  ${players?.[currentPlayerIndex + 1]?.name}'s Turn`}
                    onPress={handleNextPlayer}
                    style={{ width: '100%', marginTop: 16 }}
                />
            </View>
        );
    };

    // ─────────────────────────────────────────
    // RENDER: game-over
    // ─────────────────────────────────────────
    const renderGameOver = () => {
        // For solo mode
        if (!players) {
            const rank = getRank(score, score + skips + 1);
            return (
                <View style={styles.centeredFlex}>
                    <Ionicons name={rank.iconName} size={70} color={rank.color} />
                    <NeonText size={34} weight="bold" glow color={rank.color} style={{ marginTop: 8, marginBottom: 4 }}>
                        {rank.label}!
                    </NeonText>
                    <NeonText size={15} color="#888" style={{ marginBottom: 32 }}>
                        {category.label} · {difficulty.label} Mode
                    </NeonText>

                    <View style={styles.soloResultCard}>
                        <NeonText size={80} weight="bold" color={COLORS.limeGlow} glow>{score}</NeonText>
                        <NeonText size={18} color="#888">{score === 1 ? 'word guessed' : 'words guessed'}</NeonText>
                        <View style={styles.soloStats}>
                            <View style={styles.soloStat}>
                                <NeonText size={22} weight="bold" color="#FF8C42">{maxStreak}</NeonText>
                                <NeonText size={11} color="#666">best streak</NeonText>
                            </View>
                            <View style={styles.soloStat}>
                                <NeonText size={22} weight="bold" color={COLORS.hotPink}>{skips}</NeonText>
                                <NeonText size={11} color="#666">skips used</NeonText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.endButtons}>
                        <NeonButton title="🔄  PLAY AGAIN" onPress={handlePlayAgain} style={{ width: '100%' }} />
                        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="home-outline" size={20} color="#555" />
                            <NeonText size={14} color="#555">Home</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Multiplayer final results
        const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
        const winner = sorted[0];
        const isTie = sorted.length > 1 && sorted[0].totalScore === sorted[1].totalScore;

        return (
            <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 }}>
                <Ionicons name="trophy" size={70} color="#FFD700" style={{ marginTop: 20 }} />
                <NeonText size={13} color="#888" style={{ marginTop: 8, letterSpacing: 2 }}>
                    {isTie ? 'GAME OVER — IT\'S A TIE!' : 'GAME OVER — WINNER IS'}
                </NeonText>
                <NeonText size={36} weight="bold" glow color="#FFD700" style={{ marginBottom: 4 }}>
                    {isTie ? 'TIE!' : winner.name}
                </NeonText>
                <NeonText size={14} color="#666" style={{ marginBottom: 24 }}>
                    {category.label} · {difficulty.label}
                </NeonText>

                {/* Podium */}
                <View style={styles.podium}>
                    {sorted.map((p, i) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                        const isWinner = i === 0;
                        return (
                            <View key={p.id} style={[
                                styles.podiumCard,
                                { borderColor: i < 3 ? colors[i] : '#333', shadowColor: i < 3 ? colors[i] : 'transparent' },
                                isWinner && styles.podiumCardWinner,
                            ]}>
                                {i < 3 ? <Ionicons name="medal-outline" size={isWinner ? 30 : 22} color={colors[i]} /> : <NeonText size={16}>#{i + 1}</NeonText>}
                                <NeonText size={isWinner ? 20 : 16} weight="bold" color={COLORS.white} style={{ marginTop: 4 }}>
                                    {p.name}
                                </NeonText>
                                <NeonText size={isWinner ? 36 : 28} weight="bold" color={i < 3 ? colors[i] : COLORS.limeGlow} glow>
                                    {p.totalScore}
                                </NeonText>
                                <NeonText size={11} color="#666">pts</NeonText>
                            </View>
                        );
                    })}
                </View>

                {/* Fun stats */}
                <View style={styles.funStatsCard}>
                    <NeonText size={12} color="#555" style={{ letterSpacing: 2, marginBottom: 12 }}>GAME STATS</NeonText>
                    <View style={styles.funStatsRow}>
                        <View style={styles.funStat}>
                            <NeonText size={22} weight="bold" color={COLORS.limeGlow}>
                                {players.reduce((sum, p) => sum + (p.totalScore || 0), 0)}
                            </NeonText>
                            <NeonText size={11} color="#666">total words</NeonText>
                        </View>
                        <View style={styles.funStat}>
                            <NeonText size={22} weight="bold" color={COLORS.neonCyan}>
                                {players.length}
                            </NeonText>
                            <NeonText size={11} color="#666">players</NeonText>
                        </View>
                        <View style={styles.funStat}>
                            <NeonText size={22} weight="bold" color="#FF8C42">
                                <Ionicons name={difficulty.iconName} size={22} color="#FF8C42" />
                            </NeonText>
                            <NeonText size={11} color="#666">{difficulty.label} mode</NeonText>
                        </View>
                    </View>
                </View>

                <View style={[styles.endButtons, { width: '100%' }]}>
                    <NeonButton title="🔄  PLAY AGAIN" onPress={handlePlayAgain} style={{ width: '100%' }} />
                    <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="home-outline" size={20} color="#555" />
                        <NeonText size={14} color="#555">Home</NeonText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    // ─── Main Render ──────────────────────────────────────────────────────────
    const renderContent = () => {
        switch (gameState) {
            case 'category-select':  return renderCategorySelect();
            case 'difficulty-select': return renderDifficultySelect();
            case 'player-setup':     return renderPlayerSetup();
            case 'get-ready':        return renderGetReady();
            case 'playing':          return renderPlaying();
            case 'round-end':        return renderRoundEnd();
            case 'game-over':        return renderGameOver();
            default:                 return null;
        }
    };

    return (
        <NeonContainer showBackButton={false} showMuteButton>
            {renderContent()}
        </NeonContainer>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    flex: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    centeredFlex: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    // ── Category Select ──
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        letterSpacing: 3,
        marginBottom: 6,
    },
    subtitle: {
        textAlign: 'center',
    },
    categoryGrid: {
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 14,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
    },
    categoryIconBg: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
        gap: 3,
    },
    categoryLabel: {
        letterSpacing: 0.5,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 20,
    },

    // ── Difficulty Select ──
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderRadius: 50,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 28,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    diffCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 20,
        paddingVertical: 18,
        gap: 16,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    diffInfo: {
        flex: 1,
        gap: 3,
    },

    // ── Get Ready ──
    playerTurnBadge: {
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 20,
        paddingHorizontal: 32,
        paddingVertical: 18,
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 4,
    },
    diffBadge: {
        borderWidth: 1.5,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 28,
    },
    countdownCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(0, 248, 255, 0.06)',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },

    // ── Playing ──
    playingContainer: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 6,
    },
    feedbackFlash: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 0,
        zIndex: 1,
        pointerEvents: 'none',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        marginBottom: 15,
        position: 'relative'
    },
    headerControls: {
        position: 'absolute',
        top: -40,
        left: 0,
        flexDirection: 'row',
        gap: 8,
    },
    controlIcon: {
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    timerContainer: {
        alignItems: 'center',
        flex: 1,
    },
    timerBar: {
        height: 5,
        width: '80%',
        backgroundColor: '#1a1a2e',
        borderRadius: 3,
        marginTop: 6,
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    rightStats: {
        alignItems: 'center',
        gap: 8,
    },
    scoreBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(198, 255, 74, 0.08)',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(198, 255, 74, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        minWidth: 66,
    },
    streakBadge: {
        backgroundColor: 'rgba(255, 140, 66, 0.15)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FF8C42',
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    midRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 10,
    },
    skipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    skipDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    wordCard: {
        flex: 1,
        marginVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 8,
    },
    wordText: {
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    bonusBadge: {
        marginTop: 16,
        backgroundColor: 'rgba(255,140,66,0.15)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: '#FF8C42',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    },
    actionBtn: {
        flex: 1,
        height: 88,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
    },
    actionBtnDisabled: {
        opacity: 0.35,
    },
    passBtn: {
        backgroundColor: '#FF4444',
        shadowColor: '#FF4444',
        shadowOpacity: 0.5,
    },
    correctBtn: {
        backgroundColor: '#00E676',
        shadowColor: '#00E676',
        shadowOpacity: 0.6,
    },

    // ── Round End ──
    roundResultCard: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 16,
    },
    roundResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    roundStat: {
        alignItems: 'center',
        flex: 1,
        gap: 2,
    },
    roundStatDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#333',
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    miniLeaderboard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        padding: 16,
        marginBottom: 8,
    },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },

    // ── Game Over ──
    soloResultCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(198,255,74,0.06)',
        borderWidth: 2.5,
        borderColor: COLORS.limeGlow,
        borderRadius: 28,
        paddingHorizontal: 50,
        paddingVertical: 32,
        marginBottom: 36,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        gap: 4,
    },
    soloStats: {
        flexDirection: 'row',
        gap: 32,
        marginTop: 16,
    },
    soloStat: {
        alignItems: 'center',
        gap: 3,
    },
    podium: {
        width: '100%',
        gap: 10,
        marginBottom: 20,
    },
    podiumCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        borderWidth: 2,
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    podiumCardWinner: {
        backgroundColor: 'rgba(255,215,0,0.07)',
        paddingVertical: 22,
    },
    funStatsCard: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        paddingVertical: 20,
        marginBottom: 24,
    },
    funStatsRow: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
    },
    funStat: {
        alignItems: 'center',
        gap: 4,
    },
    endButtons: {
        gap: 16,
        alignItems: 'center',
    },
    homeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
    },
});

export default LocalCharadesScreen;
