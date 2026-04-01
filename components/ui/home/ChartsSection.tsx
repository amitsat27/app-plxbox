import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/theme/color';
import { Spacing, Typography } from '@/constants/designTokens';
import LineChart from '@/components/ui/charts/LineChart';
import DonutChart from '@/components/ui/charts/DonutChart';

interface MonthlySpending {
  month: string;
  value: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ChartsSectionProps {
  monthlySpending?: MonthlySpending[];
  pieChartData?: ChartDataPoint[];
  testID?: string;
}

/**
 * Charts section containing spending trends (line) and bill distribution (donut)
 * Vertical stack with individualized rendering based on data availability
 */
export const ChartsSection: React.FC<ChartsSectionProps> = ({
  monthlySpending,
  pieChartData,
  testID,
}) => {
  const hasLineData = monthlySpending && monthlySpending.length > 0;
  const hasDonutData = pieChartData && pieChartData.length > 0;

  if (!hasLineData && !hasDonutData) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {hasLineData && (
        <View style={styles.chartWrapper}>
          <LineChart
            title="Spending Trends"
            data={monthlySpending}
            lines={[
              {
                key: 'value',
                label: 'Spending',
                color: Colors.primary,
              },
            ]}
            yAxisLabel="₹"
          />
        </View>
      )}

      {hasDonutData && (
        <View style={styles.chartWrapper}>
          <DonutChart
            title="Bill Distribution"
            data={pieChartData}
            size={260}
            innerRadius={80}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  chartWrapper: {
    marginBottom: Spacing.md,
  },
});

export default ChartsSection;
