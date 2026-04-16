/**
 * Compliance Detail Screen — view compliance details with date editing,
 * document upload, and view/download of compliance documents.
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
  Camera, Receipt, Edit3, Upload,
} from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme } from '@/theme/color';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getDaysUntilExpiry, formatExpiryDate } from './utils/compliance';
import ComplianceEditModal from './components/ComplianceEditModal';
import { firebaseService } from '@/src/services/FirebaseService';

type ComplianceType = 'insurance' | 'puc' | 'registration';

const COLOR_MAP: Record<ComplianceType, string> = {
  insurance: '#3B82F6',
  puc: '#10B981',
  registration: '#F59E0B',
};

const EMOJI_MAP: Record<ComplianceType, string> = {
  insurance: '🛡️',
  puc: '🍃',
  registration: '📄',
};

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];

const getExt = (url: string): string => {
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : '';
};

export default function ComplianceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const params = useLocalSearchParams();

  const type = params.type as ComplianceType;
  const label = decodeURIComponent((params.label as string) || type || '');
  const dateStr = params.date as string;
  const docUrl = params.docUrl ? decodeURIComponent(params.docUrl as string) : undefined;
  const expiryDate = dateStr ? new Date(dateStr) : undefined;
  const color = COLOR_MAP[type] || '#8B5CF6';

  const daysLeft = getDaysUntilExpiry(expiryDate);
  const isExpired = daysLeft < 0;
  const isUrgent = !isExpired && daysLeft < 30;
  const statusColor = isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981';
  const statusLabel = isExpired ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago` : isUrgent ? `${daysLeft} days remaining` : `${daysLeft} days remaining`;

  // Edit state
  const [editDate, setEditDate] = useState(expiryDate || new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | undefined>(docUrl);
  const [uploading, setUploading] = useState(false);

  const handleEditDone = async () => {
    const vehicleId = params.vehicleId as string;
    if (!vehicleId) return;
    const fieldMap: Record<ComplianceType, string> = {
      insurance: 'insuranceExpiry',
      puc: 'pucExpiry',
      registration: 'registrationExpiry',
    };
    try {
      await firebaseService.updateVehicle(vehicleId, { [fieldMap[type]]: editDate } as any);
      setEditModalOpen(false);
      Alert.alert('Updated', `${label} date has been updated`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  const handleUploadDocument = async (uri: string) => {
    const vehicleId = params.vehicleId as string;
    const userId = params.userId as string;
    if (!vehicleId || !userId || !type) return;
    try {
      setUploading(true);
      const uploadType = type === 'registration' ? 'insurance' as const : type;
      const url = await firebaseService.uploadComplianceDocument(userId, vehicleId, uploadType, uri);
      const urlKey = `${type}DocumentUrl`;
      await firebaseService.updateVehicle(vehicleId, { [urlKey]: url } as any);
      setDocumentUrl(url);
      Alert.alert('Uploaded', 'Document uploaded successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handlePickDocument = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.5,
    });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    await handleUploadDocument(uri);
  };

  const handlePickPdf = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    await handleUploadDocument(uri);
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
    const uri = result.assets[0].uri;
    await handleUploadDocument(uri);
  };

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
      presentationStyle: Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET : undefined,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: '#7C3AED',
    });
  };

  const handleDownloadDoc = async () => {
    if (!documentUrl || docLoading) return;
    setDocLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const baseName = `compliance-${type}-${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`;
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
      await Share.share({ message: `${label} Document\n${documentUrl}` });
    } catch { /* cancelled */ }
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
        { text: 'Gallery', onPress: handlePickDocument },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (!type || !label) {
    return (
      <View style={[styles.center, { backgroundColor: scheme.background }]}>
        <Text style={{ color: scheme.textSecondary }}>Invalid compliance type</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: scheme.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={isDark ? '#A1A1AA' : '#6B7280'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B' }}>{label}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 28 }}>{EMOJI_MAP[type]}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B' }}>{label}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: isDark ? '#2C2C2E' : '#F2F2F7' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: scheme.textTertiary, marginBottom: 4 }}>Expiry Date</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B' }}>
                {formatExpiryDate(expiryDate)}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: scheme.textTertiary, marginBottom: 4 }}>Status</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Document Card */}
        <View style={[styles.docCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <File size={16} color={color} />
            <Text style={[styles.docTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Compliance Document</Text>
          </View>

          {hasDoc ? (
            <>
              {isImage && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setPreviewVisible(true)}>
                  <Image source={{ uri: documentUrl }} style={styles.docImage} contentFit="contain" cachePolicy="memory-disk" />
                </TouchableOpacity>
              )}

              {isPdf && (
                <TouchableOpacity activeOpacity={0.8} onPress={handleViewDoc} style={[styles.docPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}>
                  <File size={40} color="#EF4444" />
                  <Text style={[styles.docPlaceholderTitle, { color: '#EF4444' }]}>PDF Document</Text>
                  <Text style={[styles.docPlaceholderSub, { color: scheme.textTertiary }]}>Tap to view in browser</Text>
                </TouchableOpacity>
              )}

              {!isImage && !isPdf && (
                <View style={[styles.docPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}>
                  <File size={40} color={scheme.textTertiary} />
                  <Text style={[styles.docPlaceholderTitle, { color: scheme.textSecondary }]}>Document</Text>
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
                <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handleDownloadDoc} disabled={docLoading}>
                  {docLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : (<>
                    <Download size={16} color={Colors.primary} />
                    <Text style={[styles.docActionText, { color: Colors.primary }]}>Save</Text>
                  </>)}
                </TouchableOpacity>
              </View>

              {/* Share + Replace row */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.reuploadBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handleShareDoc}>
                  <ExternalLink size={14} color={scheme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: scheme.textSecondary }}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reuploadBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={showReplacePrompt}>
                  <Upload size={14} color={scheme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: scheme.textSecondary }}>Replace</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.docPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}>
                <File size={40} color={scheme.textTertiary} />
                <Text style={[styles.docPlaceholderTitle, { color: scheme.textSecondary }]}>No Document Uploaded</Text>
                <Text style={[styles.docPlaceholderSub, { color: scheme.textTertiary }]}>Upload your {label.toLowerCase()} document below</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.uploadBtnHalf, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handleCamera}>
                  <Camera size={14} color={scheme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: scheme.textSecondary }}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtnHalf, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handlePickDocument}>
                  <Receipt size={14} color={scheme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: scheme.textSecondary }}>Photo</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.uploadFull, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} onPress={handlePickPdf}>
                <File size={14} color={scheme.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: scheme.textSecondary }}>Upload PDF / Document</Text>
              </TouchableOpacity>
            </>
          )}

          {uploading && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={{ fontSize: 12, color: scheme.textTertiary, marginTop: 4 }}>Uploading...</Text>
            </View>
          )}
        </View>

        {/* Edit Button — opens date picker modal */}
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => { setEditModalOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Edit3 size={16} color={Colors.primary} />
          <Text style={[styles.editBtnText, { color: Colors.primary }]}>Update Expiry Date</Text>
        </TouchableOpacity>
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

      {/* Date Edit Modal */}
      {editModalOpen && (
        <ComplianceEditModal
          visible={editModalOpen}
          target={type}
          date={editDate}
          label={`Edit ${label}`}
          isDark={isDark}
          onChange={(d) => setEditDate(d)}
          onSave={handleEditDone}
          onClose={() => setEditModalOpen(false)}
          documentUrl={documentUrl}
          onDocumentUpload={async (uri) => {
            await handleUploadDocument(uri);
          }}
        />
      )}
    </View>
  );
}

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
  uploadFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
    borderRadius: 12, marginTop: 8,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  editBtnText: { fontSize: 15, fontWeight: '700' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  previewCloseBtn: { position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 8 },
  previewImage: { width: '100%', height: '80%' },
});
