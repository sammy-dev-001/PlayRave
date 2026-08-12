import React from 'react';
import LocalPartySetupScreen from '../../screens/LocalPartySetupScreen';
import LocalGameSelectionScreen from '../../screens/LocalGameSelectionScreen';

import LocalCharadesScreen from '../../screens/LocalCharadesScreen';
import LocalTriviaScreen from '../../screens/LocalTriviaScreen';
import LocalTicTacToeScreen from '../../screens/LocalTicTacToeScreen';
import LANModeScreen from '../../screens/LANModeScreen';
import WhotAIDifficultyScreen from '../../screens/WhotAIDifficultyScreen';
import WhotVsAIScreen from '../../screens/WhotVsAIScreen';
import ConnectFourDifficultyScreen from '../../screens/ConnectFourDifficultyScreen';
import ConnectFourScreen from '../../screens/ConnectFourScreen';
import CheckersDifficultyScreen from '../../screens/CheckersDifficultyScreen';
import CheckersVsAIScreen from '../../screens/CheckersVsAIScreen';
import LudoDifficultyScreen from '../../screens/LudoDifficultyScreen';
import LudoVsAIScreen from '../../screens/LudoVsAIScreen';

export const LocalPlayGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="LocalPartySetup" component={LocalPartySetupScreen} />
        <Stack.Screen name="LocalGameSelection" component={LocalGameSelectionScreen} />
        <Stack.Screen name="LocalCharades" component={LocalCharadesScreen} />
        <Stack.Screen name="LocalTrivia" component={LocalTriviaScreen} />
        <Stack.Screen name="LocalTicTacToe" component={LocalTicTacToeScreen} />
        <Stack.Screen name="LANMode" component={LANModeScreen} />
        <Stack.Screen name="WhotAIDifficulty" component={WhotAIDifficultyScreen} />
        <Stack.Screen name="WhotVsAI" component={WhotVsAIScreen} />
        <Stack.Screen name="ConnectFourDifficulty" component={ConnectFourDifficultyScreen} />
        <Stack.Screen name="ConnectFour" component={ConnectFourScreen} />
        <Stack.Screen name="CheckersDifficulty" component={CheckersDifficultyScreen} />
        <Stack.Screen name="CheckersVsAI" component={CheckersVsAIScreen} />
        <Stack.Screen name="LudoDifficulty" component={LudoDifficultyScreen} />
        <Stack.Screen name="LudoVsAI" component={LudoVsAIScreen} />
    </Stack.Group>
);
