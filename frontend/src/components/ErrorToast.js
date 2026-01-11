import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';
import ErrorService from '../services/ErrorService';

/**
 * Toast notification component for non-blocking error messages
 */
const ErrorToast = () => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [canRetry, setCanRetry] = useState(false);
    const [retryFn, setRetryFn] = useState(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        // Listen for errors
        const unsubscribe = ErrorService.addListener((logEntry) => {
            if (logEntry.severity !== 'low') {
                showToast(ErrorService.getUserMessage(logEntry), logEntry.context?.onRetry);
            }
        });

        return unsubscribe;
    }, []);

    const showToast = useCallback((msg, retry = null) => {
        setMessage(msg);
        setCanRetry(!!retry);
        setRetryFn(() => retry);
        setVisible(true);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto hide after 4 seconds
        setTimeout(() => {
            hideToast();
        }, 4000);
    }, [fadeAnim]);

    const hideToast = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            setMessage('');
            setRetryFn(null);
        });
    }, [fadeAnim]);

    const handleRetry = () => {
        if (retryFn) {
            retryFn();
        }
        hideToast();
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.toast}>
                <NeonText size={14} color={COLORS.white} style={styles.message}>
                    {message}
                </NeonText>
                <View style={styles.actions}>
                    {canRetry && (
                        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                            <NeonText size={12} color={COLORS.limeGlow} weight="bold">
                                RETRY
                            </NeonText>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={hideToast} style={styles.dismissButton}>
                        <NeonText size={14} color={COLORS.hotPink}>✕</NeonText>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 87, 170, 0.9)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    message: {
        flex: 1,
        marginRight: 10,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
    },
    dismissButton: {
        padding: 4,
    },
});

export default ErrorToast;
