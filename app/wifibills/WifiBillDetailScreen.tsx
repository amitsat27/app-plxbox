/**
 * WiFi Bill Detail Screen — Premium Redesign
 * Clean, finance-app inspired layout with rich bill information display
 */

import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
  Alert, Share, ActivityIndicator, Animated, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import {
  ChevronLeft, CheckCircle, Clock, AlertCircle,
  CreditCard, MapPin, Calendar, Edit, Trash2, Share2, Wifi,
  Building2, User, Phone, ReceiptText, Download, ExternalLink, File, Upload,
} from "lucide-react-native";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { firebaseService } from "@/src/services/FirebaseService";
import { markWifiBillForEdit } from "@/components/wifibills/editStore";
import { formatNumberIndian } from "@/src/utils/numberFormat";

const STATUS_MAP: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: React.ReactNode; text: string }> = {
  Paid: {
    color: "#10B981",
    bgTint: { light: "rgba(16,185,129,0.1)", dark: "rgba(16,185,129,0.18)" },
    icon: <CheckCircle size={16} color="#10B981" />,
    text: "Paid",
  },
  Pending: {
    color: "#F59E0B",
    bgTint: { light: "rgba(245,158,11,0.1)", dark: "rgba(245,158,11,0.18)" },
    icon: <Clock size={16} color="#F59E0B" />,
    text: "Pending",
  },
  Overdue: {
    color: "#EF4444",
    bgTint: { light: "rgba(239,68,68,0.1)", dark: "rgba(239,68,68,0.18)" },
    icon: <AlertCircle size={16} color="#EF4444" />,
    text: "Overdue",
  },
};

// ── Document Section ─────────────────────────────────────────────────────
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "heif", "dng"];
const getExt = (url: string): string => {
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : "";
};

const safeFirebaseUrl = (url: string): string => {
  if (!url) return "";
  return url.replace(
    /^([^?]*\/o\/)(.*?)(\?.*)$/,
    (_, before, path, query) => `${before}${encodeURIComponent(path)}${query}`,
  );
};

