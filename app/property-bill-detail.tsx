/**
 * Property Bill Detail Screen — Full bill view with inline edit modal
 * Mirrors the WiFi bill card → detail → edit pattern
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput,
  Alert, Share, Image, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ChevronLeft, CheckCircle, Clock, AlertCircle,
  CreditCard, MapPin, User, Phone,
  Edit, Trash2, Share2, Download, Calendar, FileText, Home, X, Camera, Upload, ExternalLink, File
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/src/config/firebaseConfig';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';

const STATUS_MAP: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: any; text: string }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.12)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle, text: 'Paid' },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.12)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock, text: 'Pending' },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.12)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle, text: 'Overdue' },
};

// File type detection
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];
const getExt = (url: string): string => url.match(/\.([a-zA-Z0-9]+)(\?|$)/)?.[1].toLowerCase() ?? '';

// ── Document Section ─────────────────────────────────────────────────────
// Note: URL comes directly from Firestore (already encoded), no re-encoding needed
function DocumentSection({ url }: { url: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const ext = getExt(url);
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === 'pdf';

  const handleView = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: '#7C3AED',
    });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const baseName = url.match(/documents\/propertyTaxBills\/([^?]+)/)?.[1] || `property_tax_bill_${Date.now()}`;
      const localUri = (FileSystem as any).cacheDirectory + baseName;
      await FileSystem.downloadAsync(url, localUri);
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

  const showImagePreview = isImage && !imageError;
  const tryImageFirst = !ext && !imageError;

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Bill Document</Text>
      {(showImagePreview || tryImageFirst) && (
        <View>
          {imageLoading && <View style={styles.docLoading}><ActivityIndicator size="small" color={Colors.primary} /></View>}
          <Image source={{ uri: url }} style={styles.documentImage} resizeMode="contain"
            onLoadEnd={() => setImageLoading(false)} onError={() => { setImageLoading(false); setImageError(true); }} />
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

function DetailRow({ icon, label, value, scheme, isDark, accent }: {
  icon: React.ReactNode; label: string; value: string; scheme: any; isDark: boolean; accent?: string;
}) {
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.icon, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>{icon}</View>
      <View style={detailStyles.info}>
        <Text style={[detailStyles.label, { color: scheme.textTertiary }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: accent || scheme.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}
const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  icon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  label: { fontSize: Typography.fontSize.xs },
  value: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
});

// ── Edit Modal (inline, matches WiFi BillFormModal pattern) ──
function EditBillModal({ visible, onClose, onSave, bill, city }: {
  visible: boolean; onClose: () => void; onSave: () => void;
  bill: { billYear: string; taxBillAmount: string; billDocumentURL: string; payStatus: string; paymentMode: string; lastDateToPay: Date | null; taxIndexNumber: string; };
  city: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [billYear, setBillYear] = useState(bill.billYear || String(new Date().getFullYear()));
  const [taxBillAmount, setTaxBillAmount] = useState(bill.taxBillAmount || '');
  const [payStatus, setPayStatus] = useState(bill.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill.paymentMode || 'Cash');
  const [dueDate, setDueDate] = useState(bill.lastDateToPay ? new Date(bill.lastDateToPay) : new Date());
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      setBillYear(bill.billYear || String(new Date().getFullYear()));
      setTaxBillAmount(bill.taxBillAmount || '');
      setPayStatus(bill.payStatus || 'Pending');
      setPaymentMode(bill.paymentMode || 'Cash');
      setDueDate(bill.lastDateToPay ? new Date(bill.lastDateToPay) : new Date());
      setFileUri(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!taxBillAmount || !billYear) {
      Alert.alert('Missing Fields', 'Please fill in bill year and amount');
      return;
    }
    setUploading(true);
    try {
      const data = {
        billYear,
        taxBillAmount: parseFloat(taxBillAmount.replace(/,/g, '')) || 0,
        lastDateToPay: dueDate.toISOString().split('T')[0],
        payStatus,
        paymentMode,
      };
      // Use update since we're on the detail screen (bill exists)
      await firebaseService.updatePropertyTaxBill(city, bill.billDocumentURL.split('/').pop()?.split('?')[0] || '', data, fileUri || undefined, bill.billDocumentURL);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const pickFile = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) setFileUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) setFileUri(res.assets[0].uri);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={editStyles.overlay}>
        <View style={[editStyles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={editStyles.header}>
            <Text style={[editStyles.title, { color: scheme.textPrimary }]}>Edit Bill</Text>
            <TouchableOpacity style={{ padding: 8 }} onPress={onClose}>
              <X size={20} color={scheme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={editStyles.form} keyboardShouldPersistTaps="handled">
            {/* Financial Year */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Financial Year</Text>
            <View style={[editStyles.input, { borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB' }]}>
              <Text style={{ color: scheme.textPrimary, fontSize: Typography.fontSize.sm }}>{billYear}</Text>
              <TextInput
                style={{ color: scheme.textPrimary, fontSize: Typography.fontSize.sm, flex: 1, textAlign: 'right' }}
                value={billYear} onChangeText={setBillYear} placeholder="2026"
                placeholderTextColor={scheme.textTertiary} keyboardType="numeric"
              />
            </View>

            {/* Tax Amount */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Tax Amount (₹)</Text>
            <TextInput
              style={[editStyles.inputBase, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB', borderColor: scheme.border }]}
              value={taxBillAmount} onChangeText={setTaxBillAmount} placeholder="0"
              placeholderTextColor={scheme.textTertiary} keyboardType="numeric"
            />

            {/* Due Date */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Due Date</Text>
            <TouchableOpacity style={[editStyles.inputBase, { justifyContent: 'center', backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB', borderColor: scheme.border }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: scheme.textPrimary, fontSize: Typography.fontSize.sm }}>
                {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={dueDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setDueDate(d); }} />
            )}

            {/* Status */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Payment Status</Text>
            <View style={editStyles.chipRow}>
              {['Paid', 'Pending'].map(s => (
                <TouchableOpacity key={s}
                  style={[editStyles.chip, { backgroundColor: payStatus === s ? STATUS_MAP[s].color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]}
                  onPress={() => setPayStatus(s)}>
                  {React.createElement(STATUS_MAP[s].icon, { size: 12, color: payStatus === s ? '#FFF' : scheme.textSecondary })}
                  <Text style={[editStyles.chipText, { color: payStatus === s ? '#FFF' : scheme.textSecondary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Mode */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Payment Mode</Text>
            <View style={editStyles.chipRow}>
              {['Cash', 'Bank', 'UPI'].map(m => (
                <TouchableOpacity key={m}
                  style={[editStyles.chip, { backgroundColor: paymentMode === m ? '#7C3AED' : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]}
                  onPress={() => setPaymentMode(m)}>
                  <Text style={[editStyles.chipText, { color: paymentMode === m ? '#FFF' : scheme.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload */}
            <Text style={[editStyles.fieldLabel, { color: scheme.textTertiary }]}>Bill Document</Text>
            <View style={editStyles.row2}>
              <TouchableOpacity style={[editStyles.uploadBtn, { borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={takePhoto}>
                <Camera size={20} color={Colors.primary} />
                <Text style={{ color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: '500' }}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[editStyles.uploadBtn, { borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={pickFile}>
                <Upload size={20} color={Colors.primary} />
                <Text style={{ color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: '500' }}>{fileUri ? 'Changed' : 'Gallery'}</Text>
              </TouchableOpacity>
            </View>
            {fileUri && <Text style={{ color: '#10B981', fontSize: Typography.fontSize.xs, textAlign: 'center', marginTop: 4 }}>File selected</Text>}
            {bill.billDocumentURL && !fileUri && (
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.xs, textAlign: 'center', marginTop: 4 }}>Current document exists</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={[editStyles.submitBtn, { backgroundColor: Colors.primary, opacity: uploading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={editStyles.submitText}>Update Bill</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const editStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  form: { paddingBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, minHeight: 44, marginBottom: Spacing.md },
  inputBase: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.fontSize.sm, borderWidth: 1, minHeight: 44, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.lg, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  submitBtn: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});

// ── Main Screen ─────────────────────────────────────────────
function PropertyBillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const billId = params.billId as string;
  const city = params.city as string;

  const [billLoading, setBillLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [bill, setBill] = useState<{
    billYear: string; taxBillAmount: string; billDocumentURL: string;
    payStatus: string; paymentMode: string; lastDateToPay: Date | null;
    taxIndexNumber: string; taxCity: string; id?: string;
  } | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);

  const fetchBill = React.useCallback(async () => {
    setBillLoading(true);
    try {
      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, 'pulsebox', 'propertytaxbills', city, billId));
      if (snap.exists()) {
        const data = snap.data();
        setBill({
          id: billId,
          billYear: data.billYear || '',
          taxBillAmount: data.taxBillAmount || '0',
          billDocumentURL: data.billDocumentURL || '',
          payStatus: data.payStatus || 'Pending',
          paymentMode: data.paymentMode || 'Cash',
          lastDateToPay: data.lastDateToPay?.toDate ? data.lastDateToPay.toDate() : (data.lastDateToPay ? new Date(data.lastDateToPay) : null),
          taxIndexNumber: data.taxIndexNumber || '',
          taxCity: data.taxCity || city,
        });
        const info = await firebaseService.getPropertyTaxInfo(data.taxIndexNumber);
        setPropertyInfo(info);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBillLoading(false);
    }
  }, [billId, city]);

  React.useEffect(() => { fetchBill(); }, [fetchBill]);

  const amt = bill ? parseFloat(bill.taxBillAmount.replace(/,/g, '')) || 0 : 0;
  const statusCfg = bill ? STATUS_MAP[bill.payStatus] || STATUS_MAP.Pending : STATUS_MAP.Pending;
  const StatusIcon = statusCfg.icon;

  const handleDelete = () => {
    Alert.alert('Delete Bill', bill ? `Delete FY ${bill.billYear} property tax bill?` : 'Delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setActionLoading(true);
        try {
          await firebaseService.deletePropertyTaxBill(city, billId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        } catch (e: any) {
          Alert.alert('Error', e.message);
          setActionLoading(false);
        }
      }}
    ]);
  };

  const handleShare = async () => {
    if (!bill) return;
    const msg = `Property Tax Bill — FY ${bill.billYear}\nAmount: ₹${amt.toLocaleString('en-IN')}\nStatus: ${bill.payStatus}${bill.billDocumentURL ? `\nDocument: ${bill.billDocumentURL}` : ''}`;
    await Share.share({ message: msg });
  };

  if (billLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Math.max(insets.top, 8), paddingBottom: Spacing.md }}>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => router.back()}><ChevronLeft size={24} color={scheme.textPrimary} /></TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: scheme.textTertiary, marginTop: Spacing.md, fontSize: Typography.fontSize.sm }}>Loading bill…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#F2F2F7' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Math.max(insets.top, 8), paddingBottom: Spacing.md }}>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => router.back()}><ChevronLeft size={24} color={scheme.textPrimary} /></TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <FileText size={48} color={scheme.textTertiary} opacity={0.3} />
          <Text style={{ color: scheme.textTertiary, marginTop: Spacing.md, fontSize: Typography.fontSize.md }}>Bill not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {actionLoading && <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}><ActivityIndicator size="large" color={Colors.primary} /></View>}

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]} numberOfLines={1}>Property Tax Bill</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.headerAction} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEdit(true); }}>
            <Edit size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleDelete}>
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Amount Header */}
        <View style={styles.amountCard}>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bgTint[isDark ? 'dark' : 'light'] }]}>
            <StatusIcon size={14} color={statusCfg.color} />
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.text}</Text>
          </View>
          <Text style={[styles.amountText, { color: scheme.textPrimary }]}>₹{isFinite(amt) ? amt.toLocaleString('en-IN') : '—'}</Text>
          <Text style={[styles.monthText, { color: scheme.textSecondary }]}>FY {bill.billYear}</Text>
        </View>

        {/* Payment Details */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Payment</Text>
          <DetailRow icon={<CreditCard size={16} color="#10B981" />} label="Status" value={bill.payStatus} scheme={scheme} isDark={isDark} accent={statusCfg.color} />
          <DetailRow icon={<FileText size={16} color="#3B82F6" />} label="Payment Mode" value={bill.paymentMode || '—'} scheme={scheme} isDark={isDark} />
          {bill.lastDateToPay && (
            <DetailRow icon={<Calendar size={16} color="#F59E0B" />} label="Due Date" value={bill.lastDateToPay.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} scheme={scheme} isDark={isDark} />
          )}
        </View>

        {/* Property Info */}
        {propertyInfo && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Property Details</Text>
            <DetailRow icon={<FileText size={16} color="#A78BFA" />} label="Tax Index No." value={propertyInfo.taxIndexNumber || '—'} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<User size={16} color="#10B981" />} label="Owner Name" value={propertyInfo.ownerName || '—'} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<MapPin size={16} color="#F59E0B" />} label="Location" value={propertyInfo.location || '—'} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<Home size={16} color="#06B6D4" />} label="Area" value={propertyInfo.area || '—'} scheme={scheme} isDark={isDark} />
            <DetailRow icon={<Phone size={16} color="#EC4899" />} label="Mobile" value={propertyInfo.registeredMobile || '—'} scheme={scheme} isDark={isDark} />
          </View>
        )}

        {/* Document */}
        {bill.billDocumentURL ? (
          <DocumentSection url={bill.billDocumentURL} />
        ) : (
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.downloadLink}>
              <Download size={18} color={scheme.textTertiary} />
              <Text style={[styles.downloadText, { color: scheme.textTertiary }]}>No document attached</Text>
            </View>
          </View>
        )}

        {/* Share */}
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]} onPress={handleShare}>
          <Share2 size={18} color={Colors.primary} />
          <Text style={[styles.shareText, { color: Colors.primary }]}>Share Bill Details</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <EditBillModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={() => { setShowEdit(false); fetchBill(); }}
        bill={bill}
        city={city}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', flex: 1, marginHorizontal: Spacing.sm },
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

  documentImage: { width: '100%', height: 300, borderRadius: BorderRadius.md },
  docLoading: { paddingVertical: Spacing.xl, alignItems: 'center' },
  docPlaceholder: { alignItems: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  docPlaceholderLabel: { fontSize: Typography.fontSize.md, fontWeight: '600', marginTop: Spacing.xs },
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

export const pendingPropertyTaxBillIdRef = { current: '' };

export default PropertyBillDetailScreen;
