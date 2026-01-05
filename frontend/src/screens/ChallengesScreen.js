import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

const ChallengesScreen = ({ navigation }) => {
    const { isGuest, refreshUser } = useAuth();
    const [tab, setTab] = useState('daily');
    const [daily, setDaily] = useState([]);
    const [weekly, setWeekly] = useState([]);
    const [dailyReset, setDailyReset] = useState(0);
    const [weeklyReset, setWeeklyReset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!isGuest) loadChallenges();
        }, [isGuest])
    );

    const loadChallenges = async () => {
        try {
            const data = await ApiService.request('/challenges');
            setDaily(data.daily || []);
            setWeekly(data.weekly || []);
            setDailyReset(data.dailyResetIn || 0);
            setWeeklyReset(data.weeklyResetIn || 0);
        } catch (e) {
            console.error('Load challenges error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleClaim = async (challenge) => {
        try {
            const { xp } = await ApiService.request(`/challenges/${challenge.id}/claim`, { method: 'POST' });
            Alert.alert('Reward Claimed!', `+${xp} XP`);
            refreshUser();
            loadChallenges();
        } catch (e) {
            Alert.alert('Error', e.message || 'Could not claim reward');
        }
    };

    const renderChallenge = ({ item }) => {
        const progressPercent = Math.min(100, (item.progress / item.target) * 100);

        return (
            <View style={[styles.challengeCard, item.completed && styles.completedCard]}>
                <View style={styles.challengeHeader}>
                    <NeonText size={14} weight="bold">{item.description}</NeonText>
                    <NeonText size={14} color={COLORS.limeGlow}>+{item.xp} XP</NeonText>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <NeonText size={12} color="#888">{item.progress}/{item.target}</NeonText>
                </View>

                {item.completed && !item.claimed && (
                    <NeonButton title="CLAIM" onPress={() => handleClaim(item)} style={styles.claimBtn} />
                )}
                {item.claimed && (
                    <NeonText size={12} color={COLORS.limeGlow} style={styles.claimedText}>✓ Claimed</NeonText>
                )}
            </View>
        );
    };

    if (isGuest) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.guestContainer}>
                    <NeonText size={48}>🎯</NeonText>
                    <NeonText size={20} weight="bold" style={styles.guestTitle}>Account Required</NeonText>
                    <NeonText size={14} color="#888" style={styles.guestText}>
                        Create an account to track challenges and earn XP
                    </NeonText>
                    <NeonButton title="CREATE ACCOUNT" onPress={() => navigation.navigate('Auth')} style={styles.authBtn} />
                </View>
            </NeonContainer>
        );
    }

    const challenges = tab === 'daily' ? daily : weekly;
    const resetTime = tab === 'daily' ? dailyReset : weeklyReset;

    return (
        <NeonContainer showBackButton>
            <View style={styles.container}>
                <NeonText size={24} weight="bold" glow style={styles.title}>🎯 Challenges</NeonText>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'daily' && styles.tabActive]}
                        onPress={() => setTab('daily')}
                    >
                        <NeonText size={14} color={tab === 'daily' ? '#fff' : '#888'}>Daily</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'weekly' && styles.tabActive]}
                        onPress={() => setTab('weekly')}
                    >
                        <NeonText size={14} color={tab === 'weekly' ? '#fff' : '#888'}>Weekly</NeonText>
                    </TouchableOpacity>
                </View>

                {/* Reset Timer */}
                <View style={styles.timerRow}>
                    <NeonText size={12} color="#666">
                        Resets in: {formatTime(resetTime)}
                    </NeonText>
                </View>

                <FlatList
                    data={challenges}
                    renderItem={renderChallenge}
                    keyExtractor={i => i.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadChallenges(); }} tintColor={COLORS.neonCyan} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <NeonText size={32}>🎮</NeonText>
                            <NeonText size={14} color="#888">No challenges available</NeonText>
                        </View>
                    }
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    title: { textAlign: 'center', marginBottom: 20 },
    tabs: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
    tab: { paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
    tabActive: { backgroundColor: COLORS.neonCyan + '40' },
    timerRow: { alignItems: 'center', marginBottom: 15 },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    challengeCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15, padding: 15, marginBottom: 12
    },
    completedCard: { borderWidth: 2, borderColor: COLORS.limeGlow },
    challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.neonCyan },
    claimBtn: { marginTop: 12 },
    claimedText: { marginTop: 10, textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    guestTitle: { marginTop: 20 },
    guestText: { marginTop: 10, textAlign: 'center' },
    authBtn: { marginTop: 30 }
});

export default ChallengesScreen;
