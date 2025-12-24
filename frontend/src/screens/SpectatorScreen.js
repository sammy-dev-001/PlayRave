import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import LiveChat from '../components/LiveChat';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

const SpectatorScreen = ({ route, navigation }) => {
    const { room, spectatorName } = route.params;
    const [gameState, setGameState] = useState(null);
    const [players, setPlayers] = useState(room?.players || []);
    const [chatMessages, setChatMessages] = useState([]);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [scores, setScores] = useState({});
    const [spectatorCount, setSpectatorCount] = useState(1);

    useEffect(() => {
        // Join as spectator
        SocketService.emit('join-spectator', {
            roomId: room.id,
            spectatorName
        });

        // Listen for game updates
        SocketService.on('game-state-update', handleGameStateUpdate);
        SocketService.on('question-update', handleQuestionUpdate);
        SocketService.on('scores-update', handleScoresUpdate);
        SocketService.on('chat-message', handleChatMessage);
        SocketService.on('spectator-count', handleSpectatorCount);
        SocketService.on('player-update', handlePlayerUpdate);
        SocketService.on('game-ended', handleGameEnded);

        // Add system message
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'system',
            text: `You joined as a spectator`
        }]);

        return () => {
            SocketService.off('game-state-update', handleGameStateUpdate);
            SocketService.off('question-update', handleQuestionUpdate);
            SocketService.off('scores-update', handleScoresUpdate);
            SocketService.off('chat-message', handleChatMessage);
            SocketService.off('spectator-count', handleSpectatorCount);
            SocketService.off('player-update', handlePlayerUpdate);
            SocketService.off('game-ended', handleGameEnded);
            SocketService.emit('leave-spectator', { roomId: room.id });
        };
    }, []);

    const handleGameStateUpdate = (data) => {
        setGameState(data.state);
    };

    const handleQuestionUpdate = (data) => {
        setCurrentQuestion(data);
    };

    const handleScoresUpdate = (data) => {
        setScores(data.scores || {});
    };

    const handleChatMessage = (message) => {
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            ...message
        }]);
    };

    const handleSpectatorCount = (data) => {
        setSpectatorCount(data.count);
    };

    const handlePlayerUpdate = (data) => {
        setPlayers(data.players || []);
    };

    const handleGameEnded = () => {
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'system',
            text: 'Game has ended!'
        }]);
    };

    const handleSendMessage = (text) => {
        SocketService.emit('spectator-chat', {
            roomId: room.id,
            spectatorName,
            text
        });
    };

    const handleSendReaction = (emoji) => {
        SocketService.emit('spectator-reaction', {
            roomId: room.id,
            spectatorName,
            emoji
        });
    };

    const handleLeave = () => {
        navigation.goBack();
    };

    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) =>
        (scores[b.id] || 0) - (scores[a.id] || 0)
    );

    return (
        <NeonContainer>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={handleLeave}>
                        <NeonText size={20} color={COLORS.hotPink}>✕</NeonText>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                    <NeonText size={18} weight="bold" glow>
                        👁️ SPECTATING
                    </NeonText>
                    <NeonText size={12} color={COLORS.neonCyan}>
                        Room: {room.id}
                    </NeonText>
                </View>
                <View style={styles.headerRight}>
                    <NeonText size={12} color="#888">
                        👁️ {spectatorCount}
                    </NeonText>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Game Status */}
                <View style={styles.gameStatus}>
                    {gameState === 'waiting' && (
                        <View style={styles.waitingState}>
                            <NeonText size={48}>⏳</NeonText>
                            <NeonText size={18}>Waiting for game to start...</NeonText>
                        </View>
                    )}

                    {gameState === 'playing' && currentQuestion && (
                        <View style={styles.questionCard}>
                            <NeonText size={12} color={COLORS.hotPink}>
                                CURRENT QUESTION
                            </NeonText>
                            <NeonText size={18} weight="bold" style={styles.questionText}>
                                {currentQuestion.text || currentQuestion.question}
                            </NeonText>
                            {currentQuestion.options && (
                                <View style={styles.options}>
                                    {currentQuestion.options.map((opt, i) => (
                                        <View key={i} style={styles.optionItem}>
                                            <NeonText size={14} color="#888">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </NeonText>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {gameState === 'ended' && (
                        <View style={styles.endedState}>
                            <NeonText size={48}>🏆</NeonText>
                            <NeonText size={18}>Game Over!</NeonText>
                        </View>
                    )}
                </View>

                {/* Players & Scores */}
                <View style={styles.playersSection}>
                    <NeonText size={14} weight="bold" style={styles.sectionTitle}>
                        PLAYERS
                    </NeonText>
                    <FlatList
                        data={sortedPlayers}
                        keyExtractor={item => item.id}
                        horizontal
                        renderItem={({ item, index }) => (
                            <View style={[
                                styles.playerCard,
                                index === 0 && styles.leadingPlayer
                            ]}>
                                <NeonText size={24}>
                                    {item.avatar?.emoji || '👤'}
                                </NeonText>
                                <NeonText size={12} numberOfLines={1}>
                                    {item.name}
                                </NeonText>
                                <NeonText size={14} weight="bold" color={COLORS.limeGlow}>
                                    {scores[item.id] || 0}
                                </NeonText>
                                {index === 0 && sortedPlayers.length > 1 && (
                                    <NeonText size={10}>👑</NeonText>
                                )}
                            </View>
                        )}
                        contentContainerStyle={styles.playersList}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            </View>

            {/* Live Chat */}
            <View style={styles.chatContainer}>
                <LiveChat
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    onSendReaction={handleSendReaction}
                    currentUser={{ id: 'spectator', name: spectatorName }}
                    isMinimized={isChatMinimized}
                    onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerLeft: {
        width: 40,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    content: {
        flex: 1,
    },
    gameStatus: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    waitingState: {
        alignItems: 'center',
    },
    questionCard: {
        width: '100%',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    questionText: {
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 26,
    },
    options: {
        marginTop: 15,
    },
    optionItem: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        marginBottom: 5,
    },
    endedState: {
        alignItems: 'center',
    },
    playersSection: {
        paddingVertical: 15,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    playersList: {
        paddingVertical: 5,
    },
    playerCard: {
        alignItems: 'center',
        padding: 10,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        minWidth: 80,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    leadingPlayer: {
        borderColor: COLORS.limeGlow,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    chatContainer: {
        marginTop: 10,
    }
});

export default SpectatorScreen;
