/**
 * Service Detail Screen — view individual service record details
 * with document viewing, downloading, and sharing capabilities.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
  TouchableOpacity, Alert, ActivityIndicator, Share, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import {
  ChevronLeft, Calendar, File, X, Download, ExternalLink,
  Camera, Receipt, Upload, MapPin, User, Wrench, Tag,
} from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { Colors } from '@/theme/color';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { firebaseService } from '@/src/services/FirebaseService';

type ServiceType = 'regular' | 'repair' | 'annual' | 'emergency' | 'other';

const SERVICE_TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  regular: { label: 'Regular Service', color: '#3B82F6', emoji: '🔧' },
  repair: { label: 'Repair', color: '#F59E0B', emoji: '🛠️' },
  annual: { label: 'Annual Maintenance', color: '#10B981', emoji: '📋' },
  emergency: { label: 'Emergency', color: '#EF4444', emoji: '🚨' },
  other: { label: 'Other', color: '#8B5CF6', emoji: '⚙️' },
};

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];

const getExt = (url: string): string => {
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : '';
};

const formatDate = (d?: Date | string): string => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ServiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const params = useLocalSearchParams();
  const record = params.recordData ? JSON.parse(decodeURIComponent(params.recordData as string)) : null;
  const vehicleId = params.vehicleId as string;
  const userId = params.userId as string;

  const docUrl = (record?.invoiceUrl || record?.receiptUrl || '') as string;
  const serviceType = record?.serviceType as ServiceType || 'regular';
  const meta = SERVICE_TYPE_META[serviceType] || SERVICE_TYPE_META.regular;

  const [documentUrl, setDocumentUrl] = useState<string | undefined>(docUrl || undefined);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const ext = documentUrl ? getExt(documentUrl) : '';
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === 'pdf';
  const hasDoc = !!documentUrl;

  const handleViewDoc = async () => {
    if (!documentUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(documentUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: Colors.primary,
    });
  };

  const handleDownloadDoc = async () => {
    if (!documentUrl || docLoading) return;
    setDocLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const baseName = `service-${record?.id || Date.now()}.${isPdf ? 'pdf' : 'jpg'}`;
      const localUri = cacheDirectory + baseName;
      await downloadAsync(documentUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, { mimeType: isPdf ? 'application/pdf' : 'image/jpeg' });
      } else {
        Alert.alert('Saved', 'File saved to cache');
      }
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not download file');
    } finally {
      setDocLoading(false);
    }
  };

  const handleShareDoc = async () => {
    if (!documentUrl) return;
    try {
      await Share.share({
        message: `Service Record: ${meta.label}\nDate: ${formatDate(record?.serviceDate)}\n${record?.description || ''}\nDocument: ${documentUrl}`,
      });
    } catch { /* cancelled */ }
  };

  const handleUploadDocument = async (uri: string) => {
    if (!vehicleId || !userId) return;
    try {
      setUploading(true);
      const url = await firebaseService.uploadComplianceDocument(userId, vehicleId, 'service', uri);
      await firebaseService.updateServiceRecord(record?.id, { invoiceUrl: url } as any);
      setDocumentUrl(url);
      Alert.alert('Uploaded', 'Document uploaded successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!(perm as any).granted) {
      Alert.alert('Permission denied', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (result.canceled || !result.assets?.length) return;
    await handleUploadDocument(result.assets[0].uri);
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.5,
    });
    if (result.canceled || !result.assets?.length) return;
    await handleUploadDocument(result.assets[0].uri);
  };

  const showReplacePrompt = () => {
    Alert.alert(
      'Replace Document',
      'This will replace the current document',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', onPress: showSourceOptions },
      ],
    );
  };

  const showSourceOptions = () => {
    Alert.alert(
      'Choose Source',
      '',
      [
        { text: 'Camera', onPress: handleCamera },
        { text: 'Gallery', onPress: handleGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (!record) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#050510' : '#F8FAFC' }]}>
        <Text style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Service record not found</Text>
      </View>
    );
  }

  const bg = isDark ? '#050510' : '#F8FAFC';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const fieldBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const textPrimary = isDark ? '#F8FAFC' : '#1E293B';
  const textSecondary = isDark ? '#CBD5E1' : '#475569';
  const textTertiary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: textPrimary }}>Service Record</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Type & Status Card */}
        <View style={[styles.statusCard, { backgroundColor: cardBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36 }}>{meta.emoji}</Text>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>{meta.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: isDark ? '#2C2C2E' : '#F2F2F7' }}>
            <InfoBlock label="Service Date" value={formatDate(record.serviceDate)} />
            <InfoBlock label="Cost" value={`₹${(record.cost || 0).toLocaleString('en-IN')}`} color="#F59E0B" />
            {record.mileageAtService != null && (
              <InfoBlock label="Mileage" value={`${record.mileageAtService.toLocaleString()} km`} />
            )}
            {record.nextServiceDue && (
              <InfoBlock label="Next Due" value={formatDate(record.nextServiceDue)} />
            )}
          </View>
        </View>

        {/* Service Center / Mechanic */}
        {(record.serviceCenter || record.mechanic) && (
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <View style={[styles.infoTitle, { marginBottom: 12 }]}>
              <Wrench size={16} color={meta.color} />
              <Text style={[styles.infoTitleText, { color: textPrimary }]}>Service Provider</Text>
            </View>
            {record.serviceCenter && (
              <View style={[styles.infoRow, { backgroundColor: fieldBg, borderRadius: 12, padding: 12 }]}>
                <MapPin size={14} color={textTertiary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, color: textTertiary, marginBottom: 2 }}>Service Center</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary }}>{record.serviceCenter}</Text>
                </View>
              </View>
            )}
            {record.mechanic && (
              <View style={[styles.infoRow, { backgroundColor: fieldBg, borderRadius: 12, padding: 12, marginTop: 8 }]}>
                <User size={14} color={textTertiary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, color: textTertiary, marginBottom: 2 }}>Mechanic</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary }}>{record.mechanic}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Description / Notes */}
        {record.description && (
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Tag size={14} color={textTertiary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: textTertiary }}>Notes</Text>
            </View>
            <Text style={[styles.description, { color: textSecondary }]}>{record.description}</Text>
          </View>
        )}

        {/* Service Document / Receipt */}
        <View style={[styles.docCard, { backgroundColor: cardBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <File size={16} color={meta.color} />
            <Text style={[styles.docTitle, { color: textPrimary }]}>Service Document</Text>
          </View>

          {hasDoc ? (
            <>
              {isImage && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setPreviewVisible(true)}>
                  <Image source={{ uri: documentUrl }} style={styles.docImage} contentFit="contain" cachePolicy="memory-disk" />
                </TouchableOpacity>
              )}

              {isPdf && (
                <TouchableOpacity activeOpacity={0.85} onPress={handleViewDoc} style={[styles.docPlaceholder, { backgroundColor: fieldBg }]}>
                  <File size={40} color="#EF4444" />
                  <Text style={[styles.docPlaceholderTitle, { color: '#EF4444' }]}>PDF Document</Text>
                  <Text style={[styles.docPlaceholderSub, { color: textTertiary }]}>Tap to view in browser</Text>
                </TouchableOpacity>
              )}

              {!isImage && !isPdf && (
                <View style={[styles.docPlaceholder, { backgroundColor: fieldBg }]}>
                  <File size={40} color={textTertiary} />
                  <Text style={[styles.docPlaceholderTitle, { color: textSecondary }]}>Document</Text>
                  <TouchableOpacity onPress={handleViewDoc} activeOpacity={0.7}>
                    <Text style={[styles.tapToView, { color: Colors.primary }]}>Tap to open</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons for existing document */}
              <View style={styles.docActions}>
                <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: Colors.primary }]} onPress={handleViewDoc}>
                  <ExternalLink size={16} color="#FFF" />
                  <Text style={[styles.docActionText, { color: '#FFF' }]}>View Full</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: fieldBg }]} onPress={handleDownloadDoc} disabled={docLoading}>
                  {docLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : (<>
                    <Download size={16} color={Colors.primary} />
                    <Text style={[styles.docActionText, { color: Colors.primary }]}>Save</Text>
                  </>)}
                </TouchableOpacity>
              </View>

              {/* Share + Replace row */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.reuploadBtn, { backgroundColor: fieldBg }]} onPress={handleShareDoc}>
                  <ExternalLink size={14} color={textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reuploadBtn, { backgroundColor: fieldBg }]} onPress={showReplacePrompt}>
                  <Upload size={14} color={textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Replace</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.docPlaceholder, { backgroundColor: fieldBg }]}>
                <File size={40} color={textTertiary} />
                <Text style={[styles.docPlaceholderTitle, { color: textSecondary }]}>No Document Uploaded</Text>
                <Text style={[styles.docPlaceholderSub, { color: textTertiary }]}>Upload your service document below</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.uploadBtnHalf, { backgroundColor: fieldBg }]} onPress={handleCamera}>
                  <Camera size={14} color={textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtnHalf, { backgroundColor: fieldBg }]} onPress={handleGallery}>
                  <Receipt size={14} color={textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {uploading && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={{ fontSize: 12, color: textTertiary, marginTop: 4 }}>Uploading...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewVisible(false)} hitSlop={12}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: documentUrl }} style={styles.previewImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

/* ─── Sub-components ─── */

function InfoBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  const { isDark } = useTheme();
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: color || (isDark ? '#F8FAFC' : '#1E293B') }}>{value}</Text>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backBtn: { padding: 8, borderRadius: 12 },
  statusCard: {
    borderRadius: 20, padding: 20, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  infoCard: {
    borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  infoTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTitleText: { fontSize: 14, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  description: { fontSize: 14, lineHeight: 20 },
  docCard: {
    borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  docTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  docImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  docPlaceholder: { alignItems: 'center', paddingVertical: 32, borderRadius: 12, marginBottom: 12, gap: 6 },
  docPlaceholderTitle: { fontSize: 14, fontWeight: '600' },
  docPlaceholderSub: { fontSize: 12, textAlign: 'center' },
  tapToView: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  docActions: { flexDirection: 'row', gap: 8 },
  docActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 12, minHeight: 44,
  },
  docActionText: { fontSize: 13, fontWeight: '600' },
  reuploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, flex: 1, justifyContent: 'center',
  },
  uploadBtnHalf: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, flex: 1, justifyContent: 'center',
  },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  previewCloseBtn: { position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 8 },
  previewImage: { width: '100%', height: '80%' },
});
