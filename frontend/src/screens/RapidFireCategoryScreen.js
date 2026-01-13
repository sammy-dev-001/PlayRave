import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const RapidFireCategoryScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('normal');

    const categories = [
        {
            id: 'normal',
            name: 'NORMAL',
            description: 'Fun quick questions for everyone',
            color: COLORS.limeGlow,
            icon: '⚡'
        },
        {
            id: 'spicy',
            name: 'SPICY',
            description: 'Dating, relationships & love',
            color: COLORS.hotPink,
            icon: '🌶️'
        },
        {
            id: 'naughty',
            name: 'NAUGHTY',
            description: 'Adults only - no filter!',
            color: COLORS.electricPurple,
            icon: '🔞'
        }
    ];

    const handleStartGame = () => {
        navigation.navigate('RapidFire', { players, category: selectedCategory });
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
                        ⚡ RAPID FIRE
                    </NeonText>
                    <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                        Choose your spice level
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
                            <NeonText size={40} style={styles.categoryIcon}>
                                {category.icon}
                            </NeonText>
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

                <View style={styles.rulesCard}>
                    <NeonText size={16} weight="bold" color={COLORS.neonCyan}>
                        HOW TO PLAY
                    </NeonText>
                    <NeonText size={13} color="#aaa" style={styles.rule}>
                        ⏱️ 5 seconds to answer each question
                    </NeonText>
                    <NeonText size={13} color="#aaa" style={styles.rule}>
                        ✓ Tap ANSWERED if they respond in time
                    </NeonText>
                    <NeonText size={13} color="#aaa" style={styles.rule}>
                        ⚡ Quick, honest, one-word answers!
                    </NeonText>
                </View>

                <NeonButton
                    title="START RAPID FIRE"
                    onPress={handleStartGame}
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
        marginBottom: 20,
    },
    subtitle: {
        marginTop: 10,
    },
    categoriesContainer: {
        gap: 15,
        marginBottom: 20,
    },
    categoryCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        padding: 18,
        alignItems: 'center',
        position: 'relative',
    },
    selectedCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 3,
    },
    categoryIcon: {
        marginBottom: 5,
    },
    categoryDescription: {
        marginTop: 5,
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
    rulesCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    rule: {
        marginTop: 8,
    },
    startButton: {
        marginTop: 'auto',
    },
});

export default RapidFireCategoryScreen;
