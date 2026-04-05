/**
 * Add Vehicle Screen — sectioned form with premium UI
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Alert, ActivityIndicator,
  KeyboardAvoidingView, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X as CloseIcon } from 'lucide-react-native';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseService } from '@/src/services/FirebaseService';
import type { VehicleFormValues, VehicleType, FuelType } from '@/src/types';

const VEHICLE_TYPES: VehicleType[] = ['car', 'bike', 'truck', 'other'];
const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
const TYPE_LABELS: Record<VehicleType, string> = { car: 'Car', bike: 'Motorcycle', truck: 'Truck', other: 'Other' };
const FUEL_LABELS: Record<FuelType, string> = { petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid', cng: 'CNG', lpg: 'LPG' };

export default function AddEditVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, []);

  const [form, setForm] = useState<Partial<VehicleFormValues>>({
    name: '', type: 'car', make: '', model: '',
    year: new Date().getFullYear(), registrationNumber: '',
    registrationExpiry: new Date(2030, 0, 1),
    insuranceExpiry: new Date(2030, 0, 1), pucExpiry: undefined,
    fuelType: 'petrol', mileage: undefined, odometerReading: undefined,
    fuelTankCapacity: undefined, color: '', vin: '',
    engineNumber: '', chassisNumber: '', location: 'pune', notes: '',
    purchasePrice: undefined, currentValue: undefined,
    purchaseDate: new Date(), images: [],
  });

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user?.uid || !form.name || !form.registrationNumber) {
      Alert.alert('Required', 'Name and registration number are mandatory');
      return;
    }
    try {
      setSaving(true);
      await firebaseService.addVehicle(user.uid, form as any);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const fieldBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const fieldBorder = isDark ? '#3A3A3C' : '#E5E5EA';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: scheme.background }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => router.back()}>
            <CloseIcon size={20} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Add Vehicle</Text>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.warning }, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Basic Info */}
            <Section title="Basic Info" emoji="🚗" scheme={scheme}>
              <Input label="Name" placeholder="e.g., My Honda City" value={form.name || ''} onChangeText={(v: string) => set('name', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Registration Number" placeholder="MH14AB1234" value={form.registrationNumber || ''} onChangeText={(v: string) => set('registrationNumber', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Make" placeholder="e.g., Honda" value={form.make || ''} onChangeText={(v: string) => set('make', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Model" placeholder="e.g., City ZX" value={form.model || ''} onChangeText={(v: string) => set('model', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Year" placeholder="2024" value={form.year ? String(form.year) : '2024'} keyboardType="number-pad" onChangeText={(v: string) => set('year', parseInt(v) || 2024)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
            </Section>

            {/* Type & Fuel */}
            <Section title="Type & Fuel" emoji="⛽" scheme={scheme}>
              <Text style={[styles.subLabel, { color: scheme.textTertiary }]}>Vehicle Type</Text>
              <ChipRow values={VEHICLE_TYPES} selected={form.type || 'car'} onSelect={(v: string) => set('type', v)} labels={TYPE_LABELS} />
              <Text style={[styles.subLabel, { color: scheme.textTertiary, marginTop: 12 }]}>Fuel Type</Text>
              <ChipRow values={FUEL_TYPES} selected={form.fuelType || 'petrol'} onSelect={(v: string) => set('fuelType', v)} labels={FUEL_LABELS} />
            </Section>

            {/* Compliance Dates */}
            <Section title="Compliance Dates" emoji="📋" scheme={scheme}>
              <DateField label="Insurance Expiry" value={form.insuranceExpiry} onClear={() => set('insuranceExpiry', undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <DateField label="Registration Expiry" value={form.registrationExpiry} onClear={() => set('registrationExpiry', undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <DateField label="PUC Expiry" value={form.pucExpiry} optional onClear={() => set('pucExpiry', undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
            </Section>

            {/* Specifications */}
            <Section title="Specifications" emoji="🔧" scheme={scheme}>
              <Input label="Color" placeholder="e.g., Pearl White" value={form.color || ''} onChangeText={(v: string) => set('color', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Mileage (km/l)" placeholder="e.g., 18.5" value={form.mileage ? String(form.mileage) : ''} keyboardType="decimal-pad" onChangeText={(v: string) => set('mileage', parseFloat(v) || undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Odometer (km)" placeholder="e.g., 42000" value={form.odometerReading ? String(form.odometerReading) : ''} keyboardType="number-pad" onChangeText={(v: string) => set('odometerReading', parseInt(v) || undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Tank Capacity (L)" placeholder="e.g., 40" value={form.fuelTankCapacity ? String(form.fuelTankCapacity) : ''} keyboardType="decimal-pad" onChangeText={(v: string) => set('fuelTankCapacity', parseFloat(v) || undefined)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="VIN" placeholder="Vehicle Identification Number" value={form.vin || ''} onChangeText={(v: string) => set('vin', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Engine Number" placeholder="" value={form.engineNumber || ''} onChangeText={(v: string) => set('engineNumber', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
              <Input label="Chassis Number" placeholder="" value={form.chassisNumber || ''} onChangeText={(v: string) => set('chassisNumber', v)} bg={fieldBg} border={fieldBorder} scheme={scheme} />
            </Section>

            {/* Notes */}
            <Section title="Notes" emoji="📝" scheme={scheme} last>
              <TextInput
                style={[styles.textArea, { backgroundColor: fieldBg, color: scheme.textPrimary, borderColor: fieldBorder }]}
                placeholder="Any additional notes..."
                placeholderTextColor={scheme.textTertiary}
                value={form.notes || ''}
                onChangeText={(v: string) => set('notes', v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Section>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Sub-Components ─── */

function Section({ title, emoji, children, scheme, last }: { title: string; emoji: string; children: React.ReactNode; scheme: ReturnType<typeof getColorScheme>; last?: boolean }) {
  return (
    <View style={[styles.section, { marginBottom: last ? 12 : 16 }]}>
      <View style={styles.sectionHeader}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
        <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Input({ label, placeholder, value, onChangeText, keyboardType, bg, border, scheme }: { label: string; placeholder: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; bg: string; border: string; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.field, { backgroundColor: bg, color: scheme.textPrimary, borderColor: border }]}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function DateField({ label, value, optional, onClear, bg, border, scheme }: { label: string; value?: Date; optional?: boolean; onClear: () => void; bg: string; border: string; scheme: ReturnType<typeof getColorScheme> }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>{label}{optional ? ' (Optional)' : ''}</Text>
        {value && (
          <TouchableOpacity onPress={onClear}><Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text></TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.field, { backgroundColor: bg, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        onPress={() => Alert.alert('Coming Soon', 'Date picker coming in next update')}
      >
        <Text style={{ color: value ? scheme.textPrimary : scheme.textTertiary, fontSize: 15 }}>
          {value ? value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tap to set date'}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>
    </View>
  );
}

function ChipRow({ values, selected, onSelect, labels }: { values: string[]; selected?: string; onSelect: (v: string) => void; labels: Record<string, string> }) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map((v) => (
        <TouchableOpacity
          key={v}
          style={[styles.chip, {
            backgroundColor: selected === v ? Colors.warning : isDark ? '#2C2C2E' : '#F2F2F7',
            borderColor: selected === v ? Colors.warning : isDark ? '#3A3A3C' : '#E5E5EA',
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

  section: { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  subLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15, minHeight: 90 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
});
