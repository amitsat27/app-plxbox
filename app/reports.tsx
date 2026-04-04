/**
 * Reports Screen — stack navigation (from Sections)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { Wallet, ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { categories, totalBillsAmount, totalBillsCount, pendingBills, overdueBills, loading } = useDashboardData(user?.uid);

  if (loading) return <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const pendingAmt = pendingBills.reduce((s, b) => s + (b.amount ?? 0), 0);
  const overdueAmt = overdueBills.reduce((s, b) => s + (b.amount ?? 0), 0);

  const summaryCards = [
    { label: 'Total Paid', value: `₹${totalBillsAmount.toLocaleString('en-IN')}`, color: '#8B5CF6' },
    { label: 'Pending', value: `₹${pendingAmt.toLocaleString('en-IN')}`, color: '#F59E0B' },
    { label: 'Overdue', value: `₹${overdueAmt.toLocaleString('en-IN')}`, color: '#EF4444' },
    { label: 'Total Bills', value: String(totalBillsCount), color: '#3B82F6' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.sub, { color: scheme.textTertiary }]}>Spending Overview</Text>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryGrid}>
          {summaryCards.map((c) => (
            <View key={c.label} style={[styles.summaryCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={[styles.summaryIcon, { backgroundColor: isDark ? `${c.color}22` : `${c.color}11` }]}>
                <Wallet size={16} color={c.color} />
              </View>
              <Text style={[styles.summaryValue, { color: scheme.textPrimary }]}>{c.value}</Text>
              <Text style={[styles.summaryLabel, { color: scheme.textTertiary }]}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Breakdown */}
        <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>Category Breakdown</Text>
        <View style={[styles.breakdown, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {categories.map((c, i) => {
            const pct = totalBillsAmount > 0 ? (c.totalAmount / totalBillsAmount) * 100 : 0;
            return (
              <React.Fragment key={c.category}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: getCategoryColor(c.category) }]} />
                  <Text style={[styles.breakdownName, { color: scheme.textPrimary }]}>{c.label}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: getCategoryColor(c.category) }]} />
                  </View>
                  <Text style={[styles.breakdownAmt, { color: scheme.textPrimary }]}>₹{c.totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryColor = (cat: string): string => {
  const m: Record<string, string> = { electric: '#F59E0B', gas: '#3B82F6', wifi: '#8B5CF6', property: '#10B981', water: '#06B6D4', mgl: '#F97316' };
  return m[cat] || '#7C3AED';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 4 },
  sub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  summaryCard: {
    flex: 1,
    minWidth: (require('react-native').Dimensions.get('window').width - Spacing.lg * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  summaryValue: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  summaryLabel: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  breakdown: { borderRadius: BorderRadius.card, overflow: 'hidden', marginBottom: Spacing.xl },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  breakdownDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  breakdownName: { fontSize: Typography.fontSize.sm, fontWeight: '500', width: 80 },
  barContainer: { flex: 1, height: 6, backgroundColor: 'rgba(148,163,184,0.1)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  breakdownAmt: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  divider: { height: 0.5, marginLeft: 20 },
});
