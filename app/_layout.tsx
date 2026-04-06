// 🌐 Root Layout - Expo Router Entry Point
// Wraps the entire app with providers and handles auth-based routing

import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AlertTriangle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "../components/ErrorBoundary";
import { OfflineBanner } from "../components/OfflineBanner";
import SplashScreenContent from "../components/ui/SplashScreen";
import { Spacing } from "../constants/designTokens";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { NetworkProvider } from "../src/context/NetworkContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { useUIStore } from "../src/stores/uiStore";
import { Colors } from "../theme/color";
import { ThemeProvider } from "../theme/themeProvider";

// 🌌 Cosmic Sunset Theme - Premium 2025 Design
// Dynamic theme that switches between light/dark with gorgeous gradients

const getPaperTheme = (isDark: boolean) => ({
  ...MD3LightTheme,
  dark: isDark,
  roundness: 16,
  colors: {
    // Primary brand colors
    primary: Colors.primary,
    onPrimary: Colors.onPrimary,
    primaryContainer: Colors.primaryContainer,
    onPrimaryContainer: Colors.onPrimaryContainer,

    // Secondary
    secondary: Colors.secondary,
    onSecondary: Colors.onSecondary,
    secondaryContainer: Colors.secondaryContainer,
    onSecondaryContainer: Colors.onSecondaryContainer,

    // Tertiary accent
    tertiary: Colors.tertiary,
    onTertiary: Colors.onTertiary,
    tertiaryContainer: Colors.tertiaryContainer,
    onTertiaryContainer: Colors.onTertiaryContainer,

    // Surface & background (glass-ready)
    background: isDark ? Colors.backgroundDark : Colors.backgroundLight,
    surface: isDark ? Colors.surfaceDark : Colors.surfaceLight,
    surfaceVariant: isDark ? Colors.surfaceVariant : Colors.surfaceVariantLight,
    onSurface: isDark ? Colors.onSurfaceDark : Colors.onSurface,
    onSurfaceVariant: isDark
      ? Colors.onSurfaceVariantDark
      : Colors.onSurfaceVariant,
    surfaceDisabled: "rgba(124, 58, 237, 0.05)",
    onSurfaceDisabled: Colors.textDisabled,

    // Error
    error: Colors.error,
    onError: Colors.onError,
    errorContainer: Colors.errorContainer,
    onErrorContainer: Colors.onErrorContainer,

    // Text hierarchy (ensuring high contrast)
    outline: isDark ? Colors.borderDark : Colors.border,
    outlineVariant: isDark
      ? "rgba(167, 139, 250, 0.3)"
      : "rgba(124, 58, 237, 0.15)",

    // Backdrop for modals
    backdrop: isDark ? "rgba(10, 10, 20, 0.8)" : "rgba(248, 250, 252, 0.6)",

    // Elevated surfaces (app bars, cards)
    elevation: {
      level0: isDark ? Colors.surfaceDark : Colors.surfaceLight,
      level1: isDark ? "rgba(30, 30, 60, 0.8)" : "rgba(255, 255, 255, 0.8)",
      level2: isDark ? "rgba(40, 40, 80, 0.85)" : "rgba(255, 255, 255, 0.85)",
      level3: isDark ? "rgba(50, 50, 100, 0.9)" : "rgba(255, 255, 255, 0.9)",
      level4: isDark ? "rgba(60, 60, 120, 0.95)" : "rgba(255, 255, 255, 0.95)",
      level5: isDark ? "rgba(70, 70, 140, 1.0)" : "rgba(255, 255, 255, 1.0)",
    },
  },
});

// Track whether we successfully prevented the native splash
// In dev builds without native splash config, preventAutoHideAsync throws
let splashPrevented = false;

async function tryPreventSplashHide() {
  if (splashPrevented) return;
  try {
    await SplashScreen.preventAutoHideAsync();
    splashPrevented = true;
  } catch (err: any) {
    // In dev builds on iOS without expo-splash-screen native module registered,
    // this throws "No native splash screen registered". Safe to ignore.
    if (!err.message?.includes('No native splash screen registered')) {
      console.warn('Splash screen error:', err.message);
    }
  }
}

async function tryHideSplash() {
  if (!splashPrevented) return;
  try {
    await SplashScreen.hideAsync();
    splashPrevented = false;
  } catch (err: any) {
    // Silently suppress if native splash was never registered
    if (!err.message?.includes('No native splash screen registered')) {
      console.warn('Hide splash error:', err.message);
    }
  }
}

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
        await tryPreventSplashHide();

        // Wait for Firebase to be ready (AuthContext handles this)
        // Additional delay for smooth visual effect
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setAppIsReady(true);
      } catch {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Handle redirection based on auth state
  useEffect(() => {
    if (loading || !appIsReady) return;

    const inAuthGroup = segments[0] === "login";

    if (!user && !inAuthGroup) {
      // Not authenticated and not on login → go to login
      // Use a small delay to ensure router is ready
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    } else if (user && inAuthGroup) {
      // Authenticated but on login → go to home
      setTimeout(() => {
        router.replace("/");
      }, 100);
    }

    // Hide splash screen with fade animation when everything is ready
    if (appIsReady && !loading) {
      tryHideSplash();
    }
  }, [user, loading, segments, router, appIsReady]);

  // Show Firebase initialization error if present (after splash)
  if (initError && !loading && appIsReady) {
    return (
      <View
        style={[styles.container, { backgroundColor: Colors.backgroundDark }]}
      >
        <View style={styles.errorContent}>
          <AlertTriangle size={64} color={Colors.error} />
          <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
            Initialization Failed
          </Text>
          <Text style={[styles.errorMessage, { color: Colors.textSecondary }]}>
            {initError.message ||
              "Failed to initialize Firebase. Please check your configuration and restart the app."}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={() => {
              // Reload the app to retry initialization
              if (Platform.OS === "web") {
                window.location.reload();
              } else {
                // In native, use expo-updates if available
                // For now, just show message
                Alert.alert(
                  "Restart Required",
                  "Please close and reopen the app.",
                );
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
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen name="bills" options={{ presentation: "card" }} />
      <Stack.Screen name="category-screen" options={{ presentation: "card" }} />
      <Stack.Screen name="vehicles" options={{ presentation: "card" }} />
      <Stack.Screen name="appliances" options={{ presentation: "card" }} />
      <Stack.Screen name="appliance-detail" options={{ presentation: "card" }} />
      <Stack.Screen name="add-appliance" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-service-record" options={{ presentation: "card" }} />
      <Stack.Screen name="service-record-detail" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="reports" options={{ presentation: "card" }} />
      <Stack.Screen name="bill-detail" options={{ presentation: "card" }} />
      <Stack.Screen name="wifibills/WifiBillDetailScreen" options={{ presentation: "card", headerShown: false }} />
      {__DEV__ && (
        <Stack.Screen name="debug" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

//Dynamic wrapper that connects theme to UI store
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useUIStore();
  const theme = getPaperTheme(isDarkMode);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {children}
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemedApp>
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
        </ThemedApp>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