function DocumentSection({ url }: { url: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const ext = getExt(url);
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === "pdf";
  const noExt = !ext;
  const safeUrl = safeFirebaseUrl(url);

  const handleView = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(safeUrl, {
      presentationStyle: Platform.OS === "ios"
        ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET
        : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? "#1C1C1E" : "#FFFFFF",
      controlsColor: "#7C3AED",
    });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const baseName = safeUrl.match(/documents\/(?:wifiBills|wifibills)\/([^?]+)/)?.[1] || `wifi_bill_${Date.now()}`;
      const localUri = cacheDirectory + baseName;
      await downloadAsync(safeUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert("Saved", "File saved to cache");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setDownloading(false);
    }
  };

  const showImagePreview = isImage && !imageError;
  const tryImageFirst = noExt && !imageError;

  return (
    <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Bill Document</Text>
      {(showImagePreview || tryImageFirst) && (
        <View>
          {imageLoading && (
            <View style={styles.docLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
          <Image
            source={{ uri: safeUrl }}
            style={styles.documentImage}
            resizeMode="contain"
            onLoadEnd={() => setImageLoading(false)}
            onError={() => { setImageLoading(false); setImageError(true); }}
          />
        </View>
      )}
      {!showImagePreview && !tryImageFirst && (
        <View style={[styles.docPlaceholder, { backgroundColor: isDark ? "rgba(44,44,46,0.6)" : "#F9FAFB" }]}>
          <File size={32} color={isPdf ? "#EF4444" : scheme.textTertiary} />
          <Text style={[styles.docPlaceholderLabel, { color: scheme.textSecondary }]}>
            {ext ? ext.toUpperCase() : "Document"} File
          </Text>
        </View>
      )}
      <View style={styles.docActions}>
        <TouchableOpacity
          style={[styles.docActionBtn, { backgroundColor: Colors.primary }]}
          onPress={handleView}
        >
          <ExternalLink size={16} color="#FFF" />
          <Text style={[styles.docActionText, { color: "#FFF" }]}>View Full</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.docActionBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6" }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Download size={16} color={Colors.primary} />
              <Text style={[styles.docActionText, { color: Colors.primary }]}>Download</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
        {icon}
      </View>
      <View style={detailStyles.info}>
        <Text style={[detailStyles.label, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: accent || scheme.textPrimary }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    lineHeight: 15,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    lineHeight: 20,
  },
});

export default function WifiBillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const billId = params.billId as string;
  const city = (params.city as string) || "";
  const ispName = (params.ispName as string) || "";
  const billMonth = (params.lastPaidBillMonth as string) || "";
  const billAmountRaw = String(params.billAmount || "0");
  const billAmount = parseFloat(billAmountRaw.replace(/,/g, "")) || 0;
  const payStatus = (params.payStatus as string) || "Pending";
  const paymentMode = (params.paymentMode as string) || "";
  const dueDateStr = (params.lastDateToPay as string) || "";
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;
  const billDocumentURL = (params.billDocumentURL as string) || "";

  const [loading, setLoading] = useState(false);
  const [consumerInfo, setConsumerInfo] = useState<any>(null);
  const [fetchedConsumer, setFetchedConsumer] = useState(false);

  // Page entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 28, stiffness: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // Fetch consumer info
  React.useEffect(() => {
    if (fetchedConsumer) return;
    setFetchedConsumer(true);
    const consumerNum = params.consumerNumber as string;
    if (consumerNum && consumerNum !== "undefined") {
      firebaseService.getConsumerInfo(consumerNum).then(setConsumerInfo);
    }
  }, [params.consumerNumber, fetchedConsumer]);

  const statusCfg = STATUS_MAP[payStatus] || STATUS_MAP.Pending;

  // Compute due info
  const getDueInfo = () => {
    if (!dueDate) return { label: "No due date set", sub: "", isOverdue: false, color: scheme.textTertiary };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dueDateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)} days overdue`, sub: "Pay immediately to avoid disconnection", isOverdue: true, color: "#EF4444" };
    if (diff === 0) return { label: "Due today", sub: "Don't miss the deadline", isOverdue: true, color: "#EF4444" };
    if (diff === 1) return { label: "Due tomorrow", sub: "Almost time", isOverdue: false, color: "#F59E0B" };
    if (diff <= 5) return { label: `${diff} days remaining`, sub: "Pay before the due date", isOverdue: false, color: "#F59E0B" };
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      sub: "",
      isOverdue: false,
      color: scheme.textSecondary,
    };
  };
  const dueInfo = getDueInfo();

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markWifiBillForEdit(billId, city);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete Bill", "Are you sure you want to delete this bill?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await firebaseService.deleteWifiBill(city, billId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e.message);
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `WiFi Bill: ${ispName}\nMonth: ${billMonth}\nAmount: ₹${formatNumberIndian(billAmount)}\nStatus: ${payStatus}`,
    });
  };

  const handleUploadDocument = async (type: 'camera' | 'gallery' | 'pdf') => {
    try {
      let uri = '';
      
      if (type === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission denied', 'Camera permission is required');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
        if (!res.canceled && res.assets?.[0]?.uri) {
          uri = res.assets[0].uri;
        }
      } else if (type === 'gallery') {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          uri = res.assets[0].uri;
        }
      } else if (type === 'pdf') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });
        if (result.assets && result.assets[0]?.uri) {
          uri = result.assets[0].uri;
        }
      }
      
      if (!uri) return;
      
      setLoading(true);
      const uploadedUrl = await firebaseService.uploadComplianceDocument(
        '',
        '',
        'service',
        uri
      );
      
      Alert.alert('Success', 'Document uploaded successfully');
      router.replace(`/wifi-bill-detail?billId=${billId}&city=${city}&billDocumentURL=${encodeURIComponent(uploadedUrl)}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const fullCity = city.charAt(0).toUpperCase() + city.slice(1);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#000000" : "#F2F2F7" }]}>
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.6}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]} numberOfLines={1}>{ispName}</Text>
          <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>{billMonth}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleEdit} activeOpacity={0.6}>
          <Edit size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare} activeOpacity={0.6}>
          <Share2 size={18} color={scheme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            {/* Status Pill */}
            <View style={[
              styles.statusPill,
              { backgroundColor: statusCfg.bgTint[isDark ? "dark" : "light"] },
            ]}>
              {statusCfg.icon}
              <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
            </View>

            {/* Amount */}
            <Text style={[styles.heroAmount, { color: scheme.textPrimary }]}>
              ₹{formatNumberIndian(billAmount)}
            </Text>

            {/* City */}
            <View style={styles.heroMeta}>
              <Wifi size={16} color={scheme.textTertiary} />
              <Text style={[styles.heroCity, { color: scheme.textSecondary }]}>{fullCity}</Text>
            </View>

            {/* Due info for pending bills */}
            {payStatus !== "Paid" && (
              <View style={[styles.dueBanner, { backgroundColor: dueInfo.isOverdue
                ? (isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.04)")
                : (isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.04)")
              }]}>
                <Text style={[styles.dueBannerText, { color: dueInfo.color }]}>
                  {dueInfo.label}
                </Text>
                {dueInfo.sub && (
                  <Text style={[styles.dueBannerSub, { color: dueInfo.color }]}>
                    {dueInfo.sub}
                  </Text>
                )}
              </View>
            )}

            {/* Paid: show bill month */}
            {payStatus === "Paid" && (
              <View style={[styles.paidBanner, { backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.04)" }]}>
                <Text style={[styles.paidBannerText, { color: "#10B981" }]}>
                  Bill for {billMonth}
                </Text>
              </View>
            )}
          </View>

          {/* Bill Details Card */}
          <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Bill Details</Text>
            <DetailRow
              icon={<ReceiptText size={16} color="#8B5CF6" />}
              label="ISP Provider"
              value={ispName}
            />
            <DetailRow
              icon={<Calendar size={16} color="#A78BFA" />}
              label="Bill Month"
              value={billMonth}
            />
            <DetailRow
              icon={<Calendar size={16} color={dueInfo.isOverdue ? "#EF4444" : "#F59E0B"} />}
              label="Due Date"
              value={dueDate
                ? dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                : "Not set"
              }
            />
            <DetailRow
              icon={<MapPin size={16} color="#3B82F6" />}
              label="City"
              value={fullCity}
            />
          </View>

          {/* Payment Card */}
          <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Payment</Text>
            <DetailRow
              icon={<CreditCard size={16} color={statusCfg.color} />}
              label="Status"
              value={payStatus}
              accent={statusCfg.color}
            />
            <DetailRow
              icon={<CheckCircle size={16} color="#3B82F6" />}
              label="Payment Mode"
              value={paymentMode || "\u2014"}
            />
          </View>

          {/* Consumer Info Card */}
          {consumerInfo && (
            <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Consumer Information</Text>
              <DetailRow
                icon={<User size={16} color="#10B981" />}
                label="Holder"
                value={consumerInfo.holderName}
              />
              <DetailRow
                icon={<Building2 size={16} color="#A78BFA" />}
                label="Consumer Number"
                value={consumerInfo.consumerNumber}
              />
              <DetailRow
                icon={<MapPin size={16} color="#F59E0B" />}
                label="Location"
                value={consumerInfo.location}
              />
              <DetailRow
                icon={<Building2 size={16} color="#06B6D4" />}
                label="Billing Unit"
                value={consumerInfo.billingUnitNumber}
              />
              <DetailRow
                icon={<Phone size={16} color="#EC4899" />}
                label="Mobile"
                value={consumerInfo.registeredMobile}
              />
            </View>
          )}

          {/* Document */}
          <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            <View style={styles.docHeader}>
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Document</Text>
              <TouchableOpacity 
                style={[styles.uploadBtn, { backgroundColor: Colors.primary + '15' }]} 
                onPress={() => {
                  Alert.alert(
                    'Upload Document',
                    'Choose how to upload',
                    [
                      { text: 'Camera', onPress: () => handleUploadDocument('camera') },
                      { text: 'Gallery', onPress: () => handleUploadDocument('gallery') },
                      { text: 'PDF File', onPress: () => handleUploadDocument('pdf') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Upload size={14} color={Colors.primary} />
                <Text style={[styles.uploadBtnText, { color: Colors.primary }]}>Upload</Text>
              </TouchableOpacity>
            </View>
            
            {billDocumentURL ? (
              <DocumentSection url={billDocumentURL} />
            ) : (
              <View style={styles.noDocContainer}>
                <File size={32} color={scheme.textTertiary} />
                <Text style={[styles.noDocText, { color: scheme.textTertiary }]}>No document attached</Text>
                <Text style={[styles.noDocSubtext, { color: scheme.textTertiary }]}>Tap Upload to add bill photo or PDF</Text>
              </View>
            )}
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)" }]}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.deleteBtnText, { color: "#EF4444" }]}>Delete Bill</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 34 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", zIndex: 100 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: { padding: 4, borderRadius: 8 },
  headerCenter: { flex: 1, alignItems: "center", marginRight: Spacing.lg * 2.5 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: "700" },
  headerSub: { fontSize: Typography.fontSize.xs },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  // Hero Card
  heroCard: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    borderRadius: BorderRadius.card,
    ...Platform.select({
      ios: {
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.md,
  },
  statusPillText: { fontSize: Typography.fontSize.sm, fontWeight: "600" },
  heroAmount: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroCity: { fontSize: Typography.fontSize.sm, fontWeight: "500" },

  // Banners
  dueBanner: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  dueBannerText: { fontSize: Typography.fontSize.sm, fontWeight: "700" },
  dueBannerSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },

  paidBanner: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  paidBannerText: { fontSize: Typography.fontSize.sm, fontWeight: "600" },

  // Cards
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },

  // Delete
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  deleteBtnText: { fontSize: Typography.fontSize.sm, fontWeight: "600" },

  // Document
  docLoading: { padding: Spacing.xl, alignItems: "center" },
  documentImage: { width: "100%", height: 200, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  docPlaceholder: { padding: Spacing.xl + 2, alignItems: "center", borderRadius: BorderRadius.md, gap: Spacing.xs },
  docPlaceholderLabel: { fontSize: Typography.fontSize.sm, fontWeight: "600" },
  docActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  docActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.xs },
  docActionText: { fontSize: Typography.fontSize.sm, fontWeight: "600" },
  docHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  uploadBtnText: { fontSize: Typography.fontSize.sm, fontWeight: "600" },
  noDocContainer: { alignItems: "center", paddingVertical: Spacing.xl },
  noDocText: { fontSize: Typography.fontSize.md, fontWeight: "600", marginTop: Spacing.sm },
  noDocSubtext: { fontSize: Typography.fontSize.sm, marginTop: Spacing.xs, opacity: 0.7 },
});
