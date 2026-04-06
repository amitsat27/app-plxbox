/**
 * Add/Edit Service Record Screen
 *
 * Screen for adding/editing an appliance service record.
 * Works with Firebase (addApplianceServiceRecord / updateServiceRecord).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import {
  ChevronLeft,
  Save,
  Calendar,
  Wrench,
  CreditCard,
  Building2,
  FileText,
  Settings,
  ShieldCheck,
  Search,
  MoreHorizontal,
  Trash2,
} from 'lucide-react-native';
import { firebaseService } from '@/src/services/FirebaseService';
import ReceiptUploader from '@/components/appliances/ReceiptUploader';
import type { ServiceRecord, ServiceReceipt } from '@/src/types';

type ServiceType = 'repair' | 'maintenance' | 'warranty' | 'inspection' | 'other';

const SERVICE_TYPES: { key: ServiceType; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'repair', label: 'Repair', Icon: Wrench },
  { key: 'maintenance', label: 'Maint', Icon: Settings },
  { key: 'warranty', label: 'Warranty', Icon: ShieldCheck },
  { key: 'inspection', label: 'Inspect', Icon: Search },
  { key: 'other', label: 'Other', Icon: MoreHorizontal },
];

export default function AddServiceRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Route params
  const applianceId = (params.applianceId as string) || '';
  const applianceName = (params.applianceName as string) || 'Appliance';
  const serviceRecordId = params.serviceRecordId as string | undefined;

  const isEdit = !!serviceRecordId;

  // Form state
  const [serviceDate, setServiceDate] = useState(new Date());
  const [serviceType, setServiceType] = useState<ServiceType>('repair');
  const [cost, setCost] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedReceipts, setUploadedReceipts] = useState<ServiceReceipt[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pre-fill when editing
  const safeDate = useCallback((val: any): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }, []);

  // Load existing record from Firebase when editing
  useEffect(() => {
    if (!isEdit || !serviceRecordId) return;
    let cancelled = false;

    (firebaseService as any).getServiceRecordsForAppliance?.(applianceId, (records: ServiceRecord[]) => {
      if (cancelled) return;
      const found = records.find((r: ServiceRecord) => r.id === serviceRecordId);
      if (found) {
        setServiceDate(safeDate(found.serviceDate));
        setServiceType((found.serviceType as ServiceType) || 'repair');
        setCost(String(found.cost ?? ''));
        setProvider(found.provider || '');
        setDescription(found.description || '');
        setNotes(found.notes || '');
        setUploadedReceipts(found.receipts || []);
      }
    });

    return () => { cancelled = true; };
  }, [isEdit, serviceRecordId, applianceId]);

  // Date picker handler
  const handleDateChange = useCallback(
    (_: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (selectedDate) {
        setServiceDate(selectedDate);
      }
    },
    [],
  );

  // Validation
  const validate = (): boolean => {
    if (!provider.trim()) {
      Alert.alert('Required', 'Please enter service provider');
      return false;
    }
    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Required', 'Please enter a valid cost (>= 0)');
      return false;
    }
    return true;
  };

  // Save
  const handleSave = async () => {
    if (!validate()) return;

    const costNum = parseFloat(cost) || 0;

    console.log('[AddServiceRecord] uploading receipts count:', uploadedReceipts.length, 'data:', JSON.stringify(uploadedReceipts, null, 2));

    const baseData: Partial<ServiceRecord> = {
      serviceDate,
      serviceType,
      provider: provider.trim(),
      cost: costNum,
      receipts: uploadedReceipts,
    };
    if (description.trim()) baseData.description = description.trim();
    if (notes.trim()) baseData.notes = notes.trim();

    setSaveLoading(true);

    try {
      if (isEdit && serviceRecordId) {
        await firebaseService.updateServiceRecord(serviceRecordId, baseData);
      } else {
        const newRecord: any = {
          userId: user?.uid || '',
          serviceDate,
          serviceType,
          provider: provider.trim(),
          cost: costNum,
          receipts: uploadedReceipts,
        };
        if (description.trim()) newRecord.description = description.trim();
        if (notes.trim()) newRecord.notes = notes.trim();

        await firebaseService.addApplianceServiceRecord(applianceId, newRecord);
      }
      router.back();
    } catch (err: any) {
      console.error('Save service record error:', err);
      Alert.alert('Error', err?.message || 'Failed to save service record');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Service Record',
      'Are you sure you want to delete this service record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (serviceRecordId) await firebaseService.deleteServiceRecord(serviceRecordId);
              router.back();
            } catch (err: any) {
              console.error('Delete service record error:', err);
              Alert.alert('Error', err?.message || 'Failed to delete service record');
            }
          },
        },
      ],
    );
  };

  const handleReceiptsUploaded = (receipts: ServiceReceipt[]) => {
    console.log('[AddServiceRecord] handleReceiptsUploaded called, count:', receipts.length, 'data:', JSON.stringify(receipts, null, 2));
    setUploadedReceipts(receipts);
  };

  const fieldBg = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)';
  const dividerBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const typeColor = '#7C3AED';

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: scheme.background }]}
    >
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* iOS-style header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={scheme.textPrimary} />
            <Text style={[styles.backText, { color: '#7C3AED' }]}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text
              style={[styles.headerTitle, { color: scheme.textPrimary }]}
              numberOfLines={1}
            >
              {isEdit ? 'Edit Service Record' : 'Add Service Record'}
            </Text>
            {applianceName && (
              <Text
                style={[styles.headerSub, { color: scheme.textTertiary }]}
                numberOfLines={1}
              >
                {applianceName}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isEdit && (
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)' }]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, saveLoading && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saveLoading}
              activeOpacity={0.7}
            >
              {saveLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Save size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Service Type (segmented picker with icons) */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>
              Service Type
            </Text>
            <View style={[styles.typeRowCard, { backgroundColor: scheme.cardBackground }]}>
              {SERVICE_TYPES.map((t) => {
                const isActive = serviceType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          isActive ? typeColor : (isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)'),
                        borderColor: isActive ? typeColor : dividerBg,
                      },
                    ]}
                    onPress={() => setServiceType(t.key)}
                    activeOpacity={0.7}
                  >
                    <t.Icon size={14} color={isActive ? '#FFF' : scheme.textTertiary} />
                    <Text
                      style={[
                        styles.typeText,
                        { color: isActive ? '#FFF' : scheme.textTertiary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Date</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <TouchableOpacity
                style={styles.dateField}
                onPress={() => {
                  setTempDate(serviceDate || new Date());
                  setShowDatePicker(true);
                }}
                activeOpacity={0.6}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Calendar size={18} color={scheme.textTertiary} />
                  <Text style={[styles.dateFieldLabel, { color: scheme.textSecondary }]}>
                    Service Date
                  </Text>
                </View>
                <Text
                  style={[styles.dateFieldValue, { color: scheme.textPrimary }]}
                >
                  {serviceDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cost & Provider */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>
              Service Details
            </Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              {/* Cost */}
              <FieldInputWithIcon
                icon={<CreditCard size={16} color={scheme.textTertiary} />}
                label="Cost (₹)"
                value={cost}
                onChange={setCost}
                placeholder="e.g. 1500"
                keyboardType="decimal-pad"
                dividerBg={dividerBg}
                required
              />
              <View style={{ height: 1, backgroundColor: dividerBg }} />

              {/* Provider */}
              <FieldInputWithIcon
                icon={<Building2 size={16} color={scheme.textTertiary} />}
                label="Provider"
                value={provider}
                onChange={setProvider}
                placeholder="e.g. Samsung Service Center"
                dividerBg={dividerBg}
                required
              />

              {/* Description */}
              <View style={styles.fieldBlock}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}
                >
                  <FileText size={16} color={scheme.textTertiary} />
                  <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>
                    Description
                  </Text>
                  <Text style={[styles.optionalBadge, { color: scheme.textTertiary }]}>
                    Optional
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    { color: scheme.textPrimary, backgroundColor: fieldBg },
                  ]}
                  placeholder="What was done..."
                  placeholderTextColor={scheme.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
              <View style={{ height: 1, backgroundColor: dividerBg }} />

              {/* Notes */}
              <View style={styles.fieldBlock}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}
                >
                  <Wrench size={16} color={scheme.textTertiary} />
                  <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>Notes</Text>
                  <Text style={[styles.optionalBadge, { color: scheme.textTertiary }]}>
                    Optional
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    { color: scheme.textPrimary, backgroundColor: fieldBg },
                  ]}
                  placeholder="Additional notes..."
                  placeholderTextColor={scheme.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Receipt Uploader */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>
              Receipts
            </Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground, paddingHorizontal: 12, paddingVertical: 8 }]}>
              {applianceId ? (
                <ReceiptUploader
                  applianceId={applianceId}
                  initialReceipts={uploadedReceipts}
                  onReceiptsUploaded={handleReceiptsUploaded}
                />
              ) : (
                <Text style={[styles.noDataText, { color: scheme.textTertiary }]}>
                  Appliance ID is required to upload receipts.
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Date Picker (iOS spinner / Android dialog) */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(evt, date) => {
            handleDateChange(evt, date);
            if (date) {
              setServiceDate(date);
              setShowDatePicker(false);
            } else {
              setShowDatePicker(false);
            }
          }}
        />
      )}

      {showDatePicker && Platform.OS === 'ios' && (
        <View
          style={[
            styles.datePickerBackdrop,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' },
          ]}
        >
          <View style={styles.datePickerFiller}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
          </View>
          <View style={[styles.datePickerContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.datePickerToolbar}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={8}>
                <Text style={[styles.datePickerCancel, { color: '#8E8E93' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setServiceDate(tempDate);
                  setShowDatePicker(false);
                }}
                hitSlop={8}
              >
                <Text style={[styles.datePickerDone, { color: '#7C3AED' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_evt: DateTimePickerEvent, d?: Date) => {
                if (d) setTempDate(d);
              }}
              style={{ height: 160 }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ── Small inline helpers ── */

function FieldInputWithIcon({
  icon,
  label,
  labelSuffix,
  value,
  onChange,
  placeholder,
  keyboardType,
  dividerBg,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  labelSuffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  dividerBg?: string;
  required?: boolean;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fieldBg = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)';
  const rowBg = isDark ? 'rgba(28,28,30,0.6)' : 'rgba(0,0,0,0.01)';

  return (
    <View style={{ paddingVertical: 8, backgroundColor: rowBg }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}
      >
        {icon}
        {required && <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}> * </Text>}
        <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>
          {label}
          {labelSuffix}
        </Text>
        {!required && (
          <Text style={[styles.optionalBadge, { color: scheme.textTertiary }]}>
            Optional
          </Text>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          { color: scheme.textPrimary, backgroundColor: fieldBg },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        keyboardType={keyboardType || 'default'}
      />
      {dividerBg && <View style={{ height: 1, backgroundColor: dividerBg, marginTop: 8 }} />}
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 4,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400',
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Sections */
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 18,
    marginLeft: 20,
  },

  /* Type chips */
  typeRowCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Cards */
  card: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
    overflow: 'hidden',
    marginHorizontal: 16,
  },

  /* Date */
  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateFieldValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Fields */
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 70,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  fieldBlock: {
    paddingVertical: 10,
  },

  /* Misc */
  noDataText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },

  /* Date picker modal (iOS) */
  datePickerBackdrop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    flexDirection: 'column',
  },
  datePickerFiller: {
    flex: 1,
  },
  datePickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  datePickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  datePickerCancel: {
    fontSize: 17,
    fontWeight: '400',
  },
  datePickerDone: {
    fontSize: 17,
    fontWeight: '600',
  },

  /* Android date picker container */
  datePickerAndroidOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
});
