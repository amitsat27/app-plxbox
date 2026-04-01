// 🎨 Pulsebox iOS Design System - Production Ready
// Follows Apple Human Interface Guidelines with iOS 18+ aesthetics
// Latest design language with enhanced glassmorphism and vibrant colors

export const Colors = {
  // ============================================
  // BRAND COLORS (iOS System Colors)
  // ============================================
  primary: '#007AFF',           // iOS System Blue
  primaryLight: '#5AC8FA',      // iOS System Blue Light
  primaryDark: '#0056CC',       // iOS System Blue Dark
  primaryContainer: '#E5F1FF',  // Blue 10%
  primarySurfaced: '#F2F8FF',   // Blue 5%

  secondary: '#34C759',         // iOS System Green
  secondaryLight: '#5FF963',
  secondaryDark: '#28A745',
  secondaryContainer: '#D9F2DF',
  secondarySurfaced: '#E8F5E9',

  tertiary: '#FF9500',          // iOS System Orange
  tertiaryLight: '#FFCC00',
  tertiaryDark: '#E69500',
  tertiaryContainer: '#FFF3E0',
  tertiarySurfaced: '#FFF8E1',

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  success: '#34C759',
  successLight: '#5FF963',
  successDark: '#28A745',
  successContainer: '#D9F2DF',
  successSurfaced: '#E8F5E9',

  warning: '#FF9500',
  warningLight: '#FFCC00',
  warningDark: '#E69500',
  warningContainer: '#FFF3E0',
  warningSurfaced: '#FFF8E1',

  error: '#FF3B30',             // iOS System Red
  errorLight: '#FF6954',
  errorDark: '#D70015',
  errorContainer: '#FFEBE8',
  errorSurfaced: '#FFF5F2',

  info: '#5AC8FA',              // iOS System Light Blue
  infoLight: '#7DD8FF',
  infoDark: '#4FA4DE',
  infoContainer: '#E5F5FF',
  infoSurfaced: '#F0F9FF',

  // ============================================
  // NEUTRAL / GRAY SCALE (iOS System Colors)
  // ============================================
  background: '#F2F2F7',        // iOS System Gray 6 - App background
  backgroundDark: '#000000',    // iOS Dark Mode Background (true black)
  backgroundElevated: '#FFFFFF', // Elevated surfaces
  backgroundSecondary: '#F9F9FA',
  surface: '#FFFFFF',           // Pure white for cards/sheets
  surfaceDark: '#1C1C1E',       // Dark mode surface
  surfaceVariant: '#E2E8F0',
  surfaceVariantDark: '#3A3A3C',
  surfaceTinted: '#F9F9FA',
  surfaceTintedDark: '#2C2C2E',

  // Card backgrounds (iOS 18 style)
  cardBackground: '#FFFFFF',
  cardBackgroundDark: '#1C1C1E',
  cardBackgroundElevated: '#FFFFFF',
  cardBackgroundElevatedDark: '#2C2C2E',
  cardBorder: 'rgba(0, 0, 0, 0.05)',
  cardBorderDark: 'rgba(255, 255, 255, 0.08)',

  // Interactive states
  interactive: 'rgba(0, 122, 255, 0.08)', // iOS light blue pressed
  interactiveDark: 'rgba(10, 132, 255, 0.12)',
  focus: 'rgba(0, 122, 255, 0.2)',
  focusDark: 'rgba(10, 132, 255, 0.25)',

  // Text hierarchy - following iOS contrast ratios
  textPrimary: '#1C1C1E',       // iOS Label - Primary text
  textPrimaryDark: '#FFFFFF',
  textSecondary: '#8E8E93',     // iOS Secondary Label
  textSecondaryDark: '#8E8E93',
  textTertiary: '#C7C7CC',      // iOS Tertiary Label
  textTertiaryDark: '#636366',
  textDisabled: '#E5E5EA',
  textDisabledDark: '#48484A',
  textInverse: '#FFFFFF',
  textInverseDark: '#000000',

  // Borders and separators
  border: '#E5E5EA',            // iOS Separator
  borderDark: '#38383A',
  borderLight: '#F2F2F7',
  borderStrong: '#C6C6C8',
  borderStrongDark: '#545456',

  // ============================================
  // OVERLAY & GLASS (iOS Blur Effects)
  // ============================================
  overlay: 'rgba(0, 0, 0, 0.4)',      // Modal backdrop
  overlayLight: 'rgba(0, 0, 0, 0.2)', // Action sheets
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(255, 255, 255, 0.72)',  // iOS Frosted Glass - Light
  glassDark: 'rgba(28, 28, 30, 0.80)', // iOS Frosted Glass - Dark
  glassStrong: 'rgba(255, 255, 255, 0.92)',
  glassThick: 'rgba(255, 255, 255, 0.85)',

  // ============================================
  // STATE COLORS
  // ============================================
  selected: '#007AFF20',         // Blue with 12% opacity
  selectedDark: '#0A84FF30',
  highlighted: '#E5E5EA',        // Light gray for pressed
  highlightedDark: '#3A3A3C',
  disabled: '#F2F2F7',           // Disabled background
  disabledDark: '#1C1C1E',

  // ============================================
  // CATEGORY COLORS (Bill Types)
  // ============================================
  categoryElectric: '#FF9500',   // Orange
  categoryWater: '#007AFF',      // Blue
  categoryGas: '#FF3B30',        // Red
  categoryWifi: '#34C759',       // Green
  categoryProperty: '#AF52DE',   // Purple
  categoryMgl: '#8B5CF6',        // Indigo

  // Vehicle types
  vehicleCar: '#007AFF',
  vehicleBike: '#34C759',
  vehicleTruck: '#FF9500',
  vehicleOther: '#AF52DE',

  // Appliance categories
  applianceKitchen: '#FF9500',
  applianceLiving: '#007AFF',
  applianceBedroom: '#34C759',
  applianceBathroom: '#5AC8FA',
  applianceOther: '#8E8E93',

  // ============================================
  // STATUS COLORS
  // ============================================
  statusPaid: '#34C759',
  statusPaidDark: '#30B658',
  statusPending: '#FF9500',
  statusPendingDark: '#F59E0B',
  statusOverdue: '#FF3B30',
  statusOverdueDark: '#D70015',
  statusActive: '#34C759',
  statusInactive: '#8E8E93',
  statusDraft: '#5AC8FA',

  // ============================================
  // CHART COLORS (Data visualization - iOS 18+ palette)
  // ============================================
  chartColors: [
    '#007AFF', // System Blue (primary)
    '#34C759', // System Green (success)
    '#FF9500', // System Orange (warning)
    '#FF3B30', // System Red (error)
    '#AF52DE', // System Purple
    '#5AC8FA', // System Light Blue (info)
    '#FFCC00', // System Yellow
    '#FF6B9D', // System Pink
    '#30B0C0', // System Teal
    '#FF6B00', // System Deep Orange
    '#30B0C7', // Cyan alternative
    '#C7C7CC', // Gray for neutral data
  ],

  // ============================================
  // SHADOW COLORS
  // ============================================
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowStrong: 'rgba(0, 0, 0, 0.25)',
  shadowStrongDark: 'rgba(0, 0, 0, 0.6)',

  // ============================================
  // GRADIENTS (iOS-style)
  // ============================================
  gradientPrimary: ['#007AFF', '#5AC8FA'],
  gradientSuccess: ['#34C759', '#5FF963'],
  gradientWarning: ['#FF9500', '#FFCC00'],
  gradientError: ['#FF3B30', '#FF6954'],
  gradientDark: ['#1C1C1E', '#2C2C2E'],
  gradientLight: ['#FFFFFF', '#F2F2F7'],
  gradientMesh: [
    ['#007AFF', '#5AC8FA', '#34C759'],
    ['#FF9500', '#FF3B30', '#AF52DE'],
  ],

  // ============================================
  // DARK MODE SPECIFIC (iOS 13+)
  // ============================================
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#ABABAB',
    textTertiary: '#6D6D70',
    border: '#38383A',
    separator: '#000000',
  },

  // ============================================
  // LEGACY COMPATIBILITY (keep for existing code)
  // ============================================
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  danger: '#FF3B30',
  dangerLight: '#FF6954',
  dangerDark: '#D70015',
  accent: '#FF9500',
  accentLight: '#FFCC00',
  accentDark: '#E69500',
};

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    electric: Colors.categoryElectric,
    water: Colors.categoryWater,
    gas: Colors.categoryGas,
    wifi: Colors.categoryWifi,
    property: Colors.categoryProperty,
    mgl: Colors.categoryMgl,
  };
  return colorMap[category] || Colors.primary;
};

