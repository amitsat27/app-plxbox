/**
 * DropdownPicker — reusable dropdown selector
 * Polished finance-app style dropdown with animated chevron
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, PixelRatio } from 'react-native';
import { ChevronDown, Check, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
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

function DropdownPicker({
  label, value, options, onSelect, placeholder, disabled, icon
}: DropdownPickerProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const [open, setOpen] = useState(false);
  const isSelected = !!value;

  const chevronRotation = React.useRef(new Animated.Value(0)).current;

  const handleToggle = React.useCallback(() => {
    if (disabled) return;
    Animated.timing(chevronRotation, {
      toValue: open ? 0 : 180,
      duration: 250,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(!open);
  }, [disabled, open, chevronRotation]);

  const handleSelect = React.useCallback((v: string) => {
    onSelect(v);
    setOpen(false);
    Animated.timing(chevronRotation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    Haptics.selectionAsync();
  }, [onSelect, chevronRotation]);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: scheme.textTertiary }]}>{label}</Text>

      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.btn, {
          backgroundColor: isSelected
            ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)')
            : (isDark ? 'rgba(44,44,46,0.5)' : '#F9FAFB'),
          borderColor: open
            ? Colors.primary
            : isSelected
              ? `${Colors.primary}40`
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
          borderWidth: isSelected ? 1.5 : 1.5,
        }]}
        onPress={handleToggle}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text
          style={[
            styles.value,
            {
              color: isSelected ? scheme.textPrimary : scheme.textTertiary,
              fontWeight: isSelected ? '600' : '400',
              fontSize: Typography.fontSize.sm,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isSelected ? value : placeholder}
        </Text>

        {/* Animated chevron */}
        <Animated.View
          style={{
            transform: [{ rotate: chevronRotation.interpolate({
              inputRange: [0, 180],
              outputRange: ['0deg', '180deg'],
            }) }],
          }}
        >
          <View style={styles.arrow}>
            <ChevronDown size={14} color={isSelected ? Colors.primary : scheme.textTertiary} />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown list */}
      {open && (
        <View style={[styles.list, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: scheme.border,
          borderWidth: 1,
        }]}
        >
          {options.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                <MapPin size={16} color={scheme.textTertiary} />
              </View>
              <Text style={{ color: scheme.textTertiary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs }}>
                No tax indices found
              </Text>
            </View>
          ) : (
            options.map((o, idx) => {
              const selected = value === o;
              return (
                <TouchableOpacity
                  key={o}
                  style={[
                    styles.item,
                    {
                      backgroundColor: selected ? `${Colors.primary}10` : 'transparent',
                      borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                  onPress={() => handleSelect(o)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.itemDot, { backgroundColor: selected ? Colors.primary : scheme.border }]} />
                  <View style={styles.itemLeft}>
                    <Text style={[
                      styles.itemText,
                      {
                        color: selected ? Colors.primary : scheme.textPrimary,
                        fontWeight: selected ? '600' : '400',
                      },
                    ]} numberOfLines={1} ellipsizeMode="tail">
                      {o}
                    </Text>
                  </View>
                  {selected && (
                    <View style={[styles.selectedBadge, { backgroundColor: `${Colors.primary}15` }]}>
                      <Check size={12} color={Colors.primary} />
                    </View>
                  )}
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
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: 16,
    height: 54,
    gap: Spacing.xs,
  },
  iconWrap: {
    marginRight: Spacing.xs,
  },
  value: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  empty: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1 / PixelRatio.get(),
    minHeight: 48,
    gap: Spacing.sm,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemLeft: {
    flex: 1,
    minWidth: 0,
  },
  itemText: {
    fontSize: Typography.fontSize.sm,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DropdownPicker;
