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
import { COLORS } from '../constants/theme';

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
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const [showReactions, setShowReactions] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

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
                    <NeonText size={12} color="#888">
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
            <TouchableOpacity
                style={styles.minimizedChat}
                onPress={onToggleMinimize}
            >
                <NeonText size={14}>💬 {messages.length}</NeonText>
            </TouchableOpacity>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                    placeholderTextColor="#666"
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 300,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        overflow: 'hidden',
    },
    minimizedChat: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
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
        borderRadius: 12,
        padding: 8,
        marginBottom: 5,
        maxWidth: '80%',
        alignSelf: 'flex-start',
    },
    ownMessage: {
        backgroundColor: 'rgba(0, 248, 255, 0.2)',
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
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    reactionBtn: {
        padding: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    emojiBtn: {
        padding: 5,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 8,
        color: '#fff',
        fontSize: 14,
    },
    sendBtn: {
        padding: 5,
    }
});

export default LiveChat;
