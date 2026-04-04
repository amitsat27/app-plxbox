import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { formatINR } from './utils';
import { Package, CheckCircle, IndianRupee, AlertTriangle } from 'lucide-react-native';

interface Props {
  stats: {
    total: number;
    active: number;
    totalCost: number;
    attentionCount: number;
  };
}

const statColors = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B'] as const;

export default function ApplianceSummaryCard({ stats }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const items = [
    { icon: Package, label: 'Total', value: String(stats.total), color: statColors[0] },
    { icon: CheckCircle, label: 'Active', value: String(stats.active), color: statColors[1] },
    { icon: IndianRupee, label: 'Value', value: `${stats.totalCost >= 100000 ? `${(stats.totalCost / 100000).toFixed(1)}L` : stats.totalCost >= 1000 ? `${(stats.totalCost / 1000).toFixed(0)}K` : stats.totalCost}`, color: statColors[2] },
    { icon: AlertTriangle, label: 'Attention', value: String(stats.attentionCount), color: statColors[3] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: scheme.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Overview</Text>
        <View style={[styles.gradientLine]} />
      </View>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={styles.statItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: scheme.textPrimary }]} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: BorderRadius.card, padding: 18, marginBottom: 16 },
  header: { marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  gradientLine: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    backgroundColor: '#7C3AED',
    width: 40,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    alignItems: 'center',
  },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
