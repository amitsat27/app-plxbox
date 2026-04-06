/**
 * Service Record Modal — add or edit a vehicle service log entry
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Calendar, X, IndianRupee, Wrench, Receipt } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Colors } from '@/theme/color';
import type { ServiceRecord } from '@/src/types';

const SERVICE_TYPES = [
  { key: 'regular', label: 'Regular', emoji: '🔧' },
  { key: 'repair', label: 'Repair', emoji: '🛠️' },
  { key: 'annual', label: 'Annual', emoji: '📋' },
  { key: 'emergency', label: 'Emergency', emoji: '🚨' },
  { key: 'custom', label: 'Other', emoji: '⚙️' },
];

interface Props {
  visible: boolean;
  isEdit: boolean;
  record: ServiceRecord | null;
  isDark: boolean;
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function ServiceRecordModal({ visible, isEdit, record, isDark, onSave, onClose }: Props) {
  const fieldBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const fieldBorder = isDark ? '#3A3A3C' : '#E5E5EA';

  const safeDate = (val: Date | undefined) => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    if (typeof val === 'string') { const d = new Date(val); return isNaN(d.getTime()) ? new Date() : d; }
    return new Date();
  };

  const [serviceDate, setServiceDate] = useState(safeDate(record?.serviceDate));
  const [serviceType, setServiceType] = useState('regular');
  const [serviceCenter, setServiceCenter] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [mileageAtService, setMileageAtService] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible && record) {
      setServiceDate(safeDate(record.serviceDate));
      setServiceType(record.serviceType || 'regular');
      setServiceCenter(record.serviceCenter || '');
      setMechanic(record.mechanic || '');
      setCost(String(record.cost || ''));
      setDescription(record.description || '');
      setMileageAtService(record.mileageAtService ? String(record.mileageAtService) : '');
      setReceiptUri((record as any)?.receiptUrl || null);
    } else if (visible && !record) {
      setServiceDate(new Date());
      setServiceType('regular');
      setServiceCenter('');
      setMechanic('');
      setCost('');
      setDescription('');
      setMileageAtService('');
    }
  }, [visible, record]);

  // Receipt picker functions
  const pickReceiptFromCamera = async () => {
    try {
      setUploadingReceipt(true);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied', 'Camera permission is required');
        setUploadingReceipt(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!result.canceled && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Error picking receipt image:', e);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const pickReceiptFromLibrary = async () => {
    try {
      setUploadingReceipt(true);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied', 'Camera permission is required');
        setUploadingReceipt(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!result.canceled && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Error picking receipt image:', e);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const showReceiptOptions = () => {
    Alert.alert(
      'Receipt',
      'Choose image source',
      [
        { text: 'Camera', onPress: () => pickReceiptFromCamera() },
        { text: 'Gallery', onPress: () => pickReceiptFromLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleSave = async () => {
    if (!cost) { Alert.alert('Required', 'Cost is mandatory'); return; }
    try {
      setSaving(true);
      await onSave({
        serviceDate,
        serviceType,
        serviceCenter: serviceCenter || undefined,
        mechanic: mechanic || undefined,
        cost: parseFloat(cost) || 0,
        description: description || undefined,
        mileageAtService: parseInt(mileageAtService || '0') || undefined,
        receiptUri: receiptUri || undefined,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]}>
      <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: fieldBorder }]}>
          <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
            {isEdit ? 'Edit Service' : 'Log Service'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={20} color={isDark ? '#A1A1AA' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Service Date */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>Service Date</Text>
          <TouchableOpacity
            style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder, paddingVertical: 10 }]}
            onPress={() => {
              Platform.OS === 'android'
                ? Alert.alert('Choose Date', 'Use the picker below', [
                    { text: 'OK', style: 'cancel' },
                  ])
                : undefined;
            }}
          >
            <Calendar size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
            <Text style={[styles.input, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>
              {serviceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 4 }} />
          <View style={[styles.pickerWrapper, { backgroundColor: isDark ? '#27272A' : '#F5F5F5', borderRadius: 12 }]}>
            <DateTimePicker
              value={serviceDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(_evt, d) => { if (d) setServiceDate(d); }}
              style={{ height: Platform.OS === 'ios' ? 140 : undefined }}
              minimumDate={new Date(2000, 0, 1)}
              maximumDate={new Date(2050, 0, 1)}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>

          {/* Service Type */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569' }]}>Service Type</Text>
          <View style={styles.typeRow}>
            {SERVICE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, {
                  backgroundColor: serviceType === t.key ? `${Colors.warning}20` : fieldBg,
                  borderColor: serviceType === t.key ? Colors.warning : fieldBorder,
                }]}
                onPress={() => setServiceType(t.key)}
              >
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: serviceType === t.key ? Colors.warning : isDark ? '#A1A1AA' : '#6B7280' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cost */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Cost</Text>
          <View style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <IndianRupee size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
            <TextInput
              style={[styles.input, { color: isDark ? '#F8FAFC' : '#1E293B' }]}
              placeholder="0"
              placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Service Center */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Service Center</Text>
          <TextInput
            style={[styles.inputFull, { backgroundColor: fieldBg, color: isDark ? '#F8FAFC' : '#1E293B', borderColor: fieldBorder }]}
            placeholder="e.g., Honda Service Center"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            value={serviceCenter}
            onChangeText={setServiceCenter}
          />

          {/* Mechanic Name */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Mechanic Name</Text>
          <TextInput
            style={[styles.inputFull, { backgroundColor: fieldBg, color: isDark ? '#F8FAFC' : '#1E293B', borderColor: fieldBorder }]}
            placeholder="e.g., Raju Mechanic"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            value={mechanic}
            onChangeText={setMechanic}
          />

          {/* Odometer at service */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Odometer (km)</Text>
          <View style={[styles.inputRow, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <Wrench size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
            <TextInput
              style={[styles.input, { color: isDark ? '#F8FAFC' : '#1E293B' }]}
              placeholder="0"
              placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
              value={mileageAtService}
              onChangeText={setMileageAtService}
              keyboardType="number-pad"
            />
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Notes</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: fieldBg, color: isDark ? '#F8FAFC' : '#1E293B', borderColor: fieldBorder }]}
            placeholder="What was done?"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Service Receipt Upload */}
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#475569', marginTop: 14 }]}>Service Receipt</Text>
          {receiptUri ? (
            <View>
              <Image source={{ uri: receiptUri }} style={styles.receiptImage} contentFit="contain" cachePolicy="memory-disk" />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }]} onPress={() => setReceiptUri(null)}>
                  <X size={14} color="#EF4444" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }]} onPress={showReceiptOptions}>
                  <Camera size={14} color={isDark ? '#A1A1AA' : '#6B7280'} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#A1A1AA' : '#6B7280' }}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }]} onPress={pickReceiptFromCamera}>
                <Camera size={14} color={isDark ? '#A1A1AA' : '#6B7280'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#A1A1AA' : '#6B7280' }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }]} onPress={pickReceiptFromLibrary}>
                <Receipt size={14} color={isDark ? '#A1A1AA' : '#6B7280'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#A1A1AA' : '#6B7280' }}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { borderTopColor: fieldBorder }]}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.warning }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' },
  container: {
    borderRadius: 24, overflow: 'hidden', maxHeight: '85%', marginHorizontal: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, gap: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  inputFull: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15, minHeight: 80 },
  pickerWrapper: { overflow: 'hidden' },
  picker: { marginTop: 4 },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  receiptImage: { width: '100%', height: 120, borderRadius: 12 },
  footer: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 0.5 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
