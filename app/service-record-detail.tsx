/**
 * Service Record Detail Screen — view-only.
 * Shows service details + receipt thumbnails with View/Download buttons.
 * Upload is only available on the Edit screen (add-service-record).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, Colors } from '@/theme/color';
import { BorderRadius, Spacing } from '@/constants/designTokens';
import {
  ChevronLeft,
  Calendar,
  IndianRupee,
  User,
  FileText,
  Edit2,
  Trash2,
  FileText as FileTextIcon,
} from 'lucide-react-native';
import { firebaseService } from '@/src/services/FirebaseService';
import type { ServiceRecord, ServiceReceipt } from '@/src/types';
import { formatDate, formatINR } from '@/components/appliances/utils';
import ServiceReceiptCard from '@/components/appliances/ServiceReceiptCard';

const SERVICE_TYPE_COLORS: Record<string, string> = {
  repair: Colors.error,
  maintenance: Colors.info,
  warranty: Colors.success,
  inspection: Colors.warning,
  other: Colors.primary,
  regular: Colors.primary,
  annual: Colors.warning,
  emergency: Colors.error,
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair',
  maintenance: 'Maintenance',
  warranty: 'Warranty',
  inspection: 'Inspection',
  other: 'Other',
  regular: 'Regular Service',
  annual: 'Annual Service',
  emergency: 'Emergency',
};


export default function ServiceRecordDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const applianceId = (params.applianceId as string) || '';
  const serviceRecordId = (params.serviceRecordId as string) || '';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const receipts = (record?.receipts as ServiceReceipt[]) || [];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchRecord = useCallback(() => {
    if (!serviceRecordId || !applianceId) {
      setLoading(false);
      return () => {};
    }

    console.log('[ServiceDetail] Fetching record', serviceRecordId, 'for appliance', applianceId);
    return (firebaseService as any).getServiceRecordsForAppliance?.(
      applianceId,
      (records: ServiceRecord[]) => {
        console.log('[ServiceDetail] Got', records.length, 'records');
        const found = records.find((r) => r.id === serviceRecordId);
        if (found) {
          console.log('[ServiceDetail] Found record, receipts:', (found.receipts || []).length);
          setRecord(found);
        } else {
          console.log('[ServiceDetail] Record not found in results');
        }
        setLoading(false);
        if (refreshing) setRefreshing(false);
      },
    );
  }, [serviceRecordId, applianceId, refreshing]);

  // Initial fetch
  useEffect(() => {
    const unsub = fetchRecord();
    return () => unsub?.();
  }, [fetchRecord]);

  // Re-fetch on focus (when coming back from edit screen)
  useFocusEffect(
    useCallback(() => {
      if (!loading && serviceRecordId && applianceId) {
        return fetchRecord();
      }
    }, [loading, serviceRecordId, applianceId, fetchRecord]),
  );

  const handleDelete = () => {
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
              await firebaseService.deleteServiceRecord(serviceRecordId);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    if (!record) return;
    router.push({
      pathname: '/add-service-record',
      params: {
        applianceId,
        applianceName: params.applianceName || '',
        serviceRecordId: record.id,
        mode: 'edit',
        serviceDate: record.serviceDate instanceof Date ? record.serviceDate.toISOString() : String(record.serviceDate),
        serviceType: record.serviceType,
        cost: String(record.cost),
        provider: record.provider || '',
        description: record.description || '',
        notes: record.notes || '',
      },
    });
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={scheme.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: scheme.textTertiary, fontSize: 16 }}>Service record not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeColor = SERVICE_TYPE_COLORS[record.serviceType] || Colors.primary;
  const typeLabel = SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType;

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: scheme.background }]}
    >
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={scheme.textPrimary} />
            <Text style={[styles.backText, { color: '#7C3AED' }]}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={[styles.headerTitle, { color: scheme.textPrimary }]} numberOfLines={1}>
              {typeLabel}
            </Text>
            <Text style={[styles.headerSub, { color: scheme.textTertiary }]} numberOfLines={1}>
              {formatDate(record.serviceDate)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleEdit} hitSlop={12}>
              <Edit2 size={20} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)' }]}
              onPress={handleDelete}
              hitSlop={12}
            >
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecord(); }} tintColor="#7C3AED" />
          }
        >
          {/* Type Badge */}
          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
          </View>

          {/* Detail Cards */}
          <View style={styles.section}>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <DetailRow icon={<Calendar size={18} color={scheme.textTertiary} />} label="Service Date" value={formatDate(record.serviceDate)} />
              <View style={styles.cardDivider} />
              <DetailRow icon={<IndianRupee size={18} color={scheme.textTertiary} />} label="Cost" value={formatINR(record.cost)} />
              <View style={styles.cardDivider} />
              <DetailRow icon={<User size={18} color={scheme.textTertiary} />} label="Provider" value={record.provider || '—'} />
            </View>
          </View>

          {/* Description */}
          {record.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Description</Text>
              <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
                <View style={styles.descRow}>
                  <FileText size={16} color={scheme.textTertiary} />
                  <Text style={[styles.descText, { color: scheme.textSecondary }]}>{record.description}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {record.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Notes</Text>
              <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
                <View style={styles.descRow}>
                  <FileText size={16} color={scheme.textTertiary} />
                  <Text style={[styles.descText, { color: scheme.textSecondary }]}>{record.notes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Receipts — full card per receipt like bill docs */}
          {receipts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
                Receipts ({receipts.length})
              </Text>
              {receipts.map((r) => (
                <ServiceReceiptCard key={r.id} receipt={r} />
              ))}
            </View>
          )}

          {receipts.length === 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Receipts</Text>
              <View style={[styles.card, { backgroundColor: scheme.cardBackground, alignItems: 'center', paddingVertical: 24 }]}>
                <FileTextIcon size={32} color={scheme.textTertiary} />
                <Text style={{ color: scheme.textTertiary, fontSize: 13, marginTop: 8 }}>No receipts attached</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={styles.detailRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 },
  backText: { fontSize: 17, fontWeight: '400', marginLeft: -2 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.08)' },
  typeBadgeRow: { paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, gap: 6 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeBadgeText: { fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  card: { borderRadius: BorderRadius.card, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  cardDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.08)' },
  descRow: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  descText: { flex: 1, fontSize: 14, lineHeight: 22 },
});
