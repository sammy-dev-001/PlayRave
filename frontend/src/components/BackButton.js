import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const BackButton = () => {
    const navigation = useNavigation();

    // Only show if we can go back
    if (!navigation.canGoBack()) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
        >
            <NeonText size={24} color={COLORS.neonCyan} glow>
                ← Back
            </NeonText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 100,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
});

export default BackButton;
