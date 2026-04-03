declare module "expo-blur" {
  import { ReactNode } from "react";
    import { ViewProps } from "react-native";

  export interface BlurViewProps extends ViewProps {
    intensity?: number;
    tint?: "light" | "dark" | "default";
    children?: ReactNode;
  }

  export const BlurView: React.FC<BlurViewProps>;
}

declare module "expo-haptics" {
  export const NotificationFeedbackType: {
    Success: "Success";
    Warning: "Warning";
    Error: "Error";
  };

  export const ImpactFeedbackStyle: {
    Light: "Light";
    Medium: "Medium";
    Heavy: "Heavy";
    Rigid: "Rigid";
    Soft: "Soft";
  };

  export function selectionAsync(): Promise<void>;
  export function notificationAsync(type: string): Promise<void>;
  export function impactAsync(style: string): Promise<void>;
}
