import React, { useState, useEffect, useMemo } from 'react';
import {
    View, StyleSheet, Animated,
    Platform, TouchableOpacity
} from 'react-native';
import NeonText from './NeonText';
import SocketService, { ConnectionState } from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const ConnectionStatusOverlay = () => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const [state, setState] = useState(SocketService.connectionState);
    const [visible, setVisible] = useState(false);
    const [dismissedForCurrentState, setDismissedForCurrentState] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const unsubscribe = SocketService.onConnectionStateChange((newState) => {
            setState(newState);
            setDismissedForCurrentState(false);
            
            // Only show for non-connected states, or briefly show 'connected' then hide
            if (newState === ConnectionState.CONNECTED) {
                // If we were showing an error/reconnecting, show 'Connected' briefly
                if (visible) {
                    setTimeout(() => {
                        hide();
                    }, 2000);
                }
            } else {
                show();
            }
        });

        return unsubscribe;
    }, [visible]);

    const show = () => {
        setVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const hide = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => setVisible(false));
    };

    const handleDismiss = () => {
        setDismissedForCurrentState(true);
        hide();
    };

    if (!visible || dismissedForCurrentState) return null;

    const getStatusConfig = () => {
        switch (state) {
            case ConnectionState.CONNECTING:
            case ConnectionState.RECONNECTING:
                return {
                    text: 'RECONNECTING...',
                    color: COLORS.neonCyan,
                    subtitle: 'Hang tight, restoring your session'
                };
            case ConnectionState.ERROR:
            case ConnectionState.DISCONNECTED:
                return {
                    text: 'CONNECTION LOST',
                    color: COLORS.hotPink,
                    subtitle: 'Check your internet connection'
                };
            case ConnectionState.CONNECTED:
                return {
                    text: 'CONNECTED',
                    color: '#00FF00',
                    subtitle: 'Ready to play!'
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableOpacity 
                style={styles.container} 
                activeOpacity={0.8}
                onPress={handleDismiss}
            >
                <View style={[styles.banner, { borderColor: config.color }]}>
                    <NeonText 
                        size={14} 
                        weight="bold" 
                        color={config.color} 
                        glow
                    >
                        {config.text}
                    </NeonText>
                    <NeonText size={10} color="#AAA" style={styles.subtitle}>
                        {config.subtitle} (Tap to dismiss)
                    </NeonText>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
    },
    container: {
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    banner: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    subtitle: {
        marginTop: 4,
        textAlign: 'center',
    }
});

export default ConnectionStatusOverlay;
