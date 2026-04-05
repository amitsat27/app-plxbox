/**
 * Summary Stat Card for the Vehicles dashboard
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@/theme/themeProvider';

const ICONS: Record<string, string> = { garage: '🚗', check: '✅', alert: '⚠️', calendar: '📅' };

export default function SummaryCard({ label, value, icon, color, index = 0 }: { label: string; value: string; icon: string; color: string; index?: number }) {
  const { isDark } = useTheme();
  const slideY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY: slideY }], opacity }}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
          <Text style={{ fontSize: 18 }}>{ICONS[icon] || '📋'}</Text>
        </View>
        <Text style={[styles.value, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10,
    borderRadius: 20, gap: 6,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  label: { fontSize: 10, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});
