/**
 * DropdownPicker — reusable dropdown selector
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { ChevronDown, CheckCircle, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

function DropdownPicker({
  label, value, options, onSelect, placeholder, disabled, icon
}: {
  label: string; value?: string; options: string[];
  onSelect: (v: string) => void; placeholder: string; disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [open, setOpen] = useState(false);
  const isSelected = !!value;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: scheme.textTertiary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.btn, {
          backgroundColor: isSelected ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)') : (isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB'),
          borderColor: open ? Colors.primary : (isSelected ? Colors.primary + '40' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')),
          borderWidth: 1.5,
        }]}
        onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(!open); } }}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={[styles.value, { color: isSelected ? scheme.textPrimary : scheme.textTertiary, fontWeight: isSelected ? '600' : '400', fontSize: Typography.fontSize.sm }]} numberOfLines={1} ellipsizeMode="tail">
          {isSelected ? value : placeholder}
        </Text>
        <Animated.View style={styles.arrow}>
          <ChevronDown size={14} color={isSelected ? Colors.primary : scheme.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={[styles.list, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border, borderWidth: 1,
        }]}>
          {options.length === 0 ? (
            <View style={styles.empty}>
              <MapPin size={18} color={scheme.textTertiary} />
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>No tax indices found</Text>
            </View>
          ) : (
            options.map((o) => {
              const selected = value === o;
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.item, {
                    backgroundColor: selected ? Colors.primary + '10' : 'transparent',
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }]}
                  onPress={() => { onSelect(o); setOpen(false); Haptics.selectionAsync(); }}
                >
                  <View style={styles.itemLeft}>
                    <Text style={[styles.itemText, { color: selected ? Colors.primary : scheme.textPrimary, fontWeight: selected ? '600' : '400' }]} numberOfLines={1} ellipsizeMode="tail">{o}</Text>
                  </View>
                  {selected && <CheckCircle size={16} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  label: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, height: 52 },
  iconWrap: { marginRight: 10 },
  value: { flex: 1, marginRight: 8 },
  arrow: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  empty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  list: { position: 'absolute', top: 72, left: 0, right: 0, borderRadius: 14, borderWidth: 1, zIndex: 10, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 8 } }) },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, minHeight: 44 },
  itemLeft: { flex: 1, minWidth: 0 },
  itemText: { fontSize: Typography.fontSize.sm },
});

export default DropdownPicker;
