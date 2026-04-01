import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius } from '@/constants/designTokens';
import MetricCard from '@/components/ui/cards/MetricCard';
import { LucideIcon } from 'lucide-react-native';

interface MetricsGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }>;
  testID?: string;
}

/**
 * Metrics grid layout (2×2 on mobile, up to 4×1 on tablet)
 * Handles consistent card sizing and spacing
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  testID,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          delay={index * 100}
          {...metric}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
});

export default MetricsGrid;
