import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const BackButton = ({ onPress }) => {
    const { COLORS } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => getStyles(COLORS, insets), [COLORS, insets]);
    const navigation = useNavigation();

    // Only show if we can go back
    if (!navigation.canGoBack()) {
        return null;
    }

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <TouchableOpacity
            style={styles.backButton}
            onPress={handlePress}
        >

            <Ionicons name="chevron-back" size={24} color={COLORS.neonCyan} />
        </TouchableOpacity>
    );
};

const getStyles = (COLORS, insets) => StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: Math.max(10, insets.top + 10),
        left: 10,
        zIndex: 100,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
});

export default BackButton;
