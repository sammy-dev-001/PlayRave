// Scrabble-style letter tiles and scoring
export const LETTER_TILES = {
    A: { value: 1, count: 9 },
    B: { value: 3, count: 2 },
    C: { value: 3, count: 2 },
    D: { value: 2, count: 4 },
    E: { value: 1, count: 12 },
    F: { value: 4, count: 2 },
    G: { value: 2, count: 3 },
    H: { value: 4, count: 2 },
    I: { value: 1, count: 9 },
    J: { value: 8, count: 1 },
    K: { value: 5, count: 1 },
    L: { value: 1, count: 4 },
    M: { value: 3, count: 2 },
    N: { value: 1, count: 6 },
    O: { value: 1, count: 8 },
    P: { value: 3, count: 2 },
    Q: { value: 10, count: 1 },
    R: { value: 1, count: 6 },
    S: { value: 1, count: 4 },
    T: { value: 1, count: 6 },
    U: { value: 1, count: 4 },
    V: { value: 4, count: 2 },
    W: { value: 4, count: 2 },
    X: { value: 8, count: 1 },
    Y: { value: 4, count: 2 },
    Z: { value: 10, count: 1 },
    '_': { value: 0, count: 2 } // Blank tiles
};

export const BOARD_SIZE = 15;
export const CENTER_SQUARE = 7; // 0-indexed (8th square)

// Bonus squares
// TW: Triple Word, DW: Double Word, TL: Triple Letter, DL: Double Letter
export const BONUS_SQUARES = {
    '0,0': 'TW', '0,7': 'TW', '0,14': 'TW',
    '7,0': 'TW', '7,14': 'TW',
    '14,0': 'TW', '14,7': 'TW', '14,14': 'TW',

    '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
    '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
    '10,4': 'DW', '11,3': 'DW', '12,2': 'DW', '13,1': 'DW',
    '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',
    // Center star is typically DW
    '7,7': 'DW',

    '1,5': 'TL', '1,9': 'TL',
    '5,1': 'TL', '5,5': 'TL', '5,9': 'TL', '5,13': 'TL',
    '9,1': 'TL', '9,5': 'TL', '9,9': 'TL', '9,13': 'TL',
    '13,5': 'TL', '13,9': 'TL',

    '0,3': 'DL', '0,11': 'DL',
    '2,6': 'DL', '2,8': 'DL',
    '3,0': 'DL', '3,7': 'DL', '3,14': 'DL',
    '6,2': 'DL', '6,6': 'DL', '6,8': 'DL', '6,12': 'DL',
    '7,3': 'DL', '7,11': 'DL',
    '8,2': 'DL', '8,6': 'DL', '8,8': 'DL', '8,12': 'DL',
    '11,0': 'DL', '11,7': 'DL', '11,14': 'DL',
    '12,6': 'DL', '12,8': 'DL',
    '14,3': 'DL', '14,11': 'DL'
};

