import React, { ErrorInfo, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// LinearGradient temporarily disabled for Expo Go compatibility
// Will work in standalone builds
import {
  Spacing,
  Typography
} from "@/constants/designTokens";
import { useAuth } from "@/src/context/AuthContext";
import { firebaseService } from "@/src/services/FirebaseService";
import { useUIStore } from "@/src/stores/uiStore";
import { Appliance, Bill, Vehicle } from "@/src/types";
import { Colors } from "@/theme/color";
import { useRouter } from "expo-router";

// New components
import Navbar from "./Navbar";
import EmptyState from "./cards/EmptyState";
import CategoriesSection from "./home/CategoriesSection";
import ChartsSection from "./home/ChartsSection";
import MetricsGrid from "./home/MetricsGrid";
import SummarySection from "./home/SummarySection";
import WelcomeSection from "./home/WelcomeSection";

// Global error handler for debugging
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    originalError("📢 Console Error:", ...args);
  };
  const originalWarn = console.warn;
  console.warn = (...args) => {
    originalWarn("⚠️ Console Warn:", ...args);
  };
}

// Error boundary for charts
interface ErrorBoundaryState {
  hasError: boolean;
}
class ChartsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Charts section error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: Colors.textSecondary }}>
            {" "}
            Charts unavailable{" "}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Icons
