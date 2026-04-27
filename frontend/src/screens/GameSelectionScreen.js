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
        description: 'Test your knowledge with rapid-fire questions',
        icon: '🧠',
        color: COLORS.neonCyan,
        category: 'trivia',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['brain']
    },
    {
        id: 'myth-or-fact',
        name: 'Myth or Fact',
        description: 'Separate truth from fiction',
        icon: '🤔',
        color: COLORS.hotPink,
        category: 'trivia',
        minPlayers: 2,
        maxPlayers: 10,
        vibes: ['brain', 'hype', 'chill']
    },
    {
        id: 'whos-most-likely',
        name: "Who's Most Likely To",
        description: 'Vote for your friends',
        icon: '👥',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['hype']
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
        description: 'Classic Nigerian card game',
        icon: '🃏',
        color: COLORS.electricPurple,
        category: 'competitive',
        minPlayers: 2,
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
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: 'Quick questions, faster answers!',
        icon: '⚡',
        color: COLORS.limeGlow,
        category: 'speed',
        minPlayers: 2,
        maxPlayers: 8,
        vibes: ['hype']
    },
    {
        id: 'confession-roulette',
        name: 'Confession Roulette',
        description: 'Anonymous confessions - guess who wrote it!',
        icon: '🎰',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill', 'hype']
    },
    {
        id: 'spill-the-tea',
        name: 'Spill The Tea',
        description: 'Anonymous secrets and hot takes',
        icon: '🍵',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill']
    },
    {
        id: 'imposter',
        name: 'Imposter',
        description: 'Find the player with the different word!',
        icon: '🕵️',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 4,
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
        name: 'Hot Seat',
        description: 'Ask anything - custom questions!',
        icon: '🪑',
        color: COLORS.hotPink,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill']
    },
    {
        id: 'hot-seat-mc',
        name: 'The Hot Seat',
        description: 'How well do they know you? Pick your answer, everyone guesses!',
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
        id: 'lie-detector',
        name: 'Lie Detector',
        description: 'Guess if they\'re lying!',
        icon: '🔍',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['chill']
    },
    {
        id: 'scrabble',
        name: 'Word Scrabble',
        description: 'Form words on the board - highest score wins!',
        icon: '🔤',
        color: COLORS.neonCyan,
        category: 'competitive',
        minPlayers: 2,
        maxPlayers: 4,
        vibes: ['brain']
    },
    {
        id: 'caption-this',
        name: 'Caption This',
        description: 'Write funny captions, vote for the best!',
        icon: '📸',
        color: COLORS.electricPurple,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
        vibes: ['hype']
    }
];




const GameSelectionScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { playerName } = route.params;
    const [selectedGame, setSelectedGame] = useState(null);
    const [waitingForNavigation, setWaitingForNavigation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVibe, setSelectedVibe] = useState('all');

    // Process games into categories
    const gamesByCategory = React.useMemo(() => {
        const grouped = {};
        Object.keys(GAME_CATEGORIES).forEach(key => {
            grouped[key] = [];
        });

        let available = AVAILABLE_GAMES;
        
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
    }, [searchQuery, selectedVibe]);

    const handleGameSelect = async (game) => {
        if (waitingForNavigation) return;

        // Hot Seat MC has its own category selection screen before start
        if (game.id === 'hot-seat-mc') {
            navigation.navigate('HotSeatCategory', {
                room,
                isHost: true,
                playerName,
            });
            return;
        }

        setWaitingForNavigation(true);
        setSelectedGame(game);

        try {
            console.log('Emitting game-selected:', game.id, 'for room:', room.id);
            SocketService.emit('game-selected', {
                roomId: room.id,
                gameId: game.id,
                gameName: game.name
            });
        } catch (error) {
            console.error('Error selecting game:', error);
            Alert.alert('Error', 'Failed to select game');
            setWaitingForNavigation(false);
        }
    };

    React.useEffect(() => {
        const onRoomUpdated = (updatedRoom) => {
            console.log('Room updated in GameSelection:', updatedRoom);
            setRoom(updatedRoom);

            // If we're waiting to navigate after setting game type, navigate now
            if (waitingForNavigation && updatedRoom.gameType) {
                console.log('Navigating to lobby with updated room:', updatedRoom);
                setWaitingForNavigation(false);
                navigation.navigate('Lobby', {
                    room: updatedRoom,
                    isHost: true,
                    playerName,
                    selectedGame: updatedRoom.gameType
                });
            }
        };

        SocketService.on('room-updated', onRoomUpdated);

        return () => {
            SocketService.off('room-updated', onRoomUpdated);
        };
    }, [navigation, playerName, waitingForNavigation]);

    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { borderColor: game.color || COLORS.neonCyan }]}
            onPress={() => handleGameSelect(game)}
            disabled={waitingForNavigation}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
                <GameIcon gameId={game.id} fallbackIcon={game.icon} size={80} />
            </View>
            <View style={styles.gameInfo}>
                <NeonText size={18} weight="bold" color={game.color}>{game.name}</NeonText>
                <NeonText size={12} color="#AAA" style={styles.description}>{game.description}</NeonText>

                <View style={styles.metaRow}>
                    <View style={styles.badge}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="people" size={12} color="#FFF" /><NeonText size={10} color="#FFF">{game.minPlayers || 2}-{game.maxPlayers || 8}</NeonText></View>
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
            <View style={styles.container}>
                <NeonText size={32} weight="bold" glow style={styles.title}>
                    SELECT GAME
                </NeonText>
                <NeonText size={14} color="#888" style={styles.subtitle}>
                    Room: {room.roomId} • Players: {room.players?.length || 0}
                </NeonText>

                {/* Smart Recommendations */}
                <SmartGameRecommendations
                    playerCount={room.players?.length || 2}
                    onSelectGame={(gameId) => {
                        const game = AVAILABLE_GAMES.find(g => g.id === gameId);
                        if (game) handleGameSelect(game);
                    }}
                />

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
        paddingTop: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        opacity: 0.7,
        letterSpacing: 1,
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
    categorySection: {
        marginBottom: 35,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        gap: 15,
    },
    categoryLine: {
        flex: 1,
        height: 1,
        opacity: 0.2,
    },
    gamesGrid: {
        gap: 15,
    },
    gameCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    gameInfo: {
        flex: 1,
        gap: 4,
    },
    description: {
        lineHeight: 16,
        opacity: 0.8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    arrowContainer: {
        paddingRight: 5,
        opacity: 0.6,
    },
});

export default GameSelectionScreen;
