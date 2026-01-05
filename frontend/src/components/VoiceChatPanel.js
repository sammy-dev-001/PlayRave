import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import NeonText from './NeonText';
import { COLORS } from '../constants/theme';
import VoiceService from '../services/VoiceService';

const VoiceChatPanel = ({ roomId, playerName, visible = true }) => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speakingUsers, setSpeakingUsers] = useState({});
    const [users, setUsers] = useState([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        initVoice();
        return () => {
            VoiceService.leaveChannel();
        };
    }, []);

    useEffect(() => {
        if (isConnected && !isMuted) {
            // Pulse animation when connected and unmuted
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isConnected, isMuted]);

    const initVoice = async () => {
        const available = await VoiceService.init();
        setIsAvailable(available);

        if (available) {
            VoiceService.onUserJoined = (uid) => {
                setUsers(prev => [...prev, { uid, name: `User ${uid}` }]);
            };
            VoiceService.onUserLeft = (uid) => {
                setUsers(prev => prev.filter(u => u.uid !== uid));
            };
            VoiceService.onAudioVolumeIndication = (volumes) => {
                const speaking = {};
                volumes.forEach(v => {
                    if (v.level > 5) speaking[v.uid] = true;
                });
                setSpeakingUsers(speaking);
            };
        }
    };

    const handleJoinVoice = async () => {
        if (!roomId) return;
        const success = await VoiceService.joinChannel(`playrave-${roomId}`);
        setIsConnected(success);
    };

    const handleLeaveVoice = async () => {
        await VoiceService.leaveChannel();
        setIsConnected(false);
    };

    const handleToggleMute = () => {
        const muted = VoiceService.toggleMute();
        setIsMuted(muted);
    };

    if (!visible || !isAvailable) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText size={12} color={COLORS.neonCyan}>🎤 VOICE</NeonText>
                {isConnected && (
                    <View style={styles.connectedBadge}>
                        <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                        <NeonText size={10} color={COLORS.limeGlow}>LIVE</NeonText>
                    </View>
                )}
            </View>

            {!isConnected ? (
                <TouchableOpacity style={styles.joinBtn} onPress={handleJoinVoice}>
                    <NeonText size={14} color="#fff">Join Voice Chat</NeonText>
                </TouchableOpacity>
            ) : (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlBtn, isMuted && styles.mutedBtn]}
                        onPress={handleToggleMute}
                    >
                        <NeonText size={20}>{isMuted ? '🔇' : '🎤'}</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlBtn} onPress={handleLeaveVoice}>
                        <NeonText size={20}>📴</NeonText>
                    </TouchableOpacity>
                </View>
            )}

            {isConnected && users.length > 0 && (
                <View style={styles.usersList}>
                    {users.slice(0, 4).map(u => (
                        <View key={u.uid} style={[styles.userBadge, speakingUsers[u.uid] && styles.speaking]}>
                            <NeonText size={10}>👤</NeonText>
                        </View>
                    ))}
                    {users.length > 4 && (
                        <NeonText size={10} color="#888">+{users.length - 4}</NeonText>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    liveDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: COLORS.limeGlow
    },
    joinBtn: {
        backgroundColor: COLORS.neonCyan + '30',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center'
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15
    },
    controlBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    mutedBtn: {
        backgroundColor: COLORS.hotPink + '40'
    },
    usersList: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 8
    },
    userBadge: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    speaking: {
        borderWidth: 2,
        borderColor: COLORS.limeGlow
    }
});

export default VoiceChatPanel;
