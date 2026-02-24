import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import NeonText from '../NeonText';
import { COLORS } from '../../constants/theme';

const PlayerRow = ({ player, isMe, isHost, canKick, onKick }) => {
    const isBase64Image =
        player.avatar &&
        typeof player.avatar === 'string' &&
        player.avatar.startsWith('data:image');

    return (
        <View style={[styles.playerRow, isMe && styles.playerRowHighlight]}>
            {/* Avatar */}
            <View style={styles.avatarCircle}>
                {isBase64Image ? (
                    <Image source={{ uri: player.avatar }} style={styles.avatarImage} />
                ) : player.avatar?.emoji ? (
                    <NeonText size={22}>{player.avatar.emoji}</NeonText>
                ) : (
                    <NeonText size={22}>👤</NeonText>
                )}
            </View>

            {/* Info */}
            <View style={styles.playerInfo}>
                <View style={styles.nameRow}>
                    <NeonText size={15} weight="bold" color={COLORS.white} numberOfLines={1} style={styles.nameText}>
                        {player.name}
                    </NeonText>
                    {isMe && (
                        <NeonText size={13} color="#6B7280"> (You)</NeonText>
                    )}
                </View>
                {player.isHost && (
                    <View style={styles.hostBadge}>
                        <NeonText size={11} color={COLORS.neonCyan} weight="bold">
                            👑 HOST
                        </NeonText>
                    </View>
                )}
                {player.isReady && !player.isHost && (
                    <NeonText size={11} color="#22C55E" weight="bold">
                        ✓ Ready
                    </NeonText>
                )}
            </View>

            {/* Green online dot */}
            <View style={styles.onlineDot} />

            {/* Kick button for host */}
            {canKick && (
                <TouchableOpacity
                    style={styles.kickBtn}
                    onPress={() => onKick(player.id, player.name)}
                >
                    <NeonText size={11} color={COLORS.hotPink}>KICK</NeonText>
                </TouchableOpacity>
            )}
        </View>
    );
};

const PlayerList = ({ players, currentPlayerId, isHost, maxPlayers = 8, onKick }) => {
    const count = players?.length || 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <NeonText size={12} color="#6B7280" style={styles.dots}>⠿</NeonText>
                    <NeonText size={12} weight="bold" color={COLORS.neonCyan} style={styles.headerLabel}>
                        PLAYERS IN LOBBY ({count}/{maxPlayers})
                    </NeonText>
                </View>
                <TouchableOpacity>
                    <NeonText size={16} color="#6B7280">⚙</NeonText>
                </TouchableOpacity>
            </View>

            {/* Player rows */}
            {players && players.map((player) => {
                const isMe = player.id === currentPlayerId;
                const canKick = isHost && !player.isHost;
                return (
                    <PlayerRow
                        key={player.id}
                        player={player}
                        isMe={isMe}
                        isHost={player.isHost}
                        canKick={canKick}
                        onKick={onKick}
                    />
                );
            })}

            {/* Empty state */}
            {count <= 1 && (
                <View style={styles.emptyState}>
                    <NeonText size={14} color="#4B5563" style={styles.emptyText}>
                        Waiting for friends to join...
                    </NeonText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dots: {
        opacity: 0.5,
    },
    headerLabel: {
        letterSpacing: 1.5,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    playerRowHighlight: {
        borderColor: 'rgba(0, 248, 255, 0.25)',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    playerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        flexShrink: 1,
    },
    hostBadge: {
        marginTop: 2,
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
        marginLeft: 10,
    },
    kickBtn: {
        marginLeft: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 63, 164, 0.15)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.hotPink,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontStyle: 'italic',
    },
});

export default React.memo(PlayerList);
