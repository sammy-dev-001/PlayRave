import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonText from '../NeonText';
import SoundService from '../../services/SoundService';
import { useTheme } from '../../context/ThemeContext';

const TopHeader = ({ onSettingsPress, onProfilePress, isAuthenticated }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [isSoundMuted, setIsSoundMuted] = useState(SoundService.getMuted());
    const [isMusicMuted, setIsMusicMuted] = useState(SoundService.getMusicMuted());

    useEffect(() => {
        SoundService.init();
        setIsSoundMuted(SoundService.getMuted());
        setIsMusicMuted(SoundService.getMusicMuted());
    }, []);

    const handleToggleMusic = async () => {
        const newMuted = await SoundService.toggleMusicMute();
        setIsMusicMuted(newMuted);
    };

    const handleToggleSound = async () => {
        const newMuted = await SoundService.toggleMute();
        setIsSoundMuted(newMuted);
    };

    return (
        <View style={styles.container}>
            {/* Left: Logo */}
            <View style={styles.logoRow}>
                <Image 
                    source={require('../../../assets/icon.png')} 
                    style={styles.logoImage} 
                    resizeMode="contain"
                />
                <NeonText size={20} weight="bold" color={COLORS.white} style={styles.logoText}>
                    PLAYRAVE
                </NeonText>
            </View>

            {/* Right: Icons */}
            <View style={styles.iconsRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={handleToggleMusic}>
                    <Ionicons
                        name={isMusicMuted ? 'musical-note' : 'musical-notes'}
                        size={20}
                        color={isMusicMuted ? '#555' : COLORS.neonCyan}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={handleToggleSound}>
                    <Ionicons
                        name={isSoundMuted ? 'volume-mute' : 'volume-high'}
                        size={20}
                        color={isSoundMuted ? '#555' : COLORS.limeGlow}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
                    <Ionicons name="settings-sharp" size={20} color="#8B8FA3" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoImage: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    logoText: {
        letterSpacing: 2,
    },
    iconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default React.memo(TopHeader);
