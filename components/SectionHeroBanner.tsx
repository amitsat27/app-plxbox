/**
 * Section Hero Banner
 * Gradient hero card with title and quick stats - reusable across all sections
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Spacing, Typography } from '@/constants/designTokens';
import { Colors } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';

interface SectionStats {
  total?: number;
  paid?: number;
  pending?: number;
  overdue?: number;
  billCount?: number;
  active?: number;
}

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  stats?: SectionStats | null;
  icon: React.ReactNode;
  color?: string;
  countLabel?: string;
}

export default function SectionHeroBanner({ title, subtitle, stats, icon, color = Colors.primary, countLabel }: HeroBannerProps) {
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
  const textColor = isDark ? '#EDE9FE' : '#1E1B4B';
  const subColor = isDark ? '#94A3B8' : '#64748B';

  const countValue = stats?.billCount ?? stats?.total ?? 0;
  const itemLabel = countLabel ?? 'bill';

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
        <View style={[styles.overlay, { backgroundColor: bgTo, opacity: 0.3 }]} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.15)' }]}>
              {icon}
            </View>
            <View>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text>
            </View>
          </View>

          {stats && countValue > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statChip, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
              }]}>
                <TrendingUp size={12} color={color} />
                <Text style={[styles.statChipText, { color: textColor }]}>
                  {countValue} {itemLabel}{countValue !== 1 ? 's' : ''}
                </Text>
              </View>

              {stats.paid !== undefined && stats.paid > 0 && (
                <View style={[styles.statChip, {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)',
                }]}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={[styles.statChipText, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                    {stats.paid} paid
                  </Text>
                </View>
              )}

              {stats.pending !== undefined && stats.pending > 0 && (
                <View style={[styles.statChip, {
                  backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)',
                }]}>
                  <Clock size={12} color="#F59E0B" />
                  <Text style={[styles.statChipText, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                    {stats.pending} pending
                  </Text>
                </View>
              )}

              {stats.overdue !== undefined && stats.overdue > 0 && (
                <View style={[styles.statChip, {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.12)',
                }]}>
                  <AlertCircle size={12} color="#EF4444" />
                  <Text style={[styles.statChipText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                    {stats.overdue} overdue
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});