import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS } from '../constants/theme';

// Spotify Configuration
const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // User needs to set this
const REDIRECT_URI = 'playrave://spotify-callback';

// Party playlist presets
const PARTY_PLAYLISTS = [
    { id: '37i9dQZF1DXaXB8fQg7xif', name: '🎉 Party Mix', description: 'High energy hits' },
    { id: '37i9dQZF1DX0Yxoavh5qJV', name: '🔥 Hot Hits', description: 'Current bangers' },
    { id: '37i9dQZF1DX4JAvHpjipBk', name: '🎵 New Pop', description: 'Fresh tracks' },
    { id: '37i9dQZF1DX9XIFQuFvzM4', name: '🕺 Dance Party', description: 'Get moving' },
    { id: '37i9dQZF1DWY7IeIP1cdjF', name: '🎤 Throwback', description: '2000s classics' },
];

// Spotify Player Component
const SpotifyPlayer = ({ visible = true }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlaylists, setShowPlaylists] = useState(false);

    const connectSpotify = async () => {
        // Open Spotify auth
        const scopes = 'streaming user-read-currently-playing user-modify-playback-state';
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;

        if (Platform.OS === 'web') {
            window.open(authUrl, '_blank', 'width=400,height=600');
        } else {
            Linking.openURL(authUrl);
        }
    };

    const openPlaylist = async (playlistId) => {
        const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
        try {
            // Try to open in Spotify app first
            const spotifyAppUrl = `spotify:playlist:${playlistId}`;
            const canOpen = await Linking.canOpenURL(spotifyAppUrl);

            if (canOpen) {
                await Linking.openURL(spotifyAppUrl);
            } else {
                await Linking.openURL(spotifyUrl);
            }
        } catch (e) {
            await Linking.openURL(spotifyUrl);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                    🎵 Party Music
                </NeonText>
                {!showPlaylists && (
                    <TouchableOpacity onPress={() => setShowPlaylists(true)}>
                        <NeonText size={12} color={COLORS.neonCyan}>+ Playlists</NeonText>
                    </TouchableOpacity>
                )}
            </View>

            {showPlaylists && (
                <View style={styles.playlistsContainer}>
                    <View style={styles.playlistHeader}>
                        <NeonText size={12} color="#888">Quick Start Playlists</NeonText>
                        <TouchableOpacity onPress={() => setShowPlaylists(false)}>
                            <NeonText size={14} color={COLORS.hotPink}>✕</NeonText>
                        </TouchableOpacity>
                    </View>
                    {PARTY_PLAYLISTS.map((playlist) => (
                        <TouchableOpacity
                            key={playlist.id}
                            style={styles.playlistItem}
                            onPress={() => openPlaylist(playlist.id)}
                        >
                            <View style={styles.playlistInfo}>
                                <NeonText size={14} weight="bold">{playlist.name}</NeonText>
                                <NeonText size={10} color="#888">{playlist.description}</NeonText>
                            </View>
                            <NeonText size={16} color={COLORS.limeGlow}>▶</NeonText>
                        </TouchableOpacity>
                    ))}
                    <NeonText size={10} color="#666" style={styles.spotifyNote}>
                        Opens in Spotify app
                    </NeonText>
                </View>
            )}

            {!showPlaylists && (
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={styles.spotifyButton}
                        onPress={() => setShowPlaylists(true)}
                    >
                        <NeonText size={20}>🎧</NeonText>
                        <NeonText size={12}>Browse</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.spotifyButton}
                        onPress={() => Linking.openURL('https://open.spotify.com')}
                    >
                        <NeonText size={20}>🟢</NeonText>
                        <NeonText size={12}>Spotify</NeonText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// Mini player for game screens
const MiniMusicPlayer = ({ visible = true }) => {
    if (!visible) return null;

    return (
        <TouchableOpacity
            style={styles.miniPlayer}
            onPress={() => Linking.openURL('https://open.spotify.com')}
        >
            <NeonText size={16}>🎵</NeonText>
            <NeonText size={10} color="#888">Music</NeonText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
        padding: 15,
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    playlistsContainer: {
        marginTop: 10,
    },
    playlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginBottom: 8,
    },
    playlistInfo: {
        flex: 1,
    },
    spotifyNote: {
        textAlign: 'center',
        marginTop: 10,
    },
    controlsRow: {
        flexDirection: 'row',
        gap: 15,
        justifyContent: 'center',
    },
    spotifyButton: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        minWidth: 80,
    },
    miniPlayer: {
        position: 'absolute',
        top: 60,
        right: 70,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
        zIndex: 100,
    },
});

export { SpotifyPlayer, MiniMusicPlayer, PARTY_PLAYLISTS };
export default SpotifyPlayer;
