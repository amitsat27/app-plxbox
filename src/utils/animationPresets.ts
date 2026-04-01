/**
 * Animation presets for iOS 18+ feel
 * All animations use native driver where possible
 * Based on iOS spring physics and easing curves
 */

import Animated, {
  Easing,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

// Stagger timing for list animations (ms)
export const STAGGERS = {
  xs: 50,
  sm: 75,
  md: 100,
  lg: 150,
  xl: 200,
};

// Duration timing (ms)
export const DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

// Spring configuration (iOS style)
export const SPRING_CONFIG = {
  light: {
    damping: 25,
    stiffness: 300,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  standard: {
    damping: 20,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  bouncy: {
    damping: 15,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  smooth: {
    damping: 25,
    stiffness: 200,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
};

// Easing functions
export const EASING = {
  iosEaseOut: Easing.bezier(0.25, 0.1, 0.25, 1),
  iosEaseIn: Easing.bezier(0.42, 0, 1, 1),
  iosEaseInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  linear: Easing.linear,
};

/**
 * Animate value from 0 to 1 with spring
 */
export const animateSpring = (
  sharedValue: any,
  toValue: number = 1,
  config?: any
) => {
  return (withSpring as any)(sharedValue, toValue, config || SPRING_CONFIG.standard);
};

/**
 * Animate value with timing
 */
export const animateTiming = (
  sharedValue: any,
  toValue: number,
  duration: number = DURATION.normal,
  easing = EASING.iosEaseOut
) => {
  return (withTiming as any)(sharedValue, { duration, easing });
};

/**
 * Create entrance animation (fade + translateY)
 */
export const entranceAnimation = (
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  delay: number = 0
) => {
  return withDelay(
    delay,
    withTiming(1, { duration: DURATION.normal, easing: EASING.iosEaseOut })
  );
};

/**
 * Shimmer effect for skeleton loaders
 * Creates infinite left-to-right shimmer
 */
export const createShimmerAnimation = () => {
  return useSharedValue(-1);

  // Usage in component:
  // const shimmerX = createShimmerAnimation();
  // useEffect(() => {
  //   shimmerX.value = withRepeat(
  //     withTiming(1, { duration: 1200, easing: EASING.linear }),
  //     -1,
  //     false
  //   );
  // }, []);
};

/**
 * Scale on press animation
 */
export const createPressAnimation = (scale: SharedValue<number>) => {
  return {
    onPressIn: () => {
      scale.value = withSpring(0.95, SPRING_CONFIG.light);
    },
    onPressOut: () => {
      scale.value = withSpring(1, SPRING_CONFIG.light);
    },
  };
};

/**
 * Number counting animation
 * Smoothly counts from start to end value
 */
export const createNumberAnimation = (
  animatedValue: SharedValue<number>,
  start: number,
  end: number,
  duration: number = DURATION.normal
) => {
  animatedValue.value = withTiming(end, {
    duration,
    easing: EASING.iosEaseOut,
  });
};

// Helper to interpolate color (requires react-native-reanimated's interpolateColor)
// import { interpolateColor } from 'react-native-reanimated';
// Example:
// const animatedBgColor = interpolateColor(
//   animatedValue,
//   [0, 1],
//   [Colors.transparent, Colors.background]
// );

export default {
  STAGGERS,
  DURATION,
  SPRING_CONFIG,
  EASING,
  animateSpring,
  animateTiming,
  entranceAnimation,
  createShimmerAnimation,
  createPressAnimation,
  createNumberAnimation,
};
