import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonText from './NeonText';
import { useTheme } from '../context/ThemeContext';

const gameIcons = {
    'scrabble': require('../../assets/images/game_scrabble.png'),
    'neon-tap': require('../../assets/images/game_neon_tap.png'),
    'word-rush': require('../../assets/images/game_word_rush.png'),
    'color-rush': require('../../assets/images/game_color_rush.png'),
    'draw-battle': require('../../assets/images/game_art.png'),
    'myth-or-fact': require('../../assets/images/game_myth_or_fact.png'),
    'kings-cup': require('../../assets/images/game_kings_cup.png'),
    'hot-seat': require('../../assets/images/game_hot_seat.png'),
    'guess-number': require('../../assets/images/game_guess_number.png'),
    'tic-tac-toe': require('../../assets/images/game_tic_tac_toe.png'),
    'memory-match': require('../../assets/images/game_memory_match.png'),
    'memory-chain': require('../../assets/images/game_memory_chain.png'),
    'truth-or-dare': require('../../assets/images/game_truth_dare.png'),
    'never-have-i-ever': require('../../assets/images/game_never_have_i_ever.png'),
    'whos-most-likely': require('../../assets/images/game_whos_most_likely.png'),
    'whot': require('../../assets/images/game_whot.png'),
    'imposter': require('../../assets/images/game_imposter.png'),
    'lie-detector': require('../../assets/images/game_lie_detector.png'),
    'real-talk': require('../../assets/images/game_real_talk.png'),
    'unpopular-opinions': require('../../assets/images/game_unpopular_opinions.png'),
    'confession-roulette': require('../../assets/images/game_confession_roulette.png'),
    'spill-the-tea': require('../../assets/images/game_spill_the_tea.png'),
    'math-blitz': require('../../assets/images/game_math_blitz.png'),
    'charades': require('../../assets/images/game_charades.png'),
    'trivia': require('../../assets/images/game_trivia.png'),
    'rapid-fire': require('../../assets/images/game_rapid_fire.png'),
};

const ALIASES = {
    'button-mash': 'neon-tap',
    'type-race': 'word-rush',
    'caption-this': 'draw-battle',
    'would-you-rather': 'myth-or-fact', 
    'auction-bluff': 'kings-cup', 
    'speed-categories': 'word-rush',
    'hot-seat-mc': 'hot-seat',
};

const GameIcon = ({ gameId, size = 60, style, fallbackIcon }) => {
    const { COLORS } = useTheme();

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
        return (
            <View style={[{ width: size, height: size, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }, style]}>
                <Ionicons
                    name={fallbackIcon}
                    size={size * 0.6}
                    color={COLORS.neonCyan}
                />
            </View>
        );
    }

    return null;
};

export default GameIcon;
