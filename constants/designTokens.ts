// 🎯 Design System Tokens - iOS 17+ Optimized
// Single source of truth for spacing, typography, radii, elevation, animation
// Production-ready tokens for scalable React Native app

// ============================================
// SPACING (4px base grid, iOS standard)
// ============================================
export const Spacing = {
  // Base spacing scale (4pt grid)
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  enormous: 64,
  giant: 80,
  jumbo: 96,

  // Semantic spacing
  compact: 8,
  comfortable: 16,
  spacious: 24,
  generous: 32,

  // Safe areas (iOS status bar, home indicator)
  safeAreaBottom: 34,
  safeAreaTop: 47,
  safeAreaLeft: 0,
  safeAreaRight: 0,

  // Navigation heights
  navBarHeight: 44,
  tabBarHeight: 83,
  toolbarHeight: 56,
  searchBarHeight: 44,

  // Component-specific
  cardPadding: 16,
  cardRadius: 16,
  buttonPaddingHorizontal: 20,
  buttonPaddingVertical: 12,
  inputPadding: 12,
  iconSize: 24,
  avatarSize: 40,

  // Grid
  gridGutter: 16,
  gridMaxWidth: 1200,
};

// ============================================
// BORDER RADIUS (iOS corner radii)
// ============================================
export const BorderRadius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 20,
  full: 9999,

  // iOS specific
  cornerSm: 8,
  cornerMd: 12,
  cornerLg: 16,
  cornerXl: 20,
  cornerFull: 9999,

  // Component radii
  button: 10,
  card: 16,
  input: 10,
  badge: 9999,
  avatar: 9999,
  fab: 28,
  chip: 9999,
};

// ============================================
// TYPOGRAPHY (iOS Dynamic Type inspired)
// ============================================
export const Typography = {
  fontSize: {
    // Preserve existing system for compatibility
    none: 0,
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
    hero: 40,
    giant: 56,
  },

  fontWeight: {
    none: '400' as const,
    normal: '400' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    heavy: '900' as const,
  },

  lineHeight: {
    none: 1,
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.75,
    extraLoose: 2,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // iOS-style presets (matching SF Pro)
  presets: {
    // Large titles (Navigation bar)
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: 'bold' as const,
      letterSpacing: 0.37,
    },
    // Title 1 (Main page titles)
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: 'bold' as const,
      letterSpacing: 0.36,
    },
    // Title 2 (Section headers)
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: 'bold' as const,
      letterSpacing: 0.35,
    },
    // Title 3 (Card headers)
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38,
    },
    // Headline (Prominent text)
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41,
    },
    // Body (Primary content)
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41,
    },
    // Callout (Slightly emphasized)
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32,
    },
    // Subhead (Secondary content)
    subhead: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24,
    },
    // Footnote (Captions, metadata)
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08,
    },
    // Caption 1 (Small labels)
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    // Caption 2 (Tiny text)
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.07,
    },
  },
};

// Get font style for component
export const getFontStyle = (
  preset: keyof typeof Typography.presets
): { fontSize: number; fontWeight: string; lineHeight: number; letterSpacing: number } => {
  return Typography.presets[preset];
};

// ============================================
// ELEVATION (Shadows - iOS style)
// ============================================
export const Elevation = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  xs: {
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  xl: {
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  xxl: {
    shadowOpacity: 0.20,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
};

// ============================================
// ANIMATION (Timing & Curves)
// ============================================
export const Animation = {
  // Durations (milliseconds)
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
  modal: 350,

  // Spring configuration (iOS-like)
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  // Easing curves
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    linear: 'linear',
    // iOS specific bezier curves
    iosSpring: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    iosEaseOut: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    iosEaseIn: 'cubic-bezier(0.42, 0, 1, 1)',
  },

  // Stagger delays for list animations
  stagger: {
    xs: 50,
    sm: 75,
    md: 100,
    lg: 150,
  },
};

// ============================================
// Z-INDEX (Stacking context)
// ============================================
export const ZIndex = {
  base: 0,
  above: 1,
  raised: 2,
  dropdown: 100,
  modal: 1000,
  toast: 2000,
  loading: 3000,
  fab: 500,
  badge: 600,
};

// ============================================
// BREAKPOINTS (Responsive design)
// ============================================
export const Breakpoints = {
  mobile: 0,
  small: 320,
  medium: 375,
  large: 414,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  xWide: 1440,
};

// Get breakpoint name for current width
export const getBreakpoint = (width: number): keyof typeof Breakpoints => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop';
  return 'wide';
};

// ============================================
// GRID SYSTEM
// ============================================
export const Grid = {
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4,
  },
  gutter: Spacing.lg,
  maxWidth: 1200,
  margin: Spacing.lg,

  // Calculate columns based on width
  getColumns: (width: number) => {
    if (width < 768) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
  },
};

// ============================================
// COMPONENT TOKENS (Reusable component specs)
// ============================================
export const ComponentTokens = {
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    elevation: Elevation.sm,
    minHeight: 100,
  },

  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.button,
    minHeight: 44,
    minWidth: 88,
    iconSize: 20,
  },

  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.input,
    minHeight: 44,
    fontSize: Typography.fontSize.lg,
  },

  icon: {
    size: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      xxl: 40,
    },
  },

  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.badge,
    fontSize: Typography.fontSize.xs,
    minWidth: 20,
    height: 20,
  },

  avatar: {
    size: {
      sm: 32,
      md: 40,
      lg: 56,
      xl: 80,
    },
    borderRadius: BorderRadius.avatar,
  },

  chart: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 280,
    maxHeight: 400,
  },

  fab: {
    size: 56,
    miniSize: 40,
    borderRadius: 28,
    elevation: Elevation.lg,
  },

  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    fontSize: Typography.fontSize.sm,
    minHeight: 32,
  },

  tabBar: {
    height: 83,
    paddingBottom: Spacing.safeAreaBottom,
    paddingTop: Spacing.sm,
  },
};

// ============================================
// TRANSITION PRESETS (Screen transitions)
// ============================================
export const Transitions = {
  default: {
    duration: Animation.normal,
    timing: Animation.easing.iosEaseOut,
  },

  modal: {
    duration: Animation.modal,
    timing: Animation.easing.iosSpring,
  },

  fast: {
    duration: Animation.fast,
    timing: Animation.easing.easeOut,
  },

  slow: {
    duration: Animation.slow,
    timing: Animation.easing.easeInOut,
  },
};

// ============================================
// HAPTIC FEEDBACK (iOS Haptics)
// ============================================
export const Haptic = {
  light: 'light' as const,       // Selection, toggle
  medium: 'medium' as const,     // Confirm, success
  heavy: 'heavy' as const,       // Delete, destructive
  selection: 'selection' as const, // Pick from list
  impact: 'impact' as const,     // General impact
  notification: {
    success: 'success' as const,
    warning: 'warning' as const,
    error: 'error' as const,
  },
};

// ============================================
// ICON SIZES (Standardized)
// ============================================
export const IconSizes = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 40,
};

// ============================================
// SCREEN LAYOUT
// ============================================
export const Screen = {
  paddingHorizontal: Spacing.lg,
  paddingVertical: Spacing.lg,
  maxWidth: Grid.maxWidth,
  safeAreaTop: 47,
  safeAreaBottom: 34,
};

// ============================================
// EXPORT ALL AS DEFAULT
// ============================================
export default {
  Spacing,
  BorderRadius,
  Typography,
  Elevation,
  Animation,
  ZIndex,
  Breakpoints,
  Grid,
  ComponentTokens,
  Transitions,
  Haptic,
  IconSizes,
  Screen,
};
