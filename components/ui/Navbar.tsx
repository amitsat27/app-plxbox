import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Bell, Search, Menu } from 'lucide-react-native';
import { Colors } from '../../theme/color';

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        {/* Left - Menu & Title */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <Menu size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
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

          <TouchableOpacity style={styles.userButton}>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navbar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  userButton: {
    padding: 4,
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
    fontSize: 16,
    fontWeight: '700',
  },
});
