import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ServiceRecord, ServiceReceipt } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { Calendar, IndianRupee, User, FileText, ChevronDown, ChevronUp, Receipt, Edit2, Trash2, Eye } from 'lucide-react-native';
import { formatINR, formatDate } from './utils';
import * as Haptics from 'expo-haptics';

const SERVICE_TYPE_COLORS: Record<ServiceRecord['serviceType'], string> = {
  repair: Colors.error,
  maintenance: Colors.info,
  warranty: Colors.success,
  inspection: Colors.warning,
  other: Colors.primary,
  regular: Colors.primary,
  annual: Colors.warning,
  emergency: Colors.error,
};

const SERVICE_TYPE_LABELS: Record<ServiceRecord['serviceType'], string> = {
  repair: 'Repair',
  maintenance: 'Maintenance',
  warranty: 'Warranty',
  inspection: 'Inspection',
  other: 'Other',
  regular: 'Regular Service',
  annual: 'Annual Service',
  emergency: 'Emergency',
};

interface ServiceCardProps {
  service: ServiceRecord;
  applianceId?: string;
  onOpenReceipt?: (receipt: ServiceReceipt) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenDetail?: () => void;
}

export default function ServiceCard({ service, applianceId, onOpenReceipt, onEdit, onDelete, onOpenDetail }: ServiceCardProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [expanded, setExpanded] = useState(false);

  const typeColor = SERVICE_TYPE_COLORS[service.serviceType] || Colors.primary;
  const typeLabel = SERVICE_TYPE_LABELS[service.serviceType] || 'Other';
  const hasReceipts = service.receipts && service.receipts.length > 0;

  const handleCardPress = () => {
    Haptics.selectionAsync();
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      setExpanded((prev) => !prev);
    }
  };

  const handleExpand = () => {
    Haptics.selectionAsync();
    setExpanded((prev) => !prev);
  };

  return (
    <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
      {/* Main Row */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCardPress}
        style={styles.mainRow}
      >
        {/* Left Section */}
        <View style={styles.infoSection}>
          {/* Date and Type Row */}
          <View style={styles.topRow}>
            <View style={styles.dateRow}>
              <Calendar size={14} color={scheme.textSecondary} />
              <Text style={[styles.dateText, { color: scheme.textSecondary }]}>
                {formatDate(service.serviceDate)}
              </Text>
            </View>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${typeColor}18` },
              ]}
            >
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
              <Text style={[styles.badgeText, { color: typeColor }]}>
                {typeLabel}
              </Text>
            </View>
          </View>

          {/* Cost and Provider Row */}
          <View style={styles.metaRow}>
            <View style={styles.costRow}>
              <IndianRupee size={14} color={scheme.textPrimary} />
              <Text style={[styles.costText, { color: scheme.textPrimary }]}>
                {formatINR(service.cost)}
              </Text>
            </View>
            <View style={styles.providerRow}>
              <User size={13} color={scheme.textSecondary} />
              <Text
                style={[styles.providerText, { color: scheme.textSecondary }]}
                numberOfLines={1}
              >
                {service.provider}
              </Text>
            </View>
          </View>

          {/* Description */}
          {service.description && (
            <Text
              style={[styles.description, { color: scheme.textSecondary }]}
              numberOfLines={2}
            >
              {service.description}
            </Text>
          )}
        </View>

        {/* Expand Indicator & Receipts Badge */}
        <View style={styles.rightSection}>
          {hasReceipts && (
            <View
              style={[
                styles.receiptsBadge,
                { backgroundColor: `${Colors.primary}15` },
              ]}
            >
              <Receipt size={12} color={Colors.primary} />
              <Text style={[styles.receiptsText, { color: Colors.primary }]}>
                {service.receipts.length}
              </Text>
            </View>
          )}
          {expanded ? (
            <ChevronUp size={18} color={scheme.textTertiary} />
          ) : (
            <ChevronDown size={18} color={scheme.textTertiary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expandable Details */}
      {expanded && (
        <View style={[styles.detailsSection, { borderTopColor: scheme.border }]}>
          {/* Notes */}
          {service.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <FileText size={14} color={scheme.textSecondary} />
                <Text style={[styles.notesLabel, { color: scheme.textSecondary }]}>
                  Notes
                </Text>
              </View>
              <Text style={[styles.notesText, { color: scheme.textSecondary }]}>
                {service.notes}
              </Text>
            </View>
          )}

          {/* Receipts */}
          {hasReceipts && (
            <View style={styles.receiptsContainer}>
              <Text style={[styles.receiptsLabel, { color: scheme.textSecondary }]}>
                Receipts ({service.receipts.length})
              </Text>
              <View style={styles.receiptsRow}>
                {service.receipts.map((receipt) => (
                  <TouchableOpacity
                    key={receipt.id}
                    activeOpacity={0.7}
                    onPress={() => onOpenReceipt?.(receipt)}
                    style={[
                      styles.receiptThumbnail,
                      { backgroundColor: scheme.surface, borderColor: scheme.border },
                    ]}
                  >
                    {receipt.type === 'image' ? (
                      <Image
                        source={{ uri: receipt.url }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.pdfPlaceholder}>
                        <FileText size={20} color={scheme.textTertiary} />
                        <Text style={[styles.pdfLabel, { color: scheme.textTertiary }]}>
                          PDF
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* View / Edit / Delete Actions */}
          {(onOpenDetail || onEdit || onDelete) && (
            <View style={styles.actionsRow}>
              {onOpenDetail && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)', borderColor: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)' }]}
                  onPress={onOpenDetail}
                  activeOpacity={0.7}
                >
                  <Eye size={14} color="#3B82F6" />
                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>View</Text>
                </TouchableOpacity>
              )}
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)', borderColor: isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.15)' }]}
                  onPress={onEdit}
                  activeOpacity={0.7}
                >
                  <Edit2 size={14} color="#7C3AED" />
                  <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)', borderColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)' }]}
                  onPress={onDelete}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  infoSection: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  receiptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  receiptsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 14,
    paddingTop: 10,
    gap: 14,
  },
  notesContainer: {
    gap: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 18,
  },
  receiptsContainer: {
    gap: 8,
  },
  receiptsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  receiptThumbnail: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  pdfLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
