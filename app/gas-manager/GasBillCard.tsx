/**
 * Gas Bill Card — status badge, readings, due date, View Bill button
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Calendar, CreditCard, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import type { GasBillEntry } from '@/src/services/FirebaseService';

const STATUS_CONFIG: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: React.ReactNode }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.2)' }, icon: <CheckCircle size={12} color="#10B981" /> },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.1)', dark: 'rgba(245,158,11,0.2)' }, icon: <Clock size={12} color="#F59E0B" /> },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.1)', dark: 'rgba(239,68,68,0.2)' }, icon: <AlertCircle size={12} color="#EF4444" /> },
};

interface Props {
  bill: GasBillEntry;
  onViewBill: () => void;
}

export default function GasBillCard({ bill, onViewBill }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const statusCfg = STATUS_CONFIG[bill.payStatus] || STATUS_CONFIG.Pending;
  const amt = typeof bill.amountToBePaid === 'string' ? parseFloat(bill.amountToBePaid.replace(/,/g, '')) || 0 : bill.amountToBePaid;
  const dueDate = bill.lastDateToPay ? new Date(bill.lastDateToPay) : null;
  const isExpired = dueDate && dueDate < new Date() && bill.payStatus !== 'Paid';

  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#FFFFFF',
      borderLeftWidth: 4,
      borderLeftColor: statusCfg.color,
    }]}>
      {/* Top row: status + month + amount */}
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bgTint[isDark ? 'dark' : 'light'] }]}>
            {statusCfg.icon}
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>{bill.payStatus}</Text>
          </View>
          <Text style={[styles.month, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.billGenerationMonth}</Text>
        </View>
        <Text style={[styles.amount, { color: scheme.textPrimary }]}>₹{amt.toLocaleString('en-IN')}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

      {/* Middle row: readings + unit price + bill number */}
      <View style={styles.midRow}>
        <View style={styles.readBlock}>
          <Text style={[styles.readLabel, { color: scheme.textTertiary }]}>Readings</Text>
          <Text style={[styles.readValue, { color: scheme.textSecondary }]}>{bill.previousReading} → {bill.currentReading}</Text>
        </View>
        <View style={[styles.vDiv, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
        <View style={styles.readBlock}>
          <Text style={[styles.readLabel, { color: scheme.textTertiary }]}>Unit Price</Text>
          <Text style={[styles.readValue, { color: scheme.textPrimary }]}>₹{bill.unitPrice}</Text>
        </View>
        <View style={[styles.vDiv, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
        <View style={styles.readBlock}>
          <Text style={[styles.readLabel, { color: scheme.textTertiary }]}>Bill No.</Text>
          <Text style={[styles.readValue, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.billNumber || 'N/A'}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

      {/* Footer row: due date + payment mode + View Bill */}
      <View style={styles.footRow}>
        <View style={styles.footItem}>
          <Calendar size={13} color={scheme.textTertiary} />
          <Text style={[styles.footText, { color: isExpired ? '#EF4444' : scheme.textTertiary }]}>
            {dueDate ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
          </Text>
        </View>
        {bill.paymentMode && bill.paymentMode !== 'N/A' && (
          <View style={styles.footItem}>
            <CreditCard size={13} color={scheme.textTertiary} />
            <Text style={[styles.footText, { color: scheme.textTertiary }]}>{bill.paymentMode}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onViewBill}
          activeOpacity={0.6}
        >
          <Eye size={12} color={Colors.primary} />
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  leftCol: { flex: 1, minWidth: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.badge, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  month: { fontSize: Typography.fontSize.md, fontWeight: '600' },
  amount: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  divider: { height: 1, marginTop: 10, marginBottom: 10 },
  midRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  readLabel: { fontSize: 11, marginBottom: 3 },
  readValue: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  vDiv: { width: 1, height: 30 },
  footRow: { flexDirection: 'row', alignItems: 'center' },
  footItem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: Spacing.md },
  footText: { fontSize: 12 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.1)' },
  viewBtnText: { fontSize: Typography.fontSize.xs, fontWeight: '600', color: '#7C3AED' },
});
