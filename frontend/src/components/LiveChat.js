import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Animated,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    onToggleMinimize,
    keyboardHeight = 0,
    bottomOffset = null,
}) => {
    const { COLORS } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const [showReactions, setShowReactions] = useState(false);
    const [screenDimensions, setScreenDimensions] = useState(() => Dimensions.get('window'));

    // Track screen orientation / resize
    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDimensions(window);
        });
        return () => sub?.remove();
    }, []);

    // Transient Toast State
    const [toastMessage, setToastMessage] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const toastTimeoutRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive or keyboard height changes
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            if (isMinimized) {
                // If minimized, show toast for non-own, non-system messages
                if (lastMessage.userId !== currentUser?.id && lastMessage.type !== 'system') {
                    setToastMessage(lastMessage);
                    
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true
                    }).start();

                    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

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
    }, [messages, isMinimized, currentUser?.id, fadeAnim]);

    // Keep scrolled to bottom when keyboard appears
    useEffect(() => {
        if (!isMinimized && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 80);
        }
    }, [keyboardHeight, isMinimized]);

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
                    style={{ alignItems: 'center' }}
                >
                    <GlassView style={styles.minimizedChat} variant="primary">
                        <Ionicons name="chatbubble-outline" size={28} color={COLORS.white} />
                        {messages.length > 0 && (
                            <View style={styles.badge}>
                                <NeonText size={10} color="#fff">{messages.length}</NeonText>
                            </View>
                        )}
                    </GlassView>
                    <NeonText size={10} color={COLORS.textMuted} style={{ marginTop: 4 }}>Tap to chat</NeonText>
                </TouchableOpacity>
            </View>
        );
    }

    // Adapt chat window height when virtual keyboard is open or browser navigation bar is present
    const defaultChatHeight = 320;
    const currentBottomOffset = bottomOffset !== null
        ? bottomOffset
        : (keyboardHeight > 0
            ? keyboardHeight
            : (Platform.OS === 'web' ? 85 : Math.max(20, insets.bottom + 12)));
    const maxAvailableHeight = screenDimensions.height - currentBottomOffset - (insets.top || 0) - 30;
    const chatHeight = Math.min(defaultChatHeight, Math.max(180, maxAvailableHeight));

    return (
        <View style={[styles.chatWindow, { height: chatHeight }]}>
            {/* 1. Frosted blur base */}
            <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 85}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
            />

            {/* 2. Rich dark tinted glass wash for contrast & frostiness */}
            <View style={[StyleSheet.absoluteFill, styles.tintedGel]} />

            {/* 3. Subtle diagonal glass sheen */}
            <LinearGradient
                colors={[
                    'rgba(255,255,255,0.14)',
                    'rgba(255,255,255,0.04)',
                    'rgba(255,255,255,0.00)',
                    'rgba(255,255,255,0.03)',
                ]}
                locations={[0, 0.35, 0.65, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* 4. Top specular highlight line */}
            <View style={styles.specularEdge} pointerEvents="none" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <NeonText size={14} weight="bold" color={COLORS.neonCyan}>💬 LIVE CHAT</NeonText>
                    {messages.length > 0 && (
                        <View style={styles.headerCountBadge}>
                            <NeonText size={10} color={COLORS.white}>{messages.length}</NeonText>
                        </View>
                    )}
                </View>
                <TouchableOpacity 
                    onPress={onToggleMinimize}
                    style={styles.minimizeBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="remove" size={20} color={COLORS.hotPink} />
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
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                    <View style={styles.emptyMessages}>
                        <NeonText size={12} color={COLORS.textMuted}>No messages yet. Say hello! 👋</NeonText>
                    </View>
                }
            />

            {/* Quick Reactions */}
            {showReactions && (
                <View style={styles.reactionsBar}>
                    {QUICK_REACTIONS.map(emoji => (
                        <TouchableOpacity
                            key={emoji}
                            style={styles.reactionBtn}
                            onPress={() => handleReaction(emoji)}
                            activeOpacity={0.7}
                        >
                            <NeonText size={22}>{emoji}</NeonText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input Bar */}
            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.emojiBtn}
                    onPress={() => setShowReactions(!showReactions)}
                    activeOpacity={0.7}
                >
                    <NeonText size={20}>{showReactions ? '⌨️' : '😀'}</NeonText>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Say something..."
                    placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    maxLength={100}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    blurOnSubmit={false}
                />

                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        inputText.trim() ? styles.sendBtnActive : styles.sendBtnDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name="send" 
                        size={15} 
                        color={inputText.trim() ? '#000' : 'rgba(255,255,255,0.3)'} 
                        style={{ marginLeft: 2 }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    chatWindow: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 194, 255, 0.35)', // Sleek glowing cyan/glass border
        backgroundColor: 'rgba(15, 12, 28, 0.90)', // Dark frosty tinted gel fallback
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 18,
            },
            android: { elevation: 12 },
            web: {
                boxShadow: '0 10px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
            },
        }),
    },
    tintedGel: {
        backgroundColor: 'rgba(15, 12, 28, 0.82)',
    },
    specularEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerCountBadge: {
        backgroundColor: 'rgba(0, 194, 255, 0.25)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 194, 255, 0.4)',
    },
    minimizeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    emptyMessages: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    messageBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 6,
        maxWidth: '82%',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    ownMessage: {
        backgroundColor: 'rgba(0, 194, 255, 0.22)',
        alignSelf: 'flex-end',
        borderColor: 'rgba(0, 194, 255, 0.35)',
    },
    systemMessage: {
        alignItems: 'center',
        marginVertical: 4,
    },
    reactionBubble: {
        alignItems: 'center',
        marginBottom: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    ownReaction: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(0, 194, 255, 0.15)',
    },
    reactionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    reactionBtn: {
        padding: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    emojiBtn: {
        padding: 6,
        marginRight: 4,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.09)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 9 : 7,
        color: '#FFFFFF',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendBtnActive: {
        backgroundColor: COLORS.neonCyan,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.neonCyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
            },
            android: { elevation: 3 },
            web: {
                boxShadow: '0 0 10px rgba(0, 194, 255, 0.6)',
            },
        }),
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    minimizedContainer: {
        alignItems: 'flex-start',
    },
    toastBubble: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
        marginBottom: 8,
        maxWidth: 200,
    },
    minimizedChat: {
        borderRadius: 30,
        width: 55,
        height: 55,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.hotPink,
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.deepNightBlack,
    },
});

export default LiveChat;
