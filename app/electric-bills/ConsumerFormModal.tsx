/** Electric Bill Consumer Form Modal */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, MapPin } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';
import DropdownPicker from './DropdownPicker';
import { CITIES } from './constants';

export function ConsumerFormModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [form, setForm] = useState({
    consumerNumber: '',
    location: '',
    billingUnitNumber: '',
    holderName: '',
    area: '',
    registeredMobile: '',
    consumerCity: '',
  });

  const handleCreate = async () => {
    if (!form.consumerNumber || !form.consumerCity) return;
    try {
      await firebaseService.addConsumer(form as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCreated();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: 'consumerNumber', label: 'Consumer Number' },
    { key: 'location', label: 'Location' },
    { key: 'billingUnitNumber', label: 'Billing Unit Number' },
    { key: 'holderName', label: 'Holder Name' },
    { key: 'area', label: 'Area' },
    { key: 'registeredMobile', label: 'Registered Mobile' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: scheme.textPrimary }]}>New Consumer</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={scheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {fields.map(f => (
            <View key={f.key} style={styles.field}>
              <Text style={[styles.label, { color: scheme.textTertiary }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6', color: scheme.textPrimary, borderColor: scheme.border }]}
                value={form[f.key]}
                onChangeText={t => setForm(prev => ({ ...prev, [f.key]: t }))}
                placeholder={f.label}
                placeholderTextColor={scheme.textTertiary}
              />
            </View>
          ))}

          <DropdownPicker
            label="City"
            value={form.consumerCity.length > 0 ? form.consumerCity.charAt(0).toUpperCase() + form.consumerCity.slice(1) : ''}
            options={CITIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
            onSelect={v => setForm(f => ({ ...f, consumerCity: v.toLowerCase() }))}
            placeholder="Select City"
            icon={<MapPin size={16} color={form.consumerCity ? Colors.primary : scheme.textTertiary} />}
          />
        </ScrollView>

        <TouchableOpacity style={[styles.submit, { backgroundColor: Colors.primary }]} onPress={handleCreate}>
          <Text style={styles.submitText}>Create Consumer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  card: { width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  field: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  input: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1 },
  submit: { borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, justifyContent: 'center', alignItems: 'center', minHeight: 52, marginTop: Spacing.md },
  submitText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});
