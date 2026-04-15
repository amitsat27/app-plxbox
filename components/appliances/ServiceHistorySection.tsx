import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ServiceRecord, ServiceReceipt } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { Wrench, Plus } from 'lucide-react-native';
import ServiceCard from './ServiceCard';
import * as Haptics from 'expo-haptics';

interface ServiceHistorySectionProps {
  records: ServiceRecord[];
  applianceId: string;
  onAddRecord: () => void;
  onOpenReceipt?: (receipt: ServiceReceipt) => void;
  onEditRecord?: (record: ServiceRecord) => void;
  onDeleteRecord?: (record: ServiceRecord) => void;
  onOpenDetail?: (record: ServiceRecord) => void;
}

export default function ServiceHistorySection({
  records,
  applianceId,
  onAddRecord,
  onOpenReceipt,
  onEditRecord,
  onDeleteRecord,
  onOpenDetail,
}: ServiceHistorySectionProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddRecord();
  };

  const renderItem = ({ item }: { item: ServiceRecord }) => (
    <ServiceCard
      service={item}
      applianceId={applianceId}
      onOpenReceipt={onOpenReceipt}
      onEdit={onEditRecord ? () => onEditRecord(item) : undefined}
      onDelete={onDeleteRecord ? () => onDeleteRecord(item) : undefined}
      onOpenDetail={onOpenDetail ? () => onOpenDetail(item) : undefined}
    />
  );

  const keyExtractor = (item: ServiceRecord) => item.id;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: scheme.textPrimary }]}>
            Service History
          </Text>
          <View style={[styles.countBadge, { backgroundColor: `${Colors.primary}15` }]}>
            <Text style={[styles.countText, { color: Colors.primary }]}>
              {records.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${Colors.primary}10` }]}>
              <Wrench size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>
              No service records yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: scheme.textTertiary }]}>
              Add your first service record
            </Text>
          </View>
        ) : (
          <FlatList
            data={records}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleAdd}
        style={[
          styles.fab,
          {
            backgroundColor: Colors.primary,
            shadowColor: Colors.primary,
          },
        ]}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    minHeight: 120,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
