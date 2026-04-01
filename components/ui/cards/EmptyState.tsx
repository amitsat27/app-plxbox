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
import { Home, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius, Typography, Elevation } from '@/constants/designTokens';

interface EmptyStateProps {
  onAddBill?: () => void;
  onAddVehicle?: () => void;
  onAddAppliance?: () => void;
  testID?: string;
  delay?: number;
}

/**
 * Premium empty state with iOS 18+ design
 * Clean, spacious, with clear CTAs and helpful messaging
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddBill,
  onAddVehicle,
  onAddAppliance,
  testID,
  delay = 0,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 25,
        stiffness: 200,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.container]} testID={testID}>
      <BlurView intensity={15} tint="light" style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Home size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>

        {/* Text */}
        <Text style={styles.title}>No Data Yet</Text>
        <Text style={styles.subtitle}>
          Start adding bills, vehicles, and appliances to get insights and track your expenses
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
            onPress={onAddBill}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>Add Your First Bill</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: Colors.border }]}
              onPress={onAddVehicle}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>
                Add Vehicle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: Colors.border }]}
              onPress={onAddAppliance}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>
                Add Appliance
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  content: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: Elevation.lg.elevation,
      },
    }),
  },
  iconContainer: {
    opacity: 0.4,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing.xl,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
});

export default EmptyState;
