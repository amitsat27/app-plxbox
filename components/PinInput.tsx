import React, { useRef } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BorderRadius, Spacing } from "../constants/designTokens";
import { Colors } from "../theme/color";

interface PinInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  isDark: boolean;
  error?: boolean;
}

const PinInput: React.FC<PinInputProps> = ({
  value,
  onChangeText,
  editable = true,
  isDark,
  error = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const pinArray = value.split("").concat(Array(6 - value.length).fill(""));

  const handleChange = (text: string) => {
    // Only allow numbers and max 6 digits
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    onChangeText(numericText);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => inputRef.current?.focus()}
      activeOpacity={1}
    >
      <View style={styles.pinBoxesContainer}>
        {pinArray.map((digit: string, index: number) => (
          <View
            key={index}
            style={[
              styles.pinBox,
              {
                borderColor: error
                  ? Colors.error
                  : digit
                    ? Colors.primary
                    : isDark
                      ? Colors.borderDark
                      : Colors.border,
                backgroundColor: isDark
                  ? "rgba(44,44,46,0.6)"
                  : "rgba(243,243,245,0.6)",
              },
            ]}
          >
            {digit && <Text style={styles.pinBoxText}>•</Text>}
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry={false}
        editable={editable}
        autoComplete="off"
        textContentType="none"
        placeholder=""
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  pinBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  pinBox: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  pinBoxText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
  },
});

export default PinInput;
