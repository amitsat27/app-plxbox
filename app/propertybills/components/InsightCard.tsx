/**
 * Property Tax — InsightCard
 * Horizontal scrollable insight/tips cards — theme-aware
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { TrendingUp, Info, Wallet, Building2, Percent, Calendar, type LucideIcon } from 'lucide-react-native';

interface Insight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tag?: string;
}

const INSIGHTS: Insight[] = [
  {
    id: 'early-bird',
    title: 'Early Bird Discount',
    description: 'Pay before March 31 for 5% rebate on total amount.',
    icon: TrendingUp,
    color: '#10B981',
    tag: 'Save Money',
  },
  {
    id: 'tax-update',
    title: 'Revised Circle Rates',
    description: 'PMC updated circle rates effective April 2026. Check new rates.',
    icon: Info,
    color: '#3B82F6',
    tag: 'New',
  },
  {
    id: 'online-pay',
    title: 'Online Payment',
    description: 'Pay tax online via net banking, UPI, or debit card.',
    icon: Wallet,
    color: '#8B5CF6',
    tag: 'Convenient',
  },
  {
    id: 'assessment',
    title: 'Property Assessment',
    description: 'Annual assessment determines your tax liability for the year.',
    icon: Building2,
    color: '#F59E0B',
    tag: 'Important',
  },
  {
    id: 'rebate',
    title: 'Senior Citizen Rebate',
    description: 'Senior citizens may be eligible for additional tax concessions.',
    icon: Percent,
    color: '#EC4899',
    tag: 'Benefits',
  },
  {
    id: 'penalty',
    title: 'Late Payment Penalty',
    description: 'Delay in payment attracts 2% monthly interest on outstanding.',
    icon: Calendar,
    color: '#EF4444',
    tag: 'Warning',
  },
];

function InsightItem({ insight, index, isDark }: { insight: Insight; index: number; isDark: boolean }) {
  const Icon = insight.icon;
  const iconBg = insight.color + (isDark ? '18' : '12');
  const tagBg = insight.color + (isDark ? '18' : '10');

  const slideIn = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.spring(slideIn, { toValue: 0, damping: 24, stiffness: 260, delay, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, [slideIn, fade, index]);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateX: slideIn }], minWidth: 240, marginRight: Spacing.sm }}
    >
      <View style={[styles.card, {
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      }]}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Icon size={16} color={insight.color} />
          </View>
          {insight.tag && (
            <View style={[styles.tag, { backgroundColor: tagBg }]}>
              <Text style={[styles.tagText, { color: insight.color }]}>{insight.tag}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>
          {insight.title}
        </Text>
        <Text style={[styles.cardDesc, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={2}>
          {insight.description}
        </Text>
      </View>
    </Animated.View>
  );
}

export function InsightCard() {
  const { isDark } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Insights & Updates</Text>
        <Text style={[styles.sectionSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>Stay informed</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {INSIGHTS.map((i, idx) => (
          <InsightItem key={i.id} insight={i} index={idx} isDark={isDark} />
        ))}
      </ScrollView>
    </View>
  );
}

const InsightCardExport = InsightCard;
export default InsightCardExport;

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
  },
});
