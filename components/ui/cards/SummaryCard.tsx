import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius, Typography, Elevation } from '@/constants/designTokens';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  extra?: string;
  onPress?: () => void;
  testID?: string;
  delay?: number;
}

/**
 * Premium summary card for vehicles/appliances
 * iOS 18+ design with horizontal layout, clean typography, subtle elevation
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  icon,
  color,
  extra,
  onPress,
  testID,
  delay = 0,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    const animationDelay = delay;

    opacity.value = withDelay(
      animationDelay,
      withTiming(1, {
        duration: 450,
        easing: Easing.inOut(Easing.ease),
      })
    );
    translateX.value = withDelay(
      animationDelay,
      withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      })
    );
    scale.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 22,
        stiffness: 280,
      })
    );
  }, []);

  const handlePress = () => {
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.cardContainer]} testID={testID}>
      <TouchableOpacity
        activeOpacity={0.93}
        onPress={handlePress}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${count}`}
      >
        <View style={[styles.card, { backgroundColor: Colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            {icon}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.count, { color }]}>{count}</Text>
            {extra && <Text style={styles.extra}>{extra}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  touchable: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  card: {
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: Elevation.sm.elevation,
      },
    }),
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
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
  count: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  extra: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default SummaryCard;