// Helper for status colors
export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: Colors.statusPaid,
    pending: Colors.statusPending,
    overdue: Colors.statusOverdue,
    active: Colors.statusActive,
    inactive: Colors.statusInactive,
    draft: Colors.statusDraft,
  };
  return statusMap[status] || Colors.textSecondary;
};

// Helper for vehicle type colors
export const getVehicleTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    car: Colors.vehicleCar,
    bike: Colors.vehicleBike,
    truck: Colors.vehicleTruck,
    other: Colors.vehicleOther,
  };
  return colorMap[type] || Colors.primary;
};

// Helper for appliance category colors
export const getApplianceCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    kitchen: Colors.applianceKitchen,
    living: Colors.applianceLiving,
    bedroom: Colors.applianceBedroom,
    bathroom: Colors.applianceBathroom,
    other: Colors.applianceOther,
  };
  return colorMap[category] || Colors.primary;
};

// Get color for scheme (light/dark)
export const getColorScheme = (isDark: boolean) => ({
  background: isDark ? Colors.backgroundDark : Colors.background,
  surface: isDark ? Colors.surfaceDark : Colors.surface,
  textPrimary: isDark ? Colors.textPrimaryDark : Colors.textPrimary,
  textSecondary: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
  textTertiary: isDark ? Colors.textTertiaryDark : Colors.textTertiary,
  border: isDark ? Colors.borderDark : Colors.border,
  glass: isDark ? Colors.glassDark : Colors.glass,
  shadow: isDark ? Colors.shadowDark : Colors.shadow,
});

// Type exports for TypeScript
export type ColorKey = keyof typeof Colors;
export type SemanticColor = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info';
export type CategoryColor = keyof typeof Colors.categoryElectric | 'wifi' | 'property' | 'mgl';
export type VehicleTypeColor = keyof typeof Colors.vehicleCar;
export type ApplianceCategoryColor = keyof typeof Colors.applianceKitchen;
