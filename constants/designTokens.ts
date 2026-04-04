// 🎨 Pulsebox Design Tokens - Cosmic Sunset Edition (2025)
// Premium iOS 18+ design system with bold gradients & glassmorphism
// Matches the new color palette in theme/color.ts

// ============================================
// SPACING (4px base grid, generous iOS 18 style)
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

  // Semantic spacing (even more generous for premium feel)
  compact: 8,
  comfortable: 16,
  spacious: 24,
  generous: 32,
  expansive: 48,
  ultra: 64,

  // Safe areas (iOS status bar, home indicator)
  safeAreaBottom: 34,
  safeAreaTop: 47,
  safeAreaLeft: 0,
  safeAreaRight: 0,

  // Navigation heights (increased for floating navbar)
  navBarHeight: 76, // Increased from 60 for floating navbar
  tabBarHeight: 83,
  toolbarHeight: 56,
  searchBarHeight: 48, // Slightly taller for premium feel

  // Component-specific (enhanced for glassmorphism)
  cardPadding: 24, // Increased from 20 for more breathing room
  cardRadius: 28, // Increased from 20 for softer curves
  buttonPaddingHorizontal: 22,
  buttonPaddingVertical: 16, // Increased for better touch targets
  inputPadding: 18,
  iconSize: 24,
  avatarSize: 56, // Increased from 48

  // Grid
  gridGutter: 20, // Increased from 16
  gridMaxWidth: 1200,
  gridPadding: 24, // Increased from 20

  // Glow effects
  glowSpread: 20,
  glowIntensity: 0.4,
};

// ============================================
// BORDER RADIUS (Super-soft iOS 18+ style)
// ============================================
export const BorderRadius = {
  none: 0,
  xs: 8,
  sm: 10,
  md: 16, // Increased from 12
  lg: 20, // Increased from 16
  xl: 28, // Increased from 20
  xxl: 36,
  xxxl: 44,
  full: 9999,

  // iOS specific (kept for compatibility)
  cornerSm: 10,
  cornerMd: 14,
  cornerLg: 18,
  cornerXl: 24,
  cornerFull: 9999,

  // Component radii (premium soft look)
  button: 16, // Increased from 12
  card: 28, // Increased from 20 - very soft
  input: 16,
  badge: 9999,
  avatar: 9999,
  fab: 32, // Increased from 28
  chip: 9999,
  navBar: 24, // For floating navbar bottom corners

  // Special shapes
  pill: 9999, // Fully rounded (for category pills)
  bubble: 20, // Chat bubble style
};

// ============================================
// TYPOGRAPHY (Distinctive fonts for 2025)
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
    massive: 72, // New for hero greeting
  },

  fontWeight: {
    none: "400" as const,
    normal: "400" as const,
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
    heavy: "900" as const,
    ultraBold: "900" as const, // New for impact
  },

  lineHeight: {
    none: 1,
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.75,
    extraLoose: 2,
    ultraLoose: 2.2,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    ultra: 1.5, // For dramatic headlines
  },

  // ==========================================
  // CUSTOM FONT FAMILIES (To be added to app.json)
  // ==========================================
  // Display font: 'Space Grotesk' (for headings, hero text)
  // Body font: 'Inter' or 'Satoshi' (for readability)
  // Install: expo install @expo-google-fonts/space-grotesk @expo-google-fonts/inter
  // Usage: fontFamily: 'SpaceGrotesk_700Bold', etc.

  // iOS-style presets (matching SF Pro - kept for compatibility)
  presets: {
    // Large titles (Navigation bar)
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: "bold" as const,
      letterSpacing: 0.37,
    },
    // Title 1 (Main page titles)
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "bold" as const,
      letterSpacing: 0.36,
    },
    // Title 2 (Section headers)
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "bold" as const,
      letterSpacing: 0.35,
    },
    // Title 3 (Card headers)
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "600" as const,
      letterSpacing: 0.38,
    },
    // Headline (Prominent text)
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "600" as const,
      letterSpacing: -0.41,
    },
    // Body (Primary content)
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "400" as const,
      letterSpacing: -0.41,
    },
    // Callout (Slightly emphasized)
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "400" as const,
      letterSpacing: -0.32,
    },
    // Subhead (Secondary content)
    subhead: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "400" as const,
      letterSpacing: -0.24,
    },
    // Footnote (Captions, metadata)
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "400" as const,
      letterSpacing: -0.08,
    },
    // Caption 1 (Small labels)
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400" as const,
      letterSpacing: 0,
    },
    // Caption 2 (Tiny text)
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: "400" as const,
      letterSpacing: 0.07,
    },
  },

  // ==========================================
  // CUSTOM PRESETS (For new design)
  // ==========================================
  cosmicHero: {
    fontSize: 42, // Very large for greeting
    lineHeight: 52,
    fontWeight: "900" as const,
    letterSpacing: -0.5,
  },

  cosmicHeroSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "bold" as const,
    letterSpacing: 0.5,
  },

  glassCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "medium" as const,
    letterSpacing: 0.5,
  },

  metricValue: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900" as const,
    letterSpacing: -1,
  },

  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "medium" as const,
    letterSpacing: 0.5,
  },

  categoryTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "semibold" as const,
    letterSpacing: 0.2,
  },

  amountLarge: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
};

