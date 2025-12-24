import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
    Share,
    Alert
} from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import { COLORS, SHADOWS } from '../constants/theme';

// Simple QR Code generator using a custom pattern
// For production, consider using react-native-qrcode-svg or similar
const QRCodeDisplay = ({ value, size = 200 }) => {
    // Calculate the join URL
    const joinUrl = value;

    // For now, display the code prominently with visual box
    // In production, you'd use a proper QR library
    return (
        <View style={[styles.qrContainer, { width: size, height: size }]}>
            <View style={styles.qrInner}>
                <NeonText size={16} color={COLORS.neonCyan} style={styles.qrLabel}>
                    SCAN OR SHARE LINK
                </NeonText>
                <View style={styles.codeBox}>
                    <NeonText size={14} color="#888" style={styles.urlText}>
                        {joinUrl}
                    </NeonText>
                </View>
            </View>
        </View>
    );
};

const QRCodeModal = ({ visible, onClose, roomId, baseUrl = '' }) => {
    const [copied, setCopied] = useState(false);

    // Generate the join URL
    const getJoinUrl = () => {
        // Use the app's deployed URL or localhost for testing
        const host = baseUrl || (Platform.OS === 'web'
            ? window.location.origin
            : 'https://playrave-ten.vercel.app');
        return `${host}?join=${roomId}`;
    };

    const joinUrl = getJoinUrl();

    const handleCopyLink = async () => {
        try {
            if (Platform.OS === 'web') {
                await navigator.clipboard.writeText(joinUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                // Use Share on mobile
                await Share.share({
                    message: `Join my PlayRave party! 🎮\n\nRoom Code: ${roomId}\n\nOr click: ${joinUrl}`,
                    title: 'Join PlayRave Party'
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to copy link');
        }
    };

    const handleShare = async () => {
        try {
            if (Platform.OS === 'web' && navigator.share) {
                await navigator.share({
                    title: 'Join PlayRave Party',
                    text: `Join my PlayRave party! Room Code: ${roomId}`,
                    url: joinUrl
                });
            } else {
                await Share.share({
                    message: `Join my PlayRave party! 🎮🎉\n\nRoom Code: ${roomId}\n\nJoin here: ${joinUrl}`,
                    title: 'Join PlayRave Party'
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <NeonText size={24} weight="bold" glow color={COLORS.neonCyan}>
                                    INVITE FRIENDS
                                </NeonText>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <NeonText size={24} color={COLORS.hotPink}>✕</NeonText>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.roomCodeSection}>
                                <NeonText size={14} color="#888">ROOM CODE</NeonText>
                                <NeonText size={48} weight="bold" glow color={COLORS.limeGlow}>
                                    {roomId}
                                </NeonText>
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <NeonText size={12} color="#666" style={styles.dividerText}>OR</NeonText>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.linkSection}>
                                <NeonText size={12} color="#888" style={styles.linkLabel}>
                                    SHARE LINK
                                </NeonText>
                                <View style={styles.linkBox}>
                                    <NeonText size={12} color={COLORS.neonCyan} numberOfLines={1}>
                                        {joinUrl}
                                    </NeonText>
                                </View>
                            </View>

                            <View style={styles.buttonRow}>
                                <NeonButton
                                    title={copied ? "✓ COPIED!" : "📋 COPY LINK"}
                                    onPress={handleCopyLink}
                                    style={styles.actionButton}
                                />
                                <NeonButton
                                    title="📤 SHARE"
                                    onPress={handleShare}
                                    variant="secondary"
                                    style={styles.actionButton}
                                />
                            </View>

                            <NeonText size={12} color="#666" style={styles.hint}>
                                Friends can enter the room code on the join screen
                            </NeonText>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 380,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
        ...SHADOWS.neonGlow,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    closeButton: {
        padding: 5,
    },
    roomCodeSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        marginHorizontal: 15,
    },
    linkSection: {
        marginBottom: 20,
    },
    linkLabel: {
        marginBottom: 8,
        textAlign: 'center',
    },
    linkBox: {
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 248, 255, 0.3)',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    actionButton: {
        flex: 1,
        marginVertical: 0,
    },
    hint: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    qrContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrLabel: {
        marginBottom: 10,
    },
    codeBox: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 10,
        borderRadius: 6,
    },
    urlText: {
        fontSize: 10,
    }
});

export default QRCodeModal;
