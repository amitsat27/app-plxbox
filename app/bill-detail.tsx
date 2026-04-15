/**
 * Bill Detail Screen — View electric bill with consumer info, meter data, and actions
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
  Alert, Share, Image, ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  ChevronLeft, Zap, CheckCircle, Clock, AlertCircle,
  CreditCard, MapPin, User, Building2, Phone, Droplets,
  Edit, Trash2, Share2, Download, Gauge, Calendar, File, ExternalLink
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';
import { markBillForEdit } from './electric-bills/index';

const STATUS_MAP: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: any; text: string }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.12)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle, text: 'Paid' },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.12)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock, text: 'Pending' },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.12)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle, text: 'Overdue' },
};

// Fix Firebase Storage URL: expo-router decodes %2F to /, re-encode the path after /o/
const safeFirebaseUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(
    /^([^?]*\/o\/)(.*?)(\?.*)$/,
    (_, before, path, query) => `${before}${encodeURIComponent(path)}${query}`,
  );
};

// Document Section — same pattern as gas bill detail
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];
const getExt = (url: string): string => {
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : '';
};

function DocumentSection({ url }: { url: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const ext = getExt(url);
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === 'pdf';
  const noExt = !ext;
  const safeUrl = safeFirebaseUrl(url);

  const handleView = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(safeUrl, {
      presentationStyle: Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: '#7C3AED',
    });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Extract original filename from Firebase Storage path
      const fileExt = getExt(safeUrl) || ext || 'jpeg';
      const pathMatch = safeUrl.match(/documents\/electricBills\/([^?]+)/);
      let baseName = pathMatch ? pathMatch[1] : `bill_${Date.now()}`;
      // If no extension, add .jpeg
      if (!/\.\w+$/.test(baseName)) baseName += '.jpeg';
      const localUri = (FileSystem as any).cacheDirectory + baseName;
      await FileSystem.downloadAsync(safeUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert('Saved', 'File saved to cache');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setDownloading(false);
    }
  };

  // Known image extension → show preview; no extension → try image, fall back; PDF → placeholder
  const showImagePreview = isImage && !imageError;
  const tryImageFirst = noExt && !imageError;

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Bill Document</Text>
      {(showImagePreview || tryImageFirst) && (
        <View>
          {imageLoading && <View style={styles.docLoading}><ActivityIndicator size="small" color={Colors.primary} /></View>}
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
        <View style={[styles.docPlaceholder, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F9FAFB' }]}>
          <File size={32} color={isPdf ? '#EF4444' : scheme.textTertiary} />
          <Text style={[styles.docPlaceholderLabel, { color: scheme.textSecondary }]}>
            {ext ? ext.toUpperCase() : 'Document'} File
          </Text>
        </View>
      )}
      <View style={styles.docActions}>
        <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: Colors.primary }]} onPress={handleView}>
          <ExternalLink size={16} color="#FFF" />
          <Text style={[styles.docActionText, { color: '#FFF' }]}>View Full</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handleDownload} disabled={downloading}>
          {downloading ? <ActivityIndicator size="small" color={Colors.primary} /> : (
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

export default function BillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const billId = params.billId as string;
  const city = params.city as string;
  const billMonth = params.billMonth as string;
  const lastReading = parseFloat(String(params.lastReading || '0'));
  const currentReading = parseFloat(String(params.currentReading || '0'));
  const totalUnits = parseFloat(String(params.totalUnits || '0'));
  const billAmountRaw = String(params.billAmount || '0');
  const billAmount = parseFloat(billAmountRaw.replace(/,/g, '')) || 0;
  const payStatus = params.payStatus as string;
  const paymentMode = params.paymentMode as string;
  const billDocumentURL = params.billDocumentURL as string;
  const dueDateStr = params.lastDateToPay as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  const [loading, setLoading] = useState(false);
  const [consumerInfo, setConsumerInfo] = useState<any>(null);
  const [fetchedConsumer, setFetchedConsumer] = useState(false);

  // Fetch consumer info
  React.useEffect(() => {
    if (fetchedConsumer) return;
    setFetchedConsumer(true);
    // If params include consumer number, fetch info
    const consumerNum = params.consumerNumber as string;
    if (consumerNum && consumerNum !== 'undefined') {
      firebaseService.getConsumerInfo(consumerNum).then(setConsumerInfo);
    }
  }, [params.consumerNumber, fetchedConsumer]);

  const statusCfg = STATUS_MAP[payStatus] || STATUS_MAP.Pending;
  const StatusIcon = statusCfg.icon;

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[edit] handleEdit called, billId:', billId);
    markBillForEdit(billId);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', `Are you sure you want to delete this bill?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await firebaseService.deleteElectricBill(city, billId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/electric-bills' as any);
        } catch (e: any) {
          Alert.alert('Error', e.message);
          setLoading(false);
        }
      }}
    ]);
  };

  const handleShare = async () => {
    if (billDocumentURL) {
      await Share.share({ message: `Electric Bill: ${billMonth}\nAmount: ₹${billAmount.toLocaleString('en-IN')}\nStatus: ${payStatus}\nDocument: ${billDocumentURL}` });
    } else {
      await Share.share({ message: `Electric Bill: ${billMonth}\nAmount: ₹${billAmount.toLocaleString('en-IN')}\nStatus: ${payStatus}` });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Loading overlay */}
      {loading && <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>}

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction} onPress={handleEdit}>
          <Edit size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Amount Header */}
        <View style={styles.amountCard}>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bgTint[isDark ? 'dark' : 'light'] }]}>
            <StatusIcon size={14} color={statusCfg.color} />
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
          </View>
          <Text style={[styles.amountText, { color: scheme.textPrimary }]}>₹{billAmount.toLocaleString('en-IN')}</Text>
          <Text style={[styles.monthText, { color: scheme.textSecondary }]}>{billMonth}</Text>
        </View>

        {/* Meter Details */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Meter Details</Text>
          <DetailRow icon={<Gauge size={16} color="#A78BFA" />} label="Last Reading" value={String(lastReading)} scheme={scheme} isDark={isDark} />
          <DetailRow icon={<Gauge size={16} color="#F59E0B" />} label="Current Reading" value={String(currentReading)} scheme={scheme} isDark={isDark} />
          <DetailRow icon={<Zap size={16} color="#FF6B35" />} label="Total Units" value={String(totalUnits)} scheme={scheme} isDark={isDark} />
        </View>

        {/* Payment Details */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Payment</Text>
          <DetailRow icon={<CreditCard size={16} color="#10B981" />} label="Status" value={payStatus} scheme={scheme} isDark={isDark} accent={statusCfg.color} />
          <DetailRow icon={<CheckCircle size={16} color="#3B82F6" />} label="Payment Mode" value={paymentMode || '—'} scheme={scheme} isDark={isDark} />
          {dueDate && (
            <DetailRow icon={<Calendar size={16} color="#F59E0B" />} label="Due Date" value={dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} scheme={scheme} isDark={isDark} />
          )}
        </View>

        {/* Consumer Info */}
        {consumerInfo && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Consumer</Text>
            <DetailRow icon={<User size={16} color="#10B981" />} label="Holder" value={consumerInfo.holderName} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<CreditCard size={16} color="#A78BFA" />} label="Consumer No." value={consumerInfo.consumerNumber} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<MapPin size={16} color="#F59E0B" />} label="Location" value={consumerInfo.location} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<Building2 size={16} color="#06B6D4" />} label="Billing Unit" value={consumerInfo.billingUnitNumber} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<Phone size={16} color="#EC4899" />} label="Mobile" value={consumerInfo.registeredMobile} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<Droplets size={16} color="#7C3AED" />} label="Area" value={consumerInfo.area} scheme={scheme} isDark={isDark} />
          </View>
        )}

        {/* Document */}
        {billDocumentURL ? (
          <DocumentSection url={billDocumentURL} />
        ) : (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.downloadLink}>
              <Download size={18} color={scheme.textTertiary} />
              <Text style={[styles.downloadText, { color: scheme.textTertiary }]}>No document attached</Text>
            </View>
          </View>
        )}

        {/* Share Button */}
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]} onPress={handleShare}>
          <Share2 size={18} color={Colors.primary} />
          <Text style={[styles.shareText, { color: Colors.primary }]}>Share Bill Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, scheme, isDark, accent }: {
  icon: React.ReactNode; label: string; value: string; scheme: any; isDark: boolean; accent?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>{icon}</View>
      <View style={styles.detailInfo}>
        <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: scheme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerAction: { padding: 8 },

  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  amountCard: {
    alignItems: 'center', paddingVertical: Spacing.xxxl, marginBottom: Spacing.md,
    borderRadius: BorderRadius.card,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, marginBottom: Spacing.md },
  statusPillText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  amountText: { fontSize: Typography.fontSize.xxxl * 1.5, fontWeight: '800', letterSpacing: -1 },
  monthText: { fontSize: Typography.fontSize.xl, marginTop: Spacing.xs },

  card: {
    borderRadius: BorderRadius.card, padding: Spacing.md, marginBottom: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  cardTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  detailIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: Typography.fontSize.xs },
  detailValue: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  documentImage: { width: '100%', height: 300, borderRadius: BorderRadius.md },
  docPlaceholder: { alignItems: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  docPlaceholderLabel: { fontSize: Typography.fontSize.md, fontWeight: '600', marginTop: Spacing.xs },
  docLoading: { paddingVertical: Spacing.xl, alignItems: 'center' },
  docActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  docActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, minHeight: 44 },
  docActionText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  downloadLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, justifyContent: 'center' },
  downloadText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.card, paddingVertical: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  shareText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
});
