import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import { COLORS } from '../constants/theme';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const TYPE_ICONS = {
    'truth-or-dare': '🎭',
    'never-have-i-ever': '🙋',
    'would-you-rather': '🤔',
    'trivia': '🧠'
};

const TABS = [
    { id: null, name: 'All' },
    { id: 'truth-or-dare', name: '🎭' },
    { id: 'never-have-i-ever', name: '🙋' },
    { id: 'would-you-rather', name: '🤔' },
    { id: 'trivia', name: '🧠' }
];

const CommunityPacksScreen = ({ navigation }) => {
    const { isAuthenticated } = useAuth();
    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        loadPacks();
    }, [selectedType]);

    const loadPacks = async () => {
        try {
            const query = selectedType ? `?type=${selectedType}` : '';
            const { packs: data } = await ApiService.request(`/packs/public${query}`);
            setPacks(data || []);
        } catch (e) {
            console.error('Load packs error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLike = async (pack) => {
        if (!isAuthenticated) return;
        try {
            const { likes, liked } = await ApiService.request(`/packs/${pack.id}/like`, { method: 'POST' });
            setPacks(packs.map(p => p.id === pack.id ? { ...p, likes, liked } : p));
        } catch (e) {
            console.error('Like error:', e);
        }
    };

    const renderPack = ({ item }) => (
        <TouchableOpacity style={styles.packCard} onPress={() => navigation.navigate('PackPreview', { packId: item.id })}>
            <View style={styles.packIcon}>
                <NeonText size={28}>{TYPE_ICONS[item.type] || '📦'}</NeonText>
            </View>
            <View style={styles.packInfo}>
                <NeonText size={15} weight="bold">{item.name}</NeonText>
                <NeonText size={12} color="#888">{item.items?.length || 0} items</NeonText>
            </View>
            <View style={styles.stats}>
                <TouchableOpacity onPress={() => handleLike(item)} style={styles.likeBtn}>
                    <NeonText size={16}>{item.liked ? '❤️' : '🤍'}</NeonText>
                    <NeonText size={12} color="#888">{item.likes}</NeonText>
                </TouchableOpacity>
                <NeonText size={10} color="#666">▶ {item.plays}</NeonText>
            </View>
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow>🌐 Community</NeonText>
                    <TouchableOpacity onPress={() => navigation.navigate('MyPacks')}>
                        <NeonText size={14} color={COLORS.neonCyan}>My Packs →</NeonText>
                    </TouchableOpacity>
                </View>

                {/* Type Tabs */}
                <View style={styles.tabs}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.id || 'all'}
                            style={[styles.tab, selectedType === tab.id && styles.tabActive]}
                            onPress={() => setSelectedType(tab.id)}
                        >
                            <NeonText size={14} color={selectedType === tab.id ? '#fff' : '#888'}>{tab.name}</NeonText>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={packs}
                    renderItem={renderPack}
                    keyExtractor={i => i.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPacks(); }} tintColor={COLORS.neonCyan} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <NeonText size={48}>🌍</NeonText>
                            <NeonText size={16} color="#888">No community packs yet</NeonText>
                            <NeonText size={14} color="#666">Be the first to share!</NeonText>
                        </View>
                    }
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    tabs: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15 },
    tab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    tabActive: { backgroundColor: COLORS.neonCyan + '40' },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    packCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15, padding: 12, marginBottom: 10
    },
    packIcon: {
        width: 50, height: 50, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    packInfo: { flex: 1 },
    stats: { alignItems: 'flex-end' },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 60 }
});

export default CommunityPacksScreen;
