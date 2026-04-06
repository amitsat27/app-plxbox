/**
 * ReceiptUploader — multi-receipt upload widget for appliance service records
 * Supports: camera capture, gallery selection, PDF upload, preview, delete
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, Colors } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  X,
  RotateCcw,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import { firebaseService } from '@/src/services/FirebaseService';
import type { ServiceReceipt } from '@/src/types';
import * as Haptics from 'expo-haptics';

interface ReceiptUploaderProps {
  applianceId: string;
  initialReceipts?: ServiceReceipt[];
  onReceiptsUploaded: (receipts: ServiceReceipt[]) => void;
}

interface PendingReceipt {
  localId: string;
  url: string;
  type: 'image' | 'pdf';
  uploadedAt: Date;
  name?: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  finalUrl?: string;
  finalType?: 'image' | 'pdf';
}

const THUMB = 80;

const genId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Convert a ServiceReceipt to PendingReceipt format for display */
function serviceToPending(receipt: ServiceReceipt): PendingReceipt {
  return {
    localId: receipt.id,
    url: receipt.url,
    type: receipt.type,
    uploadedAt: receipt.uploadedAt,
    name: receipt.name,
    status: 'completed',
    progress: 100,
    finalUrl: receipt.url,
    finalType: receipt.type,
  };
}

/** Extract completed ServiceReceipt[] from PendingReceipt[] */
function getCompletedReceipts(pending: PendingReceipt[]): ServiceReceipt[] {
  return pending
    .filter((r) => r.status === 'completed')
    .map((r) => ({
      id: r.localId,
      url: r.finalUrl ?? r.url,
      type: r.finalType ?? r.type,
      uploadedAt: r.uploadedAt,
      name: r.name,
    }));
}

