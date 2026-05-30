import React from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";
import { useResponsive } from "@/src/hooks/useResponsive";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fill?: boolean;
}

export default function ScreenContainer({ children, style, fill = true }: Props) {
  const { contentMaxWidth, isNative } = useResponsive();
  const constrainWidth = Platform.OS === "web" && !isNative;

  return (
    <View
      style={[
        fill && { flex: 1, width: "100%" },
        constrainWidth && { maxWidth: contentMaxWidth, alignSelf: "center" },
        { width: "100%" },
        style,
      ]}
    >
      {children}
    </View>
  );
}
