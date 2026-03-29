import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Navbar } from './Navbar';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { Colors } from '../../theme/color';
import { Spacing, BorderRadius, Elevation, Typography, Animation } from '../../constants/designTokens';
import { useAuth } from '../../src/context/AuthContext';
import { useUIStore } from '../../src/stores/uiStore';
import { firebaseService } from '../../src/services/FirebaseService';
import { Bill, Vehicle, Appliance } from '@/src/types';
import {
  Zap,
  Droplet,
  Flame,
  Wifi,
  TrendingUp,
  Car,
  Home,
  Plug,
  Battery,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAGGER_DELAY = Animation.stagger.md; // 100ms

// Animation configuration
const getAnimationConfig = () => ({
  duration: Animation.normal,
  easing: Animation.easing.iosEaseOut,
});

// Stagger animation helper
const createStaggeredAnimation = (
  animatedValue: Animated.Value,
  index: number,
  delay: number = STAGGER_DELAY
) => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: Animation.normal,
    delay: index * delay,
    useNativeDriver: true,
  }).start();
};

// Skeleton loader component
const SkeletonCard: React.FC<{ style?: any; delay?: number }> = ({ style, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <LinearGradient
        colors={['#E5E5EA', '#F2F2F7', '#E5E5EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.skeletonGradient}
      />
    </Animated.View>
  );
};

// Metric Card Component with staggered animation
const MetricCard: React.FC<{
  index: number;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  gradient: [string, string];
  subtitle?: string;
  onPress?: () => void;
}> = ({ index, title, value, icon, color, gradient, subtitle, onPress }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.9)).current;
  const animatedTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    createStaggeredAnimation(animatedOpacity, index);
    Animated.spring(animatedScale, {
      toValue: 1,
      damping: 20,
      stiffness: 300,
      delay: index * STAGGER_DELAY,
      useNativeDriver: true,
    }).start();
    Animated.timing(animatedTranslateY, {
      toValue: 0,
      duration: Animation.normal,
      delay: index * STAGGER_DELAY,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.metricCardContainer,
        {
          opacity: animatedOpacity,
          transform: [{ scale: animatedScale }, { translateY: animatedTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.metricCardTouchable}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.metricCardGradient}
        >
          <BlurView intensity={20} tint="light" style={styles.metricCardBlur}>
            <View style={styles.metricCardContent}>
              <View style={[styles.metricIconContainer, { backgroundColor: `${color}30` }]}>
                {icon}
              </View>
              <View style={styles.metricTextContainer}>
                <Text style={styles.metricLabel}>{title}</Text>
                <Text style={styles.metricValue}>{value}</Text>
                {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Bill Category Card with staggered animation
const BillCategoryCard: React.FC<{
  index: number;
  category: string;
  amount: number;
  count: number;
  icon: React.ReactNode;
  color: string;
  status?: string;
}> = ({ index, category, amount, count, icon, color, status = 'paid' }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: Animation.normal,
      delay: index * STAGGER_DELAY + 200,
      useNativeDriver: true,
    }).start();
    Animated.spring(animatedScale, {
      toValue: 1,
      damping: 18,
      stiffness: 350,
      delay: index * STAGGER_DELAY + 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusColor = status === 'pending' ? Colors.warning : Colors.success;

  return (
    <Animated.View
      style={[
        styles.categoryCardContainer,
        {
          opacity: animatedOpacity,
          transform: [{ scale: animatedScale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.categoryCard}
      >
        <BlurView intensity={15} tint="light" style={styles.categoryCardBlur}>
          <View style={[styles.categoryIconWrapper, { backgroundColor: `${color}20` }]}>
            <View style={[styles.categoryIconContainer, { backgroundColor: color }]}>
              {icon}
            </View>
          </View>
          <Text style={styles.categoryName}>{category}</Text>
          <Text style={styles.categoryAmount}>₹{amount.toLocaleString()}</Text>
          <View style={styles.categoryFooter}>
            <Text style={styles.categoryCount}>{count} bills</Text>
            {status && (
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Vehicle & Appliance Summary Card
const SummaryCard: React.FC<{
  index: number;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  extra?: string;
}> = ({ index, title, count, icon, color, extra }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedTranslateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: Animation.normal,
      delay: index * STAGGER_DELAY + 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(animatedTranslateX, {
      toValue: 0,
      duration: Animation.slow,
      delay: index * STAGGER_DELAY + 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.summaryCardContainer,
        {
          opacity: animatedOpacity,
          transform: [{ translateX: animatedTranslateX }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} style={styles.summaryCard}>
        <BlurView intensity={10} tint="light" style={styles.summaryCardBlur}>
          <View style={[styles.summaryIconContainer, { backgroundColor: `${color}20` }]}>
            {icon}
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Text style={[styles.summaryCount, { color }]}>{count}</Text>
            {extra && <Text style={styles.summaryExtra}>{extra}</Text>}
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Chart Section with animation
const ChartSection: React.FC<{
  index: number;
  title: string;
  children: React.ReactNode;
  type: 'line' | 'pie';
}> = ({ index, title, children, type }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: Animation.slow,
      delay: index * STAGGER_DELAY + 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(animatedTranslateY, {
      toValue: 0,
      duration: Animation.slow,
      delay: index * STAGGER_DELAY + 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.chartSectionContainer,
        {
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }],
        },
      ]}
    >
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
      </View>
      <BlurView intensity={5} tint="light" style={styles.chartBlur}>
        {children}
      </BlurView>
    </Animated.View>
  );
};

// Empty State Component
const EmptyState: React.FC<{ delay?: number; isDark: boolean }> = ({ delay = 0, isDark }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(animatedScale, {
          toValue: 1,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.emptyStateContainerBase,
        {
          opacity: animatedOpacity,
          transform: [{ scale: animatedScale }],
          backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
        },
      ]}
    >
      <Home size={64} color={Colors.primary} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>No Data Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding bills, vehicles, and appliances to get insights and track your expenses
      </Text>
    </Animated.View>
  );
};

export const RedesignedHome: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useUIStore();
  const isDark = isDarkMode;

  const [bills, setBills] = useState<Bill[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🏠 RedesignedHome render:', {
    userUid: user?.uid,
    userEmail: user?.email,
    authLoading,
    billsCount: bills.length,
    vehiclesCount: vehicles.length,
    appliancesCount: appliances.length,
  });

  // Welcome section animation refs
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: Animation.normal,
        useNativeDriver: true,
      }).start();
      Animated.timing(welcomeTranslateY, {
        toValue: 0,
        duration: Animation.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);


  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = loadAllData();
      return () => {
        unsubscribe?.();
      };
    }
  }, [user?.uid]);

  const loadAllData = async () => {
    if (!user?.uid) {
      console.log('⚠️ No user UID available, aborting data load');
      return;
    }

    console.log('🔍 Loading data for user:', user.uid);
    setLoading(true);

    // Try legacy data first (pulsebox nested collections)
    console.log('📚 Trying to load legacy Pulsebox data...');
    try {
      const legacyData = await firebaseService.getAllPulseboxData(user.uid);
      console.log('✅ Legacy data loaded:', {
        bills: legacyData.bills.length,
        vehicles: legacyData.vehicles.length,
        appliances: legacyData.appliances.length,
      });

      if (legacyData.bills.length > 0 || legacyData.vehicles.length > 0 || legacyData.appliances.length > 0) {
        setBills(legacyData.bills);
        setVehicles(legacyData.vehicles);
        setAppliances(legacyData.appliances);
        setLoading(false);
        if (refreshing) setRefreshing(false);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading legacy data:', error);
    }

    // Fallback to new collection structure
    console.log('📋 Setting up real-time listeners for new collections...');

    // Load bills
    const unsubscribeBills = firebaseService.getBills(user.uid, (data) => {
      console.log('✅ Bills data received:', data.length, 'bills');
      setBills(data);
    });

    // Load vehicles
    const unsubscribeVehicles = firebaseService.getVehicles(user.uid, (data) => {
      console.log('✅ Vehicles data received:', data.length, 'vehicles');
      setVehicles(data);
    });

    // Load appliances
    const unsubscribeAppliances = firebaseService.getAppliances(user.uid, (data) => {
      console.log('✅ Appliances data received:', data.length, 'appliances');
      setAppliances(data);
      // Set loading to false after all data loaded (approximate)
      setTimeout(() => setLoading(false), 500);
    });

    if (refreshing) setRefreshing(false);

    return () => {
      console.log('🧹 Cleaning up listeners');
      unsubscribeBills?.();
      unsubscribeVehicles?.();
      unsubscribeAppliances?.();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadAllData();
  };

  // Calculate aggregated data
  const billData = useMemo(() => {
    const categories: Record<string, { amount: number; count: number; color: string; label: string; icon: any }> = {
      electric: { amount: 0, count: 0, color: Colors.tertiary, label: 'Electric', icon: Zap },
      water: { amount: 0, count: 0, color: Colors.info, label: 'Water', icon: Droplet },
      gas: { amount: 0, count: 0, color: Colors.danger, label: 'Gas', icon: Flame },
      wifi: { amount: 0, count: 0, color: Colors.primary, label: 'WiFi', icon: Wifi },
      property: { amount: 0, count: 0, color: Colors.tertiary, label: 'Property', icon: Home },
    };

    bills.forEach((bill) => {
      if (categories[bill.category]) {
        categories[bill.category].amount += bill.amount;
        categories[bill.category].count += 1;
      }
    });

    return Object.entries(categories)
      .filter(([, data]) => data.count > 0)
      .map(([id, data]) => ({
        id,
        name: data.label,
        icon: React.createElement(data.icon, { width: 24, height: 24, color: '#fff', strokeWidth: 2 }),
        color: data.color,
        amount: data.amount,
        count: data.count,
      }));
  }, [bills]);

  // Monthly spending trend
  const monthlySpending = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    bills.forEach((bill) => {
      const date = new Date(bill.dueDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + bill.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
      .map(([month, value]) => ({ month, value }));
  }, [bills]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return billData.map((cat) => ({
      name: cat.name,
      value: cat.amount,
      color: cat.color,
    }));
  }, [billData]);

  // Summary calculations
  const totalBillsAmount = billData.reduce((sum, cat) => sum + cat.amount, 0);
  const totalBillsCount = billData.reduce((sum, cat) => sum + cat.count, 0);
  const pendingBills = bills.filter(b => b.status === 'pending');
  const pendingAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const overdueBills = bills.filter(b => b.status === 'overdue');
  const overdueAmount = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

  // Welcome greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={isDark ? [Colors.surfaceDark, Colors.backgroundDark] : [Colors.surface, Colors.background]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Navbar title="Dashboard" showSearch={false} userName={user?.displayName || 'User'} />
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
            {/* Skeleton loaders */}
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} delay={i * 100} style={styles.skeletonMetricCard} />
            ))}
            <SkeletonCard delay={400} style={styles.skeletonSection} />
            <SkeletonCard delay={500} style={styles.skeletonSection} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const hasData = bills.length > 0 || vehicles.length > 0 || appliances.length > 0;

  return (
    <LinearGradient
      colors={isDark ? [Colors.surfaceDark, Colors.backgroundDark] : [Colors.surface, Colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Premium Navbar */}
          <Navbar
            title="Dashboard"
            showSearch={true}
            onSearchPress={() => {}}
            onNotificationPress={() => {}}
            notificationCount={0}
            userName={user?.displayName || 'User'}
          />

          {/* Welcome Section with staggered animation */}
          <Animated.View
            style={[
              styles.welcomeSection,
              {
                opacity: welcomeOpacity,
                transform: [{ translateY: welcomeTranslateY }],
              },
            ]}
          >
            <Animated.Text style={styles.welcomeGreeting}>
              {getGreeting()}
            </Animated.Text>
            <Animated.Text style={styles.welcomeName}>
              {user?.displayName?.split(' ')[0] || 'User'}
            </Animated.Text>
            <Text style={styles.welcomeSubtext}>
              Here's your financial overview
            </Text>
          </Animated.View>

          {/* Key Metrics - 4 Cards Grid */}
          <View style={styles.metricsGrid}>
            <MetricCard
              index={0}
              title="Total Bills"
              value={`₹${totalBillsAmount.toLocaleString()}`}
              icon={<TrendingUp size={22} color={Colors.primary} strokeWidth={2} />}
              color={Colors.primary}
              gradient={['#007AFF', '#5AC8FA']}
              subtitle={`${totalBillsCount} bills`}
            />
            <MetricCard
              index={1}
              title="Pending"
              value={`₹${pendingAmount.toLocaleString()}`}
              icon={<Clock size={22} color={Colors.warning} strokeWidth={2} />}
              color={Colors.warning}
              gradient={['#FF9500', '#FFCC00']}
              subtitle={`${pendingBills.length} pending`}
            />
            <MetricCard
              index={2}
              title="Overdue"
              value={`₹${overdueAmount.toLocaleString()}`}
              icon={<AlertCircle size={22} color={Colors.error} strokeWidth={2} />}
              color={Colors.error}
              gradient={['#FF3B30', '#FF6954']}
              subtitle={`${overdueBills.length} overdue`}
            />
            <MetricCard
              index={3}
              title="Vehicles"
              value={vehicles.length}
              icon={<Car size={22} color={Colors.secondary} strokeWidth={2} />}
              color={Colors.secondary}
              gradient={['#34C759', '#5FF963']}
              subtitle="Active"
            />
          </View>

          {/* Bill Categories Grid */}
          {billData.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bill Categories</Text>
              </View>
              <View style={styles.categoryGrid}>
                {billData.map((category, index) => (
                  <BillCategoryCard
                    key={category.id}
                    index={index}
                    category={category.name}
                    amount={category.amount}
                    count={category.count}
                    icon={category.icon}
                    color={category.color}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Summary Row: Vehicles & Appliances */}
          {(vehicles.length > 0 || appliances.length > 0) && (
            <View style={styles.summaryRow}>
              {vehicles.length > 0 && (
                <SummaryCard
                  index={0}
                  title="Vehicles"
                  count={vehicles.length}
                  icon={<Car size={24} color={Colors.secondary} />}
                  color={Colors.secondary}
                  extra={`${vehicles.filter(v => v.isActive).length} active`}
                />
              )}
              {appliances.length > 0 && (
                <SummaryCard
                  index={1}
                  title="Appliances"
                  count={appliances.length}
                  icon={<Home size={24} color={Colors.tertiary} />}
                  color={Colors.tertiary}
                  extra={`${appliances.filter(a => a.isActive).length} active`}
                />
              )}
            </View>
          )}

          {/* Spending Trends Chart */}
          {monthlySpending.length > 0 && (
            <ChartSection index={0} title="Spending Trends" type="line">
              <View style={[
                styles.chartWrapperBase,
                { backgroundColor: isDark ? Colors.surfaceDark : Colors.surface }
              ]}>
                <LineChart
                  title=""
                  data={monthlySpending}
                  lines={[
                    {
                      key: 'value',
                      label: 'Spending',
                      color: Colors.primary,
                    },
                  ]}
                  yAxisLabel="₹"
                />
              </View>
            </ChartSection>
          )}

          {/* Bill Distribution Pie Chart */}
          {pieChartData.length > 0 && (
            <ChartSection index={1} title="Bill Distribution" type="pie">
              <View style={[
                styles.pieChartContainerBase,
                { backgroundColor: isDark ? Colors.surfaceDark : Colors.surface }
              ]}>
                <PieChart title="" data={pieChartData} />
              </View>
            </ChartSection>
          )}

          {/* Empty State */}
          {!hasData && (
            <EmptyState delay={0} isDark={isDark} />
          )}

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  // navbarSpacer removed - Navbar is now rendered directly
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Skeleton styles
  skeleton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  skeletonGradient: {
    flex: 1,
    height: 100,
  },
  skeletonMetricCard: {
    height: 120,
  },
  skeletonSection: {
    height: 280,
  },
  // Welcome Section
  welcomeSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  welcomeGreeting: {
    fontSize: Typography.presets.caption1.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeName: {
    fontSize: Typography.fontSize.xxxl + 4,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: Spacing.xs,
  },
  welcomeSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCardContainer: {
    width: '47%',
  },
  metricCardTouchable: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  metricCardGradient: {
    padding: 1,
    borderRadius: BorderRadius.xl,
  },
  metricCardBlur: {
    borderRadius: BorderRadius.xl - 1,
    padding: Spacing.lg,
  },
  metricCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTextContainer: {
    flex: 1,
  },
  metricLabel: {
    fontSize: Typography.presets.caption1.fontSize,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  metricSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  // Category Cards
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryCardContainer: {
    width: '47%',
  },
  categoryCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  categoryCardBlur: {
    borderRadius: BorderRadius.xl - 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  categoryIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Summary Row (Vehicles/Appliances)
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryCardContainer: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  summaryCardBlur: {
    borderRadius: BorderRadius.xl - 1,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: Typography.presets.caption1.fontSize,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryExtra: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  // Chart Sections
  chartSectionContainer: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  chartBlur: {
    borderRadius: BorderRadius.xl,
    padding: 1,
  },
  chartHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: Typography.presets.title3.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  chartWrapperBase: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.md,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: Elevation.md.elevation,
      },
    }),
  },
  pieChartContainerBase: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.md,
    marginTop: 0,
  },
  // Empty State
  emptyStateContainerBase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  spacer: {
    height: Spacing.xxxl * 2,
  },
});

export default RedesignedHome;
