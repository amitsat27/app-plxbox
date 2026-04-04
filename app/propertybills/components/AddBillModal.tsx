/**
 * AddBillModal — Add/Edit property tax bill modal
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Plus, Upload, Camera, CheckCircle, Clock, Calendar, CreditCard } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService, PropertyTaxBillEntry } from '@/src/services/FirebaseService';

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  Paid: { color: '#10B981', icon: CheckCircle },
  Pending: { color: '#F59E0B', icon: Clock },
};

function AddBillModal({
  onClose, onSave, bill, city, taxIndexNumber
}: {
  onClose: () => void;
  onSave: () => void;
  bill?: PropertyTaxBillEntry | null;
  city: string;
  taxIndexNumber: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [billYear, setBillYear] = useState(bill?.billYear || String(new Date().getFullYear()));
  const [taxBillAmount, setTaxBillAmount] = useState(bill?.taxBillAmount || '');
  const [payStatus, setPayStatus] = useState(bill?.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill?.paymentMode || 'Cash');
  const [dueDate, setDueDate] = useState(bill?.lastDateToPay ? new Date(bill.lastDateToPay) : new Date());
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!taxBillAmount || !billYear) {
      Alert.alert('Missing Fields', 'Please fill in bill year and amount');
      return;
    }
    setUploading(true);
    try {
      const data = {
        billYear,
        taxBillAmount: parseFloat(taxBillAmount.replace(/,/g, '')) || 0,
        lastDateToPay: dueDate.toISOString().split('T')[0],
        payStatus,
        paymentMode,
      };
      if (bill) {
        await firebaseService.updatePropertyTaxBill(city, bill.id, data, fileUri || undefined, bill.billDocumentURL);
      } else {
        await firebaseService.addPropertyTaxBill(city, taxIndexNumber, data, fileUri || undefined);
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
      allowsEditing: false, quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(0, 0), paddingBottom: Spacing.md }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>{bill ? 'Edit Bill' : 'Add Property Tax Bill'}</Text>
          <TouchableOpacity style={{ padding: 8 }} onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.lg }}>
          {/* Year */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Financial Year</Text>
          <TextInput
            style={[styles.fieldInput, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB', borderColor: scheme.border }]}
            value={billYear} onChangeText={setBillYear} placeholder="e.g. 2026"
            placeholderTextColor={scheme.textTertiary} keyboardType="numeric"
          />

          {/* Amount */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Tax Amount (₹)</Text>
          <TextInput
            style={[styles.fieldInput, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB', borderColor: scheme.border }]}
            value={taxBillAmount} onChangeText={setTaxBillAmount} placeholder="0"
            placeholderTextColor={scheme.textTertiary} keyboardType="numeric"
          />

          {/* Due Date */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Due Date</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <Calendar size={16} color={scheme.textTertiary} />
            <DateTimePicker value={dueDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, d) => d && setDueDate(d)} />
          </View>

          {/* Status */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Status</Text>
          <View style={styles.chipRow}>
            {['Paid', 'Pending'].map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: payStatus === s ? STATUS_CONFIG[s].color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPayStatus(s); Haptics.selectionAsync(); }}>
                {React.createElement(STATUS_CONFIG[s].icon, { size: 12, color: payStatus === s ? '#FFF' : scheme.textSecondary })}
                <Text style={[styles.chipText, { color: payStatus === s ? '#FFF' : scheme.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Mode */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Mode</Text>
          <View style={styles.chipRow}>
            {['Cash', 'Bank', 'UPI'].map(m => (
              <TouchableOpacity key={m} style={[styles.chip, { backgroundColor: paymentMode === m ? '#7C3AED' : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6') }]} onPress={() => { setPaymentMode(m); Haptics.selectionAsync(); }}>
                <Text style={[styles.chipText, { color: paymentMode === m ? '#FFF' : scheme.textSecondary }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upload */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Bill Document</Text>
          <View style={styles.row2}>
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6', justifyContent: 'center' }]} onPress={takePhoto}>
              <Camera size={20} color={Colors.primary} />
              <Text style={[styles.uploadText, { color: Colors.primary }]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, borderColor: scheme.border, backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6', justifyContent: 'center' }]} onPress={pickFile}>
              <Upload size={20} color={Colors.primary} />
              <Text style={[styles.uploadText, { color: Colors.primary }]}>{fileUri ? 'Changed' : 'Gallery'}</Text>
            </TouchableOpacity>
          </View>
          {fileUri && <Text style={{ color: '#10B981', fontSize: Typography.fontSize.xs, marginTop: 4, textAlign: 'center' }}>File selected</Text>}

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.primary, opacity: uploading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{bill ? 'Update Bill' : 'Add Bill'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalCard: { width: '100%', height: '85%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  fieldLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  fieldInput: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  row2: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.lg, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  uploadText: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  submitBtn: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitBtnText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});

export default AddBillModal;
