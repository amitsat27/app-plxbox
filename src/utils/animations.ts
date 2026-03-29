// src/utils/animations.ts
import React from 'react';
import { SharedValue, useSharedValue, withSpring, withTiming, withRepeat, withSequence, withDelay, runOnJS, interpolate, Extrapolate, Easing } from 'react-native-reanimated';
import { Animation, Elevation } from '../../constants/designTokens';

/**
 * Animation Configuration Presets
 */
export const Animations = {
  // Spring animations for natural motion
  spring: {
    default: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
      mass: 1,
    },
    stiff: {
      damping: 30,
      stiffness: 400,
      mass: 1,
    },
    gentle: {
      damping: 25,
      stiffness: 150,
      mass: 1,
    },
  },

  // Timing animations for precise control
  timing: {
    default: {
      duration: Animation.normal,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    fast: {
      duration: Animation.fast,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    slow: {
      duration: Animation.slow,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    easeOut: {
      duration: Animation.normal,
      easing: Easing.out(Easing.ease),
    },
    easeIn: {
      duration: Animation.normal,
      easing: Easing.in(Easing.ease),
    },
  },
};

/**
 * Hook for smooth scale animation on press
 */
export const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Animations.spring.default);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animations.spring.default);
  };

  return {
    scale,
    handlePressIn,
    handlePressOut,
  };
};

/**
 * Hook for fade in/out animations
 */
export const useFadeAnimation = (initialValue: number = 0) => {
  const opacity = useSharedValue(initialValue);

  const fadeIn = (duration: number = Animation.normal) => {
    opacity.value = withTiming(1, {
      ...Animations.timing.easeOut,
      duration,
    });
  };

  const fadeOut = (duration: number = Animation.normal) => {
    opacity.value = withTiming(0, {
      ...Animations.timing.easeIn,
      duration,
    });
  };

  const toggle = () => {
    if (opacity.value === 0) {
      fadeIn();
    } else {
      fadeOut();
    }
  };

  return {
    opacity,
    fadeIn,
    fadeOut,
    toggle,
  };
};

/**
 * Hook for slide animations (horizontal or vertical)
 */
export const useSlideAnimation = (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
  const translateX = useSharedValue(
    direction === 'left' ? -100 : direction === 'right' ? 100 : 0
  );
  const translateY = useSharedValue(
    direction === 'up' ? 100 : direction === 'down' ? -100 : 0
  );

  const getTranslate = () => {
    return direction === 'left' || direction === 'right' ? translateX : translateY;
  };

  const slideIn = (duration: number = Animation.normal) => {
    const translate = getTranslate();
    translate.value = withTiming(0, {
      ...Animations.timing.easeOut,
      duration,
    });
  };

  const slideOut = (duration: number = Animation.normal) => {
    const translate = getTranslate();
    let toValue: number;
    if (direction === 'left') {
      toValue = -100;
    } else if (direction === 'right') {
      toValue = 100;
    } else if (direction === 'up') {
      toValue = 100;
    } else {
      // down
      toValue = -100;
    }

    translate.value = withTiming(toValue, {
      ...Animations.timing.easeIn,
      duration,
    });
  };

  const translate = getTranslate();

  return {
    translate,
    slideIn,
    slideOut,
  };
};

// Hook removed - was causing lint errors and is unused

/**
 * Interpolation helper for smooth value transitions
 */
export const interpolateValue = (
  value: SharedValue<number>,
  inputRange: number[],
  outputRange: number[]
) => {
  return interpolate(value.value, inputRange, outputRange, Extrapolate.CLAMP);
};

/**
 * Create a shimmer effect for skeleton loaders
 */
export const useShimmerAnimation = () => {
  const shimmer = useSharedValue(-1);

  const startShimmer = () => {
    shimmer.value = withRepeat(
      withTiming(1, { ...Animations.timing.easeIn, duration: 1200 }),
      -1,
      false
    );
  };

  const stopShimmer = () => {
    shimmer.value = 0;
  };

  return {
    shimmer,
    startShimmer,
    stopShimmer,
  };
};

/**
 * Animate elevation (shadow) changes
 */
export const useElevationAnimation = () => {
  const elevation = useSharedValue(Elevation.none.elevation);

  const setElevation = (level: keyof typeof Elevation) => {
    elevation.value = withSpring(Elevation[level].elevation, Animations.spring.default);
  };

  return {
    elevation,
    setElevation,
  };
};

/**
 * Helper for counting up numbers
 */
export const useCounterAnimation = (targetValue: number, duration: number = 1000) => {
  const currentValue = useSharedValue(0);

  const animateCounter = () => {
    currentValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  };

  return {
    currentValue,
    animateCounter,
  };
};

/**
 * Pulse animation for attention
 */
export const usePulseAnimation = () => {
  const scale = useSharedValue(1);

  const pulse = () => {
    scale.value = withSequence(
      withSpring(1.1, Animations.spring.bouncy),
      withSpring(1, Animations.spring.default)
    );
  };

  return {
    scale,
    pulse,
  };
};