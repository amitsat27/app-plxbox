/**
 * Property Tax — BillAmountCard
 * Hero amount card with status pill for detail screen
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, Clock, AlertCircle, type LucideIcon } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

const STATUS_MAP: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: LucideIcon; text: string }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.12)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle, text: 'Paid' },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.12)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock, text: 'Pending' },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.12)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle, text: 'Overdue' },
};

export function BillAmountCard({ amount, billYear, payStatus }: {
  amount: number; billYear: string; payStatus: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const s = STATUS_MAP[payStatus] || STATUS_MAP.Pending;
  const StatusIcon = s.icon;

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 26, stiffness: 250, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <View style={[styles.statusPill, { backgroundColor: s.bgTint[isDark ? 'dark' : 'light'] }]}>
          <StatusIcon size={14} color={s.color} />
          <Text style={[styles.statusText, { color: s.color }]}>{s.text}</Text>
        </View>
        <Text style={[styles.amount, { color: scheme.textPrimary }]}>
          ₹{isFinite(amount) ? amount.toLocaleString('en-IN') : '—'}
        </Text>
        <Text style={[styles.year, { color: scheme.textSecondary }]}>FY {billYear}</Text>
      </View>
    </Animated.View>
  );
}

const BillAmountCardExport = BillAmountCard;
export default BillAmountCardExport;

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    borderRadius: BorderRadius.card,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.md,
  },
  statusText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  amount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
  },
  year: {
    fontSize: Typography.fontSize.xl,
    marginTop: Spacing.xs,
  },
});
