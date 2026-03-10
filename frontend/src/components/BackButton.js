import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name="chevron-back" size={24} color={COLORS.neonCyan} />
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
