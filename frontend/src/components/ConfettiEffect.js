import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConfettiPiece = ({ delay, color }) => {
    const fall = useRef(new Animated.Value(0)).current;
    const swing = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animations = Animated.parallel([
            // Fall down
            Animated.timing(fall, {
                toValue: SCREEN_HEIGHT + 100,
                duration: 3000 + Math.random() * 2000,
                delay,
                useNativeDriver: true,
            }),
            // Swing side to side
            Animated.loop(
                Animated.sequence([
                    Animated.timing(swing, {
                        toValue: 30,
                        duration: 500 + Math.random() * 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(swing, {
                        toValue: -30,
                        duration: 500 + Math.random() * 500,
                        useNativeDriver: true,
                    }),
                ])
            ),
            // Rotate
            Animated.loop(
                Animated.timing(rotate, {
                    toValue: 360,
                    duration: 1000 + Math.random() * 1000,
                    useNativeDriver: true,
                })
            ),
        ]);

        animations.start();

        return () => animations.stop();
    }, []);

    const rotateZ = rotate.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    backgroundColor: color,
                    transform: [
                        { translateY: fall },
                        { translateX: swing },
                        { rotateZ },
                    ],
                },
            ]}
        />
    );
};

const ConfettiEffect = ({ show = true, pieceCount = 50 }) => {
    if (!show) return null;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

    const confettiPieces = Array.from({ length: pieceCount }, (_, i) => ({
        key: i,
        delay: Math.random() * 500,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * SCREEN_WIDTH,
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {confettiPieces.map(piece => (
                <View key={piece.key} style={[styles.piece, { left: piece.left }]}>
                    <ConfettiPiece delay={piece.delay} color={piece.color} />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    piece: {
        position: 'absolute',
        top: -20,
    },
    confetti: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});

export default ConfettiEffect;
