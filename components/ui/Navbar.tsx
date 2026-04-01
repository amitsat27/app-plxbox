import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Menu } from 'react-native-paper';
import { Bell, Search, Menu as MenuIcon, LogOut, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../theme/color';
import { Spacing, Typography } from '../../constants/designTokens';
import { useAuth } from '../../src/context/AuthContext';
import { useUIStore } from '../../src/stores/uiStore';

interface NavbarProps {
  title?: string;
  showSearch?: boolean;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  userAvatar?: string;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = 'Pulsebox',
  showSearch = true,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  notificationCount = 0,
  userAvatar,
  userName = 'User',
}) => {
  const { logout } = useAuth();
  const { isDarkMode } = useUIStore();
  const isDark = isDarkMode;
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
    setUserMenuVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.navbar}>
        {/* Left - Menu & Title */}
        <View style={styles.leftSection}>
          {onMenuPress && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMenuPress}
            >
              <MenuIcon size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.appName}>{title}</Text>
        </View>

        {/* Right - Icons */}
        <View style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSearchPress}
            >
              <Search size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Bell size={22} color={Colors.textPrimary} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* User Avatar with Menu */}
          <Menu
            visible={userMenuVisible}
            onDismiss={() => setUserMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.userButton}
                onPress={() => setUserMenuVisible(true)}
              >
                {userAvatar ? (
                  <Image
                    source={{ uri: userAvatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setUserMenuVisible(false);
                // Navigate to profile screen ( TODO )
              }}
              title="Profile"
              leadingIcon={() => <User size={20} color={Colors.textSecondary} />}
            />
            <Menu.Item
              onPress={handleLogout}
              title="Logout"
              leadingIcon={() => <LogOut size={20} color={Colors.danger} />}
            />
          </Menu>
        </View>
      </BlurView>
    </SafeAreaView>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  safeArea: {
    // backgroundColor will be set dynamically via BlurView
  },
  navbar: {
    height: 60,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  appName: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  notificationButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: Typography.presets.caption2.fontSize,
    fontWeight: '700',
  },
  userButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
});
