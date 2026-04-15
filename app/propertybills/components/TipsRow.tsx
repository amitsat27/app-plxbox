/**
 * Property Tax — TipsRow
 * Horizontal scrollable info cards with icons
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Info, Home, type LucideIcon } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

interface Tip {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

const TIPS: Tip[] = [
  { title: 'Early Bird Discount', desc: 'Pay before Mar 31 for 5% rebate', icon: TrendingUp, color: '#10B981' },
  { title: 'Tax Assessment Update', desc: 'PMC revised circle rates effective Apr 2026', icon: Info, color: '#3B82F6' },
  { title: 'Online Payment', desc: 'Pay via PMC portal using index number', icon: Home, color: '#8B5CF6' },
];

export function TipsRow() {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Updates & Tips</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {TIPS.map((t, i) => <TipCard key={i} tip={t} isDark={isDark} scheme={scheme} />)}
      </ScrollView>
    </View>
  );
}

function TipCard({ tip, isDark, scheme }: { tip: Tip; isDark: boolean; scheme: ReturnType<typeof getColorScheme> }) {
  const Icon = tip.icon;
  return (
    <View style={[
      styles.card,
      { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border },
    ]}>
      <View style={[styles.iconBg, { backgroundColor: isDark ? `${tip.color}18` : `${tip.color}10` }]}>
        <Icon size={18} color={tip.color} />
      </View>
      <Text style={[styles.title, { color: scheme.textPrimary }]} numberOfLines={1}>{tip.title}</Text>
      <Text style={[styles.desc, { color: scheme.textTertiary }]} numberOfLines={2}>{tip.desc}</Text>
    </View>
  );
}

const TipsRowExport = TipsRow;
export default TipsRowExport;

const styles = StyleSheet.create({
  section: { marginTop: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scroll: { paddingHorizontal: Spacing.lg },
  card: {
    flex: 1,
    minWidth: 220,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  desc: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.fontSize.xs * 1.6,
  },
});
