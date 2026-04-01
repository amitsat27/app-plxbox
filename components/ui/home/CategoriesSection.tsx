import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/theme/color';
import { Spacing, Typography } from '@/constants/designTokens';
import BillCategoryCard from '@/components/ui/cards/BillCategoryCard';
import { LucideIcon } from 'lucide-react-native';

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  count: number;
  icon: LucideIcon;
  color: string;
}

interface CategoriesSectionProps {
  categories: CategoryData[];
  testID?: string;
}

/**
 * Bill categories grid section
 * 2-column layout matching metrics grid
 */
export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  testID,
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Bill Categories</Text>
      </View>
      <View style={styles.grid}>
        {categories.map((category, index) => (
          <BillCategoryCard
            key={category.id}
            index={index}
            name={category.name}
            amount={category.amount}
            count={category.count}
            icon={category.icon}
            color={category.color}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
});

export default CategoriesSection;
