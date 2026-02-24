import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';
import HapticService from '../../services/HapticService';
import SoundService from '../../services/SoundService';

const ModeCard = ({ title, subtitle, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    const handlePress = () => {
        SoundService.playButtonClick();
        HapticService.buttonTap();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.cardTouchable}
        >
            <Animated.View
                style={[styles.modeCard, { transform: [{ scale: scaleAnim }] }]}
            >
                <NeonText size={16} weight="bold" color={COLORS.white}>
                    {title}
                </NeonText>
                <NeonText size={10} color="#6B7280" style={styles.subtitle}>
                    {subtitle}
                </NeonText>
            </Animated.View>
        </TouchableOpacity>
    );
};

const SecondaryModes = ({ onLocalPress, onLANPress }) => {
    return (
        <View style={styles.container}>
            <NeonText
                size={12}
                weight="bold"
                color="#6B7280"
                style={styles.sectionTitle}
            >
                SECONDARY MODES
            </NeonText>

            <View style={styles.row}>
                <ModeCard
                    title="LOCAL"
                    subtitle="SPLIT SCREEN"
                    onPress={onLocalPress}
                />
                <ModeCard
                    title="LAN"
                    subtitle="LOCAL NETWORK"
                    onPress={onLANPress}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        letterSpacing: 2,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    cardTouchable: {
        flex: 1,
    },
    modeCard: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        marginTop: 4,
        letterSpacing: 1,
    },
});

export default React.memo(SecondaryModes);
