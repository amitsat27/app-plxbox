/**
 * Add Service Record Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { ChevronLeft, Save } from 'lucide-react-native';
import { firebaseService } from '@/src/services/FirebaseService';

const SERVICE_TYPES = ['regular', 'repair', 'annual', 'emergency'];

export default function AddServiceRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applianceId = (params.applianceId as string) || '';
  const applianceName = (params.applianceName as string) || 'Appliance';
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [serviceDate, setServiceDate] = useState(new Date());
  const [serviceType, setServiceType] = useState('regular');
  const [serviceCenter, setServiceCenter] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [nextServiceDue, setNextServiceDue] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'service') setServiceDate(selectedDate);
      else if (showDatePicker === 'next') setNextServiceDue(selectedDate);
    }
  };

  const validate = (): boolean => {
    if (!cost || parseFloat(cost) <= 0) {
      Alert.alert('Required', 'Please enter service cost');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await firebaseService.addServiceRecord(applianceId, {
        serviceDate,
        serviceType,
        serviceCenter: serviceCenter.trim() || undefined,
        mechanic: mechanic.trim() || undefined,
        cost: parseFloat(cost),
        description: description.trim() || undefined,
        partsReplaced: partsReplaced.split(',').map((s) => s.trim()).filter(Boolean),
        nextServiceDue: nextServiceDue || undefined,
        createdAt: new Date(),
      } as any);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save service record');
    }
  };

  const DateField = ({ label, date, target }: { label: string; date: Date; target: string }) => (
    <TouchableOpacity
      style={[styles.dateField, { backgroundColor: scheme.cardBackground }]}
      onPress={() => {
        setTempDate(date || new Date());
        setShowDatePicker(target);
      }}
    >
      <Text style={[styles.dateLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: scheme.textPrimary }]}>
        {date?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Add Service Record</Text>
            <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>{applianceName}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
            <Save size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Date */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Date</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <DateField label="Service Date" date={serviceDate} target="service" />
            </View>

            {/* Type */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Service Type</Text>
            <View style={styles.typeRow}>
              {SERVICE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, {
                    backgroundColor: serviceType === type ? '#7C3AED' : (isDark ? 'rgba(28,28,30,0.8)' : '#FFF'),
                    borderColor: serviceType === type ? '#7C3AED' : 'rgba(0,0,0,0.08)',
                  }]}
                  onPress={() => setServiceType(type)}
                >
                  <Text style={[styles.typeText, { color: serviceType === type ? '#FFF' : scheme.textTertiary }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Details */}
            <Text style={[styles.sectionLabel, { color: scheme.textPrimary }]}>Details</Text>
            <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
              <FieldInput label="Service Center" value={serviceCenter} onChange={setServiceCenter} placeholder="e.g. Samsung Care" />
              <Divider />
              <FieldInput label="Mechanic Name" value={mechanic} onChange={setMechanic} placeholder="Optional" />
              <Divider />
              <FieldInput label="Cost (₹)" value={cost} onChange={setCost} placeholder="e.g. 1500" keyboardType="numeric" />
              <Divider />
              <View style={{ paddingVertical: 10 }}>
                <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.textArea, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)' }]}
                  placeholder="What was done..."
                  placeholderTextColor={scheme.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
              <Divider />
              <View style={{ paddingVertical: 10 }}>
                <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>Parts Replaced</Text>
                <TextInput
                  style={[styles.input, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)' }]}
                  placeholder="Comma separated (e.g. Filter, Belt)"
                  placeholderTextColor={scheme.textTertiary}
                  value={partsReplaced}
                  onChangeText={setPartsReplaced}
                />
              </View>
              <Divider />
              <DateField label="Next Service Due" date={nextServiceDue || new Date()} target="next" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {showDatePicker && (
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

function FieldInput({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric';
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={{ paddingVertical: 10 }}>
      <Text style={[styles.fieldLabel, { color: scheme.textSecondary }]}>{label}</Text>
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
  return <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: BorderRadius.md, padding: 14, overflow: 'hidden' },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  textArea: { minHeight: 70, borderRadius: 12, padding: 14, fontSize: 15, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  typeText: { fontSize: 13, fontWeight: '600' },
  dateField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 4 },
  dateLabel: { fontSize: 14, fontWeight: '500' },
  dateValue: { fontSize: 14, fontWeight: '600' },
});
