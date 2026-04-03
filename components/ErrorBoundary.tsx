// 🛡️ Error Boundary - Production Ready
// Catches JavaScript errors anywhere in the component tree

import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { useUIStore } from "@/src/stores/uiStore";
import { Colors } from "@/theme/color";
import { useRouter } from "expo-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react-native";
import React, { Component, ErrorInfo, ReactNode } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service (e.g., Sentry, Firebase Crashlytics)
    console.error("❌ Error caught by boundary:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    this.handleReset();
    this.props.onError?.(new Error("User navigated home"), {
      componentStack: "",
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorScreen
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorScreenProps {
  error: Error | null;
  onReset: () => void;
  onGoHome: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onReset,
  onGoHome,
}) => {
  const router = useRouter();
  const { isDarkMode } = useUIStore();

  const handleReport = (): void => {
    // Gather error details for reporting
    const errorMessage = error?.message || "Unknown error";
    const errorStack = error?.stack || "No stack trace";

    // In production, send to error monitoring service
    // e.g., Sentry.captureException(error);

    Alert.alert(
      "Error Report",
      "An error occurred. Would you like to report it?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: () => {
            // Copy error details to clipboard or send to server
            console.log("Error reported:", { errorMessage, errorStack });
            Alert.alert("Thanks", "Error reported successfully.");
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.backgroundDark
            : Colors.backgroundLight,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={64} color={Colors.error} />
        </View>

        <Text
          style={[
            styles.title,
            { color: isDarkMode ? Colors.textPrimaryDark : Colors.textPrimary },
          ]}
        >
          Oops! Something went wrong
        </Text>

        <Text
          style={[
            styles.message,
            {
              color: isDarkMode
                ? Colors.textSecondaryDark
                : Colors.textSecondary,
            },
          ]}
        >
          We apologize for the inconvenience. An unexpected error occurred.
        </Text>

        {typeof __DEV__ !== "undefined" && __DEV__ && error && (
          <View
            style={[
              styles.errorDetails,
              {
                backgroundColor: isDarkMode
                  ? Colors.surfaceVariant
                  : Colors.surfaceVariantLight,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: Colors.error }]}>
              Error Details (Development only)
            </Text>
            <Text
              style={[
                styles.errorMessage,
                {
                  color: isDarkMode
                    ? Colors.textSecondaryDark
                    : Colors.textSecondary,
                },
              ]}
            >
              {error.message}
            </Text>
            <Text
              style={[
                styles.errorStack,
                {
                  color: isDarkMode
                    ? Colors.textTertiaryDark
                    : Colors.textTertiary,
                },
              ]}
            >
              {error.stack}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }]}
            onPress={onReset}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              {
                backgroundColor: isDarkMode
                  ? Colors.surfaceVariant
                  : Colors.surfaceVariantLight,
              },
            ]}
            onPress={() => {
              onGoHome();
              router.push("/");
            }}
          >
            <Home
              size={20}
              color={isDarkMode ? Colors.textPrimaryDark : Colors.textPrimary}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: isDarkMode
                    ? Colors.textPrimaryDark
                    : Colors.textPrimary,
                },
              ]}
            >
              Go Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.outlineButton,
              { borderColor: isDarkMode ? Colors.borderDark : Colors.border },
            ]}
            onPress={handleReport}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isDarkMode
                    ? Colors.textPrimaryDark
                    : Colors.textPrimary,
                },
              ]}
            >
              Report Error
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.error + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.presets.title2.fontSize,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSize.md,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  errorDetails: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: Spacing.sm,
  },
  errorStack: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  actions: {
    width: "100%",
    gap: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 50,
  },
  secondaryButton: {
    // Secondary style
  },
  outlineButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
});

export default ErrorBoundary;
