import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import SocketService from '../services/socket';

const LieDetectorScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState: initialState } = route.params;
    const roomId = room?.id;

    const [phase, setPhase] = useState(initialState?.phase || 'answering');
    const [currentPlayer, setCurrentPlayer] = useState(initialState?.currentPlayer);
    const [question, setQuestion] = useState(initialState?.question);
    const [answer, setAnswer] = useState('');
    const [playerAnswer, setPlayerAnswer] = useState('');
    const [selectedChoice, setSelectedChoice] = useState(null); // 'truth' or 'lie' for subject
    const [myVote, setMyVote] = useState(null);
    const [voteCount, setVoteCount] = useState(0);
    const [totalVoters, setTotalVoters] = useState(0);
    const [revealData, setRevealData] = useState(null);
    const [scores, setScores] = useState(initialState?.scores || {});
    const [roundInfo, setRoundInfo] = useState({ current: 1, total: 10 });
    const [finished, setFinished] = useState(false);
    const [rankings, setRankings] = useState([]);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const myId = SocketService.socket?.id;
    const isMyTurn = currentPlayer?.id === myId;

    useEffect(() => {
        // Pulse animation for active player
        if (isMyTurn && phase === 'answering') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        }
    }, [isMyTurn, phase]);

    useEffect(() => {
        SocketService.on('lie-detector-voting-started', ({ gameState, answer: ans }) => {
            setPhase('voting');
            setPlayerAnswer(ans);
            setVoteCount(0);
            setTotalVoters(gameState.totalVoters);
        });

        SocketService.on('lie-detector-vote-received', ({ voteCount: count }) => {
            setVoteCount(count);
        });

        SocketService.on('lie-detector-reveal', (data) => {
            setPhase('reveal');
            setRevealData(data);
            setScores(data.scores);
        });

        SocketService.on('lie-detector-next-round-ready', ({ gameState }) => {
            setPhase('answering');
            setCurrentPlayer(gameState.currentPlayer);
            setQuestion(gameState.question);
            setRoundInfo({ current: gameState.roundsPlayed + 1, total: gameState.totalRounds });
            setScores(gameState.scores);
            setAnswer('');
            setSelectedChoice(null);
            setMyVote(null);
            setRevealData(null);
        });

        SocketService.on('lie-detector-game-finished', (data) => {
            setFinished(true);
            setRankings(data.rankings);
        });

        return () => {
            SocketService.off('lie-detector-voting-started');
            SocketService.off('lie-detector-vote-received');
            SocketService.off('lie-detector-reveal');
            SocketService.off('lie-detector-next-round-ready');
            SocketService.off('lie-detector-game-finished');
        };
    }, []);

    const handleSubmitAnswer = () => {
        if (!answer.trim() || !selectedChoice) return;
        SocketService.emit('lie-detector-submit-answer', {
            roomId, answer: answer.trim(), isLie: selectedChoice === 'lie'
        });
    };

    const handleVote = (vote) => {
        if (myVote) return;
        setMyVote(vote);
        SocketService.emit('lie-detector-submit-vote', { roomId, vote });
    };

    const handleNextRound = () => {
        SocketService.emit('lie-detector-next-round', { roomId });
    };

    const handleEndGame = () => {
        SocketService.emit('lie-detector-end-game', { roomId });
        navigation.navigate('Lobby', { room, playerName });
    };

    // Render different phases
    const renderAnsweringPhase = () => (
        <View style={styles.phaseContainer}>
            <NeonText size={14} color={COLORS.hotPink}>ROUND {roundInfo.current}/{roundInfo.total}</NeonText>

            <View style={styles.playerSpotlight}>
                <Animated.View style={[styles.playerAvatar, { transform: [{ scale: pulseAnim }] }]}>
                    <NeonText size={48}>{currentPlayer?.avatar || '👤'}</NeonText>
                </Animated.View>
                <NeonText size={20} weight="bold" glow>{currentPlayer?.name}</NeonText>
                <NeonText size={14} color={isMyTurn ? COLORS.limeGlow : '#888'}>
                    {isMyTurn ? "IT'S YOUR TURN!" : "is in the hot seat"}
                </NeonText>
            </View>

            <View style={styles.questionCard}>
                <NeonText size={18} weight="bold" style={styles.questionText}>{question}</NeonText>
            </View>

            {isMyTurn ? (
                <View style={styles.answerSection}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your answer..."
                        placeholderTextColor="#555"
                        value={answer}
                        onChangeText={setAnswer}
                        multiline
                    />
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.choiceLabel}>
                        Will you tell the truth or lie?
                    </NeonText>
                    <View style={styles.choiceButtons}>
                        <TouchableOpacity
                            style={[styles.choiceBtn, selectedChoice === 'truth' && styles.truthSelected]}
                            onPress={() => setSelectedChoice('truth')}
                        >
                            <NeonText size={24}>✓</NeonText>
                            <NeonText size={14} color={selectedChoice === 'truth' ? '#fff' : '#888'}>TRUTH</NeonText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.choiceBtn, selectedChoice === 'lie' && styles.lieSelected]}
                            onPress={() => setSelectedChoice('lie')}
                        >
                            <NeonText size={24}>✗</NeonText>
                            <NeonText size={14} color={selectedChoice === 'lie' ? '#fff' : '#888'}>LIE</NeonText>
                        </TouchableOpacity>
                    </View>
                    <NeonButton
                        title="SUBMIT"
                        onPress={handleSubmitAnswer}
                        disabled={!answer.trim() || !selectedChoice}
                        style={styles.submitBtn}
                    />
                </View>
            ) : (
                <View style={styles.waitingSection}>
                    <NeonText size={16} color="#888">Waiting for {currentPlayer?.name} to answer...</NeonText>
                </View>
            )}
        </View>
    );

    const renderVotingPhase = () => (
        <View style={styles.phaseContainer}>
            <NeonText size={14} color={COLORS.hotPink}>VOTING TIME</NeonText>

            <View style={styles.playerSpotlight}>
                <NeonText size={48}>{currentPlayer?.avatar || '👤'}</NeonText>
                <NeonText size={20} weight="bold">{currentPlayer?.name} says:</NeonText>
            </View>

            <View style={styles.answerCard}>
                <NeonText size={20} weight="bold" style={styles.answerText}>"{playerAnswer}"</NeonText>
            </View>

            {isMyTurn ? (
                <View style={styles.waitingSection}>
                    <NeonText size={16} color={COLORS.neonCyan}>Others are voting on your answer...</NeonText>
                    <NeonText size={14} color="#888">{voteCount}/{totalVoters} votes</NeonText>
                </View>
            ) : myVote ? (
                <View style={styles.waitingSection}>
                    <NeonText size={16} color={COLORS.limeGlow}>Vote submitted! ({myVote.toUpperCase()})</NeonText>
                    <NeonText size={14} color="#888">Waiting for others... {voteCount}/{totalVoters}</NeonText>
                </View>
            ) : (
                <View style={styles.voteSection}>
                    <NeonText size={16} style={styles.votePrompt}>Is this the TRUTH or a LIE?</NeonText>
                    <View style={styles.voteButtons}>
                        <TouchableOpacity style={[styles.voteBtn, styles.truthBtn]} onPress={() => handleVote('truth')}>
                            <NeonText size={32}>✓</NeonText>
                            <NeonText size={18} weight="bold">TRUTH</NeonText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.voteBtn, styles.lieBtn]} onPress={() => handleVote('lie')}>
                            <NeonText size={32}>✗</NeonText>
                            <NeonText size={18} weight="bold">LIE</NeonText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    const renderRevealPhase = () => (
        <View style={styles.phaseContainer}>
            <NeonText size={14} color={COLORS.hotPink}>THE TRUTH IS OUT!</NeonText>

            <View style={[styles.revealCard, revealData?.wasLie ? styles.lieReveal : styles.truthReveal]}>
                <NeonText size={48}>{revealData?.wasLie ? '🤥' : '😇'}</NeonText>
                <NeonText size={24} weight="bold">IT WAS A {revealData?.wasLie ? 'LIE!' : 'TRUTH!'}</NeonText>
                <NeonText size={14} color="#888" style={{ marginTop: 10 }}>
                    {currentPlayer?.name} fooled {revealData?.fooledCount || 0} player(s)
                </NeonText>
            </View>

            {isHost && (
                <NeonButton title="NEXT ROUND" onPress={handleNextRound} style={styles.nextBtn} />
            )}
        </View>
    );

    const renderFinished = () => (
        <View style={styles.phaseContainer}>
            <NeonText size={24} weight="bold" glow>🏆 GAME OVER!</NeonText>
            <View style={styles.rankingsContainer}>
                {rankings.map((player, idx) => (
                    <View key={player.id} style={[styles.rankRow, idx === 0 && styles.winnerRow]}>
                        <NeonText size={20}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</NeonText>
                        <NeonText size={16}>{player.avatar}</NeonText>
                        <NeonText size={16} weight="bold" style={{ flex: 1 }}>{player.name}</NeonText>
                        <NeonText size={16} color={COLORS.limeGlow}>{player.score} pts</NeonText>
                    </View>
                ))}
            </View>
            <NeonButton title="BACK TO LOBBY" onPress={handleEndGame} style={styles.endBtn} />
        </View>
    );

    return (
        <NeonContainer scrollable>
            <View style={styles.container}>
                <NeonText size={28} weight="bold" glow style={styles.title}>🔍 LIE DETECTOR</NeonText>

                {finished ? renderFinished() :
                    phase === 'answering' ? renderAnsweringPhase() :
                        phase === 'voting' ? renderVotingPhase() :
                            phase === 'reveal' ? renderRevealPhase() : null}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
    title: { textAlign: 'center', marginBottom: 20 },
    phaseContainer: { flex: 1, alignItems: 'center' },
    playerSpotlight: { alignItems: 'center', marginVertical: 20 },
    playerAvatar: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 10
    },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15,
        padding: 25, width: '100%', marginVertical: 20
    },
    questionText: { textAlign: 'center' },
    answerSection: { width: '100%' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
        padding: 15, color: '#fff', fontSize: 16, minHeight: 80, textAlignVertical: 'top'
    },
    choiceLabel: { marginTop: 20, marginBottom: 10, textAlign: 'center' },
    choiceButtons: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
    choiceBtn: {
        flex: 1, padding: 15, borderRadius: 12, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)'
    },
    truthSelected: { borderColor: COLORS.limeGlow, backgroundColor: 'rgba(198,255,74,0.15)' },
    lieSelected: { borderColor: COLORS.hotPink, backgroundColor: 'rgba(255,87,170,0.15)' },
    submitBtn: { marginTop: 20 },
    waitingSection: { alignItems: 'center', marginTop: 30 },
    answerCard: {
        backgroundColor: 'rgba(0,255,255,0.1)', borderRadius: 15,
        padding: 25, width: '100%', marginVertical: 20, borderWidth: 2, borderColor: COLORS.neonCyan
    },
    answerText: { textAlign: 'center' },
    voteSection: { width: '100%', alignItems: 'center' },
    votePrompt: { marginBottom: 20 },
    voteButtons: { flexDirection: 'row', gap: 20, width: '100%' },
    voteBtn: { flex: 1, padding: 25, borderRadius: 15, alignItems: 'center' },
    truthBtn: { backgroundColor: 'rgba(198,255,74,0.2)', borderWidth: 2, borderColor: COLORS.limeGlow },
    lieBtn: { backgroundColor: 'rgba(255,87,170,0.2)', borderWidth: 2, borderColor: COLORS.hotPink },
    revealCard: { padding: 30, borderRadius: 20, alignItems: 'center', marginVertical: 30 },
    truthReveal: { backgroundColor: 'rgba(198,255,74,0.15)', borderWidth: 3, borderColor: COLORS.limeGlow },
    lieReveal: { backgroundColor: 'rgba(255,87,170,0.15)', borderWidth: 3, borderColor: COLORS.hotPink },
    nextBtn: { marginTop: 30, width: '100%' },
    rankingsContainer: { width: '100%', marginVertical: 20 },
    rankRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, marginBottom: 10
    },
    winnerRow: { backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 2, borderColor: '#FFD700' },
    endBtn: { marginTop: 20 }
});

export default LieDetectorScreen;
