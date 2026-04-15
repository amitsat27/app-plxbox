/** Electric Bill Card component */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, CreditCard, Eye } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import type { ElectricBillEntry } from '@/src/services/FirebaseService';
import { STATUS_CONFIG } from '@/src/constants/electric-bills/constants';

export default function BillCard({ bill, onViewBill }: { bill: ElectricBillEntry; onViewBill: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const statusCfg = STATUS_CONFIG[bill.payStatus] || STATUS_CONFIG.Pending;
  const StatusIcon = statusCfg.icon || Clock;
  const amt = typeof bill.billAmount === 'string' ? parseFloat(bill.billAmount.replace(/,/g, '')) || 0 : bill.billAmount;
  const dueDate = bill.lastDateToPay ? new Date(bill.lastDateToPay) : null;
  const isExpired = dueDate && dueDate < new Date() && bill.payStatus !== 'Paid';

  return (
    <View style={[styles.billCard, { backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#FFFFFF', borderLeftWidth: 3, borderLeftColor: statusCfg.color }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bgTint[isDark ? 'dark' : 'light'] }]}>
            <StatusIcon size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{bill.payStatus}</Text>
          </View>
          <Text style={[styles.month, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.billMonth}</Text>
        </View>
        <Text style={[styles.amount, { color: scheme.textPrimary }]}>₹{amt.toLocaleString('en-IN')}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={styles.cardMiddle}>
        <InfoBlock label="Consumption" value={`${bill.totalUnits}`} sub="units" scheme={scheme} />
        <View style={[styles.vDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
        <InfoBlock label="Readings" value={`${bill.lastReading} → ${bill.currentReading}`} scheme={scheme} />
        <View style={[styles.vDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
        <InfoBlock label="Consumer" value={bill.consumerNumber || '—'} scheme={scheme} />
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Calendar size={12} color={scheme.textTertiary} />
          <Text style={[styles.footerText, { color: isExpired ? '#EF4444' : scheme.textTertiary }]}>
            {dueDate ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
          </Text>
        </View>
        {bill.paymentMode && (
          <>
            <View style={[styles.vDividerSmall, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            <View style={styles.footerItem}>
              <CreditCard size={12} color={scheme.textTertiary} />
              <Text style={[styles.footerText, { color: scheme.textTertiary }]}>{bill.paymentMode}</Text>
            </View>
          </>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.viewBtn} onPress={onViewBill} activeOpacity={0.6}>
          <Eye size={12} color={Colors.primary} />
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoBlock({ label, value, sub, scheme }: { label: string; value: string; sub?: string; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={[styles.infoLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: scheme.textPrimary }]}>{value}{sub && <Text style={styles.sub}>{sub}</Text>}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  billCard: { borderRadius: 20, padding: Spacing.sm, marginVertical: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cardLeft: { flex: 1, minWidth: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.badge, alignSelf: 'flex-start', marginBottom: 4 },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  month: { fontSize: Typography.fontSize.md, fontWeight: '600', flex: 1 },
  amount: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  divider: { height: 1, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xs },
  infoBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  infoLabel: { fontSize: Typography.fontSize.xs, marginBottom: 2 },
  infoValue: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  sub: { fontSize: 10, fontWeight: '400' },
  vDivider: { width: 1, height: 28 },
  vDividerSmall: { width: 1, height: 14, marginHorizontal: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, paddingTop: Spacing.xs },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: Typography.fontSize.xs },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.1)' },
  viewBtnText: { fontSize: Typography.fontSize.xs, fontWeight: '600', color: '#7C3AED' },
});
