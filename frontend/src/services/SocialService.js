import { Share, Platform, Alert } from 'react-native';

// Social Sharing Service
const SocialService = {
    // Share game result
    async shareGameResult(playerName, gameName, score, rank, totalPlayers) {
        const emoji = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎮';
        const message = `${emoji} I just ${rank === 1 ? 'WON' : 'played'} ${gameName} on PlayRave!\n\n` +
            `Score: ${score} points\n` +
            `Rank: #${rank} of ${totalPlayers} players\n\n` +
            `🎉 Download PlayRave and challenge me!\n` +
            `https://playrave.app`;

        return this.share(message, `PlayRave - ${gameName} Results`);
    },

    // Share room invite
    async shareRoomInvite(roomId, hostName) {
        const joinUrl = `https://playrave.app/join?room=${roomId}`;
        const message = `🎮 Join my PlayRave party!\n\n` +
            `Host: ${hostName}\n` +
            `Room Code: ${roomId}\n\n` +
            `👉 Join here: ${joinUrl}`;

        return this.share(message, 'Join my PlayRave Party!');
    },

    // Share achievement
    async shareAchievement(achievementName, achievementEmoji) {
        const message = `${achievementEmoji} I just unlocked "${achievementName}" on PlayRave!\n\n` +
            `🎉 Can you beat my achievements?\n` +
            `https://playrave.app`;

        return this.share(message, `PlayRave Achievement: ${achievementName}`);
    },

    // Share milestone
    async shareMilestone(milestoneType, value) {
        let message = '';

        switch (milestoneType) {
            case 'games':
                message = `🎮 I've played ${value} games on PlayRave!\n\n` +
                    `Join me for some party fun!\nhttps://playrave.app`;
                break;
            case 'wins':
                message = `🏆 I've won ${value} games on PlayRave!\n\n` +
                    `Think you can beat me?\nhttps://playrave.app`;
                break;
            case 'points':
                message = `💎 I've earned ${value.toLocaleString()} points on PlayRave!\n\n` +
                    `Download and challenge me!\nhttps://playrave.app`;
                break;
            default:
                message = `🎉 Check out PlayRave - the ultimate party game app!\nhttps://playrave.app`;
        }

        return this.share(message, 'PlayRave Milestone');
    },

    // Core share function
    async share(message, title = 'PlayRave') {
        try {
            if (Platform.OS === 'web') {
                // Web sharing
                if (navigator.share) {
                    await navigator.share({
                        title,
                        text: message,
                    });
                    return { success: true };
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(message);
                    Alert.alert('Copied!', 'Message copied to clipboard');
                    return { success: true, copied: true };
                } else {
                    Alert.alert('Sharing not available', 'Copy this message:\n\n' + message);
                    return { success: false };
                }
            } else {
                // Native sharing
                const result = await Share.share({
                    message,
                    title
                }, {
                    dialogTitle: title,
                    subject: title
                });

                return {
                    success: result.action === Share.sharedAction,
                    activityType: result.activityType
                };
            }
        } catch (error) {
            console.error('Sharing error:', error);
            return { success: false, error };
        }
    },

    // Generate shareable image text (for when actual images aren't available)
    generateShareCard(playerName, gameName, score, rank) {
        const lines = [
            '╔═══════════════════╗',
            '║    🎮 PLAYRAVE    ║',
            '╠═══════════════════╣',
            `║ ${playerName.padEnd(17)} ║`,
            `║ ${gameName.padEnd(17)} ║`,
            '╠═══════════════════╣',
            `║ Score: ${String(score).padEnd(10)} ║`,
            `║ Rank:  #${String(rank).padEnd(9)} ║`,
            '╚═══════════════════╝',
        ];
        return lines.join('\n');
    },

    // Create Twitter/X share URL
    getTwitterShareUrl(text) {
        const encoded = encodeURIComponent(text);
        return `https://twitter.com/intent/tweet?text=${encoded}`;
    },

    // Create Facebook share URL
    getFacebookShareUrl(url) {
        const encoded = encodeURIComponent(url);
        return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    },

    // Create WhatsApp share URL
    getWhatsAppShareUrl(text) {
        const encoded = encodeURIComponent(text);
        return `https://wa.me/?text=${encoded}`;
    }
};

export default SocialService;