// Get font style for component
export const getFontStyle = (
  preset: keyof typeof Typography.presets | keyof typeof Typography,
): {
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
} => {
  if (preset in Typography.presets) {
    return Typography.presets[preset as keyof typeof Typography.presets];
  }
  // Handle custom presets
  const customPresets = {
    cosmicHero: Typography.cosmicHero,
    cosmicHeroSmall: Typography.cosmicHeroSmall,
    glassCaption: Typography.glassCaption,
    metricValue: Typography.metricValue,
    metricLabel: Typography.metricLabel,
    categoryTitle: Typography.categoryTitle,
    amountLarge: Typography.amountLarge,
  };
  return (
    customPresets[preset as keyof typeof customPresets] ||
    Typography.presets.body
  );
};

// ============================================
// ELEVATION (Colored shadows & glows)
// ============================================
export const Elevation = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  // Glassmorphic levels (subtle depth)
  xs: {
    shadowOpacity: 0.08, // Increased from 0.04
    shadowRadius: 8, // Increased from 4
    shadowOffset: { width: 0, height: 4 }, // Increased
    elevation: 2,
    // Add colored glow for cosmic effect
    shadowColor: "rgba(124, 58, 237, 0.15)", // Violet tint
  },

  sm: {
    shadowOpacity: 0.12, // Increased from 0.06
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    shadowColor: "rgba(124, 58, 237, 0.2)",
  },

  md: {
    shadowOpacity: 0.18, // Increased from 0.10
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    shadowColor: "rgba(124, 58, 237, 0.25)",
  },

  lg: {
    shadowOpacity: 0.24, // Increased from 0.14
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
    shadowColor: "rgba(124, 58, 237, 0.3)",
  },

  xl: {
    shadowOpacity: 0.32, // Increased from 0.18
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
    shadowColor: "rgba(167, 139, 250, 0.35)", // Brighter violet
  },

  xxl: {
    shadowOpacity: 0.42, // Increased from 0.22
    shadowRadius: 56,
    shadowOffset: { width: 0, height: 32 },
    elevation: 32,
    shadowColor: "rgba(167, 139, 250, 0.45)",
  },

  // Glow variants (for accents)
  glow: {
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    shadowColor: "rgba(124, 58, 237, 0.6)",
  },

  glowBlue: {
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    shadowColor: "rgba(59, 130, 246, 0.6)",
  },

  glowPink: {
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    shadowColor: "rgba(236, 72, 153, 0.6)",
  },
};

