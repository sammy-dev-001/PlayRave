import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, TextInput, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';
import { OnlineGamesRegistry } from '../data/GameRegistry';
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
    'rapid-fire': require('../../assets/images/game_rapid_fire.png'),
    'real-talk': require('../../assets/images/game_real_talk.png'),
    'guess-number': require('../../assets/images/game_guess_number.png')
};

const getGameCategories = (COLORS) => ({
    party: { name: 'Party', icon: 'ribbon', color: COLORS.hotPink },
    competitive: { name: 'Versus', icon: 'trophy', color: COLORS.neonCyan },
    trivia: { name: 'Knowledge', icon: 'bulb', color: COLORS.limeGlow },
    speed: { name: 'Speed', icon: 'flash', color: COLORS.electricPurple },
});

const GameSelectionScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const { COLORS } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [waitingForNavigation, setWaitingForNavigation] = useState(false);

    const filteredGames = React.useMemo(() => {
        let available = OnlineGamesRegistry;

        if (selectedCategory !== 'all') {
            available = available.filter(game => game.category === selectedCategory);
        }
        
        return available.filter(game => {
            const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                game.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const handleGameSelect = (game) => {
        if (waitingForNavigation) return;
        
        setWaitingForNavigation(true);
        setTimeout(() => setWaitingForNavigation(false), 2000);

        if (game.isHub) {
            navigation.navigate(game.routeComponent, { room, playerName, isHost: true });
        } else {
            SocketService.emit('game-selected', { roomId: room.id, gameType: game.id });
            navigation.navigate(game.routeComponent, { room: { ...room, gameType: game.id }, playerName });
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
                source={GAME_IMAGES[game.imageId || game.id] || GAME_IMAGES['trivia']}
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
