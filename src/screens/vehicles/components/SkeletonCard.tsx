/**
 * Skeleton Card — shimmer loading placeholder matching VehicleCard shape
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/themeProvider';

interface Props {
  count?: number;
}

export default function SkeletonCard({ count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonInner key={i} index={i} />
      ))}
    </>
  );
}

function SkeletonInner({ index }: { index: number }) {
  const { isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.4,
  }));

  const bg = isDark ? '#1C1C1E' : '#F2F2F7';
  const barBg = isDark ? '#2C2C2E' : '#E5E5EA';

  return (
    <Animated.View style={[styles.card, { backgroundColor: bg }, shimmerStyle, { transform: [{ translateY: index * 2 }] }]}>
      {/* Image placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: barBg, borderRadius: 16 }]} />

      {/* Title bar */}
      <View style={[styles.bar, { backgroundColor: barBg, width: '60%', borderRadius: 8 }]} />

      {/* Subtitle bar */}
      <View style={[styles.bar, { backgroundColor: barBg, width: '40%', borderRadius: 6 }]} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCircle, { backgroundColor: barBg, borderRadius: 12 }]} />
        <View style={[styles.statCircle, { backgroundColor: barBg, borderRadius: 12 }]} />
        <View style={[styles.statCircle, { backgroundColor: barBg, borderRadius: 12 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14, borderRadius: 20, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  imagePlaceholder: { width: '100%', height: 100 },
  bar: { height: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCircle: { width: 40, height: 24 },
});
