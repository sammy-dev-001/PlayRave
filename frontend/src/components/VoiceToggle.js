// VoiceToggle.js - Mute/unmute button for voice chat
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';
import VoiceService from '../services/VoiceService';

const VoiceToggle = ({ roomId, style }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isJoining, setIsJoining] = useState(true);

    useEffect(() => {
        const initVoice = async () => {
            try {
                const initialized = await VoiceService.init();
                if (initialized && roomId) {
                    await VoiceService.joinChannel(`playrave_${roomId}`);
                    setIsAvailable(true);
                }
            } catch (error) {
                console.error('VoiceToggle: Init error:', error);
            } finally {
                setIsJoining(false);
            }
        };

        initVoice();

        return () => {
            VoiceService.leaveChannel();
        };
    }, [roomId]);

    const handleToggle = () => {
        if (!isAvailable) return;

        const newMutedState = VoiceService.toggleMute();
        setIsMuted(newMutedState);
    };

    // Still joining
    if (isJoining) {
        return (
            <View style={[styles.container, styles.joining, style]}>
                <NeonText size={16}>🎙️</NeonText>
                <NeonText size={10} color="#888">...</NeonText>
            </View>
        );
    }

    // Voice not available (Agora not configured)
    if (!isAvailable) {
        return null;
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isMuted ? styles.muted : styles.active,
                style
            ]}
            onPress={handleToggle}
            activeOpacity={0.7}
        >
            <NeonText size={20}>
                {isMuted ? '🔇' : '🎙️'}
            </NeonText>
            <NeonText
                size={10}
                color={isMuted ? '#ff4444' : COLORS.limeGlow}
            >
                {isMuted ? 'MUTED' : 'LIVE'}
            </NeonText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        minWidth: 60,
    },
    active: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderColor: COLORS.limeGlow,
    },
    muted: {
        backgroundColor: 'rgba(255, 68, 68, 0.15)',
        borderColor: '#ff4444',
    },
    joining: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: '#888',
    },
});

export default VoiceToggle;
