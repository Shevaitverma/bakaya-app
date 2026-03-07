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
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { Theme } from './constants/theme';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for configured duration
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
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
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
