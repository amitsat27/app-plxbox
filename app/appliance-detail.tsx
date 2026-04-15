/**
 * Appliance Detail Screen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, getApplianceCategoryColor } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import {
  ChevronLeft,
  Shield,
  ShieldCheck,
  ShieldX,
  Calendar,
  IndianRupee,
  Clock,
  MapPin,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import { useApplianceData } from '@/src/hooks/useApplianceData';
import type { Appliance } from '@/src/types';
import { getCategoryLabel, getCategoryEmoji, formatDate, formatINR, daysBetween, yearsSince } from '@/components/appliances/utils';
import ImageCarousel from '@/components/ui/ImageCarousel';
import ServiceHistorySection from '@/components/appliances/ServiceHistorySection';
import { firebaseService } from '@/src/services/FirebaseService';

export default function ApplianceDetailScreen() {
  const params = useLocalSearchParams();
  const applianceId = (params.applianceId as string) || '';
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { appliances, loading: loadingData } = useApplianceData(user?.uid);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const appliance = appliances.find((a) => a.id === applianceId) as Appliance | undefined;

  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refetchServices = useCallback(() => {
    if (!applianceId) { setLoadingServices(false); return () => {}; }
    setRefreshing(true);
    return (firebaseService as any).getServiceRecordsForAppliance?.(applianceId, (records: any[]) => {
      setServiceRecords(records);
      setLoadingServices(false);
      setRefreshing(false);
    });
  }, [applianceId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch service records
  useEffect(() => {
    if (!applianceId) return;
    let unsub: (() => void) | undefined;
    unsub = (firebaseService as any).getServiceRecordsForAppliance?.(applianceId, (records: any[]) => {
      setServiceRecords(records);
      setLoadingServices(false);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [applianceId]);

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  if (!appliance) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: scheme.textTertiary, fontSize: 16 }}>Appliance not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catColor = getApplianceCategoryColor(appliance.category);
  const hasImages = appliance.images && appliance.images.length > 0;

  // Warranty info
  const warrantyDays = appliance.warrantyExpiry ? daysBetween(new Date(), appliance.warrantyExpiry) : null;
  const warrantyStatus = warrantyDays !== null
    ? warrantyDays > 0 ? 'active' : 'expired'
    : null;

  // AMC info
  const amcDays = appliance.amcExpiry ? daysBetween(new Date(), appliance.amcExpiry) : null;
  const amcStatus = amcDays !== null
    ? amcDays > 0 ? 'active' : 'expired'
    : null;

  const handleToggleActive = async () => {
    try {
      await firebaseService.updateAppliance(appliance.id, {
        ...appliance,
        isActive: !appliance.isActive,
      }, appliance.location || undefined);
    } catch (err) {
      Alert.alert('Error', 'Failed to update appliance');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Appliance',
      `Are you sure you want to delete ${appliance.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteAppliance(appliance.id, appliance.location);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete appliance');
            }
          },
        },
      ]
    );
  };

  const renderStatusCard = (title: string, icon: React.ReactNode, days: number | null, status: string | null, color: string) => {
    if (!days && days !== 0 && status === null) return null;

    const bgColor = status === 'active' ? `${color}08` : status === 'expired' ? `${'#EF4444'}08` : `${color}08`;
    const textColor = status === 'active' ? color : status === 'expired' ? '#EF4444' : color;

    return (
      <View style={[styles.statusCard, { backgroundColor: bgColor }]}>
        {icon}
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: scheme.textTertiary }]}>{title}</Text>
          <Text style={[styles.statusValue, { color: textColor }]}>
            {status === 'active' ? `${days} days remaining` : status === 'expired' ? `Expired on ${formatDate(appliance.warrantyExpiry || appliance.amcExpiry || new Date())}` : 'Not set'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]} numberOfLines={1}>
            {appliance.name}
          </Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/add-appliance', params: { mode: 'edit', applianceId: appliance.id } })}
            hitSlop={12}
          >
            <Edit size={22} color={scheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refetchServices(); }} tintColor="#7C3AED" />
          }
        >
          {/* Hero Image */}
          {appliance.images && appliance.images.length > 0 ? (
            <View style={styles.heroContainer}>
              <ImageCarousel images={appliance.images} height={220} marginHorizontal={0} />
            </View>
          ) : (
            <View style={[styles.heroContainer, styles.heroPlaceholder, { backgroundColor: `${catColor}15` }]}>
              <Text style={{ fontSize: 64 }}>{getCategoryEmoji(appliance.category)}</Text>
            </View>
          )}

          {/* Info Header */}
          <View style={styles.infoHeader}>
            <Text style={[styles.applianceName, { color: scheme.textPrimary }]}>{appliance.name}</Text>
            <Text style={[styles.applianceBrand, { color: scheme.textTertiary }]}>
              {appliance.brand} · {appliance.model}
            </Text>

            <View style={styles.tagsRow}>
              <View style={[styles.tag, { backgroundColor: `${catColor}15` }]}>
                <Text style={[styles.tagText, { color: catColor }]}>{getCategoryLabel(appliance.category)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.tag, { backgroundColor: appliance.isActive ? `${'#10B981'}15` : `${'#EF4444'}15` }]}
                onPress={handleToggleActive}
              >
                <Text style={[styles.tagText, { color: appliance.isActive ? '#10B981' : '#EF4444' }]}>
                  {appliance.isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: scheme.cardBackground }]}>
              <IndianRupee size={18} color="#3B82F6" />
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{formatINR(appliance.purchasePrice)}</Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>Purchase Price</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: scheme.cardBackground }]}>
              <Clock size={18} color="#F59E0B" />
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{yearsSince(new Date(appliance.purchaseDate))}</Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>Age</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: scheme.cardBackground }]}>
              <MapPin size={18} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>
                {appliance.location.charAt(0).toUpperCase() + appliance.location.slice(1)}
              </Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>Location</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: scheme.cardBackground }]}>
              <Calendar size={18} color="#10B981" />
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{formatDate(new Date(appliance.purchaseDate))}</Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>Purchase Date</Text>
            </View>
          </View>

          {/* Warranty Status */}
          {warrantyDays !== null && (
            <>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Warranty</Text>
              {renderStatusCard(
                appliance.warrantyExpiry ? formatDate(appliance.warrantyExpiry) : '',
                warrantyStatus === 'active' ? (
                  <ShieldCheck size={24} color="#10B981" />
                ) : (
                  <ShieldX size={24} color="#EF4444" />
                ),
                warrantyDays,
                warrantyStatus,
                warrantyStatus === 'active' ? '#10B981' : '#EF4444',
              )}
            </>
          )}

          {/* AMC Status */}
          {amcDays !== null && (
            <>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>AMC</Text>
              {renderStatusCard(
                appliance.amcExpiry ? formatDate(appliance.amcExpiry) : '',
                amcStatus === 'active' ? (
                  <Shield size={24} color="#3B82F6" />
                ) : (
                  <AlertTriangle size={24} color="#EF4444" />
                ),
                amcDays,
                amcStatus,
                amcStatus === 'active' ? '#3B82F6' : '#EF4444',
              )}
            </>
          )}

          {/* Notes */}
          {appliance.notes && (
            <>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Notes</Text>
              <View style={[styles.notesCard, { backgroundColor: scheme.cardBackground }]}>
                <Text style={[styles.notesText, { color: scheme.textSecondary }]}>{appliance.notes}</Text>
              </View>
            </>
          )}

          {/* Service History */}
          {loadingServices && <View style={{ alignItems: 'center', padding: 40 }}><ActivityIndicator size="large" color="#7C3AED" /></View>}
          {!loadingServices && (
            <ServiceHistorySection
              records={serviceRecords}
              applianceId={appliance.id}
              onAddRecord={() => router.push({
                pathname: '/add-service-record',
                params: { applianceId: appliance.id, applianceName: appliance.name },
              })}
              onEditRecord={(record) => router.push({
                pathname: '/add-service-record',
                params: {
                  applianceId: appliance.id,
                  applianceName: appliance.name,
                  mode: 'edit',
                  serviceRecordId: record.id,
                  serviceDate: record.serviceDate instanceof Date ? record.serviceDate.toISOString() : record.serviceDate,
                  serviceType: record.serviceType,
                  cost: String(record.cost),
                  provider: record.provider,
                  description: record.description,
                  notes: record.notes,
                },
              })}
              onDeleteRecord={(record) => {
                Alert.alert(
                  'Delete Service Record',
                  'Are you sure you want to delete this service record?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await firebaseService.deleteServiceRecord(record.id);
                        } catch {
                          Alert.alert('Error', 'Failed to delete service record');
                        }
                      },
                    },
                  ],
                );
              }}
              onOpenDetail={(record) => router.push({
                pathname: '/service-record-detail',
                params: {
                  applianceId: appliance.id,
                  applianceName: appliance.name,
                  serviceRecordId: record.id,
                  mode: 'view',
                  _fromSection: 'true',
                  serviceDate: record.serviceDate instanceof Date ? record.serviceDate.toISOString() : record.serviceDate,
                  serviceType: record.serviceType,
                  cost: String(record.cost),
                  provider: record.provider,
                  description: record.description,
                  notes: record.notes,
                },
              })}
            />
          )}

          {/* Delete Action */}
          <TouchableOpacity style={styles.deleteRow} onPress={handleDelete} activeOpacity={0.8}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Delete Appliance</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  editBtn: { padding: 4 },
  heroContainer: { paddingHorizontal: 20, marginBottom: 12 },
  heroImageWrapper: { height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { height: 200, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center' },
  infoHeader: { paddingHorizontal: 20, marginBottom: 20 },
  applianceName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  applianceBrand: { fontSize: 15, marginTop: 4 },
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  tagText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  statBox: { flex: 1, padding: 16, borderRadius: BorderRadius.md, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
  statusCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 16, borderRadius: BorderRadius.sm, gap: 14, marginBottom: 8 },
  statusInfo: { gap: 2 },
  statusLabel: { fontSize: 13, fontWeight: '600' },
  statusValue: { fontSize: 14, fontWeight: '500' },
  notesCard: { marginHorizontal: 20, padding: 16, borderRadius: BorderRadius.sm },
  notesText: { fontSize: 14, lineHeight: 22 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginHorizontal: 20, marginTop: 20, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
