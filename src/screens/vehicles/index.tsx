/**
 * Vehicles Screen — premium listing with summaries, alerts, and vehicle cards
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, ActivityIndicator,
  TouchableOpacity, Animated, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Search, X, AlertCircle, Wrench, Shield, FileText } from 'lucide-react-native';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { useVehicles, type VehicleAlert } from '@/src/hooks/useVehicles';
import type { Vehicle } from '@/src/types';
import VehicleCard from './components/VehicleCard';
import SummaryCard from './components/SummaryCard';

export default function VehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { vehicles, loading } = useDashboardData(user?.uid);
  const vehicleStats = useVehicles(vehicles);

  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'alerts'>('all');

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];
    if (filterType === 'active') result = result.filter((v) => v.isActive);
    else if (filterType === 'inactive') result = result.filter((v) => !v.isActive);
    else if (filterType === 'alerts') {
      const alertIds = new Set(vehicleStats.alerts.map((a) => a.vehicleId));
      result = result.filter((v) => alertIds.has(v.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.registrationNumber || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [vehicles, filterType, searchQuery, vehicleStats.alerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  if (loading) {
    return <View style={[styles.center, { backgroundColor: scheme.background }]}><ActivityIndicator size="large" color={Colors.warning} /></View>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => router.back()}>
            <X size={18} color={scheme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.count, { color: scheme.textTertiary }]}>{vehicles.length} VEHICLE{vehicles.length !== 1 ? 'S' : ''}</Text>
            <Text style={[styles.title, { color: scheme.textPrimary }]}>My Garage</Text>
          </View>
          <TouchableOpacity
            style={[styles.searchToggle, searchActive && { backgroundColor: `${Colors.warning}20` }]}
            onPress={() => { Haptics.selectionAsync(); setSearchActive((p) => !p); if (searchActive) setSearchQuery(''); }}
          >
            {searchActive ? <X size={18} color={Colors.warning} /> : <Search size={18} color={scheme.textSecondary} />}
          </TouchableOpacity>
        </View>
        {searchActive && (
          <Animated.View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
            <Search size={16} color={scheme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: scheme.textPrimary }]}
              placeholder="Search vehicles..."
              placeholderTextColor={scheme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color={scheme.textTertiary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>

      {/* ── Content ── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={[
            { key: 'summary' },
            ...(vehicleStats.alerts.length > 0 ? [{ key: 'alerts' }] : []),
            { key: 'filters' },
            ...filteredVehicles.map((v) => ({ key: `v-${v.id}`, vehicle: v })),
          ]}
          renderItem={({ item }) => {
            if (item.key === 'summary') return <SummarySection stats={vehicleStats} />;
            if (item.key === 'alerts' && 'alerts' in vehicleStats)
              return <AlertsSection alerts={vehicleStats.alerts} scheme={scheme} />;
            if (item.key === 'filters') return (
              <FilterRow current={filterType} onChange={setFilterType} alertCount={vehicleStats.alerts.length} scheme={scheme} />
            );
            const veh = 'vehicle' in item ? item.vehicle : undefined;
            if (veh) return <VehicleCard vehicle={veh} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigateToDetail(router, veh); }} />;
            return null;
          }}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            filteredVehicles.length === 0 && filterType !== 'all'
              ? <EmptyFilter onClear={() => { setFilterType('all'); setSearchQuery(''); }} scheme={scheme} />
              : vehicles.length === 0
                ? <EmptyState onAdd={() => router.push({ pathname: '/vehicle-add' } as any)} scheme={scheme} />
                : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.warning} colors={[Colors.warning]} />
          }
        />
      </Animated.View>

      {/* ── Quick Actions ── */}
      <View style={[styles.quickBar, { borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: scheme.background, paddingBottom: insets.bottom + 8 }]}>
        <QuickAction icon={<Wrench size={16} color={Colors.warning} />} label="Service" scheme={scheme} />
        <QuickAction icon={<Shield size={16} color="#3B82F6" />} label="Insurance" scheme={scheme} />
        <QuickAction icon={<FileText size={16} color="#10B981" />} label="PUC" scheme={scheme} />
        <QuickAction icon={<FileText size={16} color="#8B5CF6" />} label="History" scheme={scheme} />
      </View>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 60 }]}
        activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: '/vehicle-add' } as any); }}
      >
        <Plus size={24} color={isDark ? '#000' : '#FFF'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ─── Summary Section ─── */

function SummarySection({ stats }: { stats: ReturnType<typeof useVehicles> }) {
  return (
    <View style={styles.summaryWrap}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Fleet Overview</Text>
        <View style={styles.summaryGlow} />
      </View>
      <View style={styles.summaryGrid}>
        {stats.overview.map((item, i) => (
          <SummaryCard key={item.label} {...item} index={i} />
        ))}
      </View>
      {stats.total > 0 && (
        <View style={styles.insightRow}>
          <InsightBubble emoji="✅" label="Active" value={`${stats.active}`} />
          <InsightBubble emoji="📍" label="Location" value="Pune" />
          <InsightBubble emoji="⛽" label="Fuel" value="Mixed" />
        </View>
      )}
    </View>
  );
}

/* ─── Alerts Section ─── */

function AlertsSection({ alerts, scheme }: { alerts: VehicleAlert[]; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={[styles.alertCard, { backgroundColor: `${Colors.warning}08`, borderColor: `${Colors.warning}20` }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIconWrap, { backgroundColor: `${Colors.warning}15` }]}>
          <AlertCircle size={16} color={Colors.warning} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.alertTitle, { color: scheme.textPrimary }]}>Attention Needed</Text>
          <Text style={[styles.alertSubtitle, { color: scheme.textTertiary }]}>{alerts.length} item{alerts.length > 1 ? 's' : ''} need your attention</Text>
        </View>
        <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{alerts.length}</Text></View>
      </View>
      {alerts.slice(0, 4).map((a, i) => {
        const dotColor = a.severity === 'critical' ? '#EF4444' : a.severity === 'warning' ? '#F59E0B' : '#3B82F6';
        return (
          <View key={a.id + i} style={[styles.alertItem, { borderBottomColor: `${Colors.warning}10` }]}>
            <View style={[styles.alertDot, { backgroundColor: dotColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertVehicleName, { color: scheme.textPrimary }]}>{a.vehicleName}</Text>
              <Text style={[styles.alertMsg, { color: scheme.textTertiary }]}>{a.message}</Text>
            </View>
            <View style={[styles.alertDaysTag, { backgroundColor: `${dotColor}15` }]}>
              <Text style={[styles.alertDaysText, { color: dotColor }]}>{a.daysLeft < 0 ? `${Math.abs(a.daysLeft)}d` : `${a.daysLeft}d`}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ─── Filter Row ─── */

function FilterRow({ current, onChange, alertCount, scheme }: { current: string; onChange: (v: any) => void; alertCount: number; scheme: ReturnType<typeof getColorScheme> }) {
  const filters = [
    { key: 'all', label: 'All Vehicles' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'alerts', label: 'Alerts', badge: alertCount },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
      {filters.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.filterChip, current === f.key && { backgroundColor: Colors.warning }]}
          onPress={() => onChange(f.key)}
        >
          <Text style={[styles.filterLabel, { color: current === f.key ? '#000' : scheme.textSecondary }]}>{f.label}</Text>
          {f.badge && f.badge > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: current === f.key ? '#000' : '#EF4444' }]}>
              <Text style={styles.filterBadgeText}>{f.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

import { ScrollView } from 'react-native';

/* ─── Empty State ─── */

function EmptyState({ onAdd, scheme }: { onAdd: () => void; scheme: ReturnType<typeof getColorScheme> }) {
  const { isDark } = useTheme();
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <Text style={styles.emptyEmoji}>🚗</Text>
        <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>Your Garage is Empty</Text>
        <Text style={[styles.emptyDesc, { color: scheme.textTertiary }]}>Add vehicles to track insurance, PUC, registration and service history all in one place.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
          <Plus size={18} color="#000" />
          <Text style={styles.emptyBtnText}>Add Vehicle</Text>
        </TouchableOpacity>
        <View style={styles.tipsWrap}>
          <View style={[styles.tipRow, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <Text style={{ fontSize: 14 }}>📋</Text>
            <Text style={[styles.tipText, { color: scheme.textSecondary }]}>Track insurance & PUC expiry dates</Text>
          </View>
          <View style={[styles.tipRow, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <Text style={{ fontSize: 14 }}>🔧</Text>
            <Text style={[styles.tipText, { color: scheme.textSecondary }]}>Monitor service history & reminders</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={{ fontSize: 14 }}>⛽</Text>
            <Text style={[styles.tipText, { color: scheme.textSecondary }]}>Manage fuel & mileage records</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyFilter({ onClear, scheme }: { onClear: () => void; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={{ fontSize: 48 }}>🔍</Text>
      <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>No Vehicles Found</Text>
      <Text style={[styles.emptyDesc, { color: scheme.textTertiary }]}>Try a different filter or search query.</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onClear}>
        <Text style={styles.emptyBtnText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

function InsightBubble({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={[styles.insightBubble, { backgroundColor: isDark ? '#1C1C1E' : '#F8F9FA' }]}>
      <Text style={{ fontSize: 15 }}>{emoji}</Text>
      <Text style={[styles.insightLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.insightValue, { color: scheme.textPrimary }]}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, scheme }: { icon: React.ReactNode; label: string; scheme: ReturnType<typeof getColorScheme> }) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>{icon}</View>
      <Text style={[styles.quickLabel, { color: scheme.textTertiary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function navigateToDetail(router: ReturnType<typeof useRouter>, vehicle: Vehicle) {
  router.push({
    pathname: '/vehicle-detail',
    params: { vehicleId: vehicle.id, vehicle: encodeURIComponent(JSON.stringify(vehicle)) },
  } as any);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  count: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  iconBtn: { padding: 10, borderRadius: 14 },
  searchToggle: { padding: 10, borderRadius: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  summaryWrap: { marginBottom: 4 },
  summaryHeader: { marginBottom: 14, position: 'relative' },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#F5F5F5' },
  summaryGlow: { position: 'absolute', right: -20, top: -10, width: 80, height: 40, backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 40, transform: [{ rotate: '-15deg' }] },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  insightRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  insightBubble: { flex: 1, alignItems: 'center', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6, gap: 2 },
  insightLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  insightValue: { fontSize: 14, fontWeight: '800' },

  alertCard: { padding: 16, borderRadius: 24, borderWidth: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center' },
  alertIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 16, fontWeight: '800' },
  alertSubtitle: { fontSize: 11, marginTop: 2 },
  alertBadge: { backgroundColor: '#EF4444', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  alertBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  alertItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, marginTop: 4 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  alertVehicleName: { fontSize: 14, fontWeight: '700' },
  alertMsg: { fontSize: 12, marginTop: 2 },
  alertDaysTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  alertDaysText: { fontSize: 12, fontWeight: '800' },

  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    backgroundColor: '#1C1C1E', marginRight: 8,
  },
  filterLabel: { fontSize: 13, fontWeight: '700' },
  filterBadge: { borderRadius: 6, paddingHorizontal: 5, height: 16, justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 16 },
  emptyCard: { padding: 24, borderRadius: 28, width: '100%', alignItems: 'center' },
  emptyEmoji: { fontSize: 60, marginBottom: 4 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, gap: 8, marginTop: 20,
  },
  emptyBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  tipsWrap: { marginTop: 28, width: '100%' },
  tipRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  tipText: { fontSize: 13, flex: 1 },

  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.warning, justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.warning, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  quickBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 0.5, paddingTop: 12,
  },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '600' },
});