import {
  AlertCircle,
  Car,
  Clock,
  Droplet,
  Flame,
  Home,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Premium Home Dashboard - iOS 18+ Design
 * Complete redesign with production-quality components
 */
export const RedesignedHome: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useUIStore();
  const isDark = isDarkMode;

  const [bills, setBills] = useState<Bill[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  console.log("🏠 RedesignedHome render:", {
    userUid: user?.uid,
    userEmail: user?.email,
    authLoading,
    billsCount: bills.length,
    vehiclesCount: vehicles.length,
    appliancesCount: appliances.length,
  });

  useEffect(() => {
    if (user?.uid) {
      loadAllData();
    }
  }, [user?.uid]);

  const loadAllData = async () => {
    if (!user?.uid) {
      console.log("⚠️ No user UID available, aborting data load");
      return;
    }

    console.log("🔍 Loading data for user:", user.uid);
    setLoading(true);

    // Try legacy data first (pulsebox nested collections)
    console.log("📚 Trying to load legacy Pulsebox data...");
    try {
      const legacyData = await firebaseService.getAllPulseboxData(user.uid);
      console.log("✅ Legacy data loaded:", {
        bills: legacyData.bills.length,
        vehicles: legacyData.vehicles.length,
        appliances: legacyData.appliances.length,
      });

      if (
        legacyData.bills.length > 0 ||
        legacyData.vehicles.length > 0 ||
        legacyData.appliances.length > 0
      ) {
        setBills(legacyData.bills);
        setVehicles(legacyData.vehicles);
        setAppliances(legacyData.appliances);
        setLoading(false);
        if (refreshing) setRefreshing(false);
        return;
      }
    } catch (error) {
      console.error("❌ Error loading legacy data:", error);
    }

    // Fallback to new collection structure
    console.log("📋 Setting up real-time listeners for new collections...");

    // Load bills
    const unsubscribeBills = firebaseService.getBills(user.uid, (data) => {
      console.log("✅ Bills data received:", data.length, "bills");
      setBills(data);
    });

    // Load vehicles
    const unsubscribeVehicles = firebaseService.getVehicles(
      user.uid,
      (data) => {
        console.log("✅ Vehicles data received:", data.length, "vehicles");
        setVehicles(data);
      },
    );

    // Load appliances
    const unsubscribeAppliances = firebaseService.getAppliances(
      user.uid,
      (data) => {
        console.log("✅ Appliances data received:", data.length, "appliances");
        setAppliances(data);
        // Set loading to false after all data loaded (approximate)
        setTimeout(() => setLoading(false), 500);
      },
    );

    if (refreshing) setRefreshing(false);

    return () => {
      console.log("🧹 Cleaning up listeners");
      unsubscribeBills?.();
      unsubscribeVehicles?.();
      unsubscribeAppliances?.();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Unmount and remount effect will reload data
    // Or call loadAllData() directly
    loadAllData();
  };

  // Calculate aggregated data
  const billData = useMemo(() => {
    const categories: Record<
      string,
      { amount: number; count: number; color: string; label: string; icon: any }
    > = {
      electric: {
        amount: 0,
        count: 0,
        color: Colors.categoryElectric,
        label: "Electric",
        icon: Zap,
      },
      water: {
        amount: 0,
        count: 0,
        color: Colors.categoryWater,
        label: "Water",
        icon: Droplet,
      },
      gas: {
        amount: 0,
        count: 0,
        color: Colors.categoryGas,
        label: "Gas",
        icon: Flame,
      },
      wifi: {
        amount: 0,
        count: 0,
        color: Colors.categoryWifi,
        label: "WiFi",
        icon: Wifi,
      },
      property: {
        amount: 0,
        count: 0,
        color: Colors.categoryProperty,
        label: "Property",
        icon: Home,
      },
    };

    bills.forEach((bill) => {
      if (categories[bill.category]) {
        // Ensure amount is valid
        const amount = isFinite(bill.amount) ? bill.amount : 0;
        categories[bill.category].amount += amount;
        categories[bill.category].count += 1;
      }
    });

    return Object.entries(categories)
      .filter(([, data]) => data.count > 0)
      .map(([id, data]) => ({
        id,
        name: data.label,
        icon: data.icon,
        color: data.color,
        amount: data.amount,
        count: data.count,
      }));
  }, [bills]);

  // Monthly spending trend
  const monthlySpending = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    bills.forEach((bill) => {
      // Validate amount
      const amount = isFinite(bill.amount) ? bill.amount : 0;
      // Validate date
      const date = new Date(bill.dueDate);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
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
  const totalBillsAmount = billData.reduce(
    (sum, cat) => sum + (isFinite(cat.amount) ? cat.amount : 0),
    0,
  );
  const totalBillsCount = billData.reduce((sum, cat) => sum + cat.count, 0);
  const pendingBills = bills.filter((b) => b.status === "pending");
  const pendingAmount = pendingBills.reduce(
    (sum, bill) => sum + (isFinite(bill.amount) ? bill.amount : 0),
    0,
  );
  const overdueBills = bills.filter((b) => b.status === "overdue");
  const overdueAmount = overdueBills.reduce(
    (sum, bill) => sum + (isFinite(bill.amount) ? bill.amount : 0),
    0,
  );

  // Welcome greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <View
        style={[
          styles.gradient,
          {
            backgroundColor: isDark ? Colors.backgroundDark : Colors.background,
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <Navbar title="Dashboard" userName={user?.displayName || "User"} />
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
            {/* Simple placeholder for loading */}
            <View style={styles.loadingPlaceholder} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const hasData =
    bills.length > 0 || vehicles.length > 0 || appliances.length > 0;

  // Prepare metrics array
  const metrics = [
    {
      title: "Total Bills",
      value: `₹${totalBillsAmount.toLocaleString()}`,
      icon: <TrendingUp size={32} color="#FFF" strokeWidth={2.5} />,
      color: Colors.primary,
      subtitle: `${totalBillsCount} bills`,
    },
    {
      title: "Pending",
      value: `₹${pendingAmount.toLocaleString()}`,
      icon: <Clock size={32} color="#FFF" strokeWidth={2.5} />,
      color: Colors.warning,
      subtitle: `${pendingBills.length} pending`,
    },
    {
      title: "Overdue",
      value: `₹${overdueAmount.toLocaleString()}`,
      icon: <AlertCircle size={32} color="#FFF" strokeWidth={2.5} />,
      color: Colors.error,
      subtitle: `${overdueBills.length} overdue`,
    },
    {
      title: "Vehicles",
      value: vehicles.length,
      icon: <Car size={32} color="#FFF" strokeWidth={2.5} />,
      color: Colors.secondary,
      subtitle: `${vehicles.filter((v) => v.isActive).length} active`,
    },
  ];

  // Prepare categories array
  const categories = billData;

  // Prepare summary items
  const vehiclesSummary =
    vehicles.length > 0
      ? {
          id: "vehicles",
          title: "Vehicles",
          count: vehicles.length,
          icon: <Car size={28} color={Colors.secondary} strokeWidth={2.5} />,
          color: Colors.secondary,
          extra: `${vehicles.filter((v) => v.isActive).length} active`,
        }
      : undefined;

  const appliancesSummary =
    appliances.length > 0
      ? {
          id: "appliances",
          title: "Appliances",
          count: appliances.length,
          icon: <Home size={28} color={Colors.tertiary} strokeWidth={2.5} />,
          color: Colors.tertiary,
          extra: `${appliances.filter((a) => a.isActive).length} active`,
        }
      : undefined;

  return (
    <View
      style={[
        styles.gradient,
        { backgroundColor: isDark ? Colors.backgroundDark : Colors.background },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={
                isDark ? Colors.surfaceDark : Colors.surface
              }
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Navbar */}
          <Navbar
            title="Dashboard"
            onSearchPress={() => {}}
            userName={user?.displayName || "User"}
          />

          {/* Welcome Section */}
          <WelcomeSection />

          {/* Metrics Grid */}
          <MetricsGrid metrics={metrics} />

          {/* Bill Categories */}
          {billData.length > 0 && <CategoriesSection categories={categories} />}

          {/* Charts */}
          {(monthlySpending.length > 0 || pieChartData.length > 0) && (
            <ChartsErrorBoundary>
              <ChartsSection
                monthlySpending={monthlySpending}
                pieChartData={pieChartData}
              />
            </ChartsErrorBoundary>
          )}

          {/* Summary Row */}
          {(vehicles.length > 0 || appliances.length > 0) && (
            <SummarySection
              vehicles={vehiclesSummary ? [vehiclesSummary] : []}
              appliances={appliancesSummary ? [appliancesSummary] : []}
            />
          )}

          {/* Empty State */}
          {!hasData && (
            <EmptyState
              onAddBill={() => router.push("/(tabs)/add-bill" as any)}
              onAddVehicle={() => router.push("/(tabs)/add-vehicle" as any)}
              onAddAppliance={() => router.push("/(tabs)/add-appliance" as any)}
            />
          )}

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  loadingPlaceholder: {
    height: 600,
  },
  spacer: {
    height: Spacing.xxxl * 2,
  },
});

export default RedesignedHome;
