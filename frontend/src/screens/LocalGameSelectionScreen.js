import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import GameIcon from '../components/GameIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Game categories for organization (Sync with GameSelectionScreen)
const GAME_CATEGORIES = {
    party: { name: '🎉 Party Games', color: COLORS.hotPink },
    competitive: { name: '🏆 Competitive', color: COLORS.neonCyan },
    trivia: { name: '🧠 Trivia & Knowledge', color: COLORS.limeGlow },
    speed: { name: '⚡ Speed Games', color: COLORS.electricPurple },
};

const LOCAL_GAMES = [
    {
        id: 'truth-or-dare',
        name: 'Truth or Dare',
        description: 'Classic party game - choose truth or dare!',
        icon: '🎭',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
    },
    {
        id: 'spin-bottle',
        name: 'Spin the Bottle',
        description: 'Spin to choose who does the dare',
        icon: '🍾',
        color: COLORS.neonCyan,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
    },
    {
        id: 'never-have-i-local',
        name: 'Never Have I Ever',
        description: 'Put fingers down if you have done it',
        icon: '🤫',
        color: COLORS.limeGlow,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
    },
    {
        id: 'kings-cup',
        name: "King's Cup",
        description: 'Classic drinking game with cards',
        icon: '👑',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        comingSoon: true
    },
    {
        id: 'would-you-rather',
        name: 'Would You Rather',
        description: 'Choose between two impossible choices',
        icon: '🤔',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
    },
    {
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: 'Quick questions, 5 seconds to answer!',
        icon: '⚡',
        color: COLORS.limeGlow,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
    },
    {
        id: 'scrabble',
        name: 'Word Builder',
        description: 'Create words from letter tiles!',
        icon: '📝',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 2,
        maxPlayers: 4,
    },
    {
        id: 'caption-this',
        name: 'Caption This',
        description: 'Write funny captions, vote for the best!',
        icon: '📸',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 8,
    },
    {
        id: 'speed-categories',
        name: 'Speed Categories',
        description: 'Name 5 things in 10 seconds!',
        icon: '🏃',
        color: COLORS.hotPink,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
    },
    {
        id: 'auction-bluff',
        name: 'Auction Bluff',
        description: 'Bid on items - real facts or bluffs?',
        icon: '🔨',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 3,
        maxPlayers: 8,
    },
    {
        id: 'memory-chain',
        name: 'Memory Chain',
        description: 'Remember the growing sequence!',
        icon: '🧠',
        color: COLORS.limeGlow,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
    },
    {
        id: 'hot-seat',
        name: 'Hot Seat',
        description: 'One person answers all questions',
        icon: '🔥',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        comingSoon: true
    },
    {
        id: 'memory-match',
        name: 'Memory Match',
        description: 'Find matching pairs - test your memory!',
        icon: '🧩',
        color: COLORS.electricPurple,
        category: 'speed',
        minPlayers: 1,
        maxPlayers: 4,
    }
];

const LocalGameSelectionScreen = ({ route, navigation }) => {
    const { players, isSinglePlayer = false } = route.params;

    // AI-compatible games (only these show in single-player mode)
    const AI_COMPATIBLE_GAMES = ['scrabble', 'memory-match', 'memory-chain', 'speed-categories'];

    // Process games into categories
    const gamesByCategory = React.useMemo(() => {
        const grouped = {};
        Object.keys(GAME_CATEGORIES).forEach(key => {
            grouped[key] = [];
        });

        // Filter available games first
        const available = isSinglePlayer
            ? LOCAL_GAMES.filter(game => AI_COMPATIBLE_GAMES.includes(game.id))
            : LOCAL_GAMES;

        available.forEach(game => {
            if (grouped[game.category]) {
                grouped[game.category].push(game);
            }
        });
        return grouped;
    }, [isSinglePlayer]);

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

    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { borderColor: game.color || COLORS.neonCyan }]}
            onPress={() => handleSelectGame(game.id)}
            disabled={game.comingSoon}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
                <GameIcon gameId={game.id} fallbackIcon={game.icon} size={80} />
            </View>
            <View style={styles.gameInfo}>
                <NeonText size={18} weight="bold" color={game.color}>{game.name}</NeonText>
                <NeonText size={12} color="#AAA" style={styles.description}>{game.description}</NeonText>

                <View style={styles.metaRow}>
                    <View style={styles.badge}>
                        <NeonText size={10} color="#FFF">👥 {game.minPlayers || 2}-{game.maxPlayers || 10}</NeonText>
                    </View>
                    {game.category === 'speed' && (
                        <View style={[styles.badge, { backgroundColor: '#FF3FA440' }]}>
                            <NeonText size={10} color="#FF3FA4">⚡ Fast</NeonText>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.arrowContainer}>
                <NeonText size={20} color={game.color}>→</NeonText>
            </View>
        </TouchableOpacity>
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

            <View style={styles.container}>
                {Object.entries(GAME_CATEGORIES).map(([key, category]) => {
                    const categoryGames = gamesByCategory[key];
                    if (!categoryGames || categoryGames.length === 0) return null;

                    return (
                        <View key={key} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <NeonText size={20} weight="bold" color={category.color} glow>
                                    {category.name}
                                </NeonText>
                                <View style={[styles.categoryLine, { backgroundColor: category.color }]} />
                            </View>
                            <View style={styles.gamesGrid}>
                                {categoryGames.map(renderGameCard)}
                            </View>
                        </View>
                    );
                })}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 5,
    },
    categorySection: {
        marginBottom: 30,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 15,
    },
    categoryLine: {
        flex: 1,
        height: 1,
        opacity: 0.5,
    },
    gamesGrid: {
        gap: 12,
    },
    gameCard: {
        gap: 15,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gameInfo: {
        flex: 1,
        gap: 4,
        alignItems: 'center',
    },
    description: {
        lineHeight: 16,
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    arrowContainer: {
        opacity: 0.5,
    },
});

export default LocalGameSelectionScreen;
