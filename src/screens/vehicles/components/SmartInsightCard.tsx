/**
 * Smart Insight Card — premium metric card for horizontal scroll row
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/themeProvider';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  index: number;
}

export default function SmartInsightCard({ title, value, subtitle, icon, color, trend, index }: Props) {
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
        borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      }]}>
        {/* Left accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: color }]} />

        <View style={styles.content}>
          {/* Icon row */}
          <View style={styles.iconRow}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
              {icon}
            </View>
          </View>

          {/* Value */}
          <Text style={[styles.value, { color }]} numberOfLines={1}>{value}</Text>

          {/* Title */}
          <Text style={[styles.title, { color: isDark ? '#A1A1AA' : '#6B7280' }]} numberOfLines={1}>{title}</Text>

          {/* Subtitle */}
          {subtitle && (
            <Text style={[styles.subtitle, { color: isDark ? '#71717A' : '#9CA3AF' }]} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 170, marginRight: 12 },
  card: {
    padding: 14, borderRadius: 20, minHeight: 110,
    position: 'relative', overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  content: { flex: 1, justifyContent: 'space-between' },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 8 },
  title: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  subtitle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
});
