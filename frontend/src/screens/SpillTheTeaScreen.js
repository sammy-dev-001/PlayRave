import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Animated,
    Dimensions
} from 'react-native';
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
    const { room, playerName, isHost } = route.params;

    useGameDisconnectHandler({
        navigation,
        exitScreen: 'Lobby',
        exitParams: { room, isHost }
    });

    const [phase, setPhase] = useState(GAME_PHASES.WAITING);
    const [secret, setSecret] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    
    // Server state
    const [submissionsCount, setSubmissionsCount] = useState(0);
    const [totalNeeded, setTotalNeeded] = useState(room.players.length);
    const [currentSecret, setCurrentSecret] = useState(null);
    const [currentSecretIndex, setCurrentSecretIndex] = useState(0);
    const [totalSecrets, setTotalSecrets] = useState(0);
    const [currentAuthorId, setCurrentAuthorId] = useState(null);
    const [hasRevealedIdentity, setHasRevealedIdentity] = useState(false);
    const [revealedAuthorName, setRevealedAuthorName] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // We sync state directly when the game starts or reconnects
        SocketService.on('spill-tea-state-update', handleStateUpdate);
        SocketService.on('spill-tea-new-secret', handleNewSecret);
        SocketService.on('spill-tea-author-revealed', handleAuthorRevealed);
        SocketService.on('game-state-sync', handleGameStateSync);

        // Fetch initial state if we reconnected or started
        SocketService.emit('request-room-sync', { roomId: room.id, userId: SocketService.socket.id });

        return () => {
            SocketService.off('spill-tea-state-update', handleStateUpdate);
            SocketService.off('spill-tea-new-secret', handleNewSecret);
            SocketService.off('spill-tea-author-revealed', handleAuthorRevealed);
            SocketService.off('game-state-sync', handleGameStateSync);
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

    const handleStateUpdate = (state) => {
        if (!state) return;
        setPhase(state.status);
        if (state.status === GAME_PHASES.SUBMISSION) {
            setSubmissionsCount(state.submissionsCount);
            setTotalNeeded(state.totalNeeded);
        } else if (state.status === GAME_PHASES.READING) {
            setCurrentSecretIndex(state.currentSecretIndex);
            setTotalSecrets(state.totalSecrets);
            setCurrentSecret(state.currentSecret);
            setCurrentAuthorId(state.currentAuthorId);
            setHasRevealedIdentity(state.hasRevealedIdentity);
            if (!state.hasRevealedIdentity) {
                setRevealedAuthorName(null);
            }
        }
    };

    const handleNewSecret = (data) => {
        // Trigger animation reset
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        setCurrentSecret(data.secret);
        setCurrentAuthorId(data.authorId);
        setCurrentSecretIndex(data.index);
        setTotalSecrets(data.total);
        setHasRevealedIdentity(false);
        setRevealedAuthorName(null);
    };

    const handleAuthorRevealed = ({ authorId }) => {
        setHasRevealedIdentity(true);
        // Map authorId to player name using the room data
        const authorPlayer = room.players.find(p => p.id === authorId);
        setRevealedAuthorName(authorPlayer ? authorPlayer.name : 'Someone');
        
        // Emphasize animation
        scaleAnim.setValue(1.2);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true
        }).start();
    };

    const handleGameStateSync = (data) => {
        if (data && data.gameType === 'spill-the-tea') {
            handleStateUpdate(data.gameState);
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
        const isMySecret = SocketService.socket.id === currentAuthorId;

        // Host hasn't clicked next yet for the first one
        if (currentSecretIndex === -1) {
            return (
                <View style={styles.centeredContainer}>
                    <NeonText size={22} weight="bold" glow color={COLORS.hotPink}>
                        ALL SECRETS GATHERED!
                    </NeonText>
                    <NeonText size={16} color="#888" style={{ marginTop: 15 }}>
                        Host, it's time to spill the tea...
                    </NeonText>
                    {isHost && (
                        <NeonButton
                            title="REVEAL FIRST SECRET"
                            onPress={revealNext}
                            style={styles.nextButton}
                        />
                    )}
                </View>
            );
        }

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
                                {revealedAuthorName || 'Unknown'}
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
                onPress={() => {
                    try {
                        navigation.navigate("Lobby", { room });
                    } catch (e) {
                        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                    }
                }}
                style={{ marginTop: 40 }}
            />
        </View>
    );

    const renderPhase = () => {
        // If we haven't received state yet or haven't started explicitly
        if (phase === GAME_PHASES.WAITING) {
            // Assume submission phase kicks in based on state sync
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
            default: return null;
        }
    };

    return (
        <GameOverlay roomId={room.id} playerName={playerName}>
            <MuteButton />
            <View style={styles.header}>
                <NeonText size={18} color={COLORS.hotPink} weight="bold">SPILL THE TEA</NeonText>
            </View>
            {renderPhase()}
        </GameOverlay>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,105,180,0.3)',
        backgroundColor: 'rgba(0,0,0,0.3)'
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
