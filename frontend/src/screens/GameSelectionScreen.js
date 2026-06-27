import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, TextInput, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';

import SmartGameRecommendations from '../components/SmartRecommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH > 768;

const GAME_IMAGES = {
    'trivia': require('../../assets/images/game_trivia.png'),
    'whos-most-likely': require('../../assets/images/game_whos_most_likely.png'),
    'scrabble': require('../../assets/images/game_scrabble.png'),
    'neon-tap': require('../../assets/images/game_neon_tap.png'),
    'word-rush': require('../../assets/images/game_word_rush.png'),
    'whot': require('../../assets/images/game_whot.png'),
    'truth-or-dare': require('../../assets/images/game_truth_dare.png'),
    'never-have-i-ever': require('../../assets/images/game_never_have_i_ever.png'),
    'whispers': require('../../assets/images/game_spill_the_tea.png'),
    'imposter': require('../../assets/images/game_imposter.png'),
    'unpopular-opinions': require('../../assets/images/game_unpopular_opinions.png'),
    'hot-seat': require('../../assets/images/game_hot_seat.png'),
    'button-mash': require('../../assets/images/game_rapid_fire.png'),
    'type-race': require('../../assets/images/game_word_rush.png'),
    'math-blitz': require('../../assets/images/game_math_blitz.png'),
    'color-rush': require('../../assets/images/game_neon_tap.png'),
    'tic-tac-toe': require('../../assets/images/game_tic_tac_toe.png'),
    'draw-battle': require('../../assets/images/game_art.png'),
    'caption-this': require('../../assets/images/game_charades.png'),
    'auction-bluff': require('../../assets/images/game_kings_cup.png'),
    'speed-categories': require('../../assets/images/game_rapid_fire.png'),
    'memory-match': require('../../assets/images/game_memory_match.png'),
    'myth-or-fact': require('../../assets/images/game_myth_or_fact.png'),
    'rapid-fire': require('../../assets/images/game_rapid_fire.png')
};

const getGameCategories = (COLORS) => ({
    party: { name: 'Party', icon: 'ribbon', color: COLORS.hotPink },
    competitive: { name: 'Versus', icon: 'trophy', color: COLORS.neonCyan },
    trivia: { name: 'Knowledge', icon: 'bulb', color: COLORS.limeGlow },
    speed: { name: 'Speed', icon: 'flash', color: COLORS.electricPurple },
});

