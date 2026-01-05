import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';
import { ConfettiBurst } from './Animations';

const XPGainPopup = ({ visible, xp, levelUp, newLevel, onClose }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const xpAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            xpAnim.setValue(0);
            opacityAnim.setValue(0);

            // Play entrance animation
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
                    Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
                ]),
                Animated.timing(xpAnim, { toValue: xp, duration: 800, useNativeDriver: false }),
                Animated.delay(1500),
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true })
                ])
            ]).start(() => {
                if (onClose) onClose();
            });
        }
    }, [visible, xp]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                ]}>
                    <ConfettiBurst active={levelUp} />

                    <View style={styles.xpBadge}>
                        <NeonText size={48}>⭐</NeonText>
                        <Animated.Text style={styles.xpText}>
                            +{Math.round(xpAnim._value || xp)} XP
                        </Animated.Text>
                    </View>

                    {levelUp && (
                        <View style={styles.levelUpContainer}>
                            <NeonText size={24} weight="bold" color={COLORS.limeGlow}>🎉 LEVEL UP!</NeonText>
                            <NeonText size={32} weight="bold" glow>Level {newLevel}</NeonText>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        backgroundColor: 'rgba(26,26,46,0.95)',
        borderRadius: 25,
        padding: 40,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        minWidth: 250
    },
    xpBadge: {
        alignItems: 'center'
    },
    xpText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.limeGlow,
        marginTop: 10
    },
    levelUpContainer: {
        marginTop: 25,
        alignItems: 'center'
    }
});

export default XPGainPopup;
