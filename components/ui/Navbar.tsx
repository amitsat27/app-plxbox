// 🌌 Premium Navbar - Clean Design
// Features: Settings options visible below navbar

import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { useAuth } from "@/src/context/AuthContext";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import {
  LogOut,
  Menu as MenuIcon,
  Search,
  Settings,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NavbarProps {
  title?: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  userAvatar?: string;
  userName?: string;
}

/**
 * Clean navbar with settings options visible below
 */
export const Navbar: React.FC<NavbarProps> = ({
  title = "Pulsebox",
  onMenuPress,
  onSearchPress,
  userAvatar,
  userName = "User",
}) => {
  const { logout } = useAuth();
  const { theme, isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
    setShowSettings(false);
  };

  return (
    <View>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.navbarContainer,
            { backgroundColor: theme.surface.primary },
          ]}
        >
          {/* Navbar Content */}
          <View style={styles.content}>
            {/* Left Section: Menu + Title */}
            <View style={styles.leftSection}>
              {onMenuPress && (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={onMenuPress}
                  accessibilityLabel="Open menu"
                >
                  <View
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.surface.secondary },
                    ]}
                  >
                    <MenuIcon size={24} color={scheme.textPrimary} />
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.titleContainer}>
                <Text
                  style={[styles.appName, { color: scheme.textPrimary }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
            </View>

            {/* Right Section: Icons */}
            <View style={styles.rightSection}>
              {onSearchPress && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    { backgroundColor: theme.surface.secondary },
                  ]}
                  onPress={onSearchPress}
                  accessibilityLabel="Search"
                >
                  <Search size={22} color={scheme.textPrimary} />
                </TouchableOpacity>
              )}

              {/* Settings Button */}
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: theme.surface.secondary },
                ]}
                onPress={() => setShowSettings(!showSettings)}
                accessibilityLabel="Settings"
              >
                <Settings size={22} color={scheme.textPrimary} />
              </TouchableOpacity>

              {/* User Avatar */}
              <TouchableOpacity style={styles.userButton}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: theme.brand.primary },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Border */}
          <View
            style={[
              styles.divider,
              { borderBottomColor: theme.border.primary },
            ]}
          />
        </View>
      </SafeAreaView>

      {/* Settings Options Below */}
      {showSettings && (
        <View
          style={[
            styles.settingsDropdown,
            { backgroundColor: theme.surface.secondary },
          ]}
        >
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => {
              setShowSettings(false);
              // Navigate to profile
            }}
          >
            <User
              size={20}
              color={scheme.textPrimary}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionText, { color: scheme.textPrimary }]}>
              Profile
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.optionDivider,
              { backgroundColor: theme.border.primary },
            ]}
          />

          <TouchableOpacity
            style={styles.settingsOption}
            onPress={handleLogout}
          >
            <LogOut size={20} color={Colors.error} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: Colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  navbarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: "100%",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    minWidth: 0,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "800",
    letterSpacing: -0.3,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  userButton: {
    padding: 4,
    marginLeft: Spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  divider: {
    borderBottomWidth: 0.5,
    opacity: 0.3,
  },
  // Settings Dropdown Styles
  settingsDropdown: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
  },
  settingsOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    marginVertical: Spacing.xs,
  },
  optionIcon: {
    marginRight: Spacing.md,
  },
  optionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  optionDivider: {
    height: 0.5,
    marginVertical: Spacing.xs,
  },
});

export default Navbar;
