/**
 * Summary Stat Card — refreshed with cleaner layout, subtle background tint
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/themeProvider';
import { Car, CheckCircle, AlertTriangle, CalendarDays, type LucideIcon } from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  garage: Car,
  check: CheckCircle,
  alert: AlertTriangle,
  calendar: CalendarDays,
};

export default function SummaryCard({ label, value, icon, color, index = 0 }: {
  label: string; value: string; icon: string; color: string; index?: number;
}) {
  const { isDark } = useTheme();
  const translateY = useSharedValue(16);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(index * 70, withSpring(0, { damping: 22, stiffness: 180 }));
    opacity.value = withDelay(index * 70, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    Haptics.selectionAsync();
    scale.value = withSpring(0.95, { damping: 18 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18 });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const IconComponent = ICON_MAP[icon] || CalendarDays;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.card, {
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 6 },
          android: { elevation: 2 },
        }),
      }, animatedStyle, scaleStyle]}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}${isDark ? '20' : '12' }` }]}>
          <IconComponent size={16} color={color} />
        </View>
        <Text style={[styles.value, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    color: '#8B8B93',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
