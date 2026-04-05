/**
 * TaxBillCard — aligned, premium property tax bill card
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown, CheckCircle, Clock, AlertCircle, Calendar, CreditCard, FileText } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { PropertyTaxBillEntry } from '@/src/services/FirebaseService';

const STATUS = {
  Paid: { color: '#10B981', bg: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle },
  Pending: { color: '#F59E0B', bg: { light: 'rgba(245,158,11,0.1)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock },
  Overdue: { color: '#EF4444', bg: { light: 'rgba(239,68,68,0.1)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle },
} as const;

function TaxBillCard({ bill, onPress, onEdit, onDelete }: { bill: PropertyTaxBillEntry; onPress: () => void; onEdit: () => void; onDelete: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scale = useRef(new Animated.Value(1)).current;
  const s = STATUS[bill.payStatus as keyof typeof STATUS] || STATUS.Pending;
  const Icon = s.icon;
  const amt = typeof bill.taxBillAmount === 'string' ? parseFloat(bill.taxBillAmount.replace(/,/g, '')) || 0 : bill.taxBillAmount;
  const due = bill.lastDateToPay ? new Date(bill.lastDateToPay) : null;
  const expired = due ? due < new Date() && bill.payStatus !== 'Paid' : false;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 25, stiffness: 300 }).start();
  const onPressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 25, stiffness: 300 }).start(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={{ marginBottom: Spacing.sm }}>
        <View style={{ borderRadius: 22, width: '100%', overflow: 'hidden', backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#FFFFFF', borderLeftWidth: 4, borderLeftColor: s.color, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 2 } }) }}>
          {/* Top Row: Status badge · Year · Amount */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.pill, backgroundColor: s.bg[isDark ? 'dark' : 'light'] }}>
                <Icon size={11} color={s.color} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{bill.payStatus}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color={scheme.textTertiary} />
                <Text style={{ fontSize: Typography.fontSize.md, fontWeight: '700', color: scheme.textPrimary }}>FY {bill.billYear}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: '800', color: scheme.textPrimary }}>₹{amt.toLocaleString('en-IN')}</Text>
              <Text style={{ fontSize: 10, color: scheme.textTertiary, marginTop: 2 }}>tax amount</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginHorizontal: Spacing.md }} />

          {/* Middle Row: Tax Index · City aligned */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textTertiary, marginBottom: 3 }}>Tax Index</Text>
              <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '600', color: scheme.textPrimary }} numberOfLines={1}>{bill.taxIndexNumber || '—'}</Text>
            </View>
            <View style={{ width: 1, height: 28, backgroundColor: scheme.border }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textTertiary, marginBottom: 3 }}>City</Text>
              <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: '600', color: scheme.textPrimary }} numberOfLines={1}>{bill.taxCity ? bill.taxCity.charAt(0).toUpperCase() + bill.taxCity.slice(1) : '—'}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginHorizontal: Spacing.md }} />

          {/* Bottom Row: Date · Mode · Alerts */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} color={expired ? '#EF4444' : scheme.textTertiary} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: expired ? '#EF4444' : scheme.textTertiary }}>
                {due ? due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'}
              </Text>
            </View>
            {bill.paymentMode && (
              <>
                <View style={{ width: 1, height: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <CreditCard size={13} color={scheme.textTertiary} />
                  <Text style={{ fontSize: Typography.fontSize.xs, color: scheme.textTertiary }} numberOfLines={1}>{bill.paymentMode}</Text>
                </View>
              </>
            )}
            {expired && (
              <>
                <View style={{ width: 1, height: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={13} color="#EF4444" />
                  <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: '600', color: '#EF4444' }}>Expired</Text>
                </View>
              </>
            )}
            <View style={{ flex: 1 }} />
            {bill.payStatus !== 'Paid' && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onEdit(); }} style={{ padding: 4, borderRadius: 6 }}>
                  <ChevronDown size={16} color={Colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default TaxBillCard;
