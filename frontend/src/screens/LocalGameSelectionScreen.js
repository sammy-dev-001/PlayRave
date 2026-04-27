import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import GameIcon from '../components/GameIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Game categories for organization (Sync with GameSelectionScreen)
const GAME_CATEGORIES = {
    party: { name: 'Party Games', icon: 'ribbon', color: COLORS.hotPink },
    competitive: { name: 'Competitive', icon: 'trophy', color: COLORS.neonCyan },
    trivia: { name: 'Trivia & Knowledge', icon: 'bulb', color: COLORS.limeGlow },
    speed: { name: 'Speed Games', icon: 'flash', color: COLORS.electricPurple },
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
        vibes: ['hype']
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
        vibes: ['hype']
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
        comingSoon: true,
        vibes: ['chill']
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
        vibes: ['chill']
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
        vibes: ['hype']
    },
    {
        id: 'scrabble',
        name: 'Scrabble',
        description: 'Create words from letter tiles!',
        icon: '📝',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 2,
        maxPlayers: 4,
        vibes: ['brain']
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
        vibes: ['hype']
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
        vibes: ['brain']
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
        vibes: ['brain']
    },
    {
        id: 'charades',
        name: 'Charades',
        description: 'Act it out — no words allowed! Pass the phone.',
        icon: '🎭',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['hype']
    }
];

const LocalGameSelectionScreen = ({ route, navigation }) => {
    const { players, isSinglePlayer = false } = route.params;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVibe, setSelectedVibe] = useState('all');

    // AI-compatible games (only these show in single-player mode)
    const AI_COMPATIBLE_GAMES = ['scrabble', 'memory-match', 'memory-chain', 'speed-categories'];

    // Process games into categories
    const gamesByCategory = React.useMemo(() => {
        const grouped = {};
        Object.keys(GAME_CATEGORIES).forEach(key => {
            grouped[key] = [];
        });

        // Filter available games first
        let available = isSinglePlayer
            ? LOCAL_GAMES.filter(game => AI_COMPATIBLE_GAMES.includes(game.id))
            : LOCAL_GAMES.filter(game => game.id !== 'scrabble');

        if (selectedVibe !== 'all') {
            available = available.filter(game => game.vibes && game.vibes.includes(selectedVibe));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            available = available.filter(game => 
                game.name.toLowerCase().includes(query) || 
                game.description.toLowerCase().includes(query)
            );
        }

        available.forEach(game => {
            if (grouped[game.category]) {
                grouped[game.category].push(game);
            }
        });
        return grouped;
    }, [isSinglePlayer, searchQuery, selectedVibe]);

    const handleSelectGame = (gameId) => {
        if (gameId === 'truth-or-dare') {
            navigation.navigate('TruthOrDareCategorySelection', { players });
        } else if (gameId === 'would-you-rather') {
            navigation.navigate('WouldYouRather', { players });
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
        } else if (gameId === 'speed-categories') {
            navigation.navigate('SpeedCategories', { players });
        } else if (gameId === 'memory-chain') {
            navigation.navigate('MemoryChain', { players });
        } else if (gameId === 'memory-match') {
            navigation.navigate('MemoryMatch', { players });
        } else if (gameId === 'charades') {
            navigation.navigate('LocalCharades', { players });
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="people" size={12} color="#FFF" /><NeonText size={10} color="#FFF">{game.minPlayers || 2}-{game.maxPlayers || 10}</NeonText></View>
                    </View>
                    {game.category === 'speed' && (
                        <View style={[styles.badge, { backgroundColor: '#FF3FA440' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="flash" size={12} color="#FF3FA4" /><NeonText size={10} color="#FF3FA4">Fast</NeonText></View>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={game.color} />
            </View>
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={SCREEN_WIDTH < 375 ? 26 : 32} weight="bold" glow>
                    {isSinglePlayer ? 'VS AI MODE' : 'CHOOSE GAME'}
                </NeonText>
                {isSinglePlayer
                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><NeonText size={14} color={COLORS.neonCyan}>1 player vs AI</NeonText><Ionicons name="hardware-chip-outline" size={16} color={COLORS.neonCyan} /></View>
                    : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><NeonText size={14} color={COLORS.neonCyan}>{players.length} players ready</NeonText><Ionicons name="game-controller" size={16} color={COLORS.neonCyan} /></View>
                }
            </View>

            <View style={styles.container}>
                <View style={styles.vibeContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeScroll}>
                        {[
                            { id: 'all', label: 'All Games', icon: 'apps' },
                            { id: 'hype', label: 'Hype', icon: 'flame' },
                            { id: 'chill', label: 'Chill', icon: 'cafe' },
                            { id: 'brain', label: 'Brain', icon: 'hardware-chip' }
                        ].map(vibe => (
                            <TouchableOpacity
                                key={vibe.id}
                                style={[
                                    styles.vibePill,
                                    selectedVibe === vibe.id && styles.vibePillSelected
                                ]}
                                onPress={() => setSelectedVibe(vibe.id)}
                            >
                                <Ionicons 
                                    name={vibe.icon} 
                                    size={16} 
                                    color={selectedVibe === vibe.id ? COLORS.background : COLORS.neonCyan} 
                                />
                                <NeonText 
                                    size={14} 
                                    color={selectedVibe === vibe.id ? COLORS.background : COLORS.neonCyan}
                                    weight={selectedVibe === vibe.id ? 'bold' : 'normal'}
                                >
                                    {vibe.label}
                                </NeonText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search games..."
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                    />
                </View>
                {Object.entries(GAME_CATEGORIES).map(([key, category]) => {
                    const categoryGames = gamesByCategory[key];
                    if (!categoryGames || categoryGames.length === 0) return null;

                    return (
                        <View key={key} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name={category.icon} size={18} color={category.color} /><NeonText size={20} weight="bold" color={category.color} glow>{category.name}</NeonText></View>
                                <View style={[styles.categoryLine, { backgroundColor: category.color }]} />
                            </View>
                            <View style={styles.gamesGrid}>
                                {categoryGames.map(renderGameCard)}
                            </View>
                        </View>
                    );
                })}
            </View>
        </NeonContainer >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    vibeContainer: {
        marginBottom: 20,
    },
    vibeScroll: {
        gap: 10,
        paddingHorizontal: 2,
    },
    vibePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    vibePillSelected: {
        backgroundColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingVertical: 12,
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
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
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
