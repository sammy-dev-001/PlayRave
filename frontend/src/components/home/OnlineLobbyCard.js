import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';
import HapticService from '../../services/HapticService';
import SoundService from '../../services/SoundService';

const GradientButton = ({ title, subtitle, onPress, disabled }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
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
            disabled={disabled}
        >
            <Animated.View style={[styles.gradientBtnOuter, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                    colors={['#00D4AA', '#00B4D8', '#0096C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                >
                    <NeonText size={18} weight="bold" color={COLORS.white}>
                        {title}
                    </NeonText>
                    <NeonText size={11} color="rgba(255,255,255,0.7)" style={styles.btnSubtitle}>
                        {subtitle}
                    </NeonText>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
};

const OutlineButton = ({ title, subtitle, onPress, disabled }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
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
            disabled={disabled}
        >
            <Animated.View style={[styles.outlineBtn, { transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} weight="bold" color={COLORS.white}>
                    {title}
                </NeonText>
                <NeonText size={11} color="#6B7280" style={styles.btnSubtitle}>
                    {subtitle}
                </NeonText>
            </Animated.View>
        </TouchableOpacity>
    );
};

const OnlineLobbyCard = ({ onHostPress, onJoinPress, disabled }) => {
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
                <NeonText
                    size={13}
                    weight="bold"
                    color={COLORS.neonCyan}
                    style={styles.headerLabel}
                >
                    ONLINE LOBBY
                </NeonText>
                <NeonText size={16} color={COLORS.neonCyan}>⚡</NeonText>
            </View>

            {/* HOST PARTY Button */}
            <GradientButton
                title="HOST PARTY"
                subtitle="CREATE NEW SESSION"
                onPress={onHostPress}
                disabled={disabled}
            />

            {/* JOIN PARTY Button */}
            <OutlineButton
                title="JOIN PARTY"
                subtitle="ENTER ACCESS CODE"
                onPress={onJoinPress}
                disabled={disabled}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 248, 255, 0.2)',
        padding: 20,
        marginHorizontal: 20,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    headerLabel: {
        letterSpacing: 2,
    },
    gradientBtnOuter: {
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#00D4AA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    gradientBtn: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineBtn: {
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 248, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSubtitle: {
        marginTop: 3,
        letterSpacing: 1,
    },
});

export default React.memo(OnlineLobbyCard);
