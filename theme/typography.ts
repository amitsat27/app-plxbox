// 📝 Typography System - iOS-inspired
// Uses system fonts with proper weight & sizing hierarchy

import { Platform, TextStyle } from 'react-native';

// iOS System font family
// On iOS: San Francisco (automatic)
// On Android: Roboto (closest equivalent)
export const FontFamily = {
  regular: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  heavy: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
};

// Typography scale mimicking iOS Dynamic Type
export const Typography = {
  // Large titles (Navigation bar when scrolled to top)
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: 'bold' as const,
    letterSpacing: 0.37,
  },

  // Title levels
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 'bold' as const,
    letterSpacing: 0.36,
  },

  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 'bold' as const,
    letterSpacing: 0.35,
  },

  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 'semibold' as const,
    letterSpacing: 0.38,
  },

  // Headlines
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 'semibold' as const,
    letterSpacing: -0.41,
  },

  // Body text
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 'regular' as const,
    letterSpacing: -0.41,
  },

  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'regular' as const,
    letterSpacing: -0.32,
  },

  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 'regular' as const,
    letterSpacing: -0.24,
  },

  // Footnote / Captions
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 'regular' as const,
    letterSpacing: -0.08,
  },

  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'regular' as const,
    letterSpacing: -0.04,
  },

  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: 'regular' as const,
    letterSpacing: 0,
  },
};

// Preset text styles for quick use
export const TextStyles = {
  largeTitle: (custom?: TextStyle) => ({
    ...Typography.largeTitle,
    fontFamily: FontFamily.bold,
    ...custom,
  }),
  title1: (custom?: TextStyle) => ({
    ...Typography.title1,
    fontFamily: FontFamily.bold,
    ...custom,
  }),
  title2: (custom?: TextStyle) => ({
    ...Typography.title2,
    fontFamily: FontFamily.bold,
    ...custom,
  }),
  title3: (custom?: TextStyle) => ({
    ...Typography.title3,
    fontFamily: FontFamily.semibold,
    ...custom,
  }),
  headline: (custom?: TextStyle) => ({
    ...Typography.headline,
    fontFamily: FontFamily.semibold,
    ...custom,
  }),
  body: (custom?: TextStyle) => ({
    ...Typography.body,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
  callout: (custom?: TextStyle) => ({
    ...Typography.callout,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
  subhead: (custom?: TextStyle) => ({
    ...Typography.subhead,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
  footnote: (custom?: TextStyle) => ({
    ...Typography.footnote,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
  caption1: (custom?: TextStyle) => ({
    ...Typography.caption1,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
  caption2: (custom?: TextStyle) => ({
    ...Typography.caption2,
    fontFamily: FontFamily.regular,
    ...custom,
  }),
};

// Helper to create semantic text styles
export const createTextStyle = (
  variant: keyof typeof Typography,
  options: {
    weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
    align?: TextStyle['textAlign'];
    color?: string;
    italic?: boolean;
  } = {}
): TextStyle => {
  const base = Typography[variant];
  const weightMap = {
    regular: FontFamily.regular,
    medium: FontFamily.medium,
    semibold: FontFamily.semibold,
    bold: FontFamily.bold,
    heavy: FontFamily.heavy,
  };

  return {
    ...base,
    fontFamily: weightMap[options.weight || 'regular'],
    textAlign: options.align,
    color: options.color,
    fontStyle: options.italic ? 'italic' : undefined,
  };
};

export default Typography;
