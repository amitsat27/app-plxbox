/**
 * App Info Screen - About the app
 */

import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { BlurView } from "expo-blur";
import { ChevronLeft, ExternalLink, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";

const APP_INFO = {
  name: "Pulsebox",
  version: "1.0.0",
  build: "15.04.2026",
  releaseDate: "April 15, 2026",
  description: "Your Life, Organized",
};

export default function AppInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const handleRateApp = () => {
    // Placeholder for app store link
    console.log("Rate app");
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL("https://pulsebox.app/privacy");
  };

  const handleTermsOfService = () => {
    Linking.openURL("https://pulsebox.app/terms");
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.darkBackground : "#F2F2F7" }]}>
      {/* Header */}
      <BlurView intensity={isDark ? 60 : 80} style={styles.headerBlur}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
            About
          </Text>
          <View style={styles.headerRight} />
        </View>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo */}
        <View style={[styles.logoCard, { backgroundColor: isDark ? Colors.darkCard : "#FFFFFF" }]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: scheme.textPrimary }]}>
            {APP_INFO.name}
          </Text>
          <Text style={[styles.appTagline, { color: scheme.textSecondary }]}>
            {APP_INFO.description}
          </Text>
        </View>

        {/* Version Info */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
              {APP_INFO.version}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
              {APP_INFO.build}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Release Date</Text>
            <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
              {APP_INFO.releaseDate}
            </Text>
          </View>
        </View>

        {/* Legal Links */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <TouchableOpacity style={styles.linkRow} onPress={handlePrivacyPolicy}>
            <Text style={[styles.linkText, { color: scheme.textPrimary }]}>Privacy Policy</Text>
            
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
          <TouchableOpacity style={styles.linkRow} onPress={handleTermsOfService}>
            <Text style={[styles.linkText, { color: scheme.textPrimary }]}>Terms of Service</Text>
            
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
        </View>

        {/* Credits */}
        <View style={styles.creditsContainer}>
          <Text style={[styles.creditsText, { color: scheme.textTertiary }]}>
            Made with <Heart size={14} color={Colors.error} fill={Colors.error} /> in India
          </Text>
          <Text style={[styles.creditsText, { color: scheme.textTertiary }]}>
            Made by Amit
          </Text>

          <Text style={[styles.copyrightText, { color: scheme.textTertiary }]}>
            © 2026 Pulsebox. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  headerBlur: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  logoCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.card,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  appLogo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  appTagline: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  infoLabel: {
    fontSize: Typography.fontSize.md,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: "500",
  },
  divider: {
    height: 0.5,
    marginLeft: Spacing.lg,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  linkText: {
    fontSize: Typography.fontSize.md,
    fontWeight: "500",
  },
  creditsContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  creditsText: {
    fontSize: Typography.fontSize.sm,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  copyrightText: {
    fontSize: Typography.fontSize.xs,
  },
});
