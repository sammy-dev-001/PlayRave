import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from '../NeonText';
import GameIcon from '../GameIcon';
import { useTheme } from '../../context/ThemeContext';

// Pretty name lookup
const GAME_NAMES = {
    'trivia': 'Quick Trivia',
    'truth-or-dare': 'Truth or Dare',
    'myth-or-fact': 'Myth or Fact',
    'never-have-i': 'Never Have I Ever',
    'never-have-i-ever': 'Never Have I Ever',
    'whos-most-likely': "Who's Most Likely",
    'neon-tap': 'Neon Tap',
    'word-rush': 'Word Rush',
    'whot': 'Naija Whot',
    'confession-roulette': 'Confession Roulette',
    'spill-the-tea': 'Spill The Tea',
    'imposter': 'Imposter',
    'hot-seat': 'Hot Seat',
    'hot-seat-mc': 'Hot Seat (MC)',
    'button-mash': 'Button Mash',
    'type-race': 'Type Race',
    'math-blitz': 'Math Blitz',
    'color-rush': 'Color Rush',
    'tic-tac-toe': 'Tic Tac Toe',
    'draw-battle': 'Draw Battle',
    'lie-detector': 'Lie Detector',
    'scrabble': 'Scrabble',
    'unpopular-opinions': 'Hot Takes',
    'auction-bluff': 'Auction Bluff',
    'speed-categories': 'Speed Categories',
    'memory-match': 'Memory Match',
    'kings-cup': "King's Cup",
};

const GAME_DESCRIPTIONS = {
    'trivia': 'Quick Trivia, Myth or Fact, and more.',
    'whos-most-likely': 'Vote for your friends',
    'scrabble': 'Classic word game.',
    'neon-tap': 'Fast reflexes only!',
    'word-rush': 'Type words fast.',
    'whot': 'Classic card game.',
    'truth-or-dare': 'Party classic.',
    'never-have-i-ever': 'Confess your secrets.',
    'whispers': 'Spill the tea.',
    'imposter': 'Find the traitor.',
    'unpopular-opinions': 'Agree or disagree?',
    'hot-seat': 'Challenges & Questions.',
    'hot-seat-mc': 'Challenges & Questions.',
    'button-mash': 'Tap as fast as you can.',
    'type-race': 'Sentence typing race.',
    'math-blitz': 'Rapid math challenges.',
    'color-rush': 'Match the colors fast.',
    'tic-tac-toe': 'Bracket tournament.',
    'draw-battle': 'Sketch and vote.',
    'caption-this': 'Funny image captions.',
    'auction-bluff': 'Bid and bluff.',
    'speed-categories': 'Category word race.',
    'memory-match': 'Flip and find pairs.',
    'myth-or-fact': 'Fact or fiction?',
};

const CurrentGameCard = ({ gameId, isHost, onChangeGame }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const gameName = GAME_NAMES[gameId] || gameId || 'No Game Selected';
    const gameDesc = GAME_DESCRIPTIONS[gameId] || 'Get ready to play!';

    return (
        <View style={styles.card}>
            <View style={styles.left}>
                <GameIcon gameId={gameId} size={44} style={styles.icon} />
                <View style={styles.textBlock}>
                    <NeonText size={10} color="#6B7280" weight="bold" style={styles.label}>
                        CURRENT GAME
                    </NeonText>
                    <NeonText size={16} weight="bold" color={COLORS.white} numberOfLines={1}>
                        {gameName}
                    </NeonText>
                    <NeonText size={12} color="#9CA3AF" numberOfLines={1} style={{ marginTop: 2 }}>
                        {gameDesc}
                    </NeonText>
                </View>
            </View>

            {isHost && (
                <TouchableOpacity onPress={onChangeGame}>
                    <NeonText size={13} weight="bold" color={COLORS.neonCyan}>
                        CHANGE GAME
                    </NeonText>
                </TouchableOpacity>
            )}
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginHorizontal: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    icon: {
        marginRight: 12,
        borderRadius: 10,
    },
    textBlock: {
        flex: 1,
    },
    label: {
        letterSpacing: 1.5,
        marginBottom: 2,
    },
});

export default React.memo(CurrentGameCard);
