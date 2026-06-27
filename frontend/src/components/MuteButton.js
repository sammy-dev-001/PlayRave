import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SoundService from '../services/SoundService';
import { useTheme } from '../context/ThemeContext';

const MuteButton = ({ style }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [isSoundMuted, setIsSoundMuted] = useState(SoundService.getMuted());
    const [isMusicMuted, setIsMusicMuted] = useState(SoundService.getMusicMuted());

    useEffect(() => {
        // Initialize sound service 
        SoundService.init();
        setIsSoundMuted(SoundService.getMuted());
        setIsMusicMuted(SoundService.getMusicMuted());
    }, []);

    const handleToggleSound = async () => {
        const newMuted = await SoundService.toggleMute();
        setIsSoundMuted(newMuted);
    };

    const handleToggleMusic = async () => {
        const newMuted = await SoundService.toggleMusicMute();
        setIsMusicMuted(newMuted);
    };

    return (
        <View style={[styles.container, style]}>
            {/* Sound Effects Toggle */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleToggleSound}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isSoundMuted ? 'volume-mute' : 'volume-high'}
                    size={20}
                    color={isSoundMuted ? COLORS.textDarkMuted : COLORS.limeGlow}
                />
            </TouchableOpacity>

            {/* Music Toggle */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleToggleMusic}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isMusicMuted ? 'musical-note' : 'musical-notes'}
                    size={20}
                    color={isMusicMuted ? COLORS.textDarkMuted : COLORS.neonCyan}
                />
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: 10,
        right: 20,
        flexDirection: 'row',
        gap: 8,
        zIndex: 100,
    },
    button: {
        padding: 8,
        backgroundColor: COLORS.overlayDark,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    }
});

export default MuteButton;
