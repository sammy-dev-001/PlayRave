import React from '{ useState }';
import { View, StyleSheet } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const ScrabbleDifficultyScreen = ({ route, navigation }) => {
    const { players } = route.params;
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

    const difficulties = [
        {
            id: 'easy',
            name: 'Easy',
            description: 'Random moves - Great for beginners',
            icon: '🟢',
            color: COLORS.limeGlow
        },
        {
            id: 'medium',
            name: 'Medium',
            description: 'Smart moves - Moderate challenge',
            icon: '🟡',
            color: COLORS.neonCyan
        },
        {
            id: 'hard',
            name: 'Hard',
            description: 'Strategic expert - Tough opponent',
            icon: '🔴',
            color: COLORS.hotPink
        }
    ];

    const handleStartGame = () => {
        navigation.navigate('ScrabbleAI', {
            players,
            difficulty: selectedDifficulty
        });
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    CHOOSE DIFFICULTY
                </NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    Select AI opponent strength
                </NeonText>
            </View>

            <View style={styles.difficultiesContainer}>
                {difficulties.map(diff => (
                    <TouchableOpacity
                        key={diff.id}
                        style={[
                            styles.difficultyCard,
                            { borderColor: diff.color },
                            selectedDifficulty === diff.id && styles.selectedCard
                        ]}
                        onPress={() => setSelectedDifficulty(diff.id)}
                    >
                        <NeonText size={48}>{diff.icon}</NeonText>
                        <NeonText size={24} weight="bold" style={styles.difficultyName}>
                            {diff.name}
                        </NeonText>
                        <NeonText size={14} color="#888" style={styles.difficultyDesc}>
                            {diff.description}
                        </NeonText>
                        {selectedDifficulty === diff.id && (
                            <View style={[styles.selectedBadge, { backgroundColor: diff.color }]}>
                                <NeonText size={12} color="#000" weight="bold">SELECTED</NeonText>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <NeonButton
                    title={`START GAME`}
                    onPress={handleStartGame}
                    style={styles.startButton}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    subtitle: {
        marginTop: 10,
        textAlign: 'center',
    },
    difficultiesContainer: {
        flex: 1,
        gap: 20,
        marginBottom: 20,
    },
    difficultyCard: {
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
    difficultyName: {
        marginTop: 10,
        marginBottom: 5,
    },
    difficultyDesc: {
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

export default ScrabbleDifficultyScreen;
