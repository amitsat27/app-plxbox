/**
 * Vehicles Screen — Premium Smart Vehicle Dashboard
 * Fleet overview, alerts, insights, and vehicle cards with real images
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform,
  TouchableOpacity, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Plus, Search, X, AlertCircle, Wrench, Shield, FileText,
  Car, TrendingUp, AlertTriangle, Eye, Clock,
} from 'lucide-react-native';
import { Colors, getVehicleTypeColor, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { useVehicles, type VehicleAlert } from '@/src/hooks/useVehicles';
import type { Vehicle } from '@/src/types';
import VehicleCard from './components/VehicleCard';
import SummaryCard from './components/SummaryCard';
import SmartInsightCard from './components/SmartInsightCard';
import EmptyStateIllustrated from './components/EmptyStateIllustrated';
import QuickActionTile from './components/QuickActionTile';
import SkeletonCard from './components/SkeletonCard';
import { getExpiryColor, getDaysUntilExpiry, formatExpiryDate } from './utils/compliance';
import { getVehicleImageUrl } from './utils/vehicleImages';

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

  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(20);

  useEffect(() => {
    if (!loading) {
      listOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      listTranslateY.value = withDelay(100, withSpring(0, { damping: 22, stiffness: 150 }));
    }
  }, [loading]);

  // Prefetch vehicle images
  useEffect(() => {
    if (vehicles.length > 0) {
      vehicles.forEach((v, i) => {
        Image.prefetch(getVehicleImageUrl(v.type, i)).catch(() => {});
      });
    }
  }, [vehicles]);

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

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }} />
          <View style={{ flex: 1 }}>
            <View style={{ width: 60, height: 10, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderRadius: 5, alignSelf: 'center', marginBottom: 6 }} />
            <View style={{ width: 100, height: 24, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderRadius: 12, alignSelf: 'center' }} />
          </View>
          <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 12 }}>
          <SkeletonCard count={3} />
        </ScrollView>
      </SafeAreaView>
    );
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
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
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
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
        <FlatList
          data={[
            { key: 'summary' },
            { key: 'insights' },
            ...(vehicleStats.alerts.length > 0 ? [{ key: 'alerts' }] : []),
            { key: 'filters' },
            ...filteredVehicles.map((v) => ({ key: `v-${v.id}`, vehicle: v })),
          ]}
          renderItem={({ item, index }) => {
            if (item.key === 'summary') return <FleetSummary stats={vehicleStats} />;
            if (item.key === 'insights') return <InsightsRow stats={vehicleStats} />;
            if (item.key === 'alerts' && 'alerts' in vehicleStats)
              return <AlertsSection alerts={vehicleStats.alerts} scheme={scheme} />;
            if (item.key === 'filters') return (
              <FilterRow current={filterType} onChange={setFilterType} alertCount={vehicleStats.alerts.length} scheme={scheme} />
            );
            const veh = 'vehicle' in item ? item.vehicle : undefined;
            if (veh) return (
              <VehicleCard
                vehicle={veh}
                index={index}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigateToDetail(router, veh); }}
              />
            );
            return null;
          }}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          ListEmptyComponent={
            filteredVehicles.length === 0 && filterType !== 'all'
              ? <EmptyStateIllustrated type="no-results" onClearFilters={() => { setFilterType('all'); setSearchQuery(''); }} />
              : vehicles.length === 0
                ? <EmptyStateIllustrated type="no-vehicles" onAddVehicle={() => router.push({ pathname: '/vehicle-add' } as any)} />
                : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.warning} colors={[Colors.warning]} />
          }
          initialNumToRender={5}
          maxToRenderPerBatch={3}
        />
      </Animated.View>

      {/* ── Quick Actions ── */}
      <View style={[styles.quickBar, { borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: scheme.background, paddingBottom: insets.bottom + 8 }]}>
        <QuickActionTile icon={<Wrench size={16} color={Colors.warning} />} label="Service" color={Colors.warning} />
        <QuickActionTile icon={<Shield size={16} color="#3B82F6" />} label="Insurance" color="#3B82F6" />
        <QuickActionTile icon={<FileText size={16} color="#10B981" />} label="PUC" color="#10B981" />
        <QuickActionTile icon={<Eye size={16} color="#8B5CF6" />} label="History" color="#8B5CF6" />
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

/* ─── Fleet Summary ─── */

