import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';
import GameIcon from '../components/GameIcon';
import SmartGameRecommendations from '../components/SmartRecommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH > 768;

// Game categories for organization
const GAME_CATEGORIES = {
    party: { name: 'Party Games', icon: 'ribbon', color: COLORS.hotPink },
    competitive: { name: 'Competitive', icon: 'trophy', color: COLORS.neonCyan },
    trivia: { name: 'Trivia & Knowledge', icon: 'bulb', color: COLORS.limeGlow },
    speed: { name: 'Speed Games', icon: 'flash', color: COLORS.electricPurple },
};

const AVAILABLE_GAMES = [
    {
        id: 'trivia',
        name: 'Quick Trivia',
        description: 'Test your knowledge with rapid-fire questions & Myth or Fact.',
        icon: '🧠',
        color: COLORS.neonCyan,
        category: 'trivia',
        minPlayers: 1,
        maxPlayers: 10,
        vibes: ['brain']
    },
    {
        id: 'whos-most-likely',
        name: "Who's Most Likely To",
        description: 'Vote for your friends',
        icon: '👥',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['hype']
    },
    {
        id: 'scrabble',
        name: 'Classic Scrabble',
        description: 'The world\'s favorite word game.',
        icon: '🔤',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 2,
        maxPlayers: 4,
        vibes: ['brain']
    },
    {
        id: 'neon-tap',
        name: 'Neon Tap Frenzy',
        description: 'Test your reflexes - tap the circle first!',
        icon: '⚡',
        color: COLORS.limeGlow,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
        vibes: ['hype']
    },
    {
        id: 'word-rush',
        name: 'Word Rush',
        description: 'Type words fast - last one loses!',
        icon: '⚡',
        color: COLORS.hotPink,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 6,
        vibes: ['hype']
    },
    {
        id: 'whot',
        name: 'Naija Whot',
        description: 'Classic Nigerian card game (Supports AI Bots!)',
        icon: '🃏',
        color: COLORS.electricPurple,
        category: 'competitive',
        minPlayers: 1,
        maxPlayers: 8,
        vibes: ['chill']
    },
    {
        id: 'truth-or-dare',
        name: 'Truth or Dare',
        description: 'Take turns with truths and dares',
        icon: '🎲',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['hype']
    },
    {
        id: 'never-have-i-ever',
        name: 'Never Have I Ever',
        description: 'Confess your secrets - who has done it?',
        icon: '🤫',
        color: COLORS.limeGlow,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['hype']
    },
    {
        id: 'whispers',
        name: 'Whispers',
        description: 'Anonymous secrets, confessions, and hot takes.',
        icon: '🤫',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill', 'hype']
    },
    {
        id: 'imposter',
        name: 'Imposter',
        description: 'Find the player with the different word!',
        icon: '🕵️',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['hype']
    },
    {
        id: 'unpopular-opinions',
        name: 'Unpopular Opinions',
        description: 'Hot takes - agree or disagree?',
        icon: '🔥',
        color: COLORS.limeGlow,
        category: 'party',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['chill']
    },
    {
        id: 'hot-seat',
        name: 'The Hot Seat',
        description: 'Classic Questions, MC Mode, and Personal Challenges.',
        icon: '🔥',
        color: '#FF6B35',
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill']
    },
    {
        id: 'button-mash',
        name: 'Button Mash',
        description: 'Tap as fast as you can!',
        icon: '⚡',
        color: COLORS.limeGlow,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 6,
        vibes: ['hype']
    },
    {
        id: 'type-race',
        name: 'Type Race',
        description: 'Race to type sentences the fastest!',
        icon: '⌨️',
        color: COLORS.neonCyan,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 6,
        vibes: ['brain']
    },
    {
        id: 'math-blitz',
        name: 'Math Blitz',
        description: 'Quick math - first correct answer wins!',
        icon: '🧮',
        color: COLORS.hotPink,
        category: 'trivia',
        minPlayers: 2,
        maxPlayers: 8,
        vibes: ['brain']
    },
    {
        id: 'color-rush',
        name: 'Color Rush',
        description: 'Tap the matching color - don\'t get tricked!',
        icon: '🎨',
        color: COLORS.electricPurple,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 6,
        vibes: ['hype']
    },
    {
        id: 'tic-tac-toe',
        name: 'Tic-Tac-Toe',
        description: 'Bracket-style tournament!',
        icon: '⭕',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 2,
        maxPlayers: 8,
        vibes: ['brain']
    },
    {
        id: 'draw-battle',
        name: 'Draw Battle',
        description: 'Draw the prompt and vote for the best!',
        icon: '🎨',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 8,
        vibes: ['hype']
    },
    {
        id: 'caption-this',
        name: 'Caption This',
        description: 'Write the funniest caption for the image!',
        icon: '🖼️',
        color: COLORS.limeGlow,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['hype']
    },
    {
        id: 'auction-bluff',
        name: 'Auction Bluff',
        description: 'Bid on items, but don\'t get bluffed!',
        icon: '🔨',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 3,
        maxPlayers: 6,
        vibes: ['brain']
    },
    {
        id: 'speed-categories',
        name: 'Speed Categories',
        description: 'Type words in a category - don\'t repeat!',
        icon: '🔠',
        color: COLORS.electricPurple,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
        vibes: ['hype']
    }
];

const GameSelectionScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [waitingForNavigation, setWaitingForNavigation] = useState(false);

    const filteredGames = AVAILABLE_GAMES.filter(game => {
        const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
        const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             game.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleGameSelect = (game) => {
        if (waitingForNavigation) return;
        
        setWaitingForNavigation(true);
        
        // Hub Routing - redirect to special selection screens
        if (game.id === 'hot-seat') {
            navigation.navigate('HotSeatCategory', { room, playerName, isHost: true });
            return;
        }
        if (game.id === 'whispers') {
            navigation.navigate('WhispersHub', { room, playerName, isHost: true });
            return;
        }
        if (game.id === 'trivia') {
            navigation.navigate('TriviaHub', { room, playerName, isHost: true });
            return;
        }

        // Standard Game Selection
        SocketService.emit('game-selected', { roomId: room.id, gameType: game.id });
        navigation.navigate('Lobby', { room: { ...room, gameType: game.id }, playerName });
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
            <Ionicons name={icon} size={20} color={selectedCategory === id ? color : '#777'} />
            <NeonText size={14} color={selectedCategory === id ? color : '#777'} weight={selectedCategory === id ? 'bold' : 'normal'}>
                {name}
            </NeonText>
        </TouchableOpacity>
    );

    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { borderColor: game.color || COLORS.neonCyan }]}
            onPress={() => handleGameSelect(game)}
            disabled={waitingForNavigation}
        >
            <View style={styles.cardHeader}>
                <NeonText size={32} style={styles.gameIcon}>{game.icon}</NeonText>
                <View style={styles.playerBadge}>
                    <Ionicons name="people" size={12} color="#888" />
                    <NeonText size={10} color="#888">{game.minPlayers}-{game.maxPlayers}</NeonText>
                </View>
            </View>
            
            <NeonText size={18} weight="bold" color={game.color || COLORS.neonCyan} style={styles.gameName}>
                {game.name}
            </NeonText>
            
            <NeonText size={12} color="#aaa" style={styles.gameDesc} numberOfLines={2}>
                {game.description}
            </NeonText>

            <View style={styles.vibeContainer}>
                {game.vibes.map(vibe => (
                    <View key={vibe} style={styles.vibeBadge}>
                        <NeonText size={9} color="#777">{vibe.toUpperCase()}</NeonText>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>SELECT GAME</NeonText>
                <NeonText size={14} color="#777">Choose your next challenge</NeonText>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#555" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search games..."
                    placeholderTextColor="#555"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#555" />
                    </TouchableOpacity>
                )}
            </View>

            <SmartGameRecommendations room={room} onSelect={handleGameSelect} />

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
            >
                {renderCategoryTab('all', 'All Games', 'grid', COLORS.neonCyan)}
                {Object.entries(GAME_CATEGORIES).map(([id, cat]) => 
                    renderCategoryTab(id, cat.name, cat.icon, cat.color)
                )}
            </ScrollView>

            <View style={styles.gameGrid}>
                {filteredGames.map(renderGameCard)}
            </View>

            {filteredGames.length === 0 && (
                <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={64} color="#333" />
                    <NeonText size={18} color="#555" style={{ marginTop: 16 }}>No games found matching your search</NeonText>
                </View>
            )}

            <View style={styles.footer} />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    categoryScroll: {
        maxHeight: 50,
        marginBottom: 20,
    },
    categoryContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        gap: 8,
    },
    gameGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    gameCard: {
        width: isDesktop ? '31%' : '47%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    gameIcon: {
        marginBottom: 0,
    },
    playerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    gameName: {
        marginBottom: 4,
    },
    gameDesc: {
        lineHeight: 16,
        marginBottom: 12,
    },
    vibeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    vibeBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    noResults: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        paddingHorizontal: 40,
    },
    footer: {
        height: 40,
    }
});

export default GameSelectionScreen;
