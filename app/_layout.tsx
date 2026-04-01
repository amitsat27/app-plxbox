// 🌐 Root Layout - Expo Router Entry Point
// Wraps the entire app with providers and handles auth-based routing

import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
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
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenContent from '../components/ui/SplashScreen';

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
  const { user, loading, login } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [biometricLoading, setBiometricLoading] = useState(false);
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

  // Auto-login with biometric if enrolled and not logged in
  useEffect(() => {
    const attemptBiometricLogin = async () => {
      if (loading || user || biometricLoading || !appIsReady) return;

      const inAuthGroup = segments[0] === 'login';
      if (!inAuthGroup) return; // Only attempt on login screen

      // Quick check: is biometric even available on this platform?
      try {
        const hasHardware = await biometricAuth.isAvailable();
        if (!hasHardware) {
          console.log('🔐 Biometric hardware not available on this device');
          return;
        }
      } catch (e) {
        console.log('🔐 Biometric availability check error:', e);
        return; // Don't attempt if we can't even check
      }

      // Check if user has previously enrolled (stored credentials)
      try {
        const enrolled = await biometricAuth.isEnrolled();
        if (!enrolled) {
          console.log('🔐 Biometric not enrolled - skipping auto-login');
          return; // Don't attempt if no credentials stored
        }
      } catch (e) {
        console.log('🔐 Enrollment check failed:', e);
        return;
      }

      setBiometricLoading(true);

      // Add strict timeout - biometric auth should not block app startup
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Biometric timeout')), 3000); // 3 second timeout max
      });

      try {
        const credentials = await Promise.race([
          biometricAuth.authenticateAndLogin(),
          timeoutPromise,
        ] as const);

        if (credentials) {
          try {
            await login(credentials.email, credentials.password);
            // User will be redirected automatically by auth state change
          } catch (error) {
            console.log('🔐 Biometric login failed:', error);
            // Fall through to manual login
          }
        } else {
          console.log('🔐 No credentials from biometric auth');
        }
      } catch (error) {
        console.log('🔐 Biometric auth failed/timeout:', error);
        // Silently fall through - user can manually login
      } finally {
        setBiometricLoading(false);
      }
    };

    // Delay biometric attempt until after router is stable
    const timer = setTimeout(attemptBiometricLogin, 1000);
    return () => clearTimeout(timer);
  }, [loading, user, biometricLoading, segments, login, appIsReady]);

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
    if (appIsReady && !loading && !biometricLoading) {
      SplashScreen.hideAsync();
    }
  }, [user, loading, segments, router, appIsReady, biometricLoading]);

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
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
