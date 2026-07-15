import React from 'react';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';

import LeaderboardScreen from '../../screens/LeaderboardScreen';
import MyPacksScreen from '../../screens/MyPacksScreen';
import CommunityPacksScreen from '../../screens/CommunityPacksScreen';
import CustomPackEditorScreen from '../../screens/CustomPackEditorScreen';
import ChallengesScreen from '../../screens/ChallengesScreen';
import WhispersHubScreen from '../../screens/WhispersHubScreen';
import TriviaHubScreen from '../../screens/TriviaHubScreen';
import SettingsScreen from '../../screens/SettingsScreen';

export const MainGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="MyPacks" component={MyPacksScreen} />
        <Stack.Screen name="CommunityPacks" component={CommunityPacksScreen} />
        <Stack.Screen name="CustomPackEditor" component={CustomPackEditorScreen} />
        <Stack.Screen name="Challenges" component={ChallengesScreen} />
        <Stack.Screen name="WhispersHub" component={WhispersHubScreen} />
        <Stack.Screen name="TriviaHub" component={TriviaHubScreen} />
    </Stack.Group>
);
