import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, RADIUS } from "@/src/constants/theme";

type Variant = "primary" | "secondary" | "ghost";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export default function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  fullWidth = true,
  style,
  textStyle,
  testID,
  icon,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        fullWidth && styles.full,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : COLORS.primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variant === "primary" && styles.textPrimary,
              variant === "secondary" && styles.textSecondary,
              variant === "ghost" && styles.textGhost,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  full: { width: "100%" },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: "600" },
  textPrimary: { color: "#FFF" },
  textSecondary: { color: COLORS.textPrimary },
  textGhost: { color: COLORS.primary },
});
