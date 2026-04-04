/**
 * AddConsumerModal — modal to create new property tax index
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Building2, MapPin, User, Phone, Mail, X, Plus, CheckCircle } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';

function FormInput({ label, value, onChangeText, placeholder, keyboardType, icon }: any) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon}
        <TextInput
          style={[styles.input, { color: scheme.textPrimary, backgroundColor: isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB', borderColor: scheme.border }]}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={scheme.textTertiary} keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

function AddConsumerModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [taxIndexNumber, setTaxIndexNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [taxCity, setTaxCity] = useState('pune');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!taxIndexNumber || !ownerName || !location || !area || !registeredMobile) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setSaving(true);
    try {
      await firebaseService.addPropertyTaxConsumer({
        taxIndexNumber, ownerName, location, area, registeredMobile, taxCity,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: Math.max(0, 0), backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}>
      <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Add Tax Index</Text>
            <Text style={[styles.modalSub, { color: scheme.textTertiary }]}>Register a new property</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><X size={20} color={scheme.textSecondary} /></TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" style={styles.scroll}>
          {/* City selector */}
          <Text style={[styles.fieldLabel, { color: scheme.textTertiary }]}>City</Text>
          <View style={styles.chipRow}>
            {[{ label: 'Pune', value: 'pune' }, { label: 'Nashik', value: 'nashik' }, { label: 'Jalgaon', value: 'jalgaon' }].map(c => (
              <TouchableOpacity key={c.value} style={[styles.chip, {
                backgroundColor: taxCity === c.value ? '#7C3AED' : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6'),
                borderWidth: 0.5, borderColor: scheme.border,
              }]} onPress={() => { setTaxCity(c.value); Haptics.selectionAsync(); }}>
                <Text style={[styles.chipText, { color: taxCity === c.value ? '#FFF' : scheme.textSecondary }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormInput label="Tax Index Number" icon={<Building2 size={16} color={Colors.primary} style={{ marginRight: 8 }} />} value={taxIndexNumber} onChangeText={setTaxIndexNumber} placeholder="Enter index number" />
          <FormInput label="Owner Name" icon={<User size={16} color={Colors.primary} style={{ marginRight: 8 }} />} value={ownerName} onChangeText={setOwnerName} placeholder="Full name" />
          <FormInput label="Location" icon={<MapPin size={16} color={Colors.primary} style={{ marginRight: 8 }} />} value={location} onChangeText={setLocation} placeholder="City/Area" />
          <FormInput label="Area" icon={<Mail size={16} color={Colors.primary} style={{ marginRight: 8 }} />} value={area} onChangeText={setArea} placeholder="Locality/ward" />
          <FormInput label="Registered Mobile" icon={<Phone size={16} color={Colors.primary} style={{ marginRight: 8 }} />} value={registeredMobile} onChangeText={setRegisteredMobile} placeholder="Phone number" keyboardType="phone-pad" />

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Plus size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Create Tax Index</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalContent: { width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, maxHeight: '90%', paddingBottom: Spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700' },
  modalSub: { fontSize: Typography.fontSize.xs, marginTop: 4 },
  closeBtn: { padding: 6 },
  scroll: { paddingHorizontal: Spacing.xl },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: Spacing.xs },
  input: { flex: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.fontSize.sm, borderWidth: 1, minHeight: 44 },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.pill, minHeight: 34 },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md, paddingVertical: Spacing.md + 2, minHeight: 52, gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.lg },
  submitBtnText: { color: '#FFFFFF', fontSize: Typography.fontSize.lg, fontWeight: '700' },
});

export default AddConsumerModal;
