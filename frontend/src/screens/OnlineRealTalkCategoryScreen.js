import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import SocketService from '../services/socket';
import { REAL_TALK_CATEGORIES } from '../data/realTalkData';

const OnlineRealTalkCategoryScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { room, isHost } = route.params;
    const [selectedCategory, setSelectedCategory] = useState(REAL_TALK_CATEGORIES[0].id);

    const handleStart = () => {
        if (!isHost) return;
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: 'real-talk',
            options: { categoryId: selectedCategory }
        });
    };

    React.useEffect(() => {
        const onGameStarted = (payload) => {
            if (payload.gameType === 'real-talk') {
                navigation.navigate('OnlineRealTalk', {
                    room,
                    isHost,
                    gameState: payload.gameState
                });
            }
        };
        SocketService.on('game-started', onGameStarted);
        return () => SocketService.off('game-started', onGameStarted);
    }, [navigation, room, isHost]);

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    REAL TALK
                </NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    {isHost ? "Select a conversation deck" : "Waiting for host to select a deck..."}
                </NeonText>
            </View>

            <View style={styles.categoriesContainer}>
                {REAL_TALK_CATEGORIES.map(category => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryCard,
                            { borderColor: category.color },
                            selectedCategory === category.id && styles.selectedCard
                        ]}
                        onPress={() => isHost && setSelectedCategory(category.id)}
                        activeOpacity={isHost ? 0.7 : 1}
                    >
                        <Ionicons 
                            name={category.icon} 
                            size={48} 
                            color={category.color}
                            style={{
                                textShadowColor: category.color,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 10,
                                marginBottom: 10
                            }}
                        />
                        <NeonText size={24} weight="bold" style={styles.categoryName}>
                            {category.title}
                        </NeonText>
                        <NeonText size={14} color={COLORS.textMuted} style={styles.categoryDesc}>
                            {category.description}
                        </NeonText>
                        {selectedCategory === category.id && (
                            <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                                <NeonText size={12} color="#000" weight="bold">SELECTED</NeonText>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {isHost && (
                <View style={styles.buttonContainer}>
                    <NeonButton
                        title="START GAME"
                        onPress={handleStart}
                        style={styles.startButton}
                    />
                </View>
            )}
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    subtitle: {
        marginTop: 10,
        textAlign: 'center',
    },
    categoriesContainer: {
        flex: 1,
        gap: 20,
        marginBottom: 20,
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
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 3,
    },
    categoryName: {
        marginTop: 10,
        marginBottom: 5,
    },
    categoryDesc: {
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    buttonContainer: {
        paddingBottom: 20,
    },
    startButton: {
        width: '100%',
    },
});

export default OnlineRealTalkCategoryScreen;
