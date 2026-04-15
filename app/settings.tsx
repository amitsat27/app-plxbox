/**
 * 🎨 Settings Screen - iOS 18 Design System
 * Theme switching, user preferences, and app info
 * Senior iOS Design patterns applied with Advanced Theme System
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { useAuth } from "@/src/context/AuthContext";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Bell, BellOff, ChevronLeft, LogOut, Monitor, Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

type ThemeMode = "light" | "dark" | "auto";

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  value?: string | number;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  rightIcon?: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  const { theme, isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          {
            backgroundColor: theme.surface.primary,
            borderColor: theme.border.primary,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  sublabel,
  value,
  onPress,
  toggle = false,
  toggleValue = false,
  onToggle,
  rightIcon,
}) => {
  const { theme } = useTheme();
  const scheme = getColorScheme(theme === undefined);

  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.surface.primary,
          borderBottomColor: theme.border.secondary,
        },
      ]}
      onPress={onPress}
      disabled={toggle}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: theme.text.primary }]}>
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.sublabel, { color: theme.text.tertiary }]}>
              {sublabel}
            </Text>
          )}
        </View>
      </View>

      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{
            false: theme.border.secondary,
            true: theme.brand.primary,
          }}
          thumbColor={theme.surface.primary}
        />
      ) : (
        <View style={styles.rightContent}>
          {value && (
            <Text style={[styles.value, { color: theme.text.tertiary }]}>
              {value}
            </Text>
          )}
          {rightIcon || (
            <ChevronLeft
              size={20}
              color={theme.text.tertiary}
              style={{ transform: [{ rotateZ: "180deg" }] }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, loading } = useAuth();
  const { theme, mode, setMode, isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(mode);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Notification settings
  const [notifyBills, setNotifyBills] = useState(true);
  const [notifyDue, setNotifyDue] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifySound, setNotifySound] = useState(true);

  // Load notification settings from storage
  useEffect(() => {
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
      const settings = {
        notifyBills,
        notifyDue,
        notifyReminders,
        notifySound,
        [key]: value,
      };
      await AsyncStorage.setItem("notification_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const handleNotifyBillsChange = async (value: boolean) => {
    setNotifyBills(value);
    await saveNotificationSettings("notifyBills", value);
  };

  const handleNotifyDueChange = async (value: boolean) => {
    setNotifyDue(value);
    await saveNotificationSettings("notifyDue", value);
  };

  const handleNotifyRemindersChange = async (value: boolean) => {
    setNotifyReminders(value);
    await saveNotificationSettings("notifyReminders", value);
  };

  const handleNotifySoundChange = async (value: boolean) => {
    setNotifySound(value);
    await saveNotificationSettings("notifySound", value);
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

  const handleThemeChange = async (newMode: ThemeMode) => {
    try {
      setSelectedTheme(newMode);
      await setMode(newMode);
    } catch (error) {
      console.error("Failed to change theme:", error);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: 0,
          backgroundColor: theme.surface.primary,
        },
      ]}
      edges={["left", "right", "bottom"]}
    >
      {/* Header */}
      <BlurView intensity={isDark ? 40 : 20} style={styles.headerBlur}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.border.primary,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Settings
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </BlurView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Section */}
        <SettingSection title="APPEARANCE">
          <View style={styles.themeContainer}>
            {[
              {
                mode: "light" as ThemeMode,
                label: "Light",
                icon: <Sun size={24} color={theme.brand.primary} />,
              },
              {
                mode: "auto" as ThemeMode,
                label: "Auto",
                icon: <Monitor size={24} color={theme.brand.primary} />,
              },
              {
                mode: "dark" as ThemeMode,
                label: "Dark",
                icon: <Moon size={24} color={theme.brand.primary} />,
              },
            ].map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      selectedTheme === option.mode
                        ? theme.brand.primary
                        : isDark
                          ? theme.surface.secondary
                          : theme.surface.tertiary,
                    borderColor:
                      selectedTheme === option.mode
                        ? theme.brand.primary
                        : theme.border.primary,
                  },
                ]}
                onPress={() => handleThemeChange(option.mode)}
              >
                <View style={styles.themeIconContainer}>{option.icon}</View>
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color:
                        selectedTheme === option.mode
                          ? theme.text.contrast
                          : theme.text.primary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingSection>

        {/* Display Settings */}
        <SettingSection title="DISPLAY">
          <SettingRow
            icon={<Sun size={20} color={theme.brand.primary} />}
            label="Brightness"
            sublabel="Automatic brightness adjustment"
            value="On"
            onPress={() => {}}
          />
          <SettingRow label="Text Size" sublabel="Default" />
          <SettingRow
            label="Reduce Motion"
            toggle
            toggleValue={false}
            onToggle={() => {}}
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection title="NOTIFICATIONS">
          <SettingRow
            icon={<Bell size={20} color={theme.brand.primary} />}
            label="Bill Reminders"
            sublabel="Get notified about upcoming bills"
            toggle
            toggleValue={notifyBills}
            onToggle={(value) => {
              if (value) requestNotificationPermissions();
              handleNotifyBillsChange(value);
            }}
          />
          <SettingRow
            icon={<BellOff size={20} color={theme.brand.primary} />}
            label="Due Date Alerts"
            sublabel="Alerts for overdue payments"
            toggle
            toggleValue={notifyDue}
            onToggle={(value) => {
              if (value) requestNotificationPermissions();
              handleNotifyDueChange(value);
            }}
          />
          <SettingRow
            icon={<Bell size={20} color={theme.brand.primary} />}
            label="Payment Reminders"
            sublabel="Reminders before payment due"
            toggle
            toggleValue={notifyReminders}
            onToggle={(value) => {
              if (value) requestNotificationPermissions();
              handleNotifyRemindersChange(value);
            }}
          />
          <SettingRow
            icon={<Bell size={20} color={theme.brand.primary} />}
            label="Sound"
            sublabel="Play sound with notifications"
            toggle
            toggleValue={notifySound}
            onToggle={handleNotifySoundChange}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="ABOUT">
          <SettingRow label="App Version" value="1.0.0" />
          <SettingRow label="Build" value="2026.04.03" />
          <SettingRow label="Device ID" value="PBX-****" />
        </SettingSection>

        {/* Account Section */}
        <SettingSection title="ACCOUNT">
          <SettingRow
            icon={<LogOut size={20} color={theme.semantic.error} />}
            label="Logout"
            sublabel="Sign out from your account"
            onPress={handleLogout}
          />
        </SettingSection>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            PulseBox © 2026{"\n"}All rights reserved
          </Text>
        </View>
      </ScrollView>

      {/* Logout Loading */}
      {loggingOut && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContent,
              {
                backgroundColor: theme.surface.primary,
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.brand.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.text.primary, marginTop: Spacing.md },
              ]}
            >
              Logging out...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    width: "100%",
    borderBottomWidth: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowViolet,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  sublabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "400",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "400",
  },
  themeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  themeOption: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeIconContainer: {
    marginBottom: Spacing.sm,
  },
  themeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  footerInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    borderRadius: BorderRadius.card,
    padding: Spacing.xxl,
    alignItems: "center",
    minWidth: 120,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
});
