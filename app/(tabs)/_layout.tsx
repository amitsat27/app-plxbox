/**
 * Main Tab Navigator — compact layout, labels on single line
 */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Spacing, BorderRadius } from '../../constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import { Home, Settings as SettingsIcon, Grid3X3 } from 'lucide-react-native';

function TabIcon({
  focused,
  icon: Icon,
  label,
}: {
  focused: boolean;
  icon: typeof Home;
  label: string;
}) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {focused && (
        <View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: isDark
                ? 'rgba(167,139,250,0.22)'
                : 'rgba(124,58,237,0.16)',
            },
          ]}
        />
      )}
      <Icon
        size={20}
        color={
          focused
            ? isDark
              ? '#C4B5FD'
              : '#7C3AED'
            : isDark
            ? '#64748B'
            : '#94A3B8'
        }
        strokeWidth={2}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused
              ? isDark
                ? '#C4B5FD'
                : '#7C3AED'
              : isDark
              ? '#64748B'
              : '#94A3B8',
            fontWeight: focused ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: Spacing.lg,
          right: Spacing.lg,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
          backgroundColor: isDark
            ? 'rgba(15,23,42,0.88)'
            : 'rgba(255,255,255,0.85)',
          borderTopWidth: 0,
          borderRadius: BorderRadius.xxl,
          paddingHorizontal: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 20,
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            },
            android: { elevation: 12 },
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={Home} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={Grid3X3} label="Sections" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={SettingsIcon} label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 36,
    height: 3,
    borderRadius: 1.5,
  },
  label: {
    fontSize: 9.5,
    marginTop: 3,
    letterSpacing: 0.1,
  },
});
