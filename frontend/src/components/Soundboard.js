import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Sound definitions with web-compatible audio
const SOUNDS = {
    airhorn: { emoji: '📯', name: 'Airhorn', file: 'airhorn.mp3' },
    buzzer: { emoji: '❌', name: 'Buzzer', file: 'buzzer.mp3' },
    applause: { emoji: '👏', name: 'Applause', file: 'applause.mp3' },
    drumroll: { emoji: '🥁', name: 'Drumroll', file: 'drumroll.mp3' },
    tada: { emoji: '🎉', name: 'Ta-da!', file: 'tada.mp3' },
    sad: { emoji: '😢', name: 'Sad Trombone', file: 'sad.mp3' },
    laugh: { emoji: '😂', name: 'Laugh', file: 'laugh.mp3' },
    wow: { emoji: '😮', name: 'Wow', file: 'wow.mp3' },
};

// Soundboard button component
const SoundButton = ({ sound, onPress, disabled }) => (
    <TouchableOpacity
        style={[styles.soundButton, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <NeonText size={24}>{sound.emoji}</NeonText>
        <NeonText size={10} color="#888">{sound.name}</NeonText>
    </TouchableOpacity>
);

// Main Soundboard component
const Soundboard = ({ roomId, playerName, visible = true }) => {
    const [expanded, setExpanded] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const [lastPlayed, setLastPlayed] = useState(null);

    const playSound = (soundId) => {
        if (cooldown) return;

        SocketService.emit('play-sound', { roomId, soundId, playerName });
        setCooldown(true);
        setLastPlayed(soundId);

        // Play locally too
        playSoundLocally(soundId);

        setTimeout(() => setCooldown(false), 2000);
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {expanded ? (
                <View style={styles.soundboardPanel}>
                    <View style={styles.header}>
                        <NeonText size={14} weight="bold" color={COLORS.neonCyan}>
                            🔊 SOUNDBOARD
                        </NeonText>
                        <TouchableOpacity onPress={() => setExpanded(false)}>
                            <NeonText size={20}>✕</NeonText>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.soundGrid}>
                            {Object.entries(SOUNDS).map(([id, sound]) => (
                                <SoundButton
                                    key={id}
                                    sound={sound}
                                    onPress={() => playSound(id)}
                                    disabled={cooldown}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setExpanded(true)}
                >
                    <NeonText size={20}>🔊</NeonText>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Sound notification popup when someone plays a sound
const SoundNotification = ({ soundId, playerName, visible, onComplete }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible || !soundId) return null;

    const sound = SOUNDS[soundId];
    if (!sound) return null;

    return (
        <View style={styles.notification}>
            <NeonText size={30}>{sound.emoji}</NeonText>
            <NeonText size={12} color="#fff">
                {playerName} played {sound.name}
            </NeonText>
        </View>
    );
};

// Hook to listen for sound events
const useSoundboard = () => {
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const handleSound = ({ soundId, playerName, senderId }) => {
            // Don't show notification for own sounds
            if (senderId === SocketService.socket?.id) return;

            setNotification({ soundId, playerName });
            playSoundLocally(soundId);
        };

        SocketService.on('sound-played', handleSound);
        return () => SocketService.off('sound-played', handleSound);
    }, []);

    return {
        notification,
        clearNotification: () => setNotification(null),
    };
};

// Play sound locally (web compatible)
const playSoundLocally = (soundId) => {
    if (Platform.OS === 'web') {
        try {
            // Use Web Audio API or simple Audio element
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // For now, just log - actual audio files would be loaded here
            console.log('Playing sound:', soundId);
        } catch (e) {
            console.log('Sound not available');
        }
    }
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 15,
        zIndex: 998,
    },
    toggleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        justifyContent: 'center',
        alignItems: 'center',
    },
    soundboardPanel: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        padding: 12,
        maxWidth: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    soundGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    soundButton: {
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.4,
    },
    notification: {
        position: 'absolute',
        top: 80,
        alignSelf: 'center',
        backgroundColor: 'rgba(167, 139, 250, 0.9)',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 1000,
    },
});

export { Soundboard, SoundNotification, useSoundboard, SOUNDS };
export default Soundboard;
