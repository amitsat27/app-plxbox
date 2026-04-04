import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ServiceRecord } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { formatINR, formatDate } from './utils';
import { Settings, Wrench, Calendar, AlertTriangle, Plus } from 'lucide-react-native';

interface Props {
  records: ServiceRecord[];
  onAddRecord: () => void;
}

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  regular: Settings,
  repair: Wrench,
  annual: Calendar,
  emergency: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  regular: '#3B82F6',
  repair: '#F59E0B',
  annual: '#10B981',
  emergency: '#EF4444',
};

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  repair: 'Repair',
  annual: 'Annual',
  emergency: 'Emergency',
};

export default function ServiceHistorySection({ records, onAddRecord }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  const renderRecord = ({ item, index }: { item: ServiceRecord; index: number }) => {
    const color = TYPE_COLORS[item.serviceType] || '#64748B';
    const Icon = TYPE_ICONS[item.serviceType] || Settings;
    const isLast = index === records.length - 1;

    return (
      <View style={[styles.recordRow, !isLast && { borderBottomColor: scheme.border }]}>
        <View style={styles.timelineLeft}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
            <Icon size={18} color={color} />
          </View>
          {!isLast && (
            <View style={[styles.timelineLine, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }]} />
          )}
        </View>

        <View style={styles.recordInfo}>
          <View style={styles.recordHeader}>
            <Text style={[styles.recordType, { color: scheme.textPrimary }]}>
              {TYPE_LABELS[item.serviceType] || item.serviceType}
            </Text>
            <Text style={[styles.recordCost, { color }]}>
              {formatINR(item.cost)}
            </Text>
          </View>

          <Text style={[styles.recordDate, { color: scheme.textTertiary }]}>
            {formatDate(item.serviceDate)}
          </Text>

          {item.serviceCenter && (
            <Text style={[styles.recordDetail, { color: scheme.textTertiary }]}>
              {item.serviceCenter}
            </Text>
          )}

          {item.partsReplaced && item.partsReplaced.length > 0 && (
            <Text style={[styles.recordParts, { color: scheme.textTertiary }]}>
              Parts: {Array.isArray(item.partsReplaced) ? item.partsReplaced.join(', ') : item.partsReplaced}
            </Text>
          )}

          {item.description && (
            <Text style={[styles.recordDesc, { color: scheme.textTertiary }]}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
            Service History
          </Text>
          {records.length > 0 && (
            <Text style={[styles.totalText, { color: scheme.textTertiary }]}>
              {records.length} service records · Total {formatINR(totalCost)}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.recordsContainer, {
        backgroundColor: scheme.cardBackground,
      }]}>
        {records.length > 0 ? (
          <FlatList
            data={records}
            renderItem={renderRecord}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Wrench size={32} color={scheme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: scheme.textTertiary }]}>
              No service records
            </Text>
            <Text style={[styles.emptySub, { color: scheme.textTertiary }]}>
              Add a service record to track maintenance
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddRecord}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Service Record</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { marginBottom: 14, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalText: { fontSize: 13, marginTop: 3 },
  recordsContainer: { borderRadius: BorderRadius.card, padding: 16, marginBottom: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13 },
  recordRow: { flexDirection: 'row', paddingVertical: 14 },
  timelineLeft: { marginRight: 12, alignItems: 'center', paddingTop: 2, width: 36 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 8, borderRadius: 1 },
  recordInfo: { flex: 1, minWidth: 0 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  recordType: { fontSize: 15, fontWeight: '700' },
  recordCost: {
    fontSize: 16,
    fontWeight: '800',
  },
  recordDate: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  recordDetail: { fontSize: 13, marginBottom: 2 },
  recordParts: { fontSize: 12, marginBottom: 2, fontStyle: 'italic' },
  recordDesc: { fontSize: 13, lineHeight: 18 },
  addButton: {
    marginTop: 12,
    backgroundColor: '#7C3AED',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
