/**
 * Gas Tips / News Section — static cards, structured for future API integration
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Flame, Droplets, Shield, TrendingDown } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

const TIPS = [
  {
    id: '1',
    icon: <Flame size={20} color={Colors.primary} />,
    title: 'Save Gas While Cooking',
    desc: 'Use lids, pre-sook items, and pressure cookers for 30% less consumption.',
    tint: 'rgba(239,68,68,0.08)',
  },
  {
    id: '2',
    icon: <TrendingDown size={20} color="#10B981" />,
    title: 'Track Your Usage',
    desc: 'Monitor monthly readings to spot unusual spikes early.',
    tint: 'rgba(16,185,129,0.08)',
  },
  {
    id: '3',
    icon: <Shield size={20} color="#F59E0B" />,
    title: 'Safety Guidelines',
    desc: 'Check hoses monthly, keep ventilation clear, and report leaks immediately.',
    tint: 'rgba(245,158,11,0.08)',
  },
];

export default function GasTips() {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fadeAnims = useRef(TIPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(120, fadeAnims.map((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 400, delay: i * 120, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>Gas Tips & Info</Text>
      {TIPS.map((tip, i) => (
        <Animated.View key={tip.id} style={{ opacity: fadeAnims[i] }}>
          <View style={[styles.tipCard, {
            backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFFFFF',
          }]}>
            <View style={[styles.iconBg, { backgroundColor: isDark ? tip.tint.replace('0.08', '0.2') : tip.tint }]}>
              {tip.icon}
            </View>
            <View style={styles.tipText}>
              <Text style={[styles.tipTitle, { color: scheme.textPrimary }]}>{tip.title}</Text>
              <Text style={[styles.tipDesc, { color: scheme.textSecondary }]}>{tip.desc}</Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: Spacing.xs },
  tipCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.card, padding: Spacing.md, gap: Spacing.sm,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  tipText: { flex: 1, minWidth: 0 },
  tipTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  tipDesc: { fontSize: Typography.fontSize.xs, marginTop: 2 },
});
