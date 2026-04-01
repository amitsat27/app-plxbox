// 🌐 Root Layout - Expo Router Entry Point
// Wraps the entire app with providers and handles auth-based routing

import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
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
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenContent from '../components/ui/SplashScreen';
import { AlertTriangle } from 'lucide-react-native';

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

// Main layout with auth-based navigation and splash screen control
function MainLayout() {
  const { user, loading, login, initError } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // Prevent splash screen from auto-hiding
  useEffect(() => {
    async function prepare() {
      try {
        // Keep the native splash screen visible while we prepare
        await SplashScreen.preventAutoHideAsync();

        // Wait for Firebase to be ready (AuthContext handles this)
        // Additional delay for smooth visual effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        setAppIsReady(true);
      } catch (e) {
        console.warn('Splash screen preparation error:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);


  // Handle redirection based on auth state
  useEffect(() => {
    if (loading || !appIsReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Not authenticated and not on login → go to login
      // Use a small delay to ensure router is ready
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    } else if (user && inAuthGroup) {
      // Authenticated but on login → go to home
      setTimeout(() => {
        router.replace('/');
      }, 100);
    }

    // Hide splash screen with fade animation when everything is ready
    if (appIsReady && !loading) {
      SplashScreen.hideAsync();
    }
  }, [user, loading, segments, router, appIsReady]);

  // Show Firebase initialization error if present (after splash)
  if (initError && !loading && appIsReady) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.backgroundDark }]}>
        <View style={styles.errorContent}>
          <AlertTriangle size={64} color={Colors.error} />
          <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
            Initialization Failed
          </Text>
          <Text style={[styles.errorMessage, { color: Colors.textSecondary }]}>
            {initError.message || 'Failed to initialize Firebase. Please check your configuration and restart the app.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={() => {
              // Reload the app to retry initialization
              if (Platform.OS === 'web') {
                window.location.reload();
              } else {
                // In native, use expo-updates if available
                // For now, just show message
                Alert.alert('Restart Required', 'Please close and reopen the app.');
              }
            }}
          >
            <Text style={styles.retryButtonText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show custom splash content while app is preparing
  if (!appIsReady) {
    return <SplashScreenContent />;
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
