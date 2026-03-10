import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';

const ProfileSection = ({
    avatar,
    avatarColor,
    userName,
    level,
    rank,
    onAvatarPress,
    onEditPress,
}) => {
    const isCustomPhoto =
        avatar && typeof avatar === 'string' && avatar.startsWith('data:image');

    return (
        <View style={styles.container}>
            {/* Avatar with glowing ring */}
            <TouchableOpacity style={styles.avatarWrapper} onPress={onAvatarPress}>
                <View style={styles.avatarRing}>
                    <View
                        style={[
                            styles.avatarInner,
                            !isCustomPhoto && {
                                backgroundColor: avatarColor || '#1E293B',
                            },
                        ]}
                    >
                        {isCustomPhoto ? (
                            <Image
                                source={{ uri: avatar }}
                                style={styles.avatarImage}
                            />
                        ) : avatar?.emoji ? (
                            <NeonText size={44}>
                                {avatar.emoji}
                            </NeonText>
                        ) : (
                            <Feather name="user" size={44} color="#8B8FA3" />
                        )}
                    </View>
                </View>
                {/* Online green dot */}
                <View style={styles.onlineDot} />
            </TouchableOpacity>

            {/* Username pill */}
            <TouchableOpacity style={styles.usernamePill} onPress={onEditPress}>
                <NeonText
                    size={16}
                    weight="bold"
                    color={COLORS.white}
                    style={styles.usernameText}
                    numberOfLines={1}
                >
                    {userName || 'GUEST'}
                </NeonText>
                <Feather name="edit-2" size={14} color="#8B8FA3" style={styles.editIcon} />
            </TouchableOpacity>

            {/* Level & rank */}
            <View style={styles.rankRow}>
                <NeonText size={13} color="#6B7280" weight="bold">
                    LVL {level || 1}
                </NeonText>
                <NeonText size={13} color="#6B7280" style={styles.rankDivider}>
                    {'  '}
                </NeonText>
                <NeonText size={13} color={COLORS.neonCyan}>
                    {rank || 'ROOKIE'}
                </NeonText>
            </View>
        </View>
    );
};

const getRankTitle = (level) => {
    if (level >= 50) return 'LEGENDARY';
    if (level >= 40) return 'DIAMOND ELITE';
    if (level >= 30) return 'PLATINUM';
    if (level >= 20) return 'GOLD';
    if (level >= 10) return 'SILVER';
    return 'ROOKIE';
};

// Re-export the helper
ProfileSection.getRankTitle = getRankTitle;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarRing: {
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 3,
        borderColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarInner: {
        width: 94,
        height: 94,
        borderRadius: 47,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 94,
        height: 94,
        borderRadius: 47,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: COLORS.deepNightBlack,
    },
    usernamePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
        maxWidth: '80%',
    },
    usernameText: {
        letterSpacing: 1.5,
        flexShrink: 1,
    },
    editIcon: {
        marginLeft: 10,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankDivider: {
        opacity: 0.4,
    },
});

export default React.memo(ProfileSection);
