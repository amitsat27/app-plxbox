// 🌐 Root Layout - Expo Router Entry Point
// Wraps the entire app with providers and handles auth-based routing

import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { OfflineBanner } from '../components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { useEffect, useState } from 'react';
import { Spacing } from '../constants/designTokens';
import { Colors } from '../theme/color';
import { biometricAuth } from '../src/services/BiometricAuth';

// Theme configuration
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    accent: '#FF9500',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    error: '#FF3B30',
    text: '#1C1C1E',
  },
};

// Splash screen while checking auth
function SplashScreen() {
  return (
    <View style={[styles.splashContainer, { backgroundColor: Colors.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// Main layout with auth-based navigation
function MainLayout() {
  const { user, loading, login } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Auto-login with biometric if enrolled and not logged in
  useEffect(() => {
    const attemptBiometricLogin = async () => {
      if (loading || user || biometricLoading) return;

      const inAuthGroup = segments[0] === 'login';
      if (!inAuthGroup) return; // Only attempt on login screen

      const enrolled = await biometricAuth.isEnrolled();
      if (!enrolled) return;

      setBiometricLoading(true);
      const credentials = await biometricAuth.authenticateAndLogin();

      if (credentials) {
        try {
          await login(credentials.email, credentials.password);
          // User will be redirected automatically by auth state change
        } catch (error) {
          console.log('Biometric login failed:', error);
          // Stay on login screen, user can manually login
        }
      }
      setBiometricLoading(false);
    };

    // Small delay to allow UI to settle
    const timer = setTimeout(attemptBiometricLogin, 500);
    return () => clearTimeout(timer);
  }, [loading, user, biometricLoading, segments, login]);

  // Handle redirection based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Not authenticated and not on login → go to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Authenticated but on login → go to home
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  // Show splash while loading
  if (loading || biometricLoading) {
    return <SplashScreen />;
  }

  // Render the appropriate screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationProvider>
              <NetworkProvider>
                <OfflineBanner />
                <MainLayout />
              </NetworkProvider>
            </NotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
