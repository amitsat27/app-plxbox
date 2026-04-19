/**
 * Transactions Tab - Daily & On-Demand Transaction Analysis
 * Daily: Auto-poll folder, GPay/PhonePe analysis
 * On Demand: Upload PDF for analysis
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/theme/color";
import {
  Calendar,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Smartphone,
  ArrowUpDown,
  RefreshCw,
  Zap,
  AlertCircle,
  Clock,
  FolderSearch,
  Info,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Download,
  Share2,
  Eye,
  PieChart,
BarChart3,
  Filter,
  CreditCard,
  Wallet,
  Building2,
  FileText,
  Printer,
  Mail,
  Tag,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Paths, Directory, File } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  pickPDF,
  uploadToFirebaseStorage,
  analyzePDFFile,
  readPDFFile,
  generateMockAnalysis,
  formatCurrency,
  TransactionAnalysis,
  Transaction,
} from "@/src/services/TransactionAnalysisService";
import { useAuth } from "@/src/context/AuthContext";

const PULSEBOX_FOLDER = new Directory(Paths.document, "PulseboxPayments");
const AUTO_POLL_KEY = "auto_poll_enabled";
const DAILY_ANALYSIS_KEY = "daily_analysis";

type TabType = "daily" | "ondemand";
type FilterType = "all" | "gpay" | "phonepe" | "upi" | "bank";
type DateRangeType = "all" | "monthly" | "quarterly" | "yearly";

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [dailyAnalysis, setDailyAnalysis] = useState<TransactionAnalysis | null>(null);
  const [ondemandAnalysis, setOndemandAnalysis] = useState<TransactionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPollEnabled, setAutoPollEnabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<string>("Never");
  
  // Filter states
  const [selectedSource, setSelectedSource] = useState<FilterType>("all");
  const [dateRange, setDateRange] = useState<DateRangeType>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Analytics view
  const [analyticsView, setAnalyticsView] = useState<"summary" | "detailed" | "category">("summary");
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initializeFolder();
    loadSavedState();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoPollEnabled && !isPolling) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [autoPollEnabled]);

  const initializeFolder = async () => {
    try {
      if (!PULSEBOX_FOLDER.exists) {
        PULSEBOX_FOLDER.create();
      }
    } catch (error) {
      console.log("Folder initialization error:", error);
    }
  };

  const loadSavedState = async () => {
    try {
      const enabled = await AsyncStorage.getItem(AUTO_POLL_KEY);
      const savedAnalysis = await AsyncStorage.getItem(DAILY_ANALYSIS_KEY);
      
      if (enabled === "true") {
        setAutoPollEnabled(true);
      }
      if (savedAnalysis) {
        setDailyAnalysis(JSON.parse(savedAnalysis));
      }
    } catch (error) {
      console.log("Error loading state:", error);
    }
  };

  const saveDailyAnalysis = async (analysis: TransactionAnalysis) => {
    try {
      setDailyAnalysis(analysis);
      await AsyncStorage.setItem(DAILY_ANALYSIS_KEY, JSON.stringify(analysis));
    } catch (error) {
      console.log("Error saving analysis:", error);
    }
  };

  const saveAutoPollState = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_POLL_KEY, enabled.toString());
    } catch (error) {
      console.log("Error saving poll state:", error);
    }
  };

  const scanFolder = async (): Promise<string[]> => {
    try {
      await initializeFolder();
      const contents = PULSEBOX_FOLDER.list();
      const pdfFiles: string[] = [];
      
      for (const item of contents) {
        if (item instanceof File && item.name.toLowerCase().endsWith(".pdf")) {
          pdfFiles.push(item.name);
        }
      }
      
      return pdfFiles;
    } catch (error) {
      console.log("Error scanning folder:", error);
      return [];
    }
  };

  const processPDF = async (fileName: string): Promise<TransactionAnalysis | null> => {
    try {
      const pdfFile = new File(PULSEBOX_FOLDER, fileName);
      
      if (!pdfFile.exists) {
        return null;
      }

      const analysis = await analyzePDFFile(pdfFile.uri, fileName);
      
      if (analysis) {
        await uploadToFirebaseStorage({ uri: pdfFile.uri, name: fileName, size: 0 } as any, user?.uid || "anonymous");
        return analysis;
      }

      const pdfReadResult = await readPDFFile(pdfFile.uri);
      if (pdfReadResult.success) {
        return null;
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
    return null;
  };

  const pollFolder = async () => {
    if (isPolling) return;
    
    setIsPolling(true);
    try {
      const pdfFiles = await scanFolder();
      
      if (pdfFiles.length > 0) {
        let latestAnalysis: TransactionAnalysis | null = null;
        
        for (const file of pdfFiles) {
          const analysis = await processPDF(file);
          if (analysis) {
            latestAnalysis = analysis;
          }
        }
        
        if (latestAnalysis) {
          await saveDailyAnalysis(latestAnalysis);
          Alert.alert(
            "Analysis Updated!",
            `Processed ${pdfFiles.length} PDF(s) from PulseboxPayments folder.`
          );
        }
      }
      
      setLastPollTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.log("Polling error:", error);
    } finally {
      setIsPolling(false);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollFolder();
    pollIntervalRef.current = setInterval(pollFolder, 60000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const toggleAutoPoll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newState = !autoPollEnabled;
    setAutoPollEnabled(newState);
    await saveAutoPollState(newState);
    
    if (newState) {
      Alert.alert(
        "Auto-Poll Enabled",
        "The app will automatically check for new PDFs every minute."
      );
    }
  };

  const openFolderInstructions = () => {
    Alert.alert(
      "How to Add PDFs",
      Platform.OS === "ios" 
        ? "1. Open Files app\n2. Go to On My iPhone > Pulsebox\n3. Create PulseboxPayments folder\n4. Add PDF files here"
        : "1. Open file manager\n2. Go to Documents > PulseboxPayments\n3. Add PDF files here",
      [{ text: "Got it!" }]
    );
  };

  const handleOnDemandUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const file = await pickPDF();
      
      if (!file) return;

      setIsLoading(true);
      
      const analysis = await analyzePDFFile(file.uri, file.name);
      
      if (analysis) {
        await uploadToFirebaseStorage(file, user?.uid || "anonymous");
        setOndemandAnalysis(analysis);
        Alert.alert("Success", `Found ${analysis.totalTransactions} transactions in your PDF.`);
      } else {
        const pdfResult = await readPDFFile(file.uri);
        if (pdfResult.success && !pdfResult.isTextBased) {
          Alert.alert("Scanned PDF", "This PDF appears to be a scanned document. Text extraction is not available for scanned PDFs. Please use a PDF with selectable text.");
        } else {
          Alert.alert("No Transactions Found", "Could not find any transaction data in this PDF. Make sure the PDF contains transaction details from your bank or payment apps.");
        }
      }
    } catch (error) {
      console.error("Error handling PDF:", error);
      Alert.alert("Error", "Failed to process PDF file");
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source: Transaction["source"]) => {
    switch (source) {
      case "gpay": return "📱";
      case "phonepe": return "📱";
      case "upi": return "💳";
      case "bank": return "🏦";
      default: return "💰";
    }
  };

  // Filter transactions based on source and date range
  const filterTransactions = (analysis: TransactionAnalysis | null): Transaction[] => {
    if (!analysis) return [];
    
    let filtered = analysis.transactions;
    
    // Filter by source
    if (selectedSource !== "all") {
      filtered = filtered.filter(t => t.source === selectedSource);
    }
    
    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      filtered = filtered.filter(t => {
        const txDate = new Date(t.date.replace(/(\d{2})\s+(\w{3}),?\s+(\d{4})/, "$2 $1, $3"));
        if (isNaN(txDate.getTime())) return true;
        
        const monthDiff = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());
        
        switch (dateRange) {
          case "monthly": return monthDiff < 1;
          case "quarterly": return monthDiff < 3;
          case "yearly": return monthDiff < 12;
          default: return true;
        }
      });
    }
    
    return filtered;
  };

  // Get filtered analysis
  const getFilteredAnalysis = (analysis: TransactionAnalysis | null): TransactionAnalysis => {
    const filtered = filterTransactions(analysis);
    const credit = filtered.filter(t => t.type === "credit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    const debit = filtered.filter(t => t.type === "debit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    
    return {
      totalTransactions: filtered.length,
      gpayTransactions: filtered.filter(t => t.source === "gpay").length,
      phonepeTransactions: filtered.filter(t => t.source === "phonepe").length,
      totalCredit: credit,
      totalDebit: debit,
      netAmount: credit - debit,
      transactions: filtered,
      period: analysis?.period || "Unknown",
      generatedAt: analysis?.generatedAt || new Date(),
    };
  };

  // Category analysis
  const getCategoryAnalysis = (analysis: TransactionAnalysis | null) => {
    const filtered = filterTransactions(analysis);
    const categories: Record<string, { count: number; total: number; type: "credit" | "debit" }> = {};
    
    filtered.forEach(t => {
      const desc = t.description.toLowerCase();
      let category = "Other";
      
      // Categorize based on keywords
      if (desc.includes("amazon") || desc.includes("flipkart") || desc.includes("myntra") || desc.includes("snapdeal")) {
        category = "Shopping";
      } else if (desc.includes("swiggy") || desc.includes("zomato") || desc.includes("food") || desc.includes("restaurant")) {
        category = "Food";
      } else if (desc.includes("petrol") || desc.includes("fuel") || desc.includes("ioc") || desc.includes("hpcl") || desc.includes("bpc")) {
        category = "Fuel";
      } else if (desc.includes("electric") || desc.includes("msedcl") || desc.includes("mahavitaran") || desc.includes("power")) {
        category = "Electricity";
      } else if (desc.includes("gas") || desc.includes("mnngl") || desc.includes("lng")) {
        category = "Gas";
      } else if (desc.includes("jio") || desc.includes("airtel") || desc.includes("vi") || desc.includes("bsnl") || desc.includes("prepaid")) {
        category = "Mobile";
      } else if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("amazon prime") || desc.includes("hotstar") || desc.includes("youtube")) {
        category = "Entertainment";
      } else if (desc.includes("hospital") || desc.includes("doctor") || desc.includes("medical") || desc.includes("pharmacy")) {
        category = "Healthcare";
      } else if (desc.includes("school") || desc.includes("college") || desc.includes("tuition") || desc.includes("fee")) {
        category = "Education";
      } else if (desc.includes("rent") || desc.includes("emi") || desc.includes("loan")) {
        category = "Bills & EMI";
      } else if (desc.includes("transfer") || desc.includes("sent") || desc.includes("received")) {
        category = "Transfer";
      } else if (t.type === "credit") {
        category = "Income";
      }
      
      if (!categories[category]) {
        categories[category] = { count: 0, total: 0, type: t.type as "credit" | "debit" };
      }
      categories[category].count++;
      categories[category].total += parseFloat(t.amount || "0");
      categories[category].type = t.type as "credit" | "debit";
    });
    
    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  // Export functionality
  const exportToCSV = async (analysis: TransactionAnalysis | null) => {
    if (!analysis) return;
    
    const filtered = filterTransactions(analysis);
    let csv = "Date,Description,Amount,Type,Source,Reference\n";
    
    filtered.forEach(t => {
      csv += `"${t.date}","${t.description.replace(/"/g, '""')}",${t.amount},${t.type},${t.source},"${t.reference}"\n`;
    });
    
    // Add summary
    const filteredAnalysis = getFilteredAnalysis(analysis);
    csv += `\nSummary\n`;
    csv += `Total Transactions,${filteredAnalysis.totalTransactions}\n`;
    csv += `Total Credit,${filteredAnalysis.totalCredit}\n`;
    csv += `Total Debit,${filteredAnalysis.totalDebit}\n`;
    csv += `Net Amount,${filteredAnalysis.netAmount}\n`;
    
    try {
      await Share.share({
        message: csv,
        title: "Transaction Export",
      });
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Share analytics summary
  const shareAnalytics = async (analysis: TransactionAnalysis | null) => {
    if (!analysis) return;
    
    const filteredAnalysis = getFilteredAnalysis(analysis);
    const categories = getCategoryAnalysis(analysis);
    
    let summary = `📊 Transaction Analysis\n\n`;
    summary += `📅 Period: ${analysis.period}\n`;
    summary += `📈 Total Transactions: ${filteredAnalysis.totalTransactions}\n`;
    summary += `💰 Total Credit: ₹${filteredAnalysis.totalCredit.toLocaleString('en-IN')}\n`;
    summary += `💸 Total Debit: ₹${filteredAnalysis.totalDebit.toLocaleString('en-IN')}\n`;
    summary += `📊 Net: ₹${filteredAnalysis.netAmount.toLocaleString('en-IN')}\n\n`;
    
    summary += `🔍 Top Categories (Debit):\n`;
    categories.filter(c => c.type === "debit").slice(0, 5).forEach(c => {
      summary += `• ${c.name}: ₹${c.total.toLocaleString('en-IN')} (${c.count})\n`;
    });
    
    try {
      await Share.share({
        message: summary,
        title: "Transaction Summary",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const renderSourceCard = (
    source: "gpay" | "phonepe" | "upi" | "bank",
    label: string,
    icon: string,
    analysis: TransactionAnalysis | null
  ) => {
    const count = analysis?.transactions.filter(t => t.source === source).length || 0;
    const transactions = analysis?.transactions.filter(t => t.source === source) || [];
    const credit = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
    const debit = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

    return (
      <View style={styles.sourceCard}>
        <View style={styles.sourceHeader}>
          <Text style={styles.sourceIcon}>{icon}</Text>
          <Text style={styles.sourceLabel}>{label}</Text>
        </View>
        <Text style={styles.sourceCount}>{count} transactions</Text>
        <View style={styles.sourceAmounts}>
          <Text style={styles.sourceCredit}>+{formatCurrency(credit)}</Text>
          <Text style={styles.sourceDebit}>-{formatCurrency(debit)}</Text>
        </View>
      </View>
    );
  };

  const renderDailyTab = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.autoPollSection}>
        <View style={styles.autoPollCard}>
          <View style={styles.autoPollHeader}>
            <View style={styles.autoPollLeft}>
              <View style={[styles.autoPollIcon, { backgroundColor: autoPollEnabled ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.2)" }]}>
                <FolderSearch size={20} color={autoPollEnabled ? "#10B981" : "#94A3B8"} />
              </View>
              <View>
                <Text style={styles.autoPollTitle}>Auto-Scan Folder</Text>
                <View style={styles.autoPollStatus}>
                  <View style={[styles.statusDot, { backgroundColor: autoPollEnabled ? "#10B981" : "#94A3B8" }]} />
                  <Text style={styles.statusText}>{autoPollEnabled ? "Active" : "Inactive"}</Text>
                  {autoPollEnabled && <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 4 }} />}
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.toggleSwitch, autoPollEnabled && styles.toggleSwitchActive]} 
              onPress={toggleAutoPoll}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleThumb, autoPollEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.autoPollInfo}>
            <View style={styles.infoRow}>
              <Clock size={14} color="#8E8E93" />
              <Text style={styles.infoText}>Last check: {lastPollTime}</Text>
            </View>
          </View>

          <View style={styles.autoPollActions}>
            <TouchableOpacity style={styles.instructionButton} onPress={openFolderInstructions}>
              <Info size={16} color={Colors.primary} />
              <Text style={styles.instructionButtonText}>How to Add PDFs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pollNowButton, isPolling && styles.pollNowButtonDisabled]} 
              onPress={pollFolder}
              disabled={isPolling}
            >
              {isPolling ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={16} color="#FFF" />}
              <Text style={styles.pollNowButtonText}>{isPolling ? "Checking..." : "Check Now"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter and Export Bar */}
      {dailyAnalysis && (
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Filter size={16} color={Colors.primary} />
            <Text style={styles.filterButtonText}>Filter</Text>
            <ChevronDown size={14} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.filterChips}>
            {selectedSource !== "all" && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{selectedSource.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setSelectedSource("all")}>
                  <XCircle size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {dateRange !== "all" && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{dateRange}</Text>
                <TouchableOpacity onPress={() => setDateRange("all")}>
                  <XCircle size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.exportButton} onPress={() => setShowExportModal(true)}>
            <Share2 size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Analytics View Toggle */}
      {dailyAnalysis && (
        <View style={styles.analyticsToggle}>
          <TouchableOpacity 
            style={[styles.analyticsToggleBtn, analyticsView === "summary" && styles.analyticsToggleActive]}
            onPress={() => setAnalyticsView("summary")}
          >
            <PieChart size={16} color={analyticsView === "summary" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.analyticsToggleText, analyticsView === "summary" && styles.analyticsToggleTextActive]}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyticsToggleBtn, analyticsView === "detailed" && styles.analyticsToggleActive]}
            onPress={() => setAnalyticsView("detailed")}
          >
            <BarChart3 size={16} color={analyticsView === "detailed" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.analyticsToggleText, analyticsView === "detailed" && styles.analyticsToggleTextActive]}>Detailed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyticsToggleBtn, analyticsView === "category" && styles.analyticsToggleActive]}
            onPress={() => setAnalyticsView("category")}
          >
            <Wallet size={16} color={analyticsView === "category" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.analyticsToggleText, analyticsView === "category" && styles.analyticsToggleTextActive]}>Category</Text>
          </TouchableOpacity>
        </View>
      )}

      {!dailyAnalysis ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Daily Analysis Yet</Text>
          <Text style={styles.emptySubtitle}>
            Enable auto-scan or add PDFs to the PulseboxPayments folder to see your transaction analysis here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Daily Summary</Text>
              <Text style={styles.summaryPeriod}>{dailyAnalysis.period}</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.summaryLabel}>Credit</Text>
                <Text style={[styles.summaryAmount, { color: "#10B981" }]}>{formatCurrency(getFilteredAnalysis(dailyAnalysis).totalCredit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                  <TrendingDown size={20} color="#EF4444" />
                </View>
                <Text style={styles.summaryLabel}>Debit</Text>
                <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>{formatCurrency(getFilteredAnalysis(dailyAnalysis).totalDebit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(124, 58, 237, 0.1)" }]}>
                  <DollarSign size={20} color="#7C3AED" />
                </View>
                <Text style={styles.summaryLabel}>Net</Text>
                <Text style={[styles.summaryAmount, { color: getFilteredAnalysis(dailyAnalysis).netAmount >= 0 ? "#10B981" : "#EF4444" }]}>
                  {formatCurrency(getFilteredAnalysis(dailyAnalysis).netAmount)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                  <ArrowUpDown size={20} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={[styles.summaryAmount, { color: Colors.primary }]}>{getFilteredAnalysis(dailyAnalysis).totalTransactions}</Text>
              </View>
            </View>
          </View>

          {analyticsView === "category" ? (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {getCategoryAnalysis(dailyAnalysis).map((cat, idx) => (
                <View key={idx} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryAmount}>₹{cat.total.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View style={[styles.categoryBarFill, { width: `${Math.min((cat.total / getFilteredAnalysis(dailyAnalysis).totalDebit) * 100, 100)}%` }]} />
                  </View>
                  <View style={styles.categoryMeta}>
                    <Text style={styles.categoryCount}>{cat.count} transactions</Text>
                    <Text style={styles.categoryPercent}>{((cat.total / getFilteredAnalysis(dailyAnalysis).totalDebit) * 100).toFixed(1)}% of total</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sectionTitle}>Payment Sources</Text>
              <View style={styles.sourcesGrid}>
                {renderSourceCard("gpay", "GPay", "📱", getFilteredAnalysis(dailyAnalysis))}
                {renderSourceCard("phonepe", "PhonePe", "📱", getFilteredAnalysis(dailyAnalysis))}
                {renderSourceCard("upi", "UPI", "💳", getFilteredAnalysis(dailyAnalysis))}
                {renderSourceCard("bank", "Bank", "🏦", getFilteredAnalysis(dailyAnalysis))}
              </View>
            </View>
          )}

          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>{selectedSource !== "all" || dateRange !== "all" ? "Filtered Transactions" : "Recent Transactions"}</Text>
            {getFilteredAnalysis(dailyAnalysis).transactions.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: item.type === "credit" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }]}>
                    <Text style={styles.transactionSourceIcon}>{getSourceIcon(item.source)}</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: item.type === "credit" ? "#10B981" : "#EF4444" }]}>
                  {item.type === "credit" ? "+" : "-"}₹{parseFloat(item.amount).toLocaleString("en-IN")}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderOnDemandTab = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {!ondemandAnalysis ? (
        <>
          <View style={styles.uploadSection}>
            <View style={styles.uploadCard}>
              <View style={styles.uploadIconContainer}>
                <Upload size={48} color={Colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Upload PDF</Text>
              <Text style={styles.uploadSubtitle}>
                Select a bank statement or payment history PDF to analyze GPay, PhonePe, and other transactions.
              </Text>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Processing PDF...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleOnDemandUpload}>
                  <Upload size={20} color="#FFF" />
                  <Text style={styles.uploadButtonText}>Choose PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.demoCard} onPress={() => setOndemandAnalysis(generateMockAnalysis())}>
            <Zap size={24} color={Colors.primary} />
            <View style={styles.demoContent}>
              <Text style={styles.demoTitle}>View Demo Analysis</Text>
              <Text style={styles.demoSubtitle}>See a sample analysis with mock data</Text>
            </View>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>{ondemandAnalysis.period}</Text>
              <TouchableOpacity onPress={() => setOndemandAnalysis(null)} style={styles.clearBtn}>
                <XCircle size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.summaryLabel}>Credit</Text>
                <Text style={[styles.summaryAmount, { color: "#10B981" }]}>{formatCurrency(ondemandAnalysis.totalCredit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                  <TrendingDown size={20} color="#EF4444" />
                </View>
                <Text style={styles.summaryLabel}>Debit</Text>
                <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>{formatCurrency(ondemandAnalysis.totalDebit)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sourcesContainer}>
            <Text style={styles.sectionTitle}>GPay & PhonePe Analysis</Text>
            <View style={styles.sourcesGrid}>
              {renderSourceCard("gpay", "GPay", "📱", ondemandAnalysis)}
              {renderSourceCard("phonepe", "PhonePe", "📱", ondemandAnalysis)}
            </View>
          </View>

          <View style={styles.sourcesContainer}>
            <Text style={styles.sectionTitle}>Other Sources</Text>
            <View style={styles.sourcesGrid}>
              {renderSourceCard("upi", "UPI", "💳", ondemandAnalysis)}
              {renderSourceCard("bank", "Bank", "🏦", ondemandAnalysis)}
            </View>
          </View>

          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>All Transactions ({ondemandAnalysis.totalTransactions})</Text>
            {ondemandAnalysis.transactions.map((item) => (
              <View key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: item.type === "credit" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }]}>
                    <Text style={styles.transactionSourceIcon}>{getSourceIcon(item.source)}</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>{item.date}</Text>
                      <View style={[styles.transactionTypeBadge, { backgroundColor: item.type === "credit" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }]}>
                        <Text style={[styles.transactionTypeText, { color: item.type === "credit" ? "#10B981" : "#EF4444" }]}>
                          {item.type === "credit" ? "Credit" : "Debit"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: item.type === "credit" ? "#10B981" : "#EF4444" }]}>
                    {item.type === "credit" ? "+" : "-"}₹{parseFloat(item.amount).toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.transactionRef} numberOfLines={1}>{item.reference}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "daily" && styles.tabActive]}
          onPress={() => setActiveTab("daily")}
        >
          <Calendar size={18} color={activeTab === "daily" ? Colors.primary : "#8E8E93"} />
          <Text style={[styles.tabText, activeTab === "daily" && styles.tabTextActive]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "ondemand" && styles.tabActive]}
          onPress={() => setActiveTab("ondemand")}
        >
          <Upload size={18} color={activeTab === "ondemand" ? Colors.primary : "#8E8E93"} />
          <Text style={[styles.tabText, activeTab === "ondemand" && styles.tabTextActive]}>On Demand</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "daily" ? renderDailyTab() : renderOnDemandTab()}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalClose}>
                <XCircle size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Payment Source</Text>
              {(["all", "gpay", "phonepe", "upi", "bank"] as const).map((source) => (
                <TouchableOpacity 
                  key={source}
                  style={[styles.modalOption, selectedSource === source && styles.modalOptionActive]}
                  onPress={() => { setSelectedSource(source); setShowFilterModal(false); }}
                >
                  <Text style={[styles.modalOptionText, selectedSource === source && styles.modalOptionTextActive]}>
                    {source === "all" ? "All Sources" : source.toUpperCase()}
                  </Text>
                  {selectedSource === source && <CheckCircle2 size={20} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Date Range</Text>
              {([
                { value: "all", label: "All Time" },
                { value: "monthly", label: "Last Month" },
                { value: "quarterly", label: "Last 3 Months" },
                { value: "yearly", label: "Last Year" },
              ] as const).map((option) => (
                <TouchableOpacity 
                  key={option.value}
                  style={[styles.modalOption, dateRange === option.value && styles.modalOptionActive]}
                  onPress={() => { setDateRange(option.value); setShowFilterModal(false); }}
                >
                  <Text style={[styles.modalOptionText, dateRange === option.value && styles.modalOptionTextActive]}>
                    {option.label}
                  </Text>
                  {dateRange === option.value && <CheckCircle2 size={20} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="slide" onRequestClose={() => setShowExportModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowExportModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export & Share</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.modalClose}>
                <XCircle size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.exportModalOption} onPress={() => { exportToCSV(dailyAnalysis); setShowExportModal(false); }}>
              <View style={styles.exportModalIcon}>
                <FileText size={20} color={Colors.primary} />
              </View>
              <View style={styles.exportModalText}>
                <Text style={styles.exportModalTitle}>Export as CSV</Text>
                <Text style={styles.exportModalSubtitle}>Download as spreadsheet</Text>
              </View>
              <ChevronDown size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exportModalOption} onPress={() => { shareAnalytics(dailyAnalysis); setShowExportModal(false); }}>
              <View style={styles.exportModalIcon}>
                <Share2 size={20} color={Colors.primary} />
              </View>
              <View style={styles.exportModalText}>
                <Text style={styles.exportModalTitle}>Share Summary</Text>
                <Text style={styles.exportModalSubtitle}>Share via message, WhatsApp, etc.</Text>
              </View>
              <ChevronDown size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exportModalOption} onPress={() => { setShowExportModal(false); Alert.alert("Coming Soon", "PDF export feature is under development."); }}>
              <View style={styles.exportModalIcon}>
                <Printer size={20} color={Colors.primary} />
              </View>
              <View style={styles.exportModalText}>
                <Text style={styles.exportModalTitle}>Export as PDF</Text>
                <Text style={styles.exportModalSubtitle}>Generate formatted PDF report</Text>
              </View>
              <ChevronDown size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exportModalOption} onPress={() => { setShowExportModal(false); Alert.alert("Coming Soon", "Email export feature is under development."); }}>
              <View style={styles.exportModalIcon}>
                <Mail size={20} color={Colors.primary} />
              </View>
              <View style={styles.exportModalText}>
                <Text style={styles.exportModalTitle}>Email Report</Text>
                <Text style={styles.exportModalSubtitle}>Send report to your email</Text>
              </View>
              <ChevronDown size={20} color="#8E8E93" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)"
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  
  tabContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.1)" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, marginHorizontal: 4 },
  tabActive: { backgroundColor: "rgba(124, 58, 237, 0.1)" },
  tabText: { marginLeft: 6, fontSize: 14, fontWeight: "600", color: "#8E8E93" },
  tabTextActive: { color: Colors.primary },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  
  autoPollSection: { marginBottom: 20 },
  autoPollCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16 },
  autoPollHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  autoPollLeft: { flexDirection: "row", alignItems: "center" },
  autoPollIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  autoPollTitle: { fontSize: 15, fontWeight: "600", color: "#000000", marginBottom: 4 },
  autoPollStatus: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: "#8E8E93" },
  toggleSwitch: { width: 50, height: 30, borderRadius: 15, backgroundColor: "#E5E5EA", justifyContent: "center", padding: 2 },
  toggleSwitchActive: { backgroundColor: "#10B981" },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  toggleThumbActive: { alignSelf: "flex-end" },
  autoPollInfo: { backgroundColor: "#F8F9FC", borderRadius: 10, padding: 12, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { fontSize: 12, color: "#8E8E93", marginLeft: 8 },
  autoPollActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  instructionButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "rgba(124, 58, 237, 0.08)" },
  instructionButtonText: { fontSize: 13, color: Colors.primary, fontWeight: "500", marginLeft: 6 },
  pollNowButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  pollNowButtonDisabled: { opacity: 0.6 },
  pollNowButtonText: { fontSize: 13, color: "#FFF", fontWeight: "600", marginLeft: 6 },
  
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#000000", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8E8E93", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  
  summaryContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 4 },
  summaryPeriod: { fontSize: 12, color: "#8E8E93", marginBottom: 16 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryCard: { width: "47%", backgroundColor: "#F8F9FC", borderRadius: 12, padding: 12 },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  summaryLabel: { fontSize: 11, color: "#8E8E93", marginBottom: 2 },
  summaryAmount: { fontSize: 16, fontWeight: "700" },
  
  sourcesContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 12 },
  sourcesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sourceCard: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14 },
  sourceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sourceIcon: { fontSize: 20, marginRight: 8 },
  sourceLabel: { fontSize: 14, fontWeight: "600", color: "#000000" },
  sourceCount: { fontSize: 11, color: "#8E8E93", marginBottom: 6 },
  sourceAmounts: { flexDirection: "row", justifyContent: "space-between" },
  sourceCredit: { fontSize: 12, color: "#10B981", fontWeight: "600" },
  sourceDebit: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  
  transactionsSection: { marginBottom: 24 },
  transactionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  transactionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  transactionSourceIcon: { fontSize: 18 },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 13, fontWeight: "600", color: "#000000", marginBottom: 2 },
  transactionMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  transactionDate: { fontSize: 11, color: "#8E8E93" },
  transactionTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  transactionTypeText: { fontSize: 10, fontWeight: "600" },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  transactionRef: { fontSize: 10, color: "#8E8E93", maxWidth: 80 },
  
  uploadSection: { marginBottom: 16 },
  uploadCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center" },
  uploadIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(124, 58, 237, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  uploadTitle: { fontSize: 18, fontWeight: "700", color: "#000000", marginBottom: 8, textAlign: "center" },
  uploadSubtitle: { fontSize: 14, color: "#8E8E93", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#8E8E93" },
  uploadButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, backgroundColor: Colors.primary },
  uploadButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  
  demoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(124, 58, 237, 0.2)", borderStyle: "dashed" },
  demoContent: { marginLeft: 12, flex: 1 },
  demoTitle: { fontSize: 14, fontWeight: "600", color: Colors.primary, marginBottom: 2 },
  demoSubtitle: { fontSize: 12, color: "#8E8E93" },
  
  clearBtn: { padding: 4 },
  
  // Filter bar styles
  filterBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  filterButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(124, 58, 237, 0.1)" },
  filterButtonText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  filterChips: { flex: 1, flexDirection: "row", gap: 8, marginLeft: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(124, 58, 237, 0.1)" },
  filterChipText: { fontSize: 11, color: Colors.primary, fontWeight: "600" },
  exportButton: { padding: 10, borderRadius: 8, backgroundColor: "rgba(124, 58, 237, 0.1)" },
  
  // Analytics toggle styles
  analyticsToggle: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FFFFFF", gap: 8 },
  analyticsToggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: "#F3F4F6" },
  analyticsToggleActive: { backgroundColor: "rgba(124, 58, 237, 0.1)" },
  analyticsToggleText: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  analyticsToggleTextActive: { color: Colors.primary },
  
  // Category card styles
  categoryCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 10 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: "600", color: "#000000" },
  categoryAmount: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  categoryBar: { height: 8, borderRadius: 4, backgroundColor: "#F3F4F6", marginBottom: 6 },
  categoryBarFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  categoryMeta: { flexDirection: "row", justifyContent: "space-between" },
  categoryCount: { fontSize: 11, color: "#8E8E93" },
  categoryPercent: { fontSize: 11, color: "#8E8E93" },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  modalClose: { padding: 8 },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { fontSize: 14, fontWeight: "600", color: "#000000", marginBottom: 12 },
  modalOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#F8F9FC", marginBottom: 8 },
  modalOptionActive: { backgroundColor: "rgba(124, 58, 237, 0.1)", borderWidth: 1, borderColor: Colors.primary },
  modalOptionText: { fontSize: 14, color: "#000000", marginLeft: 12 },
  modalOptionTextActive: { color: Colors.primary, fontWeight: "600" },
  exportModalOption: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  exportModalIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(124, 58, 237, 0.1)" },
  exportModalText: { marginLeft: 12, flex: 1 },
  exportModalTitle: { fontSize: 15, fontWeight: "600", color: "#000000" },
  exportModalSubtitle: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
});
