import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import EmptyState from '../components/EmptyState';
import { COLORS } from '../constants/theme';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaderboardScreen = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const { leaderboard: data } = await ApiService.getLeaderboard();
            setLeaderboard(data || []);
        } catch (e) {
            console.error('Leaderboard error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadLeaderboard();
    };

    const renderItem = ({ item, index }) => {
        const isMe = user?.id === item.id;
        const rank = index + 1;

        let medalEmoji = '';
        if (rank === 1) medalEmoji = '🥇';
        else if (rank === 2) medalEmoji = '🥈';
        else if (rank === 3) medalEmoji = '🥉';

        return (
            <View style={[styles.row, isMe && styles.myRow, rank <= 3 && styles.topRow]}>
                <View style={styles.rankContainer}>
                    {medalEmoji ? (
                        <NeonText size={24}>{medalEmoji}</NeonText>
                    ) : (
                        <NeonText size={18} color="#888">#{rank}</NeonText>
                    )}
                </View>
                <View style={styles.avatarContainer}>
                    <NeonText size={28}>{item.avatar}</NeonText>
                </View>
                <View style={styles.info}>
                    <NeonText size={16} weight="bold" color={isMe ? COLORS.neonCyan : '#fff'}>
                        {item.username} {isMe && '(You)'}
                    </NeonText>
                    <NeonText size={12} color="#888">
                        Level {item.level} • {item.gamesWon} wins
                    </NeonText>
                </View>
                <View style={styles.xpContainer}>
                    <NeonText size={16} weight="bold" color={COLORS.limeGlow}>
                        {item.totalXp}
                    </NeonText>
                    <NeonText size={10} color="#666">XP</NeonText>
                </View>
            </View>
        );
    };

    return (
        <NeonContainer showBackButton>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={28} weight="bold" glow>🏆 LEADERBOARD</NeonText>
                    <NeonText size={14} color="#888">Top players worldwide</NeonText>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.neonCyan} />
                    </View>
                ) : leaderboard.length === 0 ? (
                    <EmptyState
                        icon="🎮"
                        title="No Players Yet"
                        message="Be the first to claim victory!"
                    />
                ) : (
                    <FlatList
                        data={leaderboard}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={COLORS.neonCyan}
                            />
                        }
                    />
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    header: { alignItems: 'center', marginBottom: 25, paddingHorizontal: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 15, paddingBottom: 30 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 12, marginBottom: 10
    },
    myRow: {
        borderWidth: 2, borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 255, 255, 0.08)'
    },
    topRow: { backgroundColor: 'rgba(255,255,255,0.08)' },
    rankContainer: { width: 45, alignItems: 'center' },
    avatarContainer: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    info: { flex: 1 },
    xpContainer: { alignItems: 'flex-end' }
});

export default LeaderboardScreen;
