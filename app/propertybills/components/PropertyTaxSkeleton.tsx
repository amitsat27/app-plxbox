/**
 * Property Tax — Skeleton Loader
 * Realistic placeholders for the new layout:
 * hero banner, stats row, and bill cards
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Spacing, BorderRadius } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';

const screenWidth = Dimensions.get('window').width;

function ShimmerBlock({ width, height, borderRadius, delay = 0, style }: {
  width: number; height: number; borderRadius?: number; delay?: number;
  style?: any;
}) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PropertyTaxSkeleton({ count = 3 }: { count?: number }) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Hero banner skeleton */}
      <View style={[styles.hero, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderRadius: BorderRadius.xl }]}>
        {/* Large image placeholder */}
        <ShimmerBlock
          width={screenWidth - Spacing.lg * 2}
          height={150}
          borderRadius={0}
          style={{ backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }}
        />
        {/* Hero bottom overlay */}
        <View style={styles.heroBottom}>
          <ShimmerBlock width={120} height={10} borderRadius={4} delay={50} />
          <ShimmerBlock width={200} height={16} borderRadius={6} delay={100} />
        </View>
      </View>

      {/* Stats row skeleton */}
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <ShimmerBlock width={30} height={30} borderRadius={10} delay={i * 100} />
            <ShimmerBlock width={50} height={20} borderRadius={6} delay={i * 100 + 50} style={{ marginTop: 8 }} />
            <ShimmerBlock width={40} height={12} borderRadius={4} delay={i * 100 + 100} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Bill card skeletons */}
      {Array.from({ length: count }).map((_, i) => {
        const cardWidth = screenWidth - Spacing.lg * 2;
        return (
          <View
            key={i}
            style={{
              borderRadius: BorderRadius.xl,
              marginBottom: Spacing.md,
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {/* Image area */}
            <ShimmerBlock
              width={cardWidth}
              height={120}
              borderRadius={0}
              delay={i * 120}
              style={{ backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }}
            />

            {/* Content area */}
            <View style={styles.cardContent}>
              {/* Top row: year + amount */}
              <View style={styles.cardTopRow}>
                <View style={{ gap: 6 }}>
                  <ShimmerBlock width={72} height={10} borderRadius={4} delay={i * 120 + 50} />
                  <ShimmerBlock width={50} height={22} borderRadius={6} delay={i * 120 + 100} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <ShimmerBlock width={60} height={18} borderRadius={6} delay={i * 120 + 150} />
                  <ShimmerBlock width={44} height={8} borderRadius={4} delay={i * 120 + 200} />
                </View>
              </View>

              {/* Separator */}
              <View style={[styles.separator, { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} />

              {/* Bottom row */}
              <View style={styles.cardBottomRow}>
                <ShimmerBlock width={100} height={12} borderRadius={4} delay={i * 120 + 250} />
                <ShimmerBlock width={32} height={12} borderRadius={4} delay={i * 120 + 300} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    width: '100%',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  heroBottom: {
    padding: Spacing.md,
    gap: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md - 2,
    borderWidth: 1,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  cardContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  separator: {
    height: 1,
    marginVertical: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
