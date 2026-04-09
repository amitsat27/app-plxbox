/**
 * Smart Insight Card — refreshed with rounded corners and cleaner spacing
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/themeProvider';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  index: number;
}

export default function SmartInsightCard({ title, value, subtitle, icon, color, index }: Props) {
  const { isDark } = useTheme();
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 60, withSpring(0, { damping: 22, stiffness: 180 }));
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.card, {
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 4 },
          android: { elevation: 1 },
        }),
      }]}>
        {/* Left accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: color }]} />

        <View style={styles.content}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
              {icon}
            </View>
          </View>

          <Text style={[styles.value, { color }]} numberOfLines={1}>{value}</Text>

          <Text style={[styles.title, { color: isDark ? '#A1A1AA' : '#6B7280' }]} numberOfLines={1}>{title}</Text>

          {subtitle && (
            <Text style={[styles.subtitle, { color: isDark ? '#71717A' : '#9CA3AF' }]} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 160,
    marginRight: 10,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3.5,
  },
  content: { flex: 1, justifyContent: 'space-between', gap: 4 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: { fontSize: 10, fontWeight: '500', marginTop: 1 },
});
