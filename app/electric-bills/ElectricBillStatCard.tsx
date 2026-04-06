/** Statistic card for electric bills */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export default function ElectricBillStatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#FFFFFF' }]}>
      <View style={styles.iconRow}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? `${color}18` : `${color}10` }]}>
          <Zap size={16} color={color} />
        </View>
        <Text style={[styles.label, { color: scheme.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: scheme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  iconCircle: { width: 24, height: 24, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: Typography.fontSize.xs },
  value: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
});
