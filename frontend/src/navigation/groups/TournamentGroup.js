import React, { lazy } from 'react';
import { withSuspense } from '../NavigationUtils';

const TournamentSetupScreen = lazy(() => import('../../screens/TournamentSetupScreen'));
const TournamentLobbyScreen = lazy(() => import('../../screens/TournamentLobbyScreen'));
const TournamentResultsScreen = lazy(() => import('../../screens/TournamentResultsScreen'));

export const TournamentGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="TournamentSetup" component={withSuspense(TournamentSetupScreen)} />
        <Stack.Screen name="TournamentLobby" component={withSuspense(TournamentLobbyScreen)} />
        <Stack.Screen name="TournamentResults" component={withSuspense(TournamentResultsScreen)} />
    </Stack.Group>
);
