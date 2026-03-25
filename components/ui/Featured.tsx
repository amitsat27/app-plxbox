import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Colors } from '../../theme/color';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface FeaturedProps {
  title: string;
  subtitle?: string;
  data?: Array<{
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
  }>;
}

export const Featured: React.FC<FeaturedProps> = ({
  title,
  subtitle = 'This Month',
  data = [],
}) => {
  return (
    <View style={styles.featured}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {data.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dataContainer}
        >
          {data.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataHeader}>
                <Text style={styles.dataLabel}>{item.label}</Text>
                <View style={styles.trendBadge}>
                  {item.trend === 'up' ? (
                    <TrendingUp size={12} color={Colors.success} />
                  ) : (
                    <TrendingDown size={12} color={Colors.danger} />
                  )}
                  <Text style={[
                    styles.trendText,
                    { color: item.trend === 'up' ? Colors.success : Colors.danger }
                  ]}>
                    {Math.abs(item.change)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.dataValue}>₹{item.value.toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  featured: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dataContainer: {
    marginTop: 12,
  },
  dataItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginRight: 12,
    minWidth: 140,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyState: {
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
