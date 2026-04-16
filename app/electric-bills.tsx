/**
 * Electric Bills — Main Screen (thin, imports modular components)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator,
  TouchableOpacity, Modal, Animated, Alert, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft, Plus, MapPin, User, ArrowUpNarrowWide, ArrowDownWideNarrow, Search, X, Zap
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService, ElectricBillEntry } from '@/src/services/FirebaseService';
import BillCard from './electric-bills/BillCard';
import BillFormModal from './electric-bills/BillFormModal';
import { markBillForEdit, pendingEditBillIdRef } from './electric-bills/BillFormModal';
import ConsumerFormModal from './electric-bills/ConsumerFormModal';
import ConsumerInfoCard from './electric-bills/ConsumerInfoCard';
import ElectricBillStatCard from './electric-bills/ElectricBillStatCard';
import SearchBar from './electric-bills/SearchBar';
import DropdownPicker from './electric-bills/DropdownPicker';
import SectionHeroBanner from '@/components/SectionHeroBanner';

const CITIES = ['pune', 'nashik', 'jalgaon'];

export default function ElectricBillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedConsumer, setSelectedConsumer] = useState<string | undefined>();
  const [consumers, setConsumers] = useState<string[]>([]);
  const [bills, setBills] = useState<ElectricBillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [consumerInfo, setConsumerInfo] = useState<any>(null);

  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(useCallback(() => { setFocusTick(t => t + 1); }, []));

  // Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showConsumerModal, setShowConsumerModal] = useState(false);
  const [editingBill, setEditingBill] = useState<ElectricBillEntry | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: loading ? 0 : 1, duration: 300, useNativeDriver: true }).start();
  }, [loading]);

  // Fetch consumers when city changes
  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city);
    setSelectedConsumer(undefined);
    setBills([]);
    setConsumerInfo(null);
    const subs = await firebaseService.getConsumersByCity(city);
    setConsumers(subs);
    if (subs.length === 1) setSelectedConsumer(subs[0]);
  }, []);

  // Fetch bills+consumer info when consumer changes
  useEffect(() => {
    if (!selectedConsumer || !selectedCity) {
      setBills([]);
      setConsumerInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const loadInfo = async () => {
      const info = await firebaseService.getConsumerInfo(selectedConsumer);
      if (!cancelled) setConsumerInfo(info);
    };
    loadInfo();

    const unsub = firebaseService.getElectricBills(selectedCity, selectedConsumer, (data) => {
      if (!cancelled) { setBills(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedConsumer, selectedCity]);

  const onRefresh = useCallback(() => {
    if (!selectedConsumer || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getConsumerInfo(selectedConsumer)
      .then(info => { setConsumerInfo(info); setRefreshing(false); })
      .catch(() => setRefreshing(false));
  }, [selectedConsumer, selectedCity]);

  // Stats
  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => {
      const a = typeof b.billAmount === 'string' ? parseFloat(b.billAmount.replace(/,/g, '')) : b.billAmount;
      return s + (isFinite(a) ? a : 0);
    }, 0);
    const paid = bills.filter(b => b.payStatus === 'Paid').length;
    const pending = bills.filter(b => b.payStatus === 'Pending').length;
    return { total, paid, pending };
  }, [bills]);

  const filteredBills = useMemo(() => {
    let result = filter === 'All' ? bills : bills.filter(b => b.payStatus === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.billMonth.toLowerCase().includes(q) ||
        b.payStatus.toLowerCase().includes(q) ||
        (b.paymentMode && b.paymentMode.toLowerCase().includes(q)) ||
        b.consumerNumber.toLowerCase().includes(q)
      );
    }
    const getAmount = (b: ElectricBillEntry) => {
      const a = typeof b.billAmount === 'string' ? parseFloat(b.billAmount.replace(/,/g, '')) : b.billAmount;
      return isFinite(a) ? a : 0;
    };
    const dir = sortDir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      if (sortField === 'date') {
        return dir * (new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
      } else {
        return dir * (getAmount(b) - getAmount(a));
      }
    });
    return result;
  }, [bills, filter, searchQuery, sortField, sortDir]);

  // Actions
  const handleAddBill = () => {
    setEditingBill(null);
    setShowBillModal(true);
  };

  const onBillSaved = () => {
    setShowBillModal(false);
    setEditingBill(null);
  };

  const handleDeleteBill = (bill: ElectricBillEntry) => {
    Alert.alert('Delete Bill', `Delete ${bill.billMonth} bill?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        try { await firebaseService.deleteElectricBill(selectedCity, bill.id); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleViewBill = (bill: ElectricBillEntry) => {
    router.push({ pathname: '/bill-detail', params: {
      billId: bill.id, city: selectedCity, billMonth: bill.billMonth,
      lastReading: String(bill.lastReading), currentReading: String(bill.currentReading),
      totalUnits: String(bill.totalUnits),
      billAmount: typeof bill.billAmount === 'string' ? bill.billAmount : String(bill.billAmount),
      payStatus: bill.payStatus, paymentMode: bill.paymentMode,
      billDocumentURL: bill.billDocumentURL || '',
      lastDateToPay: bill.lastDateToPay ? bill.lastDateToPay.toISOString() : '',
      consumerNumber: bill.consumerNumber,
    }} as any);
  };

  // Open edit modal when returning from bill-detail
  React.useEffect(() => {
    if (pendingEditBillIdRef.current && bills.length > 0) {
      const bill = bills.find(b => b.id === pendingEditBillIdRef.current);
      if (bill) {
        setEditingBill(bill);
        setShowBillModal(true);
        pendingEditBillIdRef.current = '';
      }
    }
  }, [focusTick]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>
            {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Electric Bills'}
          </Text>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Electric Bills</Text>
        </View>
      </View>

      {/* Hero Banner */}
      <SectionHeroBanner
        title="Electric Bills"
        subtitle="Track and manage your electricity bills"
        stats={{ billCount: bills.length, paid: stats.paid, pending: stats.pending }}
        icon={<Zap size={22} color={Colors.primary} />}
        countLabel="bill"
      />

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Dropdowns */}
        <View style={styles.pickersRow}>
          <DropdownPicker
            label="City" value={selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : ''}
            options={CITIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
            onSelect={(v: string) => handleCityChange(v.toLowerCase())}
            placeholder="Select City" icon={<MapPin size={16} color={selectedCity ? Colors.primary : scheme.textTertiary} />}
          />
          <DropdownPicker
            label="Consumer" value={selectedConsumer} options={consumers}
            onSelect={(v) => { setSelectedConsumer(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            placeholder="Consumer" disabled={!selectedCity || consumers.length === 0}
            icon={<User size={16} color={selectedConsumer ? Colors.primary : scheme.textTertiary} />}
          />
        </View>

        {/* Consumer Info */}
        {consumerInfo && <ConsumerInfoCard info={consumerInfo} />}

        {/* Stats */}
        {bills.length > 0 && (
          <View style={styles.statsRow}>
            <ElectricBillStatCard label="Total" value={`₹${stats.total.toLocaleString('en-IN')}`} color={Colors.primary} />
            <ElectricBillStatCard label="Paid" value={String(stats.paid)} color={Colors.statusPaid} />
            <ElectricBillStatCard label="Pending" value={String(stats.pending)} color={Colors.statusPending} />
          </View>
        )}

        {/* Filters + Search + Sort */}
        {bills.length > 0 && (
          <>
            <View style={styles.filterRow}>
              <TouchableOpacity style={[styles.filterSearchBtn, { backgroundColor: showSearch ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)') }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSearch(s => !s); if (showSearch) setSearchQuery(''); }}>
                <Search size={12} color={showSearch ? '#FFF' : scheme.textSecondary} />
              </TouchableOpacity>
              {['All', 'Paid', 'Pending', 'Overdue'].map(f => (
                <TouchableOpacity key={f} style={[styles.filterChip, { backgroundColor: filter === f ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)') }]}
                  onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[styles.filterText, { color: filter === f ? '#FFFFFF' : scheme.textSecondary }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {showSearch && (
              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs }}>
                <SearchBar query={searchQuery} onChangeQuery={setSearchQuery} onClear={() => setSearchQuery('')} />
              </View>
            )}

            <View style={styles.sortRow}>
              <TouchableOpacity style={[styles.sortDirBtn, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : 'rgba(243,243,245,0.6)' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                {sortDir === 'asc' ? <ArrowUpNarrowWide size={14} color={Colors.primary} /> : <ArrowDownWideNarrow size={14} color={Colors.primary} />}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sortChip2, { backgroundColor: sortField === 'date' ? Colors.primary : 'transparent' }]} onPress={() => setSortField('date')}>
                <Text style={[styles.sortText, { color: sortField === 'date' ? '#FFF' : scheme.textTertiary }]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sortChip2, { backgroundColor: sortField === 'amount' ? Colors.primary : 'transparent' }]} onPress={() => setSortField('amount')}>
                <Text style={[styles.sortText, { color: sortField === 'amount' ? '#FFF' : scheme.textTertiary }]}>Amount</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Bills List */}
        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : filteredBills.length === 0 && bills.length > 0 ? (
          <View style={styles.empty}><Text style={{ color: scheme.textTertiary }}>No {filter.toLowerCase()} bills</Text></View>
        ) : filteredBills.length === 0 ? (
          <View style={styles.empty}>
            <Zap size={48} color={isDark ? '#333' : '#E2E8F0'} />
            <Text style={[styles.emptyTitle, { color: scheme.textSecondary }]}>No Bills Yet</Text>
            <Text style={{ color: scheme.textTertiary, textAlign: 'center' }}>Select a consumer to view or add bills</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: Spacing.lg }}>
            {filteredBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} onViewBill={() => handleViewBill(bill)} />
            ))}
          </Animated.View>
        )}

        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* FABs */}
      {selectedConsumer && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: isDark ? '#333' : '#FFF' }]}
            onPress={() => { setShowConsumerModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
            <User size={20} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fabMain, { backgroundColor: Colors.primary }]}
            onPress={() => { handleAddBill(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bill Modal */}
      <Modal visible={showBillModal} animationType="slide" transparent onRequestClose={() => setShowBillModal(false)}>
        <BillFormModal bill={editingBill} city={selectedCity} consumerNumber={selectedConsumer}
          onClose={() => { setShowBillModal(false); setEditingBill(null); }} onSave={onBillSaved} />
      </Modal>

      {/* Consumer Modal */}
      <Modal visible={showConsumerModal} animationType="slide" transparent onRequestClose={() => setShowConsumerModal(false)}>
        <ConsumerFormModal onClose={() => setShowConsumerModal(false)} onCreated={() => {
          setShowConsumerModal(false);
          if (selectedCity) firebaseService.getConsumersByCity(selectedCity).then(setConsumers);
        }} />
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  headerRight: { flex: 1 },
  headerSub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },

  pickersRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: 18, paddingBottom: Spacing.md, gap: Spacing.sm },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md, alignItems: 'center' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  filterText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  filterSearchBtn: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  sortRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md, alignItems: 'center' },
  sortDirBtn: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  sortChip2: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 28, justifyContent: 'center', alignItems: 'center' },
  sortText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  loadingContainer: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  empty: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.xs },

  fabContainer: { position: 'absolute', right: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  fab: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  fabMain: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }, android: { elevation: 6 } }) },
});
