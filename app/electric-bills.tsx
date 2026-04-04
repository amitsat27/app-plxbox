/**
 * Electric Bills — Full Module
 * Consumer selection, bill list, add/edit/delete, consumer management
 * Mirrors Firebase paths from reference: pulsebox/electricbills/{city}/{billId}
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Animated, Dimensions, Keyboard,
  Alert, ScrollView, RefreshControl, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft, Zap, Plus, Filter, MapPin, User,
  CreditCard, Droplets, Building2, Phone, Calendar,
  CheckCircle, Clock, AlertCircle,
  ChevronDown, X, Upload, Camera
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService, ElectricBillEntry, ElectricBillInput } from '@/src/services/FirebaseService';

const { width: SCREEN_W } = Dimensions.get('window');
const CITIES = ['pune', 'nashik', 'jalgaon'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = [2026,2025,2024,2023,2022,2021,2020].map(String);
const STATUS_CONFIG: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: any }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.1)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.1)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle },
};

// ── Dropdown Picker ──────────────────────────────────────────────────────

function DropdownPicker({
  label, value, options, onSelect, placeholder, disabled, icon
}: {
  label: string; value?: string; options: string[];
  onSelect: (v: string) => void; placeholder: string; disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [open, setOpen] = useState(false);
  const isSelected = !!value;


  return (
    <View style={styles.dropdownWrapper}>
      <Text style={[styles.dropdownLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownBtn, {
          backgroundColor: isSelected
            ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)')
            : (isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB'),
          borderColor: open
            ? Colors.primary
            : (isSelected ? Colors.primary + '40' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')),
          borderWidth: 1.5,
        }]}
        onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(!open); } }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <View style={styles.dropdownIconContainer}>{icon}</View>}
        <Text style={[styles.dropdownValue, {
          color: isSelected ? scheme.textPrimary : scheme.textTertiary,
          fontWeight: isSelected ? '600' : '400',
          fontSize: Typography.fontSize.sm,
        }]} numberOfLines={1} ellipsizeMode="tail">
          {isSelected ? value : placeholder}
        </Text>
        <Animated.View style={styles.dropdownArrow}>
          <ChevronDown
            size={14}
            color={isSelected ? Colors.primary : scheme.textTertiary}
          />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdownList, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: scheme.border,
          borderWidth: 1,
        }]}>
          {options.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <MapPin size={18} color={scheme.textTertiary} />
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>
                No consumers found
              </Text>
            </View>
          ) : (
            options.map((o) => {
              const selected = value === o;
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.dropdownItem, {
                    backgroundColor: selected ? Colors.primary + '10' : 'transparent',
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }]}
                  onPress={() => { onSelect(o); setOpen(false); Haptics.selectionAsync(); }}
                >
                  <View style={styles.dropdownItemLeft}>
                    <Text style={[styles.dropdownItemText, {
                      color: selected ? Colors.primary : scheme.textPrimary,
                      fontWeight: selected ? '600' : '400',
                    }]} numberOfLines={1} ellipsizeMode="tail">{o}</Text>
                  </View>
                  {selected && <CheckCircle size={16} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ── Stats Card ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const icon = <Zap size={16} color={color} />;

  return (
    <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#FFFFFF' }]}>
      <View style={styles.statIconRow}>
        <View style={[styles.statIconCircle, { backgroundColor: isDark ? `${color}18` : `${color}10` }]}>{icon}</View>
        <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{value}</Text>
      {sub && <Text style={[styles.statSub, { color: scheme.textTertiary }]}>{sub}</Text>}
    </View>
  );
}

// ── Bill Card ────────────────────────────────────────────────────────────

function BillCard({ bill, onPress }: { bill: ElectricBillEntry; onPress: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scale = useRef(new Animated.Value(1)).current;
  const StatusIcon = STATUS_CONFIG[bill.payStatus]?.icon || Clock;
  const statusCfg = STATUS_CONFIG[bill.payStatus] || STATUS_CONFIG.Pending;
  const amt = typeof bill.billAmount === 'string' ? parseFloat(bill.billAmount.replace(/,/g, '')) || 0 : bill.billAmount;
  const dueDate = bill.lastDateToPay ? new Date(bill.lastDateToPay) : null;
  const isExpired = dueDate && dueDate < new Date() && bill.payStatus !== 'Paid';

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 25, stiffness: 300 }).start();
  const onPressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 25, stiffness: 300 }).start(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={[styles.billCard, {
          backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#FFFFFF',
          borderLeftWidth: 3,
          borderLeftColor: statusCfg.color,
        }]}>
          {/* Top row: status + month + amount */}
          <View style={styles.billCardTop}>
            <View style={styles.billCardLeft}>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgTint[isDark ? 'dark' : 'light'] }]}>
                <StatusIcon size={12} color={statusCfg.color} />
                <Text style={[styles.statusText, { color: statusCfg.color }]}>{bill.payStatus}</Text>
              </View>
              <Text style={[styles.billMonth, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.billMonth}</Text>
            </View>
            <Text style={[styles.billAmount, { color: scheme.textPrimary }]}>₹{amt.toLocaleString('en-IN')}</Text>
          </View>

          {/* Row separator */}
          <View style={[styles.billDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

          {/* Middle row: readings + consumption */}
          <View style={styles.billCardMiddle}>
            <View style={styles.readingBlock}>
              <Text style={[styles.readingLabel, { color: scheme.textTertiary }]}>Consumption</Text>
              <Text style={[styles.readingValue, { color: scheme.textPrimary }]}>{bill.totalUnits} <Text style={styles.readingUnit}>units</Text></Text>
            </View>
            <View style={styles.readingDividerV} />
            <View style={styles.readingBlock}>
              <Text style={[styles.readingLabel, { color: scheme.textTertiary }]}>Readings</Text>
              <Text style={[styles.readingValue, { color: scheme.textSecondary }]}>{bill.lastReading} → {bill.currentReading}</Text>
            </View>
            <View style={styles.readingDividerV} />
            <View style={styles.readingBlock}>
              <Text style={[styles.readingLabel, { color: scheme.textTertiary }]}>Consumer</Text>
              <Text style={[styles.readingValue, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.consumerNumber || '—'}</Text>
            </View>
          </View>

          {/* Bottom row: due date + payment mode */}
          <View style={styles.billCardFooter}>
            <View style={styles.footerItem}>
              <Calendar size={12} color={scheme.textTertiary} />
              <Text style={[styles.footerText, { color: isExpired ? '#EF4444' : scheme.textTertiary }]}>
                {dueDate ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>
            {bill.paymentMode && (
              <>
                <View style={[styles.footerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={styles.footerItem}>
                  <CreditCard size={12} color={scheme.textTertiary} />
                  <Text style={[styles.footerText, { color: scheme.textTertiary }]}>{bill.paymentMode}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Shared state for edit-from-detail ────────────────────────────────────
const pendingEditBillIdRef = { current: '' as string };
export function markBillForEdit(id: string) {
  console.log('[edit] markBillForEdit called with:', id);
  pendingEditBillIdRef.current = id;
}

// ── MAIN SCREEN ──────────────────────────────────────────────────────────

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
  const [consumerInfo, setConsumerInfo] = useState<any>(null);
  // Trigger re-eval when screen comes back into focus
  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(
    React.useCallback(() => { setFocusTick(t => t + 1); }, [])
  );

  // Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showConsumerModal, setShowConsumerModal] = useState(false);
  const [editingBill, setEditingBill] = useState<ElectricBillEntry | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: loading ? 0 : 1, duration: 300, useNativeDriver: true }).start();
  }, [loading]);

  // Fetch consumers when city changes — from both registry and actual bill records
  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city);
    setSelectedConsumer(undefined);
    setBills([]);
    setConsumerInfo(null);

    const subs = await firebaseService.getConsumersByCity(city);
    setConsumers(subs);
    // Auto-select when only 1 consumer found
    if (subs.length === 1) {
      setSelectedConsumer(subs[0]);
    }
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
      if (!cancelled) {
        setBills(data);
        setLoading(false);
      }
    });

    // unsub.then((unsubscribe: () => void) => unsubscribe());
    return () => { cancelled = true; };
  }, [selectedConsumer, selectedCity]);

  const onRefresh = useCallback(() => {
    if (!selectedConsumer || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getConsumerInfo(selectedConsumer)
      .then(info => { setConsumerInfo(info); setRefreshing(false); })
      .catch(() => setRefreshing(false));
  }, [selectedConsumer, selectedCity]);

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => {
      const a = typeof b.billAmount === 'string' ? parseFloat(b.billAmount.replace(/,/g, '')) : b.billAmount;
      return s + (isFinite(a) ? a : 0);
    }, 0);
    const paid = bills.filter(b => b.payStatus === 'Paid').length;
    const pending = bills.filter(b => b.payStatus === 'Pending').length;
    return { total, paid, pending };
  }, [bills]);

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.payStatus === filter);

  // ── Consumer Actions ───────────────────────────────────────────────────
  const handleDeleteBill = (bill: ElectricBillEntry) => {
    Alert.alert('Delete Bill', `Delete ${bill.billMonth} bill?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        try {
          await firebaseService.deleteElectricBill(selectedCity, bill.id);
          // The real-time listener will update the UI
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  const handleViewBill = (bill: ElectricBillEntry) => {
    router.push({ pathname: '/bill-detail', params: {
      billId: bill.id,
      city: selectedCity,
      billMonth: bill.billMonth,
      lastReading: String(bill.lastReading),
      currentReading: String(bill.currentReading),
      totalUnits: String(bill.totalUnits),
      billAmount: typeof bill.billAmount === 'string' ? bill.billAmount : String(bill.billAmount),
      payStatus: bill.payStatus,
      paymentMode: bill.paymentMode,
      billDocumentURL: bill.billDocumentURL || '',
      lastDateToPay: bill.lastDateToPay ? bill.lastDateToPay.toISOString() : '',
      consumerNumber: bill.consumerNumber,
  }} as any);
  };

  const handleAddBill = () => {
    setEditingBill(null);
    setShowBillModal(true);
  };

  const handleEditBill = (bill: ElectricBillEntry) => {
    setEditingBill(bill);
    setShowBillModal(true);
  };

  const onBillSaved = () => {
    setShowBillModal(false);
    setEditingBill(null);
  };

  // Open edit modal when returning from bill-detail
  React.useEffect(() => {
    const id = pendingEditBillIdRef.current;
    console.log('[edit] focusTick effect:', id, 'bills.length:', bills.length);
    if (id && bills.length > 0) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        console.log('[edit] OPENING EDIT MODAL');
        handleEditBill(bill);
        pendingEditBillIdRef.current = '';
      } else {
        console.log('[edit] BILL NOT FOUND in bills array');
      }
    }
  }, [focusTick]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
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
            onSelect={(v) => handleCityChange(v.toLowerCase())}
            placeholder="Select City"
            icon={<MapPin size={16} color={selectedCity ? Colors.primary : scheme.textTertiary} />}
          />
          <DropdownPicker
            label="Consumer"
            value={selectedConsumer}
            options={consumers}
            onSelect={(v) => { setSelectedConsumer(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            placeholder="Consumer"
            disabled={!selectedCity || consumers.length === 0}
            icon={<User size={16} color={selectedConsumer ? Colors.primary : scheme.textTertiary} />}
          />
        </View>

        {/* Consumer Info */}
        {consumerInfo && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFFFFF' }]}>
            <View style={styles.infoGrid}>
              <InfoItem icon={<CreditCard size={18} color="#A78BFA" />} label="Consumer" value={consumerInfo.consumerNumber} />
              <InfoItem icon={<MapPin size={18} color="#F59E0B" />} label="Location" value={consumerInfo.location} />
              <InfoItem icon={<User size={18} color="#10B981" />} label="Holder" value={consumerInfo.holderName} />
              <InfoItem icon={<Building2 size={18} color="#06B6D4" />} label="Billing Unit" value={consumerInfo.billingUnitNumber} />
              <InfoItem icon={<Phone size={18} color="#EC4899" />} label="Mobile" value={consumerInfo.registeredMobile} />
              <InfoItem icon={<Zap size={18} color="#7C3AED" />} label="Area" value={consumerInfo.area} />
            </View>
          </View>
        )}

        {/* Stats */}
        {bills.length > 0 && (
          <View style={styles.statsRow}>
            <StatCard label="Total" value={`₹${stats.total.toLocaleString('en-IN')}`} color={Colors.primary} />
            <StatCard label="Paid" value={String(stats.paid)} color={Colors.statusPaid} />
            <StatCard label="Pending" value={String(stats.pending)} color={Colors.statusPending} />
          </View>
        )}

        {/* Filter Chips */}
        {bills.length > 0 && (
          <View style={styles.filterRow}>
            {['All', 'Paid', 'Pending', 'Overdue'].map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, {
                  backgroundColor: filter === f ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)'),
                }]}
                onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.filterText, { color: filter === f ? '#FFFFFF' : scheme.textSecondary }]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
              <BillCard key={bill.id} bill={bill} onPress={() => handleViewBill(bill)} />
            ))}
          </Animated.View>
        )}

        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* FABs */}
      {selectedConsumer && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: isDark ? '#333' : '#FFF' }]}
            onPress={() => { setShowConsumerModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <User size={20} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMain, { backgroundColor: Colors.primary }]}
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
          consumerNumber={selectedConsumer}
          onClose={() => { setShowBillModal(false); setEditingBill(null); }}
          onSave={onBillSaved}
        />
      </Modal>

      {/* Consumer Modal */}
      <Modal visible={showConsumerModal} animationType="slide" transparent onRequestClose={() => setShowConsumerModal(false)}>
        <ConsumerModal
          onClose={() => setShowConsumerModal(false)}
          onCreated={() => {
            setShowConsumerModal(false);
            if (selectedCity) {
              firebaseService.getConsumersByCity(selectedCity).then(setConsumers);
            }
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ── Info Item ────────────────────────────────────────────────────────────
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>{icon}</View>
      <Text style={[styles.infoLabel, { color: scheme.textTertiary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.infoValue, { color: scheme.textPrimary }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

// ── Reusable modal TextInput ────────────────────────────────────────────
function FormField({ value, onChangeText, keyboardType, placeholder, editable, style }: {
  value: string; onChangeText: (t: string) => void; keyboardType?: any;
  placeholder?: string; editable?: boolean; style?: any;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={[styles.field, style]}>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6', color: scheme.textPrimary, borderColor: scheme.border, opacity: editable === false ? 0.6 : 1 }]}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary} editable={editable}
      />
    </View>
  );
}

// ── Consumer Modal ───────────────────────────────────────────────────────
function ConsumerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [form, setForm] = useState({
    consumerNumber: '', location: '', billingUnitNumber: '',
    holderName: '', area: '', registeredMobile: '', consumerCity: '',
  });

  const handleCreate = async () => {
    if (!form.consumerNumber || !form.consumerCity) return;
    try {
      await firebaseService.addConsumer(form as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCreated();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const keys = Object.keys(form).filter(k => k !== 'consumerCity') as Array<keyof typeof form>;
  const labels = ['Consumer Number', 'Location', 'Billing Unit Number', 'Holder Name', 'Area', 'Registered Mobile'];

  return (
    <SafeAreaView style={styles.modalScreen}>
      <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>New Consumer</Text>
          <TouchableOpacity onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {keys.map((k, i) => (
            <View key={k} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>{labels[i]}</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6', color: scheme.textPrimary, borderColor: scheme.border }]}
                value={form[k]}
                onChangeText={t => setForm(f => ({ ...f, [k]: t }))}
                placeholder={labels[i]}
                placeholderTextColor={scheme.textTertiary}
              />
            </View>
          ))}
          <DropdownPicker
            label="City"
            value={form.consumerCity.length > 0 ? form.consumerCity.charAt(0).toUpperCase() + form.consumerCity.slice(1) : ''}
            options={CITIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
            onSelect={v => setForm(f => ({ ...f, consumerCity: v.toLowerCase() }))}
            placeholder="Select City"
            icon={<MapPin size={16} color={form.consumerCity ? Colors.primary : scheme.textTertiary} />}
          />
        </ScrollView>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.primary }]} onPress={handleCreate}>
          <Text style={styles.submitBtnText}>Create Consumer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Bill Form Modal ────────────────────────────────────────────────────────────
function BillFormModal({
  bill, city, consumerNumber, onClose, onSave,
}: {
  bill: ElectricBillEntry | null; city: string; consumerNumber?: string;
  onClose: () => void; onSave: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [selectedMonth, setSelectedMonth] = useState(bill?.billMonth ? MONTHS.find(m => bill.billMonth.startsWith(m)) || '' : '');
  const [selectedYear, setSelectedYear] = useState(bill?.billMonth ? (bill.billMonth.match(/\d{4}/)?.[0] || '') : '');
  const [lastReading, setLastReading] = useState(bill?.lastReading ? String(bill.lastReading) : '');
  const [currentReading, setCurrentReading] = useState(bill?.currentReading ? String(bill.currentReading) : '');
  const [totalUnits, setTotalUnits] = useState(bill?.totalUnits ? String(bill.totalUnits) : '');
  const [billAmount, setBillAmount] = useState(bill?.billAmount || '');
  const [payStatus, setPayStatus] = useState(bill?.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill?.paymentMode || 'UPI');
  const [dueDate, setDueDate] = useState(bill?.lastDateToPay || new Date());
  const [fileUri, setFileUri] = useState<string>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const l = parseFloat(lastReading) || 0;
    const c = parseFloat(currentReading) || 0;
    setTotalUnits(String(Math.max(0, c - l)));
  }, [lastReading, currentReading]);

  const handleSubmit = async () => {
    const billMonth = `${selectedMonth} ${selectedYear}`;
    if (!selectedMonth || !selectedYear || !billAmount) return;
    setUploading(true);
    try {
      const data: ElectricBillInput = {
        billMonth, lastReading: parseFloat(lastReading) || 0,
        currentReading: parseFloat(currentReading) || 0,
        totalUnits: parseFloat(totalUnits) || 0,
        billAmount: parseFloat(billAmount.replace(/,/g, '')) || 0,
        lastDateToPay: dueDate.toISOString().split('T')[0],
        payStatus, paymentMode,
      };
      if (bill) {
        await firebaseService.updateElectricBill(city, bill.id, data, fileUri, bill.billDocumentURL);
      } else {
        await firebaseService.addElectricBill(city, consumerNumber || '', data, fileUri);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setUploading(false); }
  };

  const pickFile = async () => {
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
          <Text style={[styles.modalTitle, { color: scheme.textPrimary, fontSize: Typography.fontSize.xl }]}>{bill ? 'Edit Bill' : 'Add Electric Bill'}</Text>
          <TouchableOpacity style={{ padding: 8 }} onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: Spacing.lg }}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <DropdownPicker label="Month" value={selectedMonth} options={MONTHS} onSelect={setSelectedMonth} placeholder="Select" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <DropdownPicker label="Year" value={selectedYear} options={YEARS} onSelect={setSelectedYear} placeholder="Select" />
            </View>
          </View>
          {/* Readings row */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Last Reading</Text><FormField value={lastReading} onChangeText={setLastReading} keyboardType="numeric" placeholder="0" /></View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Current Reading</Text><FormField value={currentReading} onChangeText={setCurrentReading} keyboardType="numeric" placeholder="0" /></View>
          </View>
          {/* Units + Amount */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Total Units</Text><FormField value={totalUnits} onChangeText={setTotalUnits} editable={false} /></View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}><Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Amount (₹)</Text><FormField value={billAmount} onChangeText={setBillAmount} keyboardType="numeric" placeholder="0" /></View>
          </View>
          {/* Due Date */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Due Date</Text>
          <DateTimePicker value={dueDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => d && setDueDate(d)} />
          {/* Status */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Status</Text>
          <View style={styles.chipRow}>
            {['Paid', 'Pending'].map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: payStatus === s ? STATUS_CONFIG[s].color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPayStatus(s); Haptics.selectionAsync(); }}>
                {React.createElement(STATUS_CONFIG[s].icon, { size: 12, color: payStatus === s ? '#FFF' : scheme.textSecondary })}
                <Text style={[styles.chipText, { color: payStatus === s ? '#FFF' : scheme.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
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
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6', justifyContent: 'center' }]} onPress={takePhoto}>
              <Camera size={20} color={Colors.primary} />
              <Text style={[styles.uploadText, { color: Colors.primary }]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6', justifyContent: 'center' }]} onPress={pickFile}>
              <Upload size={20} color={Colors.primary} />
              <Text style={[styles.uploadText, { color: Colors.primary }]}>{fileUri ? 'Changed' : 'Gallery'}</Text>
            </TouchableOpacity>
          </View>
          {fileUri && <Text style={{ color: '#10B981', fontSize: Typography.fontSize.xs, marginTop: 4, textAlign: 'center' }}>File selected</Text>}
          <View style={{ height: 20 }} />
        </ScrollView>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.primary, opacity: uploading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{bill ? 'Update Bill' : 'Add Bill'}</Text>}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  headerRight: { flex: 1 },
  headerSub: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },

  pickersRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: 18, paddingBottom: Spacing.md, gap: Spacing.sm },
  dropdownWrapper: { flex: 1 },
  dropdownLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, height: 52 },
  dropdownIconContainer: { marginRight: 10 },
  dropdownValue: { fontSize: Typography.fontSize.sm, fontWeight: '500', flex: 1, marginRight: 8 },
  dropdownArrow: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dropdownEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  dropdownList: { position: 'absolute', top: 72, left: 0, right: 0, borderRadius: 14, borderWidth: 1, zIndex: 10, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 8 } }) },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, minHeight: 44 },
  dropdownItemLeft: { flex: 1, minWidth: 0 },
  dropdownItemText: { fontSize: Typography.fontSize.sm },

  infoCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderRadius: 20, padding: Spacing.lg + 2, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } }) },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly' },
  infoItem: { width: '30%', paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  infoIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2, textAlign: 'center' },
  infoValue: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: BorderRadius.card, padding: Spacing.md, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }) },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  statIconCircle: { width: 24, height: 24, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: Typography.fontSize.xs },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
  statSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  filterText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  billCard: { borderRadius: 20, padding: Spacing.sm, marginVertical: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  billCardAnimated: {},
  billCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  billCardLeft: { flex: 1, minWidth: 0 },
  billCardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xs },
  billCardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: 'transparent' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.badge, alignSelf: 'flex-start', marginBottom: 4 },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  billMonth: { fontSize: Typography.fontSize.md, fontWeight: '600', flex: 1 },
  billAmount: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  billDivider: { height: 1, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  readingBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  readingLabel: { fontSize: Typography.fontSize.xs, marginBottom: 2 },
  readingValue: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  readingUnit: { fontSize: 10, fontWeight: '400' },
  readingDividerV: { width: 1, height: 28, backgroundColor: 'rgba(148,163,184,0.2)' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: Typography.fontSize.xs },
  footerDivider: { width: 1, height: 14, marginHorizontal: Spacing.sm },

  loadingContainer: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  empty: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.xs },

  fabContainer: { position: 'absolute', right: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  fab: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  fabMain: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }, android: { elevation: 6 } }) },

  modalScreen: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalCard: { width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '80%', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }) },
  modalCardFull: { width: '100%', height: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xxl, fontWeight: '700' },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  fieldInput: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1 },
  row2: { flexDirection: 'row', alignItems: 'flex-start' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.lg, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  uploadText: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  submitBtn: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitBtnText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});
