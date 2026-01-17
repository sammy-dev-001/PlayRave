import React, { useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Animated,
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import ConfettiEffect from '../components/ConfettiEffect';
import { COLORS } from '../constants/theme';

const TournamentResultsScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, tournament, champion, standings } = route.params;

    const trophyAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
            ]),
        ]).start();

        // Float animation for trophy
        Animated.loop(
            Animated.sequence([
                Animated.timing(trophyAnim, { toValue: -10, duration: 1000, useNativeDriver: true }),
                Animated.timing(trophyAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const getRankEmoji = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const backToLobby = () => {
        navigation.navigate('Lobby', { room, playerName, isHost });
    };

    return (
        <NeonContainer>
            <ConfettiEffect active={true} />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Champion Header */}
                <Animated.View style={[
                    styles.championSection,
                    { transform: [{ scale: scaleAnim }, { translateY: trophyAnim }] }
                ]}>
                    <NeonText size={60}>🏆</NeonText>
                    <NeonText size={28} weight="bold" glow color={COLORS.limeGlow}>
                        TOURNAMENT CHAMPION
                    </NeonText>
                    <View style={styles.championCard}>
                        <NeonText size={32} weight="bold" glow color={COLORS.neonCyan}>
                            {champion?.name || 'Unknown'}
                        </NeonText>
                        <NeonText size={18} color="#fff">
                            Total Score: {standings[0]?.score || 0} points
                        </NeonText>
                    </View>
                </Animated.View>

                {/* Tournament Summary */}
                <View style={styles.summarySection}>
                    <NeonText size={16} weight="bold" color={COLORS.electricPurple}>
                        📊 {tournament.name} Summary
                    </NeonText>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                                {tournament.games?.length || 0}
                            </NeonText>
                            <NeonText size={12} color="#888">Games Played</NeonText>
                        </View>
                        <View style={styles.statItem}>
                            <NeonText size={24} weight="bold" color={COLORS.hotPink}>
                                {standings?.length || 0}
                            </NeonText>
                            <NeonText size={12} color="#888">Players</NeonText>
                        </View>
                        <View style={styles.statItem}>
                            <NeonText size={24} weight="bold" color={COLORS.limeGlow}>
                                {standings?.reduce((sum, s) => sum + s.score, 0) || 0}
                            </NeonText>
                            <NeonText size={12} color="#888">Total Points</NeonText>
                        </View>
                    </View>
                </View>

                {/* Final Standings */}
                <View style={styles.standingsSection}>
                    <NeonText size={16} weight="bold" color="#fff">
                        🏅 Final Standings
                    </NeonText>
                    {standings?.map((standing, index) => (
                        <Animated.View
                            key={standing.player?.id || index}
                            style={[
                                styles.standingRow,
                                index === 0 && styles.goldRow,
                                index === 1 && styles.silverRow,
                                index === 2 && styles.bronzeRow,
                            ]}
                        >
                            <NeonText size={20}>
                                {getRankEmoji(standing.rank)}
                            </NeonText>
                            <View style={styles.playerInfo}>
                                <NeonText
                                    size={16}
                                    weight={index < 3 ? 'bold' : 'normal'}
                                    color={index === 0 ? COLORS.limeGlow : '#fff'}
                                >
                                    {standing.player?.name}
                                </NeonText>
                                {index === 0 && (
                                    <NeonText size={10} color={COLORS.limeGlow}>👑 Champion</NeonText>
                                )}
                            </View>
                            <NeonText size={18} weight="bold" color={COLORS.neonCyan}>
                                {standing.score}
                            </NeonText>
                        </Animated.View>
                    ))}
                </View>

                {/* Game Breakdown */}
                <View style={styles.breakdownSection}>
                    <NeonText size={16} weight="bold" color="#888">
                        🎮 Games Played
                    </NeonText>
                    <View style={styles.gamesRow}>
                        {tournament.games?.map((gameId, index) => (
                            <View key={index} style={styles.gameBadge}>
                                <NeonText size={12}>{gameId}</NeonText>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <NeonButton
                        title="🏠 BACK TO LOBBY"
                        onPress={backToLobby}
                        style={styles.actionButton}
                    />
                    {isHost && (
                        <NeonButton
                            title="🔄 NEW TOURNAMENT"
                            variant="secondary"
                            onPress={() => navigation.navigate('TournamentSetup', { room, playerName, isHost })}
                            style={styles.actionButton}
                        />
                    )}
                </View>
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        minHeight: '100%',
    },
    championSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    championCard: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.limeGlow,
        padding: 25,
        alignItems: 'center',
        marginTop: 15,
        width: '100%',
    },
    summarySection: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    standingsSection: {
        marginBottom: 20,
    },
    standingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    goldRow: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: '#FFD700',
    },
    silverRow: {
        backgroundColor: 'rgba(192, 192, 192, 0.15)',
        borderColor: '#C0C0C0',
    },
    bronzeRow: {
        backgroundColor: 'rgba(205, 127, 50, 0.15)',
        borderColor: '#CD7F32',
    },
    playerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    breakdownSection: {
        marginBottom: 30,
    },
    gamesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    gameBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    actionsSection: {
        gap: 15,
        marginBottom: 40,
    },
    actionButton: {
        width: '100%',
    },
});

export default TournamentResultsScreen;
