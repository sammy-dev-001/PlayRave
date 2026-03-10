import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Bug 7
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import ErrorToast from './src/components/ErrorToast';
import { ThemeProvider } from './src/context/ThemeContext';
import { register as registerServiceWorker } from './src/utils/serviceWorkerRegistration';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...Feather.font,
    ...MaterialCommunityIcons.font
  });

  useEffect(() => {
    SocketService.connect();

    // Register service worker for offline support (web only)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    return () => SocketService.disconnect();
  }, []);

  if (!fontsLoaded && !fontError) {
    // Show nothing (or a splash screen/loader) while fonts are still downloading successfully
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Loading PlayRave...</Text>
      </View>
    );
  }

  // If there's a timeout or fontError, Vercel will trigger this instead of crashing completely.
  if (fontError) {
    console.warn('Font load failed, proceeding with system fallback fonts:', fontError);
  }

  return (
    // Bug 7: SafeAreaProvider must wrap the entire app so useSafeAreaInsets()
    // works in any component, giving us real device inset values at runtime.
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
        <ErrorToast />
        <OfflineIndicator />
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
