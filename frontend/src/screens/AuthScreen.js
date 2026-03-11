import React, { useEffect } from 'react';
import { View } from 'react-native';

// Auth screen disabled - immediately redirect back to Home
// This ensures old cached code that navigates to 'Auth' just bounces back
const AuthScreen = ({ navigation }) => {
    useEffect(() => {
        console.log('[AUTH SCREEN] Redirecting back to Home (auth screen disabled)');
        navigation.replace('Home');
    }, [navigation]);

    return <View style={{ flex: 1, backgroundColor: '#0a0a1a' }} />;
};

export default AuthScreen;
