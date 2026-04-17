/**
 * Settings Tab Screen - Premium iOS-Native Design
 * Theme switching, user preferences, and app info
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Bell,
    BellOff,
    BellRing,
    ChevronRight,
    Info,
    LogOut,
    Settings,
} from "lucide-react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

// ============================================================================
// Reusable Components
// ============================================================================

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.sectionWrapper}>
      {title && (
        <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
          },
        ]}
      >
        {React.Children.map(children, (child, index) => (
          <>
            {index > 0 && (
              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(60,60,67,0.08)" },
                ]}
              />
            )}
            {child}
          </>
        ))}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Navigation Row (icon + label + optional sublabel + chevron)
// ---------------------------------------------------------------------------
interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

const NavRow: React.FC<NavRowProps> = ({
  icon,
  label,
  sublabel,
  value,
  trailing,
  onPress,
  destructive,
}) => {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <TouchableOpacity
      style={styles.navRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.5 : 1}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark
              ? "rgba(124, 58, 237, 0.2)"
              : "rgba(124, 58, 237, 0.1)",
          },
        ]}
      >
        {icon}
      </View>
      <View style={styles.rowContent}>
        <View style={styles.labelWrapper}>
          <Text
            style={[
              styles.label,
              { color: destructive ? Colors.error : scheme.textPrimary },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              style={[styles.sublabel, { color: scheme.textTertiary }]}
              numberOfLines={1}
            >
              {sublabel}
            </Text>
          )}
        </View>
      </View>
      {value && (
        <Text style={[styles.valueText, { color: scheme.textTertiary }]}>
          {value}
        </Text>
      )}
      {trailing || (
        <ChevronRight
          size={18}
          color={isDark ? "rgba(255,255,255,0.25)" : "rgba(60,60,67,0.3)"}
        />
      )}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Toggle Row (icon + label + native switch)
// ---------------------------------------------------------------------------
interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  icon,
  label,
  value,
  onValueChange,
}) => {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.navRow, styles.toggleRow]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark
              ? "rgba(124, 58, 237, 0.2)"
              : "rgba(124, 58, 237, 0.1)",
          },
        ]}
      >
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.label, { color: scheme.textPrimary }]}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: isDark ? "#39393D" : "#E9E9EB",
          true: "#34C759",
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={isDark ? "#39393D" : "#E9E9EB"}
      />
    </View>
  );
};

// ============================================================================
// Settings Screen Component
// ============================================================================

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Notification settings
  const [notifyBills, setNotifyBills] = useState(true);
  const [notifyDue, setNotifyDue] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifySound, setNotifySound] = useState(true);

  // Load notification settings
  React.useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotifyBills(parsed.notifyBills ?? true);
        setNotifyDue(parsed.notifyDue ?? true);
        setNotifyReminders(parsed.notifyReminders ?? true);
        setNotifySound(parsed.notifySound ?? true);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const saveNotificationSettings = async (key: string, value: boolean) => {
    try {
      const currentSettings = {
        notifyBills,
        notifyDue,
        notifyReminders,
        notifySound,
      };
      const settings = {
        ...currentSettings,
        [key]: value,
      };
      await AsyncStorage.setItem("notification_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Please enable notifications in your device settings to receive alerts."
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#F2F2F7" }]}>
      {/* Header */}
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? "dark" : "light"}
        style={[styles.headerBlur, { paddingTop: insets.top }]}
      >
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
          Settings
        </Text>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
            },
          ]}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: Colors.primary },
            ]}
          >
            <Text style={styles.profileAvatarText}>
              {user?.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: scheme.textPrimary }]}>
              {user?.displayName || "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: scheme.textTertiary }]}>
              {user?.email || "Tap to set up profile"}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color={isDark ? "rgba(255,255,255,0.25)" : "rgba(60,60,67,0.3)"}
          />
        </TouchableOpacity>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <ToggleRow
            icon={<Bell size={20} color={Colors.primary} />}
            label="Bill Reminders"
            value={notifyBills}
            onValueChange={(value) => {
              if (value) requestNotificationPermissions();
              setNotifyBills(value);
              saveNotificationSettings("notifyBills", value);
            }}
          />
          <ToggleRow
            icon={<BellOff size={20} color={Colors.primary} />}
            label="Due Date Alerts"
            value={notifyDue}
            onValueChange={(value) => {
              if (value) requestNotificationPermissions();
              setNotifyDue(value);
              saveNotificationSettings("notifyDue", value);
            }}
          />
          <ToggleRow
            icon={<Bell size={20} color={Colors.primary} />}
            label="Payment Reminders"
            value={notifyReminders}
            onValueChange={(value) => {
              if (value) requestNotificationPermissions();
              setNotifyReminders(value);
              saveNotificationSettings("notifyReminders", value);
            }}
          />
          <ToggleRow
            icon={<Bell size={20} color={Colors.primary} />}
            label="Sound"
            value={notifySound}
            onValueChange={(value) => {
              setNotifySound(value);
              saveNotificationSettings("notifySound", value);
            }}
          />
          <NavRow
            icon={<BellRing size={20} color={Colors.primary} />}
            label="Manage Notifications"
            onPress={() => router.push("/manage-notifications")}
          />
        </Section>

        {/* App Info */}
        <Section title="ABOUT">
          <NavRow
            icon={<Info size={20} color={Colors.primary} />}
            label="App Info"
            value="1.0.0"
            onPress={() => router.push("/app-info")}
          />
        </Section>

        {/* Logout */}
        <View style={styles.sectionWrapper}>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
              },
            ]}
          >
            <NavRow
              icon={<LogOut size={20} color={Colors.error} />}
              label="Logout"
              destructive
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: scheme.textTertiary }]}>
          PulseBox v1.0.0 {"\n"}Made with {"\u2665"} in India{"\n"}
          {"\u00A9"} 2026 Pulsebox. All rights reserved.
        </Text>
      </ScrollView>

      {/* Logout Loading Overlay */}
      {loggingOut && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF" }]}>
            <Text style={[styles.loadingText, { color: scheme.textPrimary }]}>
              Logging out...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  headerBlur: {
    width: "100%",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },

  // --- Profile Card ---
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: Typography.fontSize.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: Typography.fontSize.xs,
  },

  // --- Section ---
  sectionWrapper: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionCard: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },

  // --- Row ---
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  toggleRow: {
    justifyContent: "space-between",
  },
  rowDivider: {
    height: 0.5,
    marginLeft: Spacing.lg + 28 + Spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  labelWrapper: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: "500",
  },
  sublabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  valueText: {
    fontSize: Typography.fontSize.sm,
    marginRight: Spacing.xs,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: Spacing.xs,
  },

  // --- Theme Selector ---
  themeContainer: {
    padding: Spacing.md,
  },
  themeSelector: {
    flexDirection: "row",
    borderRadius: BorderRadius.card,
    padding: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  themeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },

  // --- Footer ---
  footer: {
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  // --- Loading Overlay ---
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
});
