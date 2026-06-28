import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import LiveChat from './LiveChat';
import VoiceChatPanel from './VoiceChatPanel';
import SocketService from '../services/socket';
import { useRoute } from '@react-navigation/native';

const InGameOverlay = () => {
    const route = useRoute();
    const room = route.params?.room;
    const playerName = route.params?.playerName;
    
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
        <KeyboardAvoidingView 
            style={styles.overlayContainer} 
            pointerEvents="box-none"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.voiceContainer} pointerEvents="box-none">
                <VoiceChatPanel roomId={room.id} playerName={currentUser?.name} visible={true} />
            </View>

            <View style={styles.chatContainer} pointerEvents="box-none">
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
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
    },
    voiceContainer: {
        position: 'absolute',
        top: 60,
        right: 15,
        width: 180,
    },
    chatContainer: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
    }
});

export default InGameOverlay;
