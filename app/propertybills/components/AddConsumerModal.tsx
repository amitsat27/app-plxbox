/**
 * AddConsumerModal — modal to create new property tax index
 * Premium iOS sheet with grouped, visually clean form
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Building2, MapPin, User, Phone, Mail, X, Plus, CheckCircle } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { firebaseService } from '@/src/services/FirebaseService';

function FormInput({ label, value, onChangeText, placeholder, keyboardType, icon }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: any; icon: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputCard, {
      backgroundColor: isDark ? 'rgba(44,44,46,0.4)' : '#F9FAFB',
      borderColor: focused ? Colors.primary + '40' : scheme.border,
      borderWidth: focused ? 1.5 : 1,
    }]}>
      <Text style={[styles.inputLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <View style={styles.inputRow}>
        <View style={[styles.inputIcon, { backgroundColor: focused ? Colors.primary + '20' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') }]}>
          {icon}
        </View>
        <TextInput
          style={[styles.input, { color: scheme.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={scheme.textTertiary}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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

  const CITIES = [
    { label: 'Pune', value: 'pune' },
    { label: 'Nashik', value: 'nashik' },
    { label: 'Jalgaon', value: 'jalgaon' },
  ];

  const handleSave = async () => {
    const trimmedIndex = taxIndexNumber.trim();
    const trimmedOwner = ownerName.trim();
    const trimmedLocation = location.trim();
    const trimmedArea = area.trim();
    const trimmedMobile = registeredMobile.trim();

    if (!trimmedIndex || !trimmedOwner || !trimmedLocation || !trimmedArea || !trimmedMobile) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await firebaseService.addPropertyTaxConsumer({
        taxIndexNumber: trimmedIndex,
        ownerName: trimmedOwner,
        location: trimmedLocation,
        area: trimmedArea,
        registeredMobile: trimmedMobile,
        taxCity,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)' }]}>
      <View style={[styles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        {/* Handle */}
        <View style={styles.handleBar}>
          <View style={[styles.handle, { backgroundColor: isDark ? '#3A3A3C' : '#D1D5DB' }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: `${Colors.primary}10` }]}>
              <Building2 size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Add Tax Index</Text>
              <Text style={[styles.headerSub, { color: scheme.textTertiary }]}>Register a new property for tax tracking</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6' }]}
            onPress={onClose}
          >
            <X size={18} color={scheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" style={styles.scroll}>
          {/* City selector */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#6E6E71' : '#64748B' }]}>City</Text>
          <View style={styles.chipRow}>
            {CITIES.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.cityChip, {
                  backgroundColor: taxCity === c.value ? Colors.primary : (isDark ? 'rgba(44,44,46,0.6)' : '#F3F4F6'),
                  borderWidth: taxCity === c.value ? 0 : 1,
                  borderColor: taxCity === c.value ? 'transparent' : scheme.border,
                }]}
                onPress={() => { setTaxCity(c.value); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                {taxCity === c.value && <CheckCircle size={14} color="#FFF" style={{ marginRight: 4 }} />}
                <Text style={[styles.cityChipText, { color: taxCity === c.value ? '#FFF' : scheme.textSecondary }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form fields */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#6E6E71' : '#64748B' }]}>Property Details</Text>

          <FormInput
            label="Tax Index Number"
            icon={<Building2 size={14} color={Colors.primary} />}
            value={taxIndexNumber}
            onChangeText={setTaxIndexNumber}
            placeholder="Enter index number"
          />
          <FormInput
            label="Owner Name"
            icon={<User size={14} color={Colors.primary} />}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Full name as per records"
          />
          <FormInput
            label="Location"
            icon={<MapPin size={14} color={Colors.primary} />}
            value={location}
            onChangeText={setLocation}
            placeholder="City / Area"
          />
          <FormInput
            label="Area"
            icon={<Mail size={14} color={Colors.primary} />}
            value={area}
            onChangeText={setArea}
            placeholder="Locality / Ward"
          />
          <FormInput
            label="Registered Mobile"
            icon={<Phone size={14} color={Colors.primary} />}
            value={registeredMobile}
            onChangeText={setRegisteredMobile}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, {
              backgroundColor: Colors.primary,
              opacity: saving ? 0.5 : 1,
            }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Plus size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Create Tax Index</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
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
  headerIcon: {
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
  scroll: {
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: 20,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
  },
  cityChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md - 2,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.sm,
    minHeight: 40,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    minHeight: 54,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default AddConsumerModal;
