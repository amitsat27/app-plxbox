/**
 * Service History List — displays vehicle service records with edit/delete
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Modal, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Edit3, Trash2, ChevronRight, File, X } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { getDaysUntilExpiry, formatExpiryDate } from '../utils/compliance';
import type { ServiceRecord } from '@/src/types';
import ServiceReceiptCard from '@/components/appliances/ServiceReceiptCard';
import type { ServiceReceipt } from '@/src/types';

const SERVICE_TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  regular: { label: 'Regular', color: '#3B82F6', emoji: '🔧' },
  repair: { label: 'Repair', color: '#F59E0B', emoji: '🛠️' },
  annual: { label: 'Annual', color: '#10B981', emoji: '📋' },
  emergency: { label: 'Emergency', color: '#EF4444', emoji: '🚨' },
  other: { label: 'Other', color: '#8B5CF6', emoji: '⚙️' },
};

interface Props {
  records: ServiceRecord[];
  loading: boolean;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
  onView?: (record: ServiceRecord) => void;
}

export default function ServiceHistoryList({ records, loading, onEdit, onDelete, onView }: Props) {
  const { isDark } = useTheme();
  const rowBorder = isDark ? '#2C2C2E' : '#F2F2F7';
  const [receiptModal, setReceiptModal] = useState<ServiceReceipt | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color="#F59E0B" />
        <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#6B7280', marginTop: 8 }}>Loading records...</Text>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ fontSize: 32 }}>🔧</Text>
        <Text style={[styles.emptyTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>No Service Records Yet</Text>
        <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
          Tap &quot;Log Service&quot; above to track your vehicle&apos;s maintenance history.
        </Text>
      </View>
    );
  }

  const getReceipt = (record: ServiceRecord): ServiceReceipt | null => {
    const any = record as any;
    // Direct URL string
    const url = (any as any).receiptUrl;
    if (url) {
      return { id: record.id, url, type: 'image', uploadedAt: record.updatedAt };
    }
    // Array of receipts
    if (record.receipts?.length) {
      return { id: record.id, url: record.receipts[0].url, type: record.receipts[0].type, uploadedAt: record.receipts[0].uploadedAt, name: record.receipts[0].name };
    }
    return null;
  };

  return (
    <>
    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{records.length} Record{records.length !== 1 ? 's' : ''}</Text>
      {records.map((record, i) => {
        const meta = SERVICE_TYPE_META[record.serviceType] || SERVICE_TYPE_META.regular;
        const isLast = i === records.length - 1;
        const receipt = getReceipt(record);
        return (
          <TouchableOpacity
            key={`${record.id ?? 'record'}-${i}`}
            activeOpacity={0.6}
            onPress={() => onView?.(record)}
            style={[styles.recordRow, { borderBottomColor: rowBorder, borderBottomWidth: isLast ? 0 : 0.5 }]}
          >
            <View style={[styles.recordIcon, { backgroundColor: `${meta.color}15` }]}>
              <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
            </View>
            <View style={styles.recordInfo}>
              <Text style={[styles.recordType, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{meta.label}</Text>
              <Text style={[styles.recordMeta, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                {formatExpiryDate(record.serviceDate)}
                {record.mileageAtService ? ` · ${record.mileageAtService.toLocaleString()} km` : ''}
              </Text>
              {record.description && (
                <Text style={[styles.recordDesc, { color: isDark ? '#71717A' : '#9CA3AF' }]} numberOfLines={1}>{record.description}</Text>
              )}
              {(record.serviceCenter || record.mechanic) && (
                <Text style={[styles.recordProvider, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>
                  {record.serviceCenter || record.mechanic}
                </Text>
              )}
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.recordCost, { color: meta.color }]}>{record.cost ? `₹${record.cost.toLocaleString()}` : '—'}</Text>
              {receipt && (
                <View style={styles.receiptTag}>
                  <File size={10} color={isDark ? '#A1A1AA' : '#6B7280'} />
                  <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#A1A1AA' : '#6B7280' }}>Receipt</Text>
                </View>
              )}
              <View style={styles.recordActions}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); onEdit(record); }}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Edit3 size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); onDelete(record); }}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            <ChevronRight size={14} color={isDark ? '#555' : '#D1D5DB'} style={{ marginTop: 4 }} />
          </TouchableOpacity>
        );
      })}
    </View>

    {/* Receipt Viewer Modal */}
    <Modal visible={!!receiptModal} transparent animationType="slide" onRequestClose={() => setReceiptModal(null)}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 4 } }) }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B' }}>Service Receipt</Text>
          <TouchableOpacity onPress={() => setReceiptModal(null)} hitSlop={16}>
            <X size={22} color={isDark ? '#A1A1AA' : '#6B7280'} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {receiptModal && <ServiceReceiptCard receipt={receiptModal} />}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  recordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingRight: 4 },
  recordIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, minWidth: 0 },
  recordType: { fontSize: 14, fontWeight: '700' },
  recordMeta: { fontSize: 11, marginTop: 2 },
  recordDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  recordProvider: { fontSize: 11, marginTop: 2 },
  receiptTag: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 5, marginTop: 4, backgroundColor: 'rgba(128,128,128,0.08)' },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  recordCost: { fontSize: 13, fontWeight: '800' },
  recordActions: { flexDirection: 'row', gap: 4, marginTop: 2 },
  loadingState: { alignItems: 'center', paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
