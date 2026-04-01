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
import { LucideIcon } from 'lucide-react-native';

interface BillCategoryCardProps {
  name: string;
  amount: number;
  count: number;
  icon: LucideIcon;
  color: string;
  status?: 'paid' | 'pending' | 'overdue' | string;
  onPress?: () => void;
  testID?: string;
  index?: number; // for staggered animation
}

/**
 * Premium bill category card with iOS 18+ design
 * Features: spacious layout, color-coded icon, status indicator, smooth animations
 */
export const BillCategoryCard: React.FC<BillCategoryCardProps> = ({
  name,
  amount,
  count,
  icon: Icon,
  color,
  status,
  onPress,
  testID,
  index = 0,
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Entrance animation with stagger
  useEffect(() => {
    const delay = index * 100; // 100ms stagger

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
        damping: 18,
        stiffness: 350,
      })
    );
  }, []);

  const handlePress = () => {
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'overdue':
        return Colors.error;
      case 'paid':
        return Colors.success;
      default:
        return Colors.textTertiary;
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <Animated.View style={[animatedStyle, styles.cardContainer]} testID={testID}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={`${name}: ₹${amount.toLocaleString()}, ${count} bills`}
      >
        <View style={[styles.card, { backgroundColor: Colors.surface }]}>
          {/* Icon Section */}
          <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Icon size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.content}>
            <Text style={styles.categoryName}>{name}</Text>
            <Text style={styles.amount}>₹{amount.toLocaleString()}</Text>

            <View style={styles.footer}>
              <Text style={styles.count}>{count} bill{count !== 1 ? 's' : ''}</Text>

              {status && (
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
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
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: 'center',
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
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  categoryName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  count: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default BillCategoryCard;
