/**
 * Gas Management — Full Screen
 * Consumer (BP) selection, bill list, add/edit/delete, consumer management
 * Mirrors Firebase paths: pulsebox/mnglbills/{city}/{billId}
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Animated,
  Alert, ScrollView, RefreshControl, KeyboardAvoidingView, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ChevronLeft, Flame, Plus, MapPin, User,
  Calendar, CheckCircle, Clock, AlertCircle,
  X, Upload, Camera, IdCard, Phone, Search,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService, GasBillEntry, GasBillInput } from '@/src/services/FirebaseService';
import { DropdownPicker, StatCard, FormField, InfoItem } from './DropdownRow';
import GasBillCard from './GasBillCard';
import GasInfoSection from './GasInfoSection';
import GasTips from './GasTips';
import { markGasBillForEdit, pendingEdit } from './GasBillDetailScreen';
import { ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react-native';

const CITIES = ['pune', 'nashik'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020].map(String);
const STATUS_CONFIG: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: any }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.1)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock },
};

export default function GasManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBP, setSelectedBP] = useState<string | undefined>();
  const [bpNumbers, setBPNumbers] = useState<string[]>([]);
  const [bills, setBills] = useState<GasBillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [consumerInfo, setConsumerInfo] = useState<any>(null);
  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(useCallback(() => {
    setFocusTick(t => t + 1);
    // Handle return from detail (edit flag was set)
    const id = pendingEdit.current;
    if (id && bills.length > 0) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        setEditingBill(bill);
        setShowBillModal(true);
        pendingEdit.current = '';
      }
    }
  }, [bills]));

  // Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showBPModal, setShowBPModal] = useState(false);
  const [editingBill, setEditingBill] = useState<GasBillEntry | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: loading ? 0 : 1, duration: 300, useNativeDriver: true }).start();
  }, [loading]);

  // Handle city change
  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city);
    setSelectedBP(undefined);
    setBills([]);
    setConsumerInfo(null);
    const bps = await firebaseService.getGasConsumersByCity(city);
    setBPNumbers(bps);
    if (bps.length === 1) setSelectedBP(bps[0]);
  }, []);

  // Fetch bills when BP changes
  useEffect(() => {
    if (!selectedBP || !selectedCity) {
      setBills([]);
      setConsumerInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const loadInfo = async () => {
      const info = await firebaseService.getGasConsumerInfo(selectedBP);
      if (!cancelled) setConsumerInfo(info);
    };
    loadInfo();

    const unsub = firebaseService.getGasBills(selectedCity, selectedBP, (data) => {
      if (!cancelled) { setBills(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedBP, selectedCity]);

  const onRefresh = useCallback(() => {
    if (!selectedBP || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getGasConsumerInfo(selectedBP)
      .then(info => { setConsumerInfo(info); setRefreshing(false); })
      .catch(() => setRefreshing(false));
  }, [selectedBP, selectedCity]);

  // Stats
  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => {
      const a = typeof b.amountToBePaid === 'string' ? parseFloat(b.amountToBePaid.replace(/,/g, '')) : b.amountToBePaid;
      return s + (isFinite(a) ? a : 0);
    }, 0);
    const paid = bills.filter(b => b.payStatus === 'Paid').length;
    const pending = bills.filter(b => b.payStatus === 'Pending').length;
    return { total, paid, pending };
  }, [bills]);

  const displayBills = useMemo(() => {
    let result = filter === 'All' ? bills : bills.filter(b => b.payStatus === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.billGenerationMonth.toLowerCase().includes(q) ||
        b.payStatus.toLowerCase().includes(q) ||
        (b.paymentMode && b.paymentMode.toLowerCase().includes(q)) ||
        String(b.billNumber).includes(q)
      );
    }
    const getAmount = (b: GasBillEntry) => {
      const a = typeof b.amountToBePaid === 'string' ? parseFloat(b.amountToBePaid.replace(/,/g, '')) : b.amountToBePaid;
      return isFinite(a) ? a : 0;
    };
    const getOrder = (field: 'date' | 'amount') =>
      sortDir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      if (sortField === 'date') {
        return getOrder('date') * (new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
      } else {
        return getOrder('amount') * (getAmount(b) - getAmount(a));
      }
    });
    return result;
  }, [bills, filter, searchQuery, sortField, sortDir]);

  const handleViewBill = (bill: GasBillEntry) => {
    const amt = typeof bill.amountToBePaid === 'string' ? parseFloat(bill.amountToBePaid.replace(/,/g, '')) || 0 : bill.amountToBePaid;
    console.log(bill.billDocumentURL)
    router.push({
      pathname: '/gas-manager/GasBillDetailScreen',
      params: {
        billId: bill.id,
        city: selectedCity,
        bpNumber: selectedBP,
        billMonth: bill.billGenerationMonth,
        billNumber: bill.billNumber,
        prevReading: String(bill.previousReading),
        currReading: String(bill.currentReading),
        unitPrice: String(bill.unitPrice),
        billAmount: String(amt),
        payStatus: bill.payStatus,
        paymentMode: bill.paymentMode,
        billDocumentURL: bill.billDocumentURL || '',
        billFileExtension: bill.billFileExtension || '',
        billMimeType: bill.billMimeType || '',
        dueDate: bill.lastDateToPay.toISOString(),
      },
    } as any);
  };
  const handleEditBill = (bill: GasBillEntry) => { setEditingBill(bill); setShowBillModal(true); };
  const handleAddBill = () => { setEditingBill(null); setShowBillModal(true); };
  const handleDeleteBill = (bill: GasBillEntry) => {
    Alert.alert('Delete Bill', `Delete ${bill.billGenerationMonth} bill?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        try {
          await firebaseService.deleteGasBill(selectedCity, bill.id);
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };
  const onBillSaved = () => { setShowBillModal(false); setEditingBill(null); };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>
            {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Gas (MNGL)'}
          </Text>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Gas (MNGL)</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Dropdowns */}
        <View style={styles.pickersRow}>
          <DropdownPicker
            label="City"
            value={selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : ''}
            options={CITIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
            onSelect={v => handleCityChange(v.toLowerCase())}
            placeholder="Select City"
            icon={<MapPin size={16} color={selectedCity ? Colors.primary : scheme.textTertiary} />}
          />
          <DropdownPicker
            label="BP Number"
            value={selectedBP}
            options={bpNumbers}
            onSelect={v => { setSelectedBP(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            placeholder="BP No."
            disabled={!selectedCity || bpNumbers.length === 0}
            icon={<User size={16} color={selectedBP ? Colors.primary : scheme.textTertiary} />}
          />
        </View>

        {/* Consumer Info */}
        {consumerInfo && <GasInfoSection info={consumerInfo} />}

        {/* Stats */}
        {bills.length > 0 && (
          <View style={styles.statsRow}>
            <StatCard label="Total" value={`₹${stats.total.toLocaleString('en-IN')}`} color={Colors.primary} />
            <StatCard label="Paid" value={String(stats.paid)} color="#10B981" />
            <StatCard label="Pending" value={String(stats.pending)} color="#F59E0B" />
          </View>
        )}

        {/* Filter Chips */}
        {bills.length > 0 && (
          <>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterSearchBtn, {
                  backgroundColor: showSearch ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)'),
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSearch(s => !s);
                  if (showSearch) setSearchQuery('');
                }}
              >
                <Search size={12} color={showSearch ? '#FFF' : scheme.textSecondary} />
              </TouchableOpacity>
              {['All', 'Paid', 'Pending'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, {
                    backgroundColor: filter === f ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)'),
                  }]}
                  onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.filterText, { color: filter === f ? '#FFFFFF' : scheme.textSecondary }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search bar */}
            {showSearch && (
              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs }}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
                  <Search size={14} color={scheme.textTertiary} />
                  <TextInput
                    style={[styles.searchInput, { color: scheme.textPrimary }]}
                    placeholder="Search bills..."
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

            {/* Sort Controls with ASC/DESC toggle */}
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.sortDirBtn, {
                  backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : 'rgba(243,243,245,0.6)',
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                }}
              >
                {sortDir === 'asc' ? (
                  <ArrowUpNarrowWide size={14} color={Colors.primary} />
                ) : (
                  <ArrowDownWideNarrow size={14} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortChip2, {
                  backgroundColor: sortField === 'date' ? Colors.primary : 'transparent',
                }]}
                onPress={() => setSortField('date')}
              >
                <Text style={[styles.sortText, { color: sortField === 'date' ? '#FFF' : scheme.textTertiary }]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortChip2, {
                  backgroundColor: sortField === 'amount' ? Colors.primary : 'transparent',
                }]}
                onPress={() => setSortField('amount')}
              >
                <Text style={[styles.sortText, { color: sortField === 'amount' ? '#FFF' : scheme.textTertiary }]}>Amount</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Bills List */}
        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : displayBills.length === 0 && bills.length > 0 ? (
          <View style={styles.empty}><Text style={{ color: scheme.textTertiary }}>No {filter.toLowerCase()} bills</Text></View>
        ) : displayBills.length === 0 && !consumerInfo ? (
          <View style={styles.empty}>
            <Flame size={48} color={isDark ? '#333' : '#E2E8F0'} />
            <Text style={[styles.emptyTitle, { color: scheme.textSecondary }]}>No Gas Bills Yet</Text>
            <Text style={{ color: scheme.textTertiary, textAlign: 'center' }}>Select a consumer to view or add bills</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: Spacing.lg }}>
            {displayBills.map((bill: GasBillEntry) => (
              <GasBillCard
                key={bill.id}
                bill={bill}
                onViewBill={() => handleViewBill(bill)}
              />
            ))}
          </Animated.View>
        )}

        {/* Gas Tips */}
        <View style={{ height: Spacing.lg }} />
        <GasTips />
        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* FABs */}
      {selectedBP && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: isDark ? '#333' : '#FFF' }]}
            onPress={() => { setShowBPModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <User size={20} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMain, { backgroundColor: '#EF4444' }]}
            onPress={() => { handleAddBill(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bill Modal */}
      <Modal visible={showBillModal} animationType="slide" transparent onRequestClose={() => setShowBillModal(false)}>
        <BillFormModal
          bill={editingBill}
          city={selectedCity}
          BPNumber={selectedBP}
          onClose={() => { setShowBillModal(false); setEditingBill(null); }}
          onSave={onBillSaved}
        />
      </Modal>

      {/* BP Modal */}
      <Modal visible={showBPModal} animationType="slide" transparent onRequestClose={() => setShowBPModal(false)}>
        <BPModalForm
          onClose={() => setShowBPModal(false)}
          onCreated={() => {
            setShowBPModal(false);
            if (selectedCity) firebaseService.getGasConsumersByCity(selectedCity).then(setBPNumbers);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ── BP Creation Modal ───────────────────────────────────────────────────

function BPModalForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    BPNumber: '', BPName: '', registeredMobile: '',
    MeterNumber: '', location: '', city: '',
  });

  const handleCreate = async () => {
    if (!form.BPNumber || !form.city) return;
    try {
      await firebaseService.addGasConsumer(form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCreated();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; icon?: React.ReactNode }[] = [
    { key: 'BPNumber', label: 'BP Number', placeholder: 'Enter BP Number', icon: <IdCard size={14} color={scheme.textTertiary} /> },
    { key: 'BPName', label: 'BP Name', placeholder: 'Full name' },
    { key: 'registeredMobile', label: 'Mobile', placeholder: 'Registered mobile' },
    { key: 'MeterNumber', label: 'Meter No.', placeholder: 'Meter number' },
    { key: 'location', label: 'Location', placeholder: 'Area / Address' },
    { key: 'city', label: 'City', placeholder: 'pune / nashik' },
  ];

  return (
    <SafeAreaView style={styles.modalScreen}>
      <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>New BP</Text>
          <TouchableOpacity style={{ padding: 8 }} onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {fields.map(f => (
            <View key={f.key} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>{f.label}</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6', color: scheme.textPrimary, borderColor: scheme.border }]}
                value={form[f.key]}
                onChangeText={t => setForm(prev => ({ ...prev, [f.key]: t }))}
                placeholder={f.placeholder}
                placeholderTextColor={scheme.textTertiary}
              />
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} onPress={handleCreate}>
          <Text style={styles.submitBtnText}>Create BP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Bill Form Modal ─────────────────────────────────────────────────────

function BillFormModal({
  bill, city, BPNumber, onClose, onSave,
}: {
  bill: GasBillEntry | null; city: string; BPNumber?: string;
  onClose: () => void; onSave: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [selectedMonth, setSelectedMonth] = useState(
    bill?.billGenerationMonth ? (MONTHS.find(m => bill.billGenerationMonth.startsWith(m)) || '') : ''
  );
  const [selectedYear, setSelectedYear] = useState(
    bill?.billGenerationMonth ? (bill.billGenerationMonth.match(/\d{4}/)?.[0] || '') : ''
  );
  const [billNumber, setBillNumber] = useState(bill?.billNumber ? String(bill.billNumber) : '');
  const [prevReading, setPrevReading] = useState(bill?.previousReading ? String(bill.previousReading) : '');
  const [currReading, setCurrReading] = useState(bill?.currentReading ? String(bill.currentReading) : '');
  const [unitPrice, setUnitPrice] = useState(bill?.unitPrice ? String(bill.unitPrice) : '');
  const [amount, setAmount] = useState(typeof bill?.amountToBePaid === 'string' ? bill.amountToBePaid : bill?.amountToBePaid ? String(bill.amountToBePaid) : '');
  const [payStatus, setPayStatus] = useState(bill?.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill?.paymentMode || 'UPI');
  const [billCity, setBillCity] = useState(bill?.city || city);
  const [dueDate, setDueDate] = useState(bill?.lastDateToPay ? new Date(bill.lastDateToPay) : new Date());
  const [fileUri, setFileUri] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    const billGenMonth = `${selectedMonth} ${selectedYear}`;
    if (!selectedMonth || !selectedYear || !amount) return;
    setUploading(true);
    try {
      const data: GasBillInput = {
        billNumber: billNumber || '0',
        billGenerationMonth: billGenMonth,
        previousReading: parseFloat(prevReading) || 0,
        currentReading: parseFloat(currReading) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
        amountToBePaid: parseFloat(amount.replace(/,/g, '')) || 0,
        lastDateToPay: dueDate.toISOString().split('T')[0],
        payStatus,
        paymentMode,
        city: billCity,
      };
      if (bill) {
        await firebaseService.updateGasBill(city, bill.id, data, fileUri, bill.billDocumentURL);
      } else {
        await firebaseService.addGasBill(city, BPNumber || '', data, fileUri);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setUploading(false); }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: false, quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.modalScreen, { paddingTop: Math.max(insets.top, Spacing.xl), paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
        <View style={[styles.modalCardFull, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary, fontSize: Typography.fontSize.xl }]}>
              {bill ? 'Edit Bill' : 'Add Gas Bill'}
            </Text>
            <TouchableOpacity style={{ padding: 8 }} onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: Spacing.lg }}>
            {/* Bill Number */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Bill Number</Text>
            <FormField value={billNumber} onChangeText={setBillNumber} keyboardType="numeric" placeholder="0" />
            {/* Month + Year */}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <DropdownPicker label="Month" value={selectedMonth} options={MONTHS} onSelect={setSelectedMonth} placeholder="Select" />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <DropdownPicker label="Year" value={selectedYear} options={YEARS} onSelect={setSelectedYear} placeholder="Select" />
              </View>
            </View>
            {/* Readings + Unit Price */}
            <View style={styles.row3}>
              <View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Prev Reading</Text><FormField value={prevReading} onChangeText={setPrevReading} keyboardType="numeric" placeholder="0" /></View>
              <View style={{ flex: 1, marginLeft: Spacing.xs }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Curr Reading</Text><FormField value={currReading} onChangeText={setCurrReading} keyboardType="numeric" placeholder="0" /></View>
              <View style={{ flex: 1, marginLeft: Spacing.xs }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Unit Price</Text><FormField value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" placeholder="0" /></View>
            </View>
            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Amount (₹)</Text>
            <FormField value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
            {/* Due Date */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Due Date</Text>
            <DateTimePicker value={dueDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => d && setDueDate(d)} />
            {/* Pay Status */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Status</Text>
            <View style={styles.chipRow}>
              {['Paid', 'Pending'].map(s => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: payStatus === s ? cfg.color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPayStatus(s); Haptics.selectionAsync(); }}>
                    <Icon size={12} color={payStatus === s ? '#FFF' : scheme.textSecondary} />
                    <Text style={[styles.chipText, { color: payStatus === s ? '#FFF' : scheme.textSecondary }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Payment Mode */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Mode</Text>
            <View style={styles.chipRow}>
              {['Cash', 'Bank', 'UPI'].map(m => (
                <TouchableOpacity key={m} style={[styles.chip, { backgroundColor: paymentMode === m ? '#7C3AED' : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPaymentMode(m); Haptics.selectionAsync(); }}>
                  <Text style={[styles.chipText, { color: paymentMode === m ? '#FFF' : scheme.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Upload */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Bill Document</Text>
            <View style={styles.row2}>
              <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={takePhoto}>
                <Camera size={20} color={Colors.primary} />
                <Text style={[styles.uploadText, { color: Colors.primary }]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={pickFromGallery}>
                <Upload size={20} color={Colors.primary} />
                <Text style={[styles.uploadText, { color: Colors.primary }]}>{fileUri ? 'Changed' : 'Gallery'}</Text>
              </TouchableOpacity>
            </View>
            {fileUri && <Text style={{ color: '#10B981', fontSize: Typography.fontSize.xs, marginTop: 4, textAlign: 'center' }}>File selected</Text>}
            <View style={{ height: 20 }} />
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: Colors.primary, opacity: uploading ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={uploading}
          >
            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{bill ? 'Update Bill' : 'Add Bill'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  headerRight: { flex: 1 },
  headerSub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },

  pickersRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: 18, paddingBottom: Spacing.md, gap: Spacing.sm },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.xs },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  filterSearchBtn: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.fontSize.sm, paddingHorizontal: Spacing.sm },
  sortRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md, alignItems: 'center' },
  sortLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginRight: Spacing.xs },
  sortChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 28, justifyContent: 'center', alignItems: 'center' },
  sortChip2: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 28, justifyContent: 'center', alignItems: 'center' },
  sortDirBtn: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  sortText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  filterText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  billRow: { paddingHorizontal: Spacing.lg, position: 'relative' },
  deleteBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, padding: 8 },

  loadingContainer: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  empty: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.xs },

  fabContainer: { position: 'absolute', right: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  fab: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  fabMain: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  modalScreen: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalCard: { width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '80%' },
  modalCardFull: { width: '100%', height: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xxl, fontWeight: '700' },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  fieldInput: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1 },
  row2: { flexDirection: 'row', alignItems: 'flex-start' },
  row3: { flexDirection: 'row', alignItems: 'flex-start' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.lg, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  uploadText: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  submitBtn: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitBtnText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});
