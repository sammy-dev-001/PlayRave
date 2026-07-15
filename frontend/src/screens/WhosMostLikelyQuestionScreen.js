import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';
import { useTheme } from '../context/ThemeContext';

// ─── WhosMostLikelyQuestionScreen ─────────────────────────────────────────────
//
// DESIGN: This screen is a PURE RENDERER.
// It NEVER drives any game state transitions. The server is 100% authoritative:
//
//   • Timer display: The server sends `votingDurationMs` in the round-start event.
//     The client counts down for visual purposes ONLY. When it hits zero, nothing
//     happens on the client side — the server's own timer fires the reveal.
//
//   • Vote submission: A player clicks a name → submits once → UI locks.
//     The server validates uniqueness. No auto-submit on timer expiry.
//
//   • Advance: The client listens for 'whos-most-likely-results'. When received,
//     it navigates to the results screen. No client ever calls 'show-results'.
// ──────────────────────────────────────────────────────────────────────────────

const WhosMostLikelyQuestionScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const {
        room,
        players,
        hostParticipates,
        isHost,
        playerName,
        // Provided by 'whos-most-likely-round-start' or game-started data:
        prompt: initialPrompt,
        promptIndex: initialPromptIndex,
        totalPrompts: initialTotalPrompts,
        category: initialCategory,
        votingDurationMs = 20000,
    } = route.params;

    useGameDisconnectHandler({
        navigation,
        room,
        playerName,
        exitScreen: 'Lobby',
        exitParams: { room, isHost },
    });

    const [selectedPlayer, setSelectedPlayer]   = useState(null);
    const [hasSubmitted, setHasSubmitted]        = useState(false);
    const [votedCount, setVotedCount]            = useState(0);
    const [totalNeeded, setTotalNeeded]          = useState(players?.length || 0);
    const [timeLeft, setTimeLeft]                = useState(Math.ceil(votingDurationMs / 1000));

    // ── Live round data — populated from server's round-start event ────────
    // If prompt was passed via route params (reconnect scenario), use it.
    // Otherwise wait for 'whos-most-likely-round-start' from the server.
    const [livePrompt,       setLivePrompt]       = useState(initialPrompt ? (typeof initialPrompt === 'object' ? initialPrompt.prompt : initialPrompt) : null);
    const [liveCategory,     setLiveCategory]     = useState(initialCategory || (typeof initialPrompt === 'object' ? initialPrompt?.category : null));
    const [livePromptIndex,  setLivePromptIndex]  = useState(initialPromptIndex ?? null);
    const [liveTotalPrompts, setLiveTotalPrompts] = useState(initialTotalPrompts || null);
    const [liveVotingMs,     setLiveVotingMs]     = useState(votingDurationMs);
    const [isWaiting,        setIsWaiting]        = useState(!initialPrompt); // true = waiting for server
    const timerRef = useRef(null);

    // Reset and start the visual timer each round
    const startTimer = (durationMs) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(Math.ceil(durationMs / 1000));
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
    };

    // Kick off timer immediately if we already have prompt data from route.params
    useEffect(() => {
        if (!isWaiting) {
            startTimer(votingDurationMs);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    // ── Socket listeners — the server drives every transition ──────────────
    useEffect(() => {
        // PRIMARY EVENT: server fires this to begin each round.
        // Works for round 1 (first data arrival) and all subsequent rounds.
        const onRoundStart = (data) => {
            // Reset per-round client state
            setSelectedPlayer(null);
            setHasSubmitted(false);
            setVotedCount(0);
            setTotalNeeded(data.players?.length || players?.length || 0);
            setLivePrompt(data.prompt);
            setLiveCategory(data.category);
            setLivePromptIndex(data.promptIndex);
            setLiveTotalPrompts(data.totalPrompts);
            setLiveVotingMs(data.votingDurationMs || 20000);
            setIsWaiting(false);
            startTimer(data.votingDurationMs || 20000);
        };

        // Server sends live vote progress so the "X/N voted" badge stays accurate
        const onVoteProgress = ({ votedCount: vc, totalNeeded: tn }) => {
            setVotedCount(vc);
            setTotalNeeded(tn);
        };

        // Server sends results → navigate to results screen
        const onResults = (results) => {
            console.log('Results received:', results);
            if (timerRef.current) clearInterval(timerRef.current);
            navigation.replace('WhosMostLikelyResults', {
                room,
                results,
                players,
                hostParticipates,
                isHost,
                playerName,
            });
        };

        // Game is over — server emits this after all rounds finish
        const onGameFinished = ({ finalScores }) => {
            if (timerRef.current) clearInterval(timerRef.current);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        // Host ended game early
        const onGameEnded = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            navigation.navigate('Lobby', { room, isHost });
        };

        SocketService.on('whos-most-likely-round-start',   onRoundStart);
        SocketService.on('whos-most-likely-vote-progress', onVoteProgress);
        SocketService.on('whos-most-likely-results',       onResults);
        SocketService.on('game-finished',                  onGameFinished);
        SocketService.on('whos-most-likely-ended',         onGameEnded);

        return () => {
            SocketService.off('whos-most-likely-round-start',   onRoundStart);
            SocketService.off('whos-most-likely-vote-progress', onVoteProgress);
            SocketService.off('whos-most-likely-results',       onResults);
            SocketService.off('game-finished',                  onGameFinished);
            SocketService.off('whos-most-likely-ended',         onGameEnded);
        };
    }, [navigation, room, players, hostParticipates, isHost, playerName]); // eslint-disable-line react-hooks/exhaustive-deps

    // Visual pulse when waiting after voting
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseLoop = useRef(null);

    // Waiting-for-others pulse animation (starts after submitting)
    useEffect(() => {
        if (hasSubmitted) {
            pulseLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
                ])
            );
            pulseLoop.current.start();
        }
        return () => pulseLoop.current?.stop();
    }, [hasSubmitted, pulseAnim]);

    // ── Vote submission ────────────────────────────────────────────────────
    const handleSelectPlayer = (uid) => {
        if (hasSubmitted || !canVote) return;
        setSelectedPlayer(uid);
    };

    const handleSubmitVote = () => {
        if (hasSubmitted || !canVote || !selectedPlayer) return;

        setHasSubmitted(true);
        SocketService.emit('submit-whos-most-likely-vote', {
            roomId:          room.id,
            votedForPlayerId: selectedPlayer,
        });
    };

    const canVote = !isHost || hostParticipates;

    const votablePlayers = (players || []).filter(p => {
        if (!hostParticipates && p.isHost) return false;
        return true;
    });

    // Timer colour feedback: green → yellow → red
    const timerColor = timeLeft > 10
        ? COLORS.limeGlow
        : timeLeft > 5
            ? '#FFB800'
            : COLORS.hotPink;

    // ── Loading state: waiting for server's first round-start event ────────
    if (isWaiting) {
        return (
            <NeonContainer showMuteButton>
                <View style={styles.loadingContainer}>
                    <NeonText size={22} color={COLORS.electricPurple} glow>
                        Getting ready...
                    </NeonText>
                    <NeonText size={14} color={COLORS.textDarkMuted} style={{ marginTop: 10 }}>
                        Waiting for server
                    </NeonText>
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showBackButton scrollable showMuteButton>
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <NeonText size={13} color={COLORS.hotPink}>
                    PROMPT {(livePromptIndex ?? 0) + 1} / {liveTotalPrompts || '?'}
                </NeonText>

                <NeonText size={36} weight="bold" color={timerColor}>
                    {timeLeft}s
                </NeonText>
            </View>

            {/* ── Vote progress badge ──────────────────────────────────── */}
            <View style={styles.progressBadge}>
                <NeonText size={13} color={COLORS.neonCyan}>
                    {votedCount} / {totalNeeded} voted
                </NeonText>
            </View>

            {/* ── Prompt card ──────────────────────────────────────────── */}
            <View style={styles.promptContainer}>
                <NeonText size={24} weight="bold" style={styles.prompt}>
                    {livePrompt || '...'}
                </NeonText>
                {liveCategory ? (
                    <NeonText size={13} color={COLORS.neonCyan} style={styles.category}>
                        {liveCategory}
                    </NeonText>
                ) : null}
            </View>

            {/* ── Voting area ──────────────────────────────────────────── */}
            {canVote ? (
                <>
                    <ScrollView
                        style={styles.playersContainer}
                        contentContainerStyle={styles.playersContent}
                    >
                        {votablePlayers.map((player) => {
                            const uid = player.uid || player.userId || player.id;
                            return (
                                <NeonButton
                                    key={uid}
                                    title={player.name}
                                    variant={selectedPlayer === uid ? 'primary' : 'secondary'}
                                    onPress={() => handleSelectPlayer(uid)}
                                    style={styles.playerButton}
                                    disabled={hasSubmitted}
                                />
                            );
                        })}
                    </ScrollView>

                    {selectedPlayer && !hasSubmitted && (
                        <NeonButton
                            title="SUBMIT VOTE"
                            onPress={handleSubmitVote}
                            style={styles.submitButton}
                        />
                    )}

                    {hasSubmitted && (
                        <Animated.View style={[styles.waitingContainer, { opacity: pulseAnim }]}>
                            <NeonText style={styles.submittedText}>
                                ✅ Vote submitted! Waiting for others...
                            </NeonText>
                        </Animated.View>
                    )}
                </>
            ) : (
                <NeonText style={styles.spectatorText}>
                    (Spectating — voting disabled)
                </NeonText>
            )}
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressBadge: {
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.25)',
        marginBottom: 20,
    },
    promptContainer: {
        marginBottom: 30,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    prompt: {
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32,
    },
    category: {
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    playersContainer: {
        maxHeight: 320,
    },
    playersContent: {
        gap: 12,
        paddingBottom: 10,
    },
    playerButton: {
        width: '100%',
    },
    submitButton: {
        marginTop: 20,
    },
    waitingContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    submittedText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: COLORS.limeGlow,
        fontSize: 16,
    },
    spectatorText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: COLORS.textMuted,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
});

export default WhosMostLikelyQuestionScreen;
