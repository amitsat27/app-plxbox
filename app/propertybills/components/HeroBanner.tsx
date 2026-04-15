/**
 * Property Tax — HeroBanner (No Images)
 * Gradient hero card with title and quick stats
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { Home, TrendingUp, CheckCircle2, Clock } from 'lucide-react-native';

interface Stats {
  total: number;
  paid: number;
  pending: number;
  paidAmt: number;
  billCount: number;
}

function HeroBanner({ stats, selectedCity }: { stats: Stats | null; selectedCity?: string }) {
  const { isDark } = useTheme();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const slideY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, [fade, scale, slideY]);

  const bgFrom = isDark ? '#2D1B69' : '#EDE9FE';
  const bgTo = isDark ? '#1C1B4B' : '#DDD6FE';

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ scale }, { translateY: slideY }],
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
      }}
    >
      <View style={[styles.card, {
        backgroundColor: bgFrom,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }]}>
        {/* Subtle gradient overlay */}
        <View style={[styles.overlay, { backgroundColor: bgTo, opacity: 0.3 }]} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.15)' }]}>
              <Home size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: isDark ? '#EDE9FE' : '#1E1B4B' }]}>
                {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Property Tax'}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Track and manage your property tax bills
              </Text>
            </View>
          </View>

          {stats && stats.billCount > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statChip, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
              }]}>
                <TrendingUp size={12} color={isDark ? '#A78BFA' : '#7C3AED'} />
                <Text style={[styles.statChipText, { color: isDark ? '#C4B5FD' : '#1E1B4B' }]}>
                  {stats.billCount} bill{stats.billCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[styles.statChip, {
                backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)',
              }]}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={[styles.statChipText, { color: '#10B981' }]}>{stats.paid} paid</Text>
              </View>
              <View style={[styles.statChip, {
                backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)',
              }]}>
                <Clock size={12} color="#F59E0B" />
                <Text style={[styles.statChipText, { color: '#F59E0B' }]}>{stats.pending} pending</Text>
              </View>
            </View>
          )}

          {!stats && (
            <Text style={[styles.subtitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
              Select a city to view property taxes
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    minHeight: 140,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  statChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});

export default HeroBanner;
