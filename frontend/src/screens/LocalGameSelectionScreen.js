import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import GameIcon from '../components/GameIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Game categories for organization (Sync with GameSelectionScreen)
const getGameCategories = (COLORS) => ({
    party: { name: 'Party Games', icon: 'ribbon', color: COLORS.hotPink },
    competitive: { name: 'Competitive', icon: 'trophy', color: COLORS.neonCyan },
    trivia: { name: 'Trivia & Knowledge', icon: 'bulb', color: COLORS.limeGlow },
    speed: { name: 'Speed Games', icon: 'flash', color: COLORS.electricPurple },
});

const getLocalGames = (COLORS) => [
    {
        id: 'trivia',
        name: 'Quick Trivia',
        description: 'Test your knowledge offline! Solo Sprint or Buzzer Battle.',
        icon: '🧠',
        color: COLORS.neonCyan,
        category: 'trivia',
        minPlayers: 1,
        maxPlayers: 4,
        vibes: ['brain']
    },
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
        id: 'real-talk',
        name: 'Real Talk',
        description: 'Deep questions and icebreakers',
        icon: '💬',
        color: COLORS.neonCyan,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['chill']
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
    },
    {
        id: 'tic-tac-toe',
        name: 'Tic-Tac-Toe',
        description: 'Classic strategy game vs AI',
        icon: '⭕',
        color: COLORS.electricPurple,
        category: 'competitive',
        minPlayers: 1,
        maxPlayers: 2,
        vibes: ['brain']
    }
];

const LocalGameSelectionScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { players, isSinglePlayer = false } = route.params;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // AI-compatible games (only these show in single-player mode)
    const AI_COMPATIBLE_GAMES = ['trivia', 'scrabble', 'tic-tac-toe', 'memory-match', 'speed-categories'];

    const filteredGames = React.useMemo(() => {
        let available = isSinglePlayer
            ? getLocalGames(COLORS).filter(game => AI_COMPATIBLE_GAMES.includes(game.id))
            : getLocalGames(COLORS).filter(game => game.id !== 'scrabble' && game.id !== 'tic-tac-toe');

        if (selectedCategory !== 'all') {
            available = available.filter(game => game.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            available = available.filter(game => 
                game.name.toLowerCase().includes(query) || 
                game.description.toLowerCase().includes(query)
            );
        }
        
        return available;
    }, [isSinglePlayer, searchQuery, selectedCategory, COLORS]);

    const handleSelectGame = (gameId) => {
        if (gameId === 'real-talk') {
            navigation.navigate('RealTalkCategory', { players, isSinglePlayer });
        } else if (gameId === 'truth-or-dare') {
            navigation.navigate('TruthOrDareCategorySelection', { players, isSinglePlayer });
        } else if (gameId === 'would-you-rather') {
            navigation.navigate('WouldYouRather', { players, isSinglePlayer });
        } else if (gameId === 'never-have-i-local') {
            navigation.navigate('NeverHaveIEverCategory', { players, isSinglePlayer });
        } else if (gameId === 'rapid-fire') {
            navigation.navigate('RapidFireCategory', { players, isSinglePlayer });
        } else if (gameId === 'scrabble') {
            if (isSinglePlayer) {
                navigation.navigate('ScrabbleDifficulty', { players, isSinglePlayer });
            } else {
                navigation.navigate('Scrabble', { players, isSinglePlayer });
            }
        } else if (gameId === 'speed-categories') {
            navigation.navigate('SpeedCategories', { players, isSinglePlayer });
        } else if (gameId === 'memory-chain') {
            navigation.navigate('MemoryChain', { players, isSinglePlayer });
        } else if (gameId === 'memory-match') {
            navigation.navigate('MemoryMatch', { players, isSinglePlayer });
        } else if (gameId === 'charades') {
            navigation.navigate('LocalCharades', { players, isSinglePlayer });
        } else if (gameId === 'tic-tac-toe') {
            if (isSinglePlayer) {
                navigation.navigate('TicTacToeDifficulty', { players, isSinglePlayer });
            } else {
                navigation.navigate('TicTacToe', { players, isSinglePlayer });
            }
        } else if (gameId === 'trivia') {
            navigation.navigate('LocalTrivia', { players, isSinglePlayer });
        }
    };

    const renderCategoryTab = (id, name, icon, color) => (
        <TouchableOpacity
            key={id}
            style={[
                styles.categoryTab,
                selectedCategory === id && { backgroundColor: color + '33', borderColor: color }
            ]}
            onPress={() => setSelectedCategory(id)}
        >
            <Ionicons name={icon} size={18} color={selectedCategory === id ? color : '#777'} />
            <NeonText size={12} color={selectedCategory === id ? color : '#777'} weight={selectedCategory === id ? 'bold' : 'normal'}>
                {name}
            </NeonText>
        </TouchableOpacity>
    );

    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleSelectGame(game.id)}
            disabled={game.comingSoon}
        >
            <GameIcon gameId={game.id} fallbackIcon={game.icon} size={null} style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', borderRadius: 12 }]} />
            <View style={styles.cardOverlay}>
                <View style={styles.cardHeader}>
                    <View style={styles.playerBadge}>
                        <Ionicons name="people" size={10} color="#fff" />
                        <NeonText size={10} color="#fff">{game.minPlayers || 2}-{game.maxPlayers || 10}</NeonText>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <NeonText size={16} weight="bold" color="#fff" glow variant="arcade">
                        {game.name.toUpperCase()}
                    </NeonText>
                    <NeonText size={9} color="rgba(255,255,255,0.7)" numberOfLines={1}>
                        {game.description}
                    </NeonText>
                </View>
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

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#555" style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Find a game..."
                    placeholderTextColor="#555"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
                {renderCategoryTab('all', 'All', 'grid', COLORS.neonCyan)}
                {Object.entries(getGameCategories(COLORS)).map(([id, cat]) =>
                    renderCategoryTab(id, cat.name, cat.icon, cat.color)
                )}
            </ScrollView>

            <View style={styles.gameGrid}>
                {filteredGames.map(renderGameCard)}
            </View>
            
            <View style={{ height: 60 }} />
        </NeonContainer >
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 15,
        height: 45,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 14, ...(Platform.OS === 'web' && { outlineStyle: 'none' }) },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    categoryScroll: { maxHeight: 45, marginBottom: 20 },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    gameGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        justifyContent: 'space-between',
    },
    gameCard: {
        width: SCREEN_WIDTH > 768 ? '23%' : '47%',
        aspectRatio: 1,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#0a0a1a',
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 6,
        justifyContent: 'space-between'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    playerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 3,
    },
    cardFooter: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 5,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.1)'
    },
});

export default LocalGameSelectionScreen;
