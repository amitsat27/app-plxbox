import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Colors } from '../../theme/color';

interface ChartDataPoint {
  month: string;
  [key: string]: string | number;
}

interface LineChartProps {
  title: string;
  data: ChartDataPoint[];
  lines: {
    key: string;
    label: string;
    color: string;
  }[];
  yAxisLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data = [],
  lines = [],
  yAxisLabel = 'Amount',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;
  const chartHeight = 280;

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((point) => {
      lines.forEach((line) => {
        const value = point[line.key];
        if (typeof value === 'number' && value > max) {
          max = value;
        }
      });
    });
    return max * 1.1; // Add 10% padding
  }, [data, lines]);

  const scaleFactor = maxValue > 0 ? (chartHeight - 60) / maxValue : 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legend}>
          {lines.map((line) => (
            <View key={line.key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: line.color }]} />
              <Text style={styles.legendLabel}>{line.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {data.length > 0 ? (
        <View style={styles.chart}>
          {/* Y-Axis Label */}
          <View style={styles.yAxisLabel}>
            <Text style={styles.yAxisLabelText}>{yAxisLabel}</Text>
          </View>

          {/* Chart Area */}
          <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
            {/* Grid Lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={`grid-${i}`}
                style={[
                  styles.gridLine,
                  { top: (chartHeight / 4) * i },
                ]}
              />
            ))}

            {/* Data Points and Lines */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 40) + 20;

              return (
                <View key={`point-${index}`}>
                  {/* Data point for each line */}
                  {lines.map((line) => {
                    const value = point[line.key];
                    const y = chartHeight - (typeof value === 'number' ? value * scaleFactor : 0) - 20;

                    return (
                      <View
                        key={`${line.key}-${index}`}
                        style={[
                          styles.dataPoint,
                          {
                            left: x - 4,
                            top: y - 4,
                            borderColor: line.color,
                          },
                        ]}
                      />
                    );
                  })}

                  {/* Month Label */}
                  <Text
                    style={[
                      styles.monthLabel,
                      { left: x - 20 },
                    ]}
                  >
                    {point.month?.substring(0, 3)}
                  </Text>
                </View>
              );
            })}
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chart: {
    flexDirection: 'row',
    marginTop: 16,
  },
  yAxisLabel: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  yAxisLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    transform: [{ rotate: '-90deg' }],
  },
  chartArea: {
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  monthLabel: {
    position: 'absolute',
    bottom: -24,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
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
