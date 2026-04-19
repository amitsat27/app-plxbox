import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  Search,
  BellRing,
  Sparkles,
  ShieldCheck,
  Clock3,
  Layers3,
} from 'lucide-react-native';
import { Spacing, Typography } from '@/constants/designTokens';
import { Colors } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardData } from '@/src/hooks/useDashboardData';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

type AlertMode = 'all' | 'overdue' | 'pending';

type QuickAction = {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
  route: string;
};

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  electric: <Zap size={22} color="#F59E0B" />,
  gas: <Flame size={22} color="#3B82F6" />,
  wifi: <Wifi size={22} color="#0EA5E9" />,
  property: <Home size={22} color="#10B981" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  electric: '#F59E0B',
  gas: '#3B82F6',
  wifi: '#0EA5E9',
  property: '#10B981',
};

const CATEGORY_BG_TINT: Record<string, { light: string; dark: string }> = {
  electric: { light: 'rgba(245,158,11,0.14)', dark: 'rgba(245,158,11,0.2)' },
  gas: { light: 'rgba(59,130,246,0.14)', dark: 'rgba(59,130,246,0.2)' },
  wifi: { light: 'rgba(14,165,233,0.14)', dark: 'rgba(14,165,233,0.2)' },
  property: { light: 'rgba(16,185,129,0.14)', dark: 'rgba(16,185,129,0.2)' },
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

function SectionHeader({
  title,
  subtitle,
  action,
  isDark,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  isDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected ? Colors.primary : isDark ? 'rgba(148,163,184,0.14)' : '#EEF2F7',
          borderColor: selected ? Colors.primary : isDark ? 'rgba(148,163,184,0.2)' : '#D8E1EC',
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[styles.filterChipText, { color: selected ? '#FFF' : isDark ? '#E2E8F0' : '#334155' }]}>{label}</Text>
    </Pressable>
  );
}

