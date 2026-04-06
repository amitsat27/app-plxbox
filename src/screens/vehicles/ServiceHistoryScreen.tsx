import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Image, FlatList,
  KeyboardAvoidingView, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Plus, X, Camera, Upload, Calendar, FileText, Wrench, Shield, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService } from '@/src/services/FirebaseService';
import type { ServiceRecord } from '@/src/types';

type ComplianceType = 'service' | 'insurance' | 'puc';

const SERVICE_TYPES = ['regular', 'repair', 'annual', 'emergency'];
const SERVICE_TYPE_LABELS: Record<string, string> = {
  regular: 'Regular Service',
  repair: 'Repair',
  annual: 'Annual Maintenance',
  emergency: 'Emergency',
};

export default function ServiceHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleJson = params.vehicle ? decodeURIComponent(params.vehicle as string) : null;
  const vehicle = vehicleJson ? JSON.parse(vehicleJson) : null;

  const { isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ComplianceType>('service');
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  // Form state
  const [serviceType, setServiceType] = useState<ServiceRecord['serviceType']>('regular');
  const [serviceDate, setServiceDate] = useState(new Date());
  const [serviceCenter, setServiceCenter] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [nextServiceDue, setNextServiceDue] = useState<Date | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'service' | 'nextDue'>('service');
  const [tempDate, setTempDate] = useState(new Date());

  // Image/document state
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Service records
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Fetch records on mount
  React.useEffect(() => {
    if (vehicle?.id) {
      const unsub = firebaseService.getServiceRecordsForVehicle(vehicle.id, (data) => {
        setRecords(data);
        setLoadingRecords(false);
      });
      return () => unsub?.();
    }
  }, [vehicle?.id]);

  const resetForm = useCallback(() => {
    setServiceType('regular');
    setServiceDate(new Date());
    setServiceCenter('');
    setMechanic('');
    setCost('');
    setDescription('');
    setNextServiceDue(null);
    setDocumentUri(null);
    setDocumentName('');
    setEditingRecord(null);
    setModalType('service');
  }, []);

  const openModal = useCallback((type: ComplianceType) => {
    setModalType(type);
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((record: ServiceRecord) => {
    setEditingRecord(record);
    setModalType(record.serviceType as ComplianceType || 'service');
    setServiceType(record.serviceType || 'regular');
    setServiceDate(record.serviceDate ? new Date(record.serviceDate) : new Date());
    setServiceCenter(record.serviceCenter || '');
    setMechanic(record.mechanic || '');
    setCost(record.cost ? String(record.cost) : '');
    setDescription(record.description || '');
    setNextServiceDue(record.nextServiceDue ? new Date(record.nextServiceDue) : null);
    setModalVisible(true);
  }, []);

  const handleDateChange = useCallback((_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      if (datePickerTarget === 'service') {
        setServiceDate(selectedDate);
      } else {
        setNextServiceDue(selectedDate);
      }
    }
    setShowDatePicker(false);
  }, [datePickerTarget]);

  const pickDocument = useCallback(async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setDocumentUri(result.assets[0].uri);
      setDocumentName(result.assets[0].uri.split('/').pop() || 'Document');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setDocumentUri(result.assets[0].uri);
      setDocumentName(result.assets[0].uri.split('/').pop() || 'Photo');
    }
  }, []);

  const handleSave = async () => {
    if (!user?.uid || !vehicle?.id) {
      Alert.alert('Error', 'User or vehicle information missing');
      return;
    }

    if (editingRecord) {
      // Update existing record
      try {
        const updates: Partial<ServiceRecord> = {
          serviceDate,
          serviceType,
          serviceCenter: serviceCenter || undefined,
          mechanic: mechanic || undefined,
          cost: parseFloat(cost) || 0,
          description: description || undefined,
          nextServiceDue: nextServiceDue || undefined,
        };

        // Upload new document if provided
        if (documentUri) {
          setUploading(true);
          setUploadProgress(0);
          const docType = modalType === 'service' ? 'service' : modalType;
          const url = await firebaseService.uploadComplianceDocument(
            user.uid, vehicle.id, docType, documentUri,
            (pct) => setUploadProgress(pct),
          );
          updates.invoiceUrl = url;
        }

        await firebaseService.updateServiceRecord(editingRecord.id, updates);
        Alert.alert('Success', 'Record updated!');
        setModalVisible(false);
        resetForm();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update record');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
      return;
    }

    // Create new record
    try {
      let invoiceUrl: string | undefined;

      // Upload document if provided
      if (documentUri) {
        setUploading(true);
        setUploadProgress(0);
        const docType = modalType === 'service' ? 'service' : modalType;
        invoiceUrl = await firebaseService.uploadComplianceDocument(
          user.uid, vehicle.id, docType, documentUri,
          (pct) => setUploadProgress(pct),
        );
      }

      const record: Omit<ServiceRecord, 'id' | 'createdAt'> = {
        vehicleId: vehicle.id,
        userId: user.uid,
        serviceDate,
        serviceType,
        serviceCenter: serviceCenter || undefined,
        mechanic: mechanic || undefined,
        cost: parseFloat(cost) || 0,
        provider: serviceCenter || mechanic || 'Unknown',
        description: description || undefined,
        notes: undefined,
        receipts: [],
        nextServiceDue: nextServiceDue || undefined,
        invoiceUrl: invoiceUrl || undefined,
        updatedAt: new Date(),
      };

      await firebaseService.addServiceRecord(vehicle.id, record, 'vehicle');
      Alert.alert('Success', `${modalType === 'service' ? 'Service' : modalType.toUpperCase()} record added!`);
      setModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save record');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (record: ServiceRecord) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseService.deleteServiceRecord(record.id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const bg = isDark ? '#050510' : '#F8FAFC';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const fieldBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const fieldBorder = isDark ? '#3A3A3C' : '#E5E5EA';
  const textPrimary = isDark ? '#F8FAFC' : '#1E293B';
  const textSecondary = isDark ? '#CBD5E1' : '#475569';
  const textTertiary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => router.back()}>
          <ChevronLeft size={20} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>{vehicle?.name || 'Service History'}</Text>
          <Text style={[styles.headerSubtitle, { color: textTertiary }]}>Service, Insurance & PUC Records</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <ActionTile icon={<Wrench size={20} color="#F59E0B" />} label="Log Service" color="#F59E0B" onPress={() => openModal('service')} />
        <ActionTile icon={<Shield size={20} color="#3B82F6" />} label="Add Insurance" color="#3B82F6" onPress={() => openModal('insurance')} />
        <ActionTile icon={<FileText size={20} color="#10B981" />} label="Add PUC" color="#10B981" onPress={() => openModal('puc')} />
      </View>

      {/* Records List */}
      {loadingRecords ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#F59E0B" /></View>
      ) : records.length > 0 ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <ServiceRecordCard
              record={item}
              onEdit={() => openEditModal(item)}
              onDelete={() => handleDelete(item)}
              isDark={isDark}
              cardBg={cardBg}
              fieldBg={fieldBg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textTertiary={textTertiary}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Wrench size={48} color={textTertiary} />
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Service Records</Text>
          <Text style={[styles.emptyDesc, { color: textTertiary }]}>Tap a button above to add service, insurance, or PUC records.</Text>
        </View>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={styles.modalOverlay} onPress={() => { setModalVisible(false); resetForm(); }}>
            <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => {}}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  {editingRecord ? 'Edit' : 'Add'} {modalType === 'service' ? 'Service' : modalType.toUpperCase()} Record
                </Text>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: fieldBg }]} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <X size={18} color={textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Type Selector (for service only) */}
              {modalType === 'service' && (
                <>
                  <Text style={[styles.sectionLabel, { color: textSecondary }]}>Service Type</Text>
                  <View style={styles.typeRow}>
                    {SERVICE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, {
                          backgroundColor: serviceType === type ? '#F59E0B' : fieldBg,
                          borderColor: serviceType === type ? '#F59E0B' : fieldBorder,
                        }]}
                        onPress={() => { Haptics.selectionAsync(); setServiceType(type as ServiceRecord['serviceType']); }}
                      >
                        <Text style={[styles.typeLabel, {
                          color: serviceType === type ? '#000' : textTertiary,
                        }]}>{SERVICE_TYPE_LABELS[type]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Form */}
              <FormField
                label="Date"
                placeholder="Select date"
                value={serviceDate ? serviceDate.toLocaleDateString('en-IN') : ''}
                bg={fieldBg}
                border={fieldBorder}
                textPrimary={textPrimary}
                textTertiary={textTertiary}
                onPress={() => { setTempDate(serviceDate || new Date()); setDatePickerTarget('service'); setShowDatePicker(true); }}
              />

              {modalType === 'service' && (
                <>
                  <TextInput
                    style={[styles.input, { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary }]}
                    placeholder="Service Center"
                    placeholderTextColor={textTertiary}
                    value={serviceCenter}
                    onChangeText={setServiceCenter}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary }]}
                    placeholder="Mechanic / Technician Name"
                    placeholderTextColor={textTertiary}
                    value={mechanic}
                    onChangeText={setMechanic}
                  />
                </>
              )}

              <TextInput
                style={[styles.input, { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary }]}
                placeholder={`Cost (₹)${modalType === 'service' ? '' : ' (if applicable)'}`}
                placeholderTextColor={textTertiary}
                keyboardType="decimal-pad"
                value={cost}
                onChangeText={setCost}
              />

              {modalType === 'service' && (
                <FormField
                  label="Next Service Due (Optional)"
                  placeholder="Select date"
                  value={nextServiceDue ? nextServiceDue.toLocaleDateString('en-IN') : ''}
                  bg={fieldBg}
                  border={fieldBorder}
                  textPrimary={textPrimary}
                  textTertiary={textTertiary}
                  onPress={() => { setTempDate(nextServiceDue || new Date()); setDatePickerTarget('nextDue'); setShowDatePicker(true); }}
                  optional
                />
              )}

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary }]}
                placeholder={`Description / Notes...`}
                placeholderTextColor={textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Document Upload */}
              <View style={[styles.docSection, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                <Text style={[styles.docLabel, { color: textSecondary }]}>
                  {modalType === 'service' ? 'Service Bill' : `${modalType.toUpperCase()} Document`}
                </Text>
                {!documentUri ? (
                  <View style={styles.docActions}>
                    <TouchableOpacity style={[styles.docBtn, { borderColor: fieldBorder }]} onPress={takePhoto}>
                      <Camera size={18} color="#F59E0B" />
                      <Text style={[styles.docBtnText, { color: '#F59E0B' }]}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.docBtn, { borderColor: fieldBorder }]} onPress={pickDocument}>
                      <Upload size={18} color="#3B82F6" />
                      <Text style={[styles.docBtnText, { color: '#3B82F6' }]}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.docPreview}>
                    <Image source={{ uri: documentUri }} style={styles.docImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, { color: textPrimary }]} numberOfLines={1}>{documentName}</Text>
                      <TouchableOpacity onPress={() => { setDocumentUri(null); setDocumentName(''); }}>
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Upload Progress */}
              {uploading && (
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color="#F59E0B" />
                  <Text style={[styles.progressText, { color: textSecondary }]}>
                    Uploading... {uploadProgress}%
                  </Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { opacity: uploading ? 0.5 : 1 }]}
                onPress={handleSave}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveText}>{editingRecord ? 'Update' : 'Save'} Record</Text>
                )}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2040, 0, 1)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-Components ───

