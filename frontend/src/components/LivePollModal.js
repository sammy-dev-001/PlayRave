import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, Modal, TouchableOpacity,
    TextInput, ScrollView, Animated, Platform, Share, Alert
} from 'react-native';
import NeonText from './NeonText';
import GlassView from './GlassView';
import QRCodeModal from './QRCodeModal';
import GameIcon from './GameIcon';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import HapticService from '../services/HapticService';

const OPTION_COLORS = [
    '#00F0FF', '#FF0055', '#FFE600', '#00FF66',
    '#9D00FF', '#FF6600'
];

const PRESET_POLLS = [
    {
        question: 'Who takes the penalty shot? 🍻',
        options: ['Sammy', 'Alex', 'David', 'Host'],
    },
    {
        question: 'What game should we play next? 🎮',
        options: ['Whot!', 'Scrabble', 'Trivia', 'Ludo'],
    },
    {
        question: 'Midnight snack order? 🍕',
        options: ['Pizza', 'Shawarma', 'Suya', 'Ice Cream'],
    },
    {
        question: 'Who was the MVP tonight? 🏆',
        options: ['Host', 'Top Scorer', 'The Underdog', 'Everyone'],
    },
];

const PollBar = ({ label, count, total, color, onVote, isSelected, isLocked, styles }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: percentage,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const barWidth = widthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <TouchableOpacity
            style={[
                styles.pollOptionBtn,
                isSelected && { borderColor: color, borderWidth: 1.5 },
                isLocked && { opacity: 0.85 }
            ]}
            onPress={onVote}
            disabled={isLocked}
            activeOpacity={0.8}
        >
            <View style={styles.pollOptionContent}>
                {/* Background animated progress fill */}
                <Animated.View
                    style={[
                        styles.barFill,
                        { width: barWidth, backgroundColor: color + '2E' },
                    ]}
                />

                <View style={styles.optionRow}>
                    <View style={styles.optionLeft}>
                        <View style={[styles.optionColorDot, { backgroundColor: color }]} />
                        <NeonText size={14} weight="bold" color="#FFF" numberOfLines={1}>
                            {label}
                        </NeonText>
                        {isSelected && (
                            <NeonText size={10} color={color} weight="bold" style={styles.votedBadge}>
                                ✓ YOUR VOTE
                            </NeonText>
                        )}
                    </View>

                    <View style={styles.optionRight}>
                        <NeonText size={14} weight="bold" color={color}>
                            {percentage}%
                        </NeonText>
                        <NeonText size={11} color="#9CA3AF" style={{ marginLeft: 6 }}>
                            ({count})
                        </NeonText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const LivePollModal = ({ visible, onClose, initialRoomId = null }) => {
    const { COLORS } = useTheme();
    const { user } = useAuth();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    // Active mode: 'host' | 'join'
    const [activeTab, setActiveTab] = useState(initialRoomId ? 'join' : 'host');

    // Host room state
    const [hostRoomId, setHostRoomId] = useState('');
    // Join room state
    const [joinInputCode, setJoinInputCode] = useState(initialRoomId || '');
    const [joinedRoomId, setJoinedRoomId] = useState(initialRoomId || '');

    // Poll data
    const [question, setQuestion] = useState('Who takes the penalty shot? 🍻');
    const [options, setOptions] = useState([
        { id: '1', text: 'Sammy', count: 0, color: OPTION_COLORS[0] },
        { id: '2', text: 'Alex', count: 0, color: OPTION_COLORS[1] },
        { id: '3', text: 'David', count: 0, color: OPTION_COLORS[2] },
        { id: '4', text: 'Host', count: 0, color: OPTION_COLORS[3] },
    ]);
    const [votedOptionId, setVotedOptionId] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [newOptionText, setNewOptionText] = useState('');
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState('');
    const [voteToast, setVoteToast] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);

    const activeRoomId = activeTab === 'host' ? hostRoomId : joinedRoomId;
    const isHosting = activeTab === 'host';

    // When initialRoomId is provided via deep link, auto-switch to join mode
    useEffect(() => {
        if (initialRoomId) {
            const clean = initialRoomId.trim().toUpperCase();
            setActiveTab('join');
            setJoinInputCode(clean);
            setJoinedRoomId(clean);
        }
    }, [initialRoomId]);

    // Socket lifecycle & listener setup
    useEffect(() => {
        if (!visible) return;

        if (SocketService.isConnected()) {
            const onRoomCreated = (data) => {
                const id = data?.id || data?.room?.id || data?.roomId;
                if (id) {
                    const cleanId = String(id).trim().toUpperCase();
                    setHostRoomId(cleanId);
                    // Broadcast initial poll state to room
                    SocketService.emit('poll:update', {
                        roomId: cleanId,
                        question,
                        options,
                        isLocked,
                    });
                }
            };

            const onPollUpdated = (data) => {
                if (data?.question) setQuestion(data.question);
                if (data?.options) setOptions(data.options);
                if (data?.isLocked !== undefined) setIsLocked(data.isLocked);

                if (data?.lastVote) {
                    SoundService.playTick();
                    const voter = data.lastVote.voterName || 'Someone';
                    setVoteToast(`${voter} just voted!`);
                    setTimeout(() => setVoteToast(null), 2200);
                }
            };

            SocketService.on('room-created', onRoomCreated);
            SocketService.on('poll:update', onPollUpdated);

            // If hosting and no host room yet, create one
            if (activeTab === 'host' && !hostRoomId) {
                SocketService.emit('create-room', {
                    playerName: user?.username || 'Host',
                    gameType: 'poll',
                });
            }

            // If joined a room, ensure socket is subscribed to it
            if (activeTab === 'join' && joinedRoomId) {
                SocketService.emit('poll:join', {
                    roomId: joinedRoomId,
                    playerName: user?.username || 'Voter',
                });
            }

            return () => {
                SocketService.off('room-created', onRoomCreated);
                SocketService.off('poll:update', onPollUpdated);
            };
        } else {
            // Offline fallback code
            if (activeTab === 'host' && !hostRoomId) {
                setHostRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
            }
        }
    }, [visible, activeTab, hostRoomId, joinedRoomId]);

    const totalVotes = options.reduce((sum, opt) => sum + (opt.count || 0), 0);

    // Vote on an option
    const handleVote = (optionId) => {
        if (isLocked) return;

        SoundService.playButtonClick();
        HapticService.selection();

        const prevId = votedOptionId;
        setVotedOptionId(optionId);

        // Optimistic local update
        setOptions((prev) =>
            prev.map((opt) => {
                let count = opt.count || 0;
                if (prevId === opt.id) count = Math.max(0, count - 1);
                if (opt.id === optionId) count += 1;
                return { ...opt, count };
            })
        );

        // Broadcast vote to backend socket
        if (SocketService.isConnected() && activeRoomId) {
            SocketService.emit('poll:vote', {
                roomId: activeRoomId,
                optionId,
                voterName: user?.username || 'Voter',
            });
        }
    };

    // Join a poll with code
    const handleJoinWithCode = () => {
        const clean = joinInputCode.trim().toUpperCase();
        if (!clean || clean.length < 3) return;

        SoundService.playButtonClick();
        HapticService.selection();

        setJoinedRoomId(clean);
        setVotedOptionId(null);

        if (SocketService.isConnected()) {
            SocketService.emit('poll:join', {
                roomId: clean,
                playerName: user?.username || 'Voter',
            });
        }
    };

    // Leave currently joined poll
    const handleLeaveJoinedPoll = () => {
        SoundService.playButtonClick();
        setJoinedRoomId('');
        setJoinInputCode('');
        setVotedOptionId(null);
    };

    // Host: Apply preset
    const handleApplyPreset = (preset) => {
        const newOptions = preset.options.map((text, idx) => ({
            id: String(idx + 1),
            text,
            count: 0,
            color: OPTION_COLORS[idx % OPTION_COLORS.length],
        }));

        setQuestion(preset.question);
        setOptions(newOptions);
        setVotedOptionId(null);
        SoundService.playButtonClick();
        HapticService.selection();

        if (SocketService.isConnected() && hostRoomId) {
            SocketService.emit('poll:update', {
                roomId: hostRoomId,
                question: preset.question,
                options: newOptions,
                isLocked: false,
            });
        }
    };

    // Host: Add option
    const handleAddOption = () => {
        const trimmed = newOptionText.trim();
        if (!trimmed || options.length >= 6) return;

        const newOpt = {
            id: String(Date.now()),
            text: trimmed,
            count: 0,
            color: OPTION_COLORS[options.length % OPTION_COLORS.length],
        };

        const updatedOptions = [...options, newOpt];
        setOptions(updatedOptions);
        setNewOptionText('');
        SoundService.playButtonClick();

        if (SocketService.isConnected() && hostRoomId) {
            SocketService.emit('poll:update', {
                roomId: hostRoomId,
                question,
                options: updatedOptions,
                isLocked,
            });
        }
    };

    // Host: Save edited custom question
    const handleSaveQuestion = () => {
        const trimmed = editedQuestion.trim();
        if (!trimmed) {
            setIsEditingQuestion(false);
            return;
        }

        setQuestion(trimmed);
        setIsEditingQuestion(false);
        SoundService.playButtonClick();

        if (SocketService.isConnected() && hostRoomId) {
            SocketService.emit('poll:update', {
                roomId: hostRoomId,
                question: trimmed,
                options,
                isLocked,
            });
        }
    };

    // Host: Toggle locked
    const handleToggleLock = () => {
        const nextLock = !isLocked;
        setIsLocked(nextLock);
        SoundService.playButtonClick();
        HapticService.buttonTap();

        if (SocketService.isConnected() && hostRoomId) {
            SocketService.emit('poll:update', {
                roomId: hostRoomId,
                question,
                options,
                isLocked: nextLock,
            });
        }
    };

    // Host: Reset all votes to 0
    const handleResetVotes = () => {
        setOptions((prev) => prev.map((opt) => ({ ...opt, count: 0 })));
        setVotedOptionId(null);
        SoundService.playButtonClick();
        HapticService.buttonTap();

        if (SocketService.isConnected() && hostRoomId) {
            SocketService.emit('poll:reset', { roomId: hostRoomId });
        }
    };

    // Share link or copy
    const handleShare = async () => {
        const code = activeRoomId;
        if (!code) return;

        const origin = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin)
            ? window.location.origin
            : 'https://play-rave.vercel.app';
        const url = `${origin}?join=${code}&mode=poll`;
        const message = `📊 Vote now in the PlayRave Live Poll!\n\n"${question}"\n\n👉 Join & Vote: ${url}`;

        try {
            if (Platform.OS === 'web' && navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2200);
            } else {
                await Share.share({ message, title: 'PlayRave Live Poll' });
            }
        } catch {
            setShowQR(true);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <GlassView style={styles.card}>
                    {/* Header with Game Icon */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <GameIcon gameId="live-poll" size={40} style={styles.headerIcon} />
                            <View>
                                <NeonText size={18} weight="bold" color={COLORS.neonCyan} glow>
                                    LIVE AUDIENCE POLL
                                </NeonText>
                                <NeonText size={10} color="#6B7280" style={styles.headerSub}>
                                    REAL-TIME BAR CHART VOTING
                                </NeonText>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                            <NeonText size={18} color="#9CA3AF">✕</NeonText>
                        </TouchableOpacity>
                    </View>

                    {/* Mode Tabs: Host Poll vs Join Poll */}
                    <View style={styles.modeTabsRow}>
                        <TouchableOpacity
                            style={[styles.modeTab, activeTab === 'host' && styles.modeTabActive]}
                            onPress={() => {
                                SoundService.playButtonClick();
                                setActiveTab('host');
                            }}
                            activeOpacity={0.8}
                        >
                            <NeonText
                                size={12}
                                weight="bold"
                                color={activeTab === 'host' ? COLORS.deepNightBlack : '#9CA3AF'}
                            >
                                👑 HOST POLL
                            </NeonText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modeTab, activeTab === 'join' && styles.modeTabActiveCyan]}
                            onPress={() => {
                                SoundService.playButtonClick();
                                setActiveTab('join');
                            }}
                            activeOpacity={0.8}
                        >
                            <NeonText
                                size={12}
                                weight="bold"
                                color={activeTab === 'join' ? COLORS.deepNightBlack : '#9CA3AF'}
                            >
                                🗳️ JOIN POLL
                            </NeonText>
                        </TouchableOpacity>
                    </View>

                    {/* Notification Toast for Live Votes */}
                    {voteToast && (
                        <View style={styles.liveToast}>
                            <NeonText size={11} weight="bold" color={COLORS.neonGreen || '#00FF66'}>
                                🔔 {voteToast}
                            </NeonText>
                        </View>
                    )}

                    {/* Join Mode: Room Code Entry View if Not Yet Joined */}
                    {activeTab === 'join' && !joinedRoomId && (
                        <View style={styles.joinInputContainer}>
                            <NeonText size={13} color="#9CA3AF" style={{ marginBottom: 12, textAlign: 'center' }}>
                                Enter the 4-letter host room code to cast your vote live
                            </NeonText>
                            <TextInput
                                style={styles.joinRoomInput}
                                placeholder="ROOM CODE (e.g. ABCD)"
                                placeholderTextColor="#6B7280"
                                value={joinInputCode}
                                onChangeText={(val) => setJoinInputCode(val.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.joinSubmitBtn, !joinInputCode && styles.joinSubmitBtnDisabled]}
                                onPress={handleJoinWithCode}
                                disabled={!joinInputCode}
                                activeOpacity={0.85}
                            >
                                <NeonText size={14} weight="bold" color={COLORS.deepNightBlack}>
                                    ENTER LIVE POLL →
                                </NeonText>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Room Info & Share Banner (when in host mode OR when joined) */}
                    {(activeTab === 'host' || (activeTab === 'join' && joinedRoomId)) && (
                        <View style={styles.roomBanner}>
                            <View style={styles.roomCodeBox}>
                                <NeonText size={9} color="#9CA3AF">
                                    {isHosting ? 'HOST ROOM CODE' : 'JOINED ROOM'}
                                </NeonText>
                                <View style={styles.roomCodeRow}>
                                    <NeonText size={16} weight="bold" color={COLORS.neonCyan} glow>
                                        {activeRoomId || '----'}
                                    </NeonText>
                                    <View style={styles.liveDot} />
                                    <NeonText size={9} color={COLORS.neonGreen || '#00FF66'} weight="bold">
                                        LIVE
                                    </NeonText>
                                </View>
                            </View>

                            <View style={styles.roomActions}>
                                {isHosting ? (
                                    <>
                                        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                                            <NeonText size={11} weight="bold" color={shareCopied ? (COLORS.neonGreen || '#00FF66') : COLORS.white}>
                                                {shareCopied ? '✓ COPIED' : '🔗 SHARE'}
                                            </NeonText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowQR(true)} activeOpacity={0.8}>
                                            <NeonText size={11} weight="bold" color={COLORS.white}>
                                                📱 QR
                                            </NeonText>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity style={styles.exitBtn} onPress={handleLeaveJoinedPoll} activeOpacity={0.8}>
                                        <NeonText size={11} color="#FF0055" weight="bold">
                                            ✕ SWITCH ROOM
                                        </NeonText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Main Poll Content Area */}
                    {(activeTab === 'host' || (activeTab === 'join' && joinedRoomId)) && (
                        <ScrollView style={styles.pollScroll} showsVerticalScrollIndicator={false}>
                            {/* Question Card */}
                            <View style={styles.questionCard}>
                                {isHosting && isEditingQuestion ? (
                                    <View style={styles.editQuestionRow}>
                                        <TextInput
                                            style={styles.editQuestionInput}
                                            value={editedQuestion}
                                            onChangeText={setEditedQuestion}
                                            placeholder="Enter poll question..."
                                            placeholderTextColor="#6B7280"
                                            maxLength={80}
                                            autoFocus
                                        />
                                        <TouchableOpacity style={styles.saveQuestionBtn} onPress={handleSaveQuestion}>
                                            <NeonText size={12} weight="bold" color={COLORS.deepNightBlack}>SAVE</NeonText>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        disabled={!isHosting}
                                        onPress={() => {
                                            setEditedQuestion(question);
                                            setIsEditingQuestion(true);
                                        }}
                                        activeOpacity={isHosting ? 0.75 : 1}
                                    >
                                        <NeonText size={16} weight="bold" color={COLORS.white} style={styles.questionText}>
                                            {question} {isHosting && <NeonText size={11} color="#9CA3AF"> ✏️</NeonText>}
                                        </NeonText>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.questionMetaRow}>
                                    <View style={styles.totalBadge}>
                                        <NeonText size={11} weight="bold" color={COLORS.neonYellow || '#FFD700'}>
                                            {totalVotes} {totalVotes === 1 ? 'TOTAL VOTE' : 'TOTAL VOTES'}
                                        </NeonText>
                                    </View>

                                    {isLocked && (
                                        <View style={styles.lockedBadge}>
                                            <NeonText size={10} weight="bold" color="#FF0055">
                                                🔒 LOCKED
                                            </NeonText>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Real-time Interactive Bar Chart */}
                            <View style={styles.optionsWrap}>
                                {options.map((opt) => (
                                    <PollBar
                                        key={opt.id}
                                        label={opt.text}
                                        count={opt.count || 0}
                                        total={totalVotes}
                                        color={opt.color}
                                        onVote={() => handleVote(opt.id)}
                                        isSelected={votedOptionId === opt.id}
                                        isLocked={isLocked}
                                        styles={styles}
                                    />
                                ))}
                            </View>

                            {/* Host Controls: Add Custom Option */}
                            {isHosting && options.length < 6 && (
                                <View style={styles.addOptionRow}>
                                    <TextInput
                                        style={styles.optionInput}
                                        placeholder="Add custom option..."
                                        placeholderTextColor="#6B7280"
                                        value={newOptionText}
                                        onChangeText={setNewOptionText}
                                        maxLength={24}
                                        onSubmitEditing={handleAddOption}
                                    />
                                    <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddOption} activeOpacity={0.8}>
                                        <NeonText size={12} weight="bold" color={COLORS.deepNightBlack}>
                                            + ADD
                                        </NeonText>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Host Controls: Preset Templates */}
                            {isHosting && (
                                <View style={styles.presetsSection}>
                                    <NeonText size={11} weight="bold" color="#9CA3AF" style={{ marginBottom: 8 }}>
                                        QUICK PARTY TEMPLATES
                                    </NeonText>
                                    <View style={styles.presetButtonsRow}>
                                        {PRESET_POLLS.map((p, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.presetBtn}
                                                onPress={() => handleApplyPreset(p)}
                                                activeOpacity={0.8}
                                            >
                                                <NeonText size={11} color={COLORS.white}>
                                                    {p.question.split(' ')[0]} {p.question.split(' ')[1]}...
                                                </NeonText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {/* Host Footer: Lock & Reset Controls */}
                    {isHosting && (
                        <View style={styles.footerRow}>
                            <TouchableOpacity
                                style={[styles.footerBtn, isLocked && styles.footerBtnActive]}
                                onPress={handleToggleLock}
                                activeOpacity={0.8}
                            >
                                <NeonText size={12} weight="bold" color={isLocked ? COLORS.neonPink : '#9CA3AF'}>
                                    {isLocked ? '🔒 UNLOCK POLL' : '🔓 LOCK POLL'}
                                </NeonText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.footerBtn}
                                onPress={handleResetVotes}
                                activeOpacity={0.8}
                            >
                                <NeonText size={12} weight="bold" color="#9CA3AF">
                                    ↺ RESET VOTES
                                </NeonText>
                            </TouchableOpacity>
                        </View>
                    )}
                </GlassView>
            </View>

            {/* QR Modal for Host Room Sharing */}
            <QRCodeModal
                visible={showQR}
                onClose={() => setShowQR(false)}
                roomId={hostRoomId}
                mode="poll"
            />
        </Modal>
    );
};

const getStyles = (COLORS) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: 'rgba(17, 24, 39, 0.96)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.25)',
        padding: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        marginRight: 10,
    },
    headerSub: {
        letterSpacing: 1,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeTabsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 12,
        gap: 4,
    },
    modeTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    modeTabActive: {
        backgroundColor: COLORS.neonYellow || '#FFD700',
    },
    modeTabActiveCyan: {
        backgroundColor: COLORS.neonCyan,
    },
    liveToast: {
        backgroundColor: 'rgba(0, 255, 102, 0.12)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 102, 0.3)',
        paddingVertical: 5,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    joinInputContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    joinRoomInput: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.neonCyan,
        paddingVertical: 14,
        paddingHorizontal: 16,
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 3,
        marginBottom: 16,
    },
    joinSubmitBtn: {
        width: '100%',
        backgroundColor: COLORS.neonCyan,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    joinSubmitBtnDisabled: {
        opacity: 0.5,
    },
    roomBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 12,
    },
    roomCodeBox: {
        alignItems: 'flex-start',
    },
    roomCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00FF66',
        marginLeft: 4,
    },
    roomActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    exitBtn: {
        backgroundColor: 'rgba(255, 0, 85, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    pollScroll: {
        maxHeight: 380,
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },
    questionText: {
        lineHeight: 22,
    },
    questionMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    totalBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    lockedBadge: {
        backgroundColor: 'rgba(255, 0, 85, 0.15)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    editQuestionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    editQuestionInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        color: '#FFF',
        fontSize: 14,
    },
    saveQuestionBtn: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsWrap: {
        gap: 10,
        marginBottom: 14,
    },
    pollOptionBtn: {
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    pollOptionContent: {
        position: 'relative',
        paddingVertical: 14,
        paddingHorizontal: 14,
        justifyContent: 'center',
    },
    barFill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    votedBadge: {
        marginLeft: 8,
    },
    optionColorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addOptionRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    optionInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#FFF',
        fontSize: 13,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    addOptionBtn: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: 10,
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    presetsSection: {
        marginTop: 4,
        marginBottom: 10,
    },
    presetButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    footerBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    footerBtnActive: {
        backgroundColor: 'rgba(255, 0, 85, 0.15)',
    },
});

export default LivePollModal;
