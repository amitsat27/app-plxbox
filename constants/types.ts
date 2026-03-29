// 🎯 Type definitions for Design System Tokens

// Spacing
export interface SpacingValues {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
  massive: number;
  enormous: number;
  compact: number;
  comfortable: number;
  spacious: number;
  safeAreaBottom: number;
  safeAreaTop: number;
  navBarHeight: number;
  tabBarHeight: number;
  statusBarHeight: number;
  hairline: number;
  thin: number;
  regular: number;
}

// Radius
export interface RadiusValues {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
  circle: number;
}

// Elevation/Shadow
export interface ElevationValue {
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: {
    width: number;
    height: number;
  };
  elevation: number;
}

export interface ElevationValues {
  none: ElevationValue;
  xs: ElevationValue;
  sm: ElevationValue;
  md: ElevationValue;
  lg: ElevationValue;
  xl: ElevationValue;
}

// Animation
export interface AnimationConfig {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface AnimationTiming {
  fast: number;
  normal: number;
  slow: number;
  verySlow: number;
  spring: AnimationConfig;
  springBouncy: AnimationConfig;
  springSmooth: AnimationConfig;
  easing: {
    easeInOut: string;
    easeOut: string;
    easeIn: string;
    linear: string;
  };
}

// Component tokens
export interface ComponentTokens {
  card: {
    padding: number;
    paddingVertical: number;
    borderRadius: number;
    elevation: string;
  };
  button: {
    height: number;
    paddingHorizontal: number;
    borderRadius: number;
    minWidth: number;
    iconSize: number;
  };
  input: {
    height: number;
    paddingHorizontal: number;
    borderRadius: number;
    fontSize: number;
    minHeight: number;
  };
  icon: {
    size: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  badge: {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
    minHeight: number;
    fontSize: number;
  };
  avatar: {
    size: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    borderRadius: number;
  };
  listItem: {
    height: number;
    minHeight: number;
    paddingHorizontal: number;
    iconSize: number;
  };
  tabBar: {
    height: number;
    iconSize: number;
    labelSize: number;
  };
  navBar: {
    height: number;
    largeTitleHeight: number;
  };
  chart: {
    padding: number;
    borderRadius: number;
    minHeight: number;
  };
  fab: {
    size: number;
    miniSize: number;
    elevation: string;
  };
  sheet: {
    cornerRadius: number;
    maxHeight: string | number;
  };
}

// All tokens combined
export interface DesignTokens {
  Spacing: SpacingValues;
  Radius: RadiusValues;
  Elevation: ElevationValues;
  Animation: AnimationTiming;
  ZIndex: Record<string, number>;
  Breakpoints: Record<string, number>;
  Grid: {
    columns: Record<string, number>;
    gutter: number;
    maxWidth: number;
  };
  ComponentTokens: ComponentTokens;
}

// Types are automatically exported via interface declarations above
// No additional export needed
