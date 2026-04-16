import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── Disconnected player avatar chip ────────────────────────────────────────
const PlayerChip = ({ player, guessed }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (player.isDisconnected) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [player.isDisconnected]);

    return (
        <View style={[
            chipStyles.chip,
            guessed && chipStyles.chipGuessed,
            player.isDisconnected && chipStyles.chipDisconnected,
        ]}>
            {/* Avatar letter */}
            <View style={[chipStyles.avatar, { backgroundColor: player.avatarColor || '#333' }]}>
                <NeonText size={14} weight="bold" color="#fff">
                    {player.name?.charAt(0).toUpperCase() || '?'}
                </NeonText>
            </View>

            {/* Disconnected overlay */}
            {player.isDisconnected && (
                <Animated.View style={[chipStyles.disconnectedOverlay, { opacity: pulseAnim }]}>
                    <View style={chipStyles.redDot} />
                </Animated.View>
            )}

            <NeonText
                size={11}
                color={player.isDisconnected ? '#666' : guessed ? COLORS.limeGlow : '#ccc'}
                style={chipStyles.chipName}
                numberOfLines={1}
            >
                {player.isDisconnected ? 'Away…' : guessed ? '✓ Done' : player.name}
            </NeonText>
        </View>
    );
};

const chipStyles = StyleSheet.create({
    chip: {
        alignItems: 'center',
        width: 64,
        gap: 4,
    },
    chipGuessed: {},
    chipDisconnected: {
        opacity: 0.55,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    disconnectedOverlay: {
        position: 'absolute',
        top: 0,
        right: 6,
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B3B',
        shadowColor: '#FF3B3B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
    },
    chipName: {
        textAlign: 'center',
        maxWidth: 60,
    },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const HotSeatMCScreen = ({ route, navigation }) => {
    const { room: initialRoom, playerName, isHost, players: initialPlayers } = route.params;
    const { user } = useAuth();

    const [gameState, setGameState] = useState(route.params.initialGameState || null);
    const [room, setRoom] = useState(initialRoom);
    const [players, setPlayers] = useState(initialPlayers || initialRoom?.players || []);
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasLocked, setHasLocked] = useState(false);
    const [revealData, setRevealData] = useState(null);
    const [gameFinished, setGameFinished] = useState(false);
    const [finishedData, setFinishedData] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    // Points pop animation
    const bonusScale = useRef(new Animated.Value(0.5)).current;
    const bonusOpacity = useRef(new Animated.Value(0)).current;

    // ── Socket listeners ──────────────────────────────────────────────────────
    useEffect(() => {
        const onStateUpdate = (state) => {
            setGameState(state);
            if (!state.hasGuessed && state.gamePhase === 'guessing-phase') {
                setSelectedOption(null);
                setHasLocked(false);
            }
            if (state.gamePhase === 'waiting-for-target' && state.isTarget) {
                setSelectedOption(null);
                setHasLocked(false);
            }
        };

        const onReveal = ({ results, gameState: updatedState }) => {
            setRevealData(results);
            setGameState(updatedState);
            // Animate points pop
            bonusScale.setValue(0.5);
            bonusOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(bonusScale, { toValue: 1, friction: 4, useNativeDriver: true }),
                Animated.timing(bonusOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        };

        const onGameFinished = (data) => {
            setGameFinished(true);
            setFinishedData(data);
        };

        const onRoomUpdated = (updatedRoom) => {
            setRoom(updatedRoom);
            setPlayers(updatedRoom.players || []);
        };

        SocketService.on('hot-seat-mc-state-update', onStateUpdate);
        SocketService.on('hot-seat-mc-reveal', onReveal);
        SocketService.on('hot-seat-mc-game-finished', onGameFinished);
        SocketService.on('room-updated', onRoomUpdated);

        return () => {
            SocketService.off('hot-seat-mc-state-update', onStateUpdate);
            SocketService.off('hot-seat-mc-reveal', onReveal);
            SocketService.off('hot-seat-mc-game-finished', onGameFinished);
            SocketService.off('room-updated', onRoomUpdated);
        };
    }, [room.id]);

    // Animate on phase/round change
    useEffect(() => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
    }, [gameState?.gamePhase, gameState?.round]);

    // Reset per round
    useEffect(() => {
        if (gameState?.gamePhase === 'waiting-for-target') {
            setSelectedOption(null);
            setHasLocked(false);
            setRevealData(null);
        }
    }, [gameState?.round]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleLockTargetAnswer = () => {
        if (selectedOption === null) return;
        setHasLocked(true);
        SocketService.emit('lock-target-answer', { roomId: room.id, answerIndex: selectedOption });
    };

    const handleLockGuess = () => {
        if (selectedOption === null) return;
        setHasLocked(true);
        SocketService.emit('lock-player-guess', { roomId: room.id, guessIndex: selectedOption });
    };

    const handleNextRound = () => {
        setRevealData(null);
        setSelectedOption(null);
        setHasLocked(false);
        SocketService.emit('hot-seat-mc-next-round', { roomId: room.id });
    };

    const handleEndGame = () => {
        Alert.alert('End Game', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'End Game', style: 'destructive', onPress: () => SocketService.emit('hot-seat-mc-end-game', { roomId: room.id }) },
        ]);
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!gameState) {
        return (
            <NeonContainer>
                <View style={styles.center}>
                    <NeonText size={24} glow>Loading…</NeonText>
                </View>
            </NeonContainer>
        );
    }

    // ── Game finished ─────────────────────────────────────────────────────────
    if (gameFinished && finishedData) {
        return (
            <NeonContainer>
                <ScrollView contentContainerStyle={styles.finishedContainer}>
                    <NeonText size={13} color={COLORS.hotPink} style={{ letterSpacing: 3 }}>GAME OVER</NeonText>
                    <View style={styles.flameRow}>
                        <Ionicons name="flame" size={28} color={COLORS.hotPink} />
                        <NeonText size={30} weight="bold" glow>THE HOT SEAT</NeonText>
                        <Ionicons name="flame" size={28} color={COLORS.hotPink} />
                    </View>

                    {finishedData.winner && (
                        <View style={styles.winnerCard}>
                            <NeonText size={13} color="#888" style={{ letterSpacing: 2 }}>👑 WINNER</NeonText>
                            <NeonText size={30} weight="bold" color={COLORS.neonCyan} glow style={{ marginTop: 8 }}>
                                {finishedData.winner.name}
                            </NeonText>
                            <NeonText size={20} color={COLORS.limeGlow} style={{ marginTop: 4 }}>
                                {finishedData.winner.score} pts
                            </NeonText>
                        </View>
                    )}

                    {finishedData.rankings?.length > 0 && (
                        <View style={styles.rankingsContainer}>
                            <NeonText size={14} weight="bold" color="#aaa" style={{ marginBottom: 12, letterSpacing: 2 }}>
                                FINAL SCORES
                            </NeonText>
                            {finishedData.rankings.map((p, i) => (
                                <View key={p.id} style={[styles.rankRow, i === 0 && styles.rankRowFirst]}>
                                    <NeonText size={16} weight="bold" color={i === 0 ? COLORS.neonCyan : '#bbb'}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}{'  '}{p.name}
                                    </NeonText>
                                    <NeonText size={16} color={COLORS.limeGlow} weight="bold">{p.score} pts</NeonText>
                                </View>
                            ))}
                        </View>
                    )}

                    <NeonButton
                        title="BACK TO LOBBY"
                        onPress={() => navigation.navigate('Lobby', { room, playerName })}
                        style={{ marginTop: 30 }}
                    />
                </ScrollView>
            </NeonContainer>
        );
    }

    // ── State extraction ──────────────────────────────────────────────────────
    const {
        gamePhase,
        round,
        totalRounds,
        currentQuestionCategory,
        targetUserId,
        targetUserName,
        currentQuestion,
        options,
        isTarget,
        hasGuessed,
        guessCount,
        expectedGuessers,
    } = gameState;

    // ── Shared sub-renderers ──────────────────────────────────────────────────
    const renderHeader = () => (
        <View style={styles.header}>
            <NeonText size={11} color={COLORS.hotPink} style={{ letterSpacing: 3 }}>
                ROUND {round} / {totalRounds}  {'  '}  {currentQuestionCategory || 'Mixed'}
            </NeonText>
            <View style={styles.flameRow}>
                <Ionicons name="flame" size={22} color={COLORS.hotPink} />
                <NeonText size={24} weight="bold" glow>THE HOT SEAT</NeonText>
                <Ionicons name="flame" size={22} color={COLORS.hotPink} />
            </View>
        </View>
    );

    const renderTargetBadge = () => (
        <View style={styles.targetBadge}>
            <NeonText size={11} color="#666" style={{ letterSpacing: 2 }}>IN THE HOT SEAT</NeonText>
            <NeonText size={26} weight="bold" glow color={COLORS.neonCyan} style={{ marginTop: 4 }}>
                {targetUserName}
            </NeonText>
        </View>
    );

    const renderOptions = (onSelect, disabled = false, correctIndex = null) => (
        <View style={styles.optionsContainer}>
            {options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrect = correctIndex !== null && i === correctIndex;
                const isWrong = correctIndex !== null && isSelected && !isCorrect;

                let bg = 'rgba(255,255,255,0.04)';
                let border = 'rgba(255,255,255,0.12)';
                let shadowColor = 'transparent';

                if (isSelected && correctIndex === null) {
                    bg = 'rgba(0, 240, 255, 0.12)';
                    border = COLORS.neonCyan;
                    shadowColor = COLORS.neonCyan;
                }
                if (isCorrect) {
                    bg = 'rgba(198, 255, 74, 0.15)';
                    border = COLORS.limeGlow;
                    shadowColor = COLORS.limeGlow;
                }
                if (isWrong) {
                    bg = 'rgba(255, 59, 100, 0.12)';
                    border = COLORS.hotPink;
                }

                return (
                    <TouchableOpacity
                        key={i}
                        style={[styles.optionButton, {
                            backgroundColor: bg,
                            borderColor: border,
                            shadowColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isCorrect || isSelected ? 0.35 : 0,
                            shadowRadius: 8,
                            elevation: isCorrect ? 4 : 0,
                        }]}
                        onPress={() => !disabled && onSelect(i)}
                        disabled={disabled}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.optionLabel, {
                            backgroundColor: isSelected ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)',
                            borderColor: isSelected ? COLORS.neonCyan : 'transparent',
                            borderWidth: 1,
                        }]}>
                            <NeonText size={15} weight="bold" color={isSelected ? COLORS.neonCyan : '#999'}>
                                {OPTION_LABELS[i]}
                            </NeonText>
                        </View>
                        <NeonText size={15} style={{ flex: 1, lineHeight: 22 }}>{opt}</NeonText>
                        {isCorrect && <Ionicons name="checkmark-circle" size={24} color={COLORS.limeGlow} />}
                        {isWrong && <Ionicons name="close-circle" size={24} color={COLORS.hotPink} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    // Guesser progress chips — shows all non-target players with Away state
    const renderGuesserChips = () => {
        const guessers = players.filter(p => p.id !== targetUserId && p.uid !== targetUserId);
        if (guessers.length === 0) return null;

        const guessedIds = Object.keys(gameState.playerGuesses || {});

        return (
            <View style={styles.chipSection}>
                <NeonText size={12} color="#666" style={{ marginBottom: 12, letterSpacing: 1 }}>
                    GUESSERS
                </NeonText>
                <View style={styles.chipRow}>
                    {guessers.map(p => (
                        <PlayerChip
                            key={p.id}
                            player={p}
                            guessed={guessedIds.includes(p.id) || guessedIds.includes(p.uid)}
                        />
                    ))}
                </View>
            </View>
        );
    };

    const renderEndButton = () => isHost && (
        <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
            <NeonText size={14} color={COLORS.hotPink}>End Game</NeonText>
        </TouchableOpacity>
    );

    // ── Phase 1: Target answers ───────────────────────────────────────────────
    if (gamePhase === 'waiting-for-target') {
        return (
            <NeonContainer>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderHeader()}
                    {renderTargetBadge()}

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                        {isTarget ? (
                            <View style={styles.phaseContainer}>
                                <NeonText size={13} color={COLORS.limeGlow} style={styles.phaseHint}>
                                    Answer honestly — everyone else will try to guess what you picked!
                                </NeonText>

                                <View style={styles.questionCard}>
                                    <NeonText size={20} weight="bold" style={styles.questionText}>
                                        "{currentQuestion}"
                                    </NeonText>
                                </View>

                                {renderOptions((i) => setSelectedOption(i), hasLocked)}

                                <NeonButton
                                    title={hasLocked ? 'LOCKED IN ✓' : 'LOCK IN MY ANSWER'}
                                    onPress={handleLockTargetAnswer}
                                    disabled={selectedOption === null || hasLocked}
                                    style={styles.actionButton}
                                />
                            </View>
                        ) : (
                            <View style={styles.waitingContainer}>
                                <Ionicons name="hourglass-outline" size={50} color={COLORS.neonCyan} />
                                <NeonText size={18} weight="bold" style={{ marginTop: 16 }}>
                                    {targetUserName} is answering…
                                </NeonText>
                                <NeonText size={13} color="#777" style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                                    They're picking their truth. Get ready to guess!
                                </NeonText>
                            </View>
                        )}
                    </Animated.View>

                    {renderEndButton()}
                </ScrollView>
            </NeonContainer>
        );
    }

    // ── Phase 2: Guessing ─────────────────────────────────────────────────────
    if (gamePhase === 'guessing-phase') {
        return (
            <NeonContainer>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderHeader()}
                    {renderTargetBadge()}

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                        {isTarget ? (
                            <View style={styles.waitingContainer}>
                                <Ionicons name="people-outline" size={50} color={COLORS.electricPurple} />
                                <NeonText size={18} weight="bold" style={{ marginTop: 16 }}>
                                    Waiting for guesses…
                                </NeonText>
                                <NeonText size={13} color="#777" style={{ marginTop: 8 }}>
                                    Everyone's trying to read your mind!
                                </NeonText>

                                {/* Guesser chips with Away overlays */}
                                {renderGuesserChips()}

                                <View style={styles.progressBadge}>
                                    <NeonText size={16} color={COLORS.limeGlow} weight="bold">
                                        {guessCount} / {expectedGuessers} guessed
                                    </NeonText>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.phaseContainer}>
                                <NeonText size={13} color={COLORS.electricPurple} style={styles.phaseHint}>
                                    What do you think {targetUserName} picked?
                                </NeonText>

                                <View style={styles.questionCard}>
                                    <NeonText size={20} weight="bold" style={styles.questionText}>
                                        "{currentQuestion}"
                                    </NeonText>
                                </View>

                                {hasGuessed || hasLocked ? (
                                    <View style={styles.lockedInView}>
                                        <Ionicons name="checkmark-circle" size={52} color={COLORS.limeGlow} />
                                        <NeonText size={18} weight="bold" style={{ marginTop: 14 }}>
                                            Guess Locked In!
                                        </NeonText>
                                        <NeonText size={13} color="#777" style={{ marginTop: 8 }}>
                                            Waiting for others… ({guessCount}/{expectedGuessers})
                                        </NeonText>
                                        {renderGuesserChips()}
                                    </View>
                                ) : (
                                    <>
                                        {renderOptions((i) => setSelectedOption(i))}
                                        <NeonButton
                                            title="LOCK IN MY GUESS"
                                            onPress={handleLockGuess}
                                            disabled={selectedOption === null}
                                            style={styles.actionButton}
                                        />
                                    </>
                                )}
                            </View>
                        )}
                    </Animated.View>

                    {renderEndButton()}
                </ScrollView>
            </NeonContainer>
        );
    }

    // ── Phase 3: Reveal ───────────────────────────────────────────────────────
    if (gamePhase === 'reveal-phase' && revealData) {
        const { correctAnswerIndex, correctAnswerText, guessResults, correctGuessCount, targetBonus } = revealData;

        return (
            <NeonContainer>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderHeader()}
                    {renderTargetBadge()}

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>

                        {/* Question recap */}
                        <View style={styles.questionCard}>
                            <NeonText size={17} weight="bold" style={styles.questionText}>
                                "{currentQuestion}"
                            </NeonText>
                        </View>

                        {/* THE BIG REVEAL — correct answer with massive glow */}
                        <View style={styles.revealCard}>
                            <NeonText size={12} color="#777" style={{ letterSpacing: 2, marginBottom: 8 }}>
                                THE ANSWER WAS
                            </NeonText>
                            <View style={styles.revealAnswerRow}>
                                <View style={styles.revealLabel}>
                                    <NeonText size={20} weight="bold" color={COLORS.limeGlow}>
                                        {OPTION_LABELS[correctAnswerIndex]}
                                    </NeonText>
                                </View>
                                <NeonText size={20} weight="bold" color={COLORS.limeGlow} glow style={{ flex: 1, lineHeight: 28 }}>
                                    {correctAnswerText}
                                </NeonText>
                                <Ionicons name="checkmark-circle" size={28} color={COLORS.limeGlow} />
                            </View>
                        </View>

                        {/* Who guessed what */}
                        <View style={styles.guessResultsContainer}>
                            <NeonText size={13} weight="bold" color="#aaa" style={{ marginBottom: 12, letterSpacing: 2 }}>
                                WHO GUESSED WHAT
                            </NeonText>
                            {Object.values(guessResults).map((gr, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.guessRow,
                                        gr.isCorrect && styles.guessRowCorrect,
                                    ]}
                                >
                                    {/* Left: name + guess */}
                                    <View style={styles.guessRowLeft}>
                                        <View style={[styles.guessInitial, { backgroundColor: gr.isCorrect ? 'rgba(198,255,74,0.2)' : 'rgba(255,255,255,0.06)' }]}>
                                            <NeonText size={14} weight="bold" color={gr.isCorrect ? COLORS.limeGlow : '#bbb'}>
                                                {gr.playerName?.charAt(0) || '?'}
                                            </NeonText>
                                        </View>
                                        <View>
                                            <NeonText size={14} weight="bold" color={gr.isCorrect ? '#fff' : '#bbb'}>
                                                {gr.playerName}
                                            </NeonText>
                                            <NeonText size={12} color="#777">
                                                {OPTION_LABELS[gr.guessIndex]}. {gr.guessText}
                                            </NeonText>
                                        </View>
                                    </View>

                                    {/* Right: score badge */}
                                    {gr.isCorrect ? (
                                        <Animated.View style={[styles.correctBadge, { transform: [{ scale: bonusScale }], opacity: bonusOpacity }]}>
                                            <NeonText size={14} weight="bold" color={COLORS.limeGlow}>+100</NeonText>
                                        </Animated.View>
                                    ) : (
                                        <Ionicons name="close-circle" size={22} color="rgba(255,59,100,0.5)" />
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Target bonus */}
                        <Animated.View style={[styles.targetBonusCard, { transform: [{ scale: bonusScale }], opacity: bonusOpacity }]}>
                            <NeonText size={13} color="#888">{targetUserName} earned</NeonText>
                            <NeonText size={32} weight="bold" color={COLORS.neonCyan} glow style={{ marginVertical: 4 }}>
                                +{targetBonus} pts
                            </NeonText>
                            <NeonText size={12} color="#555">
                                {correctGuessCount} correct guess{correctGuessCount !== 1 ? 'es' : ''} × 50
                            </NeonText>
                        </Animated.View>

                        {isHost && (
                            <NeonButton
                                title={round >= totalRounds ? 'SEE FINAL RESULTS' : 'NEXT ROUND →'}
                                onPress={handleNextRound}
                                style={styles.actionButton}
                            />
                        )}
                    </Animated.View>

                    {renderEndButton()}
                </ScrollView>
            </NeonContainer>
        );
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    return (
        <NeonContainer>
            <View style={styles.center}>
                <NeonText size={24} glow>Game in progress…</NeonText>
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 50,
        paddingHorizontal: 16,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 36,
        marginBottom: 14,
        gap: 6,
    },
    flameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    targetBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.07)',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 18,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    phaseContainer: {
        alignItems: 'center',
    },
    phaseHint: {
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    questionCard: {
        backgroundColor: 'rgba(148, 0, 211, 0.1)',
        borderRadius: 18,
        padding: 24,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(148,0,211,0.5)',
        width: '100%',
        alignItems: 'center',
        shadowColor: COLORS.electricPurple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    questionText: {
        textAlign: 'center',
        lineHeight: 29,
    },
    optionsContainer: {
        width: '100%',
        gap: 10,
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 14,
        paddingVertical: 15,
        paddingHorizontal: 16,
        gap: 12,
    },
    optionLabel: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        marginTop: 10,
        minWidth: 260,
    },
    waitingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 0,
    },
    lockedInView: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    progressBadge: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    chipSection: {
        alignItems: 'center',
        marginTop: 28,
        width: '100%',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    // ── REVEAL ──
    revealCard: {
        backgroundColor: 'rgba(198, 255, 74, 0.07)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: COLORS.limeGlow,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 6,
    },
    revealAnswerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    revealLabel: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(198,255,74,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    guessResultsContainer: {
        width: '100%',
        marginBottom: 18,
    },
    guessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    guessRowCorrect: {
        backgroundColor: 'rgba(198,255,74,0.06)',
        borderColor: 'rgba(198,255,74,0.25)',
    },
    guessRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    guessInitial: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    correctBadge: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(198,255,74,0.4)',
    },
    targetBonusCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.07)',
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(0, 240, 255, 0.3)',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    // ── FINISHED ──
    winnerCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        borderRadius: 20,
        padding: 28,
        marginTop: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        width: '100%',
    },
    rankingsContainer: {
        width: '100%',
        marginBottom: 10,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    rankRowFirst: {
        backgroundColor: 'rgba(0,240,255,0.06)',
        borderColor: 'rgba(0,240,255,0.2)',
    },
    finishedContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    endButton: {
        alignItems: 'center',
        marginTop: 28,
        padding: 10,
    },
});

export default HotSeatMCScreen;
