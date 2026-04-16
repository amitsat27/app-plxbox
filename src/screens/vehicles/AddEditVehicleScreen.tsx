/**
 * Add Vehicle Screen — sectioned form with premium UI
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X as CloseIcon, Car, Gauge, Calendar, Wrench, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService } from '@/src/services/FirebaseService';
import type { Vehicle, VehicleFormValues, VehicleType, FuelType } from '@/src/types';
import VehicleImageHeader from './components/VehicleImageHeader';

const VEHICLE_TYPES: VehicleType[] = ['car', 'bike', 'truck', 'other'];
const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
const TYPE_LABELS: Record<VehicleType, string> = { car: 'Car', bike: 'Motorcycle', truck: 'Truck', other: 'Other' };
const FUEL_LABELS: Record<FuelType, string> = { petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid', cng: 'CNG', lpg: 'LPG' };

type DateFieldKey = 'insuranceExpiry' | 'registrationExpiry' | 'pucExpiry';

export default function AddEditVehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const fadeAnim = useSharedValue(0);

  // Determine edit mode from route params
  const editMode: Vehicle | null = React.useMemo(() => {
    try {
      if (params.edit === 'true' && params.vehicleData) {
        return JSON.parse(decodeURIComponent(params.vehicleData as string));
      }
    } catch {}
    return null;
  }, []);

  React.useEffect(() => { fadeAnim.value = withTiming(1, { duration: 300 }); }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

  // Helper to parse dates from Firestore timestamps or ISO strings
  const parseDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }
    if (val?.toDate) return val.toDate();
    if (val?.seconds) return new Date(val.seconds * 1000);
    return undefined;
  };

  const [form, setForm] = useState<Partial<VehicleFormValues>>(() => {
    if (editMode) {
      return {
        name: editMode.name || '',
        type: editMode.type || 'car',
        make: editMode.make || '',
        model: editMode.model || '',
        year: editMode.year || new Date().getFullYear(),
        registrationNumber: editMode.registrationNumber || '',
        registrationExpiry: parseDate(editMode.registrationExpiry) || new Date(2030, 0, 1),
        insuranceExpiry: parseDate(editMode.insuranceExpiry) || new Date(2030, 0, 1),
        pucExpiry: parseDate(editMode.pucExpiry),
        fuelType: editMode.fuelType || 'petrol',
        mileage: editMode.mileage,
        odometerReading: editMode.odometerReading,
        fuelTankCapacity: editMode.fuelTankCapacity,
        color: editMode.color || '',
        vin: editMode.vin || '',
        engineNumber: editMode.engineNumber || '',
        chassisNumber: editMode.chassisNumber || '',
        location: editMode.location || 'pune',
        notes: editMode.notes || '',
        purchasePrice: editMode.purchasePrice,
        currentValue: editMode.currentValue,
        purchaseDate: parseDate(editMode.purchaseDate) || new Date(),
        images: editMode.images || [],
      };
    }
    return {
      name: '', type: 'car', make: '', model: '',
      year: new Date().getFullYear(), registrationNumber: '',
      registrationExpiry: new Date(2030, 0, 1),
      insuranceExpiry: new Date(2030, 0, 1), pucExpiry: undefined,
      fuelType: 'petrol', mileage: undefined, odometerReading: undefined,
      fuelTankCapacity: undefined, color: '', vin: '',
      engineNumber: '', chassisNumber: '', location: 'pune', notes: '',
      purchasePrice: undefined, currentValue: undefined,
      purchaseDate: new Date(), images: [],
    };
  });

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const editingMode = editMode !== null;
  const [selectedImages, setSelectedImages] = useState<string[]>(form.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [16, 9],
    });
    if (!result.canceled && !!result.assets) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickImageFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission denied', 'Camera permission is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && !!result.assets) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Vehicle Image',
      'Choose image source',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Gallery', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const showImageOptionsForImage = (index: number) => {
    Alert.alert(
      'Image',
      'What would you like to do?',
      [
        { text: 'Delete', onPress: () => setSelectedImages((prev) => prev.filter((_, i) => i !== index)), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  // Date picker state — per field, so each picker appears inline
  const [pickerState, setPickerState] = React.useState<Record<DateFieldKey, {
    active: boolean; tempDate: Date;
  }>>({
    insuranceExpiry: { active: false, tempDate: new Date() },
    registrationExpiry: { active: false, tempDate: new Date() },
    pucExpiry: { active: false, tempDate: new Date() },
  });

  const onDateFieldPress = useCallback((field: DateFieldKey) => {
    const existingDate = form[field];
    setPickerState((prev) => ({
      ...prev,
      [field]: { active: true, tempDate: existingDate || new Date() },
    }));
  }, [form]);

  const onPickerChange = useCallback((field: DateFieldKey, selectedDate?: Date) => {
    if (selectedDate) {
      setPickerState((prev) => ({
        ...prev,
        [field]: { ...prev[field], tempDate: selectedDate },
      }));
    }
  }, []);

  const onDone = useCallback((field: DateFieldKey) => {
    set(field, pickerState[field].tempDate);
    setPickerState((prev) => ({ ...prev, [field]: { ...prev[field], active: false } }));
  }, [pickerState]);

  const onCancel = useCallback((field: DateFieldKey) => {
    setPickerState((prev) => ({ ...prev, [field]: { ...prev[field], active: false } }));
  }, []);

  const handleSave = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      setSaving(true);

      // Upload new images to Firebase and update form.images
      const uploadedUrls: string[] = [];
      const existingUrls = editMode?.id ? (form.images || []) : [];
      const toUpload = selectedImages.filter(uri => uri && (!existingUrls.includes(uri)));
      if (toUpload.length > 0) {
        setUploadingImage(true);
        for (const uri of toUpload) {
          try {
            const url = await firebaseService.uploadVehicleImage(uri, editMode?.id || 'pending');
            uploadedUrls.push(url);
          } catch (e) {
            console.error('Failed to upload image:', e);
          }
        }
      }

      const allImages = [...existingUrls, ...uploadedUrls];
      if (editMode?.id) {
        await firebaseService.updateVehicle(editMode.id, { ...form, images: allImages } as any, editMode.location);
      } else {
        await firebaseService.addVehicle(user.uid, { ...form, images: allImages } as any);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const fieldBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const fieldBorder = isDark ? '#3A3A3C' : '#E5E5EA';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#050510' : '#F8FAFC' }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => router.back()}>
            <CloseIcon size={20} color={isDark ? '#F8FAFC' : '#1E293B'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{editMode ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#F59E0B' }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={fadeStyle}>
            {/* Vehicle Type Preview */}
            <View style={styles.previewWrap}>
              <VehicleImageHeader
                type={form.type || 'car'}
                size="card"
                uploadedImageUrl={selectedImages[0]}
                showCameraIcon={true}
                onCameraPress={showImagePickerOptions}
              />
            </View>

            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, marginBottom: 16, gap: 8 }}>
                {selectedImages.map((uri, idx) => (
                  <TouchableOpacity key={idx} onPress={() => showImageOptionsForImage(idx)} activeOpacity={0.8}>
                    <Image source={{ uri }} style={{ width: 80, height: 60, borderRadius: 12 }} cachePolicy="memory-disk" />
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{idx + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Basic Info */}
            <Section title="Basic Info" icon={Car} scheme={isDark}>
              <Input label="Name" placeholder="e.g., My Honda City" value={form.name || ''}
                onChangeText={(v: string) => set('name', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Registration Number" placeholder="MH14AB1234" value={form.registrationNumber || ''}
                onChangeText={(v: string) => set('registrationNumber', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Make" placeholder="e.g., Honda" value={form.make || ''}
                onChangeText={(v: string) => set('make', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Model" placeholder="e.g., City ZX" value={form.model || ''}
                onChangeText={(v: string) => set('model', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Year" placeholder="2024" value={form.year ? String(form.year) : '2024'} keyboardType="number-pad"
                onChangeText={(v: string) => set('year', parseInt(v) || 2024)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
            </Section>

            {/* Type & Fuel */}
            <Section title="Type & Fuel" icon={Gauge} scheme={isDark}>
              <Text style={[styles.subLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Vehicle Type</Text>
              <ChipRow values={VEHICLE_TYPES} selected={form.type || 'car'} onSelect={(v: string) => set('type', v)} labels={TYPE_LABELS} />
              <Text style={[styles.subLabel, { color: isDark ? '#94A3B8' : '#6B7280', marginTop: 12 }]}>Fuel Type</Text>
              <ChipRow values={FUEL_TYPES} selected={form.fuelType || 'petrol'} onSelect={(v: string) => set('fuelType', v)} labels={FUEL_LABELS} />
            </Section>

            {/* Compliance Dates */}
            <Section title="Compliance Dates" icon={Calendar} scheme={isDark}>
              <DateField label="Insurance Expiry" value={form.insuranceExpiry}
                onClear={() => set('insuranceExpiry', undefined)}
                bg={fieldBg} border={fieldBorder} isDark={isDark}
                pickerActive={pickerState.insuranceExpiry.active}
                pickerDate={pickerState.insuranceExpiry.tempDate}
                onOpen={() => onDateFieldPress('insuranceExpiry')}
                onPickerChange={(d) => onPickerChange('insuranceExpiry', d)}
                onDone={() => onDone('insuranceExpiry')}
                onCancel={() => onCancel('insuranceExpiry')} />
              <DateField label="Registration Expiry" value={form.registrationExpiry}
                onClear={() => set('registrationExpiry', undefined)}
                bg={fieldBg} border={fieldBorder} isDark={isDark}
                pickerActive={pickerState.registrationExpiry.active}
                pickerDate={pickerState.registrationExpiry.tempDate}
                onOpen={() => onDateFieldPress('registrationExpiry')}
                onPickerChange={(d) => onPickerChange('registrationExpiry', d)}
                onDone={() => onDone('registrationExpiry')}
                onCancel={() => onCancel('registrationExpiry')} />
              <DateField label="PUC Expiry" value={form.pucExpiry} optional
                onClear={() => set('pucExpiry', undefined)}
                bg={fieldBg} border={fieldBorder} isDark={isDark}
                pickerActive={pickerState.pucExpiry.active}
                pickerDate={pickerState.pucExpiry.tempDate}
                onOpen={() => onDateFieldPress('pucExpiry')}
                onPickerChange={(d) => onPickerChange('pucExpiry', d)}
                onDone={() => onDone('pucExpiry')}
                onCancel={() => onCancel('pucExpiry')} />
            </Section>

            {/* Specifications */}
            <Section title="Specifications" icon={Wrench} scheme={isDark}>
              <Input label="Color" placeholder="e.g., Pearl White" value={form.color || ''}
                onChangeText={(v: string) => set('color', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Mileage (km/l)" placeholder="e.g., 18.5" value={form.mileage ? String(form.mileage) : ''}
                keyboardType="decimal-pad" onChangeText={(v: string) => set('mileage', parseFloat(v) || undefined)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Odometer (km)" placeholder="e.g., 42000" value={form.odometerReading ? String(form.odometerReading) : ''}
                keyboardType="number-pad" onChangeText={(v: string) => set('odometerReading', parseInt(v) || undefined)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Tank Capacity (L)" placeholder="e.g., 40" value={form.fuelTankCapacity ? String(form.fuelTankCapacity) : ''}
                keyboardType="decimal-pad" onChangeText={(v: string) => set('fuelTankCapacity', parseFloat(v) || undefined)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="VIN" placeholder="Vehicle Identification Number" value={form.vin || ''}
                onChangeText={(v: string) => set('vin', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Engine Number" placeholder="" value={form.engineNumber || ''}
                onChangeText={(v: string) => set('engineNumber', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
              <Input label="Chassis Number" placeholder="" value={form.chassisNumber || ''}
                onChangeText={(v: string) => set('chassisNumber', v)} bg={fieldBg} border={fieldBorder} isDark={isDark} />
            </Section>

            {/* Notes */}
            <Section title="Notes" icon={FileText} scheme={isDark} last>
              <TextInput
                style={[styles.textArea, { backgroundColor: fieldBg, color: isDark ? '#F8FAFC' : '#1E293B', borderColor: fieldBorder }]}
                placeholder="Any additional notes..."
                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                value={form.notes || ''}
                onChangeText={(v: string) => set('notes', v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Section>
          </Animated.View>
        </ScrollView>

        {/* Android global date picker modal (Android shows native modal) */}
        {Platform.OS === 'android' && Object.values(pickerState).some((p) => p.active) && (() => {
          const activeField = (Object.keys(pickerState) as DateFieldKey[]).find((k) => pickerState[k].active);
          return activeField ? (
            <DateTimePicker
              value={pickerState[activeField].tempDate}
              mode="date"
              display="default"
              onChange={(_e, d) => {
                if (d) {
                  onPickerChange(activeField, d);
                  set(activeField, d);
                  setPickerState((prev) => ({ ...prev, [activeField]: { ...prev[activeField], active: false } }));
                }
              }}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2050, 0, 1)}
            />
          ) : null;
        })()}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ─── Sub-Components ─── */

function Section({ title, icon: Icon, children, scheme: isDark, last }: {
  title: string; icon: React.ComponentType<{ size: number; color: string }>;
  children: React.ReactNode; scheme: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.section, { marginBottom: last ? 12 : 16 }]}>
      <View style={styles.sectionHeader}>
        <Icon size={18} color={isDark ? '#A78BFA' : '#7C3AED'} />
        <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Input({ label, placeholder, value, onChangeText, keyboardType, bg, border, isDark }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; bg: string; border: string; isDark: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>{label}</Text>
      <TextInput
        style={[styles.field, { backgroundColor: bg, color: isDark ? '#F8FAFC' : '#1E293B', borderColor: border }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function DateField({
  label, value, optional, onClear, bg, border, isDark,
  pickerActive, pickerDate, onOpen, onPickerChange, onDone, onCancel,
}: {
  label: string; value?: Date; optional?: boolean; onClear: () => void;
  bg: string; border: string; isDark: boolean;
  pickerActive: boolean; pickerDate: Date;
  onOpen: () => void; onPickerChange: (d: Date) => void; onDone: () => void; onCancel: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>{label}{optional ? ' (Optional)' : ''}</Text>
        {value && (
          <TouchableOpacity onPress={onClear}><Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text></TouchableOpacity>
        )}
      </View>
      <View style={[styles.fieldContainer, {
        backgroundColor: bg, borderColor: border,
        borderBottomLeftRadius: pickerActive ? 0 : 16,
        borderBottomRightRadius: pickerActive ? 0 : 16,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        borderBottomWidth: pickerActive ? 0 : 1,
        overflow: 'hidden',
      }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
          onPress={onOpen}
        >
          <Text style={{ color: value ? (isDark ? '#F8FAFC' : '#1E293B') : (isDark ? '#64748B' : '#9CA3AF'), fontSize: 15 }}>
            {value ? value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tap to set date'}
          </Text>
          <Calendar size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
        </TouchableOpacity>
        {/* Inline inline picker below the field — iOS only */}
        {Platform.OS === 'ios' && pickerActive && (
          <>
            <DateTimePicker
              value={value || pickerDate}
              mode="date"
              display="spinner"
              onChange={(_evt, d) => { if (d) onPickerChange(d); }}
              style={{ height: 180 }}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2050, 0, 1)}
              themeVariant={isDark ? 'dark' : 'light'}
            />
            <View style={[styles.pickerActions, { borderTopColor: border }]}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }} onPress={onCancel}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#EF4444' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }} onPress={onDone}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#000' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function ChipRow({ values, selected, onSelect, labels }: {
  values: string[]; selected?: string; onSelect: (v: string) => void; labels: Record<string, string>;
}) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map((v) => (
        <TouchableOpacity
          key={v}
          style={[styles.chip, {
            backgroundColor: selected === v ? '#F59E0B' : isDark ? '#2C2C2E' : '#F2F2F7',
            borderColor: selected === v ? '#F59E0B' : isDark ? '#3A3A3C' : '#E5E5EA',
          }]}
          onPress={() => { Haptics.selectionAsync(); onSelect(v); }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: selected === v ? '#000' : isDark ? '#A1A1AA' : '#6B7280' }}>
            {labels[v as keyof typeof labels] || v}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { padding: 10, borderRadius: 14 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#000' },

  previewWrap: { paddingHorizontal: 16, marginBottom: 16 },
  section: { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  subLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15 },
  fieldContainer: { borderWidth: 1, borderColor: 'transparent' },
  textArea: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15, minHeight: 90 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
  pickerActions: { flexDirection: 'row', borderTopWidth: 0.5 },
});
