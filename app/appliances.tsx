/**
 * Appliances Screen — Premium smart-home + finance hybrid experience
 * Inspired by Groww, Zerodha, Apple Home aesthetics
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { Spacing, BorderRadius } from '@/constants/designTokens';
import { ChevronLeft, Plus, Search } from 'lucide-react-native';
import { useApplianceData } from '@/src/hooks/useApplianceData';
import type { ApplianceCategory } from '@/src/types';

import ApplianceCard from '@/components/appliances/ApplianceCard';
import ApplianceSummaryCard from '@/components/appliances/ApplianceSummaryCard';
import SmartInsightsSection from '@/components/appliances/SmartInsightsSection';
import CategoryFilterRow from '@/components/appliances/CategoryFilterRow';
import ShimmerCard from '@/components/appliances/ShimmerCard';

const CATEGORY_KEYS: string[] = ['all', 'kitchen', 'living', 'bedroom', 'bathroom', 'other'];

export default function AppliancesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const { appliances, loading, stats, alerts, insights } = useApplianceData(user?.uid);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Filter appliances
  const filtered = selectedCategory === 'all'
    ? appliances
    : appliances.filter((a) => a.category === selectedCategory);

  const attentionCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;

  // Alerts section
  const renderAlerts = () => {
    if (!alerts.length) return null;

    return (
      <View style={styles.alertsSection}>
        {alerts.slice(0, 3).map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertRow,
              {
                backgroundColor: alert.severity === 'critical'
                  ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
                  : alert.severity === 'warning'
                    ? (isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)')
                    : (isDark ? 'rgba(100,116,139,0.1)' : 'rgba(100,116,139,0.06)'),
                borderColor: alert.severity === 'critical'
                  ? 'rgba(239,68,68,0.2)'
                  : alert.severity === 'warning'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(100,116,139,0.15)',
              },
            ]}
          >
            <View style={[styles.alertDot, { backgroundColor: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : '#64748B' }]} />
            <Text style={[styles.alertText, { color: scheme.textPrimary }]} numberOfLines={2}>
              {alert.message}
            </Text>
            <Text style={[styles.alertDays, {
              color: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'warning' ? '#F59E0B' : scheme.textTertiary,
            }]}>
              {alert.daysLeft <= 0 ? 'Expired' : `${alert.daysLeft}d`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      <ApplianceSummaryCard
        stats={{
          total: stats.total,
          active: stats.active,
          totalCost: stats.totalCost,
          attentionCount,
        }}
      />

      {renderAlerts()}

      <SmartInsightsSection insights={insights} />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🔌</Text>
      <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>
        No appliances yet
      </Text>
      <Text style={[styles.emptySub, { color: scheme.textTertiary }]}>
        Tap the + button to add your first appliance
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={styles.headerPlaceholder} />
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <ShimmerCard variant="summary" />
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: scheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 4 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ChevronLeft size={26} color={scheme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchIconWrap}
            hitSlop={12}
          >
            <Search size={22} color={scheme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View>
          <Text style={[styles.title, { color: scheme.textPrimary }]}>
            Appliances
          </Text>
          <Text style={[styles.subtitle, { color: scheme.textTertiary }]}>
            {appliances.length} device{appliances.length !== 1 ? 's' : ''} · Total {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalCost)}
          </Text>
        </View>
      </View>

      {/* Category Filter */}
      <CategoryFilterRow selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Animated Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <View style={styles.halfWidth}>
              <ApplianceCard appliance={item} />
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
        />
      </Animated.View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#7C3AED' }]}
        onPress={() => router.push('/add-appliance')}
        activeOpacity={0.8}
      >
        <Plus size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerPlaceholder: { height: 88, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 0 },
  halfWidth: { width: '49%' },
  alertsSection: { paddingHorizontal: 4, marginBottom: 16 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  alertDays: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 34,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
