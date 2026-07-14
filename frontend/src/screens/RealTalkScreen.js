import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { useTheme } from '../context/ThemeContext';
import { getQuestionsByCategory, REAL_TALK_CATEGORIES } from '../data/realTalkData';

const { width } = Dimensions.get('window');

const RealTalkScreen = ({ route, navigation }) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const { players, categoryId } = route.params;

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [flipAnim] = useState(new Animated.Value(0));

    const category = REAL_TALK_CATEGORIES.find(c => c.id === categoryId);

    useEffect(() => {
        const catQuestions = [...getQuestionsByCategory(categoryId)];
        // Shuffle
        for (let i = catQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [catQuestions[i], catQuestions[j]] = [catQuestions[j], catQuestions[i]];
        }
        setQuestions(catQuestions);
    }, [categoryId]);

    const handleNext = () => {
        // Animate flip
        Animated.sequence([
            Animated.timing(flipAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(flipAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();

        setTimeout(() => {
            setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
            if (players && players.length > 0) {
                setCurrentPlayerIndex(prev => (prev + 1) % players.length);
            }
        }, 200);
    };

    if (questions.length === 0) {
        return (
            <NeonContainer showBackButton>
                <NeonText>Loading...</NeonText>
            </NeonContainer>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentPlayer = players && players.length > 0 ? players[currentPlayerIndex] : null;

    const cardAnimatedStyle = {
        transform: [
            {
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg']
                })
            }
        ]
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <Ionicons name={category.icon} size={32} color={category.color} />
                <NeonText size={24} weight="bold" color={category.color} glow style={{ marginLeft: 10 }}>
                    {category.title}
                </NeonText>
            </View>

            {currentPlayer && (
                <View style={styles.playerTurnContainer}>
                    <NeonText size={16} color={COLORS.textMuted}>Current Player</NeonText>
                    <NeonText size={28} weight="bold" glow>{currentPlayer.name}</NeonText>
                </View>
            )}

            <View style={styles.cardWrapper}>
                <Animated.View style={[styles.card, { borderColor: category.color }, cardAnimatedStyle]}>
                    <Ionicons name="chatbubbles-outline" size={48} color={category.color} style={{ opacity: 0.5, marginBottom: 20 }} />
                    <NeonText size={28} weight="bold" style={styles.questionText}>
                        {currentQuestion}
                    </NeonText>
                </Animated.View>
            </View>

            <View style={styles.buttonContainer}>
                <NeonButton
                    title="NEXT QUESTION"
                    onPress={handleNext}
                    style={styles.nextButton}
                    color={category.color}
                />
            </View>
        </NeonContainer>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    playerTurnContainer: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 15,
        borderRadius: 16,
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#161622',
        borderRadius: 24,
        borderWidth: 3,
        padding: 30,
        width: width * 0.85,
        minHeight: 300,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    questionText: {
        textAlign: 'center',
        lineHeight: 38,
    },
    buttonContainer: {
        paddingBottom: 30,
        paddingTop: 20,
    },
    nextButton: {
        width: '100%',
    },
});

export default RealTalkScreen;
