/**
 * StatCard — aligned stat display card
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={{ flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, paddingTop: Spacing.md + 2, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }), backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm - 2 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? `${color}18` : `${color}10` }}>{icon}</View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textTertiary, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: '800', color: scheme.textPrimary, letterSpacing: -0.5 }}>{value}</Text>
      {sub && <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textTertiary, marginTop: 3 }}>{sub}</Text>}
    </View>
  );
}

export default StatCard;
