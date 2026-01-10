import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import NeonText from './NeonText';

const AnimatedTile = ({
    letter,
    value,
    size = 40,
    isSelected = false,
    isPlaced = false,
    isLocked = false,
    onPress,
    disabled = false,
    animationType = 'none' // 'none', 'fadeIn', 'slideIn', 'shake'
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animationType === 'fadeIn') {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else if (animationType === 'slideIn') {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else if (animationType === 'shake') {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        } else {
            fadeAnim.setValue(1);
            slideAnim.setValue(0);
        }
    }, [animationType]);

    useEffect(() => {
        if (isSelected) {
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        }
    }, [isSelected]);

    const backgroundColor = isLocked ? '#e1c699' : (isPlaced ? '#fffebb' : '#e1c699');
    const borderColor = isSelected ? '#00ff66' : '#c6a87c';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    backgroundColor,
                    borderColor,
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { translateX: shakeAnim },
                        { scale: scaleAnim }
                    ],
                }
            ]}
        >
            <Animated.View
                style={[
                    styles.touchable,
                    disabled && styles.disabled
                ]}
                onTouchEnd={!disabled ? onPress : undefined}
            >
                <NeonText
                    size={size * 0.5}
                    color="#000"
                    weight="bold"
                    style={styles.letter}
                >
                    {letter}
                </NeonText>
                <NeonText
                    size={size * 0.22}
                    color="#000"
                    style={styles.value}
                >
                    {value}
                </NeonText>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    touchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    letter: {
        textAlign: 'center',
    },
    value: {
        position: 'absolute',
        bottom: 2,
        right: 3,
    },
});

export default AnimatedTile;
