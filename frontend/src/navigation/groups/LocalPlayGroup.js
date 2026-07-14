import React, { lazy } from 'react';
import LocalPartySetupScreen from '../../screens/LocalPartySetupScreen';
import LocalGameSelectionScreen from '../../screens/LocalGameSelectionScreen';
import { withSuspense, withSuspenseAndBoundary } from '../NavigationUtils';

const LocalCharadesScreen = lazy(() => import('../../screens/LocalCharadesScreen'));
const LocalTriviaScreen = lazy(() => import('../../screens/LocalTriviaScreen'));
const LocalTicTacToeScreen = lazy(() => import('../../screens/LocalTicTacToeScreen'));
const LANModeScreen = lazy(() => import('../../screens/LANModeScreen'));

export const LocalPlayGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="LocalPartySetup" component={LocalPartySetupScreen} />
        <Stack.Screen name="LocalGameSelection" component={LocalGameSelectionScreen} />
        <Stack.Screen name="LocalCharades" component={withSuspenseAndBoundary(LocalCharadesScreen)} />
        <Stack.Screen name="LocalTrivia" component={withSuspenseAndBoundary(LocalTriviaScreen)} />
        <Stack.Screen name="LocalTicTacToe" component={withSuspenseAndBoundary(LocalTicTacToeScreen)} />
        <Stack.Screen name="LANMode" component={withSuspense(LANModeScreen)} />
    </Stack.Group>
);