const getAvailableGames = (COLORS) => [
    { id: 'trivia', name: 'Trivia Hub', description: 'Quick Trivia, Myth or Fact, and more.', color: COLORS.neonCyan, category: 'trivia', minPlayers: 1, maxPlayers: 10, vibes: ['brain'] },
    { id: 'whos-most-likely', name: "Who's Most Likely To", description: 'Vote for your friends', color: COLORS.electricPurple, category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'] },
    { id: 'scrabble', name: 'Scrabble', description: 'Classic word game.', color: COLORS.neonCyan, category: 'competitive', minPlayers: 2, maxPlayers: 4, vibes: ['brain'] },
    { id: 'neon-tap', name: 'Neon Tap', description: 'Fast reflexes only!', color: COLORS.limeGlow, category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'] },
    { id: 'word-rush', name: 'Word Rush', description: 'Type words fast.', color: COLORS.hotPink, category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['hype'] },
    { id: 'whot', name: 'Naija Whot', description: 'Classic card game.', color: COLORS.electricPurple, category: 'competitive', minPlayers: 1, maxPlayers: 8, vibes: ['chill'] },
    { id: 'truth-or-dare', name: 'Truth or Dare', description: 'Party classic.', color: COLORS.hotPink, category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['hype'] },
    { id: 'never-have-i-ever', name: 'Never Have I Ever', description: 'Confess your secrets.', color: COLORS.limeGlow, category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'] },
    { id: 'whispers', name: 'Whispers Hub', description: 'Spill the tea.', color: COLORS.hotPink, category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['chill'] },
    { id: 'imposter', name: 'Imposter', description: 'Find the traitor.', color: COLORS.electricPurple, category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'] },
    { id: 'unpopular-opinions', name: 'Hot Takes', description: 'Agree or disagree?', color: COLORS.limeGlow, category: 'party', minPlayers: 2, maxPlayers: 10, vibes: ['chill'] },
    { id: 'hot-seat', name: 'The Hot Seat', description: 'Challenges & Questions.', color: '#FF6B35', category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['chill'] },
    { id: 'button-mash', name: 'Button Mash', description: 'Tap as fast as you can.', color: COLORS.limeGlow, category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['hype'] },
    { id: 'type-race', name: 'Type Race', description: 'Sentence typing race.', color: COLORS.neonCyan, category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['brain'] },
    { id: 'math-blitz', name: 'Math Blitz', description: 'Rapid math challenges.', color: COLORS.hotPink, category: 'trivia', minPlayers: 2, maxPlayers: 8, vibes: ['brain'] },
    { id: 'color-rush', name: 'Color Rush', description: 'Match the colors fast.', color: COLORS.electricPurple, category: 'speed', minPlayers: 2, maxPlayers: 6, vibes: ['hype'] },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Bracket tournament.', color: COLORS.neonCyan, category: 'competitive', minPlayers: 2, maxPlayers: 8, vibes: ['brain'] },
    { id: 'draw-battle', name: 'Draw Battle', description: 'Sketch and vote.', color: COLORS.hotPink, category: 'party', minPlayers: 3, maxPlayers: 8, vibes: ['hype'] },
    { id: 'caption-this', name: 'Caption This', description: 'Funny image captions.', color: COLORS.limeGlow, category: 'party', minPlayers: 3, maxPlayers: 10, vibes: ['hype'] },
    { id: 'auction-bluff', name: 'Auction Bluff', description: 'Bid and bluff.', color: COLORS.neonCyan, category: 'competitive', minPlayers: 3, maxPlayers: 6, vibes: ['brain'] },
    { id: 'speed-categories', name: 'Speed Categories', description: 'Category word race.', color: COLORS.electricPurple, category: 'speed', minPlayers: 2, maxPlayers: 8, vibes: ['hype'] },
    { id: 'memory-match', name: 'Memory Match', description: 'Flip and find pairs.', color: COLORS.limeGlow, category: 'competitive', minPlayers: 2, maxPlayers: 4, vibes: ['brain'] }
];

const GameSelectionScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const { COLORS } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [waitingForNavigation, setWaitingForNavigation] = useState(false);

    const filteredGames = getAvailableGames(COLORS).filter(game => {
        const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
        const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleGameSelect = (game) => {
        if (waitingForNavigation) return;
        setWaitingForNavigation(true);

        if (game.id === 'hot-seat') {
            SocketService.emit('game-selected', { roomId: room.id, gameType: 'hot-seat-mc' });
            navigation.navigate('Lobby', { room: { ...room, gameType: 'hot-seat-mc' }, playerName });
        } else if (game.id === 'whispers') {
            navigation.navigate('WhispersHub', { room, playerName, isHost: true });
        } else if (game.id === 'trivia') {
            navigation.navigate('TriviaHub', { room, playerName, isHost: true });
        } else {
            SocketService.emit('game-selected', { roomId: room.id, gameType: game.id });
            navigation.navigate('Lobby', { room: { ...room, gameType: game.id }, playerName });
        }
    };

    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => handleGameSelect(game)}
            disabled={waitingForNavigation}
        >
            <Image
                source={GAME_IMAGES[game.id] || GAME_IMAGES['trivia']}
                style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
                resizeMode="contain"
            />
            <View style={styles.cardOverlay}>
                <View style={styles.cardHeader}>
                    <View style={styles.playerBadge}>
                        <Ionicons name="people" size={10} color="#fff" />
                        <NeonText size={10} color="#fff">{game.minPlayers}-{game.maxPlayers}</NeonText>
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

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow variant="display">GAME ARCADE</NeonText>
                <NeonText size={14} color="#777">Experience the rave</NeonText>
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

            <SmartGameRecommendations room={room} onSelect={handleGameSelect} />

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
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: { marginTop: 20, marginBottom: 20, paddingHorizontal: 20 },
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
        width: isDesktop ? '23%' : '47%',
        aspectRatio: 1,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#0a0a1a',
    },
    cardImage: {
        flex: 1,
        justifyContent: 'flex-end'
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
    gameName: {
        marginBottom: 0,
        fontSize: 12
    }
});

export default GameSelectionScreen;
