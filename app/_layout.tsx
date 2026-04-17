// Root Layout - Expo Router Entry Point
// Wraps the entire app with providers and handles auth-based routing

import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "../components/ErrorBoundary";
import { OfflineBanner } from "../components/OfflineBanner";
import SplashScreenContent from "../components/ui/SplashScreen";
import { Spacing, Typography, BorderRadius } from "../constants/designTokens";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { NetworkProvider } from "../src/context/NetworkContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { Colors } from "../theme/color";
import { ThemeProvider } from "../theme/themeProvider";

const getPaperTheme = (isDark: boolean) => ({
  ...MD3LightTheme,
  dark: isDark,
  roundness: 16,
  colors: {
    primary: Colors.primary,
    onPrimary: Colors.onPrimary,
    primaryContainer: Colors.primaryContainer,
    onPrimaryContainer: Colors.onPrimaryContainer,
    secondary: Colors.secondary,
    onSecondary: Colors.onSecondary,
    secondaryContainer: Colors.secondaryContainer,
    onSecondaryContainer: Colors.onSecondaryContainer,
    tertiary: Colors.tertiary,
    onTertiary: Colors.onTertiary,
    tertiaryContainer: Colors.tertiaryContainer,
    onTertiaryContainer: Colors.onTertiaryContainer,
    background: isDark ? Colors.backgroundDark : Colors.backgroundLight,
    surface: isDark ? Colors.surfaceDark : Colors.surfaceLight,
    surfaceVariant: isDark ? Colors.surfaceVariant : Colors.surfaceVariantLight,
    onSurface: isDark ? Colors.onSurfaceDark : Colors.onSurface,
    onSurfaceVariant: isDark ? Colors.onSurfaceVariantDark : Colors.onSurfaceVariant,
    surfaceDisabled: "rgba(124, 58, 237, 0.05)",
    onSurfaceDisabled: Colors.textDisabled,
    error: Colors.error,
    onError: Colors.onError,
    errorContainer: Colors.errorContainer,
    onErrorContainer: Colors.onErrorContainer,
    outline: isDark ? Colors.borderDark : Colors.border,
    outlineVariant: isDark ? "rgba(167, 139, 250, 0.3)" : "rgba(124, 58, 237, 0.15)",
    backdrop: isDark ? "rgba(10, 10, 20, 0.8)" : "rgba(248, 250, 252, 0.6)",
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

let splashPrevented = false;

async function tryPreventSplashHide() {
  if (splashPrevented) return;
  try {
    await SplashScreen.preventAutoHideAsync();
    splashPrevented = true;
  } catch (err: any) {
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
    if (!err.message?.includes('No native splash screen registered')) {
      console.warn('Hide splash error:', err.message);
    }
  }
}

function ErrorScreen({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.errorContainer, { backgroundColor: "#F8F9FC" }]}>
      <Animated.View
        style={[
          styles.errorCard,
          {
            backgroundColor: "#FFFFFF",
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.errorIconContainer, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
          <AlertTriangle size={48} color={Colors.error} strokeWidth={1.5} />
        </View>

        <Text style={[styles.errorTitle, { color: "#0F172A" }]}>
          Initialization Failed
        </Text>

        <Text style={[styles.errorMessage, { color: "#475569" }]}>
          {message || "Unable to connect to Firebase. Please check your internet connection and try again."}
        </Text>

        <View style={styles.errorActions}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.errorHint, { color: "#94A3B8" }]}>
          If the problem persists, restart the app or contact support.
        </Text>
      </Animated.View>

      <View style={styles.errorBrand}>
        <Text style={[styles.errorBrandText, { color: "#94A3B8" }]}>Powered by Pulsebox</Text>
      </View>
    </View>
  );
}

function MainLayout() {
  const { user, loading, initError } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await tryPreventSplashHide();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAppIsReady(true);
      } catch {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (loading || !appIsReady) return;

    const inAuthGroup = segments[0] === "login";

    if (!user && !inAuthGroup) {
      setTimeout(() => router.replace("/login"), 100);
    } else if (user && inAuthGroup) {
      setTimeout(() => router.replace("/"), 100);
    }

    if (appIsReady && !loading) {
      tryHideSplash();
    }
  }, [user, loading, segments, router, appIsReady]);

  if (initError && !loading && appIsReady) {
    return <ErrorScreen message={initError.message} />;
  }

  if (!appIsReady) {
    return <SplashScreenContent />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: "#F8F9FC",
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="settings" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="bills" options={{ presentation: "card" }} />
      <Stack.Screen name="category-screen" options={{ presentation: "card" }} />
      <Stack.Screen name="vehicles" options={{ presentation: "card" }} />
      <Stack.Screen name="appliances" options={{ presentation: "card" }} />
      <Stack.Screen name="appliance-detail" options={{ presentation: "card" }} />
      <Stack.Screen name="add-appliance" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-service-record" options={{ presentation: "card" }} />
      <Stack.Screen name="service-record-detail" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="manage-notifications" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="app-info" options={{ presentation: "card", headerShown: false }} />
      {__DEV__ && <Stack.Screen name="debug" options={{ headerShown: false }} />}
    </Stack>
  );
}

function ThemedApp({ children }: { children: React.ReactNode }) {
  const theme = getPaperTheme(false);

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        style="dark" 
        translucent
        backgroundColor="transparent"
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.card,
    padding: Spacing.xxl,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  errorIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  errorActions: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.button,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.md,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  errorHint: {
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
    lineHeight: 16,
  },
  errorBrand: {
    position: "absolute",
    bottom: Spacing.xxl,
  },
  errorBrandText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
  },
});
