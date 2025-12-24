import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert
} from 'react-native';
import NeonContainer from '../components/NeonContainer';
import NeonText from '../components/NeonText';
import NeonButton from '../components/NeonButton';
import SocketService from '../services/socket';
import { COLORS } from '../constants/theme';

// Default team colors
const TEAM_COLORS = [
    { name: 'Neon Blue', color: '#00f0ff', darkColor: '#003d45' },
    { name: 'Hot Pink', color: '#ff3fa4', darkColor: '#450030' },
    { name: 'Lime Green', color: '#c6ff4a', darkColor: '#324010' },
    { name: 'Electric Purple', color: '#b14eff', darkColor: '#2d1045' },
];

// Default team names
const DEFAULT_TEAM_NAMES = [
    'Team Alpha',
    'Team Omega',
    'Team Phoenix',
    'Team Thunder'
];

const TeamSetupScreen = ({ route, navigation }) => {
    const { room, playerName } = route.params;
    const [teams, setTeams] = useState([
        { id: 1, name: DEFAULT_TEAM_NAMES[0], color: TEAM_COLORS[0], players: [] },
        { id: 2, name: DEFAULT_TEAM_NAMES[1], color: TEAM_COLORS[1], players: [] },
    ]);
    const [numTeams, setNumTeams] = useState(2);
    const [assignmentMethod, setAssignmentMethod] = useState('manual'); // 'manual', 'random', 'captains'
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const currentPlayerId = SocketService.socket?.id;
    const currentPlayer = room.players.find(p => p.id === currentPlayerId);
    const isHost = currentPlayer?.isHost || false;

    // Players not yet assigned to teams
    const unassignedPlayers = room.players.filter(
        player => !teams.some(team => team.players.some(p => p.id === player.id))
    );

    useEffect(() => {
        // Listen for team updates from server
        const onTeamsUpdated = (updatedTeams) => {
            setTeams(updatedTeams);
        };

        const onGameStarted = (data) => {
            // Navigate to game with team data
            navigation.navigate('Lobby', {
                ...route.params,
                teams: data.teams
            });
        };

        SocketService.on('teams-updated', onTeamsUpdated);
        SocketService.on('team-game-started', onGameStarted);

        return () => {
            SocketService.off('teams-updated', onTeamsUpdated);
            SocketService.off('team-game-started', onGameStarted);
        };
    }, [navigation, route.params]);

    const handleAddTeam = () => {
        if (teams.length >= 4) {
            Alert.alert('Max Teams', 'You can have a maximum of 4 teams');
            return;
        }
        const newTeamId = teams.length + 1;
        setTeams([...teams, {
            id: newTeamId,
            name: DEFAULT_TEAM_NAMES[newTeamId - 1] || `Team ${newTeamId}`,
            color: TEAM_COLORS[newTeamId - 1] || TEAM_COLORS[0],
            players: []
        }]);
        setNumTeams(numTeams + 1);
    };

    const handleRemoveTeam = (teamId) => {
        if (teams.length <= 2) {
            Alert.alert('Min Teams', 'You need at least 2 teams');
            return;
        }
        // Move players from removed team back to unassigned
        setTeams(teams.filter(t => t.id !== teamId));
        setNumTeams(numTeams - 1);
    };

    const handleAssignPlayer = (playerId, teamId) => {
        setTeams(teams.map(team => {
            // Remove player from all teams first
            const filteredPlayers = team.players.filter(p => p.id !== playerId);
            // Add to target team
            if (team.id === teamId) {
                const player = room.players.find(p => p.id === playerId);
                return { ...team, players: [...filteredPlayers, player] };
            }
            return { ...team, players: filteredPlayers };
        }));

        // Emit update to server
        SocketService.emit('assign-player-team', {
            roomId: room.id,
            playerId,
            teamId
        });
    };

    const handleUnassignPlayer = (playerId) => {
        setTeams(teams.map(team => ({
            ...team,
            players: team.players.filter(p => p.id !== playerId)
        })));
    };

    const handleRandomizeTeams = () => {
        const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
        const newTeams = teams.map(team => ({ ...team, players: [] }));

        shuffledPlayers.forEach((player, index) => {
            const teamIndex = index % newTeams.length;
            newTeams[teamIndex].players.push(player);
        });

        setTeams(newTeams);

        // Emit to server
        SocketService.emit('set-teams', {
            roomId: room.id,
            teams: newTeams
        });
    };

    const handleTeamNameEdit = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        setEditingTeamId(teamId);
        setEditingName(team.name);
    };

    const handleSaveTeamName = () => {
        if (editingTeamId) {
            setTeams(teams.map(team =>
                team.id === editingTeamId
                    ? { ...team, name: editingName.trim() || team.name }
                    : team
            ));
            setEditingTeamId(null);
            setEditingName('');
        }
    };

    const handleStartTeamGame = () => {
        // Validate all players are assigned
        if (unassignedPlayers.length > 0) {
            Alert.alert(
                'Unassigned Players',
                `${unassignedPlayers.length} players are not assigned to a team. Randomize or assign manually.`,
                [
                    { text: 'Randomize', onPress: handleRandomizeTeams },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            return;
        }

        // Validate teams have players
        const emptyTeams = teams.filter(t => t.players.length === 0);
        if (emptyTeams.length > 0) {
            Alert.alert('Empty Teams', 'All teams need at least one player');
            return;
        }

        // Navigate back to lobby with team data
        SocketService.emit('set-teams', {
            roomId: room.id,
            teams
        });

        navigation.navigate('Lobby', {
            ...route.params,
            teams,
            isTeamMode: true
        });
    };

    const renderUnassignedPlayer = ({ item }) => (
        <View style={styles.unassignedPlayer}>
            <NeonText size={16}>{item.name}</NeonText>
            <View style={styles.teamButtons}>
                {teams.map(team => (
                    <TouchableOpacity
                        key={team.id}
                        style={[styles.assignBtn, { backgroundColor: team.color.color }]}
                        onPress={() => handleAssignPlayer(item.id, team.id)}
                    >
                        <NeonText size={12} color="#000">{team.id}</NeonText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderTeam = ({ item: team }) => (
        <View style={[styles.teamCard, { borderColor: team.color.color }]}>
            <View style={[styles.teamHeader, { backgroundColor: team.color.darkColor }]}>
                {editingTeamId === team.id ? (
                    <View style={styles.editingRow}>
                        <TextInput
                            style={styles.teamNameInput}
                            value={editingName}
                            onChangeText={setEditingName}
                            autoFocus
                            maxLength={20}
                        />
                        <TouchableOpacity onPress={handleSaveTeamName}>
                            <NeonText size={18} color={COLORS.limeGlow}>✓</NeonText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => isHost && handleTeamNameEdit(team.id)}>
                        <NeonText size={18} weight="bold" color={team.color.color}>
                            {team.name} ✏️
                        </NeonText>
                    </TouchableOpacity>
                )}
                <NeonText size={12} color="#888">
                    {team.players.length} players
                </NeonText>
            </View>

            <View style={styles.teamPlayers}>
                {team.players.map(player => (
                    <View key={player.id} style={styles.teamPlayer}>
                        <NeonText size={14}>{player.name}</NeonText>
                        {isHost && (
                            <TouchableOpacity onPress={() => handleUnassignPlayer(player.id)}>
                                <NeonText size={16} color={COLORS.hotPink}>✕</NeonText>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                {team.players.length === 0 && (
                    <NeonText size={12} color="#555" style={styles.emptyTeam}>
                        No players yet
                    </NeonText>
                )}
            </View>
        </View>
    );

    return (
        <NeonContainer showBackButton>
            <View style={styles.header}>
                <NeonText size={28} weight="bold" glow>
                    TEAM SETUP
                </NeonText>
                <NeonText size={14} color="#888" style={styles.subtitle}>
                    Divide players into teams for battle!
                </NeonText>
            </View>

            {/* Teams List */}
            <FlatList
                data={teams}
                keyExtractor={item => String(item.id)}
                renderItem={renderTeam}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.teamsList}
            />

            {isHost && (
                <View style={styles.teamControls}>
                    <NeonButton
                        title="+ ADD TEAM"
                        onPress={handleAddTeam}
                        variant="secondary"
                        style={styles.controlBtn}
                    />
                    <NeonButton
                        title="🎲 RANDOMIZE"
                        onPress={handleRandomizeTeams}
                        variant="secondary"
                        style={styles.controlBtn}
                    />
                </View>
            )}

            {/* Unassigned Players */}
            {unassignedPlayers.length > 0 && (
                <View style={styles.unassignedSection}>
                    <NeonText size={16} style={styles.sectionTitle}>
                        UNASSIGNED PLAYERS ({unassignedPlayers.length})
                    </NeonText>
                    <FlatList
                        data={unassignedPlayers}
                        keyExtractor={item => item.id}
                        renderItem={renderUnassignedPlayer}
                    />
                </View>
            )}

            {isHost && (
                <NeonButton
                    title="START TEAM GAME"
                    onPress={handleStartTeamGame}
                    style={styles.startButton}
                />
            )}

            {!isHost && (
                <NeonText style={styles.waiting}>
                    Waiting for host to assign teams...
                </NeonText>
            )}
        </NeonContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    subtitle: {
        marginTop: 10,
    },
    teamsList: {
        paddingVertical: 10,
        gap: 15,
    },
    teamCard: {
        width: 180,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
        overflow: 'hidden',
        marginRight: 15,
    },
    teamHeader: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teamNameInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        padding: 5,
        borderRadius: 4,
        minWidth: 100,
    },
    teamPlayers: {
        padding: 10,
        minHeight: 100,
    },
    teamPlayer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        marginBottom: 5,
    },
    emptyTeam: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
    },
    teamControls: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 15,
    },
    controlBtn: {
        flex: 1,
    },
    unassignedSection: {
        flex: 1,
        marginTop: 10,
    },
    sectionTitle: {
        marginBottom: 10,
        textAlign: 'center',
    },
    unassignedPlayer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(177, 78, 255, 0.3)',
    },
    teamButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    assignBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButton: {
        marginTop: 15,
    },
    waiting: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#888',
        marginTop: 20,
    }
});

export default TeamSetupScreen;
