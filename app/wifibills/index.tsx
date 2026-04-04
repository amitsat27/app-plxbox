/**
 * WiFi Bills — Summary Strip, Filters, Shimmer, Tips, Form
 * Subcomponents extracted for clean architecture
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, Modal,
  Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Wifi, Plus } from "lucide-react-native";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { formatNumberIndian } from "@/src/utils/numberFormat";
import { useWifiBillsManager, parseBillMonth, type WifiBillEntry, type WifiBillFormData } from "@/src/hooks/useWifiBillsManager";
import { BillCard } from "./components/BillCard";

const { width: W } = Dimensions.get("window");
const CARD_INSET = 80;
const TILE_W = (W - Spacing.lg * 2 - CARD_INSET - 16) / 3;

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CITY_OPTIONS = ["pune", "nashik", "jalgaon"] as const;
const MODE_OPTIONS = ["UPI", "Cash", "Net Banking", "Card"] as const;

const WIFI_TIPS = [
  { emoji: "⚡", title: "Pay on time", sub: "Avoid service disconnection and late fees" },
  { emoji: "📊", title: "Avg. WiFi cost", sub: "~ ₹700-1,100 /mo for broadband plans" },
  { emoji: "🔄", title: "Auto-pay", sub: "Set up UPI autopay for hassle-free payments" },
];

/* ─── Edit Form State ─────────────────────────────────────────────────────── */
export interface EditFormState {
  id: string;
  originalCity: string;
  ispName: string;
  billAmount: string;
  payStatus: "Paid" | "Pending";
  paymentMode: string;
  lastDateToPay: string;
  lastPaidBillMonth: string;
  city: string;
}

/* ─── Summary Tiles ───────────────────────────────────────────────────────── */
export function SummarySection({ stats }: { stats: { totalAmount: number; pendingAmount: number; paidAmount: number } }) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.lg }}>
      <StatTile label="Total" value={`₹${formatNumberIndian(stats.totalAmount)}`} accent="#8B5CF6" isDark={isDark} />
      <StatTile label="Pending" value={`₹${formatNumberIndian(stats.pendingAmount)}`} accent="#F59E0B" isDark={isDark} />
      <StatTile label="Paid" value={`₹${formatNumberIndian(stats.paidAmount)}`} accent="#10B981" isDark={isDark} />
    </View>
  );
}

function StatTile({ label, value, accent, isDark }: { label: string; value: string; accent: string; isDark: boolean }) {
  return (
    <View style={[summaryStyles.tile, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
      <Text style={[summaryStyles.tileValue, { color: accent }]}>{value}</Text>
      <Text style={[summaryStyles.tileLabel, { color: "#8E8E93" }]}>{label}</Text>
    </View>
  );
}
const summaryStyles = StyleSheet.create({
  tile: { width: TILE_W, paddingVertical: 14, borderRadius: 16, alignItems: "center",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 }, android: { elevation: 1 } }),
  },
  tileValue: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  tileLabel: { fontSize: Typography.fontSize.xs, marginTop: 2 },
});

