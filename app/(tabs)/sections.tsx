/**
 * Sections Screen — compact row cards that actually route somewhere
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Car,
  Wallet,
  Monitor,
  Zap,
  FileText,
  Bell,
  Flame,
  Home,
  Wifi,
  ChevronRight,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import * as Haptics from 'expo-haptics';

interface SectionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgTint: { light: string; dark: string };
  /** Stack path to push — category uses ?cat= param */
  dest: string;
}

const SECTIONS: SectionItem[] = [
   {
    id: 'bills',
    title: 'All Bills',
    subtitle: 'Manage & track all bills',
    icon: <Wallet size={20} color="#7C3AED" />,
    bgTint: { light: 'rgba(124,58,237,0.08)', dark: 'rgba(124,58,237,0.15)' },
    dest: '/bills',
  },
    {
    id: 'electric',
    title: 'Electric Bills',
    subtitle: 'Power usage',
    icon: <Zap size={20} color="#F59E0B" />,
    bgTint: { light: 'rgba(245,158,11,0.08)', dark: 'rgba(245,158,11,0.15)' },
    dest: '/electric-bills',
  },
  {
    id: 'gas',
    title: 'Gas (MNGL)',
    subtitle: 'Gas bills',
    icon: <Flame size={20} color="#EF4444" />,
    bgTint: { light: 'rgba(239,68,68,0.08)', dark: 'rgba(239,68,68,0.15)' },
    dest: '/gas-manager',
  },
  {
    id: 'wifi',
    title: 'WiFi',
    subtitle: 'Internet bills',
    icon: <Wifi size={20} color="#8B5CF6" />,
    bgTint: { light: 'rgba(139,92,246,0.08)', dark: 'rgba(139,92,246,0.15)' },
    dest: '/wifibills',
  },
  {
    id: 'property',
    title: 'Property Tax',
    subtitle: 'Tax bills',
    icon: <Home size={20} color="#10B981" />,
    bgTint: { light: 'rgba(16,185,129,0.08)', dark: 'rgba(16,185,129,0.15)' },
    dest: '/propertybills',
  },
  {
    id: 'vehicles',
    title: 'Vehicles',
    subtitle: 'Your fleet',
    icon: <Car size={20} color="#F59E0B" />,
    bgTint: { light: 'rgba(245,158,11,0.08)', dark: 'rgba(245,158,11,0.15)' },
    dest: '/vehicles',
  },
  {
    id: 'appliances',
    title: 'Appliances',
    subtitle: 'Home devices',
    icon: <Monitor size={20} color="#06B6D4" />,
    bgTint: { light: 'rgba(6,182,212,0.08)', dark: 'rgba(6,182,212,0.15)' },
    dest: '/appliances',
  },
 
  {
    id: 'reports',
    title: 'Reports',
    subtitle: 'Spending analytics',
    icon: <FileText size={20} color="#10B981" />,
    bgTint: { light: 'rgba(16,185,129,0.08)', dark: 'rgba(16,185,129,0.15)' },
    dest: '/reports',
  },
  {
    id: 'transactions',
    title: 'Transaction Analysis',
    subtitle: 'PDF analysis for GPay/PhonePe',
    icon: <Wallet size={20} color="#7C3AED" />,
    bgTint: { light: 'rgba(124,58,237,0.08)', dark: 'rgba(124,58,237,0.15)' },
    dest: '/transactions',
  },
  

];

export default function SectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}
      edges={['bottom']}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 4) }]}>
        <Text style={[styles.headerSubtitle, { color: scheme.textTertiary }]}>
          Explore — Tap to view
        </Text>
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
          All Sections
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionCard,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(section.dest as any);
            }}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: section.bgTint[isDark ? 'dark' : 'light'] },
              ]}
            >
              {section.icon}
            </View>
            <View style={styles.sectionInfo}>
              <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: scheme.textTertiary }]}>
                {section.subtitle}
              </Text>
            </View>
            <ChevronRight
              size={16}
              color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerSubtitle: { fontSize: Typography.fontSize.sm, fontWeight: '500', letterSpacing: 0.3 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  iconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sectionInfo: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  sectionSubtitle: { fontSize: Typography.fontSize.xs },
});
