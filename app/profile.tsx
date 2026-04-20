/**
 * Profile Screen - User profile management
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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { BlurView } from "expo-blur";
import { ChevronLeft, Mail, MapPin, Phone } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.darkBackground : "#F2F2F7" }]}>
      {/* Header */}
      <BlurView intensity={isDark ? 60 : 80} style={styles.headerBlur}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
            Profile
          </Text>
          <View style={styles.headerRight} />
        </View>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? Colors.darkCard : "#FFFFFF" }]}>
          <View style={[styles.avatarContainer, { backgroundColor: Colors.primary }]}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>
          <Text style={[styles.userName, { color: scheme.textPrimary }]}>
            {user?.displayName || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: scheme.textSecondary }]}>
            {user?.email || "No email"}
          </Text>
        </View>

        {/* Account Info */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={styles.infoRow}>
            <Mail size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
                {user?.email || "Not set"}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
                {user?.phoneNumber || "Not set"}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
          <View style={styles.infoRow}>
            <MapPin size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>Location</Text>
              <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>
                Pune, Maharashtra
              </Text>
            </View>
          </View>
        </View>

        {/* Account Stats */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: scheme.textSecondary }]}>Bills</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>3</Text>
              <Text style={[styles.statLabel, { color: scheme.textSecondary }]}>Vehicles</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>5</Text>
              <Text style={[styles.statLabel, { color: scheme.textSecondary }]}>Appliances</Text>
            </View>
          </View>
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
  profileCard: {
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
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
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
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: "500",
  },
  divider: {
    height: 0.5,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
  statDivider: {
    width: 0.5,
  },
});
