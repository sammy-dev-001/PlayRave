import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from '../context/GameContext';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ConnectionStatusOverlay from '../components/ConnectionStatusOverlay';
import { useTheme } from '../context/ThemeContext';

// Import Navigation Groups
import { MainGroup } from './groups/MainGroup';
import { AuthGroup } from './groups/AuthGroup';
import { LocalPlayGroup } from './groups/LocalPlayGroup';
import { OnlinePlayGroup } from './groups/OnlinePlayGroup';
import { TournamentGroup } from './groups/TournamentGroup';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { COLORS } = useTheme();
    return (
        <ErrorBoundary
            errorMessage="The app encountered an unexpected error. Please try again."
            showHomeButton={false}
        >
            <AuthProvider>
                <GameProvider>
                    <View style={{ flex: 1 }}>
                        <NavigationContainer>
                            <Stack.Navigator
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: COLORS.background }
                                }}
                                initialRouteName="Home"
                            >
                                {MainGroup(Stack)}
                                {AuthGroup(Stack)}
                                {LocalPlayGroup(Stack)}
                                {OnlinePlayGroup(Stack)}
                                {TournamentGroup(Stack)}
                            </Stack.Navigator>
                        </NavigationContainer>
                        <ConnectionStatusOverlay />
                    </View>
                </GameProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default AppNavigator;
