import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
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

    useEffect(() => {
        const onChatReceived = (msg) => {
            setChatMessages(prev => [...prev, msg]);
        };
        SocketService.on('chat-message-received', onChatReceived);
        return () => {
            SocketService.off('chat-message-received', onChatReceived);
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
            <KeyboardAvoidingView 
                style={styles.overlayContainer} 
                pointerEvents="box-none"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.voiceContainer} pointerEvents="box-none">
                    <VoiceChatPanel roomId={room.id} playerName={currentUser?.name} visible={true} />
                </View>

            <View style={[
                styles.chatContainer, 
                isChatMinimized 
                    ? { top: Math.max(70, insets.top + 60), left: 10 }
                    : { bottom: Math.max(20, insets.bottom + 8), left: 10, right: 10 }
            ]} 
                pointerEvents="box-none"
            >
                <LiveChat
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    onSendReaction={handleSendReaction}
                    currentUser={currentUser}
                    isMinimized={isChatMinimized}
                    onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
                />
            </View>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.3)', // Dim the background when chat is open
    },
    voiceContainer: {
        position: 'absolute',
        top: 10,
        left: 20,
        zIndex: 1000,
    },
    chatContainer: {
        position: 'absolute',
        left: 10,
        right: 10,
    }
});

export default InGameOverlay;
