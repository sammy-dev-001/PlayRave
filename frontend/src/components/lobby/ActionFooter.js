import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';
import HapticService from '../../services/HapticService';
import SoundService from '../../services/SoundService';

const AnimatedButton = ({ title, icon, onPress, style, textColor, disabled, children }) => {
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
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children || (
                    <View style={styles.btnContent}>
                        {icon && <NeonText size={18} color={textColor}>{icon}</NeonText>}
                        <NeonText size={17} weight="bold" color={textColor}>
                            {title}
                        </NeonText>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const ActionFooter = ({
    isHost,
    onStartGame,
    onTournament,
    onLeave,
    onReadyUp,
    isReady,
    disabled,
}) => {
    if (isHost) {
        return (
            <View style={styles.footer}>
                {/* START GAME — big cyan */}
                <AnimatedButton
                    title="START GAME"
                    icon="▷"
                    onPress={onStartGame}
                    style={styles.startBtn}
                    textColor={COLORS.white}
                    disabled={disabled}
                />

                {/* TOURNAMENT MODE — outline */}
                <AnimatedButton
                    title="TOURNAMENT MODE"
                    icon="🏆"
                    onPress={onTournament}
                    style={styles.tournamentBtn}
                    textColor={COLORS.neonCyan}
                />
            </View>
        );
    }

    // Non-host
    return (
        <View style={styles.footer}>
            <AnimatedButton
                title={isReady ? '✓ READY' : 'READY UP'}
                onPress={onReadyUp}
                style={[
                    styles.readyBtn,
                    isReady && styles.readyBtnActive,
                ]}
                textColor={isReady ? '#05050A' : COLORS.neonCyan}
            />
            <AnimatedButton
                title="LEAVE LOBBY"
                onPress={onLeave}
                style={styles.leaveBtn}
                textColor="#6B7280"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
        backgroundColor: '#05050A',
    },
    startBtn: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        // Neon cyan glow
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 18,
        elevation: 10,
    },
    tournamentBtn: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 248, 255, 0.3)',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    readyBtn: {
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        backgroundColor: 'transparent',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    readyBtnActive: {
        backgroundColor: COLORS.neonCyan,
    },
    leaveBtn: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});

export default React.memo(ActionFooter);
