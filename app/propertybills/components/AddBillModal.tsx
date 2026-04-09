/**
 * AddBillModal — Add/Edit property tax bill modal
 * Premium iOS sheet with improved visual hierarchy
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  X, Plus, CheckCircle, Clock, CalendarDays,
  FileCheck, Camera as CameraIcon,
  Image as ImageIcon, IndianRupee,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService, PropertyTaxBillEntry } from '@/src/services/FirebaseService';

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  Paid: { color: '#10B981', icon: CheckCircle, label: 'Paid' },
  Pending: { color: '#F59E0B', icon: Clock, label: 'Pending' },
};

const PAYMENT_MODES = ['Cash', 'Bank', 'UPI'];

function AddBillModal({
  onClose, onSave, bill, city, taxIndexNumber
}: {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onDismissed: () => void;
  bill?: PropertyTaxBillEntry | null;
  city: string;
  taxIndexNumber: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const insets = useSafeAreaInsets();

  const [billYear, setBillYear] = useState(bill?.billYear || String(new Date().getFullYear()));
  const [taxBillAmount, setTaxBillAmount] = useState(bill?.taxBillAmount || '');
  const [payStatus, setPayStatus] = useState(bill?.payStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState(bill?.paymentMode || 'Cash');
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (bill?.lastDateToPay) {
      const d = new Date(bill.lastDateToPay);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  });
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const slideY = useRef(new Animated.Value(600)).current;
  const bg = isDark ? '#1C1C1E' : '#FFFFFF';

  useEffect(() => {
    if (bill) {
      setBillYear(bill.billYear);
      setTaxBillAmount(bill.taxBillAmount);
      setPayStatus(bill.payStatus);
      setPaymentMode(bill.paymentMode);
      if (bill.lastDateToPay) {
        const d = new Date(bill.lastDateToPay);
        setDueDate(isNaN(d.getTime()) ? new Date() : d);
      } else {
        setDueDate(new Date());
      }
    } else {
      setBillYear(String(new Date().getFullYear()));
      setTaxBillAmount('');
      setPayStatus('Pending');
      setPaymentMode('Cash');
      setDueDate(new Date());
      setFileUri(null);
    }
  }, [bill]);

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0,
      damping: 22,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!taxBillAmount.trim() || !billYear.trim()) {
      Alert.alert('Missing Fields', 'Please fill in bill year and amount');
      return;
    }
    if (!city || !taxIndexNumber) {
      Alert.alert('Error', 'Please select a city and tax index first.');
      return;
    }
    setUploading(true);
    try {
      const data = {
        billYear: billYear.trim(),
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
      Alert.alert('Error', e.message || 'Failed to save bill');
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
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setFileUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClose = () => {
    Animated.timing(slideY, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const formatDate = (d: Date) => {
    if (isNaN(d.getTime())) return 'Not set';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: bg,
              transform: [{ translateY: slideY }],
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#3A3A3C' : '#D1D5DB' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${Colors.primary}12` }]}>
                <FileCheck size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
                  {bill ? 'Edit Bill' : 'Add Bill'}
                </Text>
                <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>
                  {bill ? 'Update tax bill details' : 'Record a new property tax payment'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]} onPress={handleClose}>
              <X size={18} color={scheme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section: Bill Details */}
            <Text style={[styles.sectionLabel, { color: isDark ? '#6E6E71' : '#64748B' }]}>Bill Details</Text>

            <View style={[styles.inputCard, { backgroundColor: isDark ? 'rgba(44,44,46,0.4)' : '#F9FAFB', borderColor: scheme.border }]}>
              {/* Financial Year */}
              <View style={styles.inputRow}>
                <View style={styles.inputLabelRow}>
                  <CalendarDays size={14} color={scheme.textTertiary} />
                  <Text style={[styles.inputLabelText, { color: scheme.textTertiary }]}>Financial Year</Text>
                </View>
                <TextInput
                  style={[styles.textInput, { color: scheme.textPrimary }]}
                  value={billYear}
                  onChangeText={setBillYear}
                  placeholder="e.g. 2026"
                  placeholderTextColor={scheme.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

              {/* Tax Amount */}
              <View style={[styles.inputRow, { paddingBottom: 2 }]}>
                <View style={styles.inputLabelRow}>
                  <IndianRupee size={14} color={scheme.textTertiary} />
                  <Text style={[styles.inputLabelText, { color: scheme.textTertiary }]}>Tax Amount</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.amountInput, { color: scheme.textPrimary }]}
                  value={taxBillAmount}
                  onChangeText={setTaxBillAmount}
                  placeholder="0"
                  placeholderTextColor={scheme.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Section: Payment Info */}
            <Text style={[styles.sectionLabel, { color: isDark ? '#6E6E71' : '#64748B' }]}>Payment Info</Text>

            {/* Due Date — tap to open, avoids inline DateTimePicker blocking */}
            <TouchableOpacity
              style={[styles.inputCard, { backgroundColor: isDark ? 'rgba(44,44,46,0.4)' : '#F9FAFB', borderColor: scheme.border }]}
              onPress={() => { setShowDatePicker(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.6}
            >
              <View style={[styles.inputRow, { paddingBottom: 0 }]}>
                <View style={styles.inputLabelRow}>
                  <Clock size={14} color={scheme.textTertiary} />
                  <Text style={[styles.inputLabelText, { color: scheme.textTertiary }]}>Due Date</Text>
                </View>
                <View style={[styles.dateBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)' }]}>
                  <Text style={[styles.dateBadgeText, { color: Colors.primary }]}>{formatDate(dueDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* iOS-style inline date picker (shown when open) */}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={[styles.pickerSheet, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
                <View style={[styles.pickerHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={{ fontSize: 16, color: Colors.primary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: scheme.textPrimary }}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={{ fontSize: 16, color: Colors.primary, fontWeight: '700' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => d && setDueDate(d)}
                  textColor={isDark ? '#F8FAFC' : '#1E293B'}
                  style={{ alignSelf: 'center' }}
                />
              </View>
            )}

            {showDatePicker && Platform.OS !== 'ios' && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={(evt, d) => { d && setDueDate(d); setShowDatePicker(false); }}
                textColor={isDark ? '#F8FAFC' : '#1E293B'}
              />
            )}

            {/* Payment Status */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Status</Text>
            <View style={styles.chipRow}>
              {['Paid', 'Pending'].map(s => {
                const isSelected = payStatus === s;
                const cfg = STATUS_CONFIG[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, {
                      backgroundColor: isSelected ? cfg.color : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6'),
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: isSelected ? 'transparent' : scheme.border,
                    }]}
                    onPress={() => { setPayStatus(s); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    {React.createElement(cfg.icon, {
                      size: 13,
                      color: isSelected ? '#FFF' : scheme.textSecondary,
                    })}
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : scheme.textSecondary }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Mode */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Payment Mode</Text>
            <View style={styles.chipRow}>
              {PAYMENT_MODES.map((m) => {
                const isSelected = paymentMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, {
                      backgroundColor: isSelected ? `${Colors.primary}18` : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6'),
                      borderColor: isSelected ? `${Colors.primary}50` : 'transparent',
                      borderWidth: 1,
                    }]}
                    onPress={() => { setPaymentMode(m); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.modeChipText, { color: isSelected ? Colors.primary : scheme.textSecondary, fontWeight: isSelected ? '700' : '500' }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Document Upload */}
            <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>Document</Text>
            <View style={styles.uploadArea}>
              <TouchableOpacity
                style={[styles.uploadBtn, {
                  borderColor: scheme.border,
                  backgroundColor: isDark ? 'rgba(44,44,46,0.4)' : '#F9FAFB',
                  borderStyle: fileUri ? 'solid' : 'dashed',
                }]}
                onPress={takePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: `${Colors.primary}10` }]}>
                  <CameraIcon size={18} color={Colors.primary} />
                </View>
                <Text style={[styles.uploadLabel, { color: fileUri ? '#10B981' : Colors.primary }]}>
                  {fileUri ? 'Photo Added' : 'Camera'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, {
                  borderColor: scheme.border,
                  backgroundColor: isDark ? 'rgba(44,44,46,0.4)' : '#F9FAFB',
                  borderStyle: fileUri ? 'solid' : 'dashed',
                }]}
                onPress={pickFile}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: `${Colors.primary}10` }]}>
                  <ImageIcon size={18} color={Colors.primary} />
                </View>
                <Text style={[styles.uploadLabel, { color: fileUri ? scheme.textPrimary : Colors.primary }]}>
                  {fileUri ? 'Gallery' : 'Gallery'}
                </Text>
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.uploadingText, { color: scheme.textTertiary }]}>
                  Uploading document...
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, {
                backgroundColor: Colors.primary,
                opacity: uploading ? 0.5 : 1,
                marginTop: Spacing.lg,
              }]}
              onPress={handleSubmit}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Plus size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>
                    {bill ? 'Update Bill' : 'Add Bill'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inputLabelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  textInput: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
  },
  amountInput: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xs,
  },
  dateBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  datePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    minHeight: 30,
    justifyContent: 'center',
  },
  datePillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  pickerSheet: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  modeChip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeChipText: {
    fontSize: Typography.fontSize.sm,
  },
  uploadArea: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    borderWidth: 1.5,
  },
  uploadIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  uploadingText: {
    fontSize: Typography.fontSize.xs,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    minHeight: 54,
    gap: Spacing.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default AddBillModal;
