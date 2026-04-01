import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius, Typography, Elevation } from '@/constants/designTokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  backgroundColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
  testID?: string;
  delay?: number; // for staggered entrance
}

/**
 * Premium metric card with iOS 18+ design
 * Features: light blur, animated entrance, haptic feedback, gradient accent
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  backgroundColor,
  subtitle,
  trend,
  onPress,
  testID,
  delay = 0,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Entrance animation
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 400,
        easing: Easing.inOut(Easing.ease),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 20,
        stiffness: 300,
      })
    );
  }, []);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.cardContainer]} testID={testID}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}`}
        accessibilityHint={subtitle}
      >
        <BlurView intensity={10} tint="light" style={styles.blurContainer}>
          <View style={styles.content}>
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
              <View style={[styles.iconInner, { backgroundColor: color }]}>
                {icon}
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.value}>{value}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>

          {/* Gradient Accent Bar */}
          <View style={[styles.accentBar, { backgroundColor: color }]} />

          {/* Trend Indicator */}
          {trend && (
            <View style={[styles.trendBadge, trend.isPositive ? styles.trendPositive : styles.trendNegative]}>
              <Text style={[
                styles.trendText,
                trend.isPositive ? { color: Colors.success } : { color: Colors.error }
              ]}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Text>
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '47%', // 2-column grid
    marginBottom: Spacing.md,
  },
  touchable: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: BorderRadius.card - 1,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: Elevation.md.elevation,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for icon bg
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconInner: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.presets.caption1.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography.fontSize.xxl * Typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: BorderRadius.card - 1,
    borderBottomRightRadius: BorderRadius.card - 1,
  },
  trendBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  trendPositive: {
    backgroundColor: Colors.successContainer,
  },
  trendNegative: {
    backgroundColor: Colors.errorContainer,
  },
  trendText: {
    fontSize: Typography.presets.caption2.fontSize,
    fontWeight: '700',
  },
});

export default MetricCard;
