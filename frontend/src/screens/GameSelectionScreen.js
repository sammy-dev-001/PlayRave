import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const AVAILABLE_GAMES = [
    {
        id: 'trivia',
        name: 'Quick Trivia',
        description: 'Test your knowledge with rapid-fire questions',
        icon: '🧠',
        color: COLORS.neonCyan
    },
    {
        id: 'myth-or-fact',
        name: 'Myth or Fact',
        description: 'Separate truth from fiction',
        icon: '🤔',
        color: COLORS.hotPink
    },
    {
        id: 'whos-most-likely',
        name: "Who's Most Likely To",
        description: 'Vote for your friends',
        icon: '👥',
        color: COLORS.electricPurple
    },
    {
        id: 'neon-tap',
        name: 'Neon Tap Frenzy',
        description: 'Test your reflexes - tap the circle first!',
        icon: '⚡',
        color: COLORS.limeGlow
    },
    {
        id: 'word-rush',
        name: 'Word Rush',
        description: 'Type words fast - last one loses!',
        icon: '⚡',
        color: COLORS.hotPink
    },
    {
        id: 'whot',
        name: 'Naija Whot',
        description: 'Classic Nigerian card game (2-8 players)',
        icon: '🃏',
        color: COLORS.electricPurple,
        maxPlayers: 8
    },
    {
        id: 'truth-or-dare',
        name: 'Truth or Dare',
        description: 'Take turns with truths and dares',
        icon: '🎲',
        color: COLORS.hotPink
    },
    {
        id: 'never-have-i',
        name: 'Never Have I Ever',
        description: 'Confess your secrets - who has done it?',
        icon: '🤫',
        color: COLORS.hotPink,
        comingSoon: true
    },
    {
        id: 'two-truths',
        name: 'Two Truths One Lie',
        description: 'Guess which statement is the lie',
        icon: '🎭',
        color: COLORS.neonCyan,
        comingSoon: true
    },
    {
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: 'Quick questions, faster answers!',
        icon: '⚡',
        color: COLORS.limeGlow,
        comingSoon: true
    },
    {
        id: 'emoji-charades',
        name: 'Emoji Charades',
        description: 'Guess the phrase from emojis',
        icon: '😎',
        color: COLORS.electricPurple,
        comingSoon: true
    },
    {
        id: 'drawing',
        name: 'Doodle Dash',
        description: 'Draw and guess in this creative challenge',
        icon: '🎨',
        color: COLORS.limeGlow,
        comingSoon: true
    },
    {
        id: 'music',
        name: 'Beat Battle',
        description: 'Guess the song from short clips',
        icon: '🎵',
        color: COLORS.neonCyan,
        comingSoon: true
    }
];




