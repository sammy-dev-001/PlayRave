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
        color: COLORS.limeGlow
    },
    {
        id: 'rapid-fire',
        name: 'Rapid Fire',
        description: 'Quick questions, faster answers!',
        icon: '⚡',
        color: COLORS.limeGlow
    },
    {
        id: 'confession-roulette',
        name: 'Confession Roulette',
        description: 'Anonymous confessions - guess who wrote it!',
        icon: '🎰',
        color: COLORS.hotPink
    },
    {
        id: 'imposter',
        name: 'Imposter',
        description: 'Find the player with the different word!',
        icon: '🕵️',
        color: COLORS.electricPurple
    },
    {
        id: 'unpopular-opinions',
        name: 'Unpopular Opinions',
        description: 'Hot takes - agree or disagree?',
        icon: '🔥',
        color: COLORS.limeGlow
    },
    {
        id: 'hot-seat',
        name: 'Hot Seat',
        description: 'Ask anything - custom questions for the hot seat player!',
        icon: '🪑',
        color: COLORS.hotPink
    },
    {
        id: 'button-mash',
        name: 'Button Mash',
        description: 'Tap as fast as you can! Highest taps wins!',
        icon: '⚡',
        color: COLORS.limeGlow
    },
    {
        id: 'type-race',
        name: 'Type Race',
        description: 'Race to type sentences the fastest!',
        icon: '⌨️',
        color: COLORS.neonCyan
    },
    {
        id: 'math-blitz',
        name: 'Math Blitz',
        description: 'Quick math problems - first correct answer wins!',
        icon: '🧮',
        color: COLORS.hotPink
    },
    {
        id: 'color-rush',
        name: 'Color Rush',
        description: 'Tap the matching color - don\'t get tricked!',
        icon: '🎨',
        color: COLORS.electricPurple
    },
    {
        id: 'tic-tac-toe',
        name: 'Tic-Tac-Toe Tournament',
        description: 'Bracket-style tournament - last one standing wins!',
        icon: '⭕',
        color: COLORS.neonCyan
    },
    {
        id: 'draw-battle',
        name: 'Draw Battle',
        description: 'Draw the prompt and vote for the best!',
        icon: '🎨',
        color: COLORS.hotPink
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
                <NeonText size={28}>{game.icon}</NeonText>
            </View>
            <View style={styles.gameInfo}>
                <NeonText size={16} weight="bold" color={game.color}>
                    {game.name}
                </NeonText>
                <NeonText size={12} color="#999" style={{ marginTop: 3 }}>
                    {game.description}
                </NeonText>
                {game.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                        <NeonText size={10} color={COLORS.hotPink}>
                            COMING SOON
                        </NeonText>
                    </View>
                )}
            </View>
            {selectedGame === game.id && (
                <View style={styles.checkmark}>
                    <NeonText size={18}>✓</NeonText>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <NeonContainer
            showBackButton
            scrollable
            style={{ paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>ROOM CODE</NeonText>
                <NeonText size={28} weight="bold" glow color={COLORS.neonCyan}>
                    {room.id}
                </NeonText>
            </View>

            <NeonText size={22} weight="bold" style={styles.title}>
                SELECT A GAME
            </NeonText>

            <View style={styles.gamesList}>
                {AVAILABLE_GAMES.map(renderGameCard)}
            </View>

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

            <View style={styles.buttonContainer}>
                <NeonButton
                    title={selectedGame === 'trivia' && useCustomQuestions ? "CREATE QUESTIONS" : "CONTINUE TO LOBBY"}
                    onPress={handleContinue}
                    disabled={!selectedGame}
                    style={styles.continueButton}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 15,
    },
    gamesList: {
        marginBottom: 15,
    },
    gameCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
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
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    gameInfo: {
        flex: 1,
    },
    comingSoonBadge: {
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 0, 128, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    checkmark: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categorySection: {
        marginBottom: 15,
    },
    categoryTitle: {
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
    },
    categoryScroll: {
        maxHeight: 45,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 18,
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
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    continueButton: {
        marginBottom: 30, // Extra bottom margin for safe area
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default GameSelectionScreen;
