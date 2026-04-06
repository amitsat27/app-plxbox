/**
 * WiFi Bills — Add / Edit Bill Form Modal (Premium iOS Style)
 * Bottom-sheet with segmented controls, clean fields, and haptics
 * Custom date picker panel (no native DateTimePicker z-index issues)
 */

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import {
  X, Wifi, IndianRupee, CalendarDays, MapPin, CreditCard, ChevronUp,
  Camera, Upload, FileText, Check,
} from "lucide-react-native";
import { useTheme } from "@/theme/themeProvider";
import { getColorScheme, Colors } from "@/theme/color";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { parseBillMonth, type WifiBillFormData } from "@/src/hooks/useWifiBillsManager";

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

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const CITY_OPTIONS = ["pune", "nashik", "jalgaon"] as const;
const MODE_OPTIONS = ["UPI", "Cash", "Net Banking", "Card"] as const;

const MONTH_SCROLL = Array.from({ length: 50 }, () => Array.from(
  { length: 12 }, (_, m) => m,
)).flat();

interface Props {
  visible: boolean;
  onClose: () => void;
  initialValues?: EditFormState | null;
  onSave: (d: WifiBillFormData) => void;
  isLoading: boolean;
}

export function BillFormModal({ visible, onClose, initialValues, onSave, isLoading }: Props) {
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
  const [showPicker, setShowPicker] = useState<"date" | "month" | null>(null);

  // Bottom sheet animation
  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      slideY.setValue(500);
      Animated.spring(slideY, {
        toValue: 0,
        damping: 22,
        stiffness: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideY.setValue(0);
    }
  }, [visible, slideY]);

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
  }, [initialValues, visible, editing]);

  const handleSubmit = () => {
    if (!ispName.trim() || !billAmount) {
      Alert.alert("Missing fields", "ISP Name and Bill Amount are required");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      ispName, billAmount, payStatus, paymentMode,
      lastDateToPay: dueDate, lastPaidBillMonth: billMonth, city,
    });
  };

  const closePicker = () => {
    setShowPicker(null);
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Dim backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          {/* Sheet handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: isDark ? "#3A3A3C" : "#C7C7CC" }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Wifi size={20} color={Colors.primary} />
              <Text style={[styles.title, { color: scheme.textPrimary }]}>
                {editing ? "Edit Bill" : "Add WiFi Bill"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <View style={[styles.closeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                <X size={18} color={scheme.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form or Date Picker */}
          {!showPicker ? (
            <>
              <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                {/* ISP Name */}
                <Field label="ISP Name" icon={<Wifi size={15} color="#8B5CF6" />}>
                  <TextInput
                    style={[inputStyles.base, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}
                    value={ispName}
                    onChangeText={setIspName}
                    placeholder="e.g. ACT, Hathway, Jio"
                    placeholderTextColor={scheme.textTertiary}
                    autoComplete="off"
                  />
                </Field>

                {/* Bill Amount */}
                <Field label="Bill Amount" icon={<IndianRupee size={15} color="#10B981" />}>
                  <TextInput
                    style={[inputStyles.base, inputStyles.amountInput, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}
                    value={billAmount}
                    onChangeText={setBillAmount}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={scheme.textTertiary}
                    autoComplete="off"
                  />
                </Field>

                {/* Bill Month */}
                <Field label="Bill Month" icon={<CalendarDays size={15} color="#F59E0B" />}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPicker("month"); }}
                    style={[inputStyles.base, { justifyContent: "center", backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}
                  >
                    <View style={fieldValueStyles.row}>
                      <Text style={[fieldValueStyles.text, { color: scheme.textPrimary }]}>
                        {MONTH_NAMES[billMonth.getMonth()]} {billMonth.getFullYear()}
                      </Text>
                      <ChevronUp size={14} color={scheme.textTertiary} />
                    </View>
                  </Pressable>
                </Field>

                {/* Due Date */}
                <Field label="Due Date" icon={<CalendarDays size={15} color="#EF4444" />}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPicker("date"); }}
                    style={[inputStyles.base, { justifyContent: "center", backgroundColor: isDark ? "#2C2C2E" : "#FFF" }]}
                  >
                    <View style={fieldValueStyles.row}>
                      <Text style={[fieldValueStyles.text, { color: scheme.textPrimary }]}>
                        {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                      <ChevronUp size={14} color={scheme.textTertiary} />
                    </View>
                  </Pressable>
                </Field>

                {/* City */}
                <Field label="City" icon={<MapPin size={15} color="#3B82F6" />}>
                  <ChipGroup
                    options={CITY_OPTIONS}
                    value={city}
                    onChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCity(v); }}
                    formatLabel={(c: string) => c.charAt(0).toUpperCase() + c.slice(1)}
                    isDark={isDark}
                  />
                </Field>

                {/* Status */}
                <Field label="Payment Status" icon={<CreditCard size={15} color="#10B981" />}>
                  <ChipGroup
                    options={["Pending", "Paid"] as const}
                    value={payStatus}
                    onChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPayStatus(v as "Paid" | "Pending"); }}
                    isDark={isDark}
                  />
                </Field>

                {/* Payment Mode */}
                <Field label="Payment Mode" icon={<CreditCard size={15} color="#6366F1" />}>
                  <ChipGroup
                    options={MODE_OPTIONS}
                    value={paymentMode}
                    onChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPaymentMode(v); }}
                    isDark={isDark}
                  />
                </Field>
              </ScrollView>

              {/* Footer button */}
              <View style={styles.footer}>
                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <TouchableOpacity
                    style={[styles.saveBtn, { opacity: ispName && billAmount ? 1 : 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!ispName || !billAmount}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveText}>
                      {editing ? "Update Bill" : "Add Bill"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <CustomDatePicker
              mode={showPicker}
              selectedDate={showPicker === "date" ? dueDate : billMonth}
              onDateChange={showPicker === "date"
                ? (d) => setDueDate(d)
                : (d) => setBillMonth(d)
              }
              onClose={closePicker}
              isDark={isDark}
              scheme={scheme}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ── Custom Date Picker Panel ─────────────────────────── */

function CustomDatePicker({ mode, selectedDate, onDateChange, onClose, isDark, scheme }: {
  mode: "date" | "month";
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  onClose: () => void;
  isDark: boolean;
  scheme: ReturnType<typeof getColorScheme>;
}) {
  const slideIn = useRef(new Animated.Value(300)).current;
  const [tempDate, setTempDate] = useState(new Date(selectedDate));

  useEffect(() => {
    Animated.spring(slideIn, {
      toValue: 0,
      damping: 22,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  }, [slideIn]);

  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDateChange(new Date(tempDate));
    onClose();
  };

  /* ── Date mode: calendar-style day selector ── */
  if (mode === "date") {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const today = new Date();
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <Animated.View
        style={[
          styles.pickerPanel,
          {
            transform: [{ translateY: slideIn }],
            backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
          },
        ]}
      >
        {/* Picker header */}
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: scheme.textPrimary }]}>
            Select Due Date
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <X size={20} color={scheme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Month/Year nav */}
        <View style={styles.pickerNav}>
          <TouchableOpacity
            onPress={() => {
              setTempDate(new Date(year, month - 1, 1));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.6}
          >
            <ChevronUp size={20} color={scheme.textPrimary} style={{ transform: [{ rotate: "180deg" }] }} />
          </TouchableOpacity>
          <Text style={[styles.pickerMonth, { color: scheme.textPrimary }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setTempDate(new Date(year, month + 1, 1));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.6}
          >
            <ChevronUp size={20} color={scheme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {weekdays.map((w) => (
            <Text key={w} style={styles.weekdayText}>{w}</Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.dayGrid}>
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <View key={`e-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isSelected = day === tempDate.getDate() && month === tempDate.getMonth() && year === tempDate.getFullYear();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isSelected && { backgroundColor: "#8B5CF6" },
                  isToday && !isSelected && { borderWidth: 1, borderColor: "#8B5CF6" },
                ]}
                onPress={() => {
                  setTempDate(new Date(year, month, day));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && { color: "#fff", fontWeight: "700" },
                    isToday && !isSelected && { color: "#8B5CF6", fontWeight: "600" },
                    !isSelected && !isToday && { color: scheme.textPrimary },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm button */}
        <TouchableOpacity style={styles.pickerConfirm} onPress={confirm} activeOpacity={0.7}>
          <Text style={styles.pickerConfirmText}>
            {tempDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
          <Text style={styles.pickerConfirmSub}>Confirm</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  /* ── Month mode: scrollable month picker ── */
  const currentMonth = tempDate.getMonth();
  const currentYear = tempDate.getFullYear();

  return (
    <Animated.View
      style={[
        styles.pickerPanel,
        {
          transform: [{ translateY: slideIn }],
          backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
        },
      ]}
    >
      {/* Picker header */}
      <View style={styles.pickerHeader}>
        <Text style={[styles.pickerTitle, { color: scheme.textPrimary }]}>
          Select Bill Month
        </Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
          <X size={20} color={scheme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Year nav */}
      <View style={styles.pickerNav}>
        <TouchableOpacity
          onPress={() => { setTempDate(new Date(currentYear - 1, currentMonth, 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.6}
        >
          <ChevronUp size={20} color={scheme.textPrimary} style={{ transform: [{ rotate: "180deg" }] }} />
        </TouchableOpacity>
        <Text style={[styles.pickerMonth, { color: scheme.textPrimary }]}>{currentYear}</Text>
        <TouchableOpacity
          onPress={() => { setTempDate(new Date(currentYear + 1, currentMonth, 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.6}
        >
          <ChevronUp size={20} color={scheme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Month grid */}
      <View style={styles.monthGrid}>
        {MONTH_NAMES.map((name, m) => {
          const isSelected = m === tempDate.getMonth() && currentYear === tempDate.getFullYear();
          const isCurrentMonth = m === new Date().getMonth() && currentYear === new Date().getFullYear();
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthCell,
                isSelected && { backgroundColor: "#8B5CF6" },
                isCurrentMonth && !isSelected && { borderWidth: 1, borderColor: "#8B5CF6" },
              ]}
              onPress={() => { setTempDate(new Date(currentYear, m, 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.monthText,
                  isSelected && { color: "#fff", fontWeight: "700" },
                  isCurrentMonth && !isSelected && { color: "#8B5CF6", fontWeight: "600" },
                  !isSelected && !isCurrentMonth && { color: scheme.textPrimary },
                ]}
              >
                {name.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Confirm button */}
      <TouchableOpacity style={styles.pickerConfirm} onPress={confirm} activeOpacity={0.7}>
        <Text style={styles.pickerConfirmText}>
          {MONTH_NAMES[tempDate.getMonth()]} {tempDate.getFullYear()}
        </Text>
        <Text style={styles.pickerConfirmSub}>Confirm</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={fieldStyles.fieldGroup}>
      <View style={fieldStyles.fieldLabelRow}>
        {icon}
        <Text style={[fieldStyles.label, { color: scheme.textTertiary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ChipGroup({ options, value, onChange, formatLabel, isDark }: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  formatLabel?: (v: string) => string;
  isDark: boolean;
}) {
  return (
    <View style={chipRowStyles.base}>
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              chipRowStyles.chip,
              { backgroundColor: isActive ? "#8B5CF6" : isDark ? "#2C2C2E" : "#F3F4F6" },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.7}
          >
            <Text style={[chipRowStyles.chipText, { color: isActive ? "#fff" : "#8E8E93" }]}>
              {formatLabel ? formatLabel(opt) : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const inputStyles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    fontSize: Typography.fontSize.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  amountInput: {
    fontWeight: "700",
    fontSize: Typography.fontSize.md,
  },
});

const fieldStyles = StyleSheet.create({
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

const fieldValueStyles = StyleSheet.create({
  row: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, width: "100%" as const },
  text: { fontWeight: "500" as const },
});

const chipRowStyles = StyleSheet.create({
  base: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.sm },
  chipText: { fontSize: Typography.fontSize.xs, fontWeight: "600" },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  handleBar: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: Spacing.md },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  form: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl + 8 },
  saveBtn: { backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  saveText: { color: "#fff", fontSize: Typography.fontSize.md, fontWeight: "700" },

  // Date picker panel
  pickerPanel: {
    padding: Spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pickerTitle: { fontSize: Typography.fontSize.md, fontWeight: "700" },
  pickerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  pickerMonth: { fontSize: Typography.fontSize.md, fontWeight: "700" },

  // Date calendar grid
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: Spacing.md,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: "#8B5CF6",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Month grid
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.md,
  },
  monthCell: {
    width: "30%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(142,142,147,0.08)",
  },
  monthText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Picker confirm button
  pickerConfirm: {
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  pickerConfirmText: {
    color: "#fff",
    fontSize: Typography.fontSize.md,
    fontWeight: "700",
  },
  pickerConfirmSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 2,
  },
});
