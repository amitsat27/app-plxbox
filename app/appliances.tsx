/**
 * Appliances Screen — Premium smart-home + finance hybrid experience
 * Inspired by Groww, Zerodha, Apple Home aesthetics
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, Colors } from '@/theme/color';
import { Spacing, BorderRadius } from '@/constants/designTokens';
import { ChevronLeft, Plus, Search, X, MapPin, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, Tv } from 'lucide-react-native';
import { useApplianceData } from '@/src/hooks/useApplianceData';
import type { ServiceRecord } from '@/src/types';

import ApplianceCard from '@/components/appliances/ApplianceCard';
import ApplianceSummaryCard from '@/components/appliances/ApplianceSummaryCard';
import SmartInsightsSection from '@/components/appliances/SmartInsightsSection';
import CategoryFilterRow from '@/components/appliances/CategoryFilterRow';
import ShimmerCard from '@/components/appliances/ShimmerCard';
import SectionHeroBanner from '@/components/SectionHeroBanner';

const LOCATIONS = ['all', 'pune', 'nashik', 'jalgaon', 'other'];

type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc';

const SORT_OPTIONS: { key: SortOption; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'name-asc', label: 'Name A-Z', Icon: ArrowUpAZ },
  { key: 'name-desc', label: 'Name Z-A', Icon: ArrowDownAZ },
  { key: 'date-desc', label: 'Newest', Icon: ArrowUpDown },
  { key: 'date-asc', label: 'Oldest', Icon: ArrowUpDown },
  { key: 'price-desc', label: 'Price ↓', Icon: ArrowUpDown },
  { key: 'price-asc', label: 'Price ↑', Icon: ArrowUpDown },
];

export default function AppliancesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { appliances, loading, stats, alerts, insights, refreshData, getApplianceServices } = useApplianceData(user?.uid);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [serviceRecords, setServiceRecords] = useState<Record<string, ServiceRecord | undefined>>({});
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch service records for all appliances
  useEffect(() => {
    const fetchAll = async () => {
      const map: Record<string, ServiceRecord | undefined> = {};
      await Promise.all(
        appliances.map(async (a) => {
          try {
            const records = await getApplianceServices?.(a.id);
            if (records && records.length > 0) {
              map[a.id] = records[0];
            }
          } catch { /* skip */ }
        }),
      );
      setServiceRecords(map);
    };
    if (appliances.length > 0) {
      fetchAll();
    }
  }, [appliances, getApplianceServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData?.();
    } catch {
      // listener auto-refreshes, so no-op on failure
    }
    setRefreshing(false);
  }, [refreshData]);

  const toggleSearch = () => {
    const next = !showSearch;
    setShowSearch(next);
    if (next) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 150);
    } else {
      Keyboard.dismiss();
    }
  };

  // Extract available cities from data
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    appliances.forEach((a) => {
      const loc = (a.location || 'other').toLowerCase();
      if (loc && loc !== 'undefined') locs.add(loc);
    });
    return LOCATIONS.filter((l) => l === 'all' || locs.has(l));
  }, [appliances]);

  // Filter + Sort
  const filtered = useMemo(() => {
    let result = [...appliances];

    // Location filter
    if (selectedLocation !== 'all') {
      result = result.filter((a) => (a.location || 'other').toLowerCase() === selectedLocation);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        (a.location || 'other').toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'date-desc': return bDate - aDate;
        case 'date-asc': return aDate - bDate;
        case 'price-desc': return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        case 'price-asc': return (a.purchasePrice || 0) - (b.purchasePrice || 0);
      }
    });

    return result;
  }, [appliances, selectedLocation, selectedCategory, searchQuery, sortBy]);

  const attentionCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;

  // Alerts section
  const renderAlerts = () => {
    if (!alerts.length) return null;

    return (
      <View style={styles.alertsSection}>
        {alerts.slice(0, 3).map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertRow,
              {
                backgroundColor: alert.severity === 'critical'
                  ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
                  : alert.severity === 'warning'
                    ? (isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)')
                    : (isDark ? 'rgba(100,116,139,0.1)' : 'rgba(100,116,139,0.06)'),
                borderColor: alert.severity === 'critical'
                  ? 'rgba(239,68,68,0.2)'
                  : alert.severity === 'warning'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(100,116,139,0.15)',
              },
            ]}
          >
            <View style={[styles.alertDot, { backgroundColor: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : '#64748B' }]} />
            <Text style={[styles.alertText, { color: scheme.textPrimary }]} numberOfLines={2}>
              {alert.message}
            </Text>
            <Text style={[styles.alertDays, {
              color: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : scheme.textTertiary,
            }]}>
              {alert.daysLeft <= 0 ? 'Expired' : `${alert.daysLeft}d`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      <SectionHeroBanner
        title="Appliances"
        subtitle="Track your home appliances"
        stats={{ total: appliances.length, active: stats.active }}
        icon={<Tv size={22} color={Colors.primary} />}
        countLabel="appliance"
      />

      <ApplianceSummaryCard
        stats={{
          total: stats.total,
          active: stats.active,
          totalCost: stats.totalCost,
          attentionCount,
        }}
      />

      {renderAlerts()}

      <SmartInsightsSection insights={insights} />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🔌</Text>
      <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>
        No appliances yet
      </Text>
      <Text style={[styles.emptySub, { color: scheme.textTertiary }]}>
        Tap the + button to add your first appliance
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={styles.headerPlaceholder} />
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <ShimmerCard variant="summary" />
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: scheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ChevronLeft size={26} color={scheme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchIconWrap}
            onPress={toggleSearch}
            hitSlop={12}
          >
            {showSearch ? (
              <X size={22} color={scheme.textSecondary} />
            ) : (
              <Search size={22} color={scheme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#F5F5F7', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
            <Search size={18} color={scheme.textTertiary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: scheme.textPrimary }]}
              placeholder="Search by name, brand, model, city..."
              placeholderTextColor={scheme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        )}

        <View>
          <Text style={[styles.title, { color: scheme.textPrimary }]}>
            Appliances
          </Text>
          <Text style={[styles.subtitle, { color: scheme.textTertiary }]}>
            {filtered.length} device{filtered.length !== 1 ? 's' : ''} · Total {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalCost)}
          </Text>
        </View>
      </View>

      {/* Category Filter */}
      <CategoryFilterRow selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Location Filter + Sort */}
      <View style={styles.filterBar}>
        {/* City chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {availableLocations.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[
                styles.locChip,
                {
                  backgroundColor: selectedLocation === loc
                    ? (isDark ? 'rgba(124,58,237,0.8)' : '#7C3AED')
                    : (isDark ? 'rgba(28,28,30,0.6)' : 'rgba(0,0,0,0.04)'),
                  borderColor: selectedLocation === loc
                    ? '#7C3AED'
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                },
              ]}
              onPress={() => setSelectedLocation(loc === 'all' ? 'all' : loc)}
            >
              {loc !== 'all' && <MapPin size={12} color={selectedLocation === loc ? '#FFF' : scheme.textTertiary} />}
              <Text
                style={[
                  styles.locChipText,
                  { color: selectedLocation === loc ? '#FFF' : scheme.textTertiary },
                ]}
              >
                {loc === 'all' ? 'All' : loc.charAt(0).toUpperCase() + loc.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort button */}
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: isDark ? 'rgba(28,28,30,0.6)' : 'rgba(0,0,0,0.04)' }]}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <ArrowUpDown size={14} color={scheme.textSecondary} />
          <Text style={[styles.sortBtnText, { color: scheme.textSecondary }]}>
            {SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort menu dropdown */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortMenuItem,
                  isActive && styles.sortMenuItemActive,
                  { backgroundColor: isActive ? (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)') : 'transparent' },
                ]}
                onPress={() => {
                  setSortBy(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <opt.Icon size={14} color={isActive ? '#7C3AED' : scheme.textTertiary} />
                <Text style={[styles.sortMenuItemText, { color: isActive ? '#7C3AED' : scheme.textPrimary }]}>
                  {opt.label}
                </Text>
                {isActive && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Animated Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <View style={styles.halfWidth}>
              <ApplianceCard
                appliance={item}
                lastServiceRecord={serviceRecords[item.id]}
              />
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
        />
      </Animated.View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#7C3AED' }]}
        onPress={() => router.push('/add-appliance')}
        activeOpacity={0.8}
      >
        <Plus size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerPlaceholder: { height: 88, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 36,
  },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 0 },
  halfWidth: { width: '49%' },
  alertsSection: { paddingHorizontal: 4, marginBottom: 16 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  alertDays: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 34,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* City + Sort filter bar */
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 6,
  },
  locChipText: { fontSize: 12, fontWeight: '600' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600' },

  /* Sort dropdown */
  sortMenu: {
    position: 'absolute',
    right: 16,
    top: 260,
    width: 180,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    marginHorizontal: 4,
  },
  sortMenuItemActive: {},
  sortMenuItemText: { fontSize: 13, fontWeight: '500', flex: 1 },
});
