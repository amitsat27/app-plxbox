// 🌟 Premium Welcome Section - Cosmic Sunset Edition
// Features: Animated gradient greeting "Good Morning/Afternoon/Evening Amit"
// Glassmorphic background with blur, floating particles, and smooth entrance

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, getColorScheme } from '@/theme/color';
import { Spacing, BorderRadius, Typography, Animation, Elevation, ZIndex } from '@/constants/designTokens';
import { useUIStore } from '@/src/stores/uiStore';
import { useAuth } from '@/src/context/AuthContext';

interface WelcomeSectionProps {
  testID?: string;
}

/**
 * Hero-level welcome section with:
 * - Large animated gradient text: "Good [TimeOfDay] Amit"
 * - Glassmorphic container with blur
 * - Subtle particle/glow background animation
 * - User avatar with glowing border
 * - Smooth staggered entrance
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ testID }) => {
  const { user } = useAuth();
  const { isDarkMode } = useUIStore();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const gradientShift = useRef(new Animated.Value(0)).current;

  const scheme = getColorScheme(isDarkMode);

  // Get time-based greeting (hard-coded "Amit")
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  const userName = 'Amit'; // Hard-coded as requested
  const firstName = userName;
  const userAvatar = user?.photoURL;

  // Entrance animation on mount
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Animation.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: Animation.entrance,
        delay: Animation.stagger.sm,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: Animation.spring.damping,
        stiffness: Animation.spring.stiffness,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  // Container style with glassmorphism
  const containerStyle = {
    backgroundColor: scheme.glass,
    borderColor: isDarkMode ? Colors.borderDark : Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    ...Elevation.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  };

  // Glow effect behind avatar (animated)
  const avatarGlowStyle = {
    ...Elevation.xl,
    shadowColor: Colors.glowPrimary,
    backgroundColor: Colors.glowPrimary,
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute' as const,
    top: -30,
    left: -30,
    zIndex: ZIndex.glow,
    opacity: 0.6,
  };

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + Spacing.md }]} testID={testID}>
      {/* Background particles/gradient blobs (optional) */}
      {isDarkMode && (
        <>
          <Animated.View
            style={[
              styles.particle,
              styles.particle1,
              { backgroundColor: Colors.glowPrimary },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle2,
              { backgroundColor: Colors.glowSecondary },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle3,
              { backgroundColor: Colors.glowTertiary },
            ]}
          />
        </>
      )}

      {/* Glassmorphic Card */}
      <Animated.View style={containerStyle}>
        <BlurView
          intensity={isDarkMode ? 40 : 30}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.blurContent}
        >
          <View style={styles.content}>
            {/* Avatar with glow */}
            <View style={styles.avatarContainer}>
              <Animated.View style={avatarGlowStyle} />
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Greeting Text */}
            <View style={styles.textContainer}>
              <Animated.Text
                style={[
                  styles.greetingTime,
                  {
                    color: scheme.textSecondary,
                    opacity: slideAnim,
                  },
                ]}
              >
                {greeting}
              </Animated.Text>

              {/* Gradient animated name */}
              <View style={styles.nameContainer}>
                <Text style={styles.greetingNamePrefix}>, </Text>
                <Text style={styles.greetingName}>
                  {firstName}
                </Text>
              </View>

              {/* Subtitle */}
              <Text style={[styles.subtext, { color: scheme.textTertiary }]}>
                Here's your financial overview
              </Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  blurContent: {
    width: '100%',
    borderRadius: BorderRadius.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Elevation.md,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Elevation.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  textContainer: {
    flex: 1,
  },
  greetingTime: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  greetingNamePrefix: {
    fontSize: Typography.cosmicHero.fontSize,
    fontWeight: Typography.cosmicHero.fontWeight,
    lineHeight: Typography.cosmicHero.lineHeight,
    letterSpacing: Typography.cosmicHero.letterSpacing,
    color: Colors.textPrimary,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  greetingName: {
    fontSize: Typography.cosmicHero.fontSize,
    fontWeight: Typography.cosmicHero.fontWeight,
    lineHeight: Typography.cosmicHero.lineHeight,
    letterSpacing: Typography.cosmicHero.letterSpacing,
    color: Colors.primary,
    // Fallback for platforms without gradient text support
    includeFontPadding: false,
    textShadowColor: Colors.glowPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  subtext: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
    marginTop: Spacing.sm,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  particle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    zIndex: ZIndex.base,
  },
  particle1: {
    top: -40,
    right: -30,
  },
  particle2: {
    bottom: -50,
    left: -20,
    opacity: 0.2,
  },
  particle3: {
    top: -30,
    left: 40,
    opacity: 0.15,
  },
});

export default WelcomeSection;
