import React, { useState } from 'react';
import { StyleSheet, View, Text, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/color';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: number;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  color = Colors.primary,
  trend,
  onPress 
}) => {
  const [pressed, setPressed] = useState(false);
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: animatedValue }] }]}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.card, { borderLeftColor: color }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                {icon}
              </View>
              {trend !== undefined && (
                <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#FEE2E2' : '#DCFCE7' }]}>
                  <Text style={[styles.trendText, { color: trend > 0 ? '#DC2626' : '#059669' }]}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.cardValue}>{value}</Text>
              <Text style={styles.cardUnit}>{unit}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface BillCardProps {
  title: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  onPress?: () => void;
}

export const BillCard: React.FC<BillCardProps> = ({
  title,
  amount,
  dueDate,
  status,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'paid':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'overdue':
        return { bg: '#FEE2E2', text: '#991B1B' };
    }
  };

  const statusColor = getStatusColor();
  const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billTitleContainer}>
            <Text style={styles.billTitle}>{title}</Text>
            <Text style={styles.billDate}>Due {daysUntilDue > 0 ? `in ${daysUntilDue} days` : 'Today'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.billFooter}>
          <Text style={styles.billAmount}>₹{amount.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        {icon}
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardContent: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  billCard: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  billTitleContainer: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  billDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  billFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  billAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
