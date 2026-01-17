import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameIcon from '../components/GameIcon';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Available games for tournament
const TOURNAMENT_GAMES = [
    { id: 'trivia', name: 'Trivia', icon: '🧠', points: '10 per correct' },
    { id: 'would-you-rather', name: 'Would You Rather', icon: '🤔', points: 'Majority wins' },
    { id: 'whos-most-likely', name: "Who's Most Likely", icon: '👆', points: 'Votes = points' },
    { id: 'rapid-fire', name: 'Rapid Fire', icon: '⚡', points: 'Speed bonus' },
    { id: 'myth-or-fact', name: 'Myth or Fact', icon: '🔍', points: '10 per correct' },
    { id: 'imposter', name: 'Imposter', icon: '🕵️', points: 'Survival bonus' },
    { id: 'memory-chain', name: 'Memory Chain', icon: '🔗', points: 'Chain length' },
    { id: 'math-blitz', name: 'Math Blitz', icon: '🔢', points: 'Speed + accuracy' },
    { id: 'type-race', name: 'Type Race', icon: '⌨️', points: 'WPM score' },
    { id: 'word-rush', name: 'Word Rush', icon: '📝', points: 'Words found' },
];

const TournamentSetupScreen = ({ route, navigation }) => {
    const { room, playerName, isHost } = route.params;
    const [selectedGames, setSelectedGames] = useState([]);
    const [tournamentName, setTournamentName] = useState('Party Tournament');
    const [isCreating, setIsCreating] = useState(false);

    const toggleGame = (gameId) => {
        if (selectedGames.includes(gameId)) {
            setSelectedGames(prev => prev.filter(id => id !== gameId));
        } else if (selectedGames.length < 5) {
            setSelectedGames(prev => [...prev, gameId]);
        }
    };

    const moveGame = (index, direction) => {
        const newOrder = [...selectedGames];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < newOrder.length) {
            [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
            setSelectedGames(newOrder);
        }
    };

    const createTournament = () => {
        if (selectedGames.length < 2) return;

        setIsCreating(true);
        SocketService.emit('create-tournament', {
            roomId: room.id,
            gamePlaylist: selectedGames,
            tournamentName
        });

        // Listen for tournament created
        SocketService.once('tournament-created', ({ tournament }) => {
            setIsCreating(false);
            navigation.navigate('TournamentLobby', {
                room,
                playerName,
                isHost,
                tournament
            });
        });
    };

    return (
        <NeonContainer showBackButton>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow color={COLORS.electricPurple}>
                        🏆 CREATE TOURNAMENT
                    </NeonText>
                    <NeonText size={14} color="#888">
                        Select 2-5 games to play in order
                    </NeonText>
                </View>

                {/* Tournament Name */}
                <View style={styles.nameSection}>
                    <NeonText size={14} color="#888">Tournament Name</NeonText>
                    <TextInput
                        style={styles.nameInput}
                        value={tournamentName}
                        onChangeText={setTournamentName}
                        placeholder="Party Tournament"
                        placeholderTextColor="#555"
                        maxLength={30}
                    />
                </View>

                {/* Selected Games Order */}
                {selectedGames.length > 0 && (
                    <View style={styles.selectedSection}>
                        <NeonText size={14} weight="bold" color={COLORS.limeGlow}>
                            Game Order ({selectedGames.length}/5)
                        </NeonText>
                        <View style={styles.selectedList}>
                            {selectedGames.map((gameId, index) => {
                                const game = TOURNAMENT_GAMES.find(g => g.id === gameId);
                                return (
                                    <View key={gameId} style={styles.selectedItem}>
                                        <NeonText size={14} color={COLORS.neonCyan}>
                                            {index + 1}. {game?.icon} {game?.name}
                                        </NeonText>
                                        <View style={styles.orderButtons}>
                                            <TouchableOpacity
                                                onPress={() => moveGame(index, -1)}
                                                disabled={index === 0}
                                            >
                                                <NeonText size={14} color={index === 0 ? '#555' : '#fff'}>▲</NeonText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => moveGame(index, 1)}
                                                disabled={index === selectedGames.length - 1}
                                            >
                                                <NeonText size={14} color={index === selectedGames.length - 1 ? '#555' : '#fff'}>▼</NeonText>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => toggleGame(gameId)}>
                                                <NeonText size={14} color={COLORS.hotPink}>✕</NeonText>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Game Selection */}
                <View style={styles.gamesSection}>
                    <NeonText size={14} weight="bold" color="#888">
                        Available Games
                    </NeonText>
                    <View style={styles.gamesGrid}>
                        {TOURNAMENT_GAMES.map((game) => {
                            const isSelected = selectedGames.includes(game.id);
                            const orderNum = selectedGames.indexOf(game.id) + 1;

                            return (
                                <TouchableOpacity
                                    key={game.id}
                                    style={[
                                        styles.gameCard,
                                        isSelected && styles.gameCardSelected
                                    ]}
                                    onPress={() => toggleGame(game.id)}
                                >
                                    {isSelected && (
                                        <View style={styles.orderBadge}>
                                            <NeonText size={12} weight="bold" color="#000">
                                                {orderNum}
                                            </NeonText>
                                        </View>
                                    )}
                                    <GameIcon gameId={game.id} fallbackIcon={game.icon} size={40} />
                                    <NeonText size={12} weight="bold" numberOfLines={1}>
                                        {game.name}
                                    </NeonText>
                                    <NeonText size={9} color="#888">{game.points}</NeonText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Create Button */}
                {isHost && (
                    <NeonButton
                        title={isCreating ? "CREATING..." : `START TOURNAMENT (${selectedGames.length} games)`}
                        onPress={createTournament}
                        disabled={selectedGames.length < 2 || isCreating}
                        style={styles.createButton}
                    />
                )}
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    nameSection: {
        marginBottom: 20,
    },
    nameInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginTop: 8,
    },
    selectedSection: {
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
    },
    selectedList: {
        marginTop: 10,
        gap: 8,
    },
    selectedItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 10,
    },
    orderButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    gamesSection: {
        marginBottom: 30,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 15,
        justifyContent: 'center',
    },
    gameCard: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        position: 'relative',
    },
    gameCardSelected: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    orderBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.limeGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButton: {
        marginBottom: 40,
    },
});

export default TournamentSetupScreen;
