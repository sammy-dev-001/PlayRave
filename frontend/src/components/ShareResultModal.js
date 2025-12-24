import React from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Linking,
    Platform
} from 'react-native';
import NeonText from './NeonText';
import NeonButton from './NeonButton';
import SocialService from '../services/SocialService';
import { COLORS } from '../constants/theme';

const ShareResultModal = ({
    visible,
    onClose,
    playerName,
    gameName,
    score,
    rank,
    totalPlayers
}) => {
    const isWinner = rank === 1;
    const rankEmoji = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎮';

    const handleShare = async () => {
        await SocialService.shareGameResult(playerName, gameName, score, rank, totalPlayers);
    };

    const handleTwitterShare = () => {
        const text = `${rankEmoji} I just ${isWinner ? 'WON' : 'played'} ${gameName} on @PlayRaveApp!\n` +
            `Score: ${score} | Rank: #${rank}/${totalPlayers}\n` +
            `🎉 Download and challenge me!`;
        const url = SocialService.getTwitterShareUrl(text);
        Linking.openURL(url);
    };

    const handleWhatsAppShare = () => {
        const text = `${rankEmoji} I just ${isWinner ? 'WON' : 'played'} ${gameName} on PlayRave!\n\n` +
            `Score: ${score} points\n` +
            `Rank: #${rank} of ${totalPlayers}\n\n` +
            `🎉 Download PlayRave: https://playrave.app`;
        const url = SocialService.getWhatsAppShareUrl(text);
        Linking.openURL(url);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            {/* Header */}
                            <View style={styles.header}>
                                <NeonText size={48}>{rankEmoji}</NeonText>
                                <NeonText size={22} weight="bold" glow style={styles.title}>
                                    {isWinner ? 'YOU WON!' : 'GAME OVER!'}
                                </NeonText>
                            </View>

                            {/* Result Card */}
                            <View style={styles.resultCard}>
                                <View style={styles.resultRow}>
                                    <NeonText size={14} color="#888">GAME</NeonText>
                                    <NeonText size={16} weight="bold">{gameName}</NeonText>
                                </View>
                                <View style={styles.resultRow}>
                                    <NeonText size={14} color="#888">SCORE</NeonText>
                                    <NeonText size={24} weight="bold" color={COLORS.limeGlow}>
                                        {score}
                                    </NeonText>
                                </View>
                                <View style={styles.resultRow}>
                                    <NeonText size={14} color="#888">RANK</NeonText>
                                    <NeonText size={16} weight="bold" color={COLORS.neonCyan}>
                                        #{rank} of {totalPlayers}
                                    </NeonText>
                                </View>
                            </View>

                            {/* Share Options */}
                            <NeonText size={14} color="#888" style={styles.shareLabel}>
                                SHARE YOUR RESULT
                            </NeonText>

                            <View style={styles.shareButtons}>
                                {/* Native Share */}
                                <TouchableOpacity
                                    style={[styles.shareBtn, styles.nativeShare]}
                                    onPress={handleShare}
                                >
                                    <NeonText size={24}>📤</NeonText>
                                    <NeonText size={10}>Share</NeonText>
                                </TouchableOpacity>

                                {/* Twitter */}
                                <TouchableOpacity
                                    style={[styles.shareBtn, styles.twitterShare]}
                                    onPress={handleTwitterShare}
                                >
                                    <NeonText size={24}>🐦</NeonText>
                                    <NeonText size={10}>Twitter</NeonText>
                                </TouchableOpacity>

                                {/* WhatsApp */}
                                <TouchableOpacity
                                    style={[styles.shareBtn, styles.whatsappShare]}
                                    onPress={handleWhatsAppShare}
                                >
                                    <NeonText size={24}>💬</NeonText>
                                    <NeonText size={10}>WhatsApp</NeonText>
                                </TouchableOpacity>
                            </View>

                            {/* Close Button */}
                            <NeonButton
                                title="CONTINUE"
                                onPress={onClose}
                                variant="secondary"
                                style={styles.continueBtn}
                            />
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 25,
        borderWidth: 2,
        borderColor: COLORS.electricPurple,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        marginTop: 10,
    },
    resultCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    shareLabel: {
        textAlign: 'center',
        marginBottom: 15,
        letterSpacing: 1,
    },
    shareButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 20,
    },
    shareBtn: {
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        minWidth: 70,
    },
    nativeShare: {
        backgroundColor: 'rgba(0, 248, 255, 0.1)',
        borderWidth: 1,
        borderColor: COLORS.neonCyan,
    },
    twitterShare: {
        backgroundColor: 'rgba(29, 161, 242, 0.2)',
        borderWidth: 1,
        borderColor: '#1DA1F2',
    },
    whatsappShare: {
        backgroundColor: 'rgba(37, 211, 102, 0.2)',
        borderWidth: 1,
        borderColor: '#25D366',
    },
    continueBtn: {
        marginTop: 5,
    }
});

export default ShareResultModal;