const GameSelectionScreen = ({ route, navigation }) => {
    const [room, setRoom] = useState(route.params.room);
    const { playerName } = route.params;
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [useCustomQuestions, setUseCustomQuestions] = useState(false);
    const waitingForNavigation = React.useRef(false);

    const CATEGORIES = [
        'All',
        'Art',
        'Entertainment',
        'General Knowledge',
        'Geography',
        'History',
        'Literature',
        'Math',
        'Nature',
        'Science',
        'Sports',
        'Technology'
    ];

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

    const handleSelectGame = (game) => {
        if (game.comingSoon) return;
        console.log('Game selected:', game.id);
        setSelectedGame(game.id);
    };

    const handleContinue = () => {
        console.log('handleContinue called, selectedGame:', selectedGame, 'category:', selectedCategory, 'useCustom:', useCustomQuestions);
        if (!selectedGame) return;

        // If using custom questions for trivia, navigate to custom questions screen
        if (selectedGame === 'trivia' && useCustomQuestions) {
            navigation.navigate('CustomQuestions', {
                room,
                playerName
            });
            return;
        }

        // Set flag to navigate when room-updated event arrives
        waitingForNavigation.current = true;
        console.log('Emitting set-game-type for room:', room.id, 'game:', selectedGame, 'category:', selectedCategory);

        // Emit to backend to save the game type
        SocketService.emit('set-game-type', {
            roomId: room.id,
            gameType: selectedGame
        });

        // Fallback: navigate after 2 seconds if room-updated doesn't arrive
        setTimeout(() => {
            if (waitingForNavigation.current) {
                console.log('Timeout reached, navigating with current room state');
                waitingForNavigation.current = false;
                navigation.navigate('Lobby', {
                    room: { ...room, gameType: selectedGame },
                    isHost: true,
                    playerName,
                    selectedGame
                });
            }
        }, 2000);
    };


    const renderGameCard = (game) => (
        <TouchableOpacity
            key={game.id}
            style={[
                styles.gameCard,
                selectedGame === game.id && styles.selectedCard,
                game.comingSoon && styles.disabledCard
            ]}
            onPress={() => handleSelectGame(game)}
            disabled={game.comingSoon}
        >
            <View style={styles.gameIcon}>
                <NeonText size={40}>{game.icon}</NeonText>
            </View>
            <View style={styles.gameInfo}>
                <NeonText size={20} weight="bold" color={game.color}>
                    {game.name}
                </NeonText>
                <NeonText size={14} color="#999" style={{ marginTop: 5 }}>
                    {game.description}
                </NeonText>
                {game.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                        <NeonText size={12} color={COLORS.hotPink}>
                            COMING SOON
                        </NeonText>
                    </View>
                )}
            </View>
            {selectedGame === game.id && (
                <View style={styles.checkmark}>
                    <NeonText size={24}>✓</NeonText>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>ROOM CODE</NeonText>
                <NeonText size={32} weight="bold" glow color={COLORS.neonCyan}>
                    {room.id}
                </NeonText>
            </View>

            <NeonText size={24} weight="bold" style={styles.title}>
                SELECT A GAME
            </NeonText>

            <ScrollView style={styles.gamesList} showsVerticalScrollIndicator={false}>
                {AVAILABLE_GAMES.map(renderGameCard)}
            </ScrollView>

            {selectedGame === 'trivia' && (
                <View style={styles.categorySection}>
                    <NeonText size={16} style={styles.categoryTitle}>SELECT CATEGORY</NeonText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category && styles.selectedCategoryChip
                                ]}
                                onPress={() => setSelectedCategory(category)}
                            >
                                <NeonText
                                    size={14}
                                    color={selectedCategory === category ? COLORS.limeGlow : COLORS.white}
                                >
                                    {category}
                                </NeonText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {selectedGame === 'trivia' && (
                <View style={styles.customToggleContainer}>
                    <NeonText size={16}>Use Custom Questions</NeonText>
                    <Switch
                        value={useCustomQuestions}
                        onValueChange={setUseCustomQuestions}
                        trackColor={{ false: '#3e3e3e', true: COLORS.neonCyan }}
                        thumbColor={useCustomQuestions ? COLORS.limeGlow : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                    />
                </View>
            )}

            <NeonButton
                title={selectedGame === 'trivia' && useCustomQuestions ? "CREATE QUESTIONS" : "CONTINUE TO LOBBY"}
                onPress={handleContinue}
                disabled={!selectedGame}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    gamesList: {
        flex: 1,
        marginBottom: 20,
    },
    gameCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    selectedCard: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
    },
    disabledCard: {
        opacity: 0.5,
    },
    gameIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    gameInfo: {
        flex: 1,
    },
    comingSoonBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 0, 128, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    checkmark: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categorySection: {
        marginBottom: 20,
    },
    categoryTitle: {
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    categoryScroll: {
        maxHeight: 50,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    selectedCategoryChip: {
        backgroundColor: 'rgba(198, 255, 74, 0.2)',
        borderColor: COLORS.limeGlow,
    },
    customToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    disabledButton: {
        opacity: 0.5,
    }
});

export default GameSelectionScreen;
