/**
 * Appliances Screen — stack navigation (from Sections)
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { Monitor, ChevronLeft } from 'lucide-react-native';

const CAT_COLORS: Record<string, string> = {
  kitchen: '#FF6B35',
  living: '#3B82F6',
  bedroom: '#10B981',
  bathroom: '#06B6D4',
  other: '#64748B',
};

export default function AppliancesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { appliances, loading } = useDashboardData(user?.uid);

  if (loading) return <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.sub, { color: scheme.textTertiary }]}>{appliances.length} tracked</Text>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Appliances</Text>
      </View>

      <FlatList
        data={appliances}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const c = CAT_COLORS[item.category] || CAT_COLORS.other;
          return (
            <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB' }]}>
              <View style={[styles.iconBg, { backgroundColor: isDark ? `${c}22` : `${c}11` }]}>
                <Monitor size={20} color={c} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.type, { color: scheme.textTertiary }]}>{item.brand} · {item.model}</Text>
              </View>
              {item.isActive && item.warrantyExpiry && (
                <Text style={[styles.badge, { color: '#10B981' }]}>Warranty</Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: scheme.textTertiary }]}>No appliances added yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 4 },
  sub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  iconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: Typography.fontSize.md, fontWeight: '600' },
  type: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  badge: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: Typography.fontSize.md },
});