/* ─── Filter Chips ────────────────────────────────────────────────────────── */
export function FilterBar({ bills, filterCity, setFilterCity }: {
  bills: WifiBillEntry[];
  filterCity: string | null;
  setFilterCity: (c: string | null) => void;
}) {
  const { isDark } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
      <FilterChip label="All" active={!filterCity} onPress={() => setFilterCity(null)} isDark={isDark} />
      {[...new Set(bills.map((b) => b.city))].sort().map((c) => (
        <FilterChip key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} active={filterCity === c} onPress={() => setFilterCity(filterCity === c ? null : c)} isDark={isDark} />
      ))}
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) {
  return (
    <TouchableOpacity style={[fChipStyles.base, { backgroundColor: active ? "#8B5CF6" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", marginRight: 8 }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[fChipStyles.label, { color: active ? "#fff" : "#8E8E93" }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const fChipStyles = StyleSheet.create({ base: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, label: { fontSize: Typography.fontSize.xs, fontWeight: "600" } });

/* ─── Bill List (Loading / Empty / Cards) ─────────────────────────────────── */
export function BillListSection({ displayBills, loading, filterCity, onAdd, onEdit, onDelete, isDark }: {
  displayBills: WifiBillEntry[];
  loading: boolean;
  filterCity: string | null;
  onAdd: () => void;
  onEdit: (b: WifiBillEntry) => void;
  onDelete: (id: string, city: string) => void;
  isDark: boolean;
}) {
  const scheme = getColorScheme(isDark);
  if (loading) return <ShimmerList isDark={isDark} />;

  if (displayBills.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: Spacing.xxxl }}>
        <Wifi size={48} color={isDark ? "#374151" : "#D1D5DB"} />
        <Text style={[{ color: scheme.textTertiary, fontSize: Typography.fontSize.md, marginTop: Spacing.md, textAlign: "center" }]}>
          {filterCity ? `No WiFi bills for ${filterCity}` : "No WiFi bills found"}
        </Text>
        <TouchableOpacity style={[addBtnStyles.btn, { marginTop: Spacing.md }]} onPress={onAdd} activeOpacity={0.7}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return displayBills.map((bill, i) => (
    <BillCard key={bill.id} bill={bill} idx={i}
      onEdit={() => onEdit(bill)} onDelete={() => onDelete(bill.id, bill.city)} />
  ));
}

const addBtnStyles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B5CF6", justifyContent: "center", alignItems: "center",
    ...Platform.select({ ios: { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
});

/* ─── Shimmer Skeleton ────────────────────────────────────────────────────── */
function ShimmerList({ isDark }: { isDark: boolean }) {
  return (
    <View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, borderRadius: 16, backgroundColor: isDark ? "#1C1C1E" : "#FFF" }}>
          <View style={{ width: "15%", height: 30, borderRadius: 6, marginRight: 12, backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ width: "60%", height: 16, borderRadius: 6, backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" }} />
            <View style={{ width: "40%", height: 12, borderRadius: 6, backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" }} />
          </View>
          <View style={{ width: "30%", height: 18, borderRadius: 6, backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" }} />
        </View>
      ))}
    </View>
  );
}

/* ─── WiFi Tips ───────────────────────────────────────────────────────────── */
export function TipsSection() {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={{ opacity: fade, marginTop: Spacing.xxl }}>
      <Text style={secTitle}>{/* section title passed via parent */}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm }}>
        {WIFI_TIPS.map((t, i) => <TipCard key={t.title} tip={t} idx={i} isDark={isDark} scheme={scheme} />)}
      </View>
    </Animated.View>
  );
}

function TipCard({ tip, idx, isDark, scheme }: { tip: typeof WIFI_TIPS[0]; idx: number; isDark: boolean; scheme: ReturnType<typeof getColorScheme> }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 400, delay: 200 + idx * 100, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={{ opacity: fade, width: TILE_W }}>
      <View style={[tipStyles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
        <View style={[tipStyles.iconRing, { backgroundColor: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.08)" }]}>
          <Text style={{ fontSize: 20 }}>{tip.emoji}</Text>
        </View>
        <Text style={[tipStyles.title, { color: scheme.textPrimary }]}>{tip.title}</Text>
        <Text style={[tipStyles.sub, { color: scheme.textTertiary }]}>{tip.sub}</Text>
      </View>
    </Animated.View>
  );
}
const tipStyles = StyleSheet.create({
  card: { padding: Spacing.md, borderRadius: 16, alignItems: "center",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 }, android: { elevation: 1 } }),
  },
  iconRing: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: Spacing.sm },
  title: { fontSize: Typography.fontSize.sm, fontWeight: "600", textAlign: "center" },
  sub: { fontSize: 10, textAlign: "center", marginTop: 2 },
});

/* ─── Section Title ───────────────────────────────────────────────────────── */
export const secTitle = { fontSize: Typography.fontSize.xs, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: Spacing.sm, marginLeft: 4, color: "#8E8E93" } as const;

/* ─── Add Bill Button (Header) ────────────────────────────────────────────── */
export function AddBillButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={addBtnStyles.btn} onPress={onPress} activeOpacity={0.6}>
      <Plus size={20} color="#fff" />
    </TouchableOpacity>
  );
}

/* ═══════════════════════════ Bill Form Modal ═══════════════════════════════ */

