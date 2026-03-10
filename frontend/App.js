import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Bug 7
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import ErrorToast from './src/components/ErrorToast';
import { ThemeProvider } from './src/context/ThemeContext';
import { register as registerServiceWorker } from './src/utils/serviceWorkerRegistration';

export default function App() {

  useEffect(() => {
    SocketService.connect();

    // Register service worker for offline support (web only)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    return () => SocketService.disconnect();
  }, []);

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
