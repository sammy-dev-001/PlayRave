import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const ScorePopup = ({
    score,
    words = [],
    visible = false,
    onComplete,
    position = 'center' // 'center', 'top', 'bottom'
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            // Entrance animation
            Animated.parallel([
                Animated.spring(fadeAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Hold for 2 seconds, then exit
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(slideAnim, {
                            toValue: -50,
                            duration: 300,
                            useNativeDriver: true,
                        })
                    ]).start(() => {
                        if (onComplete) onComplete();
                    });
                }, 2000);
            });
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.5);
            slideAnim.setValue(50);
        }
    }, [visible]);

    if (!visible && fadeAnim._value === 0) return null;

    const positionStyle = position === 'top'
        ? { top: '20%' }
        : position === 'bottom'
            ? { bottom: '20%' }
            : { top: '50%' };

    return (
        <Animated.View
            style={[
                styles.container,
                positionStyle,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: slideAnim }
                    ],
                }
            ]}
        >
            <View style={styles.content}>
                {/* Score */}
                <View style={styles.scoreContainer}>
                    <NeonText size={14} color={COLORS.limeGlow}>+</NeonText>
                    <NeonText size={48} weight="bold" glow color={COLORS.limeGlow}>
                        {score}
                    </NeonText>
                    <NeonText size={14} color={COLORS.limeGlow}>points</NeonText>
                </View>

                {/* Words formed */}
                {words.length > 0 && (
                    <View style={styles.wordsContainer}>
                        {words.map((word, index) => (
                            <NeonText
                                key={index}
                                size={16}
                                weight="bold"
                                color={COLORS.neonCyan}
                                style={styles.word}
                            >
                                {word}
                            </NeonText>
                        ))}
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
    },
    content: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        alignItems: 'center',
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
        minWidth: 200,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 5,
        marginBottom: 10,
    },
    wordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginTop: 8,
    },
    word: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
});

export default ScorePopup;
