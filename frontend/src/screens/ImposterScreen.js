import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import SocketService from '../services/socket';

const GAME_PHASES = {
    WAITING: 'waiting',
    WORD_REVEAL: 'word_reveal',
    DISCUSSION: 'discussion',
    VOTING: 'voting',
    RESULTS: 'results',
    FINAL: 'final'
};

const ImposterScreen = ({ route, navigation }) => {
    const { room, playerName, isHost } = route.params;

    // Game state
    const [phase, setPhase] = useState(GAME_PHASES.WAITING);
    const [myWord, setMyWord] = useState(null);
    const [isImposter, setIsImposter] = useState(false);
    const [players, setPlayers] = useState(room?.players || []);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [votes, setVotes] = useState({});
    const [roundResults, setRoundResults] = useState(null);
    const [timer, setTimer] = useState(0);
    const [discussionStarted, setDiscussionStarted] = useState(false);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Socket event listeners
        SocketService.on('imposter-phase-changed', handlePhaseChange);
        SocketService.on('imposter-word-assigned', handleWordAssigned);
        SocketService.on('imposter-timer-update', handleTimerUpdate);
        SocketService.on('imposter-votes-update', handleVotesUpdate);
        SocketService.on('imposter-round-results', handleRoundResults);
        SocketService.on('room-updated', handleRoomUpdate);

        // Start game if host
        if (isHost) {
            SocketService.emit('imposter-start', { roomId: room.id });
        }

        return () => {
            SocketService.off('imposter-phase-changed', handlePhaseChange);
            SocketService.off('imposter-word-assigned', handleWordAssigned);
            SocketService.off('imposter-timer-update', handleTimerUpdate);
            SocketService.off('imposter-votes-update', handleVotesUpdate);
            SocketService.off('imposter-round-results', handleRoundResults);
            SocketService.off('room-updated', handleRoomUpdate);
        };
    }, []);

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, [phase, myWord]);

    const handlePhaseChange = ({ phase: newPhase }) => {
        setPhase(newPhase);
        fadeAnim.setValue(0);
        if (newPhase === GAME_PHASES.VOTING) {
            setSelectedPlayer(null);
        }
    };

    const handleWordAssigned = ({ word, isImposter: imposter }) => {
        setMyWord(word);
        setIsImposter(imposter);
    };

    const handleTimerUpdate = ({ seconds }) => {
        setTimer(seconds);
    };

    const handleVotesUpdate = (votesData) => {
        setVotes(votesData);
    };

    const handleRoundResults = (results) => {
        setRoundResults(results);
    };

    const handleRoomUpdate = (updatedRoom) => {
        setPlayers(updatedRoom.players || []);
    };

    const startDiscussion = () => {
        SocketService.emit('imposter-start-discussion', { roomId: room.id });
        setDiscussionStarted(true);
    };

    const startVoting = () => {
        SocketService.emit('imposter-start-voting', { roomId: room.id });
    };

    const submitVote = () => {
        if (!selectedPlayer) return;

        SocketService.emit('imposter-vote', {
            roomId: room.id,
            playerName,
            votedFor: selectedPlayer
        });
    };

    const playAgain = () => {
        SocketService.emit('imposter-start', { roomId: room.id });
    };

    const endGame = () => {
        navigation.goBack();
    };

    // Render functions for each phase
    const renderWaitingPhase = () => (
        <View style={styles.centeredContent}>
            <NeonText size={24} weight="bold" glow>
                🕵️ IMPOSTER
            </NeonText>
            <NeonText size={16} color="#888" style={styles.subtitle}>
                Waiting for host to start...
            </NeonText>
            {isHost && (
                <NeonButton
                    title="START GAME"
                    onPress={() => SocketService.emit('imposter-start', { roomId: room.id })}
                    style={styles.startButton}
                />
            )}
        </View>
    );

    const renderWordRevealPhase = () => (
        <View style={styles.revealContainer}>
            <NeonText size={18} color="#888" style={styles.instruction}>
                Your word is...
            </NeonText>

            <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
                <NeonText
                    size={40}
                    weight="bold"
                    color={isImposter ? COLORS.hotPink : COLORS.limeGlow}
                    glow
                >
                    {myWord}
                </NeonText>
            </Animated.View>

            {isImposter && (
                <View style={styles.roleBadge}>
                    <NeonText size={20} color={COLORS.hotPink} weight="bold">
                        😈 YOU ARE THE IMPOSTER!
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10, textAlign: 'center' }}>
                        Stay hidden! Ask questions without revealing you have a different word.
                    </NeonText>
                </View>
            )}

            {!isImposter && (
                <View style={styles.roleBadge}>
                    <NeonText size={16} color={COLORS.limeGlow}>
                        ✓ You have the normal word
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10, textAlign: 'center' }}>
                        Find the imposter without revealing the word!
                    </NeonText>
                </View>
            )}

            {isHost && !discussionStarted && (
                <NeonButton
                    title="START DISCUSSION"
                    onPress={startDiscussion}
                    style={styles.nextButton}
                />
            )}

            {!isHost && (
                <NeonText size={14} color="#666" style={{ marginTop: 30 }}>
                    Waiting for host to start discussion...
                </NeonText>
            )}
        </View>
    );

    const renderDiscussionPhase = () => (
        <View style={styles.discussionContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={32} weight="bold" color={timer <= 30 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </NeonText>
            </View>

            <NeonText size={22} weight="bold" style={styles.phaseTitle}>
                💬 DISCUSSION TIME
            </NeonText>

            <View style={styles.infoCard}>
                <NeonText size={16} color={isImposter ? COLORS.hotPink : COLORS.limeGlow} weight="bold">
                    Your word: {myWord}
                </NeonText>
                <NeonText size={14} color="#888" style={{ marginTop: 10, textAlign: 'center' }}>
                    {isImposter
                        ? "Blend in with the group and figure out what their word is!"
                        : "Ask questions to find who has a different word!"}
                </NeonText>
            </View>

            <NeonText size={16} weight="bold" style={styles.tipsTitle}>
                💡 Tips:
            </NeonText>
            <View style={styles.tipsList}>
                <NeonText size={14} color="#999" style={styles.tip}>
                    • Ask questions about the word without saying it
                </NeonText>
                <NeonText size={14} color="#999" style={styles.tip}>
                    • Pay attention to suspicious answers
                </NeonText>
                <NeonText size={14} color="#999" style={styles.tip}>
                    • The imposter might be too vague or too specific
                </NeonText>
            </View>

            {isHost && (
                <NeonButton
                    title="START VOTING"
                    onPress={startVoting}
                    style={styles.voteButton}
                />
            )}
        </View>
    );

    const renderVotingPhase = () => (
        <View style={styles.votingContainer}>
            <View style={styles.timerBadge}>
                <NeonText size={24} weight="bold" color={timer <= 5 ? COLORS.hotPink : COLORS.neonCyan} glow>
                    {timer}s
                </NeonText>
            </View>

            <NeonText size={22} weight="bold" style={styles.phaseTitle}>
                🗳️ VOTE FOR THE IMPOSTER
            </NeonText>

            <ScrollView style={styles.playersList} contentContainerStyle={styles.playersContent}>
                {players.filter(p => p.name !== playerName).map((player) => (
                    <TouchableOpacity
                        key={player.name}
                        style={[
                            styles.playerOption,
                            selectedPlayer === player.name && styles.selectedPlayer
                        ]}
                        onPress={() => setSelectedPlayer(player.name)}
                    >
                        <NeonText size={18}>{player.avatar || '👤'}</NeonText>
                        <NeonText
                            size={18}
                            color={selectedPlayer === player.name ? COLORS.neonCyan : COLORS.white}
                            style={{ flex: 1 }}
                        >
                            {player.name}
                        </NeonText>
                        {selectedPlayer === player.name && (
                            <NeonText size={18} color={COLORS.neonCyan}>✓</NeonText>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <NeonButton
                title="LOCK IN VOTE"
                onPress={submitVote}
                disabled={!selectedPlayer}
                style={styles.submitButton}
            />
        </View>
    );

    const renderResultsPhase = () => (
        <View style={styles.resultsContainer}>
            <NeonText size={24} weight="bold" glow style={styles.phaseTitle}>
                🎭 RESULTS
            </NeonText>

            <View style={styles.imposterReveal}>
                <NeonText size={16} color="#888">The imposter was...</NeonText>
                <NeonText size={32} weight="bold" color={COLORS.hotPink} glow style={{ marginTop: 15 }}>
                    {roundResults?.imposterName || 'Unknown'}
                </NeonText>
                <NeonText size={20} color={COLORS.limeGlow} style={{ marginTop: 10 }}>
                    ({roundResults?.imposterWord || '?'})
                    object</NeonText>
            </View>

            <View style={styles.wordComparison}>
                <View style={styles.wordBox}>
                    <NeonText size={14} color="#888" >Normal Word</NeonText>
                    <NeonText size={24} weight="bold" color={COLORS.neonCyan}>
                        {roundResults?.normalWord || '?'}
                    </NeonText>
                </View>
                <NeonText size={24} color="#666"> vs </NeonText>
                <View style={styles.wordBox}>
                    <NeonText size={14} color="#888">Imposter Word</NeonText>
                    <NeonText size={24} weight="bold" color={COLORS.hotPink}>
                        {roundResults?.imposterWord || '?'}
                    </NeonText>
                </View>
            </View>

            {roundResults?.imposterCaught ? (
                <View style={styles.outcomeBox}>
                    <NeonText size={20} color={COLORS.limeGlow} weight="bold">
                        ✓ IMPOSTER CAUGHT!
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                        Most players voted correctly
                    </NeonText>
                </View>
            ) : (
                <View style={styles.outcomeBox}>
                    <NeonText size={20} color={COLORS.hotPink} weight="bold">
                        😈 IMPOSTER ESCAPED!
                    </NeonText>
                    <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                        The imposter fooled you all
                    </NeonText>
                </View>
            )}

            <View style={styles.buttonRow}>
                {isHost && (
                    <NeonButton
                        title="PLAY AGAIN"
                        onPress={playAgain}
                        style={styles.playAgainButton}
                    />
                )}
                <NeonButton
                    title="END GAME"
                    onPress={endGame}
                    style={styles.endButton}
                />
            </View>
        </View>
    );

    const renderPhase = () => {
        switch (phase) {
            case GAME_PHASES.WAITING:
                return renderWaitingPhase();
            case GAME_PHASES.WORD_REVEAL:
                return renderWordRevealPhase();
            case GAME_PHASES.DISCUSSION:
                return renderDiscussionPhase();
            case GAME_PHASES.VOTING:
                return renderVotingPhase();
            case GAME_PHASES.RESULTS:
            case GAME_PHASES.FINAL:
                return renderResultsPhase();
            default:
                return renderWaitingPhase();
        }
    };

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={16} color={COLORS.electricPurple}>IMPOSTER</NeonText>
                <NeonText size={12} color="#666">Room: {room.id}</NeonText>
            </View>
            {renderPhase()}
        </NeonContainer>
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
    revealContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    instruction: {
        marginBottom: 20
    },
    wordCard: {
        backgroundColor: 'rgba(177, 78, 255, 0.15)',
        borderWidth: 3,
        borderColor: COLORS.electricPurple,
        borderRadius: 20,
        padding: 40,
        marginVertical: 20
    },
    roleBadge: {
        alignItems: 'center',
        marginTop: 30,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12
    },
    nextButton: {
        marginTop: 40,
        minWidth: 240
    },
    discussionContainer: {
        flex: 1,
        padding: 20
    },
    timerBadge: {
        alignItems: 'center',
        marginVertical: 15
    },
    phaseTitle: {
        textAlign: 'center',
        marginBottom: 20
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30
    },
    tipsTitle: {
        marginBottom: 10
    },
    tipsList: {
        marginBottom: 30
    },
    tip: {
        marginVertical: 5,
        paddingLeft: 10
    },
    voteButton: {
        marginTop: 20
    },
    votingContainer: {
        flex: 1,
        padding: 20
    },
    playersList: {
        maxHeight: 300
    },
    playersContent: {
        gap: 12
    },
    playerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        borderRadius: 12,
        padding: 18,
        gap: 15
    },
    selectedPlayer: {
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderColor: COLORS.neonCyan
    },
    submitButton: {
        marginTop: 20
    },
    resultsContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    imposterReveal: {
        alignItems: 'center',
        marginVertical: 20,
        padding: 20,
        backgroundColor: 'rgba(255, 0, 128, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        width: '100%'
    },
    wordComparison: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginVertical: 20,
        width: '100%'
    },
    wordBox: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 5
    },
    outcomeBox: {
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.limeGlow,
        width: '100%'
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 30
    },
    playAgainButton: {
        flex: 1
    },
    endButton: {
        flex: 1
    }
});

export default ImposterScreen;
