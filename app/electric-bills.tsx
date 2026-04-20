/**
 * Electric Bills — Main Screen (thin, imports modular components)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator,
  TouchableOpacity, Modal, Animated, Alert, ScrollView, RefreshControl, Pressable
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  ChevronLeft, Plus, MapPin, User, ArrowUpNarrowWide, ArrowDownWideNarrow, Search, X, Zap, Download
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingBill, setEditingBill] = useState<ElectricBillEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedExportMonth, setSelectedExportMonth] = useState<string[]>([]);
  const [selectedExportYear, setSelectedExportYear] = useState(String(new Date().getFullYear()));
  const [selectedExportCity, setSelectedExportCity] = useState('all');

  const toggleMonth = (monthId: string) => {
    if (monthId === 'all') {
      setSelectedExportMonth([]);
    } else {
      setSelectedExportMonth(prev => 
        prev.includes(monthId) 
          ? prev.filter(m => m !== monthId)
          : [...prev, monthId]
      );
    }
  };

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

  const handleExport = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const filtered = bills.filter(b => {
        if (selectedExportCity !== 'all' && b.consumerCity?.toLowerCase() !== selectedExportCity) return false;
        
        if (selectedExportMonth.length > 0) {
          const billDate = b.billMonth || '';
          const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
          const billMonthIdx = months.findIndex(m => billDate.toLowerCase().startsWith(m));
          const billMonth = String(billMonthIdx + 1).padStart(2, '0');
          if (!selectedExportMonth.includes(billMonth)) return false;
        }
        
        if (selectedExportYear) {
          const billDate = b.billMonth || '';
          const yearMatch = billDate.match(/\d{4}/);
          if (yearMatch && yearMatch[0] !== selectedExportYear) return false;
        }
        
        return true;
      });

      const monthsLabel = selectedExportMonth.length > 0 
        ? selectedExportMonth.map(m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]).join('-')
        : 'All-Year';
      const cityLabel = selectedExportCity === 'all' ? 'AllCities' : selectedExportCity.charAt(0).toUpperCase() + selectedExportCity.slice(1);
      const fileName = `Electric_Bills_${cityLabel}_${selectedExportYear}_${monthsLabel}.pdf`;

      const totalAmount = filtered.reduce((sum, b) => {
        const amt = typeof b.billAmount === 'string' ? parseFloat(b.billAmount.replace(/,/g, '')) : b.billAmount;
        return sum + (isFinite(amt) ? amt : 0);
      }, 0);

      const paidCount = filtered.filter(b => b.payStatus === 'Paid').length;
      const pendingCount = filtered.filter(b => b.payStatus === 'Pending').length;

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
              .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #7C3AED; }
              .header h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
              .header p { color: #666; font-size: 14px; }
              .summary { display: flex; justify-content: space-around; margin-bottom: 24px; }
              .summary-card { background: #f5f3ff; padding: 16px; border-radius: 12px; text-align: center; flex: 1; margin: 0 4px; }
              .summary-card .label { font-size: 12px; color: #666; }
              .summary-card .value { font-size: 18px; font-weight: bold; color: #7C3AED; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background: #7C3AED; color: white; padding: 10px; text-align: left; font-weight: 600; }
              td { border-bottom: 1px solid #e5e5e5; padding: 10px; }
              tr:nth-child(even) { background: #fafafa; }
              .status-paid { color: #10B981; font-weight: 600; }
              .status-pending { color: #F59E0B; font-weight: 600; }
              .footer { margin-top: 24px; text-align: center; color: #999; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚡ Electric Bills</h1>
              <p>${selectedExportYear}${selectedExportMonth.length > 0 ? ` - ${selectedExportMonth.join('-')}` : ' - All Months'}</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="label">Total Bills</div>
                <div class="value">${filtered.length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Amount</div>
                <div class="value">₹${totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div class="summary-card">
                <div class="label">Paid</div>
                <div class="value">${paidCount}</div>
              </div>
              <div class="summary-card">
                <div class="label">Pending</div>
                <div class="value">${pendingCount}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Consumer No.</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length > 0 ? filtered.map(b => `
                  <tr>
                    <td>${b.billMonth || '-'}</td>
                    <td>${b.consumerNumber || '-'}</td>
                    <td>₹${b.billAmount || '-'}</td>
                    <td>${b.lastDateToPay ? new Date(b.lastDateToPay).toLocaleDateString('en-IN') : '-'}</td>
                    <td class="status-${b.payStatus?.toLowerCase()}">${b.payStatus || '-'}</td>
                    <td>${b.paymentMode || '-'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="text-align:center;">No bills found</td></tr>'}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Generated by Pulsebox on ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Electric Bills',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Export Complete', `PDF "${fileName}" has been generated and is ready to share.`);
      } else {
        Alert.alert('Export Complete', `PDF saved to:\n${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
    
    setExporting(false);
    setShowExportModal(false);
  };

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
    <View style={[styles.screen, { backgroundColor: isDark ? Colors.darkBackground : '#F2F2F7' }]}>
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
        <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExportModal(true)}>
          <Download size={22} color={Colors.primary} />
        </TouchableOpacity>
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

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="slide" transparent onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayBg} onPress={() => setShowExportModal(false)} />
          <View style={[styles.exportModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.exportModalHeader}>
              <Text style={[styles.exportModalTitle, { color: scheme.textPrimary }]}>Export Electric Bills</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={scheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.exportModalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT YEAR</Text>
              <View style={styles.exportChips}>
                {[2026, 2025, 2024, 2023, 2022].map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportYear === String(year) && { backgroundColor: Colors.primary }]}
                    onPress={() => setSelectedExportYear(String(year))}
                  >
                    <Text style={[styles.exportChipText, { color: selectedExportYear === String(year) ? '#FFF' : scheme.textPrimary }]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT CITY</Text>
              <View style={styles.exportChips}>
                {['all', 'pune', 'nashik', 'jalgaon'].map(city => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportCity === city && { backgroundColor: Colors.primary }]}
                    onPress={() => setSelectedExportCity(city)}
                  >
                    <Text style={[styles.exportChipText, { color: selectedExportCity === city ? '#FFF' : scheme.textPrimary }]}>
                      {city === 'all' ? 'All Cities' : city.charAt(0).toUpperCase() + city.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT MONTH (Select multiple)</Text>
              <View style={styles.exportChips}>
                <TouchableOpacity
                  style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportMonth.length === 0 && { backgroundColor: Colors.primary }]}
                  onPress={() => toggleMonth('all')}
                >
                  <Text style={[styles.exportChipText, { color: selectedExportMonth.length === 0 ? '#FFF' : scheme.textPrimary }]}>All</Text>
                </TouchableOpacity>
                {[
                  { id: '01', label: 'Jan' }, { id: '02', label: 'Feb' }, { id: '03', label: 'Mar' },
                  { id: '04', label: 'Apr' }, { id: '05', label: 'May' }, { id: '06', label: 'Jun' },
                  { id: '07', label: 'Jul' }, { id: '08', label: 'Aug' }, { id: '09', label: 'Sep' },
                  { id: '10', label: 'Oct' }, { id: '11', label: 'Nov' }, { id: '12', label: 'Dec' },
                ].map(month => (
                  <TouchableOpacity
                    key={month.id}
                    style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportMonth.includes(month.id) && { backgroundColor: Colors.primary }]}
                    onPress={() => toggleMonth(month.id)}
                  >
                    <Text style={[styles.exportChipText, { color: selectedExportMonth.includes(month.id) ? '#FFF' : scheme.textPrimary }]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.exportModalFooter}>
              <TouchableOpacity style={[styles.exportBtn2, { backgroundColor: Colors.primary }]} onPress={handleExport} disabled={exporting}>
                {exporting ? <ActivityIndicator size="small" color="#FFF" /> : <><Download size={20} color="#FFF" /><Text style={styles.exportBtnText}>Export PDF</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  exportBtn: { padding: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  exportModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  exportModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  exportModalTitle: { fontSize: 20, fontWeight: '700' },
  exportModalBody: { padding: Spacing.lg },
  exportLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, letterSpacing: 0.5 },
  exportChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  exportChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, gap: 6 },
  exportChipText: { fontSize: 13, fontWeight: '500' },
  exportModalFooter: { padding: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)' },
  exportBtn2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: 12, gap: Spacing.sm },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
