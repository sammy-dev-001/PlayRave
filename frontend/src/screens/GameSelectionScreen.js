import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';
import GameIcon from '../components/GameIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH > 768;

// Game categories for organization
const GAME_CATEGORIES = {
    party: { name: '🎉 Party Games', color: COLORS.hotPink },
    competitive: { name: '🏆 Competitive', color: COLORS.neonCyan },
    trivia: { name: '🧠 Trivia & Knowledge', color: COLORS.limeGlow },
    speed: { name: '⚡ Speed Games', color: COLORS.electricPurple },
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
    },
    {
        id: 'never-have-i',
        name: 'Never Have I Ever',
        description: 'Confess your secrets - who has done it?',
        icon: '🤫',
        color: COLORS.limeGlow,
        category: 'party',
        minPlayers: 3,
        maxPlayers: 10,
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
    }
];




const GameSelectionScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { playerName } = route.params;
    const [selectedGame, setSelectedGame] = useState(null);
    const [waitingForNavigation, setWaitingForNavigation] = useState(false);

    // Process games into categories
    const gamesByCategory = React.useMemo(() => {
        const grouped = {};
        Object.keys(GAME_CATEGORIES).forEach(key => {
            grouped[key] = [];
        });

        AVAILABLE_GAMES.forEach(game => {
            if (grouped[game.category]) {
                grouped[game.category].push(game);
            }
        });
        return grouped;
    }, []);

    const handleGameSelect = async (game) => {
        if (waitingForNavigation) return;
        setWaitingForNavigation(true);
        setSelectedGame(game);

        try {
            console.log('Emitting game-selected:', game.id, 'for room:', room.roomId);
            SocketService.emit('game-selected', {
                roomId: room.roomId,
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
            if (waitingForNavigation.current && updatedRoom.gameType) {
                console.log('Navigating to lobby with updated room:', updatedRoom);
                waitingForNavigation.current = false;
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
    }, [navigation, playerName]);

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
                        <NeonText size={10} color="#FFF">👥 {game.minPlayers || 2}-{game.maxPlayers || 8}</NeonText>
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
            <View style={styles.container}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    Select a Game
                </NeonText>
                <NeonText size={14} color="#888" style={styles.subtitle}>
                    Room: {room.roomId} • Players: {room.players?.length || 0}
                </NeonText>

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
    title: {
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
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
    // Retain disabled logic if needed, but logic currently uses waitingForNavigation
    // which effectively disables the TouchableOpacity
});

export default GameSelectionScreen;
