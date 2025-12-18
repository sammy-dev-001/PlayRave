import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const TruthOrDareCategorySelectionScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [selectedCategory, setSelectedCategory] = useState('normal');

    const categories = [
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

    const handleStartGame = () => {
        navigation.navigate('TruthOrDareGame', { players, category: selectedCategory });
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow={true}>
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

            <NeonButton
                title="START GAME"
                onPress={handleStartGame}
                variant="primary"
                style={styles.startButton}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    subtitle: {
        marginTop: 10,
    },
    categoriesContainer: {
        gap: 20,
        marginBottom: 30,
    },
    categoryCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        padding: 25,
        alignItems: 'center',
        position: 'relative',
    },
    selectedCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 3,
    },
    categoryIcon: {
        marginBottom: 10,
    },
    categoryDescription: {
        marginTop: 8,
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
});

export default TruthOrDareCategorySelectionScreen;
