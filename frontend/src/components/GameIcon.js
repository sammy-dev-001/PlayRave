import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import NeonText from './NeonText';

const gameIcons = {
    // Original Set
    'scrabble': require('../../assets/images/game_scrabble.png'),
    'whot': require('../../assets/images/game_whot.png'),
    'truth-or-dare': require('../../assets/images/game_truth_dare.png'),
    'trivia': require('../../assets/images/game_trivia.png'),
    'charades': require('../../assets/images/game_charades.png'),
    'never-have-i-ever': require('../../assets/images/game_never_have_i_ever.png'),
    'rapid-fire': require('../../assets/images/game_rapid_fire.png'),

    // Expanded Set
    'myth-or-fact': require('../../assets/images/game_myth_or_fact.png'),
    'whos-most-likely': require('../../assets/images/game_whos_most_likely.png'),
    'neon-tap': require('../../assets/images/game_neon_tap.png'),
    'word-rush': require('../../assets/images/game_word_rush.png'),
    'confession-roulette': require('../../assets/images/game_confession_roulette.png'),
    'imposter': require('../../assets/images/game_imposter.png'),
    'hot-seat': require('../../assets/images/game_hot_seat.png'),
    'math-blitz': require('../../assets/images/game_math_blitz.png'),
    'tic-tac-toe': require('../../assets/images/game_tic_tac_toe.png'),
    'draw-battle': require('../../assets/images/game_art.png'),
    'lie-detector': require('../../assets/images/game_lie_detector.png'),
    'kings-cup': require('../../assets/images/game_kings_cup.png'),
    'unpopular-opinions': require('../../assets/images/game_unpopular_opinions.png'),
};

// Aliases for reuse
const ALIASES = {
    'never-have-i': 'never-have-i-ever',
    'never-have-i-local': 'never-have-i-ever',
    'button-mash': 'neon-tap',
    'type-race': 'word-rush',
    'color-rush': 'neon-tap',
    'caption-this': 'draw-battle',
    'spin-bottle': 'truth-or-dare',
    'would-you-rather': 'myth-or-fact', // Reuse Scales
    'auction-bluff': 'kings-cup', // Reuse Cards/Chips vibe
    'memory-chain': 'trivia',
    'memory-match': 'trivia',
    'speed-categories': 'word-rush',
};

const GameIcon = ({ gameId, size = 60, style, fallbackIcon }) => {
    const useId = ALIASES[gameId] || gameId;
    const source = gameIcons[useId];

    if (source) {
        return (
            <Image
                source={source}
                style={[{ width: size, height: size, borderRadius: 12 }, style]}
                resizeMode="contain"
            />
        );
    }

    if (fallbackIcon) {
        return <NeonText size={size * 0.6}>{fallbackIcon}</NeonText>;
    }

    return null;
};

export default GameIcon;
