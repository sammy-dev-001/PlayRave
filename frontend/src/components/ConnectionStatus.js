import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const ConnectionStatus = ({ showLabel = true, size = 'small' }) => {
    const [status, setStatus] = useState('connecting'); // connecting, connected, disconnected, reconnecting
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start pulse animation for connecting/reconnecting states
        const startPulse = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.4,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        if (status === 'connecting' || status === 'reconnecting') {
            startPulse();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status, pulseAnim]);

    useEffect(() => {
        const checkConnection = () => {
            if (SocketService.socket?.connected) {
                setStatus('connected');
            } else if (SocketService.socket) {
                setStatus('connecting');
            }
        };

        // Initial check
        checkConnection();

        // Set up socket event listeners
        const onConnect = () => {
            setStatus('connected');
            setReconnectAttempt(0);
        };

        const onDisconnect = () => {
            setStatus('disconnected');
        };

        const onConnectError = () => {
            setStatus('reconnecting');
        };

        const onReconnectAttempt = (attempt) => {
            setReconnectAttempt(attempt);
            setStatus('reconnecting');
        };

        // Listen for socket events
        if (SocketService.socket) {
            SocketService.socket.on('connect', onConnect);
            SocketService.socket.on('disconnect', onDisconnect);
            SocketService.socket.on('connect_error', onConnectError);
            SocketService.socket.io?.on('reconnect_attempt', onReconnectAttempt);
        }

        // Poll for connection status changes
        const interval = setInterval(checkConnection, 1000);

        return () => {
            clearInterval(interval);
            if (SocketService.socket) {
                SocketService.socket.off('connect', onConnect);
                SocketService.socket.off('disconnect', onDisconnect);
                SocketService.socket.off('connect_error', onConnectError);
                SocketService.socket.io?.off('reconnect_attempt', onReconnectAttempt);
            }
        };
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    color: COLORS.limeGlow,
                    label: 'Online',
                    showDot: true,
                };
            case 'connecting':
                return {
                    color: COLORS.neonYellow || '#FFD700',
                    label: 'Connecting...',
                    showDot: true,
                };
            case 'reconnecting':
                return {
                    color: COLORS.neonYellow || '#FFD700',
                    label: reconnectAttempt > 0 ? `Reconnecting (${reconnectAttempt})...` : 'Reconnecting...',
                    showDot: true,
                };
            case 'disconnected':
                return {
                    color: COLORS.hotPink,
                    label: 'Offline',
                    showDot: true,
                };
            default:
                return {
                    color: '#666',
                    label: 'Unknown',
                    showDot: false,
                };
        }
    };

    const config = getStatusConfig();
    const dotSize = size === 'small' ? 8 : 12;
    const fontSize = size === 'small' ? 10 : 12;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.dot,
                    {
                        backgroundColor: config.color,
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        opacity: pulseAnim,
                        shadowColor: config.color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                    },
                ]}
            />
            {showLabel && (
                <NeonText size={fontSize} color={config.color} style={styles.label}>
                    {config.label}
                </NeonText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        // Base styles applied inline
    },
    label: {
        opacity: 0.9,
    },
});

export default ConnectionStatus;
