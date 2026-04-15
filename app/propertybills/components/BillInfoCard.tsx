/**
 * Property Tax — BillInfoCard
 * Reusable info card with labeled detail rows
 */
import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

/** A single row with icon, label, and value */
function DetailRow({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
        {icon}
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[styles.value, { color: accent || scheme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

/** A card that groups multiple DetailRows under a title */
export function BillInfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

const BillInfoCardExport = BillInfoCard;
export default BillInfoCardExport;

export { DetailRow };

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: Typography.fontSize.xs, lineHeight: 15, fontWeight: '500' },
  value: { fontSize: Typography.fontSize.sm, fontWeight: '600', lineHeight: 20 },
});
