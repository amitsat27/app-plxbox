// 🌐 Premium Home Dashboard — Static Display
// Navigation lives in Sections tab only

import React, { useMemo, useRef, useEffect } from 'react';
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

  Gauge,
  CalendarClock,
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
  electric: { light: 'rgba(245,158,11,0.08)', dark: 'rgba(245,158,11,0.12)' },
  gas: { light: 'rgba(59,130,246,0.08)', dark: 'rgba(59,130,246,0.12)' },
  wifi: { light: 'rgba(139,92,246,0.08)', dark: 'rgba(139,92,246,0.12)' },
  property: { light: 'rgba(16,185,129,0.08)', dark: 'rgba(16,185,129,0.12)' },
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

// ── Stat Tile ──────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.statTile, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>{label}</Text>
    </View>
  );
}

// ── Category Card (static, no navigation) ──────────────────────────────────────

function CategoryCard({
  category,
  totalAmount,
  count,
}: {
  category: string;
  totalAmount: number;
  count: number;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const color = CATEGORY_COLORS[category] || Colors.primary;
  const icon = CATEGORY_ICONS[category] || <Home size={22} color={color} />;
  const label = CATEGORY_LABELS[category] || category;
  const bgTint = CATEGORY_BG_TINT[category]?.[isDark ? 'dark' : 'light'] || 'transparent';

  return (
    <View style={[styles.catCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <View style={[styles.catIcon, { backgroundColor: bgTint }]}>{icon}</View>
      <Text style={[styles.catName, { color: scheme.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.catAmount, { color }]}>
        ₹{totalAmount.toLocaleString('en-IN')}
      </Text>
      <Text style={[styles.catCount, { color: scheme.textTertiary }]}>
        {count} bill{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ── Info Row (static, no navigation) ───────────────────────────────────────────

function InfoRow({
  icon,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        {icon}
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: scheme.textPrimary }]}>{label}</Text>
        <Text style={[styles.infoSub, { color: scheme.textTertiary }]}>{sublabel}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const {
    categories,
    totalBillsAmount,
    totalBillsCount,
    pendingBills,
    overdueBills,
    vehicles,
    appliances,
    loading,
    allBills,
  } = useDashboardData(user?.uid);

  const displayName = user?.displayName || 'Amit';
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const fadeStats = useRef(new Animated.Value(0)).current;
  const fadeCats = useRef(new Animated.Value(0)).current;
  const fadeAlerts = useRef(new Animated.Value(0)).current;
  const fadeQuick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(80, [
        Animated.timing(fadeHeader, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeStats, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeCats, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAlerts, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeQuick, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, fadeHeader, fadeStats, fadeCats, fadeAlerts, fadeQuick]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Paid',
        value: `₹${totalBillsAmount.toLocaleString('en-IN')}`,
        icon: <Wallet size={18} color={Colors.primary} />,
      },
      {
        label: 'Bills',
        value: String(totalBillsCount),
        icon: <CalendarClock size={18} color="#8B5CF6" />,
      },
      {
        label: 'Vehicles',
        value: String(vehicles.length),
        icon: <Car size={18} color="#F59E0B" />,
      },
      {
        label: 'Appliances',
        value: String(appliances.length),
        icon: <Monitor size={18} color="#06B6D4" />,
      },
    ],
    [totalBillsAmount, totalBillsCount, vehicles, appliances],
  );

  const alerts = useMemo(() => {
    const pending = pendingBills.slice(0, 3).map((b) => ({
      id: b.id,
      type: 'pending' as const,
      label: b.title,
      amount: b.amount,
      date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));
    const overdue = overdueBills.slice(0, 3).map((b) => ({
      id: b.id,
      type: 'overdue' as const,
      label: b.title,
      amount: b.amount,
      date: new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));
    return [...pending, ...overdue];
  }, [pendingBills, overdueBills]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 8) + Spacing.sm,
            paddingBottom: Spacing.md,
            paddingHorizontal: Spacing.lg,
          },
        ]}
      >
        <Animated.View style={[{ opacity: fadeHeader }, styles.headerLeft]}>
          <Text style={[styles.greeting, { color: scheme.textTertiary }]}>
            {getTimeGreeting()}
          </Text>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>
            {displayName.split(' ')[0]}.
          </Text>
        </Animated.View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          activeOpacity={0.6}
          onPressIn={() => Animated.timing(fadeHeader, { toValue: 1, duration: 100, useNativeDriver: true }).start()}
          onPressOut={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/settings');
          }}
        >
          <Gauge size={18} color={isDark ? '#FFFFFF' : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!loading && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => {}} tintColor={Colors.primary} />
          }
        >
          {/* Stat Tiles */}
          <Animated.View style={{ opacity: fadeStats }}>
            <View style={styles.statGrid}>
              {stats.map((s) => (
                <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
              ))}
            </View>
          </Animated.View>

          {/* Category Cards */}
          <Animated.View style={{ opacity: fadeCats }}>
            <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>
              Bill Categories
            </Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.category}
                  category={cat.category}
                  totalAmount={cat.totalAmount}
                  count={cat.count}
                />
              ))}
            </View>
          </Animated.View>

          {/* Attention Needed */}
          {alerts.length > 0 && (
            <Animated.View style={{ opacity: fadeAlerts }}>
              <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>
                Attention Needed
              </Text>
              <View style={[styles.alertList, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                {alerts.map((a, i) => (
                  <React.Fragment key={a.id}>
                    {i > 0 && (
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      />
                    )}
                    <View style={styles.alertRow}>
                      <View
                        style={[
                          styles.alertDot,
                          {
                            backgroundColor:
                              a.type === 'overdue' ? '#EF4444' : '#F59E0B',
                          },
                        ]}
                      />
                      <View style={styles.alertInfo}>
                        <Text
                          style={[styles.alertName, { color: scheme.textPrimary }]}
                          numberOfLines={1}
                        >
                          {a.label}
                        </Text>
                        <Text style={[styles.alertDate, { color: scheme.textTertiary }]}>
                          Due {a.date}
                        </Text>
                      </View>
                      <Text style={[styles.alertAmt, { color: scheme.textPrimary }]}>
                        ₹{a.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Quick View */}
          <Animated.View style={{ opacity: fadeQuick }}>
            <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>
              Overview
            </Text>
            <View style={[styles.quickList, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <InfoRow
                icon={<Wallet size={18} color="#8B5CF6" />}
                label="All Bills"
                sublabel={`${allBills.length} records synced`}
              />
              <InfoRow
                icon={<Car size={18} color="#F59E0B" />}
                label="Vehicles"
                sublabel={`${vehicles.length} registered`}
              />
              <InfoRow
                icon={<Monitor size={18} color="#06B6D4" />}
                label="Appliances"
                sublabel={`${appliances.length} tracked`}
              />
            </View>
          </Animated.View>
        </ScrollView>
      )}

      {/* Loading */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statTile: {
    flex: 1,
    minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  catCard: {
    width: CARD_W,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  catName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  catAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginTop: 4,
  },
  catCount: {
    fontSize: Typography.fontSize.xs,
  },

  alertList: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  divider: { height: 0.5, marginLeft: 56 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  alertInfo: { flex: 1, minWidth: 0 },
  alertName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  alertDate: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  alertAmt: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },

  quickList: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
  },
  infoSub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
