/**
 * Vehicle Status Badge — shows expiry/urgency for insurance, PUC, registration
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDaysUntilExpiry, formatExpiryDate } from '../utils/compliance';

interface Props {
  type: 'insurance' | 'puc' | 'registration';
  date: Date;
  compact?: boolean;
  showDot?: boolean;
}

export default function StatusBadge({ type, date, compact, showDot }: Props) {
  const daysLeft = getDaysUntilExpiry(date);
  const expired = daysLeft < 0;
  const urgent = !expired && daysLeft < 30;

  const label = type === 'insurance' ? 'INS' : type === 'puc' ? 'PUC' : 'REG';

  if (expired) {
    const bg = '#EF444418';
    const color = '#EF4444';
    if (compact) {
      return (
        <View style={[styles.compact, { backgroundColor: bg }]}>
          {showDot && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
          <Text style={[styles.compactText, { color }]}>{label}</Text>
          <Text style={[styles.compactDays, { color }]}>{Math.abs(daysLeft)}d</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        {showDot && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
        <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
        <Text style={[styles.badgeDays, { color }]}>{Math.abs(daysLeft)}d ago</Text>
      </View>
    );
  }

  if (urgent) {
    const bg = '#F59E0B15';
    const color = '#F59E0B';
    if (compact) {
      return (
        <View style={[styles.compact, { backgroundColor: bg }]}>
          {showDot && <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />}
          <Text style={[styles.compactText, { color }]}>{label}</Text>
          <Text style={[styles.compactDays, { color }]}>{daysLeft}d</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        {showDot && <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />}
        <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
        <Text style={[styles.badgeDays, { color }]}>{daysLeft} days</Text>
      </View>
    );
  }

  const bg = '#10B98115';
  const color = '#10B981';
  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: bg }]}>
        {showDot && <View style={[styles.dot, { backgroundColor: '#10B981' }]} />}
        <Text style={[styles.compactText, { color }]}>{label}</Text>
        <Text style={[styles.compactDays, { color }]}>{daysLeft}d</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {showDot && <View style={[styles.dot, { backgroundColor: '#10B981' }]} />}
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
      <Text style={[styles.badgeDays, { color }]}>{daysLeft} days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  badgeLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  badgeDays: { fontSize: 12, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  compact: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, gap: 3 },
  compactText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  compactDays: { fontSize: 10, fontWeight: '600' },
});
