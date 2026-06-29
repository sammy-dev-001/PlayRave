import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import VoiceService from '../services/VoiceService';

const VoiceChatPanel = ({ roomId, playerName, visible = true }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS, theme), [COLORS, theme]);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(true); 
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        initVoice();
        return () => {
            VoiceService.leaveChannel();
        };
    }, []);

    useEffect(() => {
        if (isConnected && !isMuted) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isConnected, isMuted]);

    const initVoice = async () => {
        const available = await VoiceService.init();
        setIsAvailable(available);
    };

    const handlePress = async () => {
        if (!isConnected) {
            if (!roomId) return;
            const success = await VoiceService.joinChannel(`playrave-${roomId}`);
            setIsConnected(success);
            setIsMuted(false); 
        } else {
            const muted = VoiceService.toggleMute();
            setIsMuted(muted);
        }
    };

    const handleLongPress = async () => {
        if (isConnected) {
            await VoiceService.leaveChannel();
            setIsConnected(false);
        }
    };

    if (!visible || !isAvailable) return null;

    return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
                style={styles.button}
                onPress={handlePress}
                onLongPress={handleLongPress}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={!isConnected ? 'mic-outline' : (isMuted ? 'mic-off' : 'mic')}
                    size={20}
                    color={!isConnected ? COLORS.textDarkMuted : (isMuted ? '#ff4444' : COLORS.neonCyan)}
                />
            </TouchableOpacity>
        </Animated.View>
    );
};

const getStyles = (COLORS, theme) => StyleSheet.create({
    button: {
        padding: 8,
        backgroundColor: theme?.isGlass ? 'rgba(255,255,255,0.1)' : COLORS.overlayDark,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme?.isGlass ? 'rgba(255,255,255,0.4)' : COLORS.electricPurple,
    }
});

export default VoiceChatPanel;
