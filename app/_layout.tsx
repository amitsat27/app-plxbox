import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ActivityIndicator, View } from 'react-native';
import { initializeBackendService } from '../src/services/BackendService';
import { billAlertsService } from '../src/services/BillAlertsService';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

// Initialize backend service on app startup
initializeBackendService();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',
    secondary: '#6366F1',
    tertiary: '#10B981',
    error: '#EF4444',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
  },
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if the user is currently trying to access a screen in the (tabs) folder
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      // If NOT logged in and trying to access the dashboard, redirect to login
      router.replace('/login');
    } else if (user && segments[0] === 'login') {
      // If IS logged in and trying to access the login page, redirect to dashboard
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}