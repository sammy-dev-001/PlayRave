import React from 'react';

import TournamentSetupScreen from '../../screens/TournamentSetupScreen';
import TournamentLobbyScreen from '../../screens/TournamentLobbyScreen';
import TournamentResultsScreen from '../../screens/TournamentResultsScreen';

export const TournamentGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="TournamentSetup" component={TournamentSetupScreen} />
        <Stack.Screen name="TournamentLobby" component={TournamentLobbyScreen} />
        <Stack.Screen name="TournamentResults" component={TournamentResultsScreen} />
    </Stack.Group>
);
