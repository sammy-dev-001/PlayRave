import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const OnlineTruthOrDareCategoryScreen = ({ route, navigation }) => {
    const { room, isHost, playerName } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('normal');

    const categories = [
        {
            id: 'mixed',
            name: 'MIXED',
            description: 'Random mix of all categories',
            color: COLORS.neonCyan,
            icon: '🎲'
        },
        {
            id: 'normal',
            name: 'NORMAL',
            description: 'Fun and friendly questions and dares',
            color: COLORS.limeGlow,
            icon: '😊'
        },
        {
            id: 'spicy',
            name: 'SPICY',
            description: 'Bold questions and daring challenges',
            color: COLORS.hotPink,
            icon: '🌶️'
        },
        {
            id: 'naughty',
            name: 'NAUGHTY',
            description: 'Adults only - explicit content',
            color: COLORS.electricPurple,
            icon: '🔞'
        }
    ];

    React.useEffect(() => {
        const onGameStarted = ({ gameType, gameState, players }) => {
            if (gameType === 'truth-or-dare') {
                console.log('Truth or Dare game started:', gameState);
                navigation.navigate('OnlineTruthOrDareGame', {
                    room,
                    isHost,
                    category: selectedCategory,
                    gameState,
                    players
                });
            }
        };

        SocketService.on('game-started', onGameStarted);

        return () => {
            SocketService.off('game-started', onGameStarted);
        };
    }, [navigation, room, isHost, selectedCategory]);

    const handleStartGame = () => {
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: 'truth-or-dare',
            hostParticipates: true,
            category: selectedCategory
        });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    TRUTH OR DARE
                </NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    Choose your category
                </NeonText>
            </View>

            <View style={styles.categoriesContainer}>
                {categories.map(category => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryCard,
                            { borderColor: category.color },
                            selectedCategory === category.id && styles.selectedCard
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                    >
                        <NeonText size={48} style={styles.categoryIcon}>
                            {category.icon}
                        </NeonText>
                        <NeonText
                            size={24}
                            weight="bold"
                            color={selectedCategory === category.id ? category.color : COLORS.white}
                            glow={selectedCategory === category.id}
                        >
                            {category.name}
                        </NeonText>
                        <NeonText size={14} color="#888" style={styles.categoryDescription}>
                            {category.description}
                        </NeonText>
                        {selectedCategory === category.id && (
                            <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                                <NeonText size={12} weight="bold" color="#000">
                                    SELECTED
                                </NeonText>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {isHost ? (
                <NeonButton
                    title="START GAME"
                    onPress={handleStartGame}
                    style={styles.startButton}
                />
            ) : (
                <View style={styles.waitingContainer}>
                    <NeonText size={16} color="#888">
                        Waiting for host to start the game...
                    </NeonText>
                </View>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    subtitle: {
        marginTop: 10,
    },
    categoriesContainer: {
        gap: 15,
        marginBottom: 30,
        flex: 1,
    },
    categoryCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
    },
    selectedCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 3,
    },
    categoryIcon: {
        marginBottom: 8,
    },
    categoryDescription: {
        marginTop: 6,
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    startButton: {
        marginTop: 'auto',
    },
    waitingContainer: {
        padding: 20,
        alignItems: 'center',
    },
});

export default OnlineTruthOrDareCategoryScreen;