export function BillFormModal({ visible, onClose, initialValues, onSave, isLoading }: {
  visible: boolean;
  onClose: () => void;
  initialValues?: EditFormState | null;
  onSave: (d: WifiBillFormData) => void;
  isLoading: boolean;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const editing = !!initialValues;

  const [ispName, setIspName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [payStatus, setPayStatus] = useState<"Paid" | "Pending">("Pending");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [city, setCity] = useState("pune");
  const [dueDate, setDueDate] = useState(new Date());
  const [billMonth, setBillMonth] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showMonth, setShowMonth] = useState(false);

  useEffect(() => {
    if (editing && initialValues) {
      setIspName(initialValues.ispName);
      setBillAmount(initialValues.billAmount);
      setPayStatus(initialValues.payStatus);
      setPaymentMode(initialValues.paymentMode);
      setCity(initialValues.city);
      setDueDate(new Date(initialValues.lastDateToPay));
      const d = parseBillMonth(initialValues.lastPaidBillMonth);
      if (d) setBillMonth(d);
    } else {
      setIspName(""); setBillAmount(""); setPayStatus("Pending");
      setPaymentMode("UPI"); setCity("pune");
      setDueDate(new Date()); setBillMonth(new Date());
    }
  }, [initialValues, visible]);

  const handleSubmit = () => {
    if (!ispName.trim() || !billAmount) { Alert.alert("Missing fields", "ISP Name and Bill Amount are required"); return; }
    onSave({ ispName, billAmount, payStatus, paymentMode, lastDateToPay: dueDate, lastPaidBillMonth: billMonth, city });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: isDark ? "#1C1C1E" : "#F9FAFB" }]}>
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, { color: scheme.textPrimary }]}>{editing ? "Edit Bill" : "Add WiFi Bill"}</Text>
            <TouchableOpacity onPress={onClose}><Text style={[modalStyles.cancel, { color: scheme.textTertiary }]}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={modalStyles.form} keyboardShouldPersistTaps="handled">
            <Field label="ISP Name"><TextInput style={[inputStyle.base, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]} value={ispName} onChangeText={setIspName} placeholder="e.g. ACT, Hathway" placeholderTextColor={scheme.textTertiary} autoComplete="off" /></Field>
            <Field label="Bill Amount (₹)"><TextInput style={[inputStyle.base, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]} value={billAmount} onChangeText={setBillAmount} placeholder="0" keyboardType="numeric" placeholderTextColor={scheme.textTertiary} autoComplete="off" /></Field>
            <Field label="Bill Month">
              <Pressable onPress={() => setShowMonth(true)} style={[inputStyle.base, { justifyContent: "center", backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}>
                <Text style={{ color: scheme.textPrimary }}>{MONTH_NAMES[billMonth.getMonth()]} {billMonth.getFullYear()}</Text>
              </Pressable>
            </Field>
            <Field label="Due Date">
              <Pressable onPress={() => setShowDate(true)} style={[inputStyle.base, { justifyContent: "center", backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}>
                <Text style={{ color: scheme.textPrimary }}>{dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
              </Pressable>
            </Field>
            <Field label="City">
              <View style={chipRowStyle.base}>
                {CITY_OPTIONS.map((c) => <Chip key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} active={city === c} onPress={() => setCity(c)} isDark={isDark} />)}
              </View>
            </Field>
            <Field label="Status">
              <View style={chipRowStyle.base}>
                {(["Pending", "Paid"] as const).map((s) => <Chip key={s} label={s} active={payStatus === s} onPress={() => setPayStatus(s)} isDark={isDark} />)}
              </View>
            </Field>
            <Field label="Payment Mode">
              <View style={chipRowStyle.base}>
                {MODE_OPTIONS.map((m) => <Chip key={m} label={m} active={paymentMode === m} onPress={() => setPaymentMode(m)} isDark={isDark} />)}
              </View>
            </Field>
          </ScrollView>
          <View style={modalStyles.footer}>
            {isLoading ? <ActivityIndicator color={Colors.primary} /> : (
              <TouchableOpacity style={[modalStyles.saveBtn, { opacity: ispName && billAmount ? 1 : 0.5 }]} onPress={handleSubmit} disabled={!ispName || !billAmount} activeOpacity={0.7}>
                <Text style={modalStyles.saveText}>{editing ? "Update" : "Add Bill"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showDate && <DateTimePicker mode="date" value={dueDate} onChange={(_, d) => { setShowDate(false); if (d) setDueDate(d); }} />}
        {showMonth && <DateTimePicker mode="date" display="spinner" value={billMonth} onChange={(_, d) => { setShowMonth(false); if (d) setBillMonth(d); }} />}
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return <><Text style={[fieldStyles.label, { color: scheme.textTertiary }]}>{label}</Text>{children}</>;
}
const fieldStyles = StyleSheet.create({ label: { fontSize: Typography.fontSize.xs, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 } });

function Chip({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) {
  return (
    <TouchableOpacity style={[chipStyleStyles.chip, { backgroundColor: active ? "#8B5CF6" : isDark ? "#2C2C2E" : "#F3F4F6" }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[chipStyleStyles.chipText, { color: active ? "#fff" : "#8E8E93" }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chipStyleStyles = StyleSheet.create({ chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }, chipText: { fontSize: Typography.fontSize.xs, fontWeight: "600" } });

const inputStyle = StyleSheet.create({ base: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.sm, fontSize: Typography.fontSize.sm, borderWidth: 1, borderColor: "transparent", marginBottom: Spacing.sm } });
const chipRowStyle = StyleSheet.create({ base: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.sm } });

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" as any,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: 20, paddingBottom: Spacing.md },
  title: { fontSize: 22, fontWeight: "700" },
  cancel: { fontSize: Typography.fontSize.sm, fontWeight: "500" },
  form: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.05)" },
  saveBtn: { backgroundColor: "#8B5CF6", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveText: { color: "#fff", fontSize: Typography.fontSize.md, fontWeight: "700" },
});

/* ═══════════════════════════ Main Screen ═══════════════════════════════════ */

export default function WifiBillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { bills, loading, stats, refreshAll, addBill, updateBill, deleteBill } = useWifiBillsManager();

  const [modalVisible, setModalVisible] = useState(false);
  const [editBill, setEditBill] = useState<EditFormState | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);

  const displayBills = useMemo(() => {
    let list = filterCity ? bills.filter((b) => b.city === filterCity) : [...bills];
    return list.sort((a, b) => new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
  }, [bills, filterCity]);

  const handleAdd = useCallback((d: WifiBillFormData) => {
    setFormLoading(true);
    addBill(d).then(() => { setFormLoading(false); setModalVisible(false); setEditBill(null); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }).catch(() => setFormLoading(false));
  }, [addBill]);

  const handleUpdate = useCallback((d: WifiBillFormData) => {
    if (!editBill?.id) return;
    setFormLoading(true);
    updateBill(editBill.id, editBill.originalCity, d).then(() => { setFormLoading(false); setModalVisible(false); setEditBill(null); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }).catch(() => setFormLoading(false));
  }, [editBill, updateBill]);

  const handleDelete = useCallback((id: string, city: string) => {
    Alert.alert("Delete Bill", "Are you sure you want to delete this bill?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteBill(id, city); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
    ]);
  }, [deleteBill]);

  const openAdd = () => { setEditBill(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const openEdit = (bill: WifiBillEntry) => {
    setEditBill({ id: bill.id, originalCity: bill.city, ispName: bill.ispName, billAmount: String(bill.billAmount), payStatus: bill.payStatus, paymentMode: bill.paymentMode, lastDateToPay: bill.lastDateToPay, lastPaidBillMonth: bill.lastPaidBillMonth, city: bill.city });
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const cityCount = useMemo(() => new Set(bills.map((b) => b.city)).size, [bills]);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: isDark ? "#000" : "#F2F2F7", paddingTop: insets.top }]}>
      {/* Header */}
      <View style={headerStyles.header}>
        <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()} activeOpacity={0.6}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[headerStyles.title, { color: scheme.textPrimary }]}>WiFi Bills</Text>
          <Text style={[headerStyles.sub, { color: scheme.textTertiary }]}>{bills.length} bill{bills.length !== 1 ? "s" : ""} across {cityCount} {cityCount === 1 ? "city" : "cities"}</Text>
        </View>
        <AddBillButton onPress={openAdd} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} tintColor="#8B5CF6" />}>
        {/* Summary */}
        <Animated.View style={{ opacity: fade }}>
          <Text style={secTitle}>Summary</Text>
          <SummarySection stats={stats} />
        </Animated.View>

        {/* Filters */}
        <Animated.View style={{ opacity: fade }}>
          <FilterBar bills={bills} filterCity={filterCity} setFilterCity={setFilterCity} />
        </Animated.View>

        {/* Bill List */}
        <Animated.View style={{ opacity: fade }}>
          <Text style={secTitle}>Bills</Text>
          <BillListSection displayBills={displayBills} loading={loading} filterCity={filterCity} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} isDark={isDark} />
        </Animated.View>

        {/* Tips */}
        {displayBills.length > 0 && (
          <Animated.View style={{ opacity: fade, marginTop: Spacing.xxl }}>
            <Text style={secTitle}>Insights</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm }}>
              {WIFI_TIPS.map((t, i) => <TipCard key={t.title} tip={t} idx={i} isDark={isDark} scheme={scheme} />)}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal */}
      <BillFormModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditBill(null); }}
        initialValues={editBill} onSave={editBill?.id ? handleUpdate : handleAdd} isLoading={formLoading} />
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  sub: { fontSize: Typography.fontSize.xs, marginTop: 2 },
});
