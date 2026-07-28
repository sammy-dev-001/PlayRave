import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import VoiceService from '../services/VoiceService';

const VoiceChatPanel = ({ roomId, playerName, visible = true }) => {
    const { COLORS, theme } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS, theme), [COLORS, theme]);

    // ── Sync with VoiceService singleton on mount ─────────────────────────
    // VoiceService persists across screens (lobby → game). We read its actual
    // current state instead of blindly defaulting to false/true, so the button
    // always reflects the real mic state.
    const [isAvailable, setIsAvailable] = useState(() => VoiceService.isInitialized);
    const [isConnected, setIsConnected] = useState(() => VoiceService.isJoined);
    const [isMuted, setIsMuted] = useState(() => VoiceService.isMuted);
    const [isRecovering, setIsRecovering] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isConnectedRef = useRef(VoiceService.isJoined);

    // Keep ref in sync with state for use in event listeners
    useEffect(() => {
        isConnectedRef.current = isConnected;
    }, [isConnected]);

    useEffect(() => {
        initVoice();
        // NOTE: Do NOT call leaveChannel on unmount here.
        // VoiceService is a singleton — leaving on unmount would kill the
        // mic when navigating between screens. The lobby manages the lifecycle.
    }, []);

    // ── Audio interruption recovery ────────────────────────────────────────
    // When the user returns to the app/tab after a phone call, the OS will have
    // seized the microphone. We detect this and restart the mic track automatically.
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Browser tab visibility change (covers phone call interruption on mobile browsers)
            const handleVisibilityChange = async () => {
                if (document.visibilityState === 'visible' && isConnectedRef.current) {
                    console.log('VoiceChatPanel: Tab regained focus — restarting mic track...');
                    setIsRecovering(true);
                    await VoiceService.restartMicTrack();
                    setIsRecovering(false);
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        } else {
            // Native: AppState active/background transitions
            const subscription = AppState.addEventListener('change', async (nextState) => {
                if (nextState === 'active' && isConnectedRef.current) {
                    console.log('VoiceChatPanel: App foregrounded — restarting mic track...');
                    setIsRecovering(true);
                    await VoiceService.restartMicTrack();
                    setIsRecovering(false);
                }
            });
            return () => subscription.remove();
        }
    }, []);

    useEffect(() => {
        if (isConnected && !isMuted && !isRecovering) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isConnected, isMuted, isRecovering]);

    const initVoice = async () => {
        // If already initialised (e.g. from lobby), just sync state — don't re-init
        if (VoiceService.isInitialized) {
            setIsAvailable(true);
            
            // Check if we silently disconnected (e.g., from backgrounding/reconnecting)
            if (VoiceService.isJoined) {
                setIsRecovering(true);
                const recovered = await VoiceService.rejoinChannel();
                setIsConnected(recovered);
                setIsRecovering(false);
            }
            return;
        }
        const available = await VoiceService.init();
        setIsAvailable(available);
    };

    const handlePress = async () => {
        if (!isConnected) {
            if (!roomId) return;
            const success = await VoiceService.joinChannel(`playrave-${roomId}`);
            setIsConnected(success);
            if (success) setIsMuted(false);
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

    // Choose the icon: recovering shows a spinner-like 'sync' icon
    const iconName = isRecovering
        ? 'sync-outline'
        : !isConnected
            ? 'mic-outline'
            : isMuted
                ? 'mic-off'
                : 'mic';

    const iconColor = isRecovering
        ? COLORS.electricPurple
        : !isConnected
            ? COLORS.textDarkMuted
            : isMuted
                ? '#ff4444'
                : COLORS.neonCyan;

    return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
                style={[styles.button, isRecovering && { borderColor: COLORS.electricPurple }]}
                onPress={handlePress}
                onLongPress={handleLongPress}
                disabled={isRecovering}
                activeOpacity={0.7}
            >
                <Ionicons name={iconName} size={20} color={iconColor} />
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
