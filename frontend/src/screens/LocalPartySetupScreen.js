import React, { useState } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import { COLORS } from '../constants/theme';

const LocalPartySetupScreen = ({ navigation }) => {
    const [playerName, setPlayerName] = useState('');
    const [selectedGender, setSelectedGender] = useState('male');
    const [players, setPlayers] = useState([]);

    const addPlayer = () => {
        if (!playerName.trim()) {
            Alert.alert('Enter Name', 'Please enter a player name');
            return;
        }

        if (players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
            Alert.alert('Duplicate Name', 'This name is already added');
            return;
        }

        const newPlayer = {
            id: Date.now().toString(),
            name: playerName.trim(),
            gender: selectedGender
        };

        setPlayers([...players, newPlayer]);
        setPlayerName('');
        setSelectedGender('male'); // Reset to default
    };

    const removePlayer = (id) => {
        setPlayers(players.filter(p => p.id !== id));
    };

    const startParty = () => {
        if (players.length < 1) {
            Alert.alert('Need Players', 'Add at least 1 player to start');
            return;
        }

        // Pass single-player flag for AI mode
        navigation.navigate('LocalGameSelection', {
            players,
            isSinglePlayer: players.length === 1
        });
    };

    const renderPlayer = ({ item, index }) => {
        const genderIcon = item.gender === 'male' ? '♂️' : item.gender === 'female' ? '♀️' : '⚧️';
        return (
            <View style={styles.playerRow}>
                <NeonText size={18}>
                    {index + 1}. {genderIcon} {item.name}
                </NeonText>
                <TouchableOpacity onPress={() => removePlayer(item.id)}>
                    <NeonText color={COLORS.hotPink}>✕</NeonText>
                </TouchableOpacity>
            </View>
        );
    };

    const renderGenderButton = (gender, label, icon) => (
        <TouchableOpacity
            key={gender}
            style={[
                styles.genderButton,
                selectedGender === gender && styles.genderButtonSelected
            ]}
            onPress={() => setSelectedGender(gender)}
        >
            <NeonText size={20}>{icon}</NeonText>
            <NeonText
                size={12}
                weight={selectedGender === gender ? 'bold' : 'normal'}
                color={selectedGender === gender ? COLORS.limeGlow : COLORS.white}
            >
                {label}
            </NeonText>
        </TouchableOpacity>
    );

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={32} weight="bold" glow>
                    LOCAL PARTY
                </NeonText>
                <NeonText size={14} color={COLORS.neonCyan} style={styles.subtitle}>
                    Add players (everyone uses this device)
                </NeonText>
            </View>

            <View style={styles.genderContainer}>
                <NeonText size={14} style={styles.genderLabel}>SELECT GENDER:</NeonText>
                <View style={styles.genderButtons}>
                    {renderGenderButton('male', 'MALE', '♂️')}
                    {renderGenderButton('female', 'FEMALE', '♀️')}
                    {renderGenderButton('other', 'OTHER', '⚧️')}
                </View>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Player Name"
                    placeholderTextColor="#666"
                    value={playerName}
                    onChangeText={setPlayerName}
                    onSubmitEditing={addPlayer}
                />
                <NeonButton
                    title="ADD"
                    onPress={addPlayer}
                    style={styles.addButton}
                />
            </View>

            <View style={styles.playersContainer}>
                <NeonText size={18} style={styles.playersTitle}>
                    PLAYERS ({players.length})
                </NeonText>
                {players.length === 0 ? (
                    <NeonText style={styles.emptyText}>
                        No players added yet
                    </NeonText>
                ) : (
                    <FlatList
                        data={players}
                        keyExtractor={item => item.id}
                        renderItem={renderPlayer}
                        contentContainerStyle={styles.playersList}
                    />
                )}
            </View>

            <View style={styles.buttonContainer}>
                {players.length === 0 ? (
                    <NeonText size={14} color="#888" style={{ textAlign: 'center', marginBottom: 20 }}>
                        Add at least 1 player to continue
                    </NeonText>
                ) : players.length === 1 ? (
                    <>
                        <NeonText size={14} color={COLORS.limeGlow} style={{ textAlign: 'center', marginBottom: 10 }}>
                            🤖 Single Player Mode - Play against AI
                        </NeonText>
                        <NeonButton
                            title="PLAY VS AI"
                            onPress={startParty}
                            style={styles.startButton}
                        />
                    </>
                ) : (
                    <>
                        <NeonText size={14} color={COLORS.neonCyan} style={{ textAlign: 'center', marginBottom: 10 }}>
                            👥 Multiplayer Mode - {players.length} players
                        </NeonText>
                        <NeonButton
                            title="START PARTY"
                            onPress={startParty}
                            style={styles.startButton}
                        />
                    </>
                )}
            </View>
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    subtitle: {
        marginTop: 10,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
        padding: 15,
        fontSize: 16,
        color: COLORS.white,
    },
    addButton: {
        width: 80,
    },
    playersContainer: {
        flex: 1,
        marginBottom: 20,
    },
    playersTitle: {
        marginBottom: 15,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
        marginTop: 20,
    },
    playersList: {
        gap: 10,
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    startButton: {
        marginTop: 10,
    },
    genderContainer: {
        marginBottom: 15,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.electricPurple,
    },
    genderLabel: {
        marginBottom: 8,
        textAlign: 'center',
    },
    genderButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    genderButton: {
        flex: 1,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.white,
        alignItems: 'center',
        gap: 4,
    },
    genderButtonSelected: {
        borderColor: COLORS.limeGlow,
        borderWidth: 2,
        backgroundColor: 'rgba(198, 255, 74, 0.1)',
    },
    buttonContainer: {
        paddingBottom: 20,
        marginTop: 10,
    },
});

export default LocalPartySetupScreen;
