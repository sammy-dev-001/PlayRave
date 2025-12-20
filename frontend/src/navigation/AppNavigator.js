import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import JoinScreen from '../screens/JoinScreen';
import GameSelectionScreen from '../screens/GameSelectionScreen';
import CustomQuestionsScreen from '../screens/CustomQuestionsScreen';
import LobbyScreen from '../screens/LobbyScreen';
import QuestionScreen from '../screens/QuestionScreen';
import ResultsScreen from '../screens/ResultsScreen';
import MythOrFactQuestionScreen from '../screens/MythOrFactQuestionScreen';
import MythOrFactResultsScreen from '../screens/MythOrFactResultsScreen';
import WhosMostLikelyQuestionScreen from '../screens/WhosMostLikelyQuestionScreen';
import WhosMostLikelyResultsScreen from '../screens/WhosMostLikelyResultsScreen';
import NeonTapGameScreen from '../screens/NeonTapGameScreen';
import NeonTapResultsScreen from '../screens/NeonTapResultsScreen';
import WordRushGameScreen from '../screens/WordRushGameScreen';
import WordRushResultsScreen from '../screens/WordRushResultsScreen';
import WordRushWinnerScreen from '../screens/WordRushWinnerScreen';
import LocalPartySetupScreen from '../screens/LocalPartySetupScreen';
import LocalGameSelectionScreen from '../screens/LocalGameSelectionScreen';
import TruthOrDareCategorySelectionScreen from '../screens/TruthOrDareCategorySelectionScreen';
import TruthOrDareGameScreen from '../screens/TruthOrDareGameScreen';
import OnlineTruthOrDareCategoryScreen from '../screens/OnlineTruthOrDareCategoryScreen';
import OnlineTruthOrDareGameScreen from '../screens/OnlineTruthOrDareGameScreen';
import WouldYouRatherScreen from '../screens/WouldYouRatherScreen';
import SpinTheBottleScreen from '../screens/SpinTheBottleScreen';
import WhotGameScreen from '../screens/WhotGameScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.deepNightBlack }
                }}
                initialRouteName="Home"
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Join" component={JoinScreen} />
                <Stack.Screen name="GameSelection" component={GameSelectionScreen} />
                <Stack.Screen name="CustomQuestions" component={CustomQuestionsScreen} />
                <Stack.Screen name="Lobby" component={LobbyScreen} />
                <Stack.Screen name="Question" component={QuestionScreen} />
                <Stack.Screen name="Results" component={ResultsScreen} />
                <Stack.Screen name="MythOrFactQuestion" component={MythOrFactQuestionScreen} />
                <Stack.Screen name="MythOrFactResults" component={MythOrFactResultsScreen} />
                <Stack.Screen name="WhosMostLikelyQuestion" component={WhosMostLikelyQuestionScreen} />
                <Stack.Screen name="WhosMostLikelyResults" component={WhosMostLikelyResultsScreen} />
                <Stack.Screen name="NeonTapGame" component={NeonTapGameScreen} />
                <Stack.Screen name="NeonTapResults" component={NeonTapResultsScreen} />
                <Stack.Screen name="WordRushGame" component={WordRushGameScreen} />
                <Stack.Screen name="WordRushResults" component={WordRushResultsScreen} />
                <Stack.Screen name="WordRushWinner" component={WordRushWinnerScreen} />
                <Stack.Screen name="LocalPartySetup" component={LocalPartySetupScreen} />
                <Stack.Screen name="LocalGameSelection" component={LocalGameSelectionScreen} />
                <Stack.Screen name="TruthOrDareCategorySelection" component={TruthOrDareCategorySelectionScreen} />
                <Stack.Screen name="TruthOrDareGame" component={TruthOrDareGameScreen} />
                <Stack.Screen name="OnlineTruthOrDareCategory" component={OnlineTruthOrDareCategoryScreen} />
                <Stack.Screen name="OnlineTruthOrDareGame" component={OnlineTruthOrDareGameScreen} />
                <Stack.Screen name="WouldYouRather" component={WouldYouRatherScreen} />
                <Stack.Screen name="SpinTheBottle" component={SpinTheBottleScreen} />
                <Stack.Screen name="WhotGame" component={WhotGameScreen} />
                <Stack.Screen name="Scoreboard" component={ScoreboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
