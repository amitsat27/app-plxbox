import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { billAlertsService } from '../../src/services/BillAlertsService';
import { firebaseService, DashboardMetric, Bill } from '../../src/services/FirebaseService';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { AdvancedDashboard } from '../../components/ui/AdvancedDashboard';

export default function Dashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <AdvancedDashboard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
