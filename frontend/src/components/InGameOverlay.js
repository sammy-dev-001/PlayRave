import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import LiveChat from './LiveChat';
import VoiceChatPanel from './VoiceChatPanel';
import SocketService from '../services/socket';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InGameOverlay = () => {
    const route = useRoute();
    const room = route.params?.room;
    const playerName = route.params?.playerName;
    const insets = useSafeAreaInsets();
    
    const currentUser = { 
        id: SocketService.userId || SocketService.socket?.id || 'unknown', 
        name: playerName || 'Unknown' 
    };

    const [chatMessages, setChatMessages] = useState([]);
    const [isChatMinimized, setIsChatMinimized] = useState(true);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });
        return () => sub?.remove();
    }, []);

    useEffect(() => {
        const onChatReceived = (msg) => {
            setChatMessages(prev => [...prev, msg]);
        };
        SocketService.on('chat-message-received', onChatReceived);
        return () => {
            SocketService.off('chat-message-received', onChatReceived);
        };
    }, []);

    // ── Keyboard height tracking for flawless input positioning ──────────
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            const h = e?.endCoordinates?.height || 0;
            if (h > 0) setKeyboardHeight(h);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        // Mobile Web visual viewport support
        let handleResize = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
            handleResize = () => {
                const diff = window.innerHeight - window.visualViewport.height;
                setKeyboardHeight(diff > 120 ? diff : 0);
            };
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            showSub.remove();
            hideSub.remove();
            if (handleResize && window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    const handleSendChatMessage = (text) => {
        if (!room?.id) return;
        SocketService.emit('chat-message', { roomId: room.id, text });
    };

    const handleSendReaction = (emoji) => {
        if (!room?.id) return;
        SocketService.emit('chat-reaction', { roomId: room.id, emoji });
    };

    if (!room) return null;

    const chatWidth = Math.min(480, dimensions.width - 24);
    const chatLeft = Math.max(12, (dimensions.width - chatWidth) / 2);

    const baseBottom = Platform.select({
        web: Math.max(85, (insets.bottom || 0) + 20),
        default: Math.max(20, insets.bottom + 12),
    });

    const chatBottom = isChatMinimized
        ? undefined
        : keyboardHeight > 0
            ? keyboardHeight + (Platform.OS === 'web' ? 14 : 8)
            : baseBottom;

    return (
        <>
            {!isChatMinimized && (
                <TouchableWithoutFeedback onPress={() => {
                    Keyboard.dismiss();
                    setIsChatMinimized(true);
                }}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}
            <View 
                style={styles.overlayContainer} 
                pointerEvents="box-none"
            >
                <View 
                    style={[
                        styles.voiceContainer, 
                        { top: Math.max(10, insets.top + 10) }
                    ]} 
                    pointerEvents="box-none"
                >
                    <VoiceChatPanel roomId={room.id} playerName={currentUser?.name} visible={true} />
                </View>

                <View 
                    style={[
                        styles.chatContainer, 
                        isChatMinimized 
                            ? { top: Math.max(70, insets.top + 60), left: 10 }
                            : { 
                                bottom: chatBottom, 
                                left: chatLeft, 
                                width: chatWidth,
                              }
                    ]} 
                    pointerEvents="box-none"
                >
                    <LiveChat
                        messages={chatMessages}
                        onSendMessage={handleSendChatMessage}
                        onSendReaction={handleSendReaction}
                        currentUser={currentUser}
                        isMinimized={isChatMinimized}
                        onToggleMinimize={() => {
                            if (!isChatMinimized) Keyboard.dismiss();
                            setIsChatMinimized(!isChatMinimized);
                        }}
                        keyboardHeight={keyboardHeight}
                        bottomOffset={chatBottom}
                    />
                </View>
            </View>
        </>
    );
};

InGameOverlay.isOverlay = true;
InGameOverlay.displayName = 'InGameOverlay';

const styles = StyleSheet.create({
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dim the background when chat is open
    },
    voiceContainer: {
        position: 'absolute',
        right: 112,
        zIndex: 1000,
    },
    chatContainer: {
        position: 'absolute',
        zIndex: 1000,
    }
});

export default InGameOverlay;
