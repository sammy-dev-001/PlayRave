import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowIndicator(true);
            // Hide after 3 seconds
            setTimeout(() => setShowIndicator(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowIndicator(true);
        };

        // Check initial status
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) {
            setShowIndicator(true);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showIndicator) return null;

    return (
        <View style={[
            styles.container,
            isOnline ? styles.online : styles.offline
        ]}>
            <NeonText size={12} color="#fff" weight="bold">
                {isOnline ? '✓ Back Online' : '⚠ Offline Mode'}
            </NeonText>
            {!isOnline && (
                <NeonText size={10} color="#fff" style={{ marginTop: 2 }}>
                    Some features may be limited
                </NeonText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: '50%',
        transform: [{ translateX: -100 }],
        width: 200,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    online: {
        backgroundColor: COLORS.limeGlow,
    },
    offline: {
        backgroundColor: COLORS.hotPink,
    },
});

export default OfflineIndicator;
