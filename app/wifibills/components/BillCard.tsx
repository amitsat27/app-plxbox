/**
 * WiFi Bills — Bill Card Component
 * Animated card showing a single WiFi bill with edit/delete actions
 */

import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Edit2, Trash2, CheckCircle2, Clock, CalendarDays } from "lucide-react-native";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { formatNumberIndian } from "@/src/utils/numberFormat";
import type { WifiBillEntry } from "@/src/hooks/useWifiBillsManager";

function formatDue(raw: string): { label: string; isOverdue: boolean } {
  if (!raw) return { label: "", isOverdue: false };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { label: raw, isOverdue: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(raw); due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, isOverdue: true };
  if (diff === 0) return { label: "Due today", isOverdue: true };
  return { label: `In ${diff}d`, isOverdue: false };
}

function StatusBadge({ status }: { status: "Paid" | "Pending" }) {
  const isPaid = status === "Paid";
  return (
    <View style={[badgeStyles.badge, { backgroundColor: isPaid ? "#10B981" : "#F59E0B" }]}>
      {isPaid ? <CheckCircle2 size={12} color="#fff" /> : <Clock size={12} color="#fff" />}
      <Text style={badgeStyles.label}>{status}</Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  label: { color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
});

interface Props {
  bill: WifiBillEntry;
  onEdit: () => void;
  onDelete: () => void;
  idx: number;
}

export function BillCard({ bill, onEdit, onDelete, idx }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scale = useRef(new Animated.Value(0)).current;
  const due = formatDue(bill.lastDateToPay);

  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 300, delay: idx * 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: scale, transform: [{ translateY: scale.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <TouchableOpacity
        style={[cardStyles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}
        activeOpacity={0.7}
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={[cardStyles.accent, { backgroundColor: bill.payStatus === "Paid" ? "#10B981" : "#F59E0B" }]} />
        <View style={cardStyles.body}>
          <View style={cardStyles.top}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[cardStyles.isp, { color: scheme.textPrimary }]} numberOfLines={1}>{bill.ispName}</Text>
              <Text style={[cardStyles.month, { color: scheme.textTertiary }]}>{bill.lastPaidBillMonth}</Text>
            </View>
            <StatusBadge status={bill.payStatus} />
          </View>
          <View style={cardStyles.bottom}>
            <View style={cardStyles.meta}>
              <CalendarDays size={13} color={due.isOverdue ? "#EF4444" : "#8E8E93"} />
              <Text style={[cardStyles.dueDate, { color: due.isOverdue ? "#EF4444" : scheme.textTertiary }]}>{due.label}</Text>
              <Text style={[cardStyles.mode, { color: scheme.textTertiary }]}>{bill.paymentMode}</Text>
            </View>
            <Text style={[cardStyles.amount, { color: scheme.textPrimary }]}>₹{formatNumberIndian(bill.billAmount)}</Text>
          </View>
          <View style={cardStyles.actions}>
            <TouchableOpacity style={[cardStyles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]} onPress={onEdit} activeOpacity={0.6}>
              <Edit2 size={14} color="#8B5CF6" />
            </TouchableOpacity>
            <TouchableOpacity style={[cardStyles.actionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]} onPress={onDelete} activeOpacity={0.6}>
              <Trash2 size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: 16, marginBottom: Spacing.sm, overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  accent: { width: 4 },
  body: { flex: 1, padding: Spacing.md },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  isp: { fontSize: Typography.fontSize.sm, fontWeight: "600" },
  month: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  dueDate: { fontSize: Typography.fontSize.xs, fontWeight: "500" },
  mode: { fontSize: 10, marginLeft: Spacing.xs },
  amount: { fontSize: Typography.fontSize.md, fontWeight: "700" },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm, justifyContent: "flex-end" },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
});
