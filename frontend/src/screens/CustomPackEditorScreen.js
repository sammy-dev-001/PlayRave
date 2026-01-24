import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    Switch
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const PACK_TYPES = [
    { id: 'truth-or-dare', name: 'Truth or Dare', icon: '🎭' },
    { id: 'never-have-i-ever', name: 'Never Have I Ever', icon: '🙋' },
    { id: 'would-you-rather', name: 'Would You Rather', icon: '🤔' },
    { id: 'trivia', name: 'Trivia', icon: '🧠' }
];

const CustomPackEditorScreen = ({ route, navigation }) => {
    const { packId } = route.params || {};
    const { isGuest } = useAuth();

    const [name, setName] = useState('');
    const [type, setType] = useState('truth-or-dare');
    const [isPublic, setIsPublic] = useState(false);
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [newItemSecondary, setNewItemSecondary] = useState(''); // For "Would You Rather" options
    const [loading, setSaving] = useState(false);
    const [pack, setPack] = useState(null);

    useEffect(() => {
        if (packId) loadPack();
    }, [packId]);

    const loadPack = async () => {
        try {
            const { pack: data } = await ApiService.request(`/packs/${packId}`);
            setPack(data);
            setName(data.name);
            setType(data.type);
            setIsPublic(data.isPublic);
            setItems(data.items || []);
        } catch (e) {
            Alert.alert('Error', 'Could not load pack');
            navigation.goBack();
        }
    };

    const handleSave = async () => {
        if (isGuest) {
            Alert.alert('Account Required', 'Create an account to save custom packs!');
            return;
        }
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a pack name');
            return;
        }
        if (items.length < 3) {
            Alert.alert('Error', 'Add at least 3 items to your pack');
            return;
        }

        setSaving(true);
        try {
            if (packId) {
                await ApiService.request(`/packs/${packId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name, isPublic, items })
                });
            } else {
                await ApiService.request('/packs', {
                    method: 'POST',
                    body: JSON.stringify({ name, type, isPublic, items })
                });
            }
            Alert.alert('Success', 'Pack saved!');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', e.message || 'Could not save pack');
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = () => {
        if (!newItem.trim()) return;

        const item = type === 'would-you-rather'
            ? { text: newItem, option2: newItemSecondary || 'Option B' }
            : type === 'trivia'
                ? { question: newItem, answer: newItemSecondary }
                : { text: newItem };

        setItems([...items, { ...item, id: Date.now().toString() }]);
        setNewItem('');
        setNewItemSecondary('');
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.itemRow}>
            <View style={styles.itemContent}>
                <NeonText size={14}>{index + 1}. {item.text || item.question}</NeonText>
                {item.option2 && (
                    <NeonText size={12} color="#888">or {item.option2}</NeonText>
                )}
                {item.answer && (
                    <NeonText size={12} color={COLORS.limeGlow}>Answer: {item.answer}</NeonText>
                )}
            </View>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteBtn}>
                <NeonText size={18} color={COLORS.hotPink}>×</NeonText>
            </TouchableOpacity>
        </View>
    );

    const selectedType = PACK_TYPES.find(t => t.id === type);

    return (
        <NeonContainer showBackButton scrollable>
            <View style={styles.container}>
                <NeonText size={24} weight="bold" glow style={styles.title}>
                    {packId ? 'Edit Pack' : 'Create Pack'}
                </NeonText>

                {/* Pack Name */}
                <View style={styles.inputGroup}>
                    <NeonText size={12} color={COLORS.neonCyan}>PACK NAME</NeonText>
                    <TextInput
                        style={styles.input}
                        placeholder="My Awesome Pack"
                        placeholderTextColor="#555"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Type Selector (only when creating) */}
                {!packId && (
                    <View style={styles.inputGroup}>
                        <NeonText size={12} color={COLORS.neonCyan}>PACK TYPE</NeonText>
                        <View style={styles.typeGrid}>
                            {PACK_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.typeBtn, type === t.id && styles.typeBtnActive]}
                                    onPress={() => setType(t.id)}
                                >
                                    <NeonText size={20}>{t.icon}</NeonText>
                                    <NeonText size={10} color={type === t.id ? '#fff' : '#888'}>{t.name}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Public Toggle */}
                <View style={styles.toggleRow}>
                    <NeonText size={14}>Make Public (Community)</NeonText>
                    <Switch
                        value={isPublic}
                        onValueChange={setIsPublic}
                        trackColor={{ false: '#333', true: COLORS.neonCyan }}
                        thumbColor={isPublic ? COLORS.limeGlow : '#666'}
                    />
                </View>

                {/* Add Item */}
                <View style={styles.addSection}>
                    <NeonText size={12} color={COLORS.neonCyan}>ADD {selectedType?.name.toUpperCase()} ITEM</NeonText>
                    <TextInput
                        style={styles.input}
                        placeholder={type === 'trivia' ? 'Enter question...' : 'Enter prompt...'}
                        placeholderTextColor="#555"
                        value={newItem}
                        onChangeText={setNewItem}
                    />
                    {(type === 'would-you-rather' || type === 'trivia') && (
                        <TextInput
                            style={[styles.input, { marginTop: 10 }]}
                            placeholder={type === 'trivia' ? 'Correct answer...' : 'Option B...'}
                            placeholderTextColor="#555"
                            value={newItemSecondary}
                            onChangeText={setNewItemSecondary}
                        />
                    )}
                    <NeonButton title="+ ADD" variant="secondary" onPress={handleAddItem} style={styles.addBtn} />
                </View>

                {/* Items List */}
                <View style={styles.itemsSection}>
                    <NeonText size={14} color="#888">Items ({items.length})</NeonText>
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={i => i.id}
                        style={styles.itemsList}
                        ListEmptyComponent={
                            <NeonText size={14} color="#555" style={styles.emptyText}>No items yet</NeonText>
                        }
                    />
                </View>

                {/* Save Button */}
                <NeonButton
                    title={loading ? 'SAVING...' : 'SAVE PACK'}
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.saveBtn}
                />
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
    title: { marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 10, padding: 14, color: '#fff',
        fontSize: 16, marginTop: 8, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    typeBtn: {
        flex: 1, minWidth: '45%', padding: 12, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center'
    },
    typeBtnActive: { backgroundColor: COLORS.neonCyan + '30', borderWidth: 2, borderColor: COLORS.neonCyan },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    addSection: { marginBottom: 15 },
    addBtn: { marginTop: 10 },
    itemsSection: { flex: 1 },
    itemsList: { marginTop: 10 },
    itemRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10, padding: 12, marginBottom: 8
    },
    itemContent: { flex: 1 },
    deleteBtn: { padding: 8 },
    emptyText: { textAlign: 'center', marginTop: 20 },
    saveBtn: { marginTop: 15, marginBottom: 30 }
});

export default CustomPackEditorScreen;
