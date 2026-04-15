/**
 * Property Tax — FilterBar
 * Status filter chips for billing list
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export function FilterBar({ filter, onFilter }: { filter: string; onFilter: (f: string) => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.row}>
      {['All', 'Paid', 'Pending'].map(f => (
        <FilterChip key={f} label={f} active={filter === f} onPress={() => onFilter(f)} />
      ))}
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, damping: 20, stiffness: 300, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, damping: 20, stiffness: 300, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            transform: [{ scale }],
            borderWidth: 1,
            borderColor: active ? `${Colors.primary}60` : 'transparent',
            backgroundColor: active
              ? (isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)')
              : (isDark ? 'rgba(44,44,46,0.5)' : 'rgba(0,0,0,0.04)'),
          },
        ]}
      >
        <Text style={{
          fontSize: Typography.fontSize.xs,
          fontWeight: '600',
          color: active ? Colors.primary : scheme.textTertiary,
        }}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
