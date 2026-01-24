import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const SpinTheBottleScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const spinValue = useRef(new Animated.Value(0)).current;

    const spinBottle = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setSelectedPlayer(null);

        // Random player selection
        const randomIndex = Math.floor(Math.random() * players.length);
        const selectedPlayerData = players[randomIndex];

        // Calculate rotation (multiple spins + landing on player)
        const spins = 3 + Math.random() * 2; // 3-5 full rotations
        const playerAngle = (360 / players.length) * randomIndex;
        const totalRotation = (spins * 360) + playerAngle;

        spinValue.setValue(0);
        Animated.timing(spinValue, {
            toValue: totalRotation,
            duration: 3000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start(() => {
            setIsSpinning(false);
            setSelectedPlayer(selectedPlayerData);
        });
    };

    const handleReset = () => {
        setSelectedPlayer(null);
        spinValue.setValue(0);
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg']
    });

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    SPIN THE BOTTLE
                </NeonText>
            </View>

            {/* Players Circle */}
            <View style={styles.playersCircle}>
                {players.map((player, index) => {
                    const angle = (360 / players.length) * index;
                    const radian = (angle * Math.PI) / 180;
                    const radius = 120;
                    const x = Math.cos(radian) * radius;
                    const y = Math.sin(radian) * radius;

                    return (
                        <View
                            key={player.id}
                            style={[
                                styles.playerDot,
                                {
                                    transform: [
                                        { translateX: x },
                                        { translateY: y }
                                    ]
                                },
                                selectedPlayer?.id === player.id && styles.selectedPlayer
                            ]}
                        >
                            <NeonText size={12} weight="bold">
                                {player.name}
                            </NeonText>
                        </View>
                    );
                })}

                {/* Bottle */}
                <Animated.View
                    style={[
                        styles.bottle,
                        {
                            transform: [{ rotate: spin }]
                        }
                    ]}
                >
                    <View style={styles.bottleNeck} />
                    <View style={styles.bottleBody} />
                </Animated.View>
            </View>

            {selectedPlayer && (
                <View style={styles.resultContainer}>
                    <NeonText size={20} color={COLORS.limeGlow}>
                        SELECTED PLAYER
                    </NeonText>
                    <NeonText size={36} weight="bold" color={COLORS.hotPink} glow>
                        {selectedPlayer.name}
                    </NeonText>
                </View>
            )}

            <View style={styles.actions}>
                {!selectedPlayer ? (
                    <NeonButton
                        title={isSpinning ? "SPINNING..." : "SPIN THE BOTTLE"}
                        onPress={spinBottle}
                        disabled={isSpinning}
                        style={styles.spinButton}
                    />
                ) : (
                    <>
                        <NeonButton
                            title="SPIN AGAIN"
                            onPress={handleReset}
                        />
                        <NeonButton
                            title="TRUTH OR DARE"
                            variant="secondary"
                            onPress={() => navigation.navigate('TruthOrDareCategorySelection', { players })}
                        />
                    </>
                )}
                <NeonButton
                    title="END GAME"
                    variant="secondary"
                    onPress={() => navigation.navigate('LocalGameSelection', { players })}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    playersCircle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    playerDot: {
        position: 'absolute',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        minWidth: 60,
        alignItems: 'center',
    },
    selectedPlayer: {
        borderColor: COLORS.limeGlow,
        borderWidth: 3,
        backgroundColor: 'rgba(198, 255, 74, 0.2)',
    },
    bottle: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottleNeck: {
        width: 15,
        height: 60,
        backgroundColor: COLORS.neonCyan,
        borderRadius: 8,
        marginBottom: -5,
    },
    bottleBody: {
        width: 40,
        height: 80,
        backgroundColor: COLORS.neonCyan,
        borderRadius: 20,
        opacity: 0.8,
    },
    resultContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.hotPink,
        marginBottom: 20,
    },
    actions: {
        gap: 10,
    },
    spinButton: {
        minHeight: 60,
    }
});

export default SpinTheBottleScreen;
