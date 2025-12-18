import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const NeonTapGameScreen = ({ route, navigation }) => {
    const { room, hostParticipates, isHost } = route.params;
    const [gameState, setGameState] = useState('waiting'); // waiting, countdown, playing, tapped
    const [countdown, setCountdown] = useState(3);
    const [circlePosition, setCirclePosition] = useState(null);
    const [roundStartTime, setRoundStartTime] = useState(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(10);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const canTap = !isHost || hostParticipates;

    useEffect(() => {
        // Start first round
        if (isHost) {
            setTimeout(() => {
                SocketService.emit('start-neon-tap-round', { roomId: room.id });
            }, 1000);
        }

        const onRoundStarted = ({ circlePosition: pos, roundStartTime: startTime, currentRound: round, totalRounds: total }) => {
            console.log('Round started:', pos, startTime);
            setCirclePosition(pos);
            setRoundStartTime(startTime);
            setCurrentRound(round);
            setTotalRounds(total);
            setGameState('countdown');
            setCountdown(3);

            // Countdown before showing circle
            let count = 3;
            const countdownInterval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) {
                    clearInterval(countdownInterval);
                    setGameState('playing');
                    startPulseAnimation();
                }
            }, 1000);
        };

        const onResults = (results) => {
            console.log('Neon Tap results received:', results);
            navigation.navigate('NeonTapResults', { room, results, hostParticipates, isHost });
        };

        const onReadyForNext = () => {
            console.log('Ready for next round');
            setGameState('waiting');
            setCirclePosition(null);
            if (isHost) {
                setTimeout(() => {
                    SocketService.emit('start-neon-tap-round', { roomId: room.id });
                }, 500);
            }
        };

        const onGameFinished = ({ finalScores }) => {
            console.log('Game finished:', finalScores);
            navigation.navigate('Scoreboard', { room, finalScores });
        };

        SocketService.on('neon-tap-round-started', onRoundStarted);
        SocketService.on('neon-tap-results', onResults);
        SocketService.on('neon-tap-ready-for-next', onReadyForNext);
        SocketService.on('game-finished', onGameFinished);

        return () => {
            SocketService.off('neon-tap-round-started', onRoundStarted);
            SocketService.off('neon-tap-results', onResults);
            SocketService.off('neon-tap-ready-for-next', onReadyForNext);
            SocketService.off('game-finished', onGameFinished);
        };
    }, [navigation, room, isHost, hostParticipates]);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    const handleTap = () => {
        if (gameState !== 'playing' || !canTap) return;

        const tapTime = Date.now();
        const reactionTime = tapTime - roundStartTime;

        console.log('Tapped! Reaction time:', reactionTime);
        setGameState('tapped');
        pulseAnim.stopAnimation();

        SocketService.emit('submit-neon-tap', { roomId: room.id, reactionTime });

        // Auto-show results after 2 seconds
        setTimeout(() => {
            if (isHost) {
                SocketService.emit('show-neon-tap-results', { roomId: room.id });
            }
        }, 2000);
    };

    const renderCircle = () => {
        if (!circlePosition || gameState !== 'playing') return null;

        const circleSize = 100;
        const left = (width - circleSize) * circlePosition.x;
        const top = (height - circleSize) * circlePosition.y;

        return (
            <Animated.View
                style={[
                    styles.circle,
                    {
                        left,
                        top,
                        width: circleSize,
                        height: circleSize,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.circleTouchable}
                    onPress={handleTap}
                    activeOpacity={0.8}
                />
            </Animated.View>
        );
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={14} color={COLORS.hotPink}>
                    ROUND {currentRound + 1} / {totalRounds}
                </NeonText>
            </View>

            <View style={styles.gameArea}>
                {gameState === 'waiting' && (
                    <NeonText size={24} weight="bold" style={styles.centerText}>
                        GET READY...
                    </NeonText>
                )}

                {gameState === 'countdown' && (
                    <NeonText size={72} weight="bold" color={COLORS.limeGlow} style={styles.centerText}>
                        {countdown}
                    </NeonText>
                )}

                {gameState === 'playing' && renderCircle()}

                {gameState === 'tapped' && (
                    <NeonText size={32} weight="bold" color={COLORS.limeGlow} style={styles.centerText}>
                        TAPPED! ⚡
                    </NeonText>
                )}

                {!canTap && gameState === 'playing' && (
                    <NeonText style={styles.spectatorText}>
                        (Spectating)
                    </NeonText>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerText: {
        textAlign: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: COLORS.limeGlow,
        shadowColor: COLORS.limeGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 10,
    },
    circleTouchable: {
        width: '100%',
        height: '100%',
        borderRadius: 1000,
    },
    spectatorText: {
        position: 'absolute',
        bottom: 50,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#888',
        fontSize: 14,
    }
});

export default NeonTapGameScreen;
