// 🌐 Premium Fintech Home Dashboard

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Car,
  Monitor,
  Wallet,
  Zap,
  Flame,
  Wifi,
  Home,
  TrendingUp,
  ChevronRight,
  Briefcase,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  electric: <Zap size={22} color="#F59E0B" />,
  gas: <Flame size={22} color="#3B82F6" />,
  wifi: <Wifi size={22} color="#8B5CF6" />,
  property: <Home size={22} color="#10B981" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  electric: '#F59E0B',
  gas: '#3B82F6',
  wifi: '#8B5CF6',
  property: '#10B981',
};

const CATEGORY_BG_TINT: Record<string, { light: string; dark: string }> = {
  electric: { light: 'rgba(245,158,11,0.12)', dark: 'rgba(245,158,11,0.18)' },
  gas: { light: 'rgba(59,130,246,0.12)', dark: 'rgba(59,130,246,0.18)' },
  wifi: { light: 'rgba(139,92,246,0.12)', dark: 'rgba(139,92,246,0.18)' },
  property: { light: 'rgba(16,185,129,0.12)', dark: 'rgba(16,185,129,0.18)' },
};

const CATEGORY_LABELS: Record<string, string> = {
  electric: 'Electric',
  gas: 'Gas (MNGL)',
  wifi: 'WiFi',
  property: 'Property Tax',
};

function getTimeGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

// ── Premium Stat Tile ─────────────────────────────────────────────────────

