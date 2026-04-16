/**
 * All Bills Screen — Clean, modern redesign with sort, filter & search
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ActivityIndicator, TouchableOpacity, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import {
  ChevronLeft,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Check,
  Zap,
  Home,
  Wifi,
  Car,
  Tv,
  Flame,
  FileText,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: '#D1FAE5', text: '#059669', label: 'Paid' },
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  overdue: { bg: '#FEE2E2', text: '#DC2626', label: 'Overdue' },
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'electric', label: 'Electric', icon: Zap },
  { id: 'gas', label: 'Gas', icon: Flame },
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'property', label: 'Property', icon: Home },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'appliances', label: 'Appliances', icon: Tv },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
];

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Due Date (Newest)' },
  { id: 'date_asc', label: 'Due Date (Oldest)' },
  { id: 'amount_desc', label: 'Amount (High to Low)' },
  { id: 'amount_asc', label: 'Amount (Low to High)' },
  { id: 'status', label: 'Status' },
];

export default function BillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { allBills, loading } = useDashboardData(user?.uid);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filteredBills = useMemo(() => {
    let bills = [...allBills];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      bills = bills.filter(b =>
        b.title?.toLowerCase().includes(query) ||
        b.category?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      bills = bills.filter(b => b.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      bills = bills.filter(b => (b.status ?? 'pending') === selectedStatus);
    }

    bills.sort((a, b) => {
      const aStatus = a.status ?? 'pending';
      const bStatus = b.status ?? 'pending';
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.dueDate ?? Date.now()).getTime() - new Date(a.dueDate ?? Date.now()).getTime();
        case 'date_asc':
          return new Date(a.dueDate ?? Date.now()).getTime() - new Date(b.dueDate ?? Date.now()).getTime();
        case 'amount_desc':
          return (b.amount ?? 0) - (a.amount ?? 0);
        case 'amount_asc':
          return (a.amount ?? 0) - (b.amount ?? 0);
        case 'status':
          const order: Record<string, number> = { overdue: 0, pending: 1, paid: 2, draft: 3 };
          return (order[aStatus] ?? 4) - (order[bStatus] ?? 4);
        default:
          return 0;
      }
    });

    return bills;
  }, [allBills, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const stats = useMemo(() => {
    const total = allBills.reduce((s, b) => s + (b.amount ?? 0), 0);
    const paid = allBills.filter(b => (b.status ?? 'pending') === 'paid').reduce((s, b) => s + (b.amount ?? 0), 0);
    const pending = allBills.filter(b => (b.status ?? 'pending') === 'pending').reduce((s, b) => s + (b.amount ?? 0), 0);
    const overdue = allBills.filter(b => (b.status ?? 'pending') === 'overdue').reduce((s, b) => s + (b.amount ?? 0), 0);
    return { total, paid, pending, overdue, count: allBills.length };
  }, [allBills]);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);

  const handleBillPress = (bill: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const billCategory = bill.category ?? 'electric';
    const billId = bill.id ?? '';
    
    if (!billId) return;
    
    switch (billCategory) {
      case 'electric':
        router.push(`/bill-detail?id=${billId}` as const);
        break;
      case 'gas':
        router.push(`/gas-manager/GasBillDetailScreen?id=${billId}` as const);
        break;
      case 'wifi':
        router.push(`/wifibills/WifiBillDetailScreen?id=${billId}` as const);
        break;
      case 'property':
        router.push(`/property-bill-detail?id=${billId}` as const);
        break;
      case 'vehicles':
        router.push(`/vehicle-detail?id=${billId}` as const);
        break;
      case 'appliances':
        router.push(`/appliance-detail?id=${billId}` as const);
        break;
      default:
        router.push(`/bill-detail?id=${billId}` as const);
    }
  };

  const handleApplyFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={28} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>All Bills</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchFilterRow}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Search size={18} color={scheme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: scheme.textPrimary }]}
            placeholder="Search bills..."
            placeholderTextColor={scheme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={scheme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={activeFiltersCount > 0 ? Colors.primary : scheme.textSecondary} />
          {activeFiltersCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFiltersCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={20} color={scheme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Wallet size={20} color={Colors.primary} />
          <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>Total</Text>
          <Text style={[styles.statValue, { color: scheme.textPrimary }]}>₹{stats.total.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Check size={20} color="#059669" />
          <Text style={[styles.statLabel, { color: '#059669' }]}>Paid</Text>
          <Text style={[styles.statValue, { color: '#059669' }]}>₹{stats.paid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Clock size={20} color="#D97706" />
          <Text style={[styles.statLabel, { color: '#D97706' }]}>Pending</Text>
          <Text style={[styles.statValue, { color: '#D97706' }]}>₹{stats.pending.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <AlertTriangle size={20} color="#DC2626" />
          <Text style={[styles.statLabel, { color: '#DC2626' }]}>Overdue</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>₹{stats.overdue.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: scheme.textTertiary }]}>
          {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
        </Text>
        {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const billStatus = item.status ?? 'pending';
          const statusStyle = STATUS_COLORS[billStatus] || STATUS_COLORS.pending;
          const CategoryIcon = CATEGORIES.find(c => c.id === (item.category ?? 'all'))?.icon || FileText;
          
          const consumerNum = (item as any).consumerNumber;
          const units = (item as any).totalUnits;
          const paidDate = item.paidDate ? new Date(item.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
          const billMonth = (item as any).billMonth;
          const location = (item as any).location;
          const notes = item.notes;
          
          return (
            <View 
              style={[styles.billCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.categoryIconLarge, { backgroundColor: isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.12)' }]}>
                    <CategoryIcon size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.billTitleLarge, { color: scheme.textPrimary }]} numberOfLines={2}>
                      {item.title ?? 'Untitled Bill'}
                    </Text>
                    <Text style={[styles.billMeta, { color: scheme.textTertiary }]}>
                      {item.category ?? 'Other'} {billMonth ? `• ${billMonth}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusTextLarge, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                </View>
              </View>
              
              <View style={[styles.cardDetails, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>Due Date</Text>
                    <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                  {consumerNum && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>Consumer No.</Text>
                      <Text style={[styles.detailValue, { color: scheme.textPrimary }]} numberOfLines={1}>{consumerNum}</Text>
                    </View>
                  )}
                  {units && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>Units</Text>
                      <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>{units}</Text>
                    </View>
                  )}
                  {location && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>Location</Text>
                      <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>{location}</Text>
                    </View>
                  )}
                </View>
                {notes && (
                  <Text style={[styles.notesText, { color: scheme.textTertiary }]} numberOfLines={2}>
                    {notes}
                  </Text>
                )}
              </View>
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={[styles.amountLabel, { color: scheme.textTertiary }]}>Total Amount</Text>
                  <Text style={[styles.amountLarge, { color: scheme.textPrimary }]}>
                    ₹{(item.amount ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                {billStatus !== 'paid' && (
                  <View style={[styles.payBtn, { backgroundColor: billStatus === 'overdue' ? '#FEE2E2' : '#FEF3C7' }]}>
                    <Text style={[styles.payBtnText, { color: billStatus === 'overdue' ? '#DC2626' : '#D97706' }]}>
                      {billStatus === 'overdue' ? 'Overdue' : 'Pay Now'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: scheme.textSecondary }]}>No bills found</Text>
            <Text style={[styles.emptySub, { color: scheme.textTertiary }]}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Add bills to see them here'}
            </Text>
          </View>
        }
      />

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Sort by</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalOption}
                onPress={() => {
                  setSortBy(option.id);
                  Haptics.selectionAsync();
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: scheme.textPrimary }]}>{option.label}</Text>
                {sortBy === option.id && <Check size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.filterModalContainer}>
          <Pressable style={styles.filterModalBackdrop} onPress={() => setShowFilterModal(false)} />
          <View style={[styles.filterModalContent, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
            <View style={[styles.filterModalHeader, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Filter</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.filterLabel, { color: scheme.textSecondary }]}>CATEGORY</Text>
              <View style={styles.filterChips}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
                      selectedCategory === cat.id && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <cat.icon size={14} color={selectedCategory === cat.id ? '#FFF' : scheme.textSecondary} />
                    <Text style={[styles.chipText, { color: selectedCategory === cat.id ? '#FFF' : scheme.textPrimary }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: scheme.textSecondary }]}>STATUS</Text>
              <View style={styles.filterChips}>
                {STATUS_OPTIONS.map(status => (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
                      selectedStatus === status.id && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => setSelectedStatus(status.id)}
                  >
                    <Text style={[styles.chipText, { color: selectedStatus === status.id ? '#FFF' : scheme.textPrimary }]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.filterModalFooter, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: scheme.textTertiary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: scheme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: Colors.primary }]}
                onPress={handleApplyFilter}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.card, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  filterBtn: { width: 44, height: 44, borderRadius: BorderRadius.card, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  sortBtn: { width: 44, height: 44, borderRadius: BorderRadius.card, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginTop: Spacing.md, gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.card, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  statLabel: { fontSize: 10, fontWeight: '500', marginTop: 4 },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  resultsText: { fontSize: 13 },
  clearText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  billCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.md, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 2 } }) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerInfo: { flex: 1, marginLeft: Spacing.sm },
  categoryIconLarge: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusTextLarge: { fontSize: 12, fontWeight: '700' },
  billTitleLarge: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  billMeta: { fontSize: 12 },
  cardDetails: { paddingTop: Spacing.sm, borderTopWidth: 1, marginBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  detailItem: { minWidth: 80 },
  detailLabel: { fontSize: 10, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  notesText: { fontSize: 12, marginTop: Spacing.xs, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  amountLabel: { fontSize: 11, marginBottom: 2 },
  amountLarge: { fontSize: 20, fontWeight: '700' },
  payBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  payBtnText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { fontSize: 14, marginTop: Spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 16, padding: Spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.md },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalOptionText: { fontSize: 16 },
  filterModalContainer: { flex: 1, justifyContent: 'flex-end' },
  filterModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  filterModalBody: { padding: Spacing.lg },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, letterSpacing: 0.5 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, gap: 6 },
  chipText: { fontSize: 13, fontWeight: '500' },
  filterModalFooter: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)' },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
