import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOCAL_GAMES = [
    {
        id: 'truth-or-dare',
        name: 'Truth or Dare',
        description: 'Classic party game - choose truth or dare!',
        icon: '🎭',
        color: COLORS.hotPink
    },
    {
        id: 'spin-bottle',
        name: 'Spin the Bottle',
        description: 'Spin to choose who does the dare',
        icon: '🍾',
        color: COLORS.neonCyan
    },
    {
        id: 'never-have-i-local',
        name: 'Never Have I Ever',
        description: 'Put fingers down if you have done it',
        icon: '🤫',
        color: COLORS.limeGlow
    },
    {
        id: 'kings-cup',
        name: "King's Cup",
        description: 'Classic drinking game with cards',
        icon: '👑',
        color: COLORS.electricPurple,
        comingSoon: true
    },
    {
        id: 'would-you-rather',
        name: 'Would You Rather',
        description: 'Choose between two impossible choices',
        icon: '🤔',
        color: COLORS.hotPink
    },
    {
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: 'Quick questions, 5 seconds to answer!',
        icon: '⚡',
        color: COLORS.limeGlow
    },
    {
        id: 'scrabble',
        name: 'Word Builder',
        description: 'Create words from letter tiles!',
        icon: '📝',
        color: COLORS.neonCyan
    },
    {
        id: 'caption-this',
        name: 'Caption This',
        description: 'Write funny captions, vote for the best!',
        icon: '📸',
        color: COLORS.electricPurple
    },
    {
        id: 'speed-categories',
        name: 'Speed Categories',
        description: 'Name 5 things in 10 seconds!',
        icon: '🏃',
        color: COLORS.hotPink
    },
    {
        id: 'auction-bluff',
        name: 'Auction Bluff',
        description: 'Bid on items - real facts or bluffs?',
        icon: '🔨',
        color: COLORS.neonCyan
    },
    {
        id: 'memory-chain',
        name: 'Memory Chain',
        description: 'Remember the growing sequence!',
        icon: '🧠',
        color: COLORS.limeGlow
    },
    {
        id: 'hot-seat',
        name: 'Hot Seat',
        description: 'One person answers all questions',
        icon: '🔥',
        color: COLORS.hotPink,
        comingSoon: true
    },
    {
        id: 'memory-match',
        name: 'Memory Match',
        description: 'Find matching pairs - test your memory!',
        icon: '🧠',
        color: COLORS.neonCyan
    }
];

const LocalGameSelectionScreen = ({ route, navigation }) => {
    const { players, isSinglePlayer = false } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('normal');

    // AI-compatible games (only these show in single-player mode)
    // scrabble = vs AI opponent
    // memory-match, memory-chain, speed-categories = solo challenge modes
    const AI_COMPATIBLE_GAMES = ['scrabble', 'memory-match', 'memory-chain', 'speed-categories'];

    // Filter games based on single-player mode
    const availableGames = isSinglePlayer
        ? LOCAL_GAMES.filter(game => AI_COMPATIBLE_GAMES.includes(game.id))
        : LOCAL_GAMES;

    const handleSelectGame = (gameId) => {
        if (gameId === 'truth-or-dare') {
            navigation.navigate('TruthOrDareCategorySelection', { players });
        } else if (gameId === 'would-you-rather') {
            navigation.navigate('WouldYouRather', { players });
        } else if (gameId === 'spin-bottle') {
            navigation.navigate('SpinTheBottle', { players });
        } else if (gameId === 'never-have-i-local') {
            navigation.navigate('NeverHaveIEverCategory', { players });
        } else if (gameId === 'rapid-fire') {
            navigation.navigate('RapidFireCategory', { players });
        } else if (gameId === 'scrabble') {
            // For single player, go to difficulty selection first
            if (isSinglePlayer) {
                navigation.navigate('ScrabbleDifficulty', { players });
            } else {
                navigation.navigate('Scrabble', { players });
            }
        } else if (gameId === 'caption-this') {
            navigation.navigate('CaptionThis', { players });
        } else if (gameId === 'speed-categories') {
            navigation.navigate('SpeedCategories', { players });
        } else if (gameId === 'auction-bluff') {
            navigation.navigate('AuctionBluff', { players });
        } else if (gameId === 'memory-chain') {
            navigation.navigate('MemoryChain', { players });
        } else if (gameId === 'memory-match') {
            navigation.navigate('MemoryMatch', { players });
        }
    };

    const renderCategoryButton = (category, label, color) => (
        <TouchableOpacity
            key={category}
            style={[
                styles.categoryButton,
                selectedCategory === category && { borderColor: color, borderWidth: 2 }
            ]}
            onPress={() => setSelectedCategory(category)}
        >
            <NeonText
                size={16}
                weight={selectedCategory === category ? 'bold' : 'normal'}
                color={selectedCategory === category ? color : COLORS.white}
            >
                {label}
            </NeonText>
        </TouchableOpacity>
    );

    const renderGame = (game) => (
        <View
            key={game.id}
            style={[
                styles.gameCard,
                { borderColor: game.color }
            ]}
        >
            <View style={styles.gameHeader}>
                <NeonText size={48}>{game.icon}</NeonText>
                {game.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                        <NeonText size={10} color={COLORS.limeGlow}>
                            COMING SOON
                        </NeonText>
                    </View>
                )}
            </View>
            <NeonText size={22} weight="bold" style={styles.gameName}>
                {game.name}
            </NeonText>
            <NeonText size={14} color="#888" style={styles.gameDescription}>
                {game.description}
            </NeonText>
            <NeonButton
                title={game.comingSoon ? "COMING SOON" : "PLAY"}
                onPress={() => handleSelectGame(game.id)}
                disabled={game.comingSoon}
                style={styles.playButton}
            />
        </View>
    );

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={SCREEN_WIDTH < 375 ? 26 : 32} weight="bold" glow>
                    {isSinglePlayer ? 'VS AI MODE' : 'CHOOSE GAME'}
                </NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    {isSinglePlayer ? '1 player vs AI 🤖' : `${players.length} players ready 🎮`}
                </NeonText>
            </View>

            <ScrollView contentContainerStyle={styles.gamesContainer}>
                {availableGames.map(renderGame)}
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    subtitle: {
        marginTop: 10,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 20,
    },
    gamesContainer: {
        gap: 20,
        paddingBottom: 20,
    },
    gameCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        padding: 20,
        alignItems: 'center',
    },
    gameHeader: {
        position: 'relative',
        marginBottom: 15,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: -5,
        right: -30,
        backgroundColor: 'rgba(198, 255, 74, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
    },
    gameName: {
        marginBottom: 10,
        textAlign: 'center',
    },
    gameDescription: {
        marginBottom: 20,
        textAlign: 'center',
    },
    playButton: {
        minWidth: 150,
    },
    categoryContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    categoryLabel: {
        marginBottom: 10,
        textAlign: 'center',
    },
    categoryButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    categoryButton: {
        flex: 1,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.white,
        alignItems: 'center',
    }
});

export default LocalGameSelectionScreen;
