import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, Animated,
    Platform
} from 'react-native';
import NeonText from './NeonText';
import SocketService, { ConnectionState } from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const ConnectionStatusOverlay = () => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [state, setState] = useState(SocketService.connectionState);
    const [visible, setVisible] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const unsubscribe = SocketService.onConnectionStateChange((newState) => {
            setState(newState);
            
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

    if (!visible) return null;

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
            <View style={styles.container}>
                <View style={[styles.banner, { borderColor: config.color }]}>
                    <NeonText 
                        size={18} 
                        weight="bold" 
                        color={config.color} 
                        glow
                    >
                        {config.text}
                    </NeonText>
                    <NeonText size={12} color="#AAA" style={styles.subtitle}>
                        {config.subtitle}
                    </NeonText>
                </View>
            </View>
        </Animated.View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.85)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    banner: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 15,
        borderWidth: 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    subtitle: {
        marginTop: 8,
        textAlign: 'center',
    }
});

export default ConnectionStatusOverlay;
