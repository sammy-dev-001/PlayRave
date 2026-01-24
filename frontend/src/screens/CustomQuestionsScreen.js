import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const CustomQuestionsScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'Custom'
    });
    const [editingIndex, setEditingIndex] = useState(null);

    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const validateQuestion = () => {
        if (!currentQuestion.question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return false;
        }
        if (currentQuestion.options.some(opt => !opt.trim())) {
            Alert.alert('Error', 'Please fill in all 4 options');
            return false;
        }
        return true;
    };

    const handleAddQuestion = () => {
        if (!validateQuestion()) return;

        if (editingIndex !== null) {
            // Update existing question
            const newQuestions = [...questions];
            newQuestions[editingIndex] = { ...currentQuestion };
            setQuestions(newQuestions);
            setEditingIndex(null);
        } else {
            // Add new question
            setQuestions([...questions, { ...currentQuestion }]);
        }

        // Reset form
        setCurrentQuestion({
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            category: 'Custom'
        });
    };

    const handleEditQuestion = (index) => {
        setCurrentQuestion({ ...questions[index] });
        setEditingIndex(index);
    };

    const handleDeleteQuestion = (index) => {
        Alert.alert(
            'Delete Question',
            'Are you sure you want to delete this question?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const newQuestions = questions.filter((_, i) => i !== index);
                        setQuestions(newQuestions);
                        if (editingIndex === index) {
                            setEditingIndex(null);
                            setCurrentQuestion({
                                question: '',
                                options: ['', '', '', ''],
                                correctAnswer: 0,
                                category: 'Custom'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleContinue = () => {
        if (questions.length < 5) {
            Alert.alert('Not Enough Questions', 'Please create at least 5 questions to continue');
            return;
        }

        // Save custom questions to room
        SocketService.emit('set-custom-questions', {
            roomId: room.id,
            questions
        });

        // Navigate to lobby
        navigation.navigate('Lobby', {
            room,
            isHost: true,
            playerName,
            selectedGame: 'trivia'
        });
    };

    return (
        <NeonContainer showBackButton scrollable>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow>CREATE CUSTOM QUESTIONS</NeonText>
                    <NeonText size={14} color="#999" style={{ marginTop: 5 }}>
                        {questions.length}/5 questions created (minimum 5)
                    </NeonText>
                </View>

                {/* Question Form */}
                <View style={styles.formSection}>
                    <NeonText size={16} style={styles.label}>Question</NeonText>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your question..."
                        placeholderTextColor="#666"
                        value={currentQuestion.question}
                        onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, question: text })}
                        multiline
                    />

                    <NeonText size={16} style={styles.label}>Options</NeonText>
                    {currentQuestion.options.map((option, index) => (
                        <View key={index} style={styles.optionRow}>
                            <TouchableOpacity
                                style={[
                                    styles.radioButton,
                                    currentQuestion.correctAnswer === index && styles.radioButtonSelected
                                ]}
                                onPress={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                            >
                                {currentQuestion.correctAnswer === index && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, styles.optionInput]}
                                placeholder={`Option ${index + 1}`}
                                placeholderTextColor="#666"
                                value={option}
                                onChangeText={(text) => handleOptionChange(index, text)}
                            />
                        </View>
                    ))}
                    <NeonText size={12} color="#999" style={{ marginTop: 5 }}>
                        Tap the circle to mark the correct answer
                    </NeonText>

                    <NeonButton
                        title={editingIndex !== null ? "UPDATE QUESTION" : "ADD QUESTION"}
                        onPress={handleAddQuestion}
                        style={styles.addButton}
                    />
                </View>

                {/* Questions List */}
                {questions.length > 0 && (
                    <View style={styles.listSection}>
                        <NeonText size={18} weight="bold" style={styles.listTitle}>
                            Your Questions
                        </NeonText>
                        {questions.map((q, index) => (
                            <View key={index} style={styles.questionCard}>
                                <NeonText size={16} weight="bold" style={styles.questionText}>
                                    {index + 1}. {q.question}
                                </NeonText>
                                <View style={styles.questionOptions}>
                                    {q.options.map((opt, optIndex) => (
                                        <NeonText
                                            key={optIndex}
                                            size={14}
                                            color={optIndex === q.correctAnswer ? COLORS.limeGlow : '#ccc'}
                                            style={styles.optionText}
                                        >
                                            {optIndex === q.correctAnswer ? '✓ ' : '  '}{opt}
                                        </NeonText>
                                    ))}
                                </View>
                                <View style={styles.questionActions}>
                                    <TouchableOpacity onPress={() => handleEditQuestion(index)}>
                                        <NeonText size={14} color={COLORS.neonCyan}>Edit</NeonText>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteQuestion(index)}>
                                        <NeonText size={14} color={COLORS.hotPink}>Delete</NeonText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <NeonButton
                title="CONTINUE TO LOBBY"
                onPress={handleContinue}
                disabled={questions.length < 5}
                style={styles.continueButton}
            />
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    formSection: {
        marginBottom: 30,
    },
    label: {
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 16,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonSelected: {
        borderColor: COLORS.limeGlow,
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.limeGlow,
    },
    optionInput: {
        flex: 1,
    },
    addButton: {
        marginTop: 20,
    },
    listSection: {
        marginBottom: 20,
    },
    listTitle: {
        marginBottom: 15,
    },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    questionText: {
        marginBottom: 10,
    },
    questionOptions: {
        marginLeft: 10,
        marginBottom: 10,
    },
    optionText: {
        marginVertical: 3,
    },
    questionActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    continueButton: {
        marginTop: 10,
    }
});

export default CustomQuestionsScreen;
