/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from './lib/queryClient';
import { asyncStoragePersister } from './lib/persister';
import { useAppStateRefresh } from './hooks/useAppStateRefresh';
import { useOnlineManager } from './hooks/useOnlineManager';
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { Theme } from './constants/theme';

function AppContent() {
  // Wire up TanStack Query with React Native AppState + network
  useAppStateRefresh();
  useOnlineManager();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, Theme.splashScreen.duration);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashLogoText}>{Theme.splashScreen.logoText}</Text>
      </View>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Theme.colors.splashBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoText: {
    fontSize: Theme.typography.fontSize.display,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.textOnPrimary,
    letterSpacing: 2,
  },
});

export default App;
