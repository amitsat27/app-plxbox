/** Electric Bill Form Modal */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, KeyboardAvoidingView, TextInput, Alert, Image as RNImage } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Upload, Camera } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService, type ElectricBillEntry, type ElectricBillInput } from '@/src/services/FirebaseService';
import DropdownPicker from './DropdownPicker';
import { MONTHS, YEARS, STATUS_CONFIG } from '@/src/constants/electric-bills/constants';

export const pendingEditBillIdRef = { current: '' as string };

export function markBillForEdit(id: string) {
  pendingEditBillIdRef.current = id;
}

export function BillFormModal({ bill, city, consumerNumber, onClose, onSave }: {
  bill: ElectricBillEntry | null; city: string; consumerNumber?: string;
  onClose: () => void; onSave: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [selectedMonth, setSelectedMonth] = useState(bill?.billMonth ? MONTHS.find(m => bill.billMonth.startsWith(m)) || '' : '');
  const [selectedYear, setSelectedYear] = useState(bill?.billMonth ? (bill.billMonth.match(/\d{4}/)?.[0] || '') : '');
  const [lastReading, setLastReading] = useState(bill?.lastReading ? String(bill.lastReading) : '');
  const [currentReading, setCurrentReading] = useState(bill?.currentReading ? String(bill.currentReading) : '');
  const [totalUnits, setTotalUnits] = useState(bill?.totalUnits ? String(bill.totalUnits) : '');
  const [billAmount, setBillAmount] = useState(bill?.billAmount || '');
  const [payStatus, setPayStatus] = useState(bill?.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill?.paymentMode || 'UPI');
  const [dueDate, setDueDate] = useState(bill?.lastDateToPay || new Date());
  const [fileUri, setFileUri] = useState<string>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const l = parseFloat(lastReading) || 0;
    const c = parseFloat(currentReading) || 0;
    setTotalUnits(String(Math.max(0, c - l)));
  }, [lastReading, currentReading]);

  const handleSubmit = async () => {
    const month = `${selectedMonth} ${selectedYear}`;
    if (!selectedMonth || !selectedYear || !billAmount) return;
    setUploading(true);
    try {
      const data: ElectricBillInput = {
        billMonth: month,
        lastReading: parseFloat(lastReading) || 0,
        currentReading: parseFloat(currentReading) || 0,
        totalUnits: parseFloat(totalUnits) || 0,
        billAmount: parseFloat(billAmount.replace(/,/g, '')) || 0,
        lastDateToPay: dueDate.toISOString().split('T')[0],
        payStatus,
        paymentMode,
      };
      if (bill) {
        await firebaseService.updateElectricBill(city, bill.id, data, fileUri, bill.billDocumentURL);
      } else {
        await firebaseService.addElectricBill(city, consumerNumber || '', data, fileUri);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const pickFile = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, Spacing.xl), paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: scheme.textPrimary }]}>{bill ? 'Edit Bill' : 'Add Electric Bill'}</Text>
            <TouchableOpacity style={{ padding: 8 }} onPress={onClose}>
              <X size={20} color={scheme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: Spacing.lg }}>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <DropdownPicker label="Month" value={selectedMonth} options={MONTHS} onSelect={setSelectedMonth} placeholder="Select" />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <DropdownPicker label="Year" value={selectedYear} options={YEARS} onSelect={setSelectedYear} placeholder="Select" />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: scheme.textTertiary }]}>Last Reading</Text>
                <TextInputField value={lastReading} onChangeText={setLastReading} placeholder="0" />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={[styles.label, { color: scheme.textTertiary }]}>Current Reading</Text>
                <TextInputField value={currentReading} onChangeText={setCurrentReading} placeholder="0" />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: scheme.textTertiary }]}>Total Units</Text>
                <TextInputField value={totalUnits} editable={false} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={[styles.label, { color: scheme.textTertiary }]}>Amount (₹)</Text>
                <TextInputField value={billAmount} onChangeText={setBillAmount} keyboardType="numeric" placeholder="0" />
              </View>
            </View>

            <Text style={[styles.label, { color: scheme.textTertiary }]}>Due Date</Text>
            <DateTimePicker value={dueDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => d && setDueDate(d)} />

            <Text style={[styles.label, { color: scheme.textTertiary }]}>Payment Status</Text>
            <View style={styles.chipRow}>
              {['Paid', 'Pending'].map(s => (
                <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: payStatus === s ? STATUS_CONFIG[s].color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPayStatus(s); Haptics.selectionAsync(); }}>
                  <Text style={[styles.chipText, { color: payStatus === s ? '#FFF' : scheme.textSecondary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: scheme.textTertiary }]}>Payment Mode</Text>
            <View style={styles.chipRow}>
              {['Cash', 'Bank', 'UPI'].map(m => (
                <TouchableOpacity key={m} style={[styles.chip, { backgroundColor: paymentMode === m ? '#7C3AED' : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPaymentMode(m); Haptics.selectionAsync(); }}>
                  <Text style={[styles.chipText, { color: paymentMode === m ? '#FFF' : scheme.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: scheme.textTertiary }]}>Bill Document</Text>
            <View style={styles.row2}>
              <TouchableOpacity style={[styles.uploadBtn, { borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={takePhoto}>
                <Camera size={20} color={Colors.primary} />
                <Text style={[styles.uploadText, { color: Colors.primary }]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, { borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={pickFile}>
                <Upload size={20} color={Colors.primary} />
                <Text style={[styles.uploadText, { color: Colors.primary }]}>{fileUri ? 'Changed' : 'Gallery'}</Text>
              </TouchableOpacity>
            </View>
            {fileUri && <Text style={{ color: '#10B981', fontSize: Typography.fontSize.xs, marginTop: 4, textAlign: 'center' }}>File selected</Text>}
          </ScrollView>

          <TouchableOpacity style={[styles.submit, { backgroundColor: Colors.primary, opacity: uploading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{bill ? 'Update Bill' : 'Add Bill'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BillFormModalExport = BillFormModal;
export default BillFormModalExport;

function TextInputField({ value, onChangeText, keyboardType, placeholder, editable = true }: any) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <TextInput style={[styles.input, { backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6', color: scheme.textPrimary, borderColor: scheme.border, opacity: editable ? 1 : 0.6 }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={scheme.textTertiary} editable={editable} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: { width: '100%', height: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  label: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  input: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1, marginBottom: Spacing.md },
  row2: { flexDirection: 'row', alignItems: 'flex-start' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.lg, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  uploadText: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  submit: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});
