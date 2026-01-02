import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import SocketService from '../services/socket';

const { width } = Dimensions.get('window');

const GAME_PHASES = {
    WAITING: 'waiting',
    OPINION: 'opinion',
    RESULTS: 'results',
    FINAL: 'final'
};

const UnpopularOpinionsScreen = ({ route, navigation }) => {
    const { room, playerName, isHost } = route.params;

    // Game State
    const [phase, setPhase] = useState(GAME_PHASES.WAITING);
    const [currentOpinion, setCurrentOpinion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [myVote, setMyVote] = useState(null); // 'agree' or 'disagree'
    const [roundResults, setRoundResults] = useState(null);
    const [scores, setScores] = useState({});

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Socket listeners
        SocketService.on('opinion-phase-changed', handlePhaseChange);
        SocketService.on('opinion-new-round', handleNewRound);
        SocketService.on('opinion-timer-update', handleTimerUpdate);
        SocketService.on('opinion-round-results', handleRoundResults);
        SocketService.on('opinion-final-scores', handleFinalScores);

        // Start game if host
        if (isHost) {
            SocketService.emit('opinion-start', { roomId: room.id });
        }

        return () => {
            SocketService.off('opinion-phase-changed', handlePhaseChange);
            SocketService.off('opinion-new-round', handleNewRound);
            SocketService.off('opinion-timer-update', handleTimerUpdate);
            SocketService.off('opinion-round-results', handleRoundResults);
            SocketService.off('opinion-final-scores', handleFinalScores);
        };
    }, []);

    useEffect(() => {
        // Animate content on phase change
        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true
            })
        ]).start();
    }, [phase, currentOpinion]);

    const handlePhaseChange = ({ phase: newPhase }) => {
        setPhase(newPhase);
        if (newPhase === GAME_PHASES.OPINION) {
            setMyVote(null);
            setRoundResults(null);
        }
    };

    const handleNewRound = ({ opinion }) => {
        setCurrentOpinion(opinion);
    };

    const handleTimerUpdate = ({ seconds }) => {
        setTimer(seconds);
    };

    const handleRoundResults = (results) => {
        setRoundResults(results);
    };

    const handleFinalScores = (finalScores) => {
        setScores(finalScores);
    };

    const submitVote = (vote) => {
        if (myVote) return;
        setMyVote(vote);
        SocketService.emit('opinion-vote', {
            roomId: room.id,
            vote // 'agree' or 'disagree'
        });
    };

    const nextRound = () => {
        SocketService.emit('opinion-next', { roomId: room.id });
    };

    const endGame = () => {
        navigation.goBack();
    };

    // Render Phases

    const renderWaitingPhase = () => (
        <View style={styles.centeredContent}>
            <NeonText size={28} weight="bold" color={COLORS.limeGlow} glow>
                🔥 UNPOPULAR OPINIONS
            </NeonText>
            <NeonText size={16} color="#888" style={styles.subtitle}>
                Waiting for host to start...
            </NeonText>
            {isHost && (
                <NeonButton
                    title="START GAME"
                    onPress={() => SocketService.emit('opinion-start', { roomId: room.id })}
                    style={styles.startButton}
                />
            )}
        </View>
    );

    const renderOpinionPhase = () => (
        <View style={styles.gameContent}>
            <View style={styles.timerContainer}>
                <NeonText size={24} color={timer <= 5 ? COLORS.hotPink : COLORS.neonCyan} weight="bold" glow>
                    {timer}s
                </NeonText>
            </View>

            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <NeonText size={14} color="#666" style={styles.categoryBadge}>
                    {currentOpinion?.category || 'General'}
                </NeonText>
                <NeonText size={24} weight="bold" style={styles.opinionText}>
                    "{currentOpinion?.text}"
                </NeonText>
            </Animated.View>

            <View style={styles.voteContainer}>
                <TouchableOpacity
                    style={[
                        styles.voteButton,
                        styles.agreeButton,
                        myVote === 'agree' && styles.selectedAgree,
                        myVote === 'disagree' && styles.disabledVote
                    ]}
                    onPress={() => submitVote('agree')}
                    disabled={myVote !== null}
                >
                    <NeonText size={32}>👍</NeonText>
                    <NeonText size={18} weight="bold" color="#fff">AGREE</NeonText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.voteButton,
                        styles.disagreeButton,
                        myVote === 'disagree' && styles.selectedDisagree,
                        myVote === 'agree' && styles.disabledVote
                    ]}
                    onPress={() => submitVote('disagree')}
                    disabled={myVote !== null}
                >
                    <NeonText size={32}>👎</NeonText>
                    <NeonText size={18} weight="bold" color="#fff">DISAGREE</NeonText>
                </TouchableOpacity>
            </View>

            {myVote && (
                <NeonText size={16} color={COLORS.neonCyan} style={styles.votedText} glow>
                    Vote Cast! Waiting for others...
                </NeonText>
            )}
        </View>
    );

    const renderResultsPhase = () => {
        const agreeCount = roundResults?.agreeCount || 0;
        const disagreeCount = roundResults?.disagreeCount || 0;
        const total = agreeCount + disagreeCount;

        const agreePercent = total > 0 ? (agreeCount / total) * 100 : 0;
        const disagreePercent = total > 0 ? (disagreeCount / total) * 100 : 0;

        const isUnpopular = roundResults?.isUnpopular; // If true, the minority won points

        return (
            <View style={styles.resultsContent}>
                <NeonText size={14} color="#888" style={{ marginBottom: 20 }}>
                    "{currentOpinion?.text}"
                </NeonText>

                <View style={styles.barContainer}>
                    <View style={styles.resultBar}>
                        <View style={[styles.fillBar, { height: `${agreePercent}%`, backgroundColor: COLORS.neonCyan }]} />
                        <NeonText size={16} weight="bold" style={styles.barLabel}>{agreeCount}</NeonText>
                        <NeonText size={14} color="#888">AGREE</NeonText>
                    </View>

                    <View style={styles.resultBar}>
                        <View style={[styles.fillBar, { height: `${disagreePercent}%`, backgroundColor: COLORS.hotPink }]} />
                        <NeonText size={16} weight="bold" style={styles.barLabel}>{disagreeCount}</NeonText>
                        <NeonText size={14} color="#888">DISAGREE</NeonText>
                    </View>
                </View>

                <View style={styles.verdictBox}>
                    {isUnpopular ? (
                        <>
                            <NeonText size={24} color={COLORS.hotPink} weight="bold" glow>
                                UNPOPULAR OPINION!
                            </NeonText>
                            <NeonText size={14} color="#ccc" style={{ marginTop: 5 }}>
                                The minority gets points!
                            </NeonText>
                        </>
                    ) : (
                        <>
                            <NeonText size={24} color={COLORS.limeGlow} weight="bold" glow>
                                POPULAR OPINION!
                            </NeonText>
                            <NeonText size={14} color="#ccc" style={{ marginTop: 5 }}>
                                The majority gets points!
                            </NeonText>
                        </>
                    )}
                </View>

                {isHost && (
                    <NeonButton
                        title="NEXT OPINION"
                        onPress={nextRound}
                        style={styles.nextButton}
                    />
                )}
            </View>
        );
    };

    const renderFinalPhase = () => (
        <View style={styles.centeredContent}>
            <NeonText size={28} weight="bold" glow style={{ marginBottom: 30 }}>
                GAME OVER
            </NeonText>

            <View style={styles.scoresList}>
                {Object.entries(scores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, score], index) => (
                        <View key={name} style={styles.scoreRow}>
                            <NeonText size={20} color={index === 0 ? COLORS.gold : COLORS.white}>
                                {index + 1}. {name}
                            </NeonText>
                            <NeonText size={20} weight="bold" color={COLORS.neonCyan}>
                                {score} pts
                            </NeonText>
                        </View>
                    ))}
            </View>

            <NeonButton
                title="BACK TO LOBBY"
                onPress={endGame}
                style={styles.endButton}
            />
        </View>
    );

    return (
        <NeonContainer>
            <View style={styles.header}>
                <NeonText size={16} color={COLORS.limeGlow}>UNPOPULAR OPINIONS</NeonText>
                <NeonText size={12} color="#666">Room: {room.id}</NeonText>
            </View>

            {phase === GAME_PHASES.WAITING && renderWaitingPhase()}
            {phase === GAME_PHASES.OPINION && renderOpinionPhase()}
            {phase === GAME_PHASES.RESULTS && renderResultsPhase()}
            {phase === GAME_PHASES.FINAL && renderFinalPhase()}
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
        marginTop: 40,
        minWidth: 200
    },
    gameContent: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    timerContainer: {
        marginVertical: 20
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.limeGlow,
        marginBottom: 40
    },
    categoryBadge: {
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 15
    },
    opinionText: {
        textAlign: 'center',
        lineHeight: 32
    },
    voteContainer: {
        flexDirection: 'row',
        gap: 20,
        width: '100%'
    },
    voteButton: {
        flex: 1,
        height: 150,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
        gap: 10
    },
    agreeButton: {
        borderColor: COLORS.neonCyan
    },
    disagreeButton: {
        borderColor: COLORS.hotPink
    },
    selectedAgree: {
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        borderColor: COLORS.neonCyan,
        transform: [{ scale: 1.05 }]
    },
    selectedDisagree: {
        backgroundColor: 'rgba(255, 0, 128, 0.2)',
        borderColor: COLORS.hotPink,
        transform: [{ scale: 1.05 }]
    },
    disabledVote: {
        opacity: 0.3
    },
    votedText: {
        marginTop: 30
    },
    resultsContent: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    barContainer: {
        flexDirection: 'row',
        height: 200,
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 40
    },
    resultBar: {
        width: 80,
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    fillBar: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        minHeight: 4 // Ensure tiny bars are visible
    },
    barLabel: {
        marginVertical: 10
    },
    verdictBox: {
        alignItems: 'center',
        marginBottom: 40,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        width: '100%'
    },
    nextButton: {
        width: '100%'
    },
    scoresList: {
        width: '100%',
        marginBottom: 40
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    endButton: {
        width: '100%'
    }
});

export default UnpopularOpinionsScreen;
