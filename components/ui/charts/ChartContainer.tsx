import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius, Elevation, Typography, Animation } from '@/constants/designTokens';

interface ChartContainerProps {
  title?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  testID?: string;
}

/**
 * Shared container for all chart components
 * Provides consistent styling, loading/empty states, and typography
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  testID,
}) => {
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]} testID={testID}>
        {title && <Text style={styles.title}>{title}</Text>}
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chart data...</Text>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={[styles.container, styles.emptyContainer]} testID={testID}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]} testID={testID}>
      {title && <Text style={styles.title}>{title}</Text>}
      <BlurView intensity={5} tint="light" style={styles.chartBlur}>
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.md,
    marginTop: 0,
    backgroundColor: Colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: Elevation.md.elevation,
      },
    }),
  },
  title: {
    fontSize: Typography.presets.title3.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: Spacing.md,
  },
  chartBlur: {
    borderRadius: BorderRadius.lg,
    padding: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ChartContainer;
