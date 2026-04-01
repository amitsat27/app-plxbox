import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/theme/color';
import { Spacing, Typography } from '@/constants/designTokens';
import SummaryCard from '@/components/ui/cards/SummaryCard';

interface SummaryItem {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  extra: string;
}

interface SummarySectionProps {
  vehicles?: SummaryItem[];
  appliances?: SummaryItem[];
  testID?: string;
}

/**
 * Summary row for Vehicles & Appliances
 * Horizontal layout with equal-width cards
 */
export const SummarySection: React.FC<SummarySectionProps> = ({
  vehicles,
  appliances,
  testID,
}) => {
  if ((!vehicles || vehicles.length === 0) && (!appliances || appliances.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.row}>
        {vehicles && vehicles.length > 0 && (
          <SummaryCard
            delay={0}
            {...vehicles[0]}
          />
        )}
        {appliances && appliances.length > 0 && (
          <SummaryCard
            delay={150}
            {...appliances[0]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
});

export default SummarySection;
