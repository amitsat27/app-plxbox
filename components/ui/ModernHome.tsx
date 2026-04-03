/**
 * 🎨 Premium Home Dashboard - iOS 18 Senior Design
 * Modern, clean, and performant dashboard with adaptive layout
 */

import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { useAuth } from "@/src/context/AuthContext";
import { firebaseService } from "@/src/services/FirebaseService";
import { Bill } from "@/src/types";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Icons
import {
    AlertCircle,
    ArrowRight,
    Droplet,
    Flame,
    Home,
    TrendingUp,
    Wifi,
    Zap,
    Plus,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DashboardCard {
  id: string;
  title: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  onPress?: () => void;
}

interface CategoryQuickAccess {
  id: string;
  name: string;
  amount: number;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export const ModernHome: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [loading, setLoading] = useState(!authLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [billCount, setBillCount] = useState(0);

  // Fetch data
  useEffect(() => {
    loadDashboardData();
  }, [user?.uid]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      // Use callback pattern for realtime updates
      const unsubscribe = firebaseService.getBills(
        user.uid,
        (billsData: Bill[]) => {
          setBills(billsData || []);
          const total =
            billsData?.reduce(
              (sum: number, bill: Bill) => sum + (bill.amount || 0),
              0,
            ) || 0;
          setTotalAmount(total);
          setBillCount(billsData?.length || 0);
        },
      );

      setLoading(false);
      return unsubscribe;
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  // Dashboard cards data
  const dashboardCards: DashboardCard[] = useMemo(
    () => [
      {
        id: "total-bills",
        title: "Total Bills",
        value: `₹${totalAmount.toLocaleString()}`,
        sublabel: `${billCount} bills`,
        icon: <Zap size={28} color="#fff" />,
        color: Colors.primary,
        trend: "+12%",
      },
      {
        id: "pending",
        title: "Pending",
        value: `${billCount}`,
        sublabel: "due soon",
        icon: <AlertCircle size={28} color="#fff" />,
        color: Colors.warning,
      },
      {
        id: "paid",
        title: "Paid This Month",
        value: `₹${(totalAmount * 0.7).toLocaleString()}`,
        sublabel: "70% of total",
        icon: <TrendingUp size={28} color="#fff" />,
        color: Colors.success,
        trend: "+5%",
      },
    ],
    [totalAmount, billCount],
  );

  // Quick category access
  const categoryQuickAccess: CategoryQuickAccess[] = [
    {
      id: "electricity",
      name: "Electricity",
      amount: 1200,
      count: 2,
      icon: <Zap size={24} color={Colors.primary} />,
      color: Colors.primary,
    },
    {
      id: "water",
      name: "Water",
      amount: 450,
      count: 1,
      icon: <Droplet size={24} color={Colors.primary} />,
      color: Colors.primary,
    },
    {
      id: "internet",
      name: "Internet",
      amount: 799,
      count: 1,
      icon: <Wifi size={24} color={Colors.primary} />,
      color: Colors.primary,
    },
    {
      id: "gas",
      name: "Gas",
      amount: 890,
      count: 1,
      icon: <Flame size={24} color={Colors.primary} />,
      color: Colors.primary,
    },
  ];

  const renderDashboardCard = (card: DashboardCard) => (
    <TouchableOpacity
      key={card.id}
      style={[
        styles.dashboardCard,
        {
          backgroundColor: isDark
            ? "rgba(124, 58, 237, 0.15)"
            : "rgba(124, 58, 237, 0.08)",
          borderColor: isDark ? theme.border.primary : theme.border.secondary,
        },
      ]}
      activeOpacity={0.7}
      onPress={card.onPress}
    >
      {/* Icon background */}
      <View style={[styles.cardIconBg, { backgroundColor: card.color }]}>
        {card.icon}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: scheme.textTertiary }]}>
          {card.title}
        </Text>
        <Text style={[styles.cardValue, { color: scheme.textPrimary }]}>
          {card.value}
        </Text>
        {card.sublabel && (
          <Text style={[styles.cardSublabel, { color: scheme.textTertiary }]}>
            {card.sublabel}
          </Text>
        )}
      </View>

      {card.trend && (
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>{card.trend}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategoryQuickAccess = (category: CategoryQuickAccess) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        {
          backgroundColor: theme.surface.primary,
          borderColor: theme.border.primary,
        },
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIconBg,
          {
            backgroundColor: isDark
              ? "rgba(124, 58, 237, 0.2)"
              : "rgba(124, 58, 237, 0.1)",
          },
        ]}
      >
        {category.icon}
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: scheme.textPrimary }]}>
          {category.name}
        </Text>
        <Text style={[styles.categoryAmount, { color: Colors.primary }]}>
          ₹{category.amount.toLocaleString()}
        </Text>
      </View>
      <ArrowRight size={20} color={scheme.textTertiary} />
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.surface.primary,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.surface.primary,
        },
      ]}
    >
      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.greeting, { color: scheme.textPrimary }]}>
            {`Good ${getTimeGreeting()}, Amit 👋`}
          </Text>
          <Text
            style={[styles.greetingSubtitle, { color: scheme.textTertiary }]}
          >
            Here's your bill summary
          </Text>
        </View>

        {/* Dashboard Cards - Grid */}
        <View style={styles.cardsGrid}>
          {dashboardCards.map(renderDashboardCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {
                  backgroundColor: theme.surface.secondary,
                  borderColor: theme.border.secondary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Plus size={28} color={Colors.primary} />
              <Text
                style={[styles.quickActionLabel, { color: scheme.textPrimary }]}
              >
                Add Bill
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {
                  backgroundColor: isDark
                    ? "rgba(124, 58, 237, 0.2)"
                    : "rgba(124, 58, 237, 0.1)",
                  borderColor: theme.border.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <TrendingUp size={28} color={Colors.primary} />
              <Text
                style={[styles.quickActionLabel, { color: scheme.textPrimary }]}
              >
                Analytics
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Quick Access */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
              Categories
            </Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={[styles.seeAllButton, { color: Colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {categoryQuickAccess.map(renderCategoryQuickAccess)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={[styles.seeAllButton, { color: Colors.primary }]}>
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {bills.slice(0, 3).map((bill) => (
            <View
              key={bill.id}
              style={[
                styles.activityItem,
                {
                  backgroundColor: theme.surface.primary,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.activityDot,
                  {
                    backgroundColor:
                      bill.status === "paid"
                        ? Colors.success
                        : bill.status === "overdue"
                          ? Colors.error
                          : Colors.warning,
                  },
                ]}
              />
              <View style={styles.activityInfo}>
                <Text
                  style={[styles.activityTitle, { color: scheme.textPrimary }]}
                >
                  {bill.title}
                </Text>
                <Text
                  style={[styles.activityDate, { color: scheme.textTertiary }]}
                >
                  {new Date(bill.dueDate).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.activityAmount, { color: Colors.primary }]}>
                ₹{bill.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {bills.length === 0 && (
          <View style={styles.emptyState}>
            <Home size={48} color={scheme.textTertiary} />
            <Text
              style={[styles.emptyStateTitle, { color: scheme.textPrimary }]}
            >
              No Bills Yet
            </Text>
            <Text
              style={[
                styles.emptyStateSubtitle,
                { color: scheme.textTertiary },
              ]}
            >
              Start by adding your first bill
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyStateButtonText}>
                Add Your First Bill
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    borderBottomWidth: 0.5,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "400",
  },
  cardsGrid: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
    paddingBottom: Spacing.xl,
  },
  dashboardCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowViolet,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  cardSublabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "400",
  },
  trendBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  trendText: {
    color: Colors.success,
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  categoriesSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  seeAllButton: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  categoriesGrid: {
    gap: Spacing.md,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  activitySection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  activityDate: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "400",
  },
  activityAmount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "400",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  emptyStateButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.card,
  },
  emptyStateButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
});

export default ModernHome;
