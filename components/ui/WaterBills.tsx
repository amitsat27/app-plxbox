import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { DataTable } from './DataTable';
import { Widget } from './Widget';
import { LineChart } from './LineChart';
import { Colors } from '../../theme/color';
import { Droplet, Filter, Download } from 'lucide-react-native';

interface WaterBill {
  id: string;
  date: string;
  units: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  [key: string]: any;
}

const mockWaterBills: WaterBill[] = [
  {
    id: '1',
    date: '2024-01-15',
    units: 15,
    amount: 1500,
    status: 'paid',
    dueDate: '2024-01-20',
  },
  {
    id: '2',
    date: '2024-02-15',
    units: 18,
    amount: 1800,
    status: 'paid',
    dueDate: '2024-02-20',
  },
  {
    id: '3',
    date: '2024-03-15',
    units: 16,
    amount: 1600,
    status: 'paid',
    dueDate: '2024-03-20',
  },
  {
    id: '4',
    date: '2024-04-15',
    units: 17,
    amount: 1700,
    status: 'pending',
    dueDate: '2024-04-20',
  },
  {
    id: '5',
    date: '2024-05-15',
    units: 19,
    amount: 1900,
    status: 'pending',
    dueDate: '2024-05-25',
  },
];

export const WaterBills: React.FC = () => {
  const [bills, setBills] = useState<WaterBill[]>(mockWaterBills);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [averageUnits, setAverageUnits] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Calculate statistics
    const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const avgUnits =
      bills.length > 0
        ? Math.round(bills.reduce((sum, bill) => sum + bill.units, 0) / bills.length)
        : 0;
    const paid = bills.filter((b) => b.status === 'paid').length;
    const pending = bills.filter((b) => b.status === 'pending').length;

    setTotalAmount(total);
    setAverageUnits(avgUnits);
    setPaidCount(paid);
    setPendingCount(pending);
    setLoading(false);
  }, [bills]);

  const chartData = bills.map((bill) => ({
    month: new Date(bill.date).toLocaleDateString('en-US', { month: 'short' }),
    units: bill.units,
  }));

  const renderStatus = (status: string) => {
    const statusConfig = {
      paid: { color: '#10B981', label: 'Paid' },
      pending: { color: '#F59E0B', label: 'Pending' },
      overdue: { color: '#EF4444', label: 'Overdue' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const tableColumns = [
    {
      key: 'date',
      label: 'Date',
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'units',
      label: 'Units',
      width: 100,
      align: 'right' as const,
      render: (value: number) => `${value} m³`,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 100,
      align: 'right' as const,
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      align: 'center' as const,
      render: (value: string) => renderStatus(value),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Droplet width={24} height={24} color="#3B82F6" strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Water Bills</Text>
              <Text style={styles.headerSubtitle}>Manage your water consumption</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter width={20} height={20} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Widget
            title="Total Amount"
            count={0}
            amount={totalAmount}
            icon={<Droplet width={24} height={24} color="#fff" strokeWidth={2} />}
            iconColor="#3B82F6"
            isMoney={true}
            trending={false}
          />
          <Widget
            title="Avg Units/Month"
            count={averageUnits}
            amount={0}
            icon={<Droplet width={24} height={24} color="#fff" strokeWidth={2} />}
            iconColor="#10B981"
            isMoney={false}
            trending={false}
          />
        </View>

        <View style={styles.statsGrid}>
          <Widget
            title="Bills Paid"
            count={paidCount}
            amount={0}
            icon={<Droplet width={24} height={24} color="#fff" strokeWidth={2} />}
            iconColor="#10B981"
            isMoney={false}
            trending={false}
          />
          <Widget
            title="Pending Bills"
            count={pendingCount}
            amount={0}
            icon={<Droplet width={24} height={24} color="#fff" strokeWidth={2} />}
            iconColor="#F59E0B"
            isMoney={false}
            trending={false}
          />
        </View>

        {/* Trend Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Consumption Trend</Text>
          <LineChart
            title="Monthly Consumption"
            data={chartData}
            lines={[
              {
                key: 'units',
                label: 'Units Consumed',
                color: '#3B82F6',
              },
            ]}
            yAxisLabel="Units (m³)"
          />
        </View>

        {/* Bills Table */}
        <DataTable
          title="All Bills"
          columns={tableColumns}
          data={bills}
          showRowNumbers={true}
          onRowPress={(row) => {
            console.log('Bill pressed:', row);
          }}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]}>
            <Download width={18} height={18} color="#fff" strokeWidth={2} />
            <Text style={styles.buttonText}>Download Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 8,
    gap: 8,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  spacer: {
    height: 20,
  },
});
