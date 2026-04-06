/**
 * Property Tax — EmptyState
 * Animated empty state with icon and text
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Spacing, Typography } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { type LucideIcon } from 'lucide-react-native';

export function EmptyState({ icon, title, subtitle, iconColor }: {
  icon: LucideIcon; title: string; subtitle: string; iconColor?: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, damping: 26, stiffness: 250, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const Icon = icon;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], paddingVertical: Spacing.xxxl, alignItems: 'center' }}>
      <Icon size={48} color={iconColor || scheme.textTertiary} opacity={0.3} />
      <Text style={[styles.title, { color: scheme.textPrimary }]}>{title}</Text>
      <Text style={[styles.sub, { color: scheme.textTertiary }]}>{subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sub: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
