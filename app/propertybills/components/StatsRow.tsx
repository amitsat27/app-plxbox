/**
 * Property Tax — StatsRow
 * Three animated stat cards showing total, paid, and pending amounts
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Receipt, CheckCircle2, Clock4 } from 'lucide-react-native';
import { Spacing } from '@/constants/designTokens';
import StatCard from './StatCard';

interface StatsData {
  total: number;
  paid: number;
  pending: number;
  paidAmt: number;
  billCount: number;
}

export function StatsRow({ stats }: { stats: StatsData }) {
  const pendingPct = stats.paid + stats.pending > 0
    ? Math.round((stats.pending / (stats.paid + stats.pending)) * 100)
    : 0;

  return (
    <View style={styles.row}>
      <StatCard
        label="Total Tax"
        value={`₹${stats.total.toLocaleString('en-IN')}`}
        sub={`${stats.billCount} bill${stats.billCount !== 1 ? 's' : ''}`}
        color="#7C3AED"
        icon={<Receipt size={14} color="#7C3AED" />}
        delay={0}
      />
      <StatCard
        label="Paid"
        value={`₹${stats.paidAmt.toLocaleString('en-IN')}`}
        sub={`${stats.paid} bill${stats.paid !== 1 ? 's' : ''}`}
        color="#10B981"
        icon={<CheckCircle2 size={14} color="#10B981" />}
        delay={80}
      />
      <StatCard
        label="Pending"
        value={`${stats.pending}`}
        sub={`${pendingPct}%`}
        color="#F59E0B"
        icon={<Clock4 size={14} color="#F59E0B" />}
        delay={160}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
