/**
 * WiFi Bills — Main Screen (Premium Redesign)
 * Clean finance-app inspired layout with summary, filters, and bill list
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated, Alert, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Plus, Wifi } from "lucide-react-native";
import { Spacing, Typography } from "@/constants/designTokens";
import { getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { useWifiBillsManager, type WifiBillEntry, type WifiBillFormData } from "@/src/hooks/useWifiBillsManager";
import { BillCard } from "@/components/wifibills/BillCard";
import { type EditFormState, BillFormModal } from "@/components/wifibills/BillFormModal";
import { FilterBar } from "@/components/wifibills/FilterBar";
import { ShimmerList } from "@/components/wifibills/ShimmerList";
import { SummarySection } from "@/components/wifibills/SummarySection";
import { TipsSection, secTitle } from "@/components/wifibills/TipsSection";
import { pendingWifiEdit } from "@/components/wifibills/editStore";

export default function WifiBillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const { bills, loading, stats, refreshAll, addBill, updateBill, deleteBill } = useWifiBillsManager();

  const [modalVisible, setModalVisible] = useState(false);
  const [editBillData, setEditBillData] = useState<EditFormState | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filterCity, setFilterCity] = useState<string | null>(null);

  // Page entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, damping: 28, stiffness: 250, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  // Detect edit request from detail screen on focus
  useFocusEffect(
    useCallback(() => {
      if (pendingWifiEdit.current) {
        const bill = bills.find(b => b.id === pendingWifiEdit.current);
        if (bill) {
          setEditBillData({
            id: bill.id, originalCity: bill.city, ispName: bill.ispName,
            billAmount: String(bill.billAmount), payStatus: bill.payStatus,
            paymentMode: bill.paymentMode, lastDateToPay: bill.lastDateToPay,
            lastPaidBillMonth: bill.lastPaidBillMonth, city: bill.city,
          });
          setModalVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        pendingWifiEdit.current = "";
        pendingWifiEdit.city = "";
      }
    }, [bills])
  );

  const displayBills = useMemo(() => {
    let filtered = filterCity ? bills.filter((b) => b.city === filterCity) : [...bills];
    return filtered.sort((a, b) => new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
  }, [bills, filterCity]);

  const handleAdd = useCallback((d: WifiBillFormData) => {
    setFormLoading(true);
    addBill(d)
      .then(() => {
        setFormLoading(false);
        setModalVisible(false);
        setEditBillData(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .catch(() => setFormLoading(false));
  }, [addBill]);

  const handleUpdate = useCallback((d: WifiBillFormData) => {
    if (!editBillData?.id) return;
    setFormLoading(true);
    updateBill(editBillData.id, editBillData.originalCity, d)
      .then(() => {
        setFormLoading(false);
        setModalVisible(false);
        setEditBillData(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .catch(() => setFormLoading(false));
  }, [editBillData, updateBill]);

  const handleDelete = useCallback((id: string, city: string) => {
    Alert.alert("Delete Bill", "Delete this bill permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => { deleteBill(id, city); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
      },
    ]);
  }, [deleteBill]);

  const openAdd = () => {
    setEditBillData(null);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openEdit = (bill: WifiBillEntry) => {
    setEditBillData({
      id: bill.id, originalCity: bill.city, ispName: bill.ispName,
      billAmount: String(bill.billAmount), payStatus: bill.payStatus,
      paymentMode: bill.paymentMode, lastDateToPay: bill.lastDateToPay,
      lastPaidBillMonth: bill.lastPaidBillMonth, city: bill.city,
    });
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const cityCount = useMemo(() => new Set(bills.map((b) => b.city)).size, [bills]);
  const billCount = bills.length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? "#000" : "#F2F2F7" }]}>

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.6}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Wifi size={22} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.title, { color: scheme.textPrimary }]}>WiFi Bills</Text>
          </View>
          <Text style={[styles.subtitle, { color: scheme.textTertiary }]}>
            {billCount} bill{billCount !== 1 ? "s" : ""} · {cityCount} {cityCount === 1 ? "city" : "cities"}
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.7}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Content ─────────────────────────── */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshAll} tintColor="#8B5CF6" />
        }
      >
        {/* Summary section */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <SummarySection stats={stats} />
        </Animated.View>

        {/* Section label */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Text style={[secTitle, { marginTop: Spacing.sm }]}>{filterCity ? filterCity.charAt(0).toUpperCase() + filterCity.slice(1) + " Bills" : "All Bills"}</Text>
        </Animated.View>

        {/* Filters */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <FilterBar bills={bills} filterCity={filterCity} setFilterCity={setFilterCity} />
        </Animated.View>

        {/* Bill List */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {loading ? (
            <ShimmerList isDark={isDark} />
          ) : displayBills.length === 0 ? (
            <EmptyState filterCity={filterCity} onAdd={openAdd} />
          ) : (
            displayBills.map((bill, i) => (
              <BillCard
                key={bill.id}
                bill={bill}
                idx={i}
                onPress={() => router.push({
                  pathname: "/wifibills/WifiBillDetailScreen",
                  params: getDetailParams(bill),
                })}
                onEdit={() => openEdit(bill)}
                onDelete={() => handleDelete(bill.id, bill.city)}
              />
            ))
          )}
        </Animated.View>

        {/* Tips */}
        {displayBills.length > 0 && <TipsSection />}
      </Animated.ScrollView>

      {/* ── Form Modal ─────────────────────────────────── */}
      <BillFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditBillData(null); }}
        initialValues={editBillData}
        onSave={editBillData ? handleUpdate : handleAdd}
        isLoading={formLoading}
      />
    </SafeAreaView>
  );
}

/* ── Empty State ────────────────────────────────────────── */

function EmptyState({ filterCity, onAdd }: { filterCity: string | null; onAdd: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconBox, { backgroundColor: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)" }]}>
        <Wifi size={32} color="#8B5CF6" />
      </View>
      <Text style={[emptyStyles.title, { color: scheme.textPrimary }]}>
        {filterCity ? `No bills for ${filterCity.charAt(0).toUpperCase() + filterCity.slice(1)}` : "No WiFi bills yet"}
      </Text>
      <Text style={[emptyStyles.sub, { color: scheme.textTertiary }]}>
        {filterCity ? "Try selecting a different city or add a new bill" : "Tap the button below to add your first WiFi bill"}
      </Text>
      <TouchableOpacity style={emptyStyles.addBtn} onPress={onAdd} activeOpacity={0.7}>
        <Plus size={18} color="#fff" />
        <Text style={emptyStyles.addBtnText}>Add Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 48, paddingHorizontal: Spacing.xl },
  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  sub: { fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#8B5CF6", paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 16, marginTop: 20,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

/* ── Helpers ────────────────────────────────────────────── */

function getDetailParams(bill: WifiBillEntry) {
  return {
    billId: bill.id,
    city: bill.city,
    ispName: bill.ispName,
    lastPaidBillMonth: bill.lastPaidBillMonth,
    billAmount: String(bill.billAmount),
    payStatus: bill.payStatus,
    paymentMode: bill.paymentMode,
    lastDateToPay: bill.lastDateToPay,
  };
}

/* ── Style Constants ────────────────────────────────────── */

import { Colors } from "@/theme/color";

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  headerTitleRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B5CF6",
    justifyContent: "center", alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  scrollView: { flex: 1 },
});
