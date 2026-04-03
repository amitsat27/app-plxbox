import "react-native";

declare module "react-native" {
  interface ViewProps {
    style?: any;
  }
  interface TextInputProps {
    style?: any;
  }
  interface SafeAreaViewProps {
    style?: any;
  }
}
