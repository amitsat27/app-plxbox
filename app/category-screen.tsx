/**
 * Category Screen — reusable for any bill category
 * Accessed as /category?cat=property etc.
 * Currently Sections links: property, mgl, wifi, electric, water, all bills
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { ChevronLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

const STATUS: Record<string, { color: string; icon: React.ReactElement }> = {
  paid: { color: '#10B981', icon: <CheckCircle size={14} color="#fff" /> },
  pending: { color: '#F59E0B', icon: <Clock size={14} color="#fff" /> },
  overdue: { color: '#EF4444', icon: <AlertCircle size={14} color="#fff" /> },
};

const TITLES: Record<string, string> = {
  property: 'Property Tax',
  mgl: 'MGL',
  wifi: 'WiFi Bills',
  electric: 'Electric Bills',
  gas: 'Gas Bills',
  bills: 'All Bills',
};

export default function CategoryScreen() {
  const router = useRouter();
  const { cat } = useLocalSearchParams<{ cat?: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { allBills, loading } = useDashboardData(user?.uid);

  const bills = cat ? allBills.filter(b => b.category === cat) : allBills;
  const title = cat ? (TITLES[cat] || cat) : 'Bills';

  if (loading) return <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.sub, { color: scheme.textTertiary }]}>{bills.length} bills</Text>
        <Text style={[styles.pageTitle, { color: scheme.textPrimary }]}>{title}</Text>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const s = STATUS[item.status] || STATUS.pending;
          return (
            <View style={[styles.row, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB' }]}>
              <View style={styles.badge}>{s.icon}</View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.date, { color: scheme.textTertiary }]}>Due {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <Text style={[styles.amt, { color: scheme.textPrimary }]}>₹{(item.amount ?? 0).toLocaleString('en-IN')}</Text>
            </View>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: scheme.textTertiary }]}>No {title.toLowerCase()} found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 4 },
  sub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  badge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  date: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  amt: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: Typography.fontSize.md },
});
