/**
 * Add/Edit Appliance Screen
 */

import React, { useEffect, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, getApplianceCategoryColor } from '@/theme/color';
import {
  ChevronLeft,
  Save,
  CheckCircle,
  Utensils,
  Armchair,
  Bed,
  Bath,
  Home,
  Camera,
  X,
  Tag,
  MapPin,
} from 'lucide-react-native';
import { firebaseService } from '@/src/services/FirebaseService';
import type { Appliance } from '@/src/types';
import { useApplianceData } from '@/src/hooks/useApplianceData';

type ApplianceCategory = 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'other';
type LocationOption = 'pune' | 'nashik' | 'other';

const CATEGORIES: { key: ApplianceCategory; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'kitchen', label: 'Kitchen', Icon: Utensils },
  { key: 'living', label: 'Living', Icon: Armchair },
  { key: 'bedroom', label: 'Bedroom', Icon: Bed },
  { key: 'bathroom', label: 'Bathroom', Icon: Bath },
  { key: 'other', label: 'Other', Icon: Home },
];

const LOCATIONS: { key: LocationOption; label: string }[] = [
  { key: 'pune', label: 'Pune' },
  { key: 'nashik', label: 'Nashik' },
  { key: 'other', label: 'Other' },
];

export default function AddApplianceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string;
  const existingApplianceId = params.applianceId as string;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { appliances, loading: loadingData } = useApplianceData(user?.uid);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState<ApplianceCategory>('kitchen');
  const [location, setLocation] = useState<LocationOption>('pune');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | null>(null);
  const [amcExpiry, setAmcExpiry] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Date picker state
  const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const isEdit = mode === 'edit';

  // Load existing appliance data
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isEdit && existingApplianceId && appliances.length > 0) {
      const existing = appliances.find((a) => a.id === existingApplianceId);
      if (existing) {
        setName(existing.name || '');
        setBrand(existing.brand || '');
        setModel(existing.model || '');
        setModelNumber(existing.modelNumber || '');
        setSerialNumber(existing.serialNumber || '');
        setCategory(existing.category || 'kitchen');
        setLocation(existing.location || 'pune');
        setPurchaseDate(existing.purchaseDate instanceof Date ? existing.purchaseDate : new Date(existing.purchaseDate));
        setPurchasePrice(String(existing.purchasePrice || ''));
        setCurrentValue(String(existing.currentValue || ''));
        setWarrantyExpiry(existing.warrantyExpiry ? (existing.warrantyExpiry instanceof Date ? existing.warrantyExpiry : new Date(existing.warrantyExpiry)) : null);
        setAmcExpiry(existing.amcExpiry ? (existing.amcExpiry instanceof Date ? existing.amcExpiry : new Date(existing.amcExpiry)) : null);
        setNotes(existing.notes || '');
        setImages(existing.images || []);
      }
    }
  }, [isEdit, existingApplianceId, appliances]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerTarget(null);
    }
    if (selectedDate) {
      if (datePickerTarget === 'purchase') setPurchaseDate(selectedDate);
      else if (datePickerTarget === 'warranty') setWarrantyExpiry(selectedDate);
      else if (datePickerTarget === 'amc') setAmcExpiry(selectedDate);
      else setTempDate(selectedDate);
    }
  };

  const validate = (): boolean => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter appliance name'); return false; }
    if (!brand.trim()) { Alert.alert('Required', 'Please enter brand'); return false; }
    if (!model.trim()) { Alert.alert('Required', 'Please enter model'); return false; }
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) { Alert.alert('Required', 'Please enter a valid purchase price'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data: any = {
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      category,
      location,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice),
    };

    // Preserve isActive state in edit mode, set to true for new
    if (!isEdit) {
      data.isActive = true;
    }

    if (modelNumber) data.modelNumber = modelNumber.trim();
    if (serialNumber) data.serialNumber = serialNumber.trim();
    if (currentValue) data.currentValue = parseFloat(currentValue);
    if (warrantyExpiry) data.warrantyExpiry = warrantyExpiry;
    if (amcExpiry) data.amcExpiry = amcExpiry;
    if (notes.trim()) data.notes = notes.trim();
    data.images = images;

    try {
      if (isEdit && existingApplianceId) {
        await firebaseService.updateAppliance(existingApplianceId, data, location);
      } else {
        await firebaseService.addAppliance(user?.uid || '', data);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save appliance');
    }
  };

  const DateField = ({ label, date, target }: { label: string; date: Date | null; target: string }) => (
    <TouchableOpacity
      style={[styles.dateField, { backgroundColor: scheme.cardBackground }]}
      onPress={() => {
        setTempDate(date || new Date());
        setDatePickerTarget(target);
      }}
    >
      <Text style={[styles.dateFieldLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.dateFieldValue, { color: date ? scheme.textPrimary : scheme.textTertiary }]}>
        {date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
            {isEdit ? 'Edit Appliance' : 'Add Appliance'}
          </Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Save size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Category Selection */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, {
                    backgroundColor: category === cat.key ? getApplianceCategoryColor(cat.key) : (isDark ? 'rgba(28,28,30,0.8)' : '#FFF'),
                    borderColor: category === cat.key ? getApplianceCategoryColor(cat.key) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  }]}
                  onPress={() => setCategory(cat.key)}
                >
                  <cat.Icon size={16} color={category === cat.key ? '#FFF' : scheme.textTertiary} />
                  <Text style={[styles.chipText, { color: category === cat.key ? '#FFF' : scheme.textTertiary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Location</Text>
            <View style={styles.locationRow}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.key}
                  style={[styles.locationChip, {
                    backgroundColor: location === loc.key ? '#7C3AED' : (isDark ? 'rgba(28,28,30,0.8)' : '#FFF'),
                    borderColor: location === loc.key ? '#7C3AED' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  }]}
                  onPress={() => setLocation(loc.key)}
                >
                  <Text style={[styles.chipText, { color: location === loc.key ? '#FFF' : scheme.textTertiary }]}>
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Basic Info */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Basic Information</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <FieldInput label="Name" value={name} onChange={setName} placeholder="e.g. Refrigerator" required />
              <Divider />
              <FieldInput label="Brand" value={brand} onChange={setBrand} placeholder="e.g. Samsung" required />
              <Divider />
              <FieldInput label="Model" value={model} onChange={setModel} placeholder="e.g. RF28R7341SG" required />
              <Divider />
              <FieldInput label="Model Number" value={modelNumber} onChange={setModelNumber} placeholder="Optional" />
              <Divider />
              <FieldInput label="Serial Number" value={serialNumber} onChange={setSerialNumber} placeholder="Optional" />
            </View>

            {/* Purchase */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Purchase Details</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <FieldInput label="Purchase Price (₹)" value={purchasePrice} onChange={setPurchasePrice} placeholder="e.g. 45000" keyboardType="numeric" required />
              <Divider />
              <FieldInput label="Current Value (₹)" value={currentValue} onChange={setCurrentValue} placeholder="Optional" keyboardType="numeric" />
              <Divider />
              <DateField label="Purchase Date" date={purchaseDate} target="purchase" />
            </View>

            {/* Warranty & AMC */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Warranty & AMC</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <DateField label="Warranty Expiry" date={warrantyExpiry} target="warranty" />
              <Divider />
              <DateField label="AMC Expiry" date={amcExpiry} target="amc" />
            </View>

            {/* Photos */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Photos</Text>
            <View style={styles.photosRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => removeImage(i)}>
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.photoAdd, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#F5F5F7' }]} onPress={pickImage}>
                <Camera size={24} color={scheme.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Notes</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <TextInput
                style={[styles.textArea, { color: scheme.textPrimary }]}
                placeholder="Any additional notes..."
                placeholderTextColor={scheme.textTertiary}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Date Picker */}
      {datePickerTarget && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

function FieldInput({ label, value, onChange, placeholder, keyboardType, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric'; required?: boolean;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={{ paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {required && <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}> * </Text>}
        <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

function Divider() {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 16, paddingHorizontal: 4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  locationRow: { flexDirection: 'row', gap: 8 },
  locationChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  card: { borderRadius: 16, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  textArea: { minHeight: 80, borderRadius: 12, padding: 14, fontSize: 15, textAlignVertical: 'top' },
  dateField: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 },
  dateFieldLabel: { fontSize: 14, fontWeight: '500' },
  dateFieldValue: { fontSize: 14, fontWeight: '600' },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  photoAdd: { width: 80, height: 80, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
});
