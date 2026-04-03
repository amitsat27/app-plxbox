/**
 * Vehicles Screen — stack navigation (from Sections)
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
import { Car, ChevronLeft } from 'lucide-react-native';

export default function VehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { vehicles, loading } = useDashboardData(user?.uid);

  if (loading) return <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.sub, { color: scheme.textTertiary }]}>{vehicles.length} registered</Text>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Vehicles</Text>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB' }]}>
            <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)' }]}>
              <Car size={20} color="#F59E0B" />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.type, { color: scheme.textTertiary }]}>{item.make} {item.model} · {item.year}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: item.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }]}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: item.isActive ? '#10B981' : '#94A3B8', fontWeight: '600' }}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: scheme.textTertiary }]}>No vehicles added yet.</Text>}
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
  name: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  type: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: Typography.fontSize.md },
});
