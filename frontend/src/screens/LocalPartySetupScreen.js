import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NeonBackground from '../components/NeonBackground';
import MuteButton from '../components/MuteButton';
import NeonText from '../components/NeonText';
import { COLORS } from '../constants/theme';

const MAX_PLAYERS = 8;

const GENDERS = [
    { key: 'male', label: 'MALE', icon: 'account-outline' },
    { key: 'female', label: 'FEMALE', icon: 'account-outline' },
    { key: 'other', label: 'OTHER', icon: 'account-group-outline' },
];

const LocalPartySetupScreen = ({ navigation }) => {
    const [playerName, setPlayerName] = useState('');
    const [selectedGender, setSelectedGender] = useState('male');
    const [players, setPlayers] = useState([]);

    // Pulse animation for start button
    const pulseAnim = useRef(new Animated.Value(1)).current;
    React.useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.04,
                    duration: 1400,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1400,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();
    }, []);

    const addPlayer = () => {
        if (!playerName.trim()) {
            Alert.alert('Enter Name', 'Please enter a player name');
            return;
        }
        if (players.length >= MAX_PLAYERS) {
            Alert.alert('Max Players', `Maximum ${MAX_PLAYERS} players allowed`);
            return;
        }
        if (players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
            Alert.alert('Duplicate Name', 'This name is already added');
            return;
        }

        const newPlayer = {
            id: Date.now().toString(),
            name: playerName.trim(),
            gender: selectedGender,
        };

        setPlayers([...players, newPlayer]);
        setPlayerName('');
        setSelectedGender('male');
    };

    const removePlayer = (id) => {
        setPlayers(players.filter(p => p.id !== id));
    };

    const startParty = () => {
        if (players.length < 1) {
            Alert.alert('Need Players', 'Add at least 1 player to start');
            return;
        }
        navigation.navigate('LocalGameSelection', {
            players,
            isSinglePlayer: players.length === 1,
        });
    };

    const renderPlayer = ({ item, index }) => (
        <View style={styles.playerRow}>
            <View style={styles.playerLeft}>
                <NeonText size={14} color="#6B7280" style={styles.playerIndex}>
                    {index + 1}.
                </NeonText>
                <View style={[styles.playerAvatar, item.gender === 'female' && styles.playerAvatarFemale]}>
                    <MaterialCommunityIcons
                        name="account-outline"
                        size={22}
                        color={item.gender === 'female' ? COLORS.hotPink : COLORS.neonCyan}
                    />
                </View>
                <NeonText size={18} weight="bold" color={COLORS.white}>
                    {item.name}
                </NeonText>
            </View>
            <TouchableOpacity onPress={() => removePlayer(item.id)} style={styles.removeBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
        </View>
    );

    const modeLabel = players.length === 1
        ? 'SINGLE PLAYER MODE'
        : `MULTIPLAYER MODE – ${players.length} PLAYERS`;

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#05050A" />
            <NeonBackground />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <MuteButton style={styles.muteOverride} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ScrollView
                        style={styles.flex}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Title */}
                        <View style={styles.titleSection}>
                            <NeonText size={38} weight="bold" style={styles.title}>
                                LOCAL PARTY
                            </NeonText>
                            <NeonText size={14} color="#6B7280" style={styles.subtitle}>
                                Pass the device to play
                            </NeonText>
                        </View>

                        {/* Setup Card */}
                        <View style={styles.card}>
                            {/* Gender Selection */}
                            <NeonText size={11} color="#6B7280" weight="bold" style={styles.sectionLabel}>
                                SELECT GENDER:
                            </NeonText>
                            <View style={styles.genderRow}>
                                {GENDERS.map(g => {
                                    const isActive = selectedGender === g.key;
                                    return (
                                        <TouchableOpacity
                                            key={g.key}
                                            style={[
                                                styles.genderBtn,
                                                isActive && styles.genderBtnActive,
                                            ]}
                                            onPress={() => setSelectedGender(g.key)}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons
                                                name={g.icon}
                                                size={24}
                                                color={isActive ? COLORS.neonCyan : '#6B7280'}
                                            />
                                            <NeonText
                                                size={10}
                                                weight="bold"
                                                color={isActive ? COLORS.neonCyan : '#6B7280'}
                                                style={styles.genderLabel}
                                            >
                                                {g.label}
                                            </NeonText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Name Input + Add */}
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Player Name"
                                    placeholderTextColor="#888899"
                                    value={playerName}
                                    onChangeText={setPlayerName}
                                    onSubmitEditing={addPlayer}
                                    maxLength={20}
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={addPlayer}
                                    activeOpacity={0.8}
                                >
                                    <NeonText size={16} weight="bold" color="#05050A">
                                        Add
                                    </NeonText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Players Section */}
                        <View style={styles.playersHeader}>
                            <View style={styles.playersHeaderLeft}>
                                <MaterialCommunityIcons name="account-group" size={20} color={COLORS.neonCyan} />
                                <NeonText size={14} weight="bold" color={COLORS.white} style={styles.playersTitle}>
                                    CURRENT PLAYERS ({players.length})
                                </NeonText>
                            </View>
                            <NeonText size={12} color="#6B7280">
                                MAX {MAX_PLAYERS}
                            </NeonText>
                        </View>

                        {players.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <NeonText size={14} color="#4B5563" style={styles.emptyText}>
                                    No players added yet
                                </NeonText>
                            </View>
                        ) : (
                            <FlatList
                                data={players}
                                keyExtractor={item => item.id}
                                renderItem={renderPlayer}
                                scrollEnabled={false}
                                contentContainerStyle={styles.playersList}
                            />
                        )}

                        {/* Mode indicator */}
                        {players.length > 0 && (
                            <View style={styles.modeIndicator}>
                                <MaterialCommunityIcons
                                    name={players.length === 1 ? 'robot-outline' : 'account-group-outline'}
                                    size={16}
                                    color="#6B7280"
                                />
                                <NeonText size={12} color="#6B7280" style={styles.modeText}>
                                    {modeLabel}
                                </NeonText>
                            </View>
                        )}

                        {/* Bottom spacer */}
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Fixed Start Button */}
                    {players.length >= 1 && (
                        <View style={styles.bottomBar}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                                <TouchableOpacity
                                    style={styles.startButton}
                                    onPress={startParty}
                                    activeOpacity={0.8}
                                >
                                    <NeonText size={20} weight="bold" color="#05050A">
                                        {players.length === 1 ? 'Play vs AI' : 'Start Party'}
                                    </NeonText>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        // Bug 7: Removed height:'100%', minHeight:'100vh', hardcoded paddingTop.
        // SafeAreaView in JSX handles top inset; flex:1 fills parent without 100vh overflow.
        backgroundColor: '#05050A',
    },
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    muteOverride: {
        position: 'relative',
        top: 0,
        right: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    // -- Title --
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        color: COLORS.white,
        letterSpacing: 4,
    },
    subtitle: {
        marginTop: 6,
        letterSpacing: 1,
    },
    // -- Card --
    card: {
        backgroundColor: '#0C0C14',
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    sectionLabel: {
        letterSpacing: 2,
        marginBottom: 14,
    },
    // -- Gender --
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    genderBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#161622',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 6,
    },
    genderBtnActive: {
        borderColor: COLORS.neonCyan,
        backgroundColor: 'rgba(0, 229, 255, 0.06)',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    genderLabel: {
        letterSpacing: 1.5,
    },
    // -- Input --
    inputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#161622',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        outlineStyle: 'none',
    },
    addBtn: {
        backgroundColor: COLORS.neonCyan,
        borderRadius: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    // -- Players --
    playersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    playersHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playersTitle: {
        letterSpacing: 1.5,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontStyle: 'italic',
    },
    playersList: {
        gap: 10,
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    playerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playerIndex: {
        minWidth: 22,
    },
    playerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerAvatarFemale: {
        backgroundColor: 'rgba(255, 63, 164, 0.1)',
    },
    removeBtn: {
        padding: 6,
    },
    // -- Mode indicator --
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
    },
    modeText: {
        letterSpacing: 2,
    },
    // -- Start Button --
    bottomBar: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingTop: 10,
    },
    startButton: {
        height: 60,
        borderRadius: 16,
        backgroundColor: COLORS.neonCyan,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.neonCyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 18,
        elevation: 12,
    },
});

export default LocalPartySetupScreen;
