// 💎 Premium Metric Card - Cosmic Sunset Edition
// Features: Glassmorphism, gradient accents, animated icons, punchy colors

import {
    BorderRadius,
    Elevation,
    Spacing,
    Typography
} from "@/constants/designTokens";
import { useUIStore } from "@/src/stores/uiStore";
import {
    Colors,
    getCategoryGlow,
    getColorScheme
} from "@/theme/color";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
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

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // Category color
  backgroundColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
  testID?: string;
  delay?: number;
  category?: string; // For gradient support
}

/**
 * Premium glassmorphic metric card with:
 * - Heavy blur background with tint
 * - Gradient border/glow effect
 * - Animated icon pulse on value change
 * - Smooth staggered entrance
 * - High contrast text for readability
 * - Press feedback with scale + glow
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
  category,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const iconScale = useSharedValue(1);
  const { isDarkMode } = useUIStore();
  const scheme = getColorScheme(isDarkMode);

  // Determine glow color based on category or provided color
  const glowColor = category ? getCategoryGlow(category) : `${color}60`; // 60 hex = 37% opacity

  // Entrance animation
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 22, stiffness: 320 }),
    );
  }, [scale, opacity, translateY, delay]);

  // Pulse animation for icon (gentle float)
  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [iconScale]);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Brief scale animation on press
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 20, stiffness: 400 }),
      );
      onPress();
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Glow border effect
  const glowStyle = {
    borderWidth: 2,
    borderColor: glowColor,
    shadowColor: glowColor,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
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
        accessibilityLabel={`${title}: ${value}`}
        accessibilityHint={subtitle}
      >
        {/* Glow background layer */}
        <View style={[styles.glowBackground, glowStyle]} />

        {/* Glassmorphic card */}
        <BlurView
          intensity={isDarkMode ? 35 : 25}
          tint={isDarkMode ? "dark" : "light"}
          style={[
            styles.glassCard,
            {
              backgroundColor: isDarkMode
                ? "rgba(30, 30, 60, 0.6)"
                : "rgba(255, 255, 255, 0.65)",
            },
          ]}
        >
          <View style={styles.content}>
            {/* Icon with gradient background */}
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <View
                style={[styles.iconInner, { backgroundColor: `${color}30` }]}
              >
                <View style={[styles.iconGradient, { borderColor: color }]}>
                  <View>{icon}</View>
                </View>
              </View>
            </Animated.View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text
                style={[styles.title, { color: scheme.textSecondary }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: scheme.textPrimary,
                    textShadowColor: `${color}40`,
                  },
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>
              {subtitle && (
                <Text
                  style={[styles.subtitle, { color: scheme.textTertiary }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Gradient accent line at bottom */}
          <View style={[styles.accentLine, { backgroundColor: color }]} />

          {/* Trend Badge */}
          {trend && (
            <View
              style={[
                styles.trendBadge,
                trend.isPositive
                  ? { backgroundColor: Colors.successContainer }
                  : { backgroundColor: Colors.errorContainer },
              ]}
            >
              <Text
                style={[
                  styles.trendText,
                  {
                    color: trend.isPositive
                      ? Colors.successDark
                      : Colors.errorDark,
                  },
                ]}
              >
                {trend.isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%
              </Text>
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%", // Slightly smaller for more breathing room
    marginBottom: Spacing.lg,
    // Shadow elevation for the container
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowViolet,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: Elevation.lg.elevation,
      },
    }),
  },
  touchable: {
    borderRadius: BorderRadius.card,
    overflow: "hidden",
  },
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.card,
    opacity: 0.6,
  },
  glassCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    minHeight: 150,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.1)",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    // Subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: "rgba(124, 58, 237, 0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconInner: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    // Gradient border effect via border color + inner fill
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  value: {
    fontSize: Typography.metricValue.fontSize,
    fontWeight: Typography.metricValue.fontWeight,
    lineHeight: Typography.metricValue.lineHeight,
    letterSpacing: Typography.metricValue.letterSpacing,
    marginBottom: Spacing.xs,
    // Subtle glow for high contrast
    textShadowColor: `${Colors.primary}30`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
  accentLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: BorderRadius.card - 1,
    borderBottomRightRadius: BorderRadius.card - 1,
  },
  trendBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    // Glass effect
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  trendText: {
    fontSize: Typography.presets.caption2.fontSize,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
    }),
  },
});

export default MetricCard;
