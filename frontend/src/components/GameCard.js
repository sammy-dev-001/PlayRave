import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import NeonText from './NeonText';
import { COLORS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive game card for selection screens
const GameCard = ({
    title,
    description,
    icon,
    color = COLORS.electricPurple,
    onPress,
    disabled = false,
    comingSoon = false,
    index = 0, // For stagger animation
    compact = false,
}) => {
    // Staggered entrance animation
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        if (disabled || comingSoon) return;
        Animated.spring(scale, {
            toValue: 0.96,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    // Responsive sizing
    const getCardWidth = () => {
        if (compact) {
            const padding = SCREEN_WIDTH < 375 ? 12 : 20;
            const gap = 10;
            const columns = SCREEN_WIDTH < 375 ? 2 : 3;
            return (SCREEN_WIDTH - padding * 2 - gap * (columns - 1)) / columns;
        }
        return '100%';
    };

    const cardWidth = getCardWidth();

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                compact && { width: cardWidth },
                {
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || comingSoon}
                activeOpacity={1}
                style={[
                    styles.card,
                    compact ? styles.cardCompact : styles.cardFull,
                    { borderColor: color },
                    (disabled || comingSoon) && styles.cardDisabled,
                ]}
            >
                {/* Icon */}
                <View style={[
                    styles.iconContainer,
                    compact && styles.iconContainerCompact,
                    { backgroundColor: `${color}20` }
                ]}>
                    <NeonText size={compact ? 32 : 40}>{icon}</NeonText>
                </View>

                {/* Content */}
                <View style={[styles.content, compact && styles.contentCompact]}>
                    <NeonText
                        size={compact ? 13 : 18}
                        weight="bold"
                        color={color}
                        numberOfLines={compact ? 2 : 1}
                    >
                        {title}
                    </NeonText>
                    {!compact && description && (
                        <NeonText
                            size={12}
                            color="#888"
                            style={styles.description}
                            numberOfLines={2}
                        >
                            {description}
                        </NeonText>
                    )}
                </View>

                {/* Coming Soon Badge */}
                {comingSoon && (
                    <View style={styles.comingSoonBadge}>
                        <NeonText size={10} color={COLORS.hotPink}>SOON</NeonText>
                    </View>
                )}

                {/* Arrow for full cards */}
                {!compact && !comingSoon && (
                    <View style={styles.arrow}>
                        <NeonText size={20} color={color}>›</NeonText>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Grid of game cards
export const GameCardGrid = ({
    games,
    onSelectGame,
    compact = false,
    columns = 2
}) => {
    // Responsive columns
    const getColumns = () => {
        if (SCREEN_WIDTH >= 768) return 4;
        if (SCREEN_WIDTH >= 500) return 3;
        return columns;
    };

    return (
        <View style={[
            styles.grid,
            { flexDirection: 'row', flexWrap: 'wrap' }
        ]}>
            {games.map((game, index) => (
                <GameCard
                    key={game.id}
                    title={game.name}
                    description={game.description}
                    icon={game.icon}
                    color={game.color}
                    onPress={() => onSelectGame(game.id)}
                    disabled={game.disabled}
                    comingSoon={game.comingSoon}
                    index={index}
                    compact={compact}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 2,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardFull: {
        padding: 16,
    },
    cardCompact: {
        flexDirection: 'column',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    cardDisabled: {
        opacity: 0.5,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    iconContainerCompact: {
        width: 50,
        height: 50,
        marginRight: 0,
        marginBottom: 8,
    },
    content: {
        flex: 1,
    },
    contentCompact: {
        alignItems: 'center',
    },
    description: {
        marginTop: 4,
        lineHeight: 18,
    },
    arrow: {
        marginLeft: 10,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 63, 164, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    grid: {
        gap: 10,
    },
});

export default GameCard;