function StatTile({
  label,
  value,
  icon,
  index,
  isDark,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  index: number;
  isDark: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(riseAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]).start();
    }, 80 + index * 90);
  }, [fadeAnim, riseAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: riseAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.statTile,
          {
            backgroundColor: isDark ? '#131A27' : '#FFFFFF',
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <View style={[styles.statIconWrapper, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>{icon}</View>
        <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function CategoryCard({
  category,
  totalAmount,
  count,
  index,
  isDark,
}: {
  category: string;
  totalAmount: number;
  count: number;
  index: number;
  isDark: boolean;
}) {
  const color = CATEGORY_COLORS[category] || Colors.primary;
  const icon = CATEGORY_ICONS[category] || <Home size={22} color={color} />;
  const label = CATEGORY_LABELS[category] || category;
  const bgTint = CATEGORY_BG_TINT[category]?.[isDark ? 'dark' : 'light'] || 'transparent';

  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    }, 220 + index * 80);
  }, [scaleAnim, index]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_W }}>
      <Pressable
        style={({ pressed }) => [
          styles.catCard,
          {
            backgroundColor: isDark ? '#131A27' : '#FFFFFF',
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <View style={[styles.catIconWrapper, { backgroundColor: bgTint }]}>{icon}</View>
        <Text style={[styles.catLabel, { color: isDark ? '#A9B6CA' : '#64748B' }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.catAmount, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        <Text style={[styles.catCount, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {count} bill{count !== 1 ? 's' : ''}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function QuickActionRow({ action, index, isDark, onPress }: { action: QuickAction; index: number; isDark: boolean; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }, 420 + index * 80);
  }, [fadeAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.infoRow,
          {
            backgroundColor: pressed ? (isDark ? '#1A2436' : '#EFF4FB') : isDark ? '#111827' : '#FFFFFF',
          },
        ]}
      >
        <View style={[styles.infoIconBg, { backgroundColor: isDark ? 'rgba(148,163,184,0.16)' : `${action.color}18` }]}>
          {action.icon}
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{action.label}</Text>
          <Text style={[styles.infoSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>{action.sublabel}</Text>
        </View>
        <ChevronRight size={20} color={isDark ? '#334155' : '#CBD5E1'} />
      </Pressable>
    </Animated.View>
  );
}

function AlertBanner({
  label,
  amount,
  date,
  index,
  isDark,
}: {
  label: string;
  amount: number;
  date: string;
  index: number;
  isDark: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 9, useNativeDriver: true }).start();
    }, 560 + index * 80);
  }, [scaleAnim, index]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.alertBanner,
          {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.alertLeft}>
          <View style={[styles.alertDot, { backgroundColor: Colors.warning }]} />
          <Text style={[styles.alertLabel, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <View style={styles.alertRight}>
          <Text style={[styles.alertAmount, { color: Colors.warning }]}>₹{amount.toLocaleString('en-IN')}</Text>
          <Text style={[styles.alertDate, { color: isDark ? '#94A3B8' : '#64748B' }]}>{date}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function VisualPill({
  label,
  value,
  tint,
  isDark,
}: {
  label: string;
  value: string;
  tint: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.visualPill,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.84)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)',
        },
      ]}
    >
      <View style={[styles.visualPillDot, { backgroundColor: tint }]} />
      <Text style={[styles.visualPillLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{label}</Text>
      <Text style={[styles.visualPillValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{value}</Text>
    </View>
  );
}

function HighlightCard({
  title,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  subtitle: string;
  tone: [string, string];
  icon: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={tone}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.highlightCard}
    >
      <View style={styles.highlightIconWrap}>{icon}</View>
      <Text style={styles.highlightTitle}>{title}</Text>
      <Text style={styles.highlightSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { categories, totalBillsAmount, totalBillsCount, pendingBills, overdueBills, vehicles, appliances, loading } = useDashboardData(user?.uid);

  const [searchQuery, setSearchQuery] = useState('');
  const [alertMode, setAlertMode] = useState<AlertMode>('all');

  const displayName = useMemo(() => {
    if (!user?.displayName) return 'User';
    const parts = user.displayName.trim().split(' ');
    return parts[0].length > 10 ? `${parts[0].substring(0, 10)}.` : parts[0];
  }, [user?.displayName]);

  const stats = useMemo(
    () => [
      { label: 'Total Paid', value: `₹${totalBillsAmount.toLocaleString('en-IN')}`, icon: <Wallet size={20} color={Colors.primary} /> },
      { label: 'Bills', value: String(totalBillsCount), icon: <Briefcase size={20} color="#8B5CF6" /> },
      { label: 'Vehicles', value: String(vehicles.length), icon: <Car size={20} color="#F59E0B" /> },
      { label: 'Appliances', value: String(appliances.length), icon: <Monitor size={20} color="#06B6D4" /> },
    ],
    [totalBillsAmount, totalBillsCount, vehicles.length, appliances.length]
  );

  const pendingAlerts = useMemo(
    () =>
      pendingBills.slice(0, 4).map((b) => ({
        id: b.id,
        label: b.title,
        amount: b.amount,
        date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      })),
    [pendingBills]
  );

  const overdueAlerts = useMemo(
    () =>
      overdueBills.slice(0, 4).map((b) => ({
        id: b.id,
        label: b.title,
        amount: b.amount,
        date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      })),
    [overdueBills]
  );

  const alerts = useMemo(() => {
    if (alertMode === 'overdue') return overdueAlerts;
    if (alertMode === 'pending') return pendingAlerts;
    return [...overdueAlerts, ...pendingAlerts];
  }, [alertMode, overdueAlerts, pendingAlerts]);

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'electricity',
        label: 'Electricity',
        sublabel: 'Manage your electricity bills',
        color: '#F59E0B',
        icon: <Zap size={20} color="#F59E0B" />,
        route: '/electric-bills',
      },
      {
        id: 'gas',
        label: 'Gas',
        sublabel: 'MNGL gas bill payments',
        color: '#3B82F6',
        icon: <Flame size={20} color="#3B82F6" />,
        route: '/gas-manager',
      },
      {
        id: 'wifi',
        label: 'WiFi',
        sublabel: 'Internet service bills',
        color: '#0EA5E9',
        icon: <Wifi size={20} color="#0EA5E9" />,
        route: '/wifibills',
      },
      {
        id: 'property-tax',
        label: 'Property Tax',
        sublabel: 'Municipal tax payments',
        color: '#10B981',
        icon: <Home size={20} color="#10B981" />,
        route: '/propertybills',
      },
    ],
    []
  );

  const visibleQuickActions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return quickActions;
    return quickActions.filter(
      (item) => item.label.toLowerCase().includes(query) || item.sublabel.toLowerCase().includes(query)
    );
  }, [quickActions, searchQuery]);

  const heroTag = useMemo(() => {
    if (overdueBills.length > 0) return `${overdueBills.length} overdue`;
    if (pendingBills.length > 0) return `${pendingBills.length} upcoming`;
    return 'All clear';
  }, [overdueBills.length, pendingBills.length]);

  const outstandingAmount = useMemo(
    () => [...pendingBills, ...overdueBills].reduce((sum, item) => sum + item.amount, 0),
    [overdueBills, pendingBills]
  );

  const topCategory = useMemo(() => {
    if (!categories.length) return null;
    return [...categories].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  }, [categories]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.screen, { backgroundColor: isDark ? '#020617' : '#F4F8FF' }]}> 
      <View style={[styles.bgOrbTop, { backgroundColor: isDark ? 'rgba(14,165,233,0.14)' : 'rgba(14,165,233,0.18)' }]} />
      <View style={[styles.bgOrbBottom, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.14)' }]} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0B1220'] : ['#1D4ED8', '#0EA5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBlock}
        >
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <View style={styles.heroRing} />
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.greeting}>{getTimeGreeting()}</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <View style={styles.heroPill}>
              <Sparkles size={14} color="#FFFFFF" />
              <Text style={styles.heroPillText}>{heroTag}</Text>
            </View>
          </View>

          <Text style={styles.heroSummary}>One place to track payments, monitor dues, and jump to your most-used bill workflows.</Text>

          <View style={styles.searchShell}>
            <Search size={18} color="rgba(255,255,255,0.78)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search quick actions"
              placeholderTextColor="rgba(255,255,255,0.66)"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </LinearGradient>

        <View style={styles.visualPillRow}>
          <VisualPill
            label="Outstanding"
            value={`₹${outstandingAmount.toLocaleString('en-IN')}`}
            tint="#F59E0B"
            isDark={isDark}
          />
          <VisualPill
            label="Pending"
            value={`${pendingBills.length}`}
            tint="#0EA5E9"
            isDark={isDark}
          />
          <VisualPill
            label="Overdue"
            value={`${overdueBills.length}`}
            tint="#EF4444"
            isDark={isDark}
          />
        </View>

        <View style={styles.highlightsRow}>
          <HighlightCard
            title={topCategory ? `${CATEGORY_LABELS[topCategory.category] || topCategory.category}` : 'No category yet'}
            subtitle={topCategory ? `Top utility · ₹${topCategory.totalAmount.toLocaleString('en-IN')}` : 'Start tracking bills to see trends'}
            tone={['#2563EB', '#0EA5E9']}
            icon={<Layers3 size={16} color="#FFFFFF" />}
          />
          <HighlightCard
            title={`${pendingBills.length + overdueBills.length} due`}
            subtitle="Keep upcoming payments under control"
            tone={['#F59E0B', '#F97316']}
            icon={<Clock3 size={16} color="#FFFFFF" />}
          />
        </View>

        <View style={[styles.insightRibbon, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
          <View style={styles.insightIconWrap}>
            <ShieldCheck size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Dashboard Insight</Text>
            <Text style={[styles.insightText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {overdueBills.length > 0
                ? 'Overdue bills detected. Prioritize payments to avoid penalties.'
                : pendingBills.length > 0
                  ? 'Upcoming bills are tracked. You are in control.'
                  : 'Everything looks clear. Great financial hygiene.'}
            </Text>
          </View>
        </View>

        {!loading ? (
          <>
            <View style={styles.section}>
              <SectionHeader
                title="Overview"
                subtitle="Your current account snapshot"
                isDark={isDark}
                action={
                  <View style={[styles.headerActionChip, { backgroundColor: isDark ? '#111827' : '#E9F1FF' }]}>
                    <TrendingUp size={14} color={Colors.primary} />
                    <Text style={[styles.headerActionText, { color: isDark ? '#CBD5E1' : '#1E3A8A' }]}>Live</Text>
                  </View>
                }
              />
              <View style={styles.statGrid}>
                {stats.map((s, i) => (
                  <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} index={i} isDark={isDark} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Upcoming"
                subtitle="Pending and overdue bill highlights"
                isDark={isDark}
                action={<BellRing size={16} color={isDark ? '#A5B4FC' : '#4F46E5'} />}
              />
              <View style={styles.filterRow}>
                <FilterChip label="All" selected={alertMode === 'all'} onPress={() => setAlertMode('all')} isDark={isDark} />
                <FilterChip label="Overdue" selected={alertMode === 'overdue'} onPress={() => setAlertMode('overdue')} isDark={isDark} />
                <FilterChip label="Pending" selected={alertMode === 'pending'} onPress={() => setAlertMode('pending')} isDark={isDark} />
              </View>
              <View style={styles.alertsList}>
                {alerts.length > 0 ? (
                  alerts.map((a, i) => (
                    <AlertBanner key={a.id} label={a.label} amount={a.amount} date={a.date} index={i} isDark={isDark} />
                  ))
                ) : (
                  <View style={[styles.emptySlate, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
                    <Text style={[styles.emptySlateTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>No due items</Text>
                    <Text style={[styles.emptySlateSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>You are currently up to date.</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Your Bills" subtitle="Spending by utility category" isDark={isDark} />
              <View style={styles.catGrid}>
                {categories.map((c, i) => (
                  <CategoryCard
                    key={c.category}
                    category={c.category}
                    totalAmount={c.totalAmount}
                    count={c.count}
                    index={i}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Quick Access"
                subtitle="Jump into frequently used sections"
                isDark={isDark}
              />
              <View style={styles.infoList}>
                {visibleQuickActions.map((action, i) => (
                  <QuickActionRow
                    key={action.id}
                    action={action}
                    index={i}
                    isDark={isDark}
                    onPress={() => router.push(action.route as any)}
                  />
                ))}
                {visibleQuickActions.length === 0 ? (
                  <View style={[styles.emptySlate, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
                    <Text style={[styles.emptySlateTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>No matches found</Text>
                    <Text style={[styles.emptySlateSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>Try another search term.</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  loadingView: { paddingVertical: 100, alignItems: 'center' },
  bgOrbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -80,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 120,
    left: -90,
  },

  heroBlock: {
    borderRadius: 28,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.24,
        shadowRadius: 26,
      },
      android: { elevation: 10 },
    }),
  },
  heroGlowTop: {
    position: 'absolute',
    right: -40,
    top: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroGlowBottom: {
    position: 'absolute',
    left: -30,
    bottom: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroRing: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  greeting: { color: 'rgba(255,255,255,0.88)', fontSize: Typography.fontSize.sm, fontWeight: '600' },
  userName: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroSummary: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    maxWidth: '90%',
  },

  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: Typography.fontSize.md, paddingVertical: 0 },

  visualPillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  visualPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 70,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  visualPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginBottom: 6,
  },
  visualPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  visualPillValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    marginTop: 2,
  },

  highlightsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.md,
    minHeight: 98,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  highlightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  highlightTitle: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  highlightSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
    lineHeight: 16,
  },

  insightRibbon: {
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  insightIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  insightTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  insightText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 17,
    marginTop: 2,
  },

  railCard: {
    borderRadius: 18,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  railSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
    marginBottom: Spacing.md,
  },
  railBars: {
    gap: 8,
  },
  railTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  railBarFill: {
    height: '100%',
    borderRadius: 999,
  },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  headerActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerActionText: { fontSize: 12, fontWeight: '700' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statTile: {
    width: CARD_W,
    borderRadius: 20,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', marginBottom: 2, letterSpacing: -0.2 },
  statLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  alertsList: { gap: Spacing.sm },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  alertLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  alertLabel: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: '700' },
  alertRight: { alignItems: 'flex-end' },
  alertAmount: { fontSize: Typography.fontSize.sm, fontWeight: '800' },
  alertDate: { fontSize: Typography.fontSize.xs, marginTop: 1 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: {
    width: CARD_W,
    borderRadius: 20,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  catIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  catLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginBottom: 2 },
  catAmount: { fontSize: Typography.fontSize.xl, fontWeight: '800', marginBottom: 2, letterSpacing: -0.2 },
  catCount: { fontSize: Typography.fontSize.xs },

  infoList: { gap: Spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  infoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSize.md, fontWeight: '700', marginBottom: 2 },
  infoSub: { fontSize: Typography.fontSize.xs },

  emptySlate: {
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlateTitle: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  emptySlateSub: { fontSize: Typography.fontSize.sm, marginTop: 4 },
});
