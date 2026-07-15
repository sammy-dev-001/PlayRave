import React from 'react';
import LocalPartySetupScreen from '../../screens/LocalPartySetupScreen';
import LocalGameSelectionScreen from '../../screens/LocalGameSelectionScreen';

import LocalCharadesScreen from '../../screens/LocalCharadesScreen';
import LocalTriviaScreen from '../../screens/LocalTriviaScreen';
import LocalTicTacToeScreen from '../../screens/LocalTicTacToeScreen';
import LANModeScreen from '../../screens/LANModeScreen';

export const LocalPlayGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="LocalPartySetup" component={LocalPartySetupScreen} />
        <Stack.Screen name="LocalGameSelection" component={LocalGameSelectionScreen} />
        <Stack.Screen name="LocalCharades" component={LocalCharadesScreen} />
        <Stack.Screen name="LocalTrivia" component={LocalTriviaScreen} />
        <Stack.Screen name="LocalTicTacToe" component={LocalTicTacToeScreen} />
        <Stack.Screen name="LANMode" component={LANModeScreen} />
    </Stack.Group>
);
