/**
 * Gas Bill Detail Screen — View bill details with edit/delete actions
 * In-app document viewer: shows images inline, opens PDF/other files in web browser
 * Download option via expo-sharing for all file types
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
  Alert, Share, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import {
  ChevronLeft, Flame, CheckCircle, Clock, AlertCircle,
  CreditCard, Calendar, Edit, Trash2, Share2, Download, Gauge, ExternalLink, File, Upload
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';

const STATUS_MAP: Record<string, { color: string; bgTint: string; icon: React.ReactNode }> = {
  Paid: { color: '#10B981', bgTint: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={14} color="#10B981" /> },
  Pending: { color: '#F59E0B', bgTint: 'rgba(245,158,11,0.12)', icon: <Clock size={14} color="#F59E0B" /> },
  Overdue: { color: '#EF4444', bgTint: 'rgba(239,68,68,0.12)', icon: <AlertCircle size={14} color="#EF4444" /> },
};

export const pendingEdit: { current: string; city: string; bp: string } = { current: '', city: '', bp: '' };
export function markGasBillForEdit(id: string, city: string, bp: string) {
  pendingEdit.current = id;
  pendingEdit.city = city;
  pendingEdit.bp = bp;
}

// File type detection
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];
const getExtension = (fileExtension: string, url: string): string => {
  if (fileExtension) return fileExtension;
  if (!url) return '';
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : '';
};

// ── Document preview section ──────────────────────────────────────
function DocumentSection({ url, fileExtension, mimeType }: { url: string; fileExtension: string; mimeType: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const ext = getExtension(fileExtension, url);
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === 'pdf';
  const noExt = !ext;

  // Fix URL: expo-router decodes %2F to /, re-encode the path portion after /o/
  const safeUrl = url.replace(
    /^([^?]*\/o\/)(.*?)(\?.*)$/,
    (_, before, path, query) => `${before}${encodeURIComponent(path)}${query}`,
  );

  const handleViewDocument = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(safeUrl, {
      presentationStyle: Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: '#7C3AED',
    });
  };

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const pathMatch = safeUrl.match(/documents\/mnglBills\/([^?]+)/);
      let baseName = pathMatch ? pathMatch[1] : `gas_bill_${Date.now()}`;
      if (!/\.\w+$/.test(baseName)) baseName += '.jpeg';
      const localUri = cacheDirectory + baseName;
      await downloadAsync(safeUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, { mimeType: mimeType || (isPdf ? 'application/pdf' : undefined) });
      } else {
        Alert.alert('Saved', `File saved to cache`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

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
          {imageError ? (
            <>
              <File size={32} color={scheme.textTertiary} />
              <Text style={[styles.docPlaceholderLabel, { color: scheme.textSecondary }]}>File</Text>
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.xs }}>Image failed to load, download below</Text>
            </>
          ) : (
            <>
              <File size={32} color={isPdf ? '#EF4444' : scheme.textTertiary} />
              <Text style={[styles.docPlaceholderLabel, { color: scheme.textSecondary }]}>
                {ext ? ext.toUpperCase() : 'Document'} File
              </Text>
            </>
          )}
        </View>
      )}

      {/* Action buttons — always rendered when there's a document */}
      <View style={styles.docActions}>
        <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: Colors.primary }]} onPress={handleViewDocument}>
          <ExternalLink size={16} color="#FFF" />
          <Text style={[styles.docActionText, { color: '#FFF' }]}>View Full</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handleDownload} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : (
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

export default function GasBillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const billId = params.billId as string;
  const city = params.city as string;
  const bpNumber = params.bpNumber as string;
  const billMonth = params.billMonth as string;
  const billNumber = params.billNumber as string;
  const prevReading = parseFloat(String(params.prevReading || '0'));
  const currReading = parseFloat(String(params.currReading || '0'));
  const unitPrice = parseFloat(String(params.unitPrice || '0'));
  const billAmount = parseFloat(String(params.billAmount || '0'));
  const payStatus = params.payStatus as string;
  const paymentMode = params.paymentMode as string;
  const billDocumentURL = (params.billDocumentURL as string) || '';
  const billFileExtension = (params.billFileExtension as string) || '';
  const billMimeType = (params.billMimeType as string) || '';
  const dueDateStr = params.dueDate as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  const [loading, setLoading] = useState(false);
  const [gasInfo, setGasInfo] = useState<any>(null);
  const [fetchedInfo, setFetchedInfo] = useState(false);

  React.useEffect(() => {
    if (fetchedInfo) return;
    setFetchedInfo(true);
    if (bpNumber && bpNumber !== 'undefined') {
      firebaseService.getGasConsumerInfo(bpNumber).then(setGasInfo);
    }
  }, [bpNumber, fetchedInfo]);

  const status = STATUS_MAP[payStatus] || STATUS_MAP.Pending;

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markGasBillForEdit(billId, city, bpNumber);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await firebaseService.deleteGasBill(city, billId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/gas-manager' as any);
        } catch (e: any) {
          Alert.alert('Error', e.message);
          setLoading(false);
        }
      }}
    ]);
  };

  const handleShare = async () => {
    const msg = `Gas Bill: ${billMonth}\nBill No: ${billNumber}\nAmount: ₹${billAmount.toLocaleString('en-IN')}\nStatus: ${payStatus}${billDocumentURL ? '\nDocument: ' + billDocumentURL : ''}`;
    await Share.share({ message: msg });
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
      router.replace(`/gas-bill-detail?billId=${billId}&city=${city}&bpNumber=${bpNumber}&billDocumentURL=${encodeURIComponent(uploadedUrl)}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction} onPress={handleEdit}>
          <Edit size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction} onPress={handleDelete}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Amount Header */}
        <View style={[styles.amountCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={[styles.statusBadge, { backgroundColor: (status as any).bgTint }]}>
            {status.icon}
            <Text style={[styles.statusText, { color: (status as any).color }]}>{payStatus}</Text>
          </View>
          <Text style={[styles.amountText, { color: scheme.textPrimary }]}>₹{billAmount.toLocaleString('en-IN')}</Text>
          <Text style={[styles.monthText, { color: scheme.textSecondary }]}>{billMonth}</Text>
        </View>

        {/* Meter Details */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Meter Details</Text>
          <DetailRow icon={<Gauge size={16} color="#EF4444" />} label="Previous Reading" value={String(prevReading)} scheme={scheme} />
          <DetailRow icon={<Gauge size={16} color="#F59E0B" />} label="Current Reading" value={String(currReading)} scheme={scheme} />
          <DetailRow icon={<Gauge size={16} color="#A78BFA" />} label="Unit Price" value={`₹${unitPrice}`} scheme={scheme} />
          {billNumber && <DetailRow icon={<Flame size={16} color="#06B6D4" />} label="Bill Number" value={billNumber} scheme={scheme} />}
        </View>

        {/* Payment Details */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Payment</Text>
          <DetailRow icon={<CreditCard size={16} color="#10B981" />} label="Status" value={payStatus} scheme={scheme} accent={(status as any).color} />
          <DetailRow icon={<CheckCircle size={16} color="#3B82F6" />} label="Payment Mode" value={paymentMode || '—'} scheme={scheme} />
          {dueDate && (
            <DetailRow icon={<Calendar size={16} color="#F59E0B" />} label="Due Date" value={dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} scheme={scheme} />
          )}
        </View>

        {/* Consumer Info */}
        {gasInfo && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>BP Details</Text>
            <DetailRow icon={<Flame size={16} color="#EF4444" />} label="BP Number" value={gasInfo.BPNumber} scheme={scheme} />
            <DetailRow icon={<CreditCard size={16} color="#A78BFA" />} label="BP Name" value={gasInfo.BPName} scheme={scheme} />
            <DetailRow icon={<Gauge size={16} color="#06B6D4" />} label="Meter Number" value={gasInfo.MeterNumber} scheme={scheme} />
            <DetailRow icon={<CreditCard size={16} color="#10B981" />} label="Mobile" value={gasInfo.registeredMobile} scheme={scheme} />
            <DetailRow icon={<CreditCard size={16} color="#F59E0B" />} label="Location" value={gasInfo.city} scheme={scheme} />
          </View>
        )}

        {/* Document */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
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
            <DocumentSection url={billDocumentURL} fileExtension={billFileExtension} mimeType={billMimeType} />
          ) : (
            <View style={styles.noDocContainer}>
              <File size={32} color={scheme.textTertiary} />
              <Text style={[styles.noDocText, { color: scheme.textTertiary }]}>No document attached</Text>
              <Text style={[styles.noDocSubtext, { color: scheme.textTertiary }]}>Tap Upload to add bill photo or PDF</Text>
            </View>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]} onPress={handleShare}>
          <Share2 size={18} color={Colors.primary} />
          <Text style={[styles.shareText, { color: Colors.primary }]}>Share Bill Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, scheme, accent }: { icon: React.ReactNode; label: string; value: string; scheme: any; accent?: string }) {
  const { isDark } = useTheme();
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>{icon}</View>
      <View style={styles.detailInfo}>
        <Text style={[styles.detailLabel, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: accent || scheme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 34 },
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 16, marginBottom: Spacing.md },
  statusText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  amountText: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
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
  docHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  uploadBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  noDocContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  noDocText: { fontSize: Typography.fontSize.md, fontWeight: '600', marginTop: Spacing.sm },
  noDocSubtext: { fontSize: Typography.fontSize.sm, marginTop: Spacing.xs, opacity: 0.7 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.card, paddingVertical: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  shareText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
});