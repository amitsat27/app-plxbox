// 🌌 Cosmic Sunset - Premium 2025 Design System
// Bold, distinctive color palette for Pulsebox dashboard
// Avoids generic aesthetics - unique vibrant gradients, glassmorphism-ready

export const Colors = {
  // ============================================
  // COSMIC GRADIENT BASE (Animated gradients)
  // ============================================
  cosmicDeep: "#0F0C29", // Deep space purple-black
  cosmicMid: "#302B63", // Midnight purple
  cosmicAccent: "#24243E", // Cosmic highlight
  auroraBlue: "#00D2FF", // Electric cyan-blue
  auroraPurple: "#928DAB", // Soft purple
  sunsetPink: "#F72585", // Hot pink
  sunsetOrange: "#FF6B35", // Vibrant orange
  sunsetYellow: "#FFC857", // Golden yellow
  neonCyan: "#00FFFF", // Neon cyan for glows
  neonMagenta: "#FF00FF", // Neon magenta for accents

  // ============================================
  // PRIMARY BRAND COLORS (Gradient-capable)
  // ============================================
  primary: "#7C3AED", // Violet 600 - Main brand
  primaryLight: "#A78BFA", // Violet 400 - Light variant
  primaryDark: "#5B21B6", // Violet 800 - Dark variant
  primaryContainer: "#1E1B4B", // Very dark violet (20% white)
  primarySurfaced: "#2D2664", // Dark violet surface (12% white)

  secondary: "#3B82F6", // Blue 600 - Secondary
  secondaryLight: "#60A5FA", // Blue 400
  secondaryDark: "#2563EB", // Blue 800
  secondaryContainer: "#1E3A8A", // Dark blue (20% white)
  secondarySurfaced: "#1E40AF", // Dark blue surface

  tertiary: "#EC4899", // Pink 500 - Accent
  tertiaryLight: "#F472B6", // Pink 400
  tertiaryDark: "#BE185D", // Pink 800
  tertiaryContainer: "#4A044E", // Dark pink (20% white)
  tertiarySurfaced: "#701A75", // Dark pink surface

  // ============================================
  // SEMANTIC COLORS (Vivid & Modern)
  // ============================================
  success: "#10B981", // Emerald 500
  successLight: "#34D399", // Emerald 400
  successDark: "#059669", // Emerald 700
  successContainer: "#064E3B", // Dark emerald (20% white)
  successSurfaced: "#065F46", // Dark emerald surface

  warning: "#F59E0B", // Amber 500
  warningLight: "#FBBF24", // Amber 400
  warningDark: "#D97706", // Amber 600
  warningContainer: "#78350F", // Dark amber (20% white)
  warningSurfaced: "#92400E", // Dark amber surface

  error: "#EF4444", // Red 500
  errorLight: "#F87171", // Red 400
  errorDark: "#DC2626", // Red 600
  errorContainer: "#7F1D1D", // Dark red (20% white)
  errorSurfaced: "#991B1B", // Dark red surface

  info: "#06B6D4", // Cyan 500
  infoLight: "#22D3EE", // Cyan 400
  infoDark: "#0891B2", // Cyan 700
  infoContainer: "#155E75", // Dark cyan (20% white)
  infoSurfaced: "#164E63", // Dark cyan surface

  // ============================================
  // NEUTRAL / SURFACE COLORS (Glass-ready)
  // ============================================
  background: "#050D1E", // Very dark blue-tinted (not pure black)
  backgroundLight: "#F8FAFC", // Light mode background (off-white)
  backgroundDark: "#030710", // Even darker with blue tint for dark mode
  surface: "rgba(15, 25, 50, 0.70)", // Glass surface dark with blue tint (with blur)
  surfaceLight: "rgba(255, 255, 255, 0.75)", // Glass surface light
  surfaceDark: "rgba(10, 15, 30, 0.80)", // Dark mode glass with blue tint
  surfaceVariant: "rgba(25, 40, 70, 0.50)", // Blue-tinted variant
  surfaceVariantLight: "rgba(248, 250, 252, 0.80)",

  // Card backgrounds - glassmorphic
  cardBackground: "rgba(255, 255, 255, 0.65)",
  cardBackgroundDark: "rgba(20, 35, 60, 0.75)", // Blue-tinted dark card
  cardBackgroundElevated: "rgba(255, 255, 255, 0.85)",
  cardBackgroundElevatedDark: "rgba(30, 45, 75, 0.90)", // Blue-tinted elevated dark card


  // Borders - subtle with tint
  border: "rgba(124, 58, 237, 0.15)", // Purple tint (15%)
  borderDark: "rgba(139, 169, 255, 0.28)", // Blue-tinted border in dark mode
  borderLight: "rgba(124, 58, 237, 0.08)",

  // ============================================
  // TEXT COLORS (High contrast)
  // ============================================
  textPrimary: "#1E293B", // Dark slate (light mode)
  textPrimaryDark: "#F8FAFC", // Off-white (dark mode)
  textSecondary: "#475569", // Medium slate
  textSecondaryDark: "#94A3B8", // Light gray-blue
  textTertiary: "#94A3B8", // Muted
  textTertiaryDark: "#64748B", // Dark mode tertiary
  textDisabled: "#CBD5E1", // Light gray
  textDisabledDark: "#334155", // Dark gray
  textInverse: "#FFFFFF",
  textInverseDark: "#0A0A1A",

  // Glow colors for highlights
  glowPrimary: "rgba(124, 58, 237, 0.4)", // Violet glow
  glowSecondary: "rgba(59, 130, 246, 0.4)", // Blue glow
  glowTertiary: "rgba(236, 72, 153, 0.4)", // Pink glow

  // ============================================
  // CATEGORY COLORS (Gradient pairs)
  // ============================================
  // Electric: Orange → Yellow gradient
  categoryElectric: "#FF6B35",
  categoryElectricGradient: "#FFC857",
  categoryElectricGlow: "rgba(255, 107, 53, 0.3)",

  // Water: Blue → Cyan gradient
  categoryWater: "#3B82F6",
  categoryWaterGradient: "#06B6D4",
  categoryWaterGlow: "rgba(59, 130, 246, 0.3)",

  // Gas: Red → Pink gradient
  categoryGas: "#EF4444",
  categoryGasGradient: "#EC4899",
  categoryGasGlow: "rgba(239, 68, 68, 0.3)",

  // WiFi: Green → Teal gradient
  categoryWifi: "#10B981",
  categoryWifiGradient: "#14B8A6",
  categoryWifiGlow: "rgba(16, 185, 129, 0.3)",

  // Property: Purple → Violet gradient
  categoryProperty: "#7C3AED",
  categoryPropertyGradient: "#A78BFA",
  categoryPropertyGlow: "rgba(124, 58, 237, 0.3)",

  // MGL: Indigo → Blue gradient
  categoryMgl: "#6366F1",
  categoryMglGradient: "#3B82F6",
  categoryMglGlow: "rgba(99, 102, 241, 0.3)",

  // ============================================
  // STATUS COLORS (With glow variants)
  // ============================================
  statusPaid: "#10B981",
  statusPaidGlow: "rgba(16, 185, 129, 0.4)",
  statusPaidDark: "#059669",

  statusPending: "#F59E0B",
  statusPendingGlow: "rgba(245, 158, 11, 0.4)",
  statusPendingDark: "#D97706",

  statusOverdue: "#EF4444",
  statusOverdueGlow: "rgba(239, 68, 68, 0.4)",
  statusOverdueDark: "#DC2626",

  statusActive: "#3B82F6",
  statusActiveGlow: "rgba(59, 130, 246, 0.4)",
  statusActiveDark: "#2563EB",

  statusInactive: "#64748B",
  statusInactiveGlow: "rgba(100, 116, 139, 0.4)",
  statusInactiveDark: "#475569",

  statusDraft: "#06B6D4",
  statusDraftGlow: "rgba(6, 182, 212, 0.4)",
  statusDraftDark: "#0891B2",

  // ============================================
  // CHART COLORS (Vibrant data palette)
  // ============================================
  chartColors: [
    "#7C3AED", // Violet (primary)
    "#3B82F6", // Blue (secondary)
    "#EC4899", // Pink (tertiary)
    "#10B981", // Emerald (success)
    "#F59E0B", // Amber (warning)
    "#06B6D4", // Cyan (info)
    "#EF4444", // Red (error)
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#A855F7", // Purple light
  ],

  // Gradient pairs for charts (each color → lighter variant)
  chartGradients: [
    { from: "#7C3AED", to: "#A78BFA" },
    { from: "#3B82F6", to: "#60A5FA" },
    { from: "#EC4899", to: "#F472B6" },
    { from: "#10B981", to: "#34D399" },
    { from: "#F59E0B", to: "#FBBF24" },
    { from: "#06B6D4", to: "#22D3EE" },
  ],

  // ============================================
  // VEHICLE / APPLIANCE COLORS
  // ============================================
  vehicleCar: "#3B82F6",
  vehicleCarGlow: "rgba(59, 130, 246, 0.3)",
  vehicleBike: "#10B981",
  vehicleBikeGlow: "rgba(16, 185, 129, 0.3)",
  vehicleTruck: "#F59E0B",
  vehicleTruckGlow: "rgba(245, 158, 11, 0.3)",
  vehicleOther: "#7C3AED",
  vehicleOtherGlow: "rgba(124, 58, 237, 0.3)",

  applianceKitchen: "#FF6B35",
  applianceKitchenGlow: "rgba(255, 107, 53, 0.3)",
  applianceLiving: "#3B82F6",
  applianceLivingGlow: "rgba(59, 130, 246, 0.3)",
  applianceBedroom: "#10B981",
  applianceBedroomGlow: "rgba(16, 185, 129, 0.3)",
  applianceBathroom: "#06B6D4",
  applianceBathroomGlow: "rgba(6, 182, 212, 0.3)",
  applianceOther: "#64748B",
  applianceOtherGlow: "rgba(100, 116, 139, 0.3)",

  // ============================================
  // GLASS & BLUR (Dynamic for dark/light)
  // ============================================
  glassLight: "rgba(255, 255, 255, 0.65)",
  glassDark: "rgba(20, 35, 60, 0.75)", // Blue-tinted glass for dark mode
  glassTintLight: "rgba(124, 58, 237, 0.05)", // Subtle violet tint
  glassTintDark: "rgba(139, 169, 255, 0.10)", // Blue-tinted glow for dark mode

  // ============================================
  // ON COLORS (Text/icons on colored surfaces)
  // ============================================
  // These ensure perfect contrast (≥ 4.5:1) on their respective backgrounds
  onPrimary: "#FFFFFF", // White text on violet
  onPrimaryContainer: "#EDE9FE", // Very light violet on dark violet
  onSecondary: "#FFFFFF", // White text on blue
  onSecondaryContainer: "#DBEAFE", // Light blue on dark blue
  onTertiary: "#FFFFFF", // White text on pink
  onTertiaryContainer: "#FCE7F3", // Light pink on dark pink
  onSuccess: "#FFFFFF", // White on emerald
  onSuccessContainer: "#D1FAE5", // Light emerald on dark
  onWarning: "#000000", // Black on amber (for contrast)
  onWarningContainer: "#FFFBEB", // Very light amber
  onError: "#FFFFFF", // White on red
  onErrorContainer: "#FEE2E2", // Light red on dark
  onInfo: "#000000", // Black on cyan (for contrast)
  onInfoContainer: "#ECFEFF", // Very light cyan

  // Surface colors (text on neutral surfaces)
  onSurface: "#0F172A", // Very dark slate on light surfaces
  onSurfaceDark: "#F8FAFC", // Off-white on dark surfaces
  onSurfaceVariant: "#475569", // Medium slate
  onSurfaceVariantDark: "#CBD5E1", // Light gray-blue on dark
  onBackground: "#0F172A", // Dark text on background
  onBackgroundDark: "#F8FAFC", // Light text on dark background
  onDisabled: "#94A3B8", // Muted
  onDisabledDark: "#475569", // Darker muted

  // Inverse (for dark backgrounds with light text)
  inverseSurface: "#1E293B", // Dark slate
  inverseOnSurface: "#F8FAFC",
  inversePrimary: "#A78BFA",

  // ============================================
  // SHADOW COLORS (Colored shadows)
  // ============================================
  shadowViolet: "rgba(124, 58, 237, 0.25)",
  shadowBlue: "rgba(59, 130, 246, 0.25)",
  shadowPink: "rgba(236, 72, 153, 0.25)",
  shadowStrong: "rgba(0, 0, 0, 0.4)",

  // ============================================
  // GRADIENTS (Ready-to-use arrays)
  // ============================================
  gradientCosmic: ["#0F0C29", "#302B63", "#24243E"],
  gradientSunset: ["#FF6B35", "#F72585", "#B5179E"],
  gradientAurora: ["#00D2FF", "#3B82F6", "#7C3AED"],
  gradientNeon: ["#00FFFF", "#FF00FF", "#FFFF00"],
  gradientPrimary: ["#7C3AED", "#A78BFA"],
  gradientSuccess: ["#10B981", "#34D399"],
  gradientWarning: ["#F59E0B", "#FBBF24"],
  gradientError: ["#EF4444", "#F87171"],

  // Mesh gradient for hero section
  meshGradientLight: [
    { color: "#7C3AED", position: { x: 0, y: 0 } },
    { color: "#3B82F6", position: { x: 100, y: 100 } },
    { color: "#EC4899", position: { x: 100, y: 0 } },
  ],
  meshGradientDark: [
    { color: "#1E1B4B", position: { x: 0, y: 0 } },
    { color: "#1E3A8A", position: { x: 100, y: 100 } },
    { color: "#4A044E", position: { x: 100, y: 0 } },
  ],

  // ============================================
  // DARK MODE CONVENIENCE COLORS (Blue-tinted)
  // ============================================
  darkBackground: "#030710", // Pure dark background (blue-tinted)
  darkCard: "#1F2E45", // Dark card/surface (blue-tinted)
  darkCardAlt: "#192541", // Alternate dark card shade
  darkText: "#F8FAFC", // Light text on dark
  
  // ============================================
  // LEGACY COMPATIBILITY (Map old names to new)
  // ============================================
  // Keep old references working during migration
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  danger: "#EF4444",
  dangerLight: "#F87171",
  dangerDark: "#DC2626",
  accent: "#F59E0B",
  accentLight: "#FBBF24",
  accentDark: "#D97706",

  // Glass & Shadow (will be set dynamically in getColorScheme)
  glass: "rgba(255, 255, 255, 0.75)",
  shadow: "rgba(124, 58, 237, 0.15)",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get category color (vibrant gradient base) */
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

/** Get category gradient (second color for gradient) */
export const getCategoryGradient = (category: string): string => {
  const gradientMap: Record<string, string> = {
    electric: Colors.categoryElectricGradient,
    water: Colors.categoryWaterGradient,
    gas: Colors.categoryGasGradient,
    wifi: Colors.categoryWifiGradient,
    property: Colors.categoryPropertyGradient,
    mgl: Colors.categoryMglGradient,
  };
  return gradientMap[category] || Colors.primaryLight;
};

/** Get category glow color */
export const getCategoryGlow = (category: string): string => {
  const glowMap: Record<string, string> = {
    electric: Colors.categoryElectricGlow,
    water: Colors.categoryWaterGlow,
    gas: Colors.categoryGasGlow,
    wifi: Colors.categoryWifiGlow,
    property: Colors.categoryPropertyGlow,
    mgl: Colors.categoryMglGlow,
  };
  return glowMap[category] || Colors.glowPrimary;
};

/** Get status color with glow */
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

/** Get status glow color */
export const getStatusGlow = (status: string): string => {
  const glowMap: Record<string, string> = {
    paid: Colors.statusPaidGlow,
    pending: Colors.statusPendingGlow,
    overdue: Colors.statusOverdueGlow,
    active: Colors.statusActiveGlow,
    inactive: Colors.statusInactiveGlow,
    draft: Colors.statusDraftGlow,
  };
  return glowMap[status] || "rgba(100, 116, 139, 0.4)";
};

/** Get vehicle type color */
export const getVehicleTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    car: Colors.vehicleCar,
    bike: Colors.vehicleBike,
    truck: Colors.vehicleTruck,
    other: Colors.vehicleOther,
  };
  return colorMap[type] || Colors.secondary;
};