function StatTile({ label, value, icon, index }: { label: string; value: string; icon: React.ReactNode; index: number }) {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    }, index * 120);
  }, [index]);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Pressable style={({ pressed }) => [
        styles.statTile,
        { 
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}>
        <View style={styles.statIconWrapper}>{icon}</View>
        <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Premium Category Card ─────────────────────────────────────────────────

function CategoryCard({ category, totalAmount, count, index }: { category: string; totalAmount: number; count: number; index: number }) {
  const { isDark } = useTheme();
  const color = CATEGORY_COLORS[category] || Colors.primary;
  const icon = CATEGORY_ICONS[category] || <Home size={22} color={color} />;
  const label = CATEGORY_LABELS[category] || category;
  const bgTint = CATEGORY_BG_TINT[category]?.[isDark ? 'dark' : 'light'] || 'transparent';

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    }, 300 + index * 100);
  }, [index]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_W }}>
      <Pressable style={({ pressed }) => [
        styles.catCard,
        { 
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}>
        <View style={[styles.catIconWrapper, { backgroundColor: bgTint }]}>
          {icon}
        </View>
        <Text style={[styles.catLabel, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.catAmount, { color: isDark ? '#FFF' : '#0F172A' }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        <Text style={[styles.catCount, { color: isDark ? '#64748B' : '#94A3B8' }]}>{count} bill{count !== 1 ? 's' : ''}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Premium Info Row ───────────────────────────────────────────────────────

function InfoRow({ icon, label, sublabel, index }: { icon: React.ReactNode; label: string; sublabel: string; index: number }) {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 500 + index * 100);
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable style={({ pressed }) => [
        styles.infoRow,
        { backgroundColor: pressed ? (isDark ? '#1A1A1A' : '#F1F5F9') : (isDark ? '#0D0D0D' : '#FFFFFF') },
      ]}>
        <View style={[styles.infoIconBg, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
          {icon}
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: isDark ? '#FFF' : '#0F172A' }]}>{label}</Text>
          <Text style={[styles.infoSub, { color: isDark ? '#64748B' : '#94A3B8' }]}>{sublabel}</Text>
        </View>
        <ChevronRight size={20} color={isDark ? '#3B3B3B' : '#CBD5E1'} />
      </Pressable>
    </Animated.View>
  );
}

// ── Premium Alert Banner ─────────────────────────────────────────────────

function AlertBanner({ label, amount, date, index }: { label: string; amount: number; date: string; index: number }) {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    }, 600 + index * 80);
  }, [index]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable style={({ pressed }) => [
        styles.alertBanner,
        { 
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
        <View style={styles.alertLeft}>
          <View style={[styles.alertDot, { backgroundColor: Colors.warning }]} />
          <Text style={[styles.alertLabel, { color: isDark ? '#FFF' : '#0F172A' }]} numberOfLines={1}>{label}</Text>
        </View>
        <View style={styles.alertRight}>
          <Text style={[styles.alertAmount, { color: Colors.warning }]}>₹{amount.toLocaleString('en-IN')}</Text>
          <Text style={[styles.alertDate, { color: isDark ? '#64748B' : '#94A3B8' }]}>{date}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Home Screen ─────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { categories, totalBillsAmount, totalBillsCount, pendingBills, overdueBills, vehicles, appliances, loading } = useDashboardData(user?.uid);

  const displayName = useMemo(() => {
    if (!user?.displayName) return 'User';
    const parts = user.displayName.trim().split(' ');
    return parts[0].length > 10 ? parts[0].substring(0, 10) + '.' : parts[0];
  }, [user?.displayName]);

  const stats = useMemo(
    () => [
      { label: 'Total Paid', value: `₹${totalBillsAmount.toLocaleString('en-IN')}`, icon: <Wallet size={20} color={Colors.primary} /> },
      { label: 'Bills', value: String(totalBillsCount), icon: <Briefcase size={20} color="#8B5CF6" /> },
      { label: 'Vehicles', value: String(vehicles.length), icon: <Car size={20} color="#F59E0B" /> },
      { label: 'Appliances', value: String(appliances.length), icon: <Monitor size={20} color="#06B6D4" /> },
    ],
    [totalBillsAmount, totalBillsCount, vehicles, appliances]
  );

  const alerts = useMemo(() => {
    const pending = pendingBills.slice(0, 3).map((b) => ({
      id: b.id, label: b.title, amount: b.amount,
      date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));
    const overdue = overdueBills.slice(0, 3).map((b) => ({
      id: b.id, label: b.title, amount: b.amount,
      date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));
    return [...overdue, ...pending];
  }, [pendingBills, overdueBills]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        {/* Premium Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? '#64748B' : '#94A3B8' }]}>{getTimeGreeting()}</Text>
            <Text style={[styles.userName, { color: isDark ? '#FFF' : '#0F172A' }]}>{displayName}</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <TrendingUp size={14} color="#10B981" />
            <Text style={[styles.summaryText, { color: isDark ? '#FFF' : '#0F172A' }]}>All bills paid</Text>
          </View>
        </View>

        {!loading && (
          <>
            {/* Stats Grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#0F172A' }]}>Overview</Text>
              <View style={styles.statGrid}>
                {stats.map((s, i) => <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} index={i} />)}
              </View>
            </View>

            {/* Alerts */}
            {alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#0F172A' }]}>Upcoming</Text>
                <View style={styles.alertsList}>
                  {alerts.map((a, i) => <AlertBanner key={a.id} label={a.label} amount={a.amount} date={a.date} index={i} />)}
                </View>
              </View>
            )}

            {/* Categories */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#0F172A' }]}>Your Bills</Text>
              <View style={styles.catGrid}>
                {categories.map((c, i) => <CategoryCard key={c.category} category={c.category} totalAmount={c.totalAmount} count={c.count} index={i} />)}
              </View>
            </View>

            {/* Quick Links */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#0F172A' }]}>Quick Access</Text>
              <View style={styles.infoList}>
                <InfoRow index={0} icon={<Zap size={20} color="#F59E0B" />} label="Electricity" sublabel="Manage your electricity bills" />
                <InfoRow index={1} icon={<Flame size={20} color="#3B82F6" />} label="Gas" sublabel="MNGL gas bill payments" />
                <InfoRow index={2} icon={<Wifi size={20} color="#8B5CF6" />} label="WiFi" sublabel="Internet service bills" />
                <InfoRow index={3} icon={<Home size={20} color="#10B981" />} label="Property Tax" sublabel="Municipal tax payments" />
              </View>
            </View>
          </>
        )}

        {loading && (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  loadingView: { paddingVertical: 100, alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.fontSize.sm, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  summaryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  summaryText: { fontSize: 12, fontWeight: '600' },

  // Section
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', marginBottom: Spacing.md, letterSpacing: -0.3 },

  // Stats Grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statTile: { width: CARD_W, padding: Spacing.md, borderRadius: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 4 } }) },
  statIconWrapper: { marginBottom: Spacing.xs },
  statValue: { fontSize: Typography.fontSize.xl, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500' },

  // Alerts
  alertsList: { gap: Spacing.sm },
  alertBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: 16 },
  alertLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  alertLabel: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: '600' },
  alertRight: { alignItems: 'flex-end' },
  alertAmount: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  alertDate: { fontSize: Typography.fontSize.xs },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: { width: CARD_W, padding: Spacing.md, borderRadius: 20 },
  catIconWrapper: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  catLabel: { fontSize: Typography.fontSize.xs, fontWeight: '500', marginBottom: 2 },
  catAmount: { fontSize: Typography.fontSize.xl, fontWeight: '700', marginBottom: 2 },
  catCount: { fontSize: Typography.fontSize.xs },

  // Info List
  infoList: { gap: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: 16 },
  infoIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSize.md, fontWeight: '600', marginBottom: 2 },
  infoSub: { fontSize: Typography.fontSize.xs },
});
