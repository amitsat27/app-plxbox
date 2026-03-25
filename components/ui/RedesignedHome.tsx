import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Navbar } from './Navbar';
import { Widget } from './Widget';
import { Featured } from './Featured';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { Colors } from '../../theme/color';
import {
  Zap,
  Droplet,
  Flame,
  Wifi,
  Truck,
  Home,
  TrendingUp,
  ArrowRight,
} from 'lucide-react-native';

interface BillCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  amount: number;
  count: number;
}

interface LineChartDataPoint {
  month: string;
  value?: number;
  [key: string]: any;
}

interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export const RedesignedHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [billCategories, setBillCategories] = useState<BillCategory[]>([]);
  const [chartData, setChartData] = useState<LineChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);

  useEffect(() => {
    // Generate mock categories
    const mockCategories: BillCategory[] = [
      {
        id: '1',
        name: 'Electric',
        icon: <Zap width={24} height={24} color="#fff" strokeWidth={2} />,
        color: '#FDB022',
        amount: 4920,
        count: 5,
      },
      {
        id: '2',
        name: 'Water',
        icon: <Droplet width={24} height={24} color="#fff" strokeWidth={2} />,
        color: '#3B82F6',
        amount: 2500,
        count: 5,
      },
      {
        id: '3',
        name: 'Gas',
        icon: <Flame width={24} height={24} color="#fff" strokeWidth={2} />,
        color: '#EF4444',
        amount: 1800,
        count: 5,
      },
      {
        id: '4',
        name: 'WiFi',
        icon: <Wifi width={24} height={24} color="#fff" strokeWidth={2} />,
        color: '#6366F1',
        amount: 999,
        count: 5,
      },
    ];

    setBillCategories(mockCategories);

    // Generate chart data
    const mockChartData: LineChartDataPoint[] = [
      { month: 'Jan', value: 4200 },
      { month: 'Feb', value: 5040 },
      { month: 'Mar', value: 4560 },
      { month: 'Apr', value: 4920 },
      { month: 'May', value: 5300 },
    ];

    setChartData(mockChartData);

    // Generate pie chart data
    const mockPieData: PieChartDataPoint[] = mockCategories.map((cat) => ({
      name: cat.name,
      value: cat.amount,
      color: cat.color,
    }));

    setPieChartData(mockPieData);
  }, []);

  const totalAmount = billCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalBills = billCategories.reduce((sum, cat) => sum + cat.count, 0);

  const renderCategoryIcon = (icon: React.ReactNode) => icon;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Navbar */}
        <Navbar
          title="Dashboard"
          showSearch={true}
          notificationCount={2}
          userName="John Doe"
        />

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, User! 👋</Text>
            <Text style={styles.welcomeSubtext}>Here's your bill summary for this month</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Total Bills</Text>
              <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <TrendingUp width={24} height={24} color={Colors.primary} strokeWidth={2} />
            </View>
          </View>

          <View style={[styles.summaryCard, styles.secondaryCard]}>
            <View>
              <Text style={[styles.summaryLabel, styles.secondaryLabel]}>
                Pending Bills
              </Text>
              <Text style={[styles.summaryValue, styles.secondaryValue]}>
                {totalBills}
              </Text>
            </View>
            <View style={[styles.summaryIcon, styles.secondaryIcon]}>
              <Home width={24} height={24} color="#fff" strokeWidth={2} />
            </View>
          </View>
        </View>

        {/* Bill Categories Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bill Categories</Text>
            <TouchableOpacity>
              <ArrowRight width={20} height={20} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryGrid}>
            {billCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                  {renderCategoryIcon(category.icon)}
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryAmount}>₹{category.amount.toLocaleString()}</Text>
                <Text style={styles.categoryCount}>{category.count} bills</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <Featured
            title="Key Metrics"
            subtitle="This Month"
            data={billCategories.map((cat) => ({
              label: cat.name,
              value: cat.amount,
              change: 2.5,
              trend: 'up' as const,
            }))}
          />
        </View>

        {/* Spending Trends Chart */}
        <View style={styles.chartSection}>
          <LineChart
            title="Spending Trend"
            data={chartData}
            lines={[
              {
                key: 'value',
                label: 'Total Spending',
                color: Colors.primary,
              },
            ]}
            yAxisLabel="Amount (₹)"
          />
        </View>

        {/* Bill Distribution Pie Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Bill Distribution</Text>
          <View style={styles.pieChartContainer}>
            <PieChart title="Distribution" data={pieChartData} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F650' }]}>
                <Zap width={20} height={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>Pay Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B98150' }]}>
                <TrendingUp width={20} height={20} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>View Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B50' }]}>
                <Home width={20} height={20} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginVertical: 8,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryCard: {
    backgroundColor: '#6366F1',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.9,
  },
  secondaryLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  secondaryValue: {
    color: '#fff',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    marginHorizontal: 12,
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartSection: {
    marginHorizontal: 12,
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pieChartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  spacer: {
    height: 20,
  },
});
