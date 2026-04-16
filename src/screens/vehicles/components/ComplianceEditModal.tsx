/**
 * Compliance Edit Modal — edit insurance, PUC, registration, or next service date
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { X, FileText } from 'lucide-react-native';
import { Colors } from '@/theme/color';

type ComplianceEditTarget = 'insurance' | 'puc' | 'registration' | 'service';

export interface ComplianceEditModalProps {
  visible: boolean;
  target: ComplianceEditTarget | null;
  date: Date;
  label: string;
  isDark: boolean;
  onChange: (date: Date) => void;
  onSave: () => void;
  onClose: () => void;
  documentUrl?: string;
  onDocumentUpload: (url: string) => Promise<void>;
}

const COMPLIANCE_COLORS: Record<ComplianceEditTarget, string> = {
  insurance: '#3B82F6',
  puc: '#10B981',
  registration: '#F59E0B',
  service: '#8B5CF6',
};

export default function ComplianceEditModal({
  visible, target, date, label, isDark, onChange, onSave, onClose, documentUrl, onDocumentUpload,
}: ComplianceEditModalProps) {
  const [uploading, setUploading] = useState(false);
  
  if (!visible || !target) return null;
  const color = COMPLIANCE_COLORS[target];

  const handlePickDocument = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        try {
          await onDocumentUpload(uri);
        } catch (e: any) {
          console.error('Document upload failed:', e);
        } finally {
          setUploading(false);
        }
      }
    } catch (e: any) {
      setUploading(false);
      console.error('Error picking document:', e);
    }
  };

  // Ensure date is always a valid Date object — Firestore serializes dates to strings/timestamps
  const parseDate = (val: Date | string | undefined | null): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    if (typeof val === 'string') { const d = new Date(val); return isNaN(d.getTime()) ? new Date() : d; }
    if ((val as any)?.toDate) return (val as any).toDate();
    if ((val as any)?.seconds) return new Date((val as any).seconds * 1000);
    return new Date();
  };

  const safeDate = parseDate(date as any);

  return (
    <View style={[styles.overlay, Platform.OS === 'ios' && { flex: 1 }]}>
      {Platform.OS === 'ios' ? (
        <View style={[styles.iosContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerDot, { backgroundColor: color }]} />
            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={18} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
          {/* Current expiry date */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#6B7280' }}>Current expiry date</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#F8FAFC' : '#1E293B' }}>
              {safeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          {/* Date Picker — wrapped with themed background */}
          <View style={[styles.pickerWrapper, { backgroundColor: isDark ? '#27272A' : '#F5F5F5', borderRadius: 12, overflow: 'hidden' }]}>
            <DateTimePicker
              value={safeDate}
              mode="date"
              display="spinner"
              onChange={(_: DateTimePickerEvent, selectedDate?: Date) => {
                if (selectedDate) onChange(selectedDate);
              }}
              style={styles.picker}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2050, 0, 1)}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
          {/* Document Upload */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <TouchableOpacity
              style={[{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 14,
              }, uploading && { opacity: 0.5 }]}
              onPress={handlePickDocument}
              disabled={uploading}
              activeOpacity={0.7}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={isDark ? '#A1A1AA' : '#6B7280'} />
              ) : (
                <FileText size={16} color={Colors.warning} />
              )}
              <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#CBD5E1' : '#475569' }}>
                {uploading ? 'Uploading...' : `Upload ${target === 'service' ? 'Service' : target === 'insurance' ? 'Insurance' : target === 'puc' ? 'PUC' : 'Registration'} Document`}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Action Buttons */}
          <View style={[styles.actions, { borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={onClose}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#A1A1AA' : '#6B7280' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onSave}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Android — native date picker
        <DateTimePicker
          value={safeDate}
          mode="date"
          display="default"
          onChange={(_evt, selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate);
              onSave();
              onClose();
            }
          }}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2050, 0, 1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' },
  iosContainer: { borderRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { marginHorizontal: 12 }, android: { marginHorizontal: 16 } }), ...Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 8 },
  })},
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 8 },
  headerDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  pickerWrapper: { overflow: 'hidden' },
  picker: { height: 180 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 16, paddingTop: 12, borderTopWidth: 0.5 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
});
