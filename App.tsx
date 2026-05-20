import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { Platform, UIManager, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as KeepAwake from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

LogBox.ignoreLogs(['new NativeEventEmitter', 'EventEmitter.removeListener']);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const onReady = useCallback(async () => {
    // Allow all orientations for keyboard support
    await ScreenOrientation.unlockAsync();
    // Keep screen on while using remote
    KeepAwake.activateKeepAwakeAsync();
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" translucent />
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