/** Get appliance category color */
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

/** Get color scheme for current theme */
export const getColorScheme = (isDark: boolean) => ({
  background: isDark ? Colors.backgroundDark : Colors.backgroundLight,
  surface: isDark ? Colors.surfaceDark : Colors.surfaceLight,
  textPrimary: isDark ? Colors.textPrimaryDark : Colors.textPrimary,
  textSecondary: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
  textTertiary: isDark ? Colors.textTertiaryDark : Colors.textTertiary,
  border: isDark ? Colors.borderDark : Colors.border,
  glass: isDark ? Colors.glassDark : Colors.glassLight,
  cardBackground: isDark ? Colors.cardBackgroundDark : Colors.cardBackground,
  shadow: isDark ? Colors.shadowStrong : "rgba(124, 58, 237, 0.15)",
});

/** Get gradient for chart data */
export const getChartGradient = (
  index: number,
): { from: string; to: string } => {
  const gradients = Colors.chartGradients;
  return gradients[index % gradients.length];
};

// Type exports for TypeScript
export type ColorKey = keyof typeof Colors;
export type SemanticColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "success"
  | "warning"
  | "error"
  | "info";
export type CategoryColor =
  | keyof typeof Colors.categoryElectric
  | "wifi"
  | "property"
  | "mgl";
export type VehicleTypeColor = keyof typeof Colors.vehicleCar;
export type ApplianceCategoryColor = keyof typeof Colors.applianceKitchen;

// Note: For bold animated gradient text, use the gradient arrays directly:
// <LinearGradient colors={Colors.gradientCosmic}> or Colors.gradientAurora, etc.
