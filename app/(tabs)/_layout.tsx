import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { Home, Compass, Settings, BarChart3, Zap, Droplet } from 'lucide-react-native';
import { Colors } from '@/theme/color';

export default function TabLayout() {
  const [index, setIndex] = React.useState(0);
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.glass,
          borderTopColor: Colors.textSecondary,
          borderTopWidth: 1,
          elevation: 8,
          paddingBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          tabBarLabel: 'Analytics',
        }}
      />
    </Tabs>
  );
}
