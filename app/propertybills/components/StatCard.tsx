/**
 * Property Tax — StatCard
 * Bold, modern metric tile with animated entry and premium design
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

function StatCard({ label, value, sub, color, icon, delay = 0 }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ReactNode; delay?: number;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 22, stiffness: 250, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 24, stiffness: 260, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, scale, opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }, { translateY }],
        flex: 1,
      }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? `${color}10` : `${color}06`,
            borderColor: isDark ? `${color}20` : `${color}12`,
          },
        ]}
      >
        {/* Icon with colored circle */}
        <View style={[styles.iconBg, { backgroundColor: `${color}18` }]}>
          {icon}
        </View>

        {/* Value */}
        <Text
          style={[styles.value, { color: isDark ? scheme.textPrimary : '#0F172A' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        {/* Label */}
        <Text style={[styles.label, { color: isDark ? scheme.textTertiary : '#64748B' }]}>
          {label}
        </Text>

        {/* Sub text */}
        {sub && (
          <Text style={[styles.sub, { color }]}>
            {sub}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingTop: Spacing.md - 2,
    borderWidth: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  sub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default StatCard;