export default function ReceiptUploader({ applianceId, initialReceipts, onReceiptsUploaded }: ReceiptUploaderProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<PendingReceipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const sheetY = useRef(new Animated.Value(0)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;

  // ---- Sync initialReceipts from parent ----
  // Runs when initialReceipts prop changes (e.g. after async load in edit mode)
  useEffect(() => {
    if (initialReceipts && initialReceipts.length > 0) {
      const pending = initialReceipts.map(serviceToPending);
      setReceipts(pending);
      onReceiptsUploaded(getCompletedReceipts(pending));
      setIsInitialized(true);
    } else if (!isInitialized) {
      // First mount with no initial receipts — mark as initialized so we
      // don't treat the empty array as "no uploads yet"
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReceipts?.length]);

  const isUploading = receipts.some((r) => r.status === 'uploading');

  // Notify parent helper
  const notifyParent = useCallback((currentReceipts: PendingReceipt[]) => {
    const completed = getCompletedReceipts(currentReceipts);
    // Always call outside of setReceipts updater to avoid nested setState issues
    requestAnimationFrame(() => onReceiptsUploaded(completed));
  }, [onReceiptsUploaded]);

  // ---- Action Sheet ----
  const openSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetVisible(true);
    overlayOp.setValue(0);
    sheetY.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOp, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 300 }),
    ]).start();
  };

  const closeSheet = () => {
    setSheetVisible(false);
    overlayOp.setValue(0);
    sheetY.setValue(0);
  };

  // ---- Pick & Upload ----
  const pickImage = async (mode: 'camera' | 'gallery') => {
    closeSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 200));

    if (mode === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (!status || status !== 'granted') {
        setGlobalError('Camera permission denied. Enable it in Settings.');
        return;
      }
    }

    const result =
      mode === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            allowsMultipleSelection: true,
          });
    if (!result.canceled && result.assets.length > 0) {
      for (const asset of result.assets) {
        await enqueueUpload(asset.uri, asset.fileName ?? undefined, 'image');
      }
    }
  };

  const pickPdf = async () => {
    closeSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 200));

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    await enqueueUpload(asset.uri, asset.name, 'pdf');
  };

  const enqueueUpload = async (uri: string, name: string | undefined, fileType: 'image' | 'pdf') => {
    setGlobalError(null);

    if (!user?.uid) {
      setGlobalError('Not authenticated. Please sign in first.');
      return;
    }

    const localId = genId();
    const pending: PendingReceipt = {
      localId,
      url: uri,
      type: fileType,
      uploadedAt: new Date(),
      name,
      status: 'uploading',
      progress: 0,
    };

    setReceipts((prev) => [...prev, pending]);

    try {
      const result = await firebaseService.uploadApplianceReceipt(
        user!.uid,
        applianceId,
        uri,
        (pct) =>
          setReceipts((prev) =>
            prev.map((r) => (r.localId === localId ? { ...r, progress: pct } : r))
          ),
      );

      setReceipts((prev) => {
        const updated = prev.map((r) =>
          r.localId === localId
            ? { ...r, status: 'completed' as const, finalUrl: result.url, finalType: result.type, progress: 100 }
            : r,
        );
        notifyParent(updated);
        return updated;
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[ReceiptUploader] upload failed:', err);
      setReceipts((prev) =>
        prev.map((r) => (r.localId === localId ? { ...r, status: 'error' } : r)),
      );
      setGlobalError(err?.message ?? 'Upload failed. Tap retry on the thumbnail.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const retryUpload = async (r: PendingReceipt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGlobalError(null);

    setReceipts((prev) =>
      prev.map((item) => (item.localId === r.localId ? { ...item, status: 'uploading', progress: 0 } : item)),
    );

    if (!user?.uid) return;

    try {
      const result = await firebaseService.uploadApplianceReceipt(
        user!.uid,
        applianceId,
        r.url,
        (pct) =>
          setReceipts((prev) =>
            prev.map((item) => (item.localId === r.localId ? { ...item, progress: pct } : item)),
          ),
      );

      setReceipts((prev) => {
        const updated = prev.map((item) =>
          item.localId === r.localId
            ? { ...item, status: 'completed' as const, finalUrl: result.url, finalType: result.type, progress: 100 }
            : item,
        );
        notifyParent(updated);
        return updated;
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setReceipts((prev) =>
        prev.map((item) => (item.localId === r.localId ? { ...item, status: 'error' } : item)),
      );
    }
  };

  const removeReceipt = (localId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReceipts((prev) => {
      const remaining = prev.filter((r) => r.localId !== localId);
      notifyParent(remaining);
      return remaining;
    });
    setDeleteTarget(null);
  };

  // ---- Action Sheet Item ----
  const ActionRow = ({
    icon,
    label,
    tint,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    tint: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.actionRow, { backgroundColor: isDark ? 'rgba(44,44,46,1)' : 'rgba(255,255,255,1)' }]}
      onPress={onPress}
      activeOpacity={0.5}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${tint}15` }]}>{icon}</View>
      <Text style={[styles.actionLabel, { color: scheme.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const completedCount = receipts.filter((r) => r.status === 'completed').length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Receipts</Text>
        <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>
          {completedCount} file{completedCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Horizontal thumb row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
        {receipts.map((r) => (
          <View key={r.localId} style={styles.thumbCell}>
            {/* Remove X */}
            <TouchableOpacity
              style={[styles.xBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.92)' }]}
              onPress={() => setDeleteTarget(r.localId)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <X size={10} color={isDark ? '#FFF' : 'rgba(0,0,0,0.45)'} />
            </TouchableOpacity>

            {/* Thumb card */}
            <TouchableOpacity
              style={[
                styles.thumb,
                r.status === 'error' && styles.thumbError,
              ]}
              onPress={() => {
                if (r.status === 'completed') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPreviewReceipt(r);
                }
              }}
              activeOpacity={0.8}
            >
              {r.type === 'pdf' || r.finalType === 'pdf' ? (
                <View style={[styles.pdfThumb, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                  <FileText size={28} color={r.status === 'error' ? Colors.error : Colors.info} />
                  <Text style={[styles.pdfBadge, { color: scheme.textSecondary }]}>PDF</Text>
                </View>
              ) : (
                <Image source={{ uri: r.finalUrl ?? r.url }} style={styles.thumbImg} />
              )}

              {/* Uploading overlay */}
              {r.status === 'uploading' && (
                <View style={styles.overlayBox}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${r.progress}%` }]} />
                  </View>
                  <Text style={styles.barPct}>{r.progress}%</Text>
                  <ActivityIndicator size="small" color="#FFF" style={{ marginTop: 4 }} />
                </View>
              )}

              {/* Error overlay */}
              {r.status === 'error' && (
                <View style={styles.overlayBox}>
                  <TouchableOpacity
                    style={styles.retryCircle}
                    onPress={() => retryUpload(r)}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={16} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.failLabel}>Failed</Text>
                </View>
              )}

              {/* Done badge */}
              {r.status === 'completed' && (
                <View style={styles.doneBadge}>
                  <CheckCircle size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Add button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#F5F5F7', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}
          onPress={openSheet}
          disabled={isUploading}
          activeOpacity={0.6}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={scheme.textTertiary} />
          ) : (
            <>
              <View style={styles.addCircle}>
                <Text style={styles.plus}>+</Text>
              </View>
              <Text style={[styles.addLabel, { color: scheme.textSecondary }]}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Global error */}
      {globalError && (
        <View style={[styles.errBanner, { backgroundColor: `${Colors.error}12` }]}>
          <Text style={[styles.errBannerText, { color: Colors.error }]}>{globalError}</Text>
        </View>
      )}

      {/* ===== Action Sheet ===== */}
      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeSheet}>
          <Animated.View style={[styles.sheetOuter, { opacity: overlayOp }]}>
            <Animated.View style={{ transform: [{ translateY: sheetY.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }] }}>
              <View style={[styles.sheetInner, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                <View style={styles.sheetHandle}>
                  <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.14)' }]} />
                </View>

                <Text style={[styles.sheetTitle, { color: scheme.textPrimary }]}>Add Receipt</Text>

                <ActionRow icon={<Camera size={22} color={Colors.success} />} label="Take Photo" tint={Colors.success} onPress={() => pickImage('camera')} />
                <View style={styles.actionSep} />

                <ActionRow icon={<ImageIcon size={22} color={Colors.info} />} label="Choose from Gallery" tint={Colors.info} onPress={() => pickImage('gallery')} />
                <View style={styles.actionSep} />

                <ActionRow icon={<FileText size={22} color={Colors.warning} />} label="Upload PDF" tint={Colors.warning} onPress={pickPdf} />

                <View style={{ height: 10 }} />
                <TouchableOpacity
                  style={[styles.sheetCancel, { backgroundColor: scheme.cardBackground }]}
                  onPress={closeSheet}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetCancelText, { color: scheme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ===== Preview Modal ===== */}
      <Modal visible={!!previewReceipt} transparent animationType="fade" onRequestClose={() => setPreviewReceipt(null)}>
        <View style={styles.previewBg}>
          <TouchableOpacity style={styles.previewX} onPress={() => setPreviewReceipt(null)} hitSlop={12}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          {previewReceipt?.type === 'pdf' || previewReceipt?.finalType === 'pdf' ? (
            <View style={styles.previewPdfBox}>
              <FileText size={64} color="rgba(255,255,255,0.55)" />
              <Text style={styles.previewPdfTitle}>PDF Document</Text>
              {previewReceipt.name && <Text style={styles.previewPdfName}>{previewReceipt.name}</Text>}
              <TouchableOpacity
                style={styles.previewOpenBtn}
                onPress={() => Linking.openURL(previewReceipt.finalUrl ?? previewReceipt.url)}
              >
                <Text style={styles.previewOpenText}>Open Externally</Text>
              </TouchableOpacity>
            </View>
          ) : previewReceipt ? (
            <Image source={{ uri: previewReceipt.finalUrl ?? previewReceipt.url }} style={styles.previewImg} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* ===== Delete Confirmation ===== */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteSheet, { backgroundColor: scheme.cardBackground }]}>
            <View style={[styles.deleteIconBox, { backgroundColor: `${Colors.error}12` }]}>
              <Trash2 size={24} color={Colors.error} />
            </View>
            <Text style={[styles.deleteTitle, { color: scheme.textPrimary }]}>Remove Receipt</Text>
            <Text style={[styles.deleteMsg, { color: scheme.textSecondary }]}>
              This removes the receipt from this list. The file stored on the server will remain.
            </Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={[styles.deleteOpt, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[styles.deleteOptText, { color: scheme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteOpt, { backgroundColor: Colors.error }]} onPress={() => deleteTarget && removeReceipt(deleteTarget)}>
                <Text style={[styles.deleteOptText, { color: '#FFF' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  root: { marginVertical: 8 },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 13, fontWeight: '500' },

  /* Thumb row */
  thumbRow: { gap: 10, paddingRight: 4 },
  thumbCell: { position: 'relative' },

  xBtn: {
    position: 'absolute', top: -6, right: -6, zIndex: 2,
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
  },

  thumb: {
    width: THUMB, height: THUMB, borderRadius: BorderRadius.md, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  thumbError: { borderWidth: 2, borderColor: Colors.error },
  thumbImg: { width: '100%', height: '100%' },

  pdfThumb: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 4 },
  pdfBadge: { fontSize: 10, fontWeight: '600' },

  /* Progress / error overlays */
  overlayBox: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', gap: 4,
  },
  barTrack: { width: 48, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  barFill: { height: '100%', borderRadius: 2, backgroundColor: '#7C3AED' },
  barPct: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  retryCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  failLabel: { color: '#FFF', fontSize: 10, fontWeight: '700', marginTop: 2 },

  doneBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF',
  },

  /* Add */
  addBtn: {
    width: THUMB, height: THUMB, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  addCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  plus: { color: '#FFF', fontSize: 22, fontWeight: '300', lineHeight: 32 },
  addLabel: { fontSize: 11, fontWeight: '600' },

  /* Error banner */
  errBanner: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.md },
  errBannerText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  /* ===== Action Sheet ===== */
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetOuter: { width: '100%' },
  sheetInner: { borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', paddingBottom: 34, paddingTop: 8 },
  sheetHandle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  sheetTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', paddingVertical: 14 },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, gap: 14 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 17, fontWeight: '500', flex: 1 },
  actionSep: { height: 0.5, marginHorizontal: 20, backgroundColor: 'rgba(128,128,128,0.25)' },
  sheetCancel: { marginHorizontal: 8, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 17, fontWeight: '600' },

  /* ===== Preview ===== */
  previewBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  previewX: { position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 8 },
  previewImg: { width: '100%', height: '80%' },
  previewPdfBox: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
  previewPdfTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  previewPdfName: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  previewOpenBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, backgroundColor: '#7C3AED' },
  previewOpenText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  /* ===== Delete Dialog ===== */
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  deleteSheet: { width: 280, borderRadius: 20, padding: 24, alignItems: 'center' },
  deleteIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  deleteMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  deleteBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteOpt: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  deleteOptText: { fontSize: 15, fontWeight: '600' },
});
