/**
 * 🎨 Styled Components - Theme-Aware UI Components
 * Senior design engineering - Reusable components with full theme support
 */

import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { useTheme } from "@/theme/themeProvider";
import React from "react";
import {
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from "react-native";

// ============== CARD COMPONENT ==============
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "elevated" | "outlined" | "filled";
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "elevated",
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  const Component = onPress ? TouchableOpacity : View;

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: theme.border.primary,
          backgroundColor: theme.surface.primary,
        };
      case "filled":
        return {
          backgroundColor: isDark
            ? theme.surface.secondary
            : theme.surface.secondary,
          borderWidth: 0,
        };
      case "elevated":
      default:
        return {
          backgroundColor: theme.surface.primary,
          borderWidth: 1,
          borderColor: theme.border.secondary,
          shadowColor: theme.shadow.md,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
    }
  };

  return (
    <Component
      style={[
        {
          borderRadius: BorderRadius.card,
          overflow: "hidden",
          ...getCardStyle(),
          padding: Spacing.lg,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
};

// ============== BUTTON COMPONENT ==============
interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.surface.secondary,
          borderWidth: 1,
          borderColor: theme.border.primary,
        };
      case "tertiary":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.border.primary,
        };
      case "destructive":
        return {
          backgroundColor: theme.semantic.error,
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.brand.primary,
        };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.button,
        };
      case "lg":
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          borderRadius: BorderRadius.button,
        };
      case "md":
      default:
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderRadius: BorderRadius.button,
        };
    }
  };

  const textColor =
    variant === "primary" || variant === "destructive"
      ? theme.text.contrast
      : theme.text.primary;

  return (
    <TouchableOpacity
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          ...getButtonStyle(),
          ...getSizeStyle(),
        },
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          style={{
            color: textColor,
            fontSize: Typography.fontSize.md,
            fontWeight: "600",
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// ============== TEXT COMPONENT ==============
interface ThemedTextProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "disabled";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  style?: TextStyle;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = "primary",
  size = "md",
  weight = "normal",
  style,
}) => {
  const { theme } = useTheme();

  const textColor = {
    primary: theme.text.primary,
    secondary: theme.text.secondary,
    tertiary: theme.text.tertiary,
    disabled: theme.text.disabled,
  }[variant];

  const fontSize = {
    xs: Typography.fontSize.xs,
    sm: Typography.fontSize.sm,
    md: Typography.fontSize.md,
    lg: Typography.fontSize.lg,
    xl: Typography.fontSize.xl,
    "2xl": 28,
  }[size];

  const fontWeight = {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  }[weight] as TextStyle["fontWeight"];

  return (
    <Text
      style={[
        {
          color: textColor,
          fontSize,
          fontWeight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ============== SECTION COMPONENT ==============
interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({ title, children, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[{ marginBottom: Spacing.xl }, style]}>
      {title && (
        <ThemedText
          variant="secondary"
          size="sm"
          weight="semibold"
          style={{
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: Spacing.md,
            marginLeft: Spacing.sm,
          }}
        >
          {title}
        </ThemedText>
      )}
      <Card>{children}</Card>
    </View>
  );
};

// ============== SURFACE COMPONENT ==============
interface SurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle;
  level?: "primary" | "secondary" | "tertiary";
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  style,
  level = "primary",
}) => {
  const { theme } = useTheme();

  const backgroundColor = {
    primary: theme.surface.primary,
    secondary: theme.surface.secondary,
    tertiary: theme.surface.tertiary,
  }[level];

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: BorderRadius.card,
          padding: Spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
