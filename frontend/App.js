import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import SocketService from './src/services/socket';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {

  useEffect(() => {
    SocketService.connect();
    return () => SocketService.disconnect();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}
