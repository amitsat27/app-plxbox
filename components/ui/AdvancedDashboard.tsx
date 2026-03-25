import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GlassContainer } from './GlassContainer';
import { Colors } from '../../theme/color';
import { StatCard, BillCard, EmptyState } from './Cards';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { billAlertsService } from '../../src/services/BillAlertsService';
import { firebaseService, DashboardMetric, Bill } from '../../src/services/FirebaseService';
import { Activity, Zap, Car, TrendingUp, Plus, Calendar, AlertCircle, Bell } from 'lucide-react-native';

export const AdvancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBills, setTotalBills] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);

      // Fetch metrics
      const unsubscribeMetrics = firebaseService.getMetrics(user.uid, (data) => {
        setMetrics(data);
        setLoading(false);
      });

      // Fetch bills
      const unsubscribeBills = firebaseService.getBills(user.uid, (data) => {
        setBills(data);
        const total = data.reduce((sum, bill) => sum + bill.amount, 0);
        setTotalBills(total);
      });

      // Subscribe to bill alerts
      billAlertsService.subscribeToAlerts(user.uid, (newAlerts) => {
        setAlerts(newAlerts.filter(alert => alert.severity !== 'info'));
      });

      return () => {
        unsubscribeMetrics();
        unsubscribeBills();
        billAlertsService.unsubscribeAll();
      };
    }
  }, [user?.uid]);

  const activeBills = bills.filter((b) => b.status !== 'paid');
  const pendingAmount = activeBills.reduce((sum, bill) => sum + bill.amount, 0);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Summary */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Welcome back, {user?.displayName || 'User'}! 👋</Text>
            {(unreadNotifications > 0 || criticalAlerts.length > 0) && (
              <View style={styles.notificationBadges}>
                {unreadNotifications > 0 && (
                  <View style={[styles.badge, styles.notificationBadge]}>
                    <Bell size={14} color="#fff" />
                    <Text style={styles.badgeText}>{unreadNotifications}</Text>
                  </View>
                )}
                {criticalAlerts.length > 0 && (
                  <View style={[styles.badge, styles.criticalBadge]}>
                    <AlertCircle size={14} color="#fff" />
                    <Text style={styles.badgeText}>{criticalAlerts.length}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <GlassContainer style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Bills</Text>
                <Text style={styles.summaryValue}>₹{totalBills.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  ₹{pendingAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </GlassContainer>
        </View>

        {/* Active Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <View style={styles.alertsBanner}>
            {criticalAlerts.slice(0, 2).map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <AlertCircle size={16} color={Colors.danger} />
                <Text style={styles.alertText} numberOfLines={1}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {warningAlerts.length > 0 && criticalAlerts.length === 0 && (
          <View style={styles.warningBanner}>
            {warningAlerts.slice(0, 1).map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <AlertCircle size={16} color="#D97706" />
                <Text style={styles.warningText} numberOfLines={1}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Key Metrics Section */}
        {metrics.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.metricsGrid}>
              {metrics.slice(0, 2).map((metric) => (
                <StatCard
                  key={metric.id}
                  title={metric.title}
                  value={metric.value}
                  unit={metric.unit}
                  color={metric.color || Colors.primary}
                  trend={metric.trend}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* Bills Section */}
        <View style={styles.billsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {activeBills.length > 0 ? (
            <View>
              {activeBills.slice(0, 3).map((bill) => (
                <BillCard
                  key={bill.id}
                  title={bill.title}
                  amount={bill.amount}
                  dueDate={bill.dueDate}
                  status={bill.status}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Calendar color={Colors.textSecondary} size={48} />}
              title="No Active Bills"
              description="All your bills are paid up! Great job maintaining your finances."
            />
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Plus color={Colors.primary} size={24} />
            </View>
            <Text style={styles.actionLabel}>Add Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <TrendingUp color={Colors.accent} size={24} />
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Activity color={Colors.success} size={24} />
            </View>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Footer spacer */}
        <View style={styles.spacer} />
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationBadge: {
    backgroundColor: Colors.primary,
  },
  criticalBadge: {
    backgroundColor: Colors.danger,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  metricsGrid: {
    marginBottom: 20,
  },
  billsSection: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    width: '31%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  spacer: {
    height: 50,
  },
  alertsBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  warningBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
});
