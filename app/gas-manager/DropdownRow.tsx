import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, TextInput } from 'react-native';
import { ChevronDown, MapPin, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Typography, Spacing, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

interface DropdownPickerProps {
  label: string;
  value?: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function DropdownPicker({ label, value, options, onSelect, placeholder, disabled, icon }: DropdownPickerProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [open, setOpen] = useState(false);
  const isSelected = !!value;

  return (
    <View style={styles.dropdownWrapper}>
      <Text style={[styles.dropdownLabel, { color: scheme.textTertiary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownBtn, {
          backgroundColor: isSelected
            ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)')
            : (isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB'),
          borderColor: open ? Colors.primary : (isSelected ? Colors.primary + '40' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')),
          borderWidth: 1.5,
        }]}
        onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(!open); } }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <View style={styles.dropdownIconContainer}>{icon}</View>}
        <Text
          style={[styles.dropdownValue, {
            color: isSelected ? scheme.textPrimary : scheme.textTertiary,
            fontWeight: isSelected ? '600' : '400',
            fontSize: Typography.fontSize.sm,
          }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isSelected ? value : placeholder}
        </Text>
        <Animated.View style={styles.dropdownArrow}>
          <ChevronDown size={14} color={isSelected ? Colors.primary : scheme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownList, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: scheme.border,
          borderWidth: 1,
        }]}>
          {options.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <MapPin size={18} color={scheme.textTertiary} />
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>No options</Text>
            </View>
          ) : options.map((o) => {
            const sel = value === o;
            return (
              <TouchableOpacity
                key={o}
                style={[styles.dropdownItem, {
                  backgroundColor: sel ? Colors.primary + '10' : 'transparent',
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }]}
                onPress={() => { onSelect(o); setOpen(false); Haptics.selectionAsync(); }}
              >
                <View style={styles.dropdownItemLeft}>
                  <Text
                    style={[styles.dropdownItemText, {
                      color: sel ? Colors.primary : scheme.textPrimary,
                      fontWeight: sel ? '600' : '400',
                    }]}
                    numberOfLines={1}
                  >
                    {o}
                  </Text>
                </View>
                {sel && <CheckCircle size={16} color={Colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>{icon}</View>
      <Text style={[styles.infoLabel, { color: scheme.textTertiary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.infoValue, { color: scheme.textPrimary }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

export function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(44,44,46,0.6)' : '#FFFFFF' }]}>
      <View style={styles.statIconRow}>
        <View style={[styles.statIconCircle, { backgroundColor: isDark ? color + '18' : color + '10' }]} />
        <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{value}</Text>
      {sub && <Text style={[styles.statSub, { color: scheme.textTertiary }]}>{sub}</Text>}
    </View>
  );
}

export function FormField({ value, onChangeText, keyboardType, placeholder, editable, style }: {
  value: string; onChangeText: (t: string) => void; keyboardType?: any;
  placeholder?: string; editable?: boolean; style?: any;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={style}>
      <TextInput
        style={[styles.fieldInput, {
          backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : '#F3F4F6',
          color: scheme.textPrimary,
          borderColor: scheme.border,
          opacity: editable === false ? 0.6 : 1,
        }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownWrapper: { flex: 1 },
  dropdownLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, height: 52 },
  dropdownIconContainer: { marginRight: 10 },
  dropdownValue: { fontSize: Typography.fontSize.sm, fontWeight: '500', flex: 1, marginRight: 8 },
  dropdownArrow: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dropdownEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  dropdownList: {
    position: 'absolute', top: 72, left: 0, right: 0,
    borderRadius: 14, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    borderWidth: 1, zIndex: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, minHeight: 44,
  },
  dropdownItemLeft: { flex: 1, minWidth: 0 },
  dropdownItemText: { fontSize: Typography.fontSize.sm },
  infoItem: { width: '45%', paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  infoIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2, textAlign: 'center' },
  infoValue: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  statCard: {
    flex: 1, borderRadius: BorderRadius.card, padding: Spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  statIconCircle: { width: 24, height: 24, borderRadius: 7 },
  statLabel: { fontSize: Typography.fontSize.xs },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
  statSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  fieldInput: {
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.sm, minHeight: 44, borderWidth: 1,
  },
});
