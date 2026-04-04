/**
 * Property Tax Bills Screen — Enhanced UI + Notification feature
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
  ChevronLeft, Home, Plus, MapPin, Calendar, IndianRupee,
  CheckCircle, Clock, AlertCircle, FileText, Building2,
  Bell, Info, TrendingUp, X, AlertTriangle, Receipt
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService, PropertyTaxBillEntry } from '@/src/services/FirebaseService';
import DropdownPicker from './components/DropdownPicker';
import StatCard from './components/StatCard';
import TaxBillCard from './components/TaxBillCard';
import AddConsumerModal from './components/AddConsumerModal';
import AddBillModal from './components/AddBillModal';
import { pendingPropertyTaxBillIdRef } from '../property-bill-detail';

// ── Notification data ──────────────────────────────────────
interface TaxNotif {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'overdue';
  timestamp: Date;
  read: boolean;
}

function buildNotifs(bills: PropertyTaxBillEntry[], info: any): TaxNotif[] {
  const ns: TaxNotif[] = [];
  const now = new Date();
  bills.filter(b => b.payStatus !== 'Paid').forEach(b => {
    const due = new Date(b.lastDateToPay);
    const days = Math.ceil((due.getTime() - now.getTime()) / 864e5);
    if (due < now) ns.push({ id: `o-${b.id}`, title: 'Payment Overdue', message: `FY ${b.billYear} of ₹${parseFloat(b.taxBillAmount).toLocaleString('en-IN')} past due.`, type: 'overdue', timestamp: due, read: false });
    else if (days <= 30) ns.push({ id: `u-${b.id}`, title: 'Due Soon', message: `FY ${b.billYear} due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`, type: 'warning', timestamp: due, read: false });
  });
  bills.filter(b => b.payStatus === 'Paid').slice(0, 2).forEach(b => ns.push({ id: `p-${b.id}`, title: 'Payment Confirmed', message: `FY ${b.billYear} paid ₹${parseFloat(b.taxBillAmount).toLocaleString('en-IN')}.`, type: 'success', timestamp: b.lastDateToPay, read: true }));
  return ns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ── Notification Bell with Badge ───────────────────────────
function NotifBell({ count, onPress }: { count: number; onPress: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (count > 0) Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.1, duration: 800, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true })])).start(); }, [count]);
  return (
    <TouchableOpacity style={{ padding: 6 }} onPress={onPress} activeOpacity={0.6}>
      <Animated.View style={{ transform: [{ scale: count > 0 ? pulse : 1 }] }}>
        <Bell size={20} color={scheme.textSecondary} />
      </Animated.View>
      {count > 0 && (
        <View style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, backgroundColor: '#EF4444' }}>
          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Notification Bottom Sheet ──────────────────────────────
function NotifPanel({ visible, onClose, notifs }: { visible: boolean; onClose: () => void; notifs: TaxNotif[] }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, damping: 22, stiffness: 150 }).start(); }, [visible]);

  const tc: Record<string, { icon: any; color: string }> = {
    overdue: { icon: AlertTriangle, color: '#EF4444' },
    warning: { icon: Clock, color: '#F59E0B' },
    success: { icon: CheckCircle, color: '#10B981' },
    info: { icon: Info, color: '#3B82F6' },
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[{
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, paddingBottom: Spacing.xxxl,
          maxHeight: '85%',
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
          ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 }, android: { elevation: 12 } }),
        }]}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(148,163,184,0.3)', alignSelf: 'center', marginBottom: Spacing.lg }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Bell size={20} color={scheme.textPrimary} />
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: '700', color: scheme.textPrimary }}>Notifications</Text>
              {notifs.filter(n => !n.read).length > 0 && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />}
            </View>
            <TouchableOpacity onPress={onClose}><X size={20} color={scheme.textTertiary} /></TouchableOpacity>
          </View>
          {notifs.length === 0 ? (
            <View style={{ paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
              <Bell size={40} color={scheme.textTertiary} opacity={0.3} />
              <Text style={{ color: scheme.textTertiary, marginTop: Spacing.md, fontSize: Typography.fontSize.md }}>No notifications</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {notifs.map(n => {
                const cfg = tc[n.type] || tc.info;
                const Icon = cfg.icon;
                return (
                  <View key={n.id} style={{ flexDirection: 'row', borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: scheme.border, backgroundColor: n.read ? 'transparent' : (isDark ? `${cfg.color}10` : `${cfg.color}06`) }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, flexShrink: 0, backgroundColor: isDark ? `${cfg.color}18` : `${cfg.color}10` }}>
                      <Icon size={18} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '600', color: scheme.textPrimary }}>{n.title}</Text>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textSecondary, marginTop: 3, lineHeight: Typography.fontSize.xs * 1.7 }} numberOfLines={2}>{n.message}</Text>
                      <Text style={{ fontSize: 10, color: scheme.textTertiary, marginTop: 4 }}>{n.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: Spacing.sm, flexShrink: 0 }} />}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Tips data ──────────────────────────────────────────────
const TIPS = [
  { title: 'Early Bird Discount', desc: 'Pay before Mar 31 for 5% rebate', icon: TrendingUp, color: '#10B981' },
  { title: 'Tax Assessment Update', desc: 'PMC revised circle rates effective Apr 2026', icon: Info, color: '#3B82F6' },
  { title: 'Online Payment', desc: 'Pay via PMC portal using index number', icon: Home, color: '#8B5CF6' },
];

// ── Info Item ──────────────────────────────────────────────
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={{ width: '30%', alignItems: 'center', paddingVertical: Spacing.sm }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#F3F4F6' }}>{icon}</View>
      <Text style={{ fontSize: 10, fontWeight: '500', textAlign: 'center', marginBottom: 2, color: scheme.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: scheme.textPrimary }} numberOfLines={1} ellipsizeMode="tail">{value || '—'}</Text>
    </View>
  );
}

// ── Tip Card ───────────────────────────────────────────────
function TipCard({ tip }: { tip: { title: string; desc: string; icon: any; color: string } }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const Icon = tip.icon;
  return (
    <View style={{ flex: 1, minWidth: 220, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, marginRight: Spacing.sm, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#FFFFFF', borderColor: scheme.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm, backgroundColor: isDark ? `${tip.color}18` : `${tip.color}10` }}>
        <Icon size={18} color={tip.color} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '600', marginBottom: 4, lineHeight: Typography.fontSize.sm * 1.4, color: scheme.textPrimary }}>{tip.title}</Text>
      <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: Typography.fontSize.xs * 1.6, color: scheme.textTertiary }} numberOfLines={2}>{tip.desc}</Text>
    </View>
  );
}

// ── MAIN SCREEN ────────────────────────────────────────────
export default function PropertyTaxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTaxIndex, setSelectedTaxIndex] = useState<string | undefined>();
  const [taxIndices, setTaxIndices] = useState<string[]>([]);
  const [bills, setBills] = useState<PropertyTaxBillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [focusTick, setFocusTick] = useState(0);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddConsumer, setShowAddConsumer] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [editingBill, setEditingBill] = useState<PropertyTaxBillEntry | null>(null);
  const [notifications, setNotifications] = useState<TaxNotif[]>([]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: loading ? 0 : 1, duration: 300, useNativeDriver: true }).start(); }, [loading]);
  useFocusEffect(useCallback(() => { setFocusTick(t => t + 1); }, []));
  useEffect(() => { setNotifications(buildNotifs(bills, propertyInfo)); }, [bills, propertyInfo]);

  const handleCityChange = useCallback(async (city: string) => {
    setSelectedCity(city); setSelectedTaxIndex(undefined); setBills([]); setPropertyInfo(null);
    const idx = await firebaseService.getPropertyTaxConsumersByCity(city);
    setTaxIndices(idx);
    if (idx.length === 1) setSelectedTaxIndex(idx[0]);
  }, []);

  useEffect(() => {
    if (!selectedTaxIndex || !selectedCity) { setBills([]); setPropertyInfo(null); return; }
    let cancelled = false; setLoading(true);
    firebaseService.getPropertyTaxInfo(selectedTaxIndex).then(i => { if (!cancelled) setPropertyInfo(i); });
    const u = firebaseService.getPropertyTaxBills(selectedCity, selectedTaxIndex, d => { if (!cancelled) { setBills(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedTaxIndex, selectedCity]);

  const onRefresh = useCallback(() => {
    if (!selectedTaxIndex || !selectedCity) return;
    setRefreshing(true);
    firebaseService.getPropertyTaxInfo(selectedTaxIndex).then(i => { setPropertyInfo(i); setRefreshing(false); }).catch(() => setRefreshing(false));
  }, [selectedTaxIndex, selectedCity]);

  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => { const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount; return s + (isFinite(a) ? a : 0); }, 0);
    const paid = bills.filter(b => b.payStatus === 'Paid').length;
    const pending = bills.filter(b => b.payStatus === 'Pending').length;
    const paidAmt = bills.filter(b => b.payStatus === 'Paid').reduce((s, b) => { const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount; return s + (isFinite(a) ? a : 0); }, 0);
    return { total, paid, pending, paidAmt };
  }, [bills]);

  const filteredBills = filter === 'All' ? bills : bills.filter(b => b.payStatus === filter);
  const CITIES = ['pune', 'nashik', 'jalgaon'];
  const pendingCount = bills.filter(b => b.payStatus === 'Pending').length;

  // Handle edit request from detail screen (via module-level ref)
  useFocusEffect(useCallback(() => {
    const id = pendingPropertyTaxBillIdRef.current;
    if (id && bills.length > 0) {
      const b = bills.find(x => x.id === id);
      if (b) { setEditingBill(b); setShowAddBill(true); pendingPropertyTaxBillIdRef.current = ''; }
    }
  }, [bills]));

  const handleViewBill = (bill: PropertyTaxBillEntry) => router.push({ pathname: '/property-bill-detail', params: { billId: bill.id, city: selectedCity, taxIndexNumber: bill.taxIndexNumber || '' } } as any);
  const handleEditBill = (bill: PropertyTaxBillEntry) => { setEditingBill(bill); setShowAddBill(true); };
  const handleDeleteBill = (bill: PropertyTaxBillEntry) => Alert.alert('Delete Bill', `Delete FY ${bill.billYear} property tax bill?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); try { await firebaseService.deletePropertyTaxBill(selectedCity, bill.id); } catch (e: any) { Alert.alert('Error', e.message); } } }]);
  const onBillClose = () => { setShowAddBill(false); setEditingBill(null); };
  const onBillSave = () => { setShowAddBill(false); setEditingBill(null); };
  const onConsumerSave = () => { setShowAddConsumer(false); handleCityChange(selectedCity); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Math.max(insets.top, 8), paddingBottom: Spacing.md }}>
        <TouchableOpacity style={{ padding: 4, marginRight: Spacing.sm }} onPress={() => router.back()} activeOpacity={0.6}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '500', color: scheme.textTertiary }}>
              {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Property Tax'}
            </Text>
            {pendingCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)' }}>
                <Clock size={10} color="#F59E0B" />
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B' }}>{pendingCount} pending</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: scheme.textPrimary }}>Property Tax</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <NotifBell count={unreadCount} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifs(true); }} />
          <TouchableOpacity style={{ padding: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: scheme.border }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddConsumer(true); }}>
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Content ─────────────────────────────── */}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        {/* City + Tax Index */}
        <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: Spacing.md, gap: Spacing.sm }}>
          <DropdownPicker label="City" value={selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : ''} options={CITIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))} onSelect={(v) => handleCityChange(v.toLowerCase())} placeholder="Select City" icon={<MapPin size={16} color={selectedCity ? Colors.primary : scheme.textTertiary} />} />
          <DropdownPicker label="Tax Index" value={selectedTaxIndex} options={taxIndices} onSelect={(v) => { setSelectedTaxIndex(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} placeholder="Select Index" disabled={!selectedCity || taxIndices.length === 0} icon={<Building2 size={16} color={selectedTaxIndex ? Colors.primary : scheme.textTertiary} />} />
        </View>

        {/* Property Info */}
        {propertyInfo && (
          <Animated.View style={[{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderRadius: 20, padding: Spacing.lg, backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFFFFF', opacity: fadeAnim, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } }) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm }}>
              <Home size={16} color={Colors.primary} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '600', color: scheme.textPrimary }}>Property Details</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly' }}>
              <InfoItem icon={<FileText size={16} color="#A78BFA" />} label="Index No." value={propertyInfo.taxIndexNumber} />
              <InfoItem icon={<MapPin size={16} color="#F59E0B" />} label="Location" value={propertyInfo.location} />
              <InfoItem icon={<Home size={16} color="#10B981" />} label="Owner" value={propertyInfo.ownerName} />
              <InfoItem icon={<Home size={16} color="#06B6D4" />} label="Area" value={propertyInfo.area} />
              <InfoItem icon={<Bell size={16} color="#EC4899" />} label="Mobile" value={propertyInfo.registeredMobile} />
            </View>
          </Animated.View>
        )}

        {/* Stats */}
        {bills.length > 0 && (
          <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md }}>
            <StatCard label="Total" value={`₹${stats.total.toLocaleString('en-IN')}`} sub={`${bills.length} bills`} color="#7C3AED" icon={<FileText size={14} color="#7C3AED" />} />
            <StatCard label="Paid" value={`₹${stats.paidAmt.toLocaleString('en-IN')}`} sub={`${stats.paid} bills`} color="#10B981" icon={<CheckCircle size={14} color="#10B981" />} />
            <StatCard label="Pending" value={`${stats.pending}`} sub={`${Math.round(stats.pending / (stats.paid + stats.pending || 1) * 100)}%`} color="#F59E0B" icon={<Clock size={14} color="#F59E0B" />} />
          </View>
        )}

        {/* Tips */}
        {selectedCity && (
          <View style={{ marginTop: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontWeight: '600', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, color: scheme.textPrimary }}>Updates & Tips</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: Spacing.lg }}>
              {TIPS.map((t, i) => <TipCard key={i} tip={t} />)}
            </ScrollView>
          </View>
        )}

        {/* Filters */}
        {bills.length > 0 && (
          <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md }}>
            {['All', 'Paid', 'Pending'].map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: filter === f ? Colors.primary + '60' : 'transparent', backgroundColor: filter === f ? (isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)') : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(0,0,0,0.04)') }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: '600', color: filter === f ? Colors.primary : scheme.textTertiary }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading */}
        {loading && bills.length === 0 && (
          <View style={{ paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: scheme.textTertiary, marginTop: Spacing.md, fontSize: Typography.fontSize.sm }}>Fetching property tax records...</Text>
            {[1, 2, 3].map(i => <View key={i} style={{ height: 80, borderRadius: 16, width: '100%', marginTop: Spacing.sm, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F3F4F6' }} />)}
          </View>
        )}

        {/* Bills List  (using FlatList internally for perf) */}
        {filteredBills.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            {filteredBills.map(b => (
              <TaxBillCard key={b.id} bill={b} onPress={() => handleViewBill(b)} onEdit={() => handleEditBill(b)} onDelete={() => handleDeleteBill(b)} />
            ))}
          </View>
        )}

        {/* Empty: no bills after selection */}
        {!loading && selectedCity && bills.length === 0 && (
          <View style={{ paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
            <FileText size={48} color={scheme.textTertiary} opacity={0.3} />
            <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: '600', textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs, color: scheme.textPrimary }}>No Property Tax Records</Text>
            <Text style={{ fontSize: Typography.fontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xl, color: scheme.textTertiary }}>{selectedTaxIndex ? 'No tax bills found for this index.' : 'Select a tax index to view.'}</Text>
          </View>
        )}

        {/* Empty: no city */}
        {!loading && !selectedCity && (
          <View style={{ paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
            <Home size={48} color={scheme.textTertiary} opacity={0.3} />
            <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: '600', textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs, color: scheme.textPrimary }}>Select a City</Text>
            <Text style={{ fontSize: Typography.fontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xl, color: scheme.textTertiary }}>Choose a city to view property tax records</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ── FABs ───────────────────────────────────────────── */}
      {selectedCity && (
        <View style={{ position: 'absolute', right: Spacing.lg, bottom: insets.bottom + 76, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity style={{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: scheme.border, borderWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddConsumer(true); }}>
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, opacity: selectedTaxIndex ? 1 : 0.5, ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }, android: { elevation: 6 } }) }} onPress={() => { if (!selectedTaxIndex) { Alert.alert('Select Tax Index', 'Please select a tax index first.'); return; } Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingBill(null); setShowAddBill(true); }}>
            <IndianRupee size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {showAddBill && <Modal animationType="slide" transparent visible onRequestClose={onBillClose}><AddBillModal onClose={onBillClose} onSave={onBillSave} bill={editingBill} city={selectedCity} taxIndexNumber={selectedTaxIndex || ''} /></Modal>}
      {showAddConsumer && <Modal animationType="slide" transparent visible onRequestClose={() => setShowAddConsumer(false)}><AddConsumerModal onClose={() => setShowAddConsumer(false)} onSave={onConsumerSave} /></Modal>}
      <NotifPanel visible={showNotifs} onClose={() => setShowNotifs(false)} notifs={notifications} />
    </SafeAreaView>
  );
}
