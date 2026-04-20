/**
 * WiFi Bills — Main Screen (Premium Redesign)
 * Clean finance-app inspired layout with summary, filters, and bill list
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated, Alert, Platform, ActivityIndicator,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Pressable, TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Plus, Wifi, Download, X, Search, ArrowUpNarrowWide, ArrowDownWideNarrow } from "lucide-react-native";
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
import SectionHeroBanner from "@/components/SectionHeroBanner";

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
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [sortField, setSortField] = useState<"date" | "amount" | "isp">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedExportMonth, setSelectedExportMonth] = useState<string[]>([]);
  const [selectedExportYear, setSelectedExportYear] = useState(String(new Date().getFullYear()));
  const [selectedExportCity, setSelectedExportCity] = useState('all');

  const toggleMonth = (monthId: string) => {
    if (monthId === 'all') {
      setSelectedExportMonth([]);
    } else {
      setSelectedExportMonth(prev => 
        prev.includes(monthId) 
          ? prev.filter(m => m !== monthId)
          : [...prev, monthId]
      );
    }
  };

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

    if (statusFilter !== "All") {
      filtered = filtered.filter((b) => b.payStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((b) =>
        (b.ispName || "").toLowerCase().includes(q) ||
        (b.city || "").toLowerCase().includes(q) ||
        (b.lastPaidBillMonth || "").toLowerCase().includes(q) ||
        (b.paymentMode || "").toLowerCase().includes(q) ||
        (b.payStatus || "").toLowerCase().includes(q)
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === "amount") {
        return dir * ((a.billAmount || 0) - (b.billAmount || 0));
      }
      if (sortField === "isp") {
        return dir * (a.ispName || "").localeCompare(b.ispName || "");
      }
      return dir * (new Date(a.lastDateToPay).getTime() - new Date(b.lastDateToPay).getTime());
    });
  }, [bills, filterCity, searchQuery, sortDir, sortField, statusFilter]);

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

  const handleExport = useCallback(async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const filtered = bills.filter(b => {
        if (selectedExportCity !== 'all' && b.city?.toLowerCase() !== selectedExportCity) return false;
        
        if (selectedExportMonth.length > 0) {
          const billDate = b.lastPaidBillMonth || '';
          const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
          const billMonthIdx = months.findIndex(m => billDate.toLowerCase().startsWith(m));
          const billMonth = String(billMonthIdx + 1).padStart(2, '0');
          if (!selectedExportMonth.includes(billMonth)) return false;
        }
        
        if (selectedExportYear) {
          const billDate = b.lastPaidBillMonth || '';
          const yearMatch = billDate.match(/\d{4}/);
          if (yearMatch && yearMatch[0] !== selectedExportYear) return false;
        }
        
        return true;
      });

      const monthsLabel = selectedExportMonth.length > 0 
        ? selectedExportMonth.map(m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]).join('-')
        : 'All-Year';
      const cityLabel = selectedExportCity === 'all' ? 'AllCities' : selectedExportCity.charAt(0).toUpperCase() + selectedExportCity.slice(1);
      const fileName = `WiFi_Bills_${cityLabel}_${selectedExportYear}_${monthsLabel}.pdf`;

      const totalAmount = filtered.reduce((sum, b) => sum + (b.billAmount || 0), 0);
      const paidCount = filtered.filter(b => b.payStatus === 'Paid').length;
      const pendingCount = filtered.filter(b => b.payStatus === 'Pending').length;

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
              .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #8B5CF6; }
              .header h1 { color: #8B5CF6; font-size: 24px; margin-bottom: 4px; }
              .header p { color: #666; font-size: 14px; }
              .summary { display: flex; justify-content: space-around; margin-bottom: 24px; }
              .summary-card { background: #f5f3ff; padding: 16px; border-radius: 12px; text-align: center; flex: 1; margin: 0 4px; }
              .summary-card .label { font-size: 12px; color: #666; }
              .summary-card .value { font-size: 18px; font-weight: bold; color: #8B5CF6; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background: #8B5CF6; color: white; padding: 10px; text-align: left; font-weight: 600; }
              td { border-bottom: 1px solid #e5e5e5; padding: 10px; }
              tr:nth-child(even) { background: #fafafa; }
              .status-paid { color: #10B981; font-weight: 600; }
              .status-pending { color: #F59E0B; font-weight: 600; }
              .footer { margin-top: 24px; text-align: center; color: #999; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📶 WiFi Bills</h1>
              <p>${selectedExportYear}${selectedExportMonth.length > 0 ? ` - ${selectedExportMonth.join('-')}` : ' - All Months'}</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="label">Total Bills</div>
                <div class="value">${filtered.length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Amount</div>
                <div class="value">₹${totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div class="summary-card">
                <div class="label">Paid</div>
                <div class="value">${paidCount}</div>
              </div>
              <div class="summary-card">
                <div class="label">Pending</div>
                <div class="value">${pendingCount}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>ISP</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length > 0 ? filtered.map(b => `
                  <tr>
                    <td>${b.lastPaidBillMonth || '-'}</td>
                    <td>${b.ispName || '-'}</td>
                    <td>${b.city || '-'}</td>
                    <td>₹${b.billAmount?.toLocaleString('en-IN')}</td>
                    <td class="status-${b.payStatus?.toLowerCase()}">${b.payStatus || '-'}</td>
                    <td>${b.paymentMode || '-'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="6" style="text-align:center;">No bills found</td></tr>'}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Generated by Pulsebox on ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export WiFi Bills',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Export Complete', `PDF "${fileName}" has been generated and is ready to share.`);
      } else {
        Alert.alert('Export Complete', `PDF saved to:\n${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
    
    setExporting(false);
    setShowExportModal(false);
  }, [bills, selectedExportMonth, selectedExportYear]);

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
      billDocumentURL: bill.billDocumentURL,
    });
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const cityCount = useMemo(() => new Set(bills.map((b) => b.city)).size, [bills]);
  const billCount = bills.length;

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#000" : "#F2F2F7" }]}>

      {/* ── Header ─────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
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
        <TouchableOpacity style={[styles.addBtn, { right: 70 }]} onPress={() => setShowExportModal(true)} activeOpacity={0.7}>
          <Download size={20} color={Colors.primary} />
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
        {/* Hero Banner */}
        <SectionHeroBanner
          title="WiFi Bills"
          subtitle="Manage your internet bills"
          stats={{ billCount: bills.length, paid: stats.paidCount, pending: stats.pendingCount }}
          icon={<Wifi size={22} color={Colors.primary} />}
          countLabel="bill"
        />

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

        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <View style={styles.controlsWrap}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.iconControlBtn, { backgroundColor: showSearch ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)') }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSearch((prev) => !prev);
                  if (showSearch) setSearchQuery("");
                }}
              >
                <Search size={13} color={showSearch ? '#FFFFFF' : scheme.textSecondary} />
              </TouchableOpacity>

              {(["All", "Paid", "Pending"] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.filterChip2, { backgroundColor: statusFilter === item ? Colors.primary : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(243,243,245,0.6)') }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStatusFilter(item);
                  }}
                >
                  <Text style={[styles.filterChip2Text, { color: statusFilter === item ? '#FFFFFF' : scheme.textSecondary }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {showSearch ? (
              <View style={[styles.searchRow, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
                <Search size={15} color={scheme.textTertiary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search ISP, city, month, status"
                  placeholderTextColor={scheme.textTertiary}
                  style={[styles.searchInput, { color: scheme.textPrimary }]}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={14} color={scheme.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.iconControlBtn, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : 'rgba(243,243,245,0.7)' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                }}
              >
                {sortDir === "asc" ? (
                  <ArrowUpNarrowWide size={13} color={Colors.primary} />
                ) : (
                  <ArrowDownWideNarrow size={13} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {([
                { key: "date", label: "Date" },
                { key: "amount", label: "Amount" },
                { key: "isp", label: "ISP" },
              ] as const).map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.sortChip, { backgroundColor: sortField === item.key ? Colors.primary : 'transparent' }]}
                  onPress={() => setSortField(item.key)}
                >
                  <Text style={[styles.sortChipText, { color: sortField === item.key ? '#FFFFFF' : scheme.textTertiary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="slide" transparent onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayBg} onPress={() => setShowExportModal(false)} />
          <View style={[styles.exportModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.exportModalHeader}>
              <Text style={[styles.exportModalTitle, { color: scheme.textPrimary }]}>Export WiFi Bills</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={scheme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.exportModalBody}>
              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT YEAR</Text>
              <View style={styles.exportChips}>
                {[2026, 2025, 2024, 2023, 2022].map(year => (
                  <TouchableOpacity key={year} style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportYear === String(year) && { backgroundColor: Colors.primary }]} onPress={() => setSelectedExportYear(String(year))}>
                    <Text style={[styles.exportChipText, { color: selectedExportYear === String(year) ? '#FFF' : scheme.textPrimary }]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT CITY</Text>
              <View style={styles.exportChips}>
                {['all', 'pune', 'nashik', 'jalgaon'].map(city => (
                  <TouchableOpacity key={city} style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportCity === city && { backgroundColor: Colors.primary }]} onPress={() => setSelectedExportCity(city)}>
                    <Text style={[styles.exportChipText, { color: selectedExportCity === city ? '#FFF' : scheme.textPrimary }]}>{city === 'all' ? 'All Cities' : city.charAt(0).toUpperCase() + city.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT MONTH (Select multiple)</Text>
              <View style={styles.exportChips}>
                <TouchableOpacity style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportMonth.length === 0 && { backgroundColor: Colors.primary }]} onPress={() => toggleMonth('all')}>
                  <Text style={[styles.exportChipText, { color: selectedExportMonth.length === 0 ? '#FFF' : scheme.textPrimary }]}>All</Text>
                </TouchableOpacity>
                {[{ id: '01', label: 'Jan' }, { id: '02', label: 'Feb' }, { id: '03', label: 'Mar' }, { id: '04', label: 'Apr' }, { id: '05', label: 'May' }, { id: '06', label: 'Jun' }, { id: '07', label: 'Jul' }, { id: '08', label: 'Aug' }, { id: '09', label: 'Sep' }, { id: '10', label: 'Oct' }, { id: '11', label: 'Nov' }, { id: '12', label: 'Dec' }].map(month => (
                  <TouchableOpacity key={month.id} style={[styles.exportChip, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }, selectedExportMonth.includes(month.id) && { backgroundColor: Colors.primary }]} onPress={() => toggleMonth(month.id)}>
                    <Text style={[styles.exportChipText, { color: selectedExportMonth.includes(month.id) ? '#FFF' : scheme.textPrimary }]}>{month.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.exportModalFooter}>
              <TouchableOpacity style={[styles.exportBtn2, { backgroundColor: Colors.primary }]} onPress={handleExport} disabled={exporting}>
                {exporting ? <ActivityIndicator size="small" color="#FFF" /> : <><Download size={20} color="#FFF" /><Text style={styles.exportBtnText}>Export PDF</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  screen: { flex: 1, paddingBottom: 34 },
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

  exportBtn: { position: 'absolute', right: 70 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  exportModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  exportModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  exportModalTitle: { fontSize: 20, fontWeight: '700' },
  exportModalBody: { padding: Spacing.lg },
  exportLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, letterSpacing: 0.5 },
  exportChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  exportChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, gap: 6 },
  exportChipText: { fontSize: 13, fontWeight: '500' },
  exportModalFooter: { padding: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)' },
  exportBtn2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: 12, gap: Spacing.sm },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  controlsWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconControlBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChip2: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChip2Text: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    minHeight: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  sortChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
});
