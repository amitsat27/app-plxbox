// 📏 Spacing Scale - 4px base grid (iOS standard)
// Consistent spacing throughout the app

export const Spacing = {
  // Base unit multiples
  none: 0,
  xs: 4,     // 1 unit
  sm: 8,     // 2 units
  md: 12,    // 3 units
  lg: 16,    // 4 units
  xl: 20,    // 5 units
  xxl: 24,   // 6 units
  xxxl: 32,  // 8 units
  huge: 40,  // 10 units
  massive: 48, // 12 units
  enormous: 64, // 16 units

  // iOS standard values
  compact: 8,
  comfortable: 16,
  spacious: 24,

  // Special use cases
  safeAreaBottom: 34, // iPhone home indicator area
  safeAreaTop: 47,    // Status bar + notch
  navBarHeight: 44,   // iOS navigation bar
  tabBarHeight: 83,   // iOS tab bar (with safe area)
  statusBarHeight: 44,

  // Border radii related
  hairline: 0.5,
  thin: 1,
  regular: 2,
};

// Corner radius scale (iOS style)
export const Radius = {
  none: 0,
  sm: 6,     // Small buttons, chips
  md: 10,    // Standard cards, inputs
  lg: 14,    // Large cards, sheet headers
  xl: 18,    // Hero cards, large modals
  xxl: 24,   // Full-screen cards
  full: 999, // Pills, avatars
  circle: 999,
};

// Export as default for convenient import
export default Spacing;
