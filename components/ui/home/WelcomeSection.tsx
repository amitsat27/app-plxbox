import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/color';
import { Spacing, BorderRadius, Typography } from '@/constants/designTokens';

interface WelcomeSectionProps {
  userName: string;
  userAvatar?: string;
  testID?: string;
}

/**
 * Premium welcome section with iOS 18+ typography
 * Features: time-based greeting, user avatar, animated entrance
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  userAvatar,
  testID,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const greeting = getGreeting();
  const firstName = userName.split(' ')[0] || 'User';

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.container]} testID={testID}>
      <View style={styles.header}>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.subtext}>Here's your financial overview</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.presets.caption1.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  userName: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography.fontSize.xxxl * Typography.lineHeight.tight,
  },
  subtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
});

export default WelcomeSection;
