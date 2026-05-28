import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/src/constants/theme";
import { useRouter } from "expo-router";

interface Props {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  onBack?: () => void;
  style?: ViewStyle;
}

export default function ScreenHeader({ title, showBack = true, right, onBack, style }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.row, style]}>
      {showBack ? (
        <TouchableOpacity
          testID="header-back"
          onPress={onBack ?? (() => router.back())}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconBtn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
