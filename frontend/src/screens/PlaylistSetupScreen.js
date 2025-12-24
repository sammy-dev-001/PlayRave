import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS, SHADOWS } from '../constants/theme';

// Available games for playlist
const AVAILABLE_GAMES = [
    { id: 'trivia', name: 'Quick Trivia', icon: '🧠', color: COLORS.neonCyan },
    { id: 'myth-or-fact', name: 'Myth or Fact', icon: '🤔', color: COLORS.hotPink },
    { id: 'whos-most-likely', name: "Who's Most Likely", icon: '👥', color: COLORS.electricPurple },
    { id: 'neon-tap', name: 'Neon Tap Frenzy', icon: '⚡', color: COLORS.limeGlow },
    { id: 'word-rush', name: 'Word Rush', icon: '⚡', color: COLORS.hotPink },
    { id: 'truth-or-dare', name: 'Truth or Dare', icon: '🎲', color: COLORS.hotPink },
    { id: 'never-have-i', name: 'Never Have I Ever', icon: '🤫', color: COLORS.limeGlow },
    { id: 'rapid-fire', name: 'Rapid Fire', icon: '⚡', color: COLORS.limeGlow },
];

const PlaylistSetupScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const [playlist, setPlaylist] = useState([]);
    const [showGamePicker, setShowGamePicker] = useState(false);

    const currentPlayerId = SocketService.socket?.id;
    const currentPlayer = room.players.find(p => p.id === currentPlayerId);
    const isHost = currentPlayer?.isHost || false;

    const handleAddGame = (game) => {
        if (playlist.length >= 10) {
            Alert.alert('Max Games', 'You can add up to 10 games in a playlist');
            return;
        }
        setPlaylist([...playlist, { ...game, playlistId: Date.now() }]);
        setShowGamePicker(false);
    };

    const handleRemoveGame = (playlistId) => {
        setPlaylist(playlist.filter(g => g.playlistId !== playlistId));
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newPlaylist = [...playlist];
        [newPlaylist[index - 1], newPlaylist[index]] = [newPlaylist[index], newPlaylist[index - 1]];
        setPlaylist(newPlaylist);
    };

    const handleMoveDown = (index) => {
        if (index === playlist.length - 1) return;
        const newPlaylist = [...playlist];
        [newPlaylist[index], newPlaylist[index + 1]] = [newPlaylist[index + 1], newPlaylist[index]];
        setPlaylist(newPlaylist);
    };

    const handleStartPlaylist = () => {
        if (playlist.length < 2) {
            Alert.alert('Add More Games', 'Add at least 2 games to create a playlist');
            return;
        }

        // Save playlist and navigate to lobby
        SocketService.emit('set-playlist', {
            roomId: room.id,
            playlist: playlist.map(g => ({ id: g.id, name: g.name }))
        });

        navigation.navigate('Lobby', {
            room: { ...room, playlist },
            isHost: true,
            playerName,
            selectedGame: playlist[0].id,
            isPlaylistMode: true,
            playlistGames: playlist
        });
    };

    const renderPlaylistItem = ({ item, index }) => (
        <View style={[styles.playlistItem, { borderColor: item.color }]}>
            <View style={styles.playlistNumber}>
                <NeonText size={20} weight="bold" color={COLORS.neonCyan}>
                    {index + 1}
                </NeonText>
            </View>

            <View style={styles.itemIcon}>
                <NeonText size={28}>{item.icon}</NeonText>
            </View>

            <View style={styles.itemInfo}>
                <NeonText size={16} weight="bold">{item.name}</NeonText>
            </View>

            <View style={styles.itemControls}>
                <TouchableOpacity
                    style={styles.moveBtn}
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                >
                    <NeonText size={16} color={index === 0 ? '#444' : COLORS.neonCyan}>▲</NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.moveBtn}
                    onPress={() => handleMoveDown(index)}
                    disabled={index === playlist.length - 1}
                >
                    <NeonText size={16} color={index === playlist.length - 1 ? '#444' : COLORS.neonCyan}>▼</NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveGame(item.playlistId)}
                >
                    <NeonText size={16} color={COLORS.hotPink}>✕</NeonText>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderGameOption = ({ item }) => (
        <TouchableOpacity
            style={[styles.gameOption, { borderColor: item.color }]}
            onPress={() => handleAddGame(item)}
        >
            <NeonText size={32}>{item.icon}</NeonText>
            <NeonText size={14} weight="bold" style={styles.gameOptionName}>
                {item.name}
            </NeonText>
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow>
                    🎵 PARTY PLAYLIST
                </NeonText>
                <NeonText size={14} color="#888" style={styles.subtitle}>
                    Queue up games for non-stop fun!
                </NeonText>
            </View>

            {/* Playlist Summary */}
            <View style={styles.summary}>
                <NeonText size={24} weight="bold" color={COLORS.limeGlow}>
                    {playlist.length}
                </NeonText>
                <NeonText size={14} color="#888"> games queued</NeonText>
            </View>

            {/* Current Playlist */}
            {playlist.length > 0 ? (
                <FlatList
                    data={playlist}
                    keyExtractor={item => String(item.playlistId)}
                    renderItem={renderPlaylistItem}
                    style={styles.playlistList}
                    contentContainerStyle={styles.playlistContent}
                />
            ) : (
                <View style={styles.emptyState}>
                    <NeonText size={48}>📋</NeonText>
                    <NeonText size={16} color="#888" style={styles.emptyText}>
                        No games added yet
                    </NeonText>
                    <NeonText size={12} color="#555">
                        Tap "Add Game" to build your playlist
                    </NeonText>
                </View>
            )}

            {/* Add Game Button */}
            <NeonButton
                title="+ ADD GAME"
                onPress={() => setShowGamePicker(true)}
                variant="secondary"
                style={styles.addButton}
            />

            {/* Game Picker */}
            {showGamePicker && (
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                            <NeonText size={20} weight="bold">SELECT GAME</NeonText>
                            <TouchableOpacity onPress={() => setShowGamePicker(false)}>
                                <NeonText size={24} color={COLORS.hotPink}>✕</NeonText>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={AVAILABLE_GAMES}
                            keyExtractor={item => item.id}
                            renderItem={renderGameOption}
                            numColumns={2}
                            contentContainerStyle={styles.gameGrid}
                        />
                    </View>
                </View>
            )}

            {/* Start Button */}
            {isHost && playlist.length >= 2 && (
                <NeonButton
                    title="🚀 START PLAYLIST"
                    onPress={handleStartPlaylist}
                    style={styles.startButton}
                />
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    subtitle: {
        marginTop: 10,
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 15,
    },
    playlistList: {
        flex: 1,
    },
    playlistContent: {
        paddingBottom: 20,
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
    },
    playlistNumber: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: 'rgba(0,248,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemIcon: {
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemControls: {
        flexDirection: 'row',
        gap: 8,
    },
    moveBtn: {
        padding: 8,
    },
    removeBtn: {
        padding: 8,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 15,
        marginBottom: 5,
    },
    addButton: {
        marginVertical: 10,
    },
    startButton: {
        marginTop: 5,
    },
    pickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    pickerContainer: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    gameGrid: {
        gap: 10,
    },
    gameOption: {
        flex: 1,
        margin: 5,
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        alignItems: 'center',
    },
    gameOptionName: {
        marginTop: 10,
        textAlign: 'center',
    }
});

export default PlaylistSetupScreen;