// ============================================
// ANIMATION (Enhanced for premium feel)
// ============================================
export const Animation = {
  // Durations (milliseconds)
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
  modal: 350,
  entrance: 500, // For hero animations

  // Stagger delays (for sequential reveals)
  stagger: {
    xs: 50,
    sm: 75,
    md: 100, // Default
    lg: 150,
    xl: 200,
    hero: 120, // For hero section items
  },

  // Spring configuration (iOS-like, tuned for smoothness)
  spring: {
    damping: 22, // Slightly more damp for premium feel
    stiffness: 320, // Slightly stiffer for responsiveness
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  // Gentle spring for subtle motions
  springGentle: {
    damping: 25,
    stiffness: 280,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  // Bouncy spring for playful interactions
  springBouncy: {
    damping: 15,
    stiffness: 350,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  // Easing curves
  easing: {
    easeInOut: "ease-in-out",
    easeOut: "ease-out",
    easeIn: "ease-in",
    linear: "linear",
    // iOS specific bezier curves
    iosSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Slight bounce
    iosEaseOut: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    iosEaseIn: "cubic-bezier(0.42, 0, 1, 1)",
    // Custom premium curves
    smoothOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    smoothInOut: "cubic-bezier(0.4, 0, 0.2, 1)", // Material standard
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
  navbar: 100, // Floating navbar above content
  glow: 50, // Glow effects above cards
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
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1280) return "desktop";
  return "wide";
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
// COMPONENT TOKENS (Premium specs)
// ============================================
export const ComponentTokens = {
  card: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card,
    elevation: Elevation.sm,
    minHeight: 120, // Increased from 100
    backgroundOpacity: 0.65, // For glass effect
  },

  glassCard: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card,
    blurIntensity: 20, // For BlurView
    backgroundOpacity: 0.6,
    borderWidth: 1,
    borderOpacity: 0.2,
  },

  button: {
    paddingVertical: Spacing.buttonPaddingVertical,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    borderRadius: BorderRadius.button,
    minHeight: 52, // Increased from 44 for premium feel
    minWidth: 88,
    iconSize: 20,
  },

  input: {
    padding: Spacing.inputPadding,
    borderRadius: BorderRadius.input,
    minHeight: 52,
    fontSize: Typography.fontSize.lg,
  },

  icon: {
    size: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      xxl: 40,
      hero: 56, // For hero icons
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
      hero: 72, // For hero avatar
    },
    borderRadius: BorderRadius.avatar,
  },

  fab: {
    size: 64, // Increased from 56
    miniSize: 40,
    borderRadius: 32,
    elevation: Elevation.lg,
  },

  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    fontSize: Typography.fontSize.sm,
    minHeight: 36,
  },

  // Chart-specific tokens (premium)
  chart: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 300, // Increased from 280
    maxHeight: 420,
    lineWidth: 4, // Thicker lines for visibility
    dataPointRadius: 8, // Larger touch targets
    gridColorLight: "rgba(124, 58, 237, 0.1)", // Subtle purple tint
    gridColorDark: "rgba(167, 139, 250, 0.15)",
    axisColorLight: "#64748B",
    axisColorDark: "#94A3B8",
    tooltipPadding: Spacing.md,
    tooltipRadius: 12,
    tooltipBackgroundOpacity: 0.9,
  },

  tabBar: {
    height: 83,
    paddingBottom: Spacing.safeAreaBottom,
    paddingTop: Spacing.sm,
  },

  navbar: {
    height: 76,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.navBar,
    blurIntensity: 80, // Heavy blur for floating effect
    elevation: Elevation.lg,
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

  // Premium transitions
  hero: {
    duration: Animation.entrance,
    timing: Animation.easing.smoothOut,
  },

  stagger: {
    duration: Animation.normal,
    staggerDelay: Animation.stagger.md,
    timing: Animation.easing.smoothOut,
  },
};

// ============================================
// HAPTIC FEEDBACK (Enhanced for interactions)
// ============================================
export const Haptic = {
  light: "light" as const, // Selection, toggle
  medium: "medium" as const, // Confirm, success
  heavy: "heavy" as const, // Delete, destructive
  selection: "selection" as const, // Pick from list
  impact: "impact" as const, // General impact
  notification: {
    success: "success" as const,
    warning: "warning" as const,
    error: "error" as const,
  },
  // New premium haptics
  premium: "medium", // For hero interactions
  celebration: "heavy", // For major achievements
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
  hero: 56, // Large hero icons
};

// ============================================
// SCREEN LAYOUT
// ============================================
export const Screen = {
  paddingHorizontal: Spacing.xl,
  paddingVertical: Spacing.xl,
  maxWidth: Grid.maxWidth,
  safeAreaTop: 47,
  safeAreaBottom: 34,
  contentInset: {
    top: Spacing.xl,
    bottom: Spacing.xxl,
  },
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