function ActionTile({ icon, label, color, onPress }: {
  icon: React.ReactNode; label: string; color: string; onPress: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity style={styles.actionTile} onPress={() => { Haptics.selectionAsync(); onPress(); }}>
      <View style={[styles.actionTileIcon, { backgroundColor: `${color}${isDark ? '15' : '12' }` }]}>{icon}</View>
      <Text style={[styles.actionTileLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormField({ label, placeholder, value, bg, border, textPrimary, textTertiary, onPress, optional }: {
  label: string; placeholder: string; value: string; bg: string; border: string;
  textPrimary: string; textTertiary: string; onPress: () => void; optional?: boolean;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: textTertiary }}>{label}{optional ? ' (Optional)' : ''}</Text>
      </View>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: bg, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        onPress={onPress}
      >
        <Text style={{ color: value ? textPrimary : textTertiary, fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Calendar size={16} color={textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

function ServiceRecordCard({
  record, onEdit, onDelete, isDark, cardBg, fieldBg, textPrimary, textSecondary, textTertiary,
}: {
  record: ServiceRecord; onEdit: () => void; onDelete: () => void;
  isDark: boolean; cardBg: string; fieldBg: string; textPrimary: string;
  textSecondary: string; textTertiary: string;
}) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    regular: { label: 'Regular', color: '#10B981' },
    repair: { label: 'Repair', color: '#EF4444' },
    annual: { label: 'Annual', color: '#3B82F6' },
    emergency: { label: 'Emergency', color: '#F59E0B' },
    insurance: { label: 'Insurance', color: '#8B5CF6' },
    puc: { label: 'PUC', color: '#06B6D4' },
  };

  const config = typeConfig[record.serviceType] || typeConfig.regular;

  return (
    <View style={[styles.recordCard, { backgroundColor: cardBg }]}>
      <View style={styles.recordHeader}>
        <View style={[styles.recordTypeBadge, { backgroundColor: `${config.color}15` }]}>
          <Text style={[styles.recordTypeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={onEdit}><Wrench size={16} color="#F59E0B" /></TouchableOpacity>
          <TouchableOpacity onPress={onDelete}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.recordRow}>
        <Text style={[styles.recordLabel, { color: textTertiary }]}>Date</Text>
        <Text style={[styles.recordValue, { color: textPrimary }]}>
          {new Date(record.serviceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {record.serviceCenter && (
        <View style={styles.recordRow}>
          <Text style={[styles.recordLabel, { color: textTertiary }]}>Center</Text>
          <Text style={[styles.recordValue, { color: textPrimary }]}>{record.serviceCenter}</Text>
        </View>
      )}

      {record.mechanic && (
        <View style={styles.recordRow}>
          <Text style={[styles.recordLabel, { color: textTertiary }]}>Mechanic</Text>
          <Text style={[styles.recordValue, { color: textPrimary }]}>{record.mechanic}</Text>
        </View>
      )}

      <View style={styles.recordRow}>
        <Text style={[styles.recordLabel, { color: textTertiary }]}>Cost</Text>
        <Text style={[styles.recordCost, { color: '#F59E0B' }]}>₹{(record.cost || 0).toLocaleString('en-IN')}</Text>
      </View>

      {record.description && (
        <Text style={[styles.recordDesc, { color: textSecondary }]}>{record.description}</Text>
      )}

      {record.invoiceUrl && (
        <View style={[styles.docLink, { backgroundColor: fieldBg }]}>
          <FileText size={14} color="#3B82F6" />
          <Text style={[styles.docLinkText, { color: '#3B82F6' }]}>View Document</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { padding: 10, borderRadius: 14 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
  actionTile: { flex: 1, alignItems: 'center', gap: 6 },
  actionTileIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionTileLabel: { fontSize: 11, fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    maxHeight: '90%',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 16 } }),
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15, marginBottom: 14 },
  textArea: { minHeight: 80 },
  docSection: { padding: 14, borderRadius: 16, marginBottom: 14, borderWidth: 1 },
  docLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  docActions: { flexDirection: 'row', gap: 12 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  docBtnText: { fontSize: 14, fontWeight: '700' },
  docPreview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docImage: { width: 60, height: 60, borderRadius: 12, resizeMode: 'cover' },
  docName: { fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressText: { fontSize: 13, fontWeight: '500' },
  saveButton: { backgroundColor: '#F59E0B', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '800', color: '#000' },

  recordCard: { padding: 16, borderRadius: 20, gap: 8 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recordTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  recordTypeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordLabel: { fontSize: 13, fontWeight: '500' },
  recordValue: { fontSize: 14, fontWeight: '600' },
  recordCost: { fontSize: 16, fontWeight: '800' },
  recordDesc: { fontSize: 13, lineHeight: 20, marginTop: 2 },
  docLink: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 12 },
  docLinkText: { fontSize: 13, fontWeight: '700' },
});