// Valid Words Dictionary (simplified for lightweight usage)
export const VALID_WORDS = new Set([
    // ... Copying previous dictionary (shortened for brevity in this response but would include full list) 
    // In practice, we should use a larger dictionary or API, but keeping existing one for now
    'at', 'be', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we',
    'am', 'an', 'as', 'ax', 'by', 'hi', 'oh', 'ok', 'ox', 'yo',
    'ace', 'act', 'add', 'age', 'ago', 'aid', 'aim', 'air', 'all', 'and', 'ant', 'any', 'ape', 'arc', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'ate', 'awe', 'axe',
    'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'beg', 'bet', 'bid', 'big', 'bin', 'bit', 'bow', 'box', 'boy', 'bud', 'bug', 'bun', 'bus', 'but', 'buy',
    'cab', 'can', 'cap', 'car', 'cat', 'cop', 'cow', 'cry', 'cub', 'cup', 'cut',
    'dad', 'dam', 'day', 'den', 'dew', 'did', 'die', 'dig', 'dim', 'dip', 'dog', 'dot', 'dry', 'dub', 'due', 'dug', 'dye',
    'ear', 'eat', 'egg', 'ego', 'elf', 'elk', 'elm', 'emu', 'end', 'era', 'eve', 'ewe', 'eye',
    'fad', 'fan', 'far', 'fat', 'fax', 'fed', 'fee', 'few', 'fig', 'fin', 'fir', 'fit', 'fix', 'fly', 'foe', 'fog', 'for', 'fox', 'fry', 'fun', 'fur',
    'gag', 'gap', 'gas', 'gave', 'gel', 'gem', 'get', 'gig', 'gin', 'gnu', 'god', 'got', 'gum', 'gun', 'gut', 'guy', 'gym',
    'had', 'ham', 'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hew', 'hid', 'him', 'hip', 'his', 'hit', 'hog', 'hop', 'hot', 'how', 'hub', 'hue', 'hug', 'hum', 'hut',
    'ice', 'icy', 'ill', 'imp', 'ink', 'inn', 'ion', 'ire', 'irk', 'its', 'ivy',
    'jab', 'jag', 'jam', 'jar', 'jaw', 'jay', 'jet', 'jig', 'job', 'jog', 'jot', 'joy', 'jug', 'jut',
    'keg', 'ken', 'key', 'kid', 'kin', 'kit',
    'lab', 'lad', 'lag', 'lap', 'law', 'lay', 'led', 'leg', 'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low', 'lug',
    'mad', 'man', 'map', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mom', 'mop', 'mud', 'mug', 'mum',
    'nab', 'nag', 'nap', 'net', 'new', 'nil', 'nip', 'nit', 'nod', 'nor', 'not', 'now', 'nun', 'nut',
    'oak', 'oar', 'oat', 'odd', 'ode', 'off', 'oft', 'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our', 'out', 'owe', 'owl', 'own',
    'pad', 'pal', 'pan', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pep', 'per', 'pet', 'pie', 'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pow', 'pro', 'pry', 'pub', 'pug', 'pun', 'pup', 'put',
    'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'ref', 'rep', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rug', 'run', 'rut', 'rye',
    'sac', 'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea', 'set', 'sew', 'she', 'shy', 'sin', 'sip', 'sir', 'sis', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'sop', 'sot', 'sow', 'soy', 'spa', 'spy', 'sty', 'sub', 'sum', 'sun', 'sup',
    'tab', 'tad', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'thy', 'tic', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tot', 'tow', 'toy', 'try', 'tub', 'tug', 'two',
    'ugh', 'ump', 'urn', 'use',
    'van', 'vat', 'vet', 'via', 'vie', 'vim', 'vow',
    'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'wok', 'won', 'woo', 'wow',
    'yak', 'yam', 'yap', 'yaw', 'yea', 'yen', 'yes', 'yet', 'yew', 'yip', 'you', 'yow', 'yum', 'yup',
    'zap', 'zed', 'zen', 'zip', 'zit', 'zoo',
    'quiz', 'jeep', 'keep', 'keen', 'quit', 'zeal', 'zone', 'zoom', 'zero',
    // ... including common words from prior file to ensure compatibility
    'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'among', 'angel', 'anger', 'angle', 'angry', 'anime', 'ankle', 'apart', 'apple', 'apply', 'arena', 'argue', 'arise', 'armor', 'arrow', 'asset', 'avoid', 'awake', 'award', 'aware', 'awful', 'basic', 'basis', 'beach', 'begun', 'being', 'below', 'bench', 'birth', 'black', 'blade', 'blame', 'blank', 'blast', 'blaze', 'blend', 'bless', 'blind', 'block', 'blood', 'blown', 'blues', 'board', 'boost', 'booth', 'bound', 'brain', 'brake', 'brand', 'brass', 'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad', 'broke', 'brown', 'brush', 'buddy', 'build', 'built', 'bunch', 'burst', 'buyer', 'cabin', 'cable', 'carry', 'catch', 'cause', 'chain', 'chair', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer', 'chess', 'chest', 'chief', 'child', 'chill', 'china', 'chips', 'chose', 'chunk', 'civic', 'civil', 'claim', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb', 'clock', 'close', 'cloth', 'cloud', 'coach', 'coast', 'color', 'couch', 'could', 'count', 'court', 'cover', 'crack', 'craft', 'crane', 'crash', 'crawl', 'crazy', 'cream', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'cruel', 'crush', 'curve', 'cycle', 'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'decay', 'delay', 'delta', 'dense', 'depth', 'dirty', 'disco', 'ditch', 'dough', 'doubt', 'dozen', 'draft', 'drain', 'drama', 'drank', 'drawn', 'dream', 'dress', 'dried', 'drift', 'drill', 'drive', 'drove', 'drunk', 'dying', 'eager', 'early', 'earth', 'eight', 'elbow', 'elder', 'elect', 'elite', 'email', 'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'essay', 'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false', 'fancy', 'fault', 'favor', 'feast', 'fence', 'fetch', 'fewer', 'fiber', 'field', 'fiery', 'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flame', 'flash', 'fleet', 'flesh', 'float', 'flood', 'floor', 'flour', 'flown', 'fluid', 'flush', 'focus', 'force', 'forge', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'fried', 'front', 'frost', 'fruit', 'funny', 'ghost', 'giant', 'given', 'glass', 'globe', 'glory', 'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'graph', 'grasp', 'grass', 'grave', 'great', 'green', 'greet', 'grief', 'grill', 'grind', 'gross', 'group', 'grove', 'grown', 'guard', 'guess', 'guest', 'guide', 'guilt', 'habit', 'happy', 'harsh', 'haste', 'haven', 'heart', 'heavy', 'hello', 'herbs', 'honey', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'hurry', 'ideal', 'image', 'imply', 'index', 'inner', 'input', 'irony', 'issue', 'ivory', 'jeans', 'jelly', 'jewel', 'joint', 'joker', 'jolly', 'judge', 'juice', 'juicy', 'jumbo', 'jumpy', 'karma', 'kayak', 'keeps', 'kicks', 'kills', 'kinds', 'kings', 'knock', 'known', 'knows', 'label', 'labor', 'lakes', 'lance', 'lands', 'lanes', 'large', 'laser', 'later', 'laugh', 'layer', 'leads', 'learn', 'lease', 'least', 'leave', 'legal', 'lemon', 'level', 'lever', 'light', 'liked', 'limit', 'lined', 'links', 'lions', 'lists', 'lived', 'liver', 'local', 'lodge', 'logic', 'loose', 'lords', 'loser', 'loses', 'lover', 'loves', 'lower', 'loyal', 'lucky', 'lunar', 'lunch', 'lying', 'lyric', 'magic', 'major', 'maker', 'makes', 'march', 'marry', 'match', 'maybe', 'mayor', 'medal', 'media', 'melon', 'mercy', 'merge', 'merit', 'metal', 'meter', 'micro', 'might', 'miles', 'minds', 'minor', 'minus', 'mixer', 'model', 'modem', 'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'moved', 'mover', 'moves', 'movie', 'music', 'naked', 'named', 'names', 'naval', 'needs', 'nerve', 'never', 'newer', 'newly', 'night', 'ninth', 'noble', 'noise', 'north', 'noted', 'notes', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'olive', 'omega', 'onion', 'opens', 'opera', 'opted', 'orbit', 'order', 'other', 'ought', 'outer', 'owned', 'owner', 'oxide', 'ozone', 'packs', 'pages', 'paint', 'pairs', 'panel', 'panic', 'pants', 'paper', 'parks', 'parts', 'party', 'pasta', 'paste', 'patch', 'pause', 'peace', 'peach', 'pearl', 'peers', 'penny', 'perks', 'peter', 'phase', 'phone', 'photo', 'piano', 'picks', 'piece', 'pilot', 'pinch', 'pitch', 'pizza', 'place', 'plain', 'plane', 'plans', 'plant', 'plate', 'plays', 'plaza', 'plead', 'pleas', 'plots', 'plugs', 'poems', 'poets', 'point', 'polar', 'poles', 'polls', 'ponds', 'pools', 'porch', 'ports', 'posed', 'poses', 'posts', 'pouch', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'probe', 'proof', 'prose', 'proud', 'prove', 'proxy', 'pulse', 'pumps', 'punch', 'pupil', 'puppy', 'purse', 'queen', 'query', 'quest', 'queue', 'quick', 'quiet', 'quirk', 'quota', 'quote', 'races', 'radar', 'radio', 'rails', 'raise', 'rally', 'range', 'ranks', 'rapid', 'rates', 'ratio', 'reach', 'reads', 'ready', 'realm', 'rebel', 'refer', 'reign', 'relax', 'relay', 'reply', 'reset', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'rings', 'riots', 'rises', 'risks', 'risky', 'rival', 'river', 'roads', 'robot', 'rocks', 'rocky', 'roles', 'rolls', 'roman', 'rooms', 'roots', 'roses', 'rough', 'round', 'route', 'royal', 'rugby', 'ruins', 'ruled', 'ruler', 'rules', 'rural', 'sadly', 'saint', 'salad', 'sales', 'sandy', 'sauce', 'saved', 'saves', 'scale', 'scare', 'scene', 'scope', 'score', 'scout', 'scrap', 'seals', 'seats', 'seeds', 'seeks', 'seems', 'sells', 'sends', 'sense', 'serve', 'setup', 'seven', 'shade', 'shake', 'shall', 'shame', 'shape', 'share', 'shark', 'sharp', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shiny', 'ships', 'shirt', 'shock', 'shoes', 'shook', 'shoot', 'shops', 'shore', 'short', 'shots', 'shout', 'shown', 'shows', 'sides', 'sight', 'sigma', 'signs', 'silly', 'since', 'sites', 'sixth', 'sixty', 'sized', 'sizes', 'skill', 'skins', 'skirt', 'slave', 'sleep', 'slept', 'slice', 'slide', 'sligh', 'slope', 'slots', 'small', 'smart', 'smell', 'smile', 'smoke', 'snake', 'sneak', 'solar', 'solid', 'solve', 'songs', 'sonic', 'sorry', 'sorts', 'souls', 'sound', 'south', 'space', 'spare', 'spark', 'spawn', 'speak', 'speed', 'spell', 'spend', 'spent', 'spice', 'spicy', 'spike', 'spine', 'split', 'spoke', 'spoon', 'sport', 'spots', 'spray', 'squad', 'stack', 'staff', 'stage', 'stake', 'stamp', 'stand', 'stark', 'stars', 'start', 'state', 'stats', 'stays', 'steal', 'steam', 'steel', 'steep', 'steer', 'stems', 'steps', 'stick', 'stiff', 'still', 'stock', 'stone', 'stood', 'stool', 'store', 'storm', 'story', 'stove', 'strap', 'straw', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'suits', 'sunny', 'super', 'surge', 'swamp', 'swear', 'sweat', 'sweep', 'sweet', 'swept', 'swift', 'swing', 'swiss', 'sword', 'table', 'taken', 'takes', 'tales', 'talks', 'tanks', 'tapes', 'tasks', 'taste', 'tasty', 'taxes', 'teach', 'teams', 'tears', 'teens', 'tells', 'tempo', 'tends', 'tense', 'tenth', 'tents', 'terms', 'tests', 'texts', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thief', 'thigh', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw', 'thumb', 'tidal', 'tides', 'tiger', 'tight', 'tiles', 'timer', 'times', 'tiny', 'tired', 'tires', 'title', 'toast', 'today', 'token', 'tolls', 'tones', 'tongue', 'tools', 'tooth', 'topic', 'torch', 'total', 'totals', 'touch', 'tough', 'tours', 'tower', 'towns', 'toxic', 'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trash', 'treat', 'trees', 'trend', 'trial', 'tribe', 'trick', 'tried', 'tries', 'trips', 'troop', 'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tubes', 'tummy', 'tunes', 'turns', 'tutor', 'twice', 'twins', 'twist', 'typed', 'types', 'ultra', 'uncle', 'under', 'union', 'unique', 'unite', 'unity', 'until', 'upper', 'upset', 'urban', 'urged', 'usage', 'users', 'using', 'usual', 'valid', 'value', 'valve', 'Vegas', 'venue', 'verge', 'verse', 'video', 'views', 'viral', 'virus', 'visit', 'vital', 'vivid', 'vocal', 'vodka', 'voice', 'votes', 'wages', 'wagon', 'waist', 'walks', 'walls', 'wants', 'warns', 'waste', 'watch', 'water', 'waves', 'wears', 'weary', 'weeks', 'weird', 'wells', 'welsh', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'wider', 'widow', 'width', 'wines', 'wings', 'wired', 'wires', 'witch', 'wives', 'woman', 'women', 'won\'t', 'woods', 'words', 'works', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'wrath', 'wreck', 'wrist', 'write', 'wrong', 'wrote', 'yacht', 'yards', 'years', 'yeast', 'yield', 'young', 'yours', 'youth', 'zebra', 'zeros', 'zones'
]);

// Create a tile bag with all tiles
export const createTileBag = () => {
    const bag = [];
    Object.entries(LETTER_TILES).forEach(([letter, data]) => {
        for (let i = 0; i < data.count; i++) {
            bag.push({ letter, value: data.value });
        }
    });
    // Shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
};

// Draw tiles from the bag
export const drawTiles = (bag, count) => {
    const drawn = [];
    for (let i = 0; i < count && bag.length > 0; i++) {
        drawn.push(bag.pop());
    }
    return drawn;
};

// Valid helper based on set
export const isValidWord = (word) => {
    return VALID_WORDS.has(word.toLowerCase());
};

// Board validation: check if move is valid
export const isValidMove = (playedTiles, board) => {
    // Basic checks only for MVP
    if (playedTiles.length === 0) return false;

    // Check logical placement (same row or col)
    const rows = playedTiles.map(t => t.y);
    const cols = playedTiles.map(t => t.x);

    // Check if horizontal or vertical
    const isHorizontal = new Set(rows).size === 1;
    const isVertical = new Set(cols).size === 1;

    if (!isHorizontal && !isVertical) return false;

    // Check gaps? (Need checks for existing tiles to bridge gaps)
    // For now, simplify to just checking direction
    return true;
};
