import React, { lazy } from 'react';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import { withSuspense } from '../NavigationUtils';

const LeaderboardScreen = lazy(() => import('../../screens/LeaderboardScreen'));
const MyPacksScreen = lazy(() => import('../../screens/MyPacksScreen'));
const CommunityPacksScreen = lazy(() => import('../../screens/CommunityPacksScreen'));
const CustomPackEditorScreen = lazy(() => import('../../screens/CustomPackEditorScreen'));
const ChallengesScreen = lazy(() => import('../../screens/ChallengesScreen'));
const WhispersHubScreen = lazy(() => import('../../screens/WhispersHubScreen'));
const TriviaHubScreen = lazy(() => import('../../screens/TriviaHubScreen'));
const SettingsScreen = lazy(() => import('../../screens/SettingsScreen'));

export const MainGroup = (Stack) => (
    <Stack.Group>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={withSuspense(SettingsScreen)} />
        <Stack.Screen name="Leaderboard" component={withSuspense(LeaderboardScreen)} />
        <Stack.Screen name="MyPacks" component={withSuspense(MyPacksScreen)} />
        <Stack.Screen name="CommunityPacks" component={withSuspense(CommunityPacksScreen)} />
        <Stack.Screen name="CustomPackEditor" component={withSuspense(CustomPackEditorScreen)} />
        <Stack.Screen name="Challenges" component={withSuspense(ChallengesScreen)} />
        <Stack.Screen name="WhispersHub" component={withSuspense(WhispersHubScreen)} />
        <Stack.Screen name="TriviaHub" component={withSuspense(TriviaHubScreen)} />
    </Stack.Group>
);
