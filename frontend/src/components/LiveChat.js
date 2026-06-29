import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated
} from 'react-native';
import NeonText from './NeonText';
import GlassView from './GlassView';
import { useTheme } from '../context/ThemeContext';

// Quick reaction emojis
const QUICK_REACTIONS = ['😂', '🔥', '👏', '😮', '💀', '❤️', '🎉', '😭'];

const LiveChat = ({
    messages = [],
    onSendMessage,
    onSendReaction,
    currentUser,
    isMinimized = false,
    onToggleMinimize
}) => {
    const { COLORS } = useTheme();
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const [showReactions, setShowReactions] = useState(false);

    // Transient Toast State
    const [toastMessage, setToastMessage] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const toastTimeoutRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive and trigger toast
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            if (isMinimized) {
                // If minimized, show toast for non-own, non-system messages
                if (lastMessage.userId !== currentUser?.id && lastMessage.type !== 'system') {
                    setToastMessage(lastMessage);
                    
                    // Animate in
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true
                    }).start();

                    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

                    // Animate out after 3 seconds
                    toastTimeoutRef.current = setTimeout(() => {
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true
                        }).start(() => setToastMessage(null));
                    }, 3000);
                }
            } else if (flatListRef.current) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        }
        
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, [messages, isMinimized]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSendMessage?.(inputText.trim());
        setInputText('');
    };

    const handleReaction = (emoji) => {
        onSendReaction?.(emoji);
        setShowReactions(false);
    };

    const renderMessage = ({ item }) => {
        const isOwnMessage = item.userId === currentUser?.id;
        const isReaction = item.type === 'reaction';
        const isSystem = item.type === 'system';

        if (isSystem) {
            return (
                <View style={styles.systemMessage}>
                    <NeonText size={12} color={COLORS.textMuted}>
                        {item.text}
                    </NeonText>
                </View>
            );
        }

        if (isReaction) {
            return (
                <Animated.View style={[
                    styles.reactionBubble,
                    isOwnMessage && styles.ownReaction
                ]}>
                    <NeonText size={10} color={COLORS.neonCyan}>
                        {item.userName}
                    </NeonText>
                    <NeonText size={28}>{item.emoji}</NeonText>
                </Animated.View>
            );
        }

        return (
            <View style={[
                styles.messageBubble,
                isOwnMessage && styles.ownMessage
            ]}>
                {!isOwnMessage && (
                    <NeonText size={10} color={COLORS.neonCyan}>
                        {item.userName}
                    </NeonText>
                )}
                <NeonText size={14}>{item.text}</NeonText>
            </View>
        );
    };

    if (isMinimized) {
        return (
            <View style={styles.minimizedContainer}>
                {toastMessage && (
                    <Animated.View style={[styles.toastBubble, { opacity: fadeAnim }]}>
                        <NeonText size={10} color={COLORS.neonCyan}>{toastMessage.userName}</NeonText>
                        <NeonText size={14}>{toastMessage.type === 'reaction' ? toastMessage.emoji : toastMessage.text}</NeonText>
                    </Animated.View>
                )}
                <TouchableOpacity
                    onPress={onToggleMinimize}
                    activeOpacity={0.8}
                >
                    <GlassView style={styles.minimizedChat} variant="primary">
                        <NeonText size={14}>💬 {messages.length}</NeonText>
                    </GlassView>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <GlassView style={styles.container}>
                {/* Header */}
            <View style={styles.header}>
                <NeonText size={14} weight="bold">💬 LIVE CHAT</NeonText>
                <TouchableOpacity onPress={onToggleMinimize}>
                    <NeonText size={16} color={COLORS.hotPink}>−</NeonText>
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={renderMessage}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
            />

            {/* Quick Reactions */}
            {showReactions && (
                <View style={styles.reactionsBar}>
                    {QUICK_REACTIONS.map(emoji => (
                        <TouchableOpacity
                            key={emoji}
                            style={styles.reactionBtn}
                            onPress={() => handleReaction(emoji)}
                        >
                            <NeonText size={24}>{emoji}</NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.emojiBtn}
                    onPress={() => setShowReactions(!showReactions)}
                >
                    <NeonText size={20}>😀</NeonText>
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Say something..."
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={100}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <NeonText size={16} color={inputText.trim() ? COLORS.neonCyan : '#444'}>
                        ➤
                    </NeonText>
                </TouchableOpacity>
                </View>
            </GlassView>
        </KeyboardAvoidingView>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    keyboardContainer: {
        maxHeight: 320,
    },
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    minimizedContainer: {
        alignItems: 'flex-start',
    },
    toastBubble: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        marginBottom: 8,
        maxWidth: 200,
    },
    minimizedChat: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    messagesList: {
        flex: 1,
        maxHeight: 180,
    },
    messagesContent: {
        padding: 10,
    },
    messageBubble: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 10,
        marginBottom: 5,
        maxWidth: '85%',
        alignSelf: 'flex-start',
    },
    ownMessage: {
        backgroundColor: 'rgba(0, 194, 255, 0.2)',
        alignSelf: 'flex-end',
    },
    systemMessage: {
        alignItems: 'center',
        marginVertical: 5,
    },
    reactionBubble: {
        alignItems: 'center',
        marginBottom: 5,
        alignSelf: 'flex-start',
    },
    ownReaction: {
        alignSelf: 'flex-end',
    },
    reactionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
    },
    reactionBtn: {
        padding: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
    },
    emojiBtn: {
        padding: 5,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginHorizontal: 8,
        color: COLORS.white,
        fontSize: 14,
    },
    sendBtn: {
        padding: 5,
    }
});

export default LiveChat;
