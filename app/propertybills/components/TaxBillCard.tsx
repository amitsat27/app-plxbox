/**
 * Property Tax — TaxBillCard (Clean, No Images)
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalendarDays, ChevronRight, FileText, IndianRupee } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { PropertyTaxBillEntry } from '@/src/services/FirebaseService';

const STATUS = {
  Paid: { color: '#10B981', label: 'Paid' },
  Pending: { color: '#F59E0B', label: 'Pending' },
  Overdue: { color: '#EF4444', label: 'Overdue' },
} as const;

function TaxBillCard({ bill, onPress, onEdit, onDelete, index = 0 }: {
  bill: PropertyTaxBillEntry; onPress: () => void; onEdit: () => void; onDelete: () => void; index?: number;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const pressScale = useRef(new Animated.Value(1)).current;
  const slideIn = useRef(new Animated.Value(30)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const s = STATUS[bill.payStatus as keyof typeof STATUS] || STATUS.Pending;
  const amt = typeof bill.taxBillAmount === 'string'
    ? parseFloat(bill.taxBillAmount.replace(/,/g, '')) || 0
    : bill.taxBillAmount || 0;

  // Safe date parsing — handles various formats from Firebase
  const due = (() => {
    if (!bill.lastDateToPay) return null;
    const d = new Date(bill.lastDateToPay);
    return isNaN(d.getTime()) ? null : d;
  })();

  const expired = due ? due < new Date() && bill.payStatus !== 'Paid' : false;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideIn, { toValue: 0, damping: 24, stiffness: 260, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [fade, slideIn, index]);

  const dueText = due
    ? due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideIn }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(pressScale, { toValue: 0.98, damping: 20, stiffness: 300, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressScale, { toValue: 1, damping: 20, stiffness: 300, useNativeDriver: true }).start();
        }}
        onPress={onPress}
        style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
      >
        <View style={styles.content}>
          {/* Top: Status badge, Year + Amount */}
          <View style={styles.topRow}>
            <View style={styles.leftCol}>
              <View style={[styles.badge, { backgroundColor: isDark ? `${s.color}18` : `${s.color}10` }]}>
                <View style={[styles.badgeDot, { backgroundColor: s.color }]} />
                <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
              </View>
              <Text style={[styles.yearLabel, { color: isDark ? '#6E6E71' : '#8E8E93' }]}>Financial Year</Text>
              <Text style={[styles.yearValue, { color: scheme.textPrimary }]}>{bill.billYear}</Text>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.amountRow}>
                <IndianRupee size={14} color={scheme.textPrimary} />
                <Text style={[styles.amount, { color: scheme.textPrimary }]}>
                  {amt.toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={[styles.amountSub, { color: isDark ? '#6E6E71' : '#8E8E93' }]}>tax amount</Text>
            </View>
          </View>

          {/* Separator */}
          <View style={[styles.separator, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

          {/* Bottom: meta */}
          <View style={styles.bottomRow}>
            <View style={styles.metaItem}>
              <CalendarDays size={13} color={expired ? '#EF4444' : scheme.textTertiary} />
              <Text style={[styles.metaText, { color: expired ? '#EF4444' : scheme.textTertiary }]} numberOfLines={1}>
                {expired ? 'Overdue' : 'Due'} {dueText}
              </Text>
            </View>

            {bill.paymentMode && bill.payStatus === 'Paid' && (
              <>
                <View style={styles.divider} />
                <View style={styles.metaItem}>
                  <FileText size={12} color={scheme.textTertiary} />
                  <Text style={[styles.metaText, { color: scheme.textTertiary }]} numberOfLines={1}>{bill.paymentMode}</Text>
                </View>
              </>
            )}

            <View style={{ flex: 1 }} />

            {/* Edit/Delete for pending */}
            {bill.payStatus !== 'Paid' && (
              <>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(); }}
                  style={styles.actionBtn}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.actionText, { color: '#8B5CF6' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
                  style={styles.actionBtn}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <ChevronRight size={16} color={scheme.textTertiary} style={{ marginLeft: 2 }} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: { flex: 1, gap: 5 },
  rightCol: { alignItems: 'flex-end', gap: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.pill, alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  yearLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  yearValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountSub: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(142,142,147,0.2)',
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TaxBillCard;
