// 📱 Main Tab Navigator - iOS 17 Style
// Production-ready tab bar with smooth animations and badges

import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Spacing, Typography, BorderRadius } from '../../constants/designTokens';
import { Colors } from '@/theme/color';
import { useAuthStore } from '../../src/stores/authStore';
import { useUIStore, useTheme } from '../../src/stores/uiStore';
import { Home } from 'lucide-react-native';
import { Badge } from '../../components/ui/atoms/Badge';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme, isDarkMode } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { currentTab, setCurrentTab } = useUIStore();

  const isDark = colorScheme === 'dark' || (theme === 'auto' && isDarkMode);

  // Single Home tab
  const tabs = [
    {
      name: 'index',
      label: 'Home',
      icon: Home,
      badge: 0,
    },
  ];

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        // Tab bar styling - iOS 17
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? Colors.textTertiaryDark : Colors.textTertiary,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarStyle: {
          backgroundColor: isDark ? Colors.surfaceDark + 'E6' : Colors.glass,
          borderTopColor: isDark ? Colors.borderDark : Colors.border,
          borderTopWidth: 0.5,
          height: Spacing.tabBarHeight,
          paddingBottom: Spacing.safeAreaBottom,
          paddingTop: Spacing.sm,
          // iOS blur effect
          ...Platform.select({
            ios: {
              backdropFilter: 'blur(20px)',
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.85)'
                : 'rgba(255, 255, 255, 0.85)',
            },
            android: {
              backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
          letterSpacing: 0.3,
          textTransform: 'capitalize',
        },
        headerShown: false,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.name;

        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.label,
              tabBarIcon: ({ color, size }) => (
                <View style={styles.tabIconContainer}>
                  <Icon
                    size={isActive ? size + 2 : size}
                    color={color}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {tab.badge > 0 && (
                    <View style={styles.tabBadgeContainer}>
                      <Badge
                        count={tab.badge > 99 ? 99 : tab.badge}
                        size="sm"
                        style={styles.tabBadge}
                      />
                    </View>
                  )}
                </View>
              ),
              tabBarButton: (props) => {
                const { accessibilityState, delayLongPress, ...rest } = props;
                const isFocused = accessibilityState?.selected;

                // Filter out null values from rest to avoid type errors
                const filteredRest = Object.entries(rest).reduce((acc, [key, value]) => {
                  if (value !== null) {
                    acc[key] = value;
                  }
                  return acc;
                }, {} as any);

                return (
                  <TouchableOpacity
                    {...filteredRest}
                    onPress={() => setCurrentTab(tab.name)}
                    style={[
                      styles.tabButton,
                      isFocused && styles.tabButtonActive,
                    ]}
                  >
                    {props.children}
                  </TouchableOpacity>
                );
              },
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  tabBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    zIndex: 1,
  },
  tabBadge: {
    transform: [{ scale: 0.85 }],
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabButtonActive: {
    // Active state styling if needed
  },
});

export { TabLayout };
