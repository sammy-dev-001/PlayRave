import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import RaveLights from '../components/RaveLights';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// ─── WhosMostLikelyResultsScreen ──────────────────────────────────────────────
//
// DESIGN: PURE RENDERER. This screen NEVER emits socket events.
//
// The server's `resultsTimer` (6 s) fires automatically after broadcasting
// results to advance to the next round or end the game. The client simply
// listens for the next event ('whos-most-likely-round-start' or 'game-finished')
// and navigates accordingly. No countdowns, no host-driven "next" buttons that
// could race with each other.
//
// The countdown bar shown here is ONLY cosmetic — it reflects `nextRoundInMs`
// sent by the server so the UI aligns with what the server will actually do.
// ──────────────────────────────────────────────────────────────────────────────

const WhosMostLikelyResultsScreen = ({ route, navigation }) => {
    const {
        room,
        results,
        players,
        hostParticipates,
        isHost,
        playerName,
    } = route.params;

    const nextRoundInMs = results?.nextRoundInMs ?? 6000;
    const progressAnim  = useRef(new Animated.Value(1)).current;

    // Check if current player was the round winner
    const currentUserId = SocketService.userId;
    const myResult      = results?.voteResults?.find(r => r.playerId === currentUserId);
    const showRaveLights = myResult?.isWinner || false;

    // ── Visual countdown bar (cosmetic only) ──────────────────────────────
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue:         0,
            duration:        nextRoundInMs,
            useNativeDriver: false,
        }).start();
    }, [progressAnim, nextRoundInMs]);

    // ── Socket listeners — server drives all transitions ──────────────────
    useEffect(() => {
        // Next round: server sends new prompt data — navigate back to question screen
        const onRoundStart = (data) => {
            navigation.replace('WhosMostLikelyQuestion', {
                room,
                players,
                hostParticipates,
                isHost,
                playerName,
                prompt:          data.prompt,
                promptIndex:     data.promptIndex,
                totalPrompts:    data.totalPrompts,
                category:        data.category,
                votingDurationMs: data.votingDurationMs,
            });
        };

        // All rounds complete — go to scoreboard
        const onGameFinished = ({ finalScores }) => {
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        // Host killed the game
        const onGameEnded = () => {
            navigation.navigate('Lobby', { room, isHost });
        };

        SocketService.on('whos-most-likely-round-start', onRoundStart);
        SocketService.on('game-finished',                onGameFinished);
        SocketService.on('whos-most-likely-ended',       onGameEnded);

        return () => {
            SocketService.off('whos-most-likely-round-start', onRoundStart);
            SocketService.off('game-finished',                onGameFinished);
            SocketService.off('whos-most-likely-ended',       onGameEnded);
        };
    }, [navigation, room, players, hostParticipates, isHost, playerName]);

    // ── Render ────────────────────────────────────────────────────────────
    const renderVoteResult = ({ item, index }) => {
        const podiumColors = [COLORS.limeGlow, COLORS.neonCyan, '#FF9500'];
        const rankColor    = index < 3 ? podiumColors[index] : '#888';

        return (
            <View style={[styles.voteRow, item.isWinner && styles.winnerRow]}>
                <View style={styles.rankBadge}>
                    <NeonText size={14} color={rankColor} weight="bold">
                        #{index + 1}
                    </NeonText>
                </View>

                <View style={styles.playerInfo}>
                    {item.isWinner && (
                        <Ionicons name="trophy" size={18} color={COLORS.limeGlow} style={styles.trophyIcon} />
                    )}
                    <NeonText size={17} weight={item.isWinner ? 'bold' : 'normal'}>
                        {item.playerName || item.playerId}
                    </NeonText>
                </View>

                <View style={styles.voteInfo}>
                    <NeonText size={18} color={COLORS.hotPink} weight="bold">
                        {item.votes}
                    </NeonText>
                    <NeonText size={12} color="#666">
                        {item.votes === 1 ? 'vote' : 'votes'}
                    </NeonText>
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton scrollable>
            <RaveLights trigger={showRaveLights} intensity="high" />

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow style={styles.title}>
                    RESULTS
                </NeonText>
                <NeonText size={13} color="#666">
                    {results?.isLastPrompt ? 'Final round!' : `Next prompt coming up...`}
                </NeonText>
            </View>

            {/* ── Cosmetic countdown bar ───────────────────────────────── */}
            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        { flex: progressAnim }
                    ]}
                />
            </View>

            {/* ── Prompt label ─────────────────────────────────────────── */}
            <View style={styles.promptContainer}>
                <NeonText size={18} color={COLORS.neonCyan} style={styles.promptLabel}>
                    {results?.prompt}
                </NeonText>
            </View>

            {/* ── Vote distribution list ───────────────────────────────── */}
            <NeonText size={14} style={styles.sectionTitle}>
                VOTE DISTRIBUTION
            </NeonText>

            <FlatList
                data={results?.voteResults || []}
                keyExtractor={item => item.playerId}
                renderItem={renderVoteResult}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
            />

            {/* ── Waiting label ─────────────────────────────────────────── */}
            <NeonText style={styles.waitingText}>
                {results?.isLastPrompt
                    ? '🏁 Tallying final scores...'
                    : '⏳ Advancing to next prompt...'}
            </NeonText>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        letterSpacing: 2,
        marginBottom: 4,
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        marginBottom: 24,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.electricPurple,
        borderRadius: 2,
    },
    promptContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(177, 78, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    promptLabel: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sectionTitle: {
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: 1,
        color: '#888',
    },
    list: {
        paddingBottom: 16,
    },
    voteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 63, 164, 0.2)',
        gap: 10,
    },
    winnerRow: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.08)',
        borderWidth: 2,
    },
    rankBadge: {
        width: 36,
        alignItems: 'center',
    },
    playerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trophyIcon: {
        marginRight: 2,
    },
    voteInfo: {
        alignItems: 'flex-end',
    },
    waitingText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: '#666',
        fontSize: 14,
    },
});

export default WhosMostLikelyResultsScreen;
