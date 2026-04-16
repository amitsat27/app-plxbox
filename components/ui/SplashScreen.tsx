import { Spacing, Typography } from "@/constants/designTokens";
import { Colors } from "@/theme/color";
import React, { useEffect } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";

/**
 * Premium iOS 18+ Splash Screen
 * Features: Logo animation, gradient background, glassmorphism elements
 */
export const SplashScreenContent: React.FC = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const logoRotation = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });

    scale.value = withDelay(
      200,
      withSpring(1, {
        damping: 18,
        stiffness: 280,
      }),
    );

    // Subtle logo rotation
    logoRotation.value = withRepeat(
      withTiming(1, { duration: 4000 }),
      -1,
      true,
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${interpolate(logoRotation.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [20, 0]) }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Gradient background overlay */}
      <View style={styles.gradientOverlay} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>Pulsebox</Text>
          <Text style={styles.tagline}>Smart Financial Management</Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: Colors.primary },
              {
                opacity: withTiming(1, { duration: 800 }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: Colors.secondary },
              {
                opacity: withDelay(200, withTiming(1, { duration: 800 })),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { backgroundColor: Colors.tertiary },
              {
                opacity: withDelay(400, withTiming(1, { duration: 800 })),
              },
            ]}
          />
        </View>
      </View>

      {/* Bottom accent line */}
      <View
        style={[styles.bottomAccent, { backgroundColor: Colors.primary }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 122, 255, 0.05)",
  },
  content: {
    alignItems: "center",
    gap: Spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -1,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
});

export default SplashScreenContent;
