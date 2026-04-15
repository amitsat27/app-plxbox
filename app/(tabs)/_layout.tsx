/**
 * Instagram-Inspired Tab Navigator
 * Clean, minimal, and intuitive design with smooth animations
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Grid3X3, Settings } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';

const ACTIVE_COLOR = '#7C3AED';
const INACTIVE_COLOR = '#9CA3AF';

export default function TabLayout() {
  const { isDark } = useTheme();

  const tabBarBg = isDark ? '#000000' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          height: Platform.OS === 'ios' ? 88 : 65,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Home size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Grid3X3 size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Settings size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