function FleetSummary({ stats }: { stats: ReturnType<typeof useVehicles> }) {
  const { isDark } = useTheme();

  const criticalCount = stats.alerts.filter((a) => a.severity === 'critical').length;
  const alertColor = criticalCount > 0 ? '#EF4444' : '#F59E0B';

  return (
    <View style={styles.summaryWrap}>
      <View style={[styles.summaryHeader, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <Car size={16} color={Colors.primary} />
        <Text style={[styles.summaryTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Fleet Overview</Text>
      </View>
      <View style={styles.summaryGrid}>
        {stats.overview.map((item, i) => (
          <SummaryCard key={item.label} {...item} index={i} />
        ))}
      </View>
      {stats.total > 0 && (
        <View style={styles.insightRow}>
          <InsightChip emoji="✅" label="Active" value={`${stats.active}`} />
          <InsightChip emoji="⚠️" label="Alerts" value={`${stats.alerts.length}`} color={alertColor} />
          <InsightChip emoji="📍" label="City" value={getCityLabel(stats)} />
        </View>
      )}
    </View>
  );
}

function getCityLabel(stats: ReturnType<typeof useVehicles>): string {
  if (stats.total === 0) return '—';
  return 'Pune';
}

/* ─── Insights Row ─── */

function InsightsRow({ stats }: { stats: ReturnType<typeof useVehicles> }) {
  const { isDark } = useTheme();
  const closestAlert = stats.alerts.length > 0
    ? stats.alerts.reduce((closest, a) => {
        const aDays = getDaysUntilExpiry(a.dueDate);
        const cDays = getDaysUntilExpiry(closest.dueDate);
        return aDays < cDays ? a : closest;
      })
    : null;

  return (
    <View style={styles.insightsSection}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Smart Insights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightsScroll}>
        <SmartInsightCard
          title="Total Vehicles"
          value={String(stats.total)}
          subtitle="All registered"
          icon={<Car size={16} color={Colors.primary} />}
          color={Colors.primary}
          index={0}
        />
        <SmartInsightCard
          title="Active"
          value={String(stats.active)}
          subtitle={`of ${stats.total}`}
          icon={<TrendingUp size={16} color="#10B981" />}
          color="#10B981"
          index={1}
        />
        <SmartInsightCard
          title="Alerts"
          value={String(stats.alerts.length)}
          subtitle={stats.alerts.length > 0 ? 'Need attention' : 'All clear'}
          icon={<AlertTriangle size={16} color={stats.alerts.length > 0 ? '#F59E0B' : '#10B981'} />}
          color={stats.alerts.length > 0 ? '#F59E0B' : '#10B981'}
          index={2}
        />
        <SmartInsightCard
          title={closestAlert ? closestAlert.type.toUpperCase() : 'Status'}
          value={closestAlert ? `${closestAlert.daysLeft}d` : 'All Good'}
          subtitle={closestAlert ? closestAlert.message : 'No upcoming events'}
          icon={<Clock size={16} color="#3B82F6" />}
          color="#3B82F6"
          index={3}
        />
      </ScrollView>
    </View>
  );
}

/* ─── Alerts Section ─── */

function AlertsSection({ alerts, scheme }: { alerts: VehicleAlert[]; scheme: ReturnType<typeof getColorScheme> }) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.alertCard, { backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)', borderColor: `${Colors.warning}20` }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIconWrap, { backgroundColor: `${Colors.warning}15` }]}>
          <AlertCircle size={16} color={Colors.warning} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.alertTitle, { color: scheme.textPrimary }]}>Attention Needed</Text>
          <Text style={[styles.alertSubtitle, { color: scheme.textTertiary }]}>{alerts.length} item{alerts.length > 1 ? 's' : ''} require attention</Text>
        </View>
        <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{alerts.length}</Text></View>
      </View>
      {alerts.slice(0, 4).map((a) => {
        const dotColor = a.severity === 'critical' ? '#EF4444' : a.severity === 'warning' ? '#F59E0B' : '#3B82F6';
        return (
          <View key={a.id} style={[styles.alertItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={[styles.alertDot, { backgroundColor: dotColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertVehicleName, { color: scheme.textPrimary }]}>{a.vehicleName}</Text>
              <Text style={[styles.alertMsg, { color: scheme.textTertiary }]}>{a.message}</Text>
            </View>
            <View style={[styles.alertDaysTag, { backgroundColor: `${dotColor}15` }]}>
              <Text style={[styles.alertDaysText, { color: dotColor }]}>{a.daysLeft < 0 ? `${Math.abs(a.daysLeft)}d ago` : `${a.daysLeft}d left`}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ─── Filter Row ─── */

function FilterRow({ current, onChange, alertCount, scheme }: { current: string; onChange: (v: any) => void; alertCount: number; scheme: ReturnType<typeof getColorScheme> }) {
  const { isDark } = useTheme();
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'alerts', label: 'Alerts', badge: alertCount },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 8 }}>
        {filters.map((f) => {
          const isActive = current === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, {
                backgroundColor: isActive ? Colors.warning : isDark ? '#1C1C1E' : '#F2F2F7',
                borderColor: isActive ? Colors.warning : 'transparent',
              }]}
              onPress={() => { Haptics.selectionAsync(); onChange(f.key); }}
            >
              <Text style={[styles.filterLabel, { color: isActive ? '#000' : isDark ? '#A1A1AA' : '#6B7280' }]}>{f.label}</Text>
              {(f.badge ?? 0) > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: isActive ? '#000' : '#EF4444' }]}>
                  <Text style={styles.filterBadgeText}>{f.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ─── Helpers ─── */

function InsightChip({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.insightBubble, { backgroundColor: isDark ? '#1C1C1E' : '#F8F9FA' }]}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={[styles.insightLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>{label}</Text>
      <Text style={[styles.insightValue, { color: color || (isDark ? '#F8FAFC' : '#1E293B') }]}>{value}</Text>
    </View>
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
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  insightRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  insightBubble: { flex: 1, alignItems: 'center', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6, gap: 2 },
  insightLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  insightValue: { fontSize: 14, fontWeight: '800' },

  insightsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  insightsScroll: { marginHorizontal: -16, paddingHorizontal: 16, flexDirection: 'row', gap: 12 },

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
    borderWidth: 1.5, marginRight: 6,
  },
  filterLabel: { fontSize: 13, fontWeight: '700' },
  filterBadge: { borderRadius: 6, paddingHorizontal: 5, height: 16, justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

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
});
