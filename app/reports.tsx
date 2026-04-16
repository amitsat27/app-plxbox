/**
 * Reports Screen — Enhanced with charts, insights, trends and export functionality
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity, Dimensions, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { BlurView } from 'expo-blur';
import {
  Wallet,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Home,
  Wifi,
  Car,
  Tv,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  FileText,
  Check,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const CATEGORY_CONFIG: Record<string, { icon: React.ReactElement; color: string; label: string }> = {
  electric: { icon: <Zap size={20} color="#F59E0B" />, color: '#F59E0B', label: 'Electricity' },
  gas: { icon: <Home size={20} color="#3B82F6" />, color: '#3B82F6', label: 'Gas' },
  wifi: { icon: <Wifi size={20} color="#8B5CF6" />, color: '#8B5CF6', label: 'WiFi' },
  property: { icon: <Home size={20} color="#10B981" />, color: '#10B981', label: 'Property' },
  vehicles: { icon: <Car size={20} color="#F97316" />, color: '#F97316', label: 'Vehicles' },
  appliances: { icon: <Tv size={20} color="#06B6D4" />, color: '#06B6D4', label: 'Appliances' },
};

const SECTIONS_TO_EXPORT = [
  { id: 'summary', label: 'Summary' },
  { id: 'breakdown', label: 'Category Breakdown' },
  { id: 'insights', label: 'Quick Insights' },
  { id: 'average', label: 'Average per Category' },
  { id: 'all', label: 'All Sections' },
];

const MONTHS = [
  { id: 'all', label: 'All Months' },
  { id: '01', label: 'January' },
  { id: '02', label: 'February' },
  { id: '03', label: 'March' },
  { id: '04', label: 'April' },
  { id: '05', label: 'May' },
  { id: '06', label: 'June' },
  { id: '07', label: 'July' },
  { id: '08', label: 'August' },
  { id: '09', label: 'September' },
  { id: '10', label: 'October' },
  { id: '11', label: 'November' },
  { id: '12', label: 'December' },
];

const CITIES = [
  { id: 'all', label: 'All Cities' },
  { id: 'pune', label: 'Pune' },
  { id: 'nashik', label: 'Nashik' },
  { id: 'jalgaon', label: 'Jalgaon' },
  { id: 'other', label: 'Other' },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const { categories, totalBillsAmount, totalBillsCount, pendingBills, overdueBills, loading, allBills } = useDashboardData(user?.uid);

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(['all']);
  const [selectedMonth, setSelectedMonth] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedCity, setSelectedCity] = useState('all');
  const [exporting, setExporting] = useState(false);

  const toggleMonth = (monthId: string) => {
    if (monthId === 'all') {
      setSelectedMonth([]);
    } else {
      setSelectedMonth(prev => 
        prev.includes(monthId) 
          ? prev.filter(m => m !== monthId)
          : [...prev, monthId]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const pendingAmt = pendingBills.reduce((s, b) => s + (b.amount ?? 0), 0);
  const overdueAmt = overdueBills.reduce((s, b) => s + (b.amount ?? 0), 0);
  const paidAmt = totalBillsAmount - pendingAmt - overdueAmt;

  const summaryCards = [
    { label: 'Total Spent', value: `₹${totalBillsAmount.toLocaleString('en-IN')}`, color: '#8B5CF6', icon: <Wallet size={20} color="#8B5CF6" />, trend: '+12%' },
    { label: 'Paid', value: `₹${paidAmt.toLocaleString('en-IN')}`, color: '#10B981', icon: <TrendingUp size={20} color="#10B981" />, trend: null },
    { label: 'Pending', value: `₹${pendingAmt.toLocaleString('en-IN')}`, color: '#F59E0B', icon: <Clock size={20} color="#F59E0B" />, trend: null },
    { label: 'Overdue', value: `₹${overdueAmt.toLocaleString('en-IN')}`, color: '#EF4444', icon: <TrendingDown size={20} color="#EF4444" />, trend: null },
  ];

  const maxAmount = Math.max(...categories.map(c => c.totalAmount), 1);

  const toggleSection = (id: string) => {
    if (id === 'all') {
      setSelectedSections(['all']);
    } else {
      const newSections = selectedSections.filter(s => s !== 'all');
      if (newSections.includes(id)) {
        const filtered = newSections.filter(s => s !== id);
        setSelectedSections(filtered.length ? filtered : ['all']);
      } else {
        setSelectedSections([...newSections, id]);
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      
      const filteredBills = allBills.filter(b => {
        if (selectedCity !== 'all') {
          const billCategory = b.category?.toLowerCase();
          if (billCategory !== selectedCity) return false;
        }
        
        if (selectedMonth.length > 0) {
          const billDate = String(b.dueDate || '');
          const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
          const billMonthIdx = months.findIndex(m => billDate.toLowerCase().startsWith(m));
          const billMonth = String(billMonthIdx + 1).padStart(2, '0');
          if (!selectedMonth.includes(billMonth)) return false;
        }
        
        if (selectedYear) {
          const billDate = String(b.dueDate || '');
          const yearMatch = billDate.match(/\d{4}/);
          if (yearMatch && yearMatch[0] !== selectedYear) return false;
        }
        
        return true;
      });

      const monthsLabel = selectedMonth.length > 0 
        ? selectedMonth.map(m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]).join('-')
        : 'All-Year';
      const fileName = `Pulsebox_Report_${selectedYear}_${monthsLabel}.pdf`;

      const filteredTotal = filteredBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      const filteredPending = filteredBills.filter(b => b.status === 'pending').reduce((s, b) => s + (b.amount || 0), 0);
      const filteredPaid = filteredTotal - filteredPending;

      const categoryData = categories.map(cat => ({
        name: CATEGORY_CONFIG[cat.category]?.label || cat.category,
        amount: cat.totalAmount,
        count: cat.count
      }));

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
              .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #7C3AED; }
              .header h1 { color: #7C3AED; font-size: 24px; margin-bottom: 4px; }
              .header p { color: #666; font-size: 14px; }
              .summary { display: flex; justify-content: space-around; margin-bottom: 24px; }
              .summary-card { background: #f5f3ff; padding: 16px; border-radius: 12px; text-align: center; flex: 1; margin: 0 4px; }
              .summary-card .label { font-size: 12px; color: #666; }
              .summary-card .value { font-size: 18px; font-weight: bold; color: #7C3AED; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background: #7C3AED; color: white; padding: 10px; text-align: left; font-weight: 600; }
              td { border-bottom: 1px solid #e5e5e5; padding: 10px; }
              tr:nth-child(even) { background: #fafafa; }
              .footer { margin-top: 24px; text-align: center; color: #999; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Pulsebox Reports</h1>
              <p>${selectedYear}${selectedMonth.length > 0 ? ` - ${selectedMonth.join('-')}` : ' - All Months'}</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="label">Total Amount</div>
                <div class="value">₹${filteredTotal.toLocaleString('en-IN')}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Bills</div>
                <div class="value">${filteredBills.length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Paid</div>
                <div class="value">₹${filteredPaid.toLocaleString('en-IN')}</div>
              </div>
              <div class="summary-card">
                <div class="label">Pending</div>
                <div class="value">₹${filteredPending.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <h3 style="margin-top: 24px; color: #7C3AED;">Category Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Bills</th>
                  <th>Amount</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                ${categoryData.map(cat => `
                  <tr>
                    <td>${cat.name}</td>
                    <td>${cat.count}</td>
                    <td>₹${cat.amount.toLocaleString('en-IN')}</td>
                    <td>${totalBillsAmount > 0 ? ((cat.amount / totalBillsAmount) * 100).toFixed(1) : 0}%</td>
                  </tr>
                `).join('')}
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
          dialogTitle: 'Export Report',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Export Complete', 'PDF has been generated and is ready to share.');
      } else {
        Alert.alert('Export Complete', `PDF saved to:\n${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
    
    setExporting(false);
    setShowExportModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top, backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={28} color={scheme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Reports</Text>
            <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#475569' }]}>Spending Analytics</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExportModal(true)}>
            <Download size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {summaryCards.map((c) => (
            <View key={c.label} style={[styles.summaryCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: isDark ? `${c.color}22` : `${c.color}11` }]}>
                {c.icon}
              </View>
              <Text style={[styles.summaryValue, { color: scheme.textPrimary }]}>{c.value}</Text>
              <Text style={[styles.summaryLabel, { color: scheme.textTertiary }]}>{c.label}</Text>
              {c.trend && (
                <View style={[styles.trendBadge, { backgroundColor: '#10B98122' }]}>
                  <ArrowUpRight size={12} color="#10B981" />
                  <Text style={styles.trendText}>{c.trend}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <PieChart size={18} color={Colors.primary} />
          <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>CATEGORY BREAKDOWN</Text>
        </View>
        
        <View style={[styles.breakdownCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {categories.map((cat, i) => {
            const config = CATEGORY_CONFIG[cat.category] || { icon: <Receipt size={20} color="#7C3AED" />, color: '#7C3AED', label: cat.label };
            const pct = totalBillsAmount > 0 ? (cat.totalAmount / totalBillsAmount) * 100 : 0;
            
            return (
              <React.Fragment key={cat.category}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
                <View style={styles.breakdownRow}>
                  <View style={[styles.catIcon, { backgroundColor: isDark ? `${config.color}22` : `${config.color}11` }]}>
                    {config.icon}
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: scheme.textPrimary }]}>{config.label}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: config.color }]} />
                      </View>
                      <Text style={[styles.catPct, { color: scheme.textTertiary }]}>{pct.toFixed(0)}%</Text>
                    </View>
                  </View>
                  <View style={styles.catAmount}>
                    <Text style={[styles.amountValue, { color: scheme.textPrimary }]}>₹{cat.totalAmount.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.amountCount, { color: scheme.textTertiary }]}>{cat.count} bills</Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Monthly Trend */}
        <View style={styles.sectionHeader}>
          <BarChart3 size={18} color={Colors.primary} />
          <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>QUICK INSIGHTS</Text>
        </View>

        <View style={[styles.insightsCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: '#10B98122' }]}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <View style={styles.insightInfo}>
              <Text style={[styles.insightTitle, { color: scheme.textPrimary }]}>Highest Spending</Text>
              <Text style={[styles.insightValue, { color: scheme.textSecondary }]}>
                {categories.length > 0 ? categories.reduce((a, b) => a.totalAmount > b.totalAmount ? a : b).label : 'N/A'}
              </Text>
            </View>
            <Text style={[styles.insightAmount, { color: '#10B981' }]}>
              ₹{categories.length > 0 ? Math.max(...categories.map(c => c.totalAmount)).toLocaleString('en-IN') : '0'}
            </Text>
          </View>
          
          <View style={[styles.insightDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: '#F59E0B22' }]}>
              <Calendar size={20} color="#F59E0B" />
            </View>
            <View style={styles.insightInfo}>
              <Text style={[styles.insightTitle, { color: scheme.textPrimary }]}>Bills This Month</Text>
              <Text style={[styles.insightValue, { color: scheme.textSecondary }]}>Upcoming due dates</Text>
            </View>
            <Text style={[styles.insightAmount, { color: '#F59E0B' }]}>
              {pendingBills.length}
            </Text>
          </View>
          
          <View style={[styles.insightDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: '#EF444422' }]}>
              <TrendingDown size={20} color="#EF4444" />
            </View>
            <View style={styles.insightInfo}>
              <Text style={[styles.insightTitle, { color: scheme.textPrimary }]}>Overdue Bills</Text>
              <Text style={[styles.insightValue, { color: scheme.textSecondary }]}>Need attention</Text>
            </View>
            <Text style={[styles.insightAmount, { color: '#EF4444' }]}>
              {overdueBills.length}
            </Text>
          </View>
        </View>

        {/* Average per Category */}
        <View style={styles.sectionHeader}>
          <Receipt size={18} color={Colors.primary} />
          <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>AVERAGE PER CATEGORY</Text>
        </View>

        <View style={[styles.avgCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {categories.map((cat, i) => {
            const config = CATEGORY_CONFIG[cat.category] || { color: '#7C3AED', label: cat.label };
            const avg = cat.count > 0 ? cat.totalAmount / cat.count : 0;
            
            return (
              <React.Fragment key={cat.category}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
                <View style={styles.avgRow}>
                  <View style={[styles.avgDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.avgLabel, { color: scheme.textPrimary }]}>{config.label}</Text>
                  <Text style={[styles.avgValue, { color: scheme.textSecondary }]}>
                    ₹{avg.toLocaleString('en-IN')} avg
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.exportModalContainer}>
          <Pressable style={styles.exportBackdrop} onPress={() => setShowExportModal(false)} />
          <View style={[styles.exportModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.exportModalHeader}>
              <Text style={[styles.exportModalTitle, { color: scheme.textPrimary }]}>Export Report</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={scheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.exportModalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>SELECT SECTIONS</Text>
              <View style={styles.exportChips}>
                {SECTIONS_TO_EXPORT.map(section => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.exportChip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                      selectedSections.includes(section.id) && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => toggleSection(section.id)}
                  >
                    <Text style={[styles.exportChipText, { color: selectedSections.includes(section.id) ? '#FFF' : scheme.textPrimary }]}>
                      {section.label}
                    </Text>
                    {selectedSections.includes(section.id) && <Check size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>YEAR</Text>
              <View style={styles.exportChips}>
                {[2026, 2025, 2024, 2023, 2022].map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.exportChip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                      selectedYear === String(year) && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => setSelectedYear(String(year))}
                  >
                    <Text style={[styles.exportChipText, { color: selectedYear === String(year) ? '#FFF' : scheme.textPrimary }]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>MONTH (Select multiple)</Text>
              <View style={styles.exportChips}>
                <TouchableOpacity
                  style={[
                    styles.exportChip,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                    selectedMonth.length === 0 && { backgroundColor: Colors.primary }
                  ]}
                  onPress={() => toggleMonth('all')}
                >
                  <Text style={[styles.exportChipText, { color: selectedMonth.length === 0 ? '#FFF' : scheme.textPrimary }]}>
                    All
                  </Text>
                </TouchableOpacity>
                {MONTHS.slice(1).map(month => (
                  <TouchableOpacity
                    key={month.id}
                    style={[
                      styles.exportChip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                      selectedMonth.includes(month.id) && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => toggleMonth(month.id)}
                  >
                    <Text style={[styles.exportChipText, { color: selectedMonth.includes(month.id) ? '#FFF' : scheme.textPrimary }]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.exportLabel, { color: scheme.textSecondary }]}>CITY</Text>
              <View style={styles.exportChips}>
                {CITIES.map(city => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.exportChip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                      selectedCity === city.id && { backgroundColor: Colors.primary }
                    ]}
                    onPress={() => setSelectedCity(city.id)}
                  >
                    <Text style={[styles.exportChipText, { color: selectedCity === city.id ? '#FFF' : scheme.textPrimary }]}>
                      {city.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.exportModalFooter}>
              <TouchableOpacity
                style={[styles.exportBtn2, { backgroundColor: Colors.primary }]}
                onPress={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Download size={20} color="#FFF" />
                    <Text style={styles.exportBtnText}>Export PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrapper: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  headerBlur: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  headerSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  exportBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  summaryCard: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2, padding: Spacing.md, borderRadius: BorderRadius.card, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  summaryIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  summaryValue: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
  summaryLabel: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  trendText: { color: '#10B981', fontSize: 10, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, marginTop: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: '600', letterSpacing: 0.8 },
  breakdownCard: { borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.lg },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  catIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catInfo: { flex: 1 },
  catName: { fontSize: Typography.fontSize.sm, fontWeight: '600', marginBottom: 4 },
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: Typography.fontSize.xs, width: 35, textAlign: 'right' },
  catAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  amountCount: { fontSize: Typography.fontSize.xs },
  divider: { height: 0.5, marginVertical: Spacing.xs },
  insightsCard: { borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.lg },
  insightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  insightIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  insightInfo: { flex: 1, marginLeft: Spacing.md },
  insightTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  insightValue: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  insightAmount: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
  insightDivider: { height: 0.5, marginVertical: Spacing.xs },
  avgCard: { borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.lg },
  avgRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  avgDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  avgLabel: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: '500' },
  avgValue: { fontSize: Typography.fontSize.sm },
  exportModalContainer: { flex: 1, justifyContent: 'flex-end' },
  exportBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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
});

const Clock = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color }} />
);
