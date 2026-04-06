/**
 * Service History List — displays vehicle service records with edit/delete
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Edit3, Trash2, Wrench, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { getDaysUntilExpiry, formatExpiryDate } from '../utils/compliance';
import type { ServiceRecord } from '@/src/types';

const SERVICE_TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  regular: { label: 'Regular', color: '#3B82F6', emoji: '🔧' },
  repair: { label: 'Repair', color: '#F59E0B', emoji: '🛠️' },
  annual: { label: 'Annual', color: '#10B981', emoji: '📋' },
  emergency: { label: 'Emergency', color: '#EF4444', emoji: '🚨' },
  custom: { label: 'Other', color: '#8B5CF6', emoji: '⚙️' },
};

interface Props {
  records: ServiceRecord[];
  loading: boolean;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
}

export default function ServiceHistoryList({ records, loading, onEdit, onDelete }: Props) {
  const { isDark } = useTheme();
  const rowBorder = isDark ? '#2C2C2E' : '#F2F2F7';

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

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{records.length} Record{records.length !== 1 ? 's' : ''}</Text>
      {records.map((record, i) => {
        const meta = SERVICE_TYPE_META[record.serviceType] || SERVICE_TYPE_META.regular;
        const isLast = i === records.length - 1;
        return (
          <View key={record.id ?? `record-${i}`} style={[styles.recordRow, { borderBottomColor: rowBorder, borderBottomWidth: isLast ? 0 : 0.5 }]}>
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
                <Text style={[styles.recordDesc, { color: isDark ? '#71717A' : '#9CA3AF' }]}>{record.description}</Text>
              )}
              {(record.serviceCenter || record.mechanic) && (
                <Text style={[styles.recordProvider, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>
                  {record.serviceCenter || record.mechanic}
                </Text>
              )}
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.recordCost, { color: meta.color }]}>{record.cost ? `₹${record.cost.toLocaleString()}` : '—'}</Text>
              <View style={styles.recordActions}>
                <TouchableOpacity onPress={() => onEdit(record)} hitSlop={8}>
                  <Edit3 size={14} color={isDark ? '#94A3B8' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(record)} hitSlop={8}>
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  recordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  recordIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, minWidth: 0 },
  recordType: { fontSize: 14, fontWeight: '700' },
  recordMeta: { fontSize: 11, marginTop: 2 },
  recordDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  recordProvider: { fontSize: 11, marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 6 },
  recordCost: { fontSize: 13, fontWeight: '800' },
  recordActions: { flexDirection: 'row', gap: 12 },
  loadingState: { alignItems: 'center', paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
