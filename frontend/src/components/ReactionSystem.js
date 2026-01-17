import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import NeonText from './NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REACTION_EMOJIS = ['🔥', '😂', '💀', '🎉', '👏', '😱', '🤯', '💯', '❤️', '🙀'];

// Floating reaction that animates across screen
const FloatingReaction = ({ emoji, id, onComplete }) => {
    const animValue = useRef(new Animated.Value(0)).current;
    const xPos = useRef(Math.random() * (SCREEN_WIDTH - 50)).current;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
        }).start(() => onComplete(id));
    }, []);

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT - 100, -100],
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 1, 1, 0],
    });

    const scale = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.2, 1],
    });

    const rotate = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-15deg', '15deg', '-15deg'],
    });

    return (
        <Animated.View
            style={[
                styles.floatingReaction,
                {
                    left: xPos,
                    opacity,
                    transform: [{ translateY }, { scale }, { rotate }],
                },
            ]}
        >
            <NeonText size={40}>{emoji}</NeonText>
        </Animated.View>
    );
};

// Reaction Picker UI
const ReactionPicker = ({ roomId, playerName, visible = true }) => {
    const [expanded, setExpanded] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    const sendReaction = (emoji) => {
        if (cooldown) return;

        SocketService.emit('send-reaction', { roomId, emoji, playerName });
        setCooldown(true);
        setExpanded(false);

        setTimeout(() => setCooldown(false), 1500);
    };

    if (!visible) return null;

    return (
        <View style={styles.pickerContainer}>
            {expanded ? (
                <View style={styles.emojiGrid}>
                    {REACTION_EMOJIS.map((emoji) => (
                        <TouchableOpacity
                            key={emoji}
                            style={[styles.emojiButton, cooldown && styles.cooldownButton]}
                            onPress={() => sendReaction(emoji)}
                            disabled={cooldown}
                        >
                            <NeonText size={28}>{emoji}</NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setExpanded(true)}
                >
                    <NeonText size={20}>😄</NeonText>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Container that listens for reactions and displays them
const ReactionOverlay = ({ roomId, playerName, children }) => {
    const [reactions, setReactions] = useState([]);
    const reactionId = useRef(0);

    useEffect(() => {
        const handleReaction = ({ emoji, senderId }) => {
            const id = reactionId.current++;
            setReactions(prev => [...prev, { id, emoji }]);
        };

        SocketService.on('reaction-received', handleReaction);
        return () => SocketService.off('reaction-received', handleReaction);
    }, []);

    const removeReaction = (id) => {
        setReactions(prev => prev.filter(r => r.id !== id));
    };

    return (
        <View style={styles.overlay}>
            {children}

            {/* Floating reactions */}
            {reactions.map(({ id, emoji }) => (
                <FloatingReaction
                    key={id}
                    id={id}
                    emoji={emoji}
                    onComplete={removeReaction}
                />
            ))}

            {/* Reaction picker */}
            <ReactionPicker roomId={roomId} playerName={playerName} />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        position: 'relative',
    },
    floatingReaction: {
        position: 'absolute',
        zIndex: 1000,
    },
    pickerContainer: {
        position: 'absolute',
        bottom: 100,
        right: 15,
        zIndex: 999,
    },
    toggleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 180,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        padding: 10,
    },
    emojiButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cooldownButton: {
        opacity: 0.4,
    },
});

export { ReactionOverlay, ReactionPicker, FloatingReaction };
export default ReactionOverlay;
