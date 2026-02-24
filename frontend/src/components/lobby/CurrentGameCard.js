import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonText from '../NeonText';
import GameIcon from '../GameIcon';
import { COLORS } from '../../constants/theme';

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
    'rapid-fire': 'Rapid Fire',
    'confession-roulette': 'Confession Roulette',
    'imposter': 'Imposter',
    'hot-seat': 'Hot Seat',
    'button-mash': 'Button Mash',
    'type-race': 'Type Race',
    'math-blitz': 'Math Blitz',
    'color-rush': 'Color Rush',
    'tic-tac-toe': 'Tic Tac Toe',
    'draw-battle': 'Draw Battle',
    'lie-detector': 'Lie Detector',
    'scrabble': 'Scrabble',
    'unpopular-opinions': 'Unpopular Opinions',
    'kings-cup': "King's Cup",
};

const CurrentGameCard = ({ gameId, isHost, onChangeGame }) => {
    const gameName = GAME_NAMES[gameId] || gameId || 'No Game Selected';

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

const styles = StyleSheet.create({
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
