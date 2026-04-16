import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const OnlineNHIECategoryScreen = ({ route, navigation }) => {
    const { room, isHost, playerName } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('normal');
    const [isStarting, setIsStarting] = useState(false);

    const categories = [
        {
            id: 'normal',
            name: 'NORMAL',
            description: 'Fun and friendly for everyone',
            color: COLORS.limeGlow,
            icon: 'happy-outline'
        },
        {
            id: 'spicy',
            name: 'SPICY',
            description: 'Dating, relationships & crushes',
            color: COLORS.hotPink,
            icon: 'flame'
        },
        {
            id: 'naughty',
            name: 'NAUGHTY',
            description: 'Adults only content',
            color: COLORS.electricPurple,
            icon: 'warning'
        }
    ];

    const handleStartGame = () => {
        setIsStarting(true);
        SocketService.emit('start-game', {
            roomId: room.id,
            gameType: 'never-have-i-ever',
            category: selectedCategory
        });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <View style={styles.header}>
                    <NeonText size={28} weight="bold" glow>
                        NEVER HAVE I EVER
                    </NeonText>
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                        Choose spice level
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
                            <Ionicons 
                                name={category.icon} 
                                size={40} 
                                color={selectedCategory === category.id ? category.color : COLORS.white}
                                style={[{
                                    textShadowColor: selectedCategory === category.id ? category.color : 'transparent',
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: 10
                                }, styles.categoryIcon]}
                            />
                            <NeonText
                                size={22}
                                weight="bold"
                                color={selectedCategory === category.id ? category.color : COLORS.white}
                                glow={selectedCategory === category.id}
                            >
                                {category.name}
                            </NeonText>
                            <NeonText size={13} color="#888" style={styles.categoryDescription}>
                                {category.description}
                            </NeonText>
                            {selectedCategory === category.id && (
                                <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                                    <NeonText size={10} weight="bold" color="#000">
                                        SELECTED
                                    </NeonText>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <NeonButton
                    title={isStarting ? "STARTING..." : "START GAME"}
                    onPress={handleStartGame}
                    disabled={isStarting}
                    style={styles.startButton}
                />
            </ScrollView>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        marginTop: 40,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    subtitle: {
        marginTop: 10,
    },
    categoriesContainer: {
        gap: 15,
        marginBottom: 25,
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
        top: 8,
        right: 8,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    startButton: {
        marginTop: 'auto',
    },
});

export default OnlineNHIECategoryScreen;
