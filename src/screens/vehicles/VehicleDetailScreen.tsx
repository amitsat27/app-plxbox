/**
 * Vehicle Detail Screen — premium detail view with tabs, compliance tracking, actions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Edit3, Wrench, Shield, FileText, Gauge, Calendar, Info, Trash2 } from 'lucide-react-native';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';
import type { Vehicle } from '@/src/types';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleJson = params.vehicle ? decodeURIComponent(params.vehicle as string) : null;
  const [vehicle, setVehicle] = useState<Vehicle | null>(vehicleJson ? JSON.parse(vehicleJson) : null);
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'specs'>('overview');
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  const switchTab = (tab: typeof activeTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }),
      ]),
    ]).start();
  };

  if (!vehicle) {
    return <View style={[styles.center, { backgroundColor: scheme.background }]}><ActivityIndicator size="large" color={Colors.warning} /></View>;
  }

  const vehicleEmoji = () => { switch (vehicle.type) { case 'car': return '🚗'; case 'bike': return '🏍️'; case 'truck': return '🚛'; default: return '🚘'; } };
  const fuelEmoji = () => { switch (vehicle.fuelType) { case 'electric': return '⚡'; case 'cng': case 'lpg': return '🔵'; case 'hybrid': return '🌿'; default: return '⛽'; } };

  const rowBorder = isDark ? '#2C2C2E' : '#F2F2F7';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => router.back()}>
          <ChevronLeft size={20} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>{vehicle.name}</Text>
          <Text style={[styles.headerSubtitle, { color: scheme.textTertiary }]}>{vehicle.registrationNumber || `${vehicle.make} ${vehicle.model}`}</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => Alert.alert('Coming Soon', 'Edit vehicle')}>
          <Edit3 size={18} color={Colors.warning} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* ── Hero Card ── */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {/* Gradient accent */}
          <View style={[styles.heroGlow, { backgroundColor: `rgba(245,158,11,${isDark ? 0.06 : 0.04})` }]} />

          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)' }]}>
              <Text style={{ fontSize: 40 }}>{vehicleEmoji()}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: scheme.textPrimary }]}>{vehicle.name}</Text>
              <Text style={[styles.heroMake, { color: scheme.textTertiary }]}>{vehicle.make} {vehicle.model} · {vehicle.year}</Text>
              {vehicle.registrationNumber && (
                <Text style={[styles.heroReg, { color: scheme.textTertiary }]}>{vehicle.registrationNumber}</Text>
              )}
            </View>
            <View style={[
              styles.statusPill,
              { backgroundColor: vehicle.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.08)' }
            ]}>
              <Text style={[styles.statusPillText, { color: vehicle.isActive ? '#10B981' : '#94A3B8', textTransform: 'uppercase' }]}>
                {vehicle.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

          {/* Stats */}
          <View style={styles.heroStats}>
            <StatRow icon={fuelEmoji()} label="Fuel" value={vehicle.fuelType.toUpperCase()} scheme={scheme} />
            {vehicle.mileage && <StatRow icon="📊" label="Mileage" value={`${vehicle.mileage} km/l`} scheme={scheme} />}
            {vehicle.odometerReading && <StatRow icon="🛣️" label="Odometer" value={`${(vehicle.odometerReading / 1000).toFixed(0)}k km`} scheme={scheme} />}
            {vehicle.fuelTankCapacity && <StatRow icon="🪣" label="Tank" value={`${vehicle.fuelTankCapacity} L`} scheme={scheme} />}
          </View>
        </View>

        {/* ── Compliance Status Tiles ── */}
        <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Compliance Status</Text>
        <View style={styles.statusGrid}>
          <StatusTile
            icon={<Shield size={18} color={expiryColor(vehicle.insuranceExpiry)} />}
            label="Insurance"
            date={vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : 'Not Set'}
            status={expiryLabel(vehicle.insuranceExpiry)}
          />
          <StatusTile
            icon={<FileText size={18} color={expiryColor(vehicle.pucExpiry)} />}
            label="PUC"
            date={vehicle.pucExpiry ? formatDate(vehicle.pucExpiry) : 'Not Set'}
            status={expiryLabel(vehicle.pucExpiry)}
          />
          <StatusTile
            icon={<Calendar size={18} color={expiryColor(vehicle.registrationExpiry)} />}
            label="Registration"
            date={formatDate(vehicle.registrationExpiry)}
            status={expiryLabel(vehicle.registrationExpiry)}
          />
          <StatusTile
            icon={<Wrench size={18} color={vehicle.nextServiceDue ? expiryColor(vehicle.nextServiceDue) : '#71717A'} />}
            label="Service"
            date={vehicle.nextServiceDue ? formatDate(vehicle.nextServiceDue) : 'Not Scheduled'}
            status={vehicle.nextServiceDue ? expiryLabel(vehicle.nextServiceDue) : 'N/A'}
          />
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          <TabButton label="Overview" active={activeTab === 'overview'} onPress={() => switchTab('overview')} />
          <TabButton label="Compliance" active={activeTab === 'compliance'} onPress={() => switchTab('compliance')} />
          <TabButton label="Specs" active={activeTab === 'specs'} onPress={() => switchTab('specs')} />
        </View>

        {/* ── Tab Content ── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideY }] }}>
          {activeTab === 'overview' && <OverviewTab vehicle={vehicle} scheme={scheme} rowBorder={rowBorder} />}
          {activeTab === 'compliance' && <ComplianceTab vehicle={vehicle} scheme={scheme} rowBorder={rowBorder} />}
          {activeTab === 'specs' && <SpecsTab vehicle={vehicle} scheme={scheme} rowBorder={rowBorder} />}
        </Animated.View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <ActionButton icon={<Wrench size={18} color={Colors.warning} />} label="Log Service" onPress={() => Alert.alert('Coming Soon', 'Service log')} scheme={scheme} />
          <ActionButton icon={<FileText size={18} color="#3B82F6" />} label="Records" onPress={() => Alert.alert('Coming Soon', 'Records')} scheme={scheme} />
          <ActionButton icon={<Trash2 size={18} color="#EF4444" />} label="Delete" danger onPress={() => confirmDelete(router, vehicle)} scheme={scheme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Tab Content ─── */

function OverviewTab({ vehicle, scheme, rowBorder }: { vehicle: Vehicle; scheme: ReturnType<typeof getColorScheme>; rowBorder: string }) {
  return (
    <View style={[styles.tabCard, { backgroundColor: scheme.surface }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Summary</Text>
      <DetailRow label="Vehicle Type" value={capitalize(vehicle.type)} scheme={scheme} border={rowBorder} />
      <DetailRow label="Fuel Type" value={vehicle.fuelType.toUpperCase()} scheme={scheme} border={rowBorder} />
      <DetailRow label="Make" value={vehicle.make || '—'} scheme={scheme} border={rowBorder} />
      <DetailRow label="Model" value={vehicle.model || '—'} scheme={scheme} border={rowBorder} />
      <DetailRow label="Year" value={String(vehicle.year)} scheme={scheme} border={rowBorder} />
      <DetailRow label="Location" value={capitalize(vehicle.location)} scheme={scheme} border={rowBorder} />
      {vehicle.notes && (
        <>
          <View style={[styles.cardDivider, { backgroundColor: rowBorder }]} />
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Notes</Text>
          <Text style={[styles.notes, { color: scheme.textSecondary }]}>{vehicle.notes}</Text>
        </>
      )}
    </View>
  );
}

function ComplianceTab({ vehicle, scheme, rowBorder }: { vehicle: Vehicle; scheme: ReturnType<typeof getColorScheme>; rowBorder: string }) {
  return (
    <View style={[styles.tabCard, { backgroundColor: scheme.surface }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Documents & Identifiers</Text>
      <ComplianceItem label="Insurance" date={vehicle.insuranceExpiry} scheme={scheme} border={rowBorder} />
      <ComplianceItem label="PUC Certificate" date={vehicle.pucExpiry} scheme={scheme} border={rowBorder} />
      <ComplianceItem label="Registration" date={vehicle.registrationExpiry} scheme={scheme} border={rowBorder} />
      <View style={[styles.cardDivider, { backgroundColor: rowBorder }]} />
      {vehicle.vin && <DetailRow label="VIN" value={vehicle.vin} scheme={scheme} border={rowBorder} />}
      {vehicle.engineNumber && <DetailRow label="Engine No." value={vehicle.engineNumber} scheme={scheme} border={rowBorder} />}
      {vehicle.chassisNumber && <DetailRow label="Chassis No." value={vehicle.chassisNumber} scheme={scheme} border={rowBorder} />}
      {vehicle.color && <DetailRow label="Color" value={vehicle.color} scheme={scheme} border={rowBorder} />}
    </View>
  );
}

function SpecsTab({ vehicle, scheme, rowBorder }: { vehicle: Vehicle; scheme: ReturnType<typeof getColorScheme>; rowBorder: string }) {
  return (
    <>
      <View style={[styles.tabCard, { backgroundColor: scheme.surface }]}>
        <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Specifications</Text>
        {vehicle.fuelType && <DetailRow label="Fuel Type" value={capitalize(vehicle.fuelType)} scheme={scheme} border={rowBorder} />}
        {vehicle.mileage && <DetailRow label="Mileage" value={`${vehicle.mileage} km/l`} scheme={scheme} border={rowBorder} />}
        {vehicle.fuelTankCapacity && <DetailRow label="Tank Capacity" value={`${vehicle.fuelTankCapacity} L`} scheme={scheme} border={rowBorder} />}
        {vehicle.odometerReading && <DetailRow label="Odometer" value={`${vehicle.odometerReading.toLocaleString()} km`} scheme={scheme} border={rowBorder} />}
        {vehicle.color && <DetailRow label="Color" value={vehicle.color} scheme={scheme} border={rowBorder} />}
      </View>
      {vehicle.purchasePrice !== undefined && (
        <View style={[styles.tabCard, { backgroundColor: scheme.surface }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Financial</Text>
          {vehicle.purchasePrice && <DetailRow label="Purchase Price" value={`₹${vehicle.purchasePrice.toLocaleString()}`} scheme={scheme} border={rowBorder} />}
          {vehicle.currentValue && <DetailRow label="Current Value" value={`₹${vehicle.currentValue.toLocaleString()}`} scheme={scheme} border={rowBorder} />}
          {vehicle.purchaseDate && <DetailRow label="Purchase Date" value={formatDate(vehicle.purchaseDate)} scheme={scheme} border={rowBorder} />}
        </View>
      )}
    </>
  );
}

/* ─── Sub-Components ─── */

function StatRow({ icon, label, value, scheme }: { icon: string; label: string; value: string; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={styles.statRow}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.statRowLabel, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[styles.statRowValue, { color: scheme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

function StatusTile({ icon, label, date, status }: { icon: React.ReactNode; label: string; date: string; status: string }) {
  const { isDark } = useTheme();
  const statusColor = status === 'Valid' ? '#10B981' : status === 'Expiring' ? '#F59E0B' : status === 'Expired' ? '#EF4444' : '#71717A';
  return (
    <View style={[styles.statusTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA' }]}>
      <View style={[styles.statusTileIcon, { backgroundColor: `${statusColor}12` }]}>{icon}</View>
      <Text style={[styles.tileLabel, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>{label}</Text>
      <Text style={[styles.tileDate, { color: isDark ? '#F5F5F5' : '#1F2937', fontWeight: '600' }]}>{date}</Text>
      <View style={[styles.tileStatus, { backgroundColor: `${statusColor}12` }]}>
        <Text style={[styles.tileStatusText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity style={[styles.tabBtn, { backgroundColor: active ? `${Colors.warning}18` : isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={onPress}>
      {label === 'Overview' && <Info size={13} color={active ? Colors.warning : isDark ? '#71717A' : '#9CA3AF'} />}
      {label === 'Compliance' && <Shield size={13} color={active ? Colors.warning : isDark ? '#71717A' : '#9CA3AF'} />}
      {label === 'Specs' && <Gauge size={13} color={active ? Colors.warning : isDark ? '#71717A' : '#9CA3AF'} />}
      <Text style={[styles.tabLabel, { color: active ? Colors.warning : isDark ? '#71717A' : '#9CA3AF' }]}>{label}</Text>
      {active && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
}

function DetailRow({ label, value, scheme, border }: { label: string; value: string; scheme: ReturnType<typeof getColorScheme>; border: string }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: border }]}>
      <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>{value}</Text>
    </View>
  );
}

function ComplianceItem({ label, date, scheme, border }: { label: string; date?: Date; scheme: ReturnType<typeof getColorScheme>; border: string }) {
  const status = expiryLabel(date);
  const color = expiryColor(date);
  return (
    <View style={[styles.complianceItem, { borderBottomColor: border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.complianceLabel, { color: scheme.textPrimary }]}>{label}</Text>
        <Text style={[styles.complianceDate, { color: scheme.textTertiary }]}>{date ? formatDate(date) : 'Not set'}</Text>
      </View>
      <View style={[styles.complianceStatus, { backgroundColor: `${color}12` }]}>
        <Text style={[styles.complianceStatusText, { color }]}>{status}</Text>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, onPress, danger = false, scheme }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean; scheme: ReturnType<typeof getColorScheme> }) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }, danger && { borderColor: 'rgba(239,68,68,0.15)', borderWidth: 1 }]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.actionLabel, { color: danger ? '#EF4444' : scheme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Helpers ─── */

function expiryLabel(date?: Date): string { if (!date) return 'Unknown'; const d = Math.ceil((date.getTime() - new Date().getTime()) / 86400000); if (d < 0) return 'Expired'; if (d < 30) return 'Expiring'; return 'Valid'; }
function expiryColor(date?: Date): string { if (!date) return '#71717A'; const d = Math.ceil((date.getTime() - new Date().getTime()) / 86400000); if (d < 0) return '#EF4444'; if (d < 30) return '#F59E0B'; return '#10B981'; }
function formatDate(d: Date): string { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function confirmDelete(router: ReturnType<typeof useRouter>, vehicle: Vehicle) {
  Alert.alert('Delete Vehicle', `Delete "${vehicle.name}" permanently?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await firebaseService.deleteVehicle(vehicle.id); router.back(); } catch (e: any) { Alert.alert('Error', e.message); } } },
  ]);
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 10, borderRadius: 14 },

  heroCard: { marginHorizontal: 16, padding: 18, borderRadius: 24, position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14 }, android: { elevation: 5 } }),
  },
  heroGlow: { position: 'absolute', top: -30, right: -20, width: 120, height: 80, borderRadius: 40, transform: [{ rotate: '12deg' }], opacity: 0.6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 20, fontWeight: '800' },
  heroMake: { fontSize: 13, marginTop: 2 },
  heroReg: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 0.5, marginVertical: 14 },
  heroStats: { gap: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  statRowLabel: { fontSize: 11, fontWeight: '500' },
  statRowValue: { fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 17, fontWeight: '800', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  statusTile: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 20, gap: 6 },
  statusTileIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tileLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tileDate: { fontSize: 12 },
  tileStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  tileStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 24, marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  activeIndicator: { position: 'absolute', bottom: 0, left: '50%', transform: [{ translateX: -8 }], width: 16, height: 2, borderRadius: 1, backgroundColor: Colors.warning },

  tabCard: { paddingHorizontal: 16, marginBottom: 12, paddingVertical: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  cardDivider: { height: 0.5, marginVertical: 12 },
  notes: { fontSize: 14, lineHeight: 22 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600' },

  complianceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  complianceLabel: { fontSize: 14, fontWeight: '600' },
  complianceDate: { fontSize: 12, marginTop: 2 },
  complianceStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  complianceStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 8, marginBottom: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 18 },
  actionLabel: { fontSize: 13, fontWeight: '700' },
});
