import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, Modal, TouchableOpacity,
    Animated, Easing, TextInput, ScrollView, Platform
} from 'react-native';
import NeonText from './NeonText';
import GlassView from './GlassView';
import QRCodeModal from './QRCodeModal';
import GameIcon from './GameIcon';
import { useTheme } from '../context/ThemeContext';
import SocketService from '../services/socket';
import SoundService from '../services/SoundService';
import HapticService from '../services/HapticService';
import SocialService from '../services/SocialService';

const WHEEL_COLORS = [
    '#FF0055', '#00F0FF', '#FFE600', '#00FF66',
    '#9D00FF', '#FF6600', '#00B4D8', '#F72585',
    '#7209B7', '#4CC9F0', '#FFB703', '#38B000'
];

const GiveawayWheelModal = ({ visible, onClose, initialRoomId = null }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => getStyles(COLORS), [COLORS]);

    const [roomId, setRoomId] = useState(initialRoomId || '');
    const [players, setPlayers] = useState([
        { id: '1', name: 'Host', color: WHEEL_COLORS[0] },
        { id: '2', name: 'Player 2', color: WHEEL_COLORS[1] },
        { id: '3', name: 'Player 3', color: WHEEL_COLORS[2] },
        { id: '4', name: 'Player 4', color: WHEEL_COLORS[3] },
    ]);
    const [newName, setNewName] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const spinAnim = useRef(new Animated.Value(0)).current;
    const tickerAnim = useRef(new Animated.Value(0)).current;
    const currentAngle = useRef(0);

    // Auto-create room or sync connected players
    useEffect(() => {
        if (!visible) return;

        if (SocketService.isConnected()) {
            const onRoomCreated = (data) => {
                const id = data?.id || data?.room?.id || data?.roomId;
                if (id) {
                    setRoomId(id);
                    const incomingPlayers = data?.players || data?.room?.players;
                    if (incomingPlayers?.length) {
                        setPlayers(incomingPlayers.map((p, idx) => ({
                            id: p.userId || p.id || String(idx),
                            name: p.name || `Player ${idx + 1}`,
                            color: WHEEL_COLORS[idx % WHEEL_COLORS.length],
                        })));
                    }
                }
            };

            const onRoomUpdated = (data) => {
                const incomingPlayers = data?.players || data?.room?.players;
                if (incomingPlayers?.length) {
                    setPlayers(incomingPlayers.map((p, idx) => ({
                        id: p.userId || p.id || String(idx),
                        name: p.name || `Player ${idx + 1}`,
                        color: WHEEL_COLORS[idx % WHEEL_COLORS.length],
                    })));
                }
            };

            SocketService.on('room-created', onRoomCreated);
            SocketService.on('room-updated', onRoomUpdated);

            if (!roomId) {
                SocketService.emit('create-room', {
                    playerName: 'Host',
                    gameType: 'wheel',
                });
            }

            return () => {
                SocketService.off('room-created', onRoomCreated);
                SocketService.off('room-updated', onRoomUpdated);
            };
        } else {
            if (!roomId) {
                const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
                setRoomId(randomCode);
            }
        }
    }, [visible, roomId]);

    const handleAddManualName = () => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        const newEntry = {
            id: String(Date.now()),
            name: trimmed,
            color: WHEEL_COLORS[players.length % WHEEL_COLORS.length],
        };

        setPlayers((prev) => [...prev, newEntry]);
        setNewName('');
        SoundService.playButtonClick();
        HapticService.selection();
    };

    const handleRemovePlayer = (id) => {
        if (players.length <= 2) return;
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        SoundService.playButtonClick();
        HapticService.buttonTap();
    };

    const handleRemoveWinner = () => {
        if (!winner || players.length <= 2) return;
        setPlayers((prev) => prev.filter((p) => p.id !== winner.id));
        setWinner(null);
        SoundService.playButtonClick();
    };

    const handleSpinWheel = () => {
        if (isSpinning || players.length === 0) return;

        setIsSpinning(true);
        setWinner(null);
        SoundService.playButtonClick();
        HapticService.buttonTap();

        const count = players.length;
        const sliceAngle = 360 / count;

        // Pick random winning index
        const winningIndex = Math.floor(Math.random() * count);
        const winningPlayer = players[winningIndex];

        // Deceleration spins: 6 to 9 full rotations
        // With top pointer at 0 deg, the winning slice lands at the top pointer:
        // Angle to align center of winning slice with 0 deg is (360 - (winningIndex * sliceAngle))
        const extraRotations = (6 + Math.floor(Math.random() * 3)) * 360;
        const targetRotation = currentAngle.current + extraRotations + (360 - (winningIndex * sliceAngle));

        // Ticker tick animation interval
        const tickInterval = setInterval(() => {
            SoundService.playTick();
            HapticService.selection();
            Animated.sequence([
                Animated.timing(tickerAnim, { toValue: -15, duration: 40, useNativeDriver: true }),
                Animated.timing(tickerAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }, 130);

        setTimeout(() => clearInterval(tickInterval), 3200);

        Animated.timing(spinAnim, {
            toValue: targetRotation,
            duration: 4000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
            clearInterval(tickInterval);
            currentAngle.current = targetRotation % 360;
            setIsSpinning(false);
            setWinner(winningPlayer);
            HapticService.celebration();
            SoundService.playWinner();
        });
    };

    const handleShare = async () => {
        if (!roomId) return;
        try {
            await SocialService.shareRoomInvite(roomId);
        } catch {
            setShowQR(true);
        }
    };

    const spinInterpolate = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    const tickerInterpolate = tickerAnim.interpolate({
        inputRange: [-20, 20],
        outputRange: ['-20deg', '20deg'],
    });

    const count = Math.max(1, players.length);
    const sliceAngle = 360 / count;

    // Conic gradient background for web rendering of wheel sectors
    const conicGradientString = useMemo(() => {
        if (Platform.OS !== 'web') return null;
        const stops = [];
        players.forEach((p, i) => {
            const startPct = (i / count) * 100;
            const endPct = ((i + 1) / count) * 100;
            stops.push(`${p.color} ${startPct}% ${endPct}%`);
        });
        return `conic-gradient(from 0deg, ${stops.join(', ')})`;
    }, [players, count]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <GlassView style={styles.card}>
                    {/* Header with GameIcon */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <GameIcon gameId="spin-wheel" size={40} style={styles.headerIcon} />
                            <View>
                                <NeonText size={18} weight="bold" color={COLORS.neonPink || '#FF0055'} glow>
                                    SPIN & WIN
                                </NeonText>
                                <NeonText size={10} color="#6B7280" style={styles.headerSub}>
                                    LIVE GIVEAWAY WHEEL OF NAMES
                                </NeonText>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                            <NeonText size={18} color="#9CA3AF">✕</NeonText>
                        </TouchableOpacity>
                    </View>

                    {/* Room & Share Banner */}
                    <View style={styles.roomBanner}>
                        <View style={styles.roomCodeBox}>
                            <NeonText size={9} color="#9CA3AF">JOIN CODE</NeonText>
                            <NeonText size={16} weight="bold" color={COLORS.neonCyan} glow>
                                {roomId || '----'}
                            </NeonText>
                        </View>
                        <View style={styles.roomActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                                <NeonText size={11} weight="bold" color={COLORS.white}>
                                    🔗 SHARE LINK
                                </NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowQR(true)} activeOpacity={0.8}>
                                <NeonText size={11} weight="bold" color={COLORS.white}>
                                    📱 QR CODE
                                </NeonText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Wheel Stage */}
                    <View style={styles.wheelStage}>
                        {/* Glowing ticker needle flapper */}
                        <Animated.View
                            style={[
                                styles.tickerWrap,
                                { transform: [{ rotate: tickerInterpolate }] },
                            ]}
                        >
                            <View style={styles.tickerNeedle} />
                        </Animated.View>

                        {/* Outer Bulb Ring */}
                        <View style={styles.outerBulbRing}>
                            <Animated.View
                                style={[
                                    styles.wheelDisc,
                                    conicGradientString ? { background: conicGradientString } : { backgroundColor: '#111827' },
                                    { transform: [{ rotate: spinInterpolate }] },
                                ]}
                            >
                                {/* Radial Spokes & Slices */}
                                {players.map((p, idx) => {
                                    const angle = idx * sliceAngle;
                                    return (
                                        <View
                                            key={p.id || idx}
                                            style={[
                                                styles.radialSlice,
                                                {
                                                    transform: [
                                                        { rotate: `${angle}deg` },
                                                    ],
                                                },
                                            ]}
                                        >
                                            {/* Divider Line */}
                                            <View style={styles.spokeDivider} />

                                            {/* Player Name Pill */}
                                            <View style={[styles.namePill, { borderColor: p.color }]}>
                                                <NeonText
                                                    size={10}
                                                    weight="bold"
                                                    color="#FFF"
                                                    numberOfLines={1}
                                                >
                                                    {p.name}
                                                </NeonText>
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* Center Hub Button */}
                                <TouchableOpacity
                                    style={styles.centerHub}
                                    onPress={handleSpinWheel}
                                    disabled={isSpinning}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.innerHubCircle}>
                                        <NeonText size={12} weight="bold" color={COLORS.deepNightBlack}>
                                            {isSpinning ? '...' : 'SPIN'}
                                        </NeonText>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>

                    {/* Winner Announcement Banner */}
                    {winner && (
                        <View style={styles.winnerCard}>
                            <View style={styles.winnerLeft}>
                                <NeonText size={11} color="#FFD700" weight="bold">🎉 WINNER!</NeonText>
                                <NeonText size={18} weight="bold" color={winner.color} glow>
                                    {winner.name}
                                </NeonText>
                            </View>
                            {players.length > 2 && (
                                <TouchableOpacity style={styles.removeWinnerBtn} onPress={handleRemoveWinner}>
                                    <NeonText size={10} color="#9CA3AF">REMOVE FROM WHEEL</NeonText>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Add Player Input */}
                    <View style={styles.addPlayerRow}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Add participant name..."
                            placeholderTextColor="#6B7280"
                            value={newName}
                            onChangeText={setNewName}
                            maxLength={16}
                            onSubmitEditing={handleAddManualName}
                        />
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={handleAddManualName}
                            activeOpacity={0.8}
                        >
                            <NeonText size={13} weight="bold" color={COLORS.deepNightBlack}>
                                + ADD
                            </NeonText>
                        </TouchableOpacity>
                    </View>

                    {/* Participants List */}
                    <View style={styles.rosterHeader}>
                        <NeonText size={11} weight="bold" color="#9CA3AF">
                            ON THE WHEEL ({players.length})
                        </NeonText>
                        <NeonText size={9} color="#6B7280">
                            TAP ✕ TO REMOVE
                        </NeonText>
                    </View>
                    <ScrollView style={styles.rosterScroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.rosterWrap}>
                            {players.map((p) => (
                                <View key={p.id} style={[styles.playerTag, { borderColor: p.color }]}>
                                    <View style={[styles.colorDot, { backgroundColor: p.color }]} />
                                    <NeonText size={11} color={COLORS.white} style={styles.tagText}>
                                        {p.name}
                                    </NeonText>
                                    {players.length > 2 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemovePlayer(p.id)}
                                            style={styles.removeTagBtn}
                                        >
                                            <NeonText size={10} color="#9CA3AF">✕</NeonText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Spin Action Button */}
                    <TouchableOpacity
                        style={[styles.mainSpinBtn, isSpinning && styles.btnDisabled]}
                        onPress={handleSpinWheel}
                        disabled={isSpinning}
                        activeOpacity={0.85}
                    >
                        <NeonText size={16} weight="bold" color={COLORS.deepNightBlack}>
                            {isSpinning ? 'SPINNING THE WHEEL...' : '🎡 SPIN TO SELECT'}
                        </NeonText>
                    </TouchableOpacity>
                </GlassView>
            </View>

            {/* QR Modal */}
            <QRCodeModal
                visible={showQR}
                onClose={() => setShowQR(false)}
                roomId={roomId}
                baseUrl="https://playrave.app"
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
        borderColor: 'rgba(255, 0, 85, 0.3)',
        padding: 20,
        alignItems: 'center',
        maxHeight: '92%',
    },
    header: {
        width: '100%',
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
    roomBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        width: '100%',
        marginBottom: 10,
    },
    roomCodeBox: {
        alignItems: 'flex-start',
    },
    roomActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    wheelStage: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
        position: 'relative',
    },
    tickerWrap: {
        position: 'absolute',
        top: -12,
        zIndex: 20,
        alignItems: 'center',
    },
    tickerNeedle: {
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderTopWidth: 22,
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFF',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    outerBulbRing: {
        width: 236,
        height: 236,
        borderRadius: 118,
        borderWidth: 4,
        borderColor: 'rgba(255, 0, 85, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0d14',
        shadowColor: '#FF0055',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 18,
        elevation: 12,
    },
    wheelDisc: {
        width: 220,
        height: 220,
        borderRadius: 110,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    radialSlice: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    spokeDivider: {
        width: 1.5,
        height: 110,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    namePill: {
        position: 'absolute',
        top: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1.5,
        maxWidth: 75,
    },
    centerHub: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF0055',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
        shadowColor: '#FF0055',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 10,
    },
    innerHubCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#00F0FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    winnerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.35)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        width: '100%',
        marginVertical: 6,
    },
    winnerLeft: {
        alignItems: 'flex-start',
    },
    removeWinnerBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    addPlayerRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 8,
        marginTop: 6,
    },
    nameInput: {
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
    addBtn: {
        backgroundColor: COLORS.neonCyan || '#00F0FF',
        borderRadius: 10,
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rosterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
        marginBottom: 6,
    },
    rosterScroll: {
        maxHeight: 70,
        width: '100%',
        marginBottom: 10,
    },
    rosterWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    playerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
    },
    colorDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 5,
    },
    tagText: {
        marginRight: 6,
    },
    removeTagBtn: {
        paddingHorizontal: 2,
    },
    mainSpinBtn: {
        width: '100%',
        backgroundColor: COLORS.neonPink || '#FF0055',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF0055',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 6,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});

export default GiveawayWheelModal;
