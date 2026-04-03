// 🌈 Premium Bill Category Card - Cosmic Sunset Edition
// Features: Vibrant gradients, pill shape, glowing icons, animated counters

import {
    Animation,
    BorderRadius,
    Elevation,
    Spacing,
    Typography,
    ZIndex,
} from "@/constants/designTokens";
import { useUIStore } from "@/src/stores/uiStore";
import {
    Colors,
    getCategoryGlow,
    getCategoryGradient,
    getColorScheme,
} from "@/theme/color";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LucideIcon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface BillCategoryCardProps {
  name: string;
  amount: number;
  count: number;
  icon: LucideIcon;
  color: string; // Base category color
  status?: "paid" | "pending" | "overdue" | string;
  onPress?: () => void;
  testID?: string;
  index?: number;
  totalAmount?: number; // For progress calculation
}

/**
 * Vibrant gradient category card with:
 * - Pill-shaped glassmorphic container
 * - Linear gradient background (color → gradientColor)
 * - Glowing icon with pulse
 * - Animated counter from 0 to target amount
 * - Progress ring or bar
 * - Colored status indicator
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
  totalAmount,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const iconScale = useSharedValue(1);
  const [displayAmount, setDisplayAmount] = useState(0);

  const { isDarkMode } = useUIStore();
  const scheme = getColorScheme(isDarkMode);

  // Get gradient color
  const gradientColor = getCategoryGradient(name.toLowerCase()) || `${color}80`;
  const glowColor = getCategoryGlow(name.toLowerCase()) || `${color}50`;

  // Calculate percentage of total (for progress indicator)
  const progress =
    totalAmount && totalAmount > 0
      ? Math.min((amount / totalAmount) * 100, 100)
      : 0;

  // Progress fill width as percentage string for style
  const progressWidth = `${progress}%`;

  // Entrance animation
  useEffect(() => {
    const delay = index * Animation.stagger.hero;

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 20, stiffness: 320 }),
    );
  }, [index, opacity, translateY, scale]);

  // Counter animation (count up from 0 to amount)
  useEffect(() => {
    let isMounted = true;
    const duration = 1200;
    const startTime = Date.now();

    const animateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for smooth count-up
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentAmount = Math.floor(amount * easedProgress);

      if (isMounted) {
        setDisplayAmount(currentAmount);
      }

      if (progress < 1) {
        requestAnimationFrame(animateCounter);
      }
    };

    requestAnimationFrame(animateCounter);

    return () => {
      isMounted = false;
    };
  }, [amount]);

  // Icon pulse animation
  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [iconScale]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.94, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 }),
    );
    onPress?.();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Dynamic styles that depend on theme
  const dynamicStyles = {
    amountLabelColor: scheme.textSecondary,
    progressTextColor: scheme.textTertiary,
  };

  return (
    <Animated.View
      style={[animatedCardStyle, styles.cardContainer]}
      testID={testID}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={`${name}: ₹${amount.toLocaleString()}, ${count} bills`}
      >
        {/* Glow layer */}
        <View style={[styles.glowLayer, { backgroundColor: glowColor }]} />

        {/* Gradient glass card */}
        <BlurView
          intensity={isDarkMode ? 30 : 20}
          tint={isDarkMode ? "dark" : "light"}
          style={[
            styles.glassCard,
            {
              backgroundColor: isDarkMode
                ? `rgba(30, 30, 60, 0.65)`
                : `rgba(255, 255, 255, 0.75)`,
              borderColor: `${color}30`,
            },
          ]}
        >
          {/* Top gradient accent */}
          <View
            style={[styles.gradientAccent, { backgroundColor: gradientColor }]}
          />

          <View style={styles.content}>
            {/* Glowing icon */}
            <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
              <View
                style={[
                  styles.iconGlow,
                  {
                    backgroundColor: glowColor,
                    shadowColor: glowColor,
                  },
                ]}
              />
              <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Icon size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Animated.View>

            {/* Text content */}
            <View style={styles.textContent}>
              <Text
                style={[styles.categoryName, { color: scheme.textPrimary }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text
                style={[
                  styles.amountValue,
                  {
                    color: scheme.textPrimary,
                    textShadowColor: `${color}50`,
                  },
                ]}
                numberOfLines={1}
              >
                ₹{displayAmount.toLocaleString()}
              </Text>

              {/* Footer with count & status */}
              <View style={styles.footer}>
                <View style={styles.countBadge}>
                  <Text
                    style={[
                      styles.countText,
                      { color: dynamicStyles.amountLabelColor },
                    ]}
                  >
                    {count} bill{count !== 1 ? "s" : ""}
                  </Text>
                </View>

                {status && (
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          status === "paid"
                            ? Colors.successContainer
                            : status === "overdue"
                              ? Colors.errorContainer
                              : Colors.warningContainer,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            status === "paid"
                              ? Colors.success
                              : status === "overdue"
                                ? Colors.error
                                : Colors.warning,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            status === "paid"
                              ? Colors.successDark
                              : status === "overdue"
                                ? Colors.errorDark
                                : Colors.warningDark,
                        },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress bar (if totalAmount provided) */}
              {totalAmount && totalAmount > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: progressWidth as any,
                          backgroundColor: gradientColor,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: dynamicStyles.progressTextColor },
                    ]}
                  >
                    {progress.toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    marginBottom: Spacing.lg,
    // Floating effect
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowViolet,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: Elevation.xl.elevation,
      },
    }),
  },
  touchable: {
    borderRadius: BorderRadius.pill,
    overflow: "hidden",
  },
  glowLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.pill,
    opacity: 0.4,
    zIndex: ZIndex.glow,
  },
  glassCard: {
    borderRadius: BorderRadius.pill,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  gradientAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: BorderRadius.pill,
    borderTopRightRadius: BorderRadius.pill,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconWrapper: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.full,
    opacity: 0.5,
    shadowColor: "rgba(124, 58, 237, 0.6)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.15)",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  textContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Spacing.xs,
  },
  categoryName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: Spacing.xs,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  amountLabel: {
    fontSize: Typography.presets.caption1.fontSize,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  amountValue: {
    fontSize: Typography.amountLarge.fontSize,
    fontWeight: Typography.amountLarge.fontWeight,
    lineHeight: Typography.amountLarge.lineHeight,
    letterSpacing: Typography.amountLarge.letterSpacing,
    marginBottom: Spacing.sm,
    // Glow effect
    textShadowColor: `${Colors.primary}40`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  countBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  progressContainer: {
    marginTop: Spacing.sm,
    alignItems: "flex-start",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
});

export default BillCategoryCard;
