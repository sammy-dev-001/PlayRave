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

const TYPE_ICONS = {
    'truth-or-dare': '🎭',
    'never-have-i-ever': '🙋',
    'would-you-rather': '🤔',
    'trivia': '🧠'
};

const MyPacksScreen = ({ navigation }) => {
    const { isGuest } = useAuth();
    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadPacks();
        }, [])
    );

    const loadPacks = async () => {
        if (isGuest) {
            setLoading(false);
            return;
        }
        try {
            const { packs: data } = await ApiService.request('/packs/mine');
            setPacks(data || []);
        } catch (e) {
            console.error('Load packs error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (pack) => {
        Alert.alert('Delete Pack', `Delete "${pack.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await ApiService.request(`/packs/${pack.id}`, { method: 'DELETE' });
                        setPacks(packs.filter(p => p.id !== pack.id));
                    } catch (e) {
                        Alert.alert('Error', 'Could not delete pack');
                    }
                }
            }
        ]);
    };

    const renderPack = ({ item }) => (
        <TouchableOpacity
            style={styles.packCard}
            onPress={() => navigation.navigate('CustomPackEditor', { packId: item.id })}
        >
            <View style={styles.packIcon}>
                <NeonText size={32}>{TYPE_ICONS[item.type] || '📦'}</NeonText>
            </View>
            <View style={styles.packInfo}>
                <NeonText size={16} weight="bold">{item.name}</NeonText>
                <NeonText size={12} color="#888">
                    {item.items?.length || 0} items • {item.isPublic ? '🌐 Public' : '🔒 Private'}
                </NeonText>
                <NeonText size={10} color="#666">{item.plays} plays • {item.likes} likes</NeonText>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <NeonText size={20} color={COLORS.hotPink}>🗑️</NeonText>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (isGuest) {
        return (
            <NeonContainer showBackButton>
                <View style={styles.guestContainer}>
                    <NeonText size={48}>👤</NeonText>
                    <NeonText size={20} weight="bold" style={styles.guestTitle}>Account Required</NeonText>
                    <NeonText size={14} color="#888" style={styles.guestText}>
                        Create an account to save your custom packs
                    </NeonText>
                    <NeonButton title="CREATE ACCOUNT" onPress={() => navigation.navigate('Auth')} style={styles.authBtn} />
                </View>
            </NeonContainer>
        );
    }

    return (
        <NeonContainer showBackButton>
            <View style={styles.container}>
                <View style={styles.header}>
                    <NeonText size={24} weight="bold" glow>📦 My Packs</NeonText>
                    <TouchableOpacity onPress={() => navigation.navigate('CommunityPacks')}>
                        <NeonText size={14} color={COLORS.neonCyan}>Community →</NeonText>
                    </TouchableOpacity>
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
                            <NeonText size={48}>📝</NeonText>
                            <NeonText size={16} color="#888">No packs yet</NeonText>
                            <NeonText size={14} color="#666">Create your first custom pack!</NeonText>
                        </View>
                    }
                />

                <NeonButton title="+ CREATE NEW PACK" onPress={() => navigation.navigate('CustomPackEditor')} style={styles.createBtn} />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    packCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15, padding: 15, marginBottom: 12
    },
    packIcon: {
        width: 60, height: 60, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    packInfo: { flex: 1 },
    deleteBtn: { padding: 10 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    createBtn: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    guestTitle: { marginTop: 20 },
    guestText: { marginTop: 10, textAlign: 'center' },
    authBtn: { marginTop: 30 }
});

export default MyPacksScreen;
