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
    Z: { value: 10, count: 1 }
};

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

// Calculate word score
export const calculateWordScore = (word) => {
    let score = 0;
    word.toUpperCase().split('').forEach(letter => {
        if (LETTER_TILES[letter]) {
            score += LETTER_TILES[letter].value;
        }
    });
    return score;
};

// Common valid English words (simplified dictionary for game)
export const VALID_WORDS = new Set([
    // 2-letter words
    'at', 'be', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we',
    'am', 'an', 'as', 'ax', 'by', 'hi', 'oh', 'ok', 'ox',
    // 3-letter words
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
    // 4+ letter common words
    'able', 'ache', 'acid', 'aged', 'also', 'area', 'army', 'away', 'baby', 'back', 'ball', 'band', 'bank', 'base', 'bath', 'bear', 'beat', 'been', 'beer', 'bell', 'belt', 'best', 'bill', 'bird', 'bite', 'blow', 'blue', 'boat', 'body', 'boil', 'bold', 'bomb', 'bone', 'book', 'boom', 'boot', 'born', 'boss', 'both', 'bowl', 'boys', 'burn', 'bush', 'busy', 'call', 'calm', 'came', 'camp', 'card', 'care', 'cars', 'cart', 'case', 'cash', 'cast', 'cats', 'cave', 'chef', 'chip', 'city', 'club', 'coal', 'coat', 'code', 'coin', 'cold', 'come', 'cook', 'cool', 'cope', 'copy', 'core', 'corn', 'cost', 'crew', 'crop', 'cure', 'cute', 'dare', 'dark', 'data', 'date', 'days', 'dead', 'deal', 'dear', 'debt', 'deck', 'deep', 'deny', 'desk', 'diet', 'dirt', 'dish', 'disk', 'does', 'dogs', 'done', 'door', 'dose', 'down', 'draw', 'drew', 'drink', 'drop', 'drug', 'drum', 'dual', 'duke', 'dull', 'dust', 'duty', 'each', 'earn', 'ease', 'east', 'easy', 'edge', 'edit', 'else', 'even', 'ever', 'evil', 'exam', 'exit', 'eyes', 'face', 'fact', 'fail', 'fair', 'fall', 'fame', 'fans', 'farm', 'fast', 'fate', 'fear', 'feat', 'feed', 'feel', 'feet', 'fell', 'felt', 'file', 'fill', 'film', 'find', 'fine', 'fire', 'firm', 'fish', 'five', 'flag', 'flat', 'fled', 'flew', 'flip', 'flow', 'folk', 'food', 'foot', 'ford', 'form', 'fort', 'four', 'free', 'from', 'fuel', 'full', 'fund', 'gain', 'game', 'gang', 'gate', 'gave', 'gear', 'gene', 'gift', 'girl', 'give', 'glad', 'glow', 'goal', 'goat', 'gods', 'goes', 'gold', 'golf', 'gone', 'good', 'grab', 'gray', 'grew', 'grey', 'grip', 'grow', 'gulf', 'guns', 'guys', 'hair', 'half', 'hall', 'hand', 'hang', 'hard', 'harm', 'hate', 'have', 'head', 'heal', 'hear', 'heat', 'held', 'hell', 'help', 'here', 'hero', 'hide', 'high', 'hill', 'hint', 'hire', 'hold', 'hole', 'holy', 'home', 'hope', 'horn', 'horse', 'host', 'hour', 'huge', 'hung', 'hunt', 'hurt', 'idea', 'inch', 'info', 'into', 'iron', 'item', 'jack', 'jail', 'jazz', 'jean', 'jobs', 'john', 'join', 'joke', 'joy', 'jump', 'june', 'jury', 'just', 'keen', 'keep', 'kept', 'kick', 'kids', 'kill', 'kind', 'king', 'kiss', 'knee', 'knew', 'know', 'labs', 'lack', 'lady', 'laid', 'lake', 'land', 'lane', 'last', 'late', 'lawn', 'laws', 'lead', 'leaf', 'lean', 'left', 'legs', 'lend', 'lens', 'less', 'lets', 'life', 'lift', 'like', 'line', 'link', 'lion', 'lips', 'list', 'live', 'load', 'loan', 'lock', 'logo', 'long', 'look', 'lord', 'lose', 'loss', 'lost', 'lots', 'love', 'luck', 'made', 'mail', 'main', 'make', 'male', 'many', 'maps', 'mark', 'mass', 'mate', 'math', 'meal', 'mean', 'meat', 'meet', 'menu', 'mere', 'mess', 'mild', 'mile', 'milk', 'mind', 'mine', 'miss', 'mode', 'moon', 'more', 'most', 'move', 'much', 'must', 'myth', 'nail', 'name', 'navy', 'near', 'neck', 'need', 'nest', 'news', 'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose', 'note', 'noun', 'odds', 'okay', 'once', 'ones', 'only', 'onto', 'open', 'oral', 'oven', 'over', 'owed', 'owns', 'pace', 'pack', 'page', 'paid', 'pain', 'pair', 'palm', 'park', 'part', 'pass', 'past', 'path', 'peak', 'peer', 'pick', 'pine', 'pink', 'pipe', 'plan', 'play', 'plea', 'plot', 'plug', 'plus', 'poem', 'poet', 'pole', 'poll', 'pond', 'pool', 'poor', 'pope', 'port', 'pose', 'post', 'pour', 'pray', 'pull', 'pump', 'pure', 'push', 'race', 'rail', 'rain', 'rank', 'rare', 'rate', 'read', 'real', 'rear', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'ring', 'riot', 'rise', 'risk', 'road', 'rock', 'rode', 'role', 'roll', 'roof', 'room', 'root', 'rose', 'rule', 'rush', 'safe', 'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'same', 'sand', 'sang', 'save', 'says', 'seal', 'seat', 'seed', 'seek', 'seem', 'seen', 'self', 'sell', 'send', 'sent', 'sept', 'ship', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sign', 'silk', 'sink', 'site', 'size', 'skin', 'slip', 'slow', 'snow', 'soft', 'soil', 'sold', 'sole', 'some', 'song', 'soon', 'sort', 'soul', 'soup', 'spin', 'spot', 'star', 'stay', 'stem', 'step', 'stop', 'such', 'suit', 'sure', 'swim', 'tail', 'take', 'tale', 'talk', 'tall', 'tank', 'tape', 'task', 'taxi', 'team', 'tear', 'teen', 'tell', 'temp', 'tend', 'tent', 'term', 'test', 'text', 'than', 'that', 'them', 'then', 'they', 'thin', 'this', 'thus', 'tide', 'tied', 'till', 'time', 'tiny', 'tips', 'tire', 'told', 'toll', 'tone', 'tons', 'took', 'tool', 'tops', 'torn', 'tour', 'town', 'toys', 'trap', 'tree', 'trim', 'trip', 'true', 'tube', 'tune', 'turn', 'twin', 'type', 'ugly', 'unit', 'upon', 'used', 'user', 'uses', 'vary', 'vast', 'verb', 'very', 'vice', 'view', 'visa', 'vote', 'wade', 'wage', 'wait', 'wake', 'walk', 'wall', 'want', 'warm', 'warn', 'wars', 'wash', 'wave', 'ways', 'weak', 'wear', 'week', 'well', 'went', 'were', 'west', 'what', 'when', 'whom', 'wide', 'wife', 'wild', 'will', 'wind', 'wine', 'wing', 'wins', 'wire', 'wise', 'wish', 'with', 'wolf', 'wood', 'wool', 'word', 'wore', 'work', 'worn', 'wrap', 'yard', 'yeah', 'year', 'yoga', 'your', 'zero', 'zone', 'zoom',
    // 5+ letter words
    'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'among', 'angel', 'anger', 'angle', 'angry', 'anime', 'ankle', 'apart', 'apple', 'apply', 'arena', 'argue', 'arise', 'armor', 'arrow', 'asset', 'avoid', 'awake', 'award', 'aware', 'awful', 'basic', 'basis', 'beach', 'begun', 'being', 'below', 'bench', 'birth', 'black', 'blade', 'blame', 'blank', 'blast', 'blaze', 'blend', 'bless', 'blind', 'block', 'blood', 'blown', 'blues', 'board', 'boost', 'booth', 'bound', 'brain', 'brake', 'brand', 'brass', 'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad', 'broke', 'brown', 'brush', 'buddy', 'build', 'built', 'bunch', 'burst', 'buyer', 'cabin', 'cable', 'carry', 'catch', 'cause', 'chain', 'chair', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer', 'chess', 'chest', 'chief', 'child', 'chill', 'china', 'chips', 'chose', 'chunk', 'civic', 'civil', 'claim', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb', 'clock', 'close', 'cloth', 'cloud', 'coach', 'coast', 'color', 'couch', 'could', 'count', 'court', 'cover', 'crack', 'craft', 'crane', 'crash', 'crawl', 'crazy', 'cream', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'cruel', 'crush', 'curve', 'cycle', 'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'decay', 'delay', 'delta', 'dense', 'depth', 'dirty', 'disco', 'ditch', 'dough', 'doubt', 'dozen', 'draft', 'drain', 'drama', 'drank', 'drawn', 'dream', 'dress', 'dried', 'drift', 'drill', 'drive', 'drove', 'drunk', 'dying', 'eager', 'early', 'earth', 'eight', 'elbow', 'elder', 'elect', 'elite', 'email', 'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'essay', 'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false', 'fancy', 'fault', 'favor', 'feast', 'fence', 'fetch', 'fewer', 'fiber', 'field', 'fiery', 'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flame', 'flash', 'fleet', 'flesh', 'float', 'flood', 'floor', 'flour', 'flown', 'fluid', 'flush', 'focus', 'force', 'forge', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'fried', 'front', 'frost', 'fruit', 'funny', 'ghost', 'giant', 'given', 'glass', 'globe', 'glory', 'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'graph', 'grasp', 'grass', 'grave', 'great', 'green', 'greet', 'grief', 'grill', 'grind', 'gross', 'group', 'grove', 'grown', 'guard', 'guess', 'guest', 'guide', 'guilt', 'habit', 'happy', 'harsh', 'haste', 'haven', 'heart', 'heavy', 'hello', 'herbs', 'honey', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'hurry', 'ideal', 'image', 'imply', 'index', 'inner', 'input', 'irony', 'issue', 'ivory', 'jeans', 'jelly', 'jewel', 'joint', 'joker', 'jolly', 'judge', 'juice', 'juicy', 'jumbo', 'jumpy', 'karma', 'kayak', 'keeps', 'kicks', 'kills', 'kinds', 'kings', 'knock', 'known', 'knows', 'label', 'labor', 'lakes', 'lance', 'lands', 'lanes', 'large', 'laser', 'later', 'laugh', 'layer', 'leads', 'learn', 'lease', 'least', 'leave', 'legal', 'lemon', 'level', 'lever', 'light', 'liked', 'limit', 'lined', 'links', 'lions', 'lists', 'lived', 'liver', 'local', 'lodge', 'logic', 'loose', 'lords', 'loser', 'loses', 'lover', 'loves', 'lower', 'loyal', 'lucky', 'lunar', 'lunch', 'lying', 'lyric', 'magic', 'major', 'maker', 'makes', 'march', 'marry', 'match', 'maybe', 'mayor', 'medal', 'media', 'melon', 'mercy', 'merge', 'merit', 'metal', 'meter', 'micro', 'might', 'miles', 'minds', 'minor', 'minus', 'mixer', 'model', 'modem', 'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'moved', 'mover', 'moves', 'movie', 'music', 'naked', 'named', 'names', 'naval', 'needs', 'nerve', 'never', 'newer', 'newly', 'night', 'ninth', 'noble', 'noise', 'north', 'noted', 'notes', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'olive', 'omega', 'onion', 'opens', 'opera', 'opted', 'orbit', 'order', 'other', 'ought', 'outer', 'owned', 'owner', 'oxide', 'ozone', 'packs', 'pages', 'paint', 'pairs', 'panel', 'panic', 'pants', 'paper', 'parks', 'parts', 'party', 'pasta', 'paste', 'patch', 'pause', 'peace', 'peach', 'pearl', 'peers', 'penny', 'perks', 'peter', 'phase', 'phone', 'photo', 'piano', 'picks', 'piece', 'pilot', 'pinch', 'pitch', 'pizza', 'place', 'plain', 'plane', 'plans', 'plant', 'plate', 'plays', 'plaza', 'plead', 'pleas', 'plots', 'plugs', 'poems', 'poets', 'point', 'polar', 'poles', 'polls', 'ponds', 'pools', 'porch', 'ports', 'posed', 'poses', 'posts', 'pouch', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'probe', 'proof', 'prose', 'proud', 'prove', 'proxy', 'pulse', 'pumps', 'punch', 'pupil', 'puppy', 'purse', 'queen', 'query', 'quest', 'queue', 'quick', 'quiet', 'quirk', 'quota', 'quote', 'races', 'radar', 'radio', 'rails', 'raise', 'rally', 'range', 'ranks', 'rapid', 'rates', 'ratio', 'reach', 'reads', 'ready', 'realm', 'rebel', 'refer', 'reign', 'relax', 'relay', 'reply', 'reset', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'rings', 'riots', 'rises', 'risks', 'risky', 'rival', 'river', 'roads', 'robot', 'rocks', 'rocky', 'roles', 'rolls', 'roman', 'rooms', 'roots', 'roses', 'rough', 'round', 'route', 'royal', 'rugby', 'ruins', 'ruled', 'ruler', 'rules', 'rural', 'sadly', 'saint', 'salad', 'sales', 'sandy', 'sauce', 'saved', 'saves', 'scale', 'scare', 'scene', 'scope', 'score', 'scout', 'scrap', 'seals', 'seats', 'seeds', 'seeks', 'seems', 'sells', 'sends', 'sense', 'serve', 'setup', 'seven', 'shade', 'shake', 'shall', 'shame', 'shape', 'share', 'shark', 'sharp', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shiny', 'ships', 'shirt', 'shock', 'shoes', 'shook', 'shoot', 'shops', 'shore', 'short', 'shots', 'shout', 'shown', 'shows', 'sides', 'sight', 'sigma', 'signs', 'silly', 'since', 'sites', 'sixth', 'sixty', 'sized', 'sizes', 'skill', 'skins', 'skirt', 'slave', 'sleep', 'slept', 'slice', 'slide', 'sligh', 'slope', 'slots', 'small', 'smart', 'smell', 'smile', 'smoke', 'snake', 'sneak', 'solar', 'solid', 'solve', 'songs', 'sonic', 'sorry', 'sorts', 'souls', 'sound', 'south', 'space', 'spare', 'spark', 'spawn', 'speak', 'speed', 'spell', 'spend', 'spent', 'spice', 'spicy', 'spike', 'spine', 'split', 'spoke', 'spoon', 'sport', 'spots', 'spray', 'squad', 'stack', 'staff', 'stage', 'stake', 'stamp', 'stand', 'stark', 'stars', 'start', 'state', 'stats', 'stays', 'steal', 'steam', 'steel', 'steep', 'steer', 'stems', 'steps', 'stick', 'stiff', 'still', 'stock', 'stone', 'stood', 'stool', 'store', 'storm', 'story', 'stove', 'strap', 'straw', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'suits', 'sunny', 'super', 'surge', 'swamp', 'swear', 'sweat', 'sweep', 'sweet', 'swept', 'swift', 'swing', 'swiss', 'sword', 'table', 'taken', 'takes', 'tales', 'talks', 'tanks', 'tapes', 'tasks', 'taste', 'tasty', 'taxes', 'teach', 'teams', 'tears', 'teens', 'tells', 'tempo', 'tends', 'tense', 'tenth', 'tents', 'terms', 'tests', 'texts', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thief', 'thigh', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw', 'thumb', 'tidal', 'tides', 'tiger', 'tight', 'tiles', 'timer', 'times', 'tiny', 'tired', 'tires', 'title', 'toast', 'today', 'token', 'tolls', 'tones', 'tongue', 'tools', 'tooth', 'topic', 'torch', 'total', 'totals', 'touch', 'tough', 'tours', 'tower', 'towns', 'toxic', 'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trash', 'treat', 'trees', 'trend', 'trial', 'tribe', 'trick', 'tried', 'tries', 'trips', 'troop', 'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tubes', 'tummy', 'tunes', 'turns', 'tutor', 'twice', 'twins', 'twist', 'typed', 'types', 'ultra', 'uncle', 'under', 'union', 'unique', 'unite', 'unity', 'until', 'upper', 'upset', 'urban', 'urged', 'usage', 'users', 'using', 'usual', 'valid', 'value', 'valve', 'Vegas', 'venue', 'verge', 'verse', 'video', 'views', 'viral', 'virus', 'visit', 'vital', 'vivid', 'vocal', 'vodka', 'voice', 'votes', 'wages', 'wagon', 'waist', 'walks', 'walls', 'wants', 'warns', 'waste', 'watch', 'water', 'waves', 'wears', 'weary', 'weeks', 'weird', 'wells', 'welsh', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'wider', 'widow', 'width', 'wines', 'wings', 'wired', 'wires', 'witch', 'wives', 'woman', 'women', 'won\'t', 'woods', 'words', 'works', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'wrath', 'wreck', 'wrist', 'write', 'wrong', 'wrote', 'yacht', 'yards', 'years', 'yeast', 'yield', 'young', 'yours', 'youth', 'zebra', 'zeros', 'zones'
]);

// Check if a word is valid
export const isValidWord = (word) => {
    return VALID_WORDS.has(word.toLowerCase());
};

// Check if a word can be formed from available tiles
export const canFormWord = (word, availableTiles) => {
    const tiles = [...availableTiles];
    const letters = word.toUpperCase().split('');

    for (const letter of letters) {
        const index = tiles.findIndex(t => t.letter === letter);
        if (index === -1) return false;
        tiles.splice(index, 1);
    }
    return true;
};
