import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import MuteButton from '../components/MuteButton';
import { COLORS } from '../constants/theme';
import SocketService from '../services/socket';
import { CONFESSION_CONFIG, CONFESSION_STARTERS } from '../data/confessionPrompts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GAME_PHASES = {
    WAITING: 'waiting',
    SUBMISSION: 'submission',
    REVEAL: 'reveal',
    VOTING: 'voting',
    RESULTS: 'results',
    FINAL_SCORES: 'final_scores'
};

const ConfessionRouletteScreen = ({ route, navigation }) => {
    const { room, playerName, isHost } = route.params;

    // Game state
    const [phase, setPhase] = useState(GAME_PHASES.WAITING);
    const [confession, setConfession] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [currentConfession, setCurrentConfession] = useState(null);
    const [confessionIndex, setConfessionIndex] = useState(0);
    const [totalConfessions, setTotalConfessions] = useState(0);
    const [players, setPlayers] = useState(room?.players || []);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [votes, setVotes] = useState({});
    const [roundResults, setRoundResults] = useState(null);
    const [scores, setScores] = useState({});
    const [timer, setTimer] = useState(0);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [isAuthor, setIsAuthor] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // Random starter prompt
    const [starterPrompt] = useState(
        CONFESSION_STARTERS[Math.floor(Math.random() * CONFESSION_STARTERS.length)]
    );

    useEffect(() => {
        // Socket event listeners
        SocketService.on('confession-phase-changed', handlePhaseChange);
        SocketService.on('confession-timer-update', handleTimerUpdate);
        SocketService.on('confession-submission-count', handleSubmissionCount);
        SocketService.on('confession-reveal', handleConfessionReveal);
        SocketService.on('confession-votes-update', handleVotesUpdate);
        SocketService.on('confession-results', handleRoundResults);
        SocketService.on('confession-game-finished', handleFinalScores);

        SocketService.on('room-updated', handleRoomUpdate);
        SocketService.on('game-state-sync', handleGameStateSync);
        SocketService.on('confession-you-are-author', () => setIsAuthor(true));
        SocketService.on('confession-author-revealed', handleAuthorRevealed);

        // Host must manually click "START GAME" now to prevent accidental double-timers

        return () => {
            SocketService.off('confession-phase-changed', handlePhaseChange);
            SocketService.off('confession-timer-update', handleTimerUpdate);
            SocketService.off('confession-submission-count', handleSubmissionCount);
            SocketService.off('confession-reveal', handleConfessionReveal);
            SocketService.off('confession-votes-update', handleVotesUpdate);
            SocketService.off('confession-results', handleRoundResults);
            SocketService.off('confession-game-finished', handleFinalScores);
            SocketService.off('room-updated', handleRoomUpdate);
            SocketService.off('game-state-sync', handleGameStateSync);
            SocketService.off('confession-you-are-author');
            SocketService.off('confession-author-revealed', handleAuthorRevealed);
        };
    }, []);

    useEffect(() => {
        // Animate on phase change
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true
            })
        ]).start();
    }, [phase]);

    const handlePhaseChange = ({ phase: newPhase, data }) => {
        setPhase(newPhase);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);

        if (data?.totalConfessions) {
            setTotalConfessions(data.totalConfessions);
        }
        if (newPhase === GAME_PHASES.SUBMISSION) {
            setHasSubmitted(false);
            setConfession('');
        }
        if (newPhase === GAME_PHASES.VOTING) {
            setSelectedPlayer(null);
        }
        if (newPhase === GAME_PHASES.REVEAL) {
            setSelectedPlayer(null);
        }
        if (newPhase === GAME_PHASES.RESULTS) {
            setIsAuthor(false); // Reset each round - will be set by confession-you-are-author if applicable
        }
    };

    const handleTimerUpdate = ({ seconds }) => {
        setTimer(seconds);
    };

    const handleSubmissionCount = ({ count, total }) => {
        setSubmissionCount(count);
    };

    const handleConfessionReveal = ({ confession, index, total }) => {
        setCurrentConfession(confession);
        setConfessionIndex(index);
        setTotalConfessions(total);
        setSelectedPlayer(null);
    };

    const handleVotesUpdate = (votesData) => {
        setVotes(votesData);
    };

    const handleRoundResults = (results) => {
        setRoundResults(results);
        setScores(results.scores || {});
    };

    const handleAuthorRevealed = ({ authorName }) => {
        setRoundResults(prev => prev ? { ...prev, author: authorName } : { author: authorName });
    };

    const handleFinalScores = (data) => {
        // Handle both old object format and new array format for rankings
        if (data?.rankings && Array.isArray(data.rankings)) {
            const finalScores = {};
            data.rankings.forEach(r => {
                finalScores[r.name] = r.score;
            });
            setScores(finalScores);
        } else {
            setScores(data || {});
        }
        setPhase(GAME_PHASES.FINAL_SCORES);
    };


    const handleRoomUpdate = (updatedRoom) => {
        setPlayers(updatedRoom.players || []);
    };

    const handleGameStateSync = (data) => {
        if (!data || !data.gameState) return;
        const state = data.gameState;
        
        // Map backend 'finished' phase to frontend 'final_scores'
        let currentPhase = state.phase || GAME_PHASES.WAITING;
        if (currentPhase === 'finished') currentPhase = GAME_PHASES.FINAL_SCORES;
        
        setPhase(currentPhase);

        if (state.totalConfessions) {
            setTotalConfessions(state.totalConfessions);
        }
        
        // Recover Timer State perfectly from backend
        if (state.currentTimer !== undefined) {
            setTimer(state.currentTimer);
        }
        
        // Recover Submissions
        if (state.phase === GAME_PHASES.SUBMISSION) {
            const myPlayer = state.players?.find(p => p.id === SocketService.socket.id || p.name === playerName);
            if (myPlayer?.hasSubmitted) {
                setHasSubmitted(true);
            }
            const submittedCount = state.players?.filter(p => p.hasSubmitted)?.length || 0;
            setSubmissionCount(submittedCount);
        }

        // Recover Current Confession to display
        if (state.currentConfessionIndex !== undefined && state.confessions) {
            setConfessionIndex(state.currentConfessionIndex);
            if (state.confessions[state.currentConfessionIndex]) {
                setCurrentConfession(state.confessions[state.currentConfessionIndex].confession);
            }
        }

        // Recover scores and players
        if (state.players) setPlayers(state.players);
    };

    const submitConfession = () => {
        if (!confession.trim() || hasSubmitted) return;

        SocketService.emit('confession-submit', {
            roomId: room.id,
            playerName,
            confession: confession.trim()
        });
        setHasSubmitted(true);
    };

    const submitVote = () => {
        if (!selectedPlayer) return;

        SocketService.emit('confession-vote', {
            roomId: room.id,
            playerName,
            votedFor: selectedPlayer
        });
    };

    const nextConfession = () => {
        SocketService.emit('confession-next', { roomId: room.id });
    };

    const revealIdentity = () => {
        SocketService.emit('confession-reveal-author', { roomId: room.id });
        setIsAuthor(false); // Hide button after clicking
    };

    const endGame = () => {
        navigation.navigate('Scoreboard', {
            room,
            playerName,
            scores,
            gameType: 'confession-roulette'
        });
    };

    // Render functions for each phase
    const renderWaitingPhase = () => (
        <View style={styles.centeredContent}>
            <NeonText size={24} weight="bold" glow>
                ⏳ WAITING FOR HOST
            </NeonText>
            <NeonText size={16} color="#888" style={styles.subtitle}>
                Game will start soon...
            </NeonText>
            {isHost && (
                <NeonButton
                    title="START GAME"
                    onPress={() => SocketService.emit('confession-start', { roomId: room.id })}
                    style={styles.startButton}
                />
            )}
        </View>
    );

    const renderSubmissionPhase = () => (
        <View style={styles.submissionContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={32} weight="bold" color={timer <= 10 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s
                </NeonText>
            </View>

            <NeonText size={22} weight="bold" style={styles.phaseTitle}>
                WRITE YOUR CONFESSION
            </NeonText>

            <NeonText size={14} color="#888" style={styles.hint}>
                Hint: {starterPrompt}
            </NeonText>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type your anonymous confession..."
                    placeholderTextColor="#666"
                    value={confession}
                    onChangeText={setConfession}
                    multiline
                    maxLength={200}
                    editable={!hasSubmitted}
                />
                <NeonText size={12} color="#666" style={styles.charCount}>
                    {confession.length}/200
                </NeonText>
            </View>

            {hasSubmitted ? (
                <View style={styles.submittedBadge}>
                    <NeonText size={18} color={COLORS.limeGlow}>
                        Confession Submitted!
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                        Waiting for others... ({submissionCount}/{players.length})
                    </NeonText>
                </View>
            ) : (
                <NeonButton
                    title="SUBMIT CONFESSION"
                    onPress={submitConfession}
                    disabled={!confession.trim()}
                    style={styles.submitButton}
                />
            )}
        </View>
    );

    const renderRevealPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 10 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s (Discussion)
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.limeGlow} style={styles.confessionCount}>
                Confession {confessionIndex + 1} of {totalConfessions}
            </NeonText>

            <Animated.View style={[styles.confessionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </Animated.View>

            <NeonText size={16} weight="bold" style={styles.votePrompt}>
                Who do you think wrote this? Discuss!
            </NeonText>
            
            {isHost && (
                <NeonButton
                    title="SKIP & START VOTING"
                    onPress={() => SocketService.emit('confession-start-voting', { roomId: room.id })}
                    style={styles.voteButton}
                />
            )}
        </View>
    );

    const renderVotingPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 5 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s (Voting)
                </NeonText>
            </View>

            <NeonText size={14} color={COLORS.limeGlow} style={styles.confessionCount}>
                Confession {confessionIndex + 1} of {totalConfessions}
            </NeonText>

            <Animated.View style={[styles.confessionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <NeonText size={18} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </Animated.View>

            <NeonText size={16} weight="bold" style={styles.votePrompt}>
                Lock in your final guess! (Suspects: {players?.length || 0})
            </NeonText>

            <ScrollView 
                style={[styles.playersList, { flex: 1, minHeight: 150 }]} 
                contentContainerStyle={styles.playersContent}
                showsVerticalScrollIndicator={true}
            >
                {players && players.length > 0 ? (
                    players.map((player, index) => (
                        <TouchableOpacity
                            key={player.id || player.name || index}
                            style={[
                                styles.playerOption,
                                selectedPlayer === player.name && styles.selectedPlayer
                            ]}
                            onPress={() => setSelectedPlayer(player.name)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <NeonText size={18} style={{ marginRight: 12 }}>{player.avatar || '👤'}</NeonText>
                                <NeonText
                                    size={16}
                                    color={selectedPlayer === player.name ? COLORS.neonCyan : COLORS.white}
                                >
                                    {player.name}
                                </NeonText>
                            </View>
                            {selectedPlayer === player.name && (
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.neonCyan} />
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <NeonText size={14} color="#666">No players available to vote for</NeonText>
                    </View>
                )}
            </ScrollView>

            <NeonButton
                title="LOCK IN VOTE"
                onPress={submitVote}
                disabled={!selectedPlayer}
                style={styles.voteButton}
            />
        </View>
    );

    const renderResultsPhase = () => (
        <View style={styles.resultsContainer}>
            <NeonText size={22} weight="bold" glow style={styles.phaseTitle}>
                THE TRUTH REVEALED
            </NeonText>

            <View style={styles.confessionCard}>
                <NeonText size={16} style={styles.confessionText}>
                    "{currentConfession}"
                </NeonText>
            </View>

            <View style={styles.authorReveal}>
                <NeonText size={16} color="#888">Written by...</NeonText>
                <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow style={{ marginTop: 10 }}>
                    {roundResults?.author === 'Unknown' ? '🕵️ UNKNOWN' : (roundResults?.author || '🕵️ UNKNOWN')}
                </NeonText>
            </View>

            {isAuthor && roundResults?.author === 'Unknown' && (
                <NeonButton
                    title="🔓 REVEAL YOURSELF"
                    onPress={revealIdentity}
                    style={{ marginBottom: 20, minWidth: 200 }}
                    color={COLORS.limeGlow}
                />
            )}

            {roundResults?.correctGuessers?.length > 0 && (
                <View style={styles.guessersBox}>
                    <NeonText size={14} color={COLORS.neonCyan}>
                        Correct guessers: {roundResults.correctGuessers.join(', ')}
                    </NeonText>
                </View>
            )}

            {isHost && (
                <NeonButton
                    title={confessionIndex + 1 >= totalConfessions ? "SHOW FINAL SCORES" : "NEXT CONFESSION"}
                    onPress={nextConfession}
                    style={styles.nextButton}
                />
            )}
        </View>
    );

    const renderFinalScoresPhase = () => {
        const sortedScores = Object.entries(scores)
            .sort(([, a], [, b]) => b - a);

        return (
            <View style={styles.finalScoresContainer}>
                <NeonText size={28} weight="bold" glow style={styles.phaseTitle}>
                    FINAL SCORES
                </NeonText>

                <ScrollView style={styles.scoresList}>
                    {sortedScores.map(([name, score], index) => (
                        <View key={name} style={[styles.scoreRow, index === 0 && styles.winnerRow]}>
                            <NeonText size={24}>
                                {index === 0 ? '' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}.`}
                            </NeonText>
                            <NeonText size={18} style={styles.scoreName}>
                                {name}
                            </NeonText>
                            <NeonText size={20} weight="bold" color={COLORS.limeGlow}>
                                {score}
                            </NeonText>
                        </View>
                    ))}
                </ScrollView>

                <NeonButton
                    title="BACK TO LOBBY"
                    onPress={endGame}
                    style={styles.endButton}
                />
            </View>
        );
    };

    const renderPhase = () => {
        switch (phase) {
            case GAME_PHASES.WAITING:
                return renderWaitingPhase();
            case GAME_PHASES.SUBMISSION:
                return renderSubmissionPhase();
            case GAME_PHASES.REVEAL:
                return renderRevealPhase();
            case GAME_PHASES.VOTING:
                return renderVotingPhase();
            case GAME_PHASES.RESULTS:
                return renderResultsPhase();
            case GAME_PHASES.FINAL_SCORES:
                return renderFinalScoresPhase();
            default:
                return renderWaitingPhase();
        }
    };

    return (
        <GameOverlay roomId={room.id} playerName={playerName}>
            <MuteButton />
            <View style={styles.header}>
                <NeonText size={16} color={COLORS.hotPink}>CONFESSION ROULETTE</NeonText>
                <NeonText size={12} color="#666">Room: {room.id}</NeonText>
            </View>
            {renderPhase()}
        </GameOverlay>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    subtitle: {
        marginTop: 10
    },
    startButton: {
        marginTop: 30,
        minWidth: 200
    },
    submissionContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    timerBadge: {
        marginVertical: 15
    },
    phaseTitle: {
        marginBottom: 10,
        textAlign: 'center'
    },
    hint: {
        marginBottom: 20,
        fontStyle: 'italic'
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20
    },
    textInput: {
        width: '100%',
        minHeight: 120,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderRadius: 12,
        padding: 15,
        color: COLORS.white,
        fontSize: 16,
        textAlignVertical: 'top'
    },
    charCount: {
        textAlign: 'right',
        marginTop: 5
    },
    submittedBadge: {
        alignItems: 'center',
        padding: 20
    },
    submitButton: {
        minWidth: 220
    },
    votingContainer: {
        flex: 1,
        padding: 20
    },
    confessionCount: {
        textAlign: 'center',
        marginBottom: 15
    },
    confessionCard: {
        backgroundColor: 'rgba(177, 78, 255, 0.1)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderRadius: 16,
        padding: 25,
        marginBottom: 20
    },
    confessionText: {
        textAlign: 'center',
        lineHeight: 26
    },
    votePrompt: {
        textAlign: 'center',
        marginBottom: 15
    },
    playersList: {
        maxHeight: 250
    },
    playersContent: {
        gap: 10
    },
    playerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        borderRadius: 10,
        padding: 15,
        gap: 10
    },
    selectedPlayer: {
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderColor: COLORS.neonCyan
    },
    voteButton: {
        marginTop: 20
    },
    resultsContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    authorReveal: {
        alignItems: 'center',
        marginVertical: 20
    },
    guessersBox: {
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20
    },
    nextButton: {
        marginTop: 20,
        minWidth: 220
    },
    finalScoresContainer: {
        flex: 1,
        padding: 20
    },
    scoresList: {
        flex: 1,
        marginVertical: 20
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        gap: 15
    },
    winnerRow: {
        backgroundColor: 'rgba(198, 255, 74, 0.15)',
        borderWidth: 2,
        borderColor: COLORS.limeGlow
    },
    scoreName: {
        flex: 1
    },
    endButton: {
        marginTop: 10
    }
});

export default ConfessionRouletteScreen;
