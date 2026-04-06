/**
 * ServiceReceiptCard — styled receipt display card for service records.
 * Mirrors the DocumentSection card pattern from gas/electric bill screens.
 * Shows image inline or PDF placeholder, with View Full + Save buttons.
 */
import React, { useState } from 'react';
import {
  Alert, View, Text, StyleSheet, Platform, Image, TouchableOpacity,
  ActivityIndicator, Share, Modal, Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ExternalLink, Download, File, X, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import type { ServiceReceipt } from '@/src/types';

/* ── Helpers ───────────────────────────────────────────────────────────── */

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'dng'];

const getExt = (url: string): string => {
  const m = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return m ? m[1].toLowerCase() : '';
};

/* ── Component ─────────────────────────────────────────────────────────── */

interface ServiceReceiptCardProps {
  receipt: ServiceReceipt;
}

export default function ServiceReceiptCard({ receipt }: ServiceReceiptCardProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const url = receipt.url;
  const ext = getExt(receipt.url);
  const isImage = !!ext && IMAGE_EXTS.includes(ext);
  const isPdf = ext === 'pdf';
  const hasImage = (receipt.type === 'image' || isImage || (!ext && !isPdf)) && !imageError;

  /* ── Actions ─────────────────────────────────── */

  const handleView = async () => {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: Platform.OS === 'ios'
        ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET
        : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? '#1C1C1E' : '#FFFFFF',
      controlsColor: '#7C3AED',
    });
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const baseName = `receipt-${receipt.id}.${isPdf ? 'pdf' : 'jpg'}`;
      const localUri = (FileSystem as any).cacheDirectory + baseName;
      await FileSystem.downloadAsync(url, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
        });
      } else {
        Alert.alert('Saved', 'File saved to cache');
      }
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Service Receipt\n${receipt.name ?? 'Receipt'}\nDocument: ${url}` });
    } catch { /* user cancelled */ }
  };

  const openPreview = () => {
    if (receipt.type === 'image' || isImage || !isPdf) {
      setPreviewVisible(true);
    } else {
      Linking.openURL(url);
    }
  };

  /* ── Render ──────────────────────────────────── */

  return (
    <>
      <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        {/* File type label */}
        <View style={styles.fileLabelRow}>
          <File size={14} color={scheme.textTertiary} />
          <Text style={[styles.fileLabel, { color: scheme.textTertiary }]}>
            {isPdf ? 'PDF' : isImage ? ext?.toUpperCase() ?? 'IMAGE' : 'Document'}
            {receipt.name ? ` — ${receipt.name}` : ''}
          </Text>
        </View>

        {/* Inline image preview (when image type) */}
        {hasImage && (
          <TouchableOpacity onPress={openPreview} activeOpacity={0.8} style={styles.previewWrapper}>
            {imageLoading && (
              <View style={styles.docLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            <Image
              source={{ uri: url }}
              style={styles.documentImage}
              resizeMode="contain"
              onLoadEnd={() => setImageLoading(false)}
              onError={() => { setImageLoading(false); setImageError(true); }}
            />
          </TouchableOpacity>
        )}

        {/* PDF placeholder (when not an image) */}
        {!hasImage && (
          <View style={[styles.docPlaceholder, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F9FAFB' }]}>
            {imageError ? (
              <>
                <File size={32} color={scheme.textTertiary} />
                <Text style={[styles.placeholderTitle, { color: scheme.textSecondary }]}>File</Text>
                <Text style={[styles.placeholderSub, { color: scheme.textTertiary }]}>Image failed to load, use View Full below</Text>
              </>
            ) : (
              <>
                <FileText size={32} color={isPdf ? '#EF4444' : scheme.textTertiary} />
                <Text style={[styles.placeholderTitle, { color: scheme.textSecondary }]}>
                  {isPdf ? 'PDF' : 'Document'} File
                </Text>
                <TouchableOpacity onPress={openPreview} activeOpacity={0.7} style={styles.tapToView}>
                  <Text style={[styles.tapToViewText, { color: Colors.primary }]}>Tap to open</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.docActions}>
          <TouchableOpacity style={[styles.docActionBtn, { backgroundColor: Colors.primary }]} onPress={handleView}>
            <ExternalLink size={16} color="#FFF" />
            <Text style={[styles.docActionText, { color: '#FFF' }]}>View Full</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.docActionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Download size={16} color={Colors.primary} />
                <Text style={[styles.docActionText, { color: Colors.primary }]}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen image preview modal */}
      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewVisible(false)} hitSlop={12}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: url }} style={styles.previewImage} resizeMode="contain" />
        </View>
      </Modal>
    </>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },

  fileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  fileLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', flex: 1 },

  previewWrapper: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  documentImage: { width: '100%', height: 300 },

  docPlaceholder: {
    alignItems: 'center', paddingVertical: Spacing.xl, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, gap: Spacing.xs,
  },
  placeholderTitle: { fontSize: Typography.fontSize.md, fontWeight: '600' },
  placeholderSub: { fontSize: Typography.fontSize.xs, textAlign: 'center', marginTop: 4 },
  tapToView: { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.pill, backgroundColor: `${Colors.primary}12` },
  tapToViewText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  docLoading: { paddingVertical: Spacing.xl, alignItems: 'center' },

  docActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  docActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, minHeight: 44,
  },
  docActionText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  /* Fullscreen preview modal */
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  previewCloseBtn: { position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 8 },
  previewImage: { width: '100%', height: '80%' },
});
