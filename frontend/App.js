import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
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
    <>
      <AppNavigator />
      <OfflineIndicator />
      <StatusBar style="light" />
    </>
  );
}
