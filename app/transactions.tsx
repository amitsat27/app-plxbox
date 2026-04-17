/**
 * Transactions Tab - Daily & On-Demand Transaction Analysis
 * Daily: Auto-poll folder, GPay/PhonePe analysis
 * On Demand: Upload PDF for analysis
 */

import React, { useState, useEffect, useRef } from "react";
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
            <Text style={styles.summaryTitle}>Daily Summary</Text>
            <Text style={styles.summaryPeriod}>{dailyAnalysis.period}</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.summaryLabel}>Credit</Text>
                <Text style={[styles.summaryAmount, { color: "#10B981" }]}>{formatCurrency(dailyAnalysis.totalCredit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                  <TrendingDown size={20} color="#EF4444" />
                </View>
                <Text style={styles.summaryLabel}>Debit</Text>
                <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>{formatCurrency(dailyAnalysis.totalDebit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(124, 58, 237, 0.1)" }]}>
                  <DollarSign size={20} color="#7C3AED" />
                </View>
                <Text style={styles.summaryLabel}>Net</Text>
                <Text style={[styles.summaryAmount, { color: dailyAnalysis.netAmount >= 0 ? "#10B981" : "#EF4444" }]}>
                  {formatCurrency(dailyAnalysis.netAmount)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                  <ArrowUpDown size={20} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={[styles.summaryAmount, { color: Colors.primary }]}>{dailyAnalysis.totalTransactions}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sourcesContainer}>
            <Text style={styles.sectionTitle}>Payment Sources</Text>
            <View style={styles.sourcesGrid}>
              {renderSourceCard("gpay", "GPay", "📱", dailyAnalysis)}
              {renderSourceCard("phonepe", "PhonePe", "📱", dailyAnalysis)}
              {renderSourceCard("upi", "UPI", "💳", dailyAnalysis)}
              {renderSourceCard("bank", "Bank", "🏦", dailyAnalysis)}
            </View>
          </View>

          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {dailyAnalysis.transactions.slice(0, 5).map((item) => (
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
});
