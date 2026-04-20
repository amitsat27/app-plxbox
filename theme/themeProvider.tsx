/**
 * 🎨 Advanced Theme Provider - Senior Design System
 * Manages unified dark/light theme with Firebase persistence
 * WCAG AA Accessibility Standard
 */

import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "auto";

// Senior Design System - Premium color palette
export const LIGHT_THEME = {
  // ============== SURFACE COLORS ==============
  surface: {
    primary: "#FFFFFF", // Pure white - primary surfaces
    secondary: "#F8FAFC", // Off-white - secondary surfaces
    tertiary: "#F1F5F9", // Light gray - tertiary surfaces
    overlay: "#EFF6FF", // Subtle overlay
  },

  // ============== BRAND COLORS ==============
  brand: {
    primary: "#7C3AED", // Violet 600
    primaryLight: "#A78BFA", // Violet 400
    primaryDark: "#5B21B6", // Violet 800
    secondary: "#3B82F6", // Blue 600
    accent: "#EC4899", // Pink 500
  },

  // ============== SEMANTIC COLORS ==============
  semantic: {
    success: "#10B981", // Emerald 500
    warning: "#F59E0B", // Amber 500
    error: "#EF4444", // Red 500
    info: "#06B6D4", // Cyan 500
  },

  // ============== TEXT COLORS ==============
  text: {
    primary: "#0F172A", // Very dark slate - main text
    secondary: "#475569", // Medium slate - secondary text
    tertiary: "#94A3B8", // Light slate - tertiary text
    disabled: "#CBD5E1", // Disabled text
    contrast: "#FFFFFF", // Text on colored surfaces
  },

  // ============== BORDER & DIVIDER ==============
  border: {
    primary: "rgba(124, 58, 237, 0.12)", // Violet tint
    secondary: "rgba(15, 23, 42, 0.08)", // Gray tint
    subtle: "rgba(203, 213, 225, 0.5)", // Very subtle
  },

  // ============== SHADOWS ==============
  shadow: {
    sm: "rgba(15, 23, 42, 0.05)",
    md: "rgba(15, 23, 42, 0.1)",
    lg: "rgba(15, 23, 42, 0.15)",
    xl: "rgba(15, 23, 42, 0.2)",
  },
};

export const DARK_THEME = {
  // ============== SURFACE COLORS ==============
  surface: {
    primary: "#0A1F3D", // Very dark blue-tinted - primary surfaces
    secondary: "#1A2E47", // Dark slate with blue shift - secondary surfaces
    tertiary: "#2D4563", // Medium dark with blue tint - tertiary surfaces
    overlay: "#1A1F4B", // Dark blue-tinted overlay
  },

  // ============== BRAND COLORS ==============
  brand: {
    primary: "#A78BFA", // Violet 400 (lighter in dark mode)
    primaryLight: "#C4B5FD", // Violet 300
    primaryDark: "#7C3AED", // Violet 600
    secondary: "#60A5FA", // Blue 400
    accent: "#F472B6", // Pink 400
  },

  // ============== SEMANTIC COLORS ==============
  semantic: {
    success: "#34D399", // Emerald 400
    warning: "#FBBF24", // Amber 400
    error: "#F87171", // Red 400
    info: "#22D3EE", // Cyan 400
  },

  // ============== TEXT COLORS ==============
  text: {
    primary: "#F8FAFC", // Off-white - main text
    secondary: "#CBD5E1", // Light gray - secondary text
    tertiary: "#94A3B8", // Medium gray - tertiary text
    disabled: "#475569", // Disabled text
    contrast: "#0F172A", // Text on colored surfaces
  },

  // ============== BORDER & DIVIDER ==============
  border: {
    primary: "rgba(139, 169, 255, 0.28)", // Blue-tinted border
    secondary: "rgba(248, 250, 252, 0.12)", // Gray-blue tint
    subtle: "rgba(45, 69, 99, 0.5)", // Subtle blue-dark
  },

  // ============== SHADOWS ==============
  shadow: {
    sm: "rgba(0, 0, 0, 0.2)",
    md: "rgba(0, 0, 0, 0.3)",
    lg: "rgba(0, 0, 0, 0.4)",
    xl: "rgba(0, 0, 0, 0.5)",
  },
};

export interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  theme: typeof LIGHT_THEME | typeof DARK_THEME;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme preference from Firebase
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth?.currentUser;

        if (user) {
          const db = getFirebaseDb();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const savedMode = userDoc.data()?.themeMode as ThemeMode | undefined;
          if (savedMode) {
            setModeState(savedMode);
          }
        }
      } catch (error) {
        console.warn("Failed to load theme preference:", error);
      } finally {
        setLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Determine if dark mode based on preference
  useEffect(() => {
    if (mode === "dark") {
      setIsDark(true);
      return;
    }
    if (mode === "light") {
      setIsDark(false);
      return;
    }
    setIsDark(systemColorScheme === "dark");
  }, [mode, systemColorScheme]);

  // Save theme preference to Firebase
  const setMode = useCallback(async (newMode: ThemeMode) => {
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;

      if (user) {
        const db = getFirebaseDb();
        await setDoc(
          doc(db, "users", user.uid),
          { themeMode: newMode, updatedAt: new Date() },
          { merge: true },
        );
      }

      setModeState(newMode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      throw error;
    }
  }, []);

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
