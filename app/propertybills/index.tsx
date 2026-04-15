/**
 * Property Tax Bills — Main Screen
 * Modular architecture with premium iOS design
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator,
  TouchableOpacity, Modal, Animated, Alert, ScrollView, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft, Home, Plus, IndianRupee, FileText, Bell, Search, ArrowUpDown, X,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService, PropertyTaxBillEntry } from '@/src/services/FirebaseService';

// Modular components
import { SelectBar } from './components/SelectBar';
import { StatsRow } from './components/StatsRow';
import TaxBillCard from './components/TaxBillCard';
import { PropertyTaxSkeleton } from './components/PropertyTaxSkeleton';
import { InsightCard } from './components/InsightCard';
import { FilterBar } from './components/FilterBar';
import { NotifBell } from './components/NotifBell';
import { NotifPanel } from './components/NotifPanel';
import { EmptyState } from './components/EmptyState';
import HeroBanner from './components/HeroBanner';
import AddConsumerModal from './components/AddConsumerModal';
import AddBillModal from './components/AddBillModal';
import { buildNotifs, calculateStats, TaxNotif } from '@/src/utils/property-tax/taxUtils';
import { pendingPropertyTaxBillIdRef } from '../property-bill-detail';

export default function PropertyTaxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();

  // Data state
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTaxIndex, setSelectedTaxIndex] = useState<string | undefined>();
  const [taxIndices, setTaxIndices] = useState<string[]>([]);
  const [bills, setBills] = useState<PropertyTaxBillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<TaxNotif[]>([]);

  // UI state
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'year' | 'amount' | 'dueDate'>('year');
  const [showSearch, setShowSearch] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddConsumer, setShowAddConsumer] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [editingBill, setEditingBill] = useState<PropertyTaxBillEntry | null>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const pendingCount = bills.filter(b => b.payStatus === 'Pending').length;
  const stats = useMemo(() => calculateStats(bills), [bills]);

  // Search, filter, sort
  const filteredBills = useMemo(() => {
    let result = filter === 'All' ? [...bills] : bills.filter(b => b.payStatus === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.billYear.toLowerCase().includes(q) ||
        b.payStatus.toLowerCase().includes(q) ||
        (b.paymentMode && b.paymentMode.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'year') {
        return Number(b.billYear) - Number(a.billYear);
      } else if (sortBy === 'amount') {
        const aAmt = typeof a.taxBillAmount === 'string' ? parseFloat(a.taxBillAmount.replace(/,/g, '')) || 0 : a.taxBillAmount || 0;
        const bAmt = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) || 0 : b.taxBillAmount || 0;
        return bAmt - aAmt;
      } else {
        return new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime();
      }
    });
    return result;
  }, [bills, filter, searchQuery, sortBy]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: loading ? 0 : 1, duration: 300, useNativeDriver: true }).start();
  }, [loading, fadeAnim]);

  // Refetch on focus
  useFocusEffect(useCallback(() => { setFocusTick(t => t + 1); }, []));
  const [focusTick, setFocusTick] = useState(0);

  // Update notifications when bills change
  useEffect(() => {
    setNotifications(buildNotifs(bills, propertyInfo));
  }, [bills, propertyInfo]);

  // City change
  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city);
    setSelectedTaxIndex(undefined);
    setBills([]);
    setPropertyInfo(null);
    const idx = await firebaseService.getPropertyTaxConsumersByCity(city);
    setTaxIndices(idx);
    if (idx.length === 1) setSelectedTaxIndex(idx[0]);
  }, []);

  // Fetch bills when tax index changes
  useEffect(() => {
    if (!selectedTaxIndex || !selectedCity) { setBills([]); setPropertyInfo(null); return; }
    let cancelled = false;
    setLoading(true);
    firebaseService.getPropertyTaxInfo(selectedTaxIndex).then(i => { if (!cancelled) setPropertyInfo(i); });
    const u = firebaseService.getPropertyTaxBills(selectedCity, selectedTaxIndex, d => { if (!cancelled) { setBills(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedTaxIndex, selectedCity, focusTick]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    if (!selectedTaxIndex || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getPropertyTaxInfo(selectedTaxIndex).then(i => { setPropertyInfo(i); setRefreshing(false); }).catch(() => setRefreshing(false));
  }, [selectedCity, selectedTaxIndex]);

  // Handle edit from detail screen
  useFocusEffect(useCallback(() => {
    const id = pendingPropertyTaxBillIdRef.current;
    if (id && bills.length > 0) {
      const b = bills.find(x => x.id === id);
      if (b) { setEditingBill(b); setShowAddBill(true); pendingPropertyTaxBillIdRef.current = ''; }
    }
  }, [bills]));

  const handleViewBill = (bill: PropertyTaxBillEntry) =>
    router.push({ pathname: '/property-bill-detail', params: { billId: bill.id, city: selectedCity, taxIndexNumber: bill.taxIndexNumber || '' } } as any);
  const handleEditBill = (bill: PropertyTaxBillEntry) => { setEditingBill(bill); setShowAddBill(true); };
  const handleDeleteBill = (bill: PropertyTaxBillEntry) => {
    Alert.alert('Delete Bill', `Are you sure you want to delete the FY ${bill.billYear} bill?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseService.deletePropertyTaxBill(selectedCity, bill.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const toggleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSortMenu(false);
    if (showSearch) setSearchQuery('');
    setShowSearch(s => !s);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.6}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>
              {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Property Tax'}
            </Text>
            {pendingCount > 0 && (
              <View style={[styles.pendingBadge, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)' }]}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B' }}>{pendingCount} pending</Text>
              </View>
            )}
          </View>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Property Tax</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity style={styles.addIconBtn} onPress={toggleSearch}>
            {showSearch ? <X size={16} color={Colors.primary} /> : <Search size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addIconBtn} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSortMenu(s => !s);
          }}>
            <ArrowUpDown size={16} color={showSortMenu ? '#FFF' : scheme.textTertiary} />
          </TouchableOpacity>
          <NotifBell count={unreadCount} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifs(true); }} />
          <TouchableOpacity style={styles.addIconBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddConsumer(true); }}>
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Hero Banner */}
        <HeroBanner stats={bills.length > 0 ? stats : null} selectedCity={selectedCity} />

        {/* City + Tax Index Selectors */}
        <SelectBar
          selectedCity={selectedCity}
          onCitySelect={handleCityChange}
          taxIndices={taxIndices}
          selectedTaxIndex={selectedTaxIndex}
          onTaxIndexSelect={(v) => { setSelectedTaxIndex(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        />

        {/* Search & Sort Controls */}
        {bills.length > 0 && showSearch && (
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.xs, marginBottom: Spacing.sm }}>
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
              <Search size={16} color={scheme.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: scheme.textPrimary }]}
                placeholder="Search by year, status, payment mode..."
                placeholderTextColor={scheme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <X size={14} color={scheme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {bills.length > 0 && showSortMenu && (
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.xs, marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {([
                { key: 'year', label: 'Year' },
                { key: 'amount', label: 'Amount' },
                { key: 'dueDate', label: 'Due Date' },
              ] as const).map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: sortBy === s.key
                        ? (isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.12)')
                        : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(0,0,0,0.04)'),
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowSearch(false);
                    setSortBy(s.key);
                  }}
                >
                  <Text style={{
                    fontSize: Typography.fontSize.xs,
                    fontWeight: '600',
                    color: sortBy === s.key ? Colors.primary : scheme.textTertiary,
                  }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Property Info Card */}
        {propertyInfo && (
          <Animated.View style={[styles.infoCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', opacity: fadeAnim }]}>
            <View style={styles.infoCardHeader}>
              <Home size={16} color={Colors.primary} />
              <Text style={[styles.infoCardTitle, { color: scheme.textPrimary }]}>Property Details</Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoItem icon={<FileText size={16} color="#A78BFA" />} label="Index No." value={propertyInfo.taxIndexNumber} scheme={scheme} isDark={isDark} />
              <InfoItem icon={<View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#F59E0B' }} />} label="Location" value={propertyInfo.location} scheme={scheme} isDark={isDark} />
              <InfoItem icon={<View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#10B981' }} />} label="Owner" value={propertyInfo.ownerName} scheme={scheme} isDark={isDark} />
              <InfoItem icon={<View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#06B6D4' }} />} label="Area" value={propertyInfo.area} scheme={scheme} isDark={isDark} />
              <InfoItem icon={<Bell size={16} color="#EC4899" />} label="Mobile" value={propertyInfo.registeredMobile} scheme={scheme} isDark={isDark} />
            </View>
          </Animated.View>
        )}

        {/* Stats */}
        {bills.length > 0 && <StatsRow stats={stats} />}

        {/* Insights & Tips */}
        {selectedCity && <InsightCard />}

        {/* Filters */}
        {bills.length > 0 && <FilterBar filter={filter} onFilter={setFilter} />}

        {/* Loading Skeleton */}
        {loading && <PropertyTaxSkeleton count={3} />}

        {/* Bills List */}
        {filteredBills.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: Spacing.lg }}>
            {filteredBills.map((b, i) => (
              <TaxBillCard
                key={b.id}
                bill={b}
                index={i}
                onPress={() => handleViewBill(b)}
                onEdit={() => handleEditBill(b)}
                onDelete={() => handleDeleteBill(b)}
              />
            ))}
          </Animated.View>
        )}

        {/* Empty States */}
        {!loading && selectedCity && bills.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No Property Tax Records"
            subtitle={selectedTaxIndex ? 'No tax bills found for this index.' : 'Select a tax index to view.'}
            iconColor={scheme.textTertiary}
          />
        )}
        {!loading && !selectedCity && (
          <EmptyState
            icon={Home}
            title="Select a City"
            subtitle="Choose a city to view property tax records"
            iconColor={scheme.textTertiary}
          />
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ─── FABs ─── */}
      {selectedCity && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 76 }]}>
          <TouchableOpacity
            style={[styles.fabSecondary, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: scheme.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddConsumer(true); }}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMain, { opacity: selectedTaxIndex ? 1 : 0.5 }]}
            onPress={() => {
              if (!selectedTaxIndex) { Alert.alert('Select Tax Index', 'Please select a tax index first.'); return; }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setEditingBill(null);
              setShowAddBill(true);
            }}
          >
            <IndianRupee size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Modals ─── */}
      <Modal animationType="none" transparent visible={showAddBill} onRequestClose={() => { setShowAddBill(false); setEditingBill(null); }}>
        <AddBillModal
          visible={showAddBill}
          onClose={() => { setShowAddBill(false); setEditingBill(null); }}
          onDismissed={() => { setShowAddBill(false); setEditingBill(null); }}
          onSave={() => { setShowAddBill(false); setEditingBill(null); }}
          bill={editingBill}
          city={selectedCity}
          taxIndexNumber={selectedTaxIndex || ''}
        />
      </Modal>

      <Modal animationType="slide" transparent visible={showAddConsumer} onRequestClose={() => setShowAddConsumer(false)}>
        <AddConsumerModal
          onClose={() => setShowAddConsumer(false)}
          onSave={() => { setShowAddConsumer(false); handleCityChange(selectedCity); }}
        />
      </Modal>

      <NotifPanel visible={showNotifs} onClose={() => setShowNotifs(false)} notifs={notifications} />
    </SafeAreaView>
  );
}

/* ─── InfoItem Sub-component ─── */
function InfoItem({ icon, label, value, scheme, isDark }: {
  icon: React.ReactNode; label: string; value: string;
  scheme: ReturnType<typeof getColorScheme>; isDark: boolean;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconBg, { backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#F3F4F6' }]}>{icon}</View>
      <Text style={[styles.infoLabel, { color: scheme.textTertiary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.infoValue, { color: scheme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{value || '—'}</Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 8 : 8,
    paddingBottom: Spacing.md,
  },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  headerSub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  addIconBtn: { padding: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.fontSize.sm, paddingHorizontal: Spacing.sm },
  sortChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 32,
    justifyContent: 'center', alignItems: 'center',
  },

  infoCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  infoCardTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly' },
  infoItem: { width: '30%', alignItems: 'center', paddingVertical: Spacing.sm },
  infoIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  infoLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', marginBottom: 2 },
  infoValue: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  fabContainer: { position: 'absolute', right: Spacing.lg, bottom: 76, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  fabSecondary: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  fabMain: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.primary,
    ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }, android: { elevation: 6 } }),
  },
});
