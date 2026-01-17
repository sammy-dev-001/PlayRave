import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TournamentBracket = ({ rounds = [], currentMatch = null, allPlayers = [] }) => {
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for current match
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
            ])
        ).start();
    }, [glowAnim]);

    const renderMatch = (match, matchIndex, roundIndex, isCurrentMatch) => {
        const player1Name = match.player1?.name || match.player1 || 'TBD';
        const player2Name = match.player2?.name || match.player2 || 'TBD';
        const isAIMatch = match.isAIMatch || player1Name.includes('AI') || player2Name.includes('AI');
        const winnerId = match.winner?.id || match.winner;
        const player1Won = winnerId === (match.player1?.id || match.player1);
        const player2Won = winnerId === (match.player2?.id || match.player2);

        const glowStyle = isCurrentMatch ? {
            shadowColor: COLORS.neonCyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
            shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 15] }),
            borderColor: COLORS.neonCyan,
        } : {};

        return (
            <Animated.View
                key={`${roundIndex}-${matchIndex}`}
                style={[
                    styles.matchContainer,
                    isCurrentMatch && styles.currentMatch,
                    match.completed && styles.completedMatch,
                    glowStyle
                ]}
            >
                {/* Player 1 */}
                <View style={[
                    styles.playerSlot,
                    player1Won && styles.winnerSlot,
                    player2Won && styles.loserSlot
                ]}>
                    <NeonText
                        size={12}
                        weight={player1Won ? 'bold' : 'normal'}
                        color={player1Won ? COLORS.limeGlow : (player2Won ? '#666' : '#fff')}
                    >
                        {match.player1?.isAI ? '🤖 ' : ''}{player1Name}
                    </NeonText>
                    {player1Won && <NeonText size={10} color={COLORS.limeGlow}>✓</NeonText>}
                </View>

                {/* VS Divider */}
                <View style={styles.vsDivider}>
                    <NeonText size={10} color="#555">VS</NeonText>
                </View>

                {/* Player 2 */}
                <View style={[
                    styles.playerSlot,
                    player2Won && styles.winnerSlot,
                    player1Won && styles.loserSlot
                ]}>
                    <NeonText
                        size={12}
                        weight={player2Won ? 'bold' : 'normal'}
                        color={player2Won ? COLORS.limeGlow : (player1Won ? '#666' : '#fff')}
                    >
                        {match.player2?.isAI ? '🤖 ' : ''}{player2Name}
                    </NeonText>
                    {player2Won && <NeonText size={10} color={COLORS.limeGlow}>✓</NeonText>}
                </View>

                {/* Match Status Badge */}
                {isCurrentMatch && (
                    <View style={styles.liveBadge}>
                        <NeonText size={8} color="#fff" weight="bold">LIVE</NeonText>
                    </View>
                )}
                {isAIMatch && !match.completed && (
                    <View style={styles.aiBadge}>
                        <NeonText size={8} color="#fff">🤖</NeonText>
                    </View>
                )}
            </Animated.View>
        );
    };

    const renderRound = (round, roundIndex) => {
        const isCurrentRound = currentMatch?.round === roundIndex + 1;
        const matches = round.matches || [];

        return (
            <View key={roundIndex} style={styles.roundColumn}>
                <View style={styles.roundHeader}>
                    <NeonText
                        size={12}
                        weight="bold"
                        color={isCurrentRound ? COLORS.neonCyan : '#888'}
                        glow={isCurrentRound}
                    >
                        {roundIndex === rounds.length - 1 ? '🏆 FINAL' : `Round ${roundIndex + 1}`}
                    </NeonText>
                </View>
                <View style={styles.matchesColumn}>
                    {matches.map((match, matchIndex) => {
                        const isCurrentMatch = isCurrentRound && currentMatch?.match === matchIndex;
                        return renderMatch(match, matchIndex, roundIndex, isCurrentMatch);
                    })}
                </View>
            </View>
        );
    };

    // If no rounds provided, create from allPlayers
    const displayRounds = rounds.length > 0 ? rounds : [{
        matches: allPlayers.reduce((acc, player, index) => {
            if (index % 2 === 0) {
                acc.push({
                    player1: player,
                    player2: allPlayers[index + 1] || null,
                    completed: false
                });
            }
            return acc;
        }, [])
    }];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bracketScrollContainer}
        >
            <View style={styles.bracket}>
                {/* Connecting Lines */}
                <View style={styles.connectingLines} />

                {/* Rounds */}
                {displayRounds.map(renderRound)}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    bracketScrollContainer: {
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    bracket: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    roundColumn: {
        alignItems: 'center',
        minWidth: 120,
    },
    roundHeader: {
        marginBottom: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    matchesColumn: {
        gap: 20,
        justifyContent: 'center',
    },
    matchContainer: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        minWidth: 110,
        position: 'relative',
    },
    currentMatch: {
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },
    completedMatch: {
        opacity: 0.8,
    },
    playerSlot: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    winnerSlot: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.limeGlow,
    },
    loserSlot: {
        opacity: 0.5,
    },
    vsDivider: {
        alignItems: 'center',
        paddingVertical: 2,
    },
    liveBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ff3b3b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    aiBadge: {
        position: 'absolute',
        top: -8,
        left: -8,
        backgroundColor: COLORS.electricPurple,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    connectingLines: {
        position: 'absolute',
        // Lines would be drawn here with SVG in production
    },
});

export default TournamentBracket;
