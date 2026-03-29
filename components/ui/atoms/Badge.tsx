// 🏷️ Badge - Atomic Component
// iOS-style badge for counts, status indicators, and labels

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Spacing, Typography, BorderRadius } from '../../../constants/designTokens';
import { Colors } from '@/theme/color';
import { useTheme } from '../../../src/stores/uiStore';

// Badge variants
export type BadgeVariant = 'count' | 'status' | 'label' | 'dot';

// Status types (for status variant)
export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  // Content
  count?: number; // For count badge (shows number or '99+')
  text?: string; // For label badge
  showDot?: boolean; // For dot indicator

  // Variant
  variant?: BadgeVariant;

  // Status (for status variant)
  status?: BadgeStatus;

  // Appearance
  color?: string; // Custom color override
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';

  // Layout
  maxCount?: number; // Max count before showing '99+'
  showZero?: boolean; // Show badge even when count is 0

  // Style
  style?: ViewStyle;
  textStyle?: TextStyle;

  // Test ID
  testID?: string;
}

// Status color mapping
const getStatusColor = (status: BadgeStatus): string => {
  switch (status) {
    case 'success':
      return Colors.success;
    case 'warning':
      return Colors.warning;
    case 'error':
      return Colors.error;
    case 'info':
      return Colors.info;
    case 'neutral':
    default:
      return Colors.textSecondary;
  }
};

// Format count (e.g., 100 -> '99+')
const formatCount = (count: number, maxCount: number): string => {
  if (count > maxCount) {
    return `${maxCount}+`;
  }
  return count.toString();
};

// Get badge size dimensions
const getBadgeSize = (size: 'sm' | 'md' | 'lg', hasText: boolean) => {
  const sizes = {
    sm: {
      height: 18,
      paddingHorizontal: hasText ? 6 : 0,
      fontSize: Typography.fontSize.xs,
      dotSize: 8,
    },
    md: {
      height: 22,
      paddingHorizontal: hasText ? 8 : 0,
      fontSize: Typography.fontSize.sm,
      dotSize: 10,
    },
    lg: {
      height: 26,
      paddingHorizontal: hasText ? 10 : 0,
      fontSize: Typography.fontSize.md,
      dotSize: 12,
    },
  };
  return sizes[size];
};

export const Badge: React.FC<BadgeProps> = ({
  count,
  text,
  showDot = false,
  variant = 'count',
  status = 'neutral',
  color,
  textColor,
  size = 'md',
  maxCount = 99,
  showZero = false,
  style,
  textStyle,
  testID,
}) => {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  // Determine if we have content to show
  const hasCount = count !== undefined && (count > 0 || showZero);
  const hasText = !!text;
  const showBadge = variant === 'dot' ? showDot : hasCount || hasText;

  if (!showBadge) return null;

  // Get badge content
  const getBadgeContent = () => {
    if (variant === 'dot') {
      return null;
    }
    if (hasCount) {
      return formatCount(count!, maxCount);
    }
    if (hasText) {
      return text;
    }
    return '';
  };

  const content = getBadgeContent();

  // Determine colors
  const backgroundColor = color || getStatusColor(status);
  const badgeTextColor = textColor || '#FFFFFF';

  // Size config
  const sizeConfig = getBadgeSize(size, hasText || variant === 'label');

  // Build styles
  const containerStyle: ViewStyle = {
    backgroundColor,
    minHeight: sizeConfig.height,
    paddingHorizontal:
      variant === 'dot'
        ? 0
        : sizeConfig.paddingHorizontal,
    borderRadius: sizeConfig.height / 2, // Full pill shape
    alignItems: 'center',
    justifyContent: 'center',
    ...(variant === 'dot' && {
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
    }),
  };

  const textStyles: TextStyle = {
    color: badgeTextColor,
    fontSize: sizeConfig.fontSize,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: sizeConfig.height,
    includeFontPadding: false,
    textAlign: 'center',
    marginHorizontal: variant === 'dot' ? 0 : Spacing.xs / 2,
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {variant !== 'dot' && (
        <Text style={[textStyles, textStyle]} numberOfLines={1}>
          {content}
        </Text>
      )}
    </View>
  );
};

// Convenience component for status dots
export const StatusDot: React.FC<{
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}> = ({ status, size = 'md', style }) => {
  const sizeConfig = getBadgeSize(size, false);

  return (
    <View
      style={[
        {
          width: sizeConfig.dotSize,
          height: sizeConfig.dotSize,
          borderRadius: sizeConfig.dotSize / 2,
          backgroundColor: getStatusColor(status),
        },
        style,
      ]}
    />
  );
};

// Convenience component for pill labels
export const Pill: React.FC<{
  text: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: ViewStyle;
}> = ({
  text,
  color = Colors.primaryContainer,
  textColor = Colors.primary,
  size = 'md',
  onPress,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.pill,
        {
          backgroundColor: color,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
          paddingVertical: size === 'sm' ? Spacing.xs : Spacing.sm,
          borderRadius: BorderRadius.full,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.pillText,
          {
            color: textColor,
            fontSize: size === 'sm' ? Typography.fontSize.xs : Typography.fontSize.sm,
          },
        ]}
      >
        {text}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default Badge;
