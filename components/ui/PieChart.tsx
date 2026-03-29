import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Colors } from '../../theme/color';

interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  title: string;
  data: PieChartDataPoint[];
}

const DEFAULT_COLORS = [
  Colors.primary,
  Colors.accent,
  Colors.success,
  Colors.danger,
  '#A78BFA',
  '#F472B6',
];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data = [],
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const screenWidth = Dimensions.get('window').width;
  const chartSize = Math.min(screenWidth - 60, 200);
  const radius = chartSize / 2;

  // Calculate pie segments
  const segments: {
    name: string;
    value: number;
    percentage: number;
    color: string;
    startAngle: number;
    endAngle: number;
  }[] = [];

  let currentAngle = 0;
  data.forEach((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const sliceAngle = (item.value / total) * 360;
    const endAngle = currentAngle + sliceAngle;

    segments.push({
      name: item.name,
      value: item.value,
      percentage,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      startAngle: currentAngle,
      endAngle,
    });

    currentAngle = endAngle;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {data.length > 0 ? (
        <View style={styles.content}>
          {/* Chart */}
          <View style={[
            styles.chartContainer,
            { width: chartSize, height: chartSize }
          ]}>
            <View style={[
              styles.chart,
              { width: chartSize, height: chartSize }
            ]}>
              {segments.map((segment, index) => (
                <View
                  key={`segment-${index}`}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: segment.color,
                      opacity: 0.8,
                    },
                  ]}
                />
              ))}

              {/* Center Circle */}
              <View style={[
                styles.centerCircle,
                {
                  width: radius,
                  height: radius,
                },
              ]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {segments.map((segment, index) => (
              <View key={`legend-${index}`} style={styles.legendItem}>
                <View style={[
                  styles.legendColor,
                  { backgroundColor: segment.color }
                ]} />
                <View style={styles.legendContent}>
                  <Text style={styles.legendName}>{segment.name}</Text>
                  <Text style={styles.legendValue}>
                    ₹{segment.value.toLocaleString()} ({segment.percentage.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  chart: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
  },
  centerCircle: {
    borderRadius: 1000,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  legend: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 10,
  },
  legendContent: {
    flex: 1,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
