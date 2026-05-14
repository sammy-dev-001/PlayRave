import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import ErrorToast from './src/components/ErrorToast';
import { ThemeProvider } from './src/context/ThemeContext';
import HapticService from './src/services/HapticService';
import SoundService from './src/services/SoundService';
import { register as registerServiceWorker } from './src/utils/serviceWorkerRegistration';

export default function App() {

  useEffect(() => {
    // Pre-warm the backend (wake up Render from sleep)
    const backendUrl = 'https://playrave-59ud.onrender.com/api/health';
    fetch(backendUrl).catch(() => {/* ignore errors, we just want to wake it up */});

    // Register service worker for offline support and auto-updates (web only)
    if (typeof window !== 'undefined' && !window.__EXPO_LOCAL_DEV__) {
      registerServiceWorker();
    }
    
    // Initialize services
    HapticService.init();
    SoundService.init();

    return () => SocketService.disconnect();
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
      <ErrorToast />
      <OfflineIndicator />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
