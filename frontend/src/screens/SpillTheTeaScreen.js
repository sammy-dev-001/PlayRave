import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import GameOverlay from '../components/GameOverlay';
import MuteButton from '../components/MuteButton';
import { COLORS } from '../constants/theme';
import SocketService from '../services/socket';
import { useGameDisconnectHandler } from '../hooks/useGameDisconnectHandler';

const GAME_PHASES = {
    WAITING: 'waiting',
    SUBMISSION: 'SUBMISSION',
    READING: 'READING',
    FINISHED: 'FINISHED'
};

const SpillTheTeaScreen = ({ route, navigation }) => {
    const { room, playerName, isHost, gameState, players: initialPlayers } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState(gameState?.phase || gameState?.status || GAME_PHASES.WAITING);
    const [secret, setSecret] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    
    // Server state
    const [submissionsCount, setSubmissionsCount] = useState(gameState?.submittedCount || 0);
    const [totalNeeded, setTotalNeeded] = useState(initialPlayers?.length || room?.players?.length || 0);
    const [currentSecret, setCurrentSecret] = useState(gameState?.currentSecret || null);
    const [currentSecretIndex, setCurrentSecretIndex] = useState(gameState?.currentSecretIndex || 0);
    const [totalSecrets, setTotalSecrets] = useState(gameState?.totalSecrets || 0);
    const [currentAuthorId, setCurrentAuthorId] = useState(gameState?.currentAuthorId || null);
    const [hasRevealedIdentity, setHasRevealedIdentity] = useState(gameState?.hasRevealedIdentity || false);
    const [revealedAuthorName, setRevealedAuthorName] = useState(null);
    const [players, setPlayers] = useState(initialPlayers || room?.players || []);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        SocketService.on('game-started', handleGameStarted);
        SocketService.on('spill-tea-state-update', handleStateUpdate);
        SocketService.on('spill-tea-new-secret', handleNewSecret);
        SocketService.on('spill-tea-author-revealed', handleAuthorRevealed);
        SocketService.on('game-state-sync', handleGameStateSync);
        SocketService.on('room-updated', handleRoomUpdate);

        // Fetch initial state
        SocketService.emit('get-state', { roomId: room.id });

        return () => {
            SocketService.off('game-started', handleGameStarted);
            SocketService.off('spill-tea-state-update', handleStateUpdate);
            SocketService.off('spill-tea-new-secret', handleNewSecret);
            SocketService.off('spill-tea-author-revealed', handleAuthorRevealed);
            SocketService.off('game-state-sync', handleGameStateSync);
            SocketService.off('room-updated', handleRoomUpdate);
        };
    }, [room.id]);

    useEffect(() => {
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
    }, [currentSecretIndex, phase]);

    const handleGameStarted = (data) => {
        if (data.gameState) {
            handleStateUpdate(data.gameState);
        }
    };

    const handleRoomUpdate = (updatedRoom) => {
        setPlayers(updatedRoom.players || []);
        setTotalNeeded(updatedRoom.players.length);
    };

    const handleStateUpdate = (state) => {
        if (!state) return;
        const newStatus = state.status || state.phase;
        if (newStatus) setPhase(newStatus);
        
        if (state.submissionsCount !== undefined) setSubmissionsCount(state.submissionsCount);
        if (state.totalNeeded !== undefined) setTotalNeeded(state.totalNeeded);
        
        if (state.currentSecretIndex !== undefined) setCurrentSecretIndex(state.currentSecretIndex);
        if (state.totalSecrets !== undefined) setTotalSecrets(state.totalSecrets);
        if (state.currentSecret !== undefined) setCurrentSecret(state.currentSecret);
        if (state.currentAuthorId !== undefined) setCurrentAuthorId(state.currentAuthorId);
        if (state.hasRevealedIdentity !== undefined) setHasRevealedIdentity(state.hasRevealedIdentity);
        
        if (state.rankings) {
            // Handle results if needed
        }
    };

    const handleNewSecret = (data) => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        setCurrentSecret(data.secret);
        setCurrentAuthorId(data.authorId);
        setCurrentSecretIndex(data.index);
        setTotalSecrets(data.total);
        setHasRevealedIdentity(false);
        setRevealedAuthorName(null);
        setPhase(GAME_PHASES.READING);
    };

    const handleAuthorRevealed = ({ authorId }) => {
        setHasRevealedIdentity(true);
        const authorPlayer = players.find(p => p.userId === authorId || p.uid === authorId || p.id === authorId);
        setRevealedAuthorName(authorPlayer ? authorPlayer.name : 'Someone');
        
        scaleAnim.setValue(1.2);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true
        }).start();
    };

    const handleGameStateSync = (data) => {
        if (data && (data.gameType === 'spill-the-tea' || data.type === 'spill-the-tea')) {
            handleStateUpdate(data.gameState || data);
        }
    };

    const submitSecret = () => {
        if (!secret.trim() || hasSubmitted) return;
        SocketService.emit('submit-spill-tea-secret', {
            roomId: room.id,
            text: secret.trim()
        });
        setHasSubmitted(true);
    };

    const revealNext = () => {
        SocketService.emit('host-next-spill-tea', { roomId: room.id });
    };

    const revealMyIdentity = () => {
        SocketService.emit('author-reveal-spill-tea', { roomId: room.id });
    };

    const renderSubmissionPhase = () => (
        <View style={styles.submissionContainer}>
            <NeonText size={26} weight="bold" style={styles.phaseTitle} glow color={COLORS.neonCyan}>
                SPILL THE TEA
            </NeonText>

            <NeonText size={16} color="#aaa" style={styles.hint}>
                Write a secret, unpopular opinion, or hot take. It will be completely anonymous... unless you choose to reveal yourself later!
            </NeonText>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type your secret here..."
                    placeholderTextColor="#666"
                    value={secret}
                    onChangeText={setSecret}
                    multiline
                    maxLength={250}
                    editable={!hasSubmitted}
                />
                <NeonText size={12} color="#666" style={styles.charCount}>
                    {secret.length}/250
                </NeonText>
            </View>

            {hasSubmitted ? (
                <View style={styles.submittedBadge}>
                    <NeonText size={20} color={COLORS.limeGlow}>
                        Secret Locked In! 🔒
                    </NeonText>
                    <NeonText size={16} color="#888" style={{ marginTop: 15 }}>
                        Waiting for others... ({submissionsCount}/{totalNeeded})
                    </NeonText>
                </View>
            ) : (
                <NeonButton
                    title="SUBMIT SECRET"
                    onPress={submitSecret}
                    disabled={!secret.trim()}
                    style={styles.submitButton}
                />
            )}
        </View>
    );

    const renderReadingPhase = () => {
        const isMySecret = SocketService.userId === currentAuthorId || SocketService.socketId === currentAuthorId;

        return (
            <View style={styles.readingContainer}>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.secretCount}>
                    Secret {currentSecretIndex + 1} of {totalSecrets}
                </NeonText>

                <Animated.View style={[styles.secretCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <NeonText size={22} style={styles.secretText} weight="bold">
                        "{currentSecret}"
                    </NeonText>
                </Animated.View>

                <View style={styles.actionContainer}>
                    {hasRevealedIdentity ? (
                        <View style={styles.revealedBox}>
                            <NeonText size={18} color="#aaa">This tea belongs to:</NeonText>
                            <NeonText size={32} weight="bold" color={COLORS.hotPink} glow style={styles.revealedName}>
                                {revealedAuthorName || 'Someone'}
                            </NeonText>
                        </View>
                    ) : (
                        isMySecret && (
                            <NeonButton
                                title="REVEAL IT WAS ME! 👁️"
                                onPress={revealMyIdentity}
                                style={styles.revealIdentityBtn}
                                color={COLORS.hotPink}
                            />
                        )
                    )}
                </View>

                {isHost && (
                    <NeonButton
                        title={currentSecretIndex + 1 >= totalSecrets ? "FINISH GAME" : "REVEAL NEXT"}
                        onPress={revealNext}
                        style={styles.nextButton}
                    />
                )}
            </View>
        );
    };

    const renderFinishedPhase = () => (
        <View style={styles.centeredContainer}>
            <NeonText size={30} weight="bold" glow color={COLORS.hotPink}>
                THAT'S ALL THE TEA!
            </NeonText>
            <NeonText size={16} color="#aaa" style={{ marginTop: 20, textAlign: 'center' }}>
                All secrets have been spilled. Friendships may never be the same.
            </NeonText>
            
            <NeonButton
                title="BACK TO LOBBY"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 40 }}
            />
        </View>
    );

    const renderPhase = () => {
        if (phase === GAME_PHASES.WAITING) {
            return (
                <View style={styles.centeredContainer}>
                    <NeonText size={24} weight="bold" glow>
                        LOADING TEA...
                    </NeonText>
                </View>
            );
        }
        
        switch (phase) {
            case GAME_PHASES.SUBMISSION: return renderSubmissionPhase();
            case GAME_PHASES.READING: return renderReadingPhase();
            case GAME_PHASES.FINISHED: return renderFinishedPhase();
            default: return renderSubmissionPhase(); // Default fallback
        }
    };

    return (
        <NeonContainer>
            <GameOverlay roomId={room.id} playerName={playerName}>
                <View style={styles.header}>
                    <NeonText size={18} color={COLORS.hotPink} weight="bold">SPILL THE TEA</NeonText>
                </View>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    {renderPhase()}
                </ScrollView>
            </GameOverlay>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,105,180,0.3)',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    submissionContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        marginTop: 20
    },
    phaseTitle: {
        marginBottom: 15,
        textAlign: 'center'
    },
    hint: {
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 22
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30
    },
    textInput: {
        width: '100%',
        minHeight: 150,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: COLORS.neonCyan,
        borderRadius: 15,
        padding: 20,
        color: COLORS.white,
        fontSize: 18,
        textAlignVertical: 'top'
    },
    charCount: {
        textAlign: 'right',
        marginTop: 8
    },
    submittedBadge: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(198, 255, 74, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(198, 255, 74, 0.3)',
        width: '100%'
    },
    submitButton: {
        minWidth: 250,
        height: 60
    },
    readingContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
    },
    secretCount: {
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10
    },
    secretCard: {
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        borderRadius: 20,
        padding: 30,
        marginBottom: 30,
        width: '100%',
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center'
    },
    secretText: {
        textAlign: 'center',
        lineHeight: 32,
        color: COLORS.white
    },
    actionContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    revealIdentityBtn: {
        minWidth: 250,
        height: 60
    },
    revealedBox: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 15,
        width: '100%'
    },
    revealedName: {
        marginTop: 10
    },
    nextButton: {
        marginTop: 20,
        minWidth: 250,
        marginBottom: 30
    }
});

export default SpillTheTeaScreen;
