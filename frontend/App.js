import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import ErrorToast from './src/components/ErrorToast';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HapticService from './src/services/HapticService';
import SoundService from './src/services/SoundService';
import { register as registerServiceWorker } from './src/utils/serviceWorkerRegistration';
import { OTAUpdateManager } from './src/components/OTAUpdateManager';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignored in web
});

const AppContent = () => {
  const { isLoading } = useTheme();

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <OTAUpdateManager>
        <AppNavigator />
        <ErrorToast />
        <OfflineIndicator />
        <StatusBar style="light" />
      </OTAUpdateManager>
    </View>
  );
};

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